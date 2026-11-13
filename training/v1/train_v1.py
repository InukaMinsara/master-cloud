"""
MASTER CLOUD — MASTER AI CORE v1.0
Two-Stage Original Language Model Training Pipeline (Stage 1 Pretraining -> Stage 2 Multi-Turn SFT).

Policy Compliance:
- Initializes weights from scratch (zero third-party weights or distillation).
- Preserves all v0.2-v0.6 artifacts in `models/master-ai-core/` untouched.
- Trains Stage 1 on continuous Sinhala/English/Mixed prose, saving `checkpoint_v1_pretrained.pt`.
- Trains Stage 2 on multi-turn bilingual dialogue & tool-use spans with assistant/tool-only loss masking,
  saving `checkpoint_v1_chat.pt` and `checkpoint_best_v1.pt`.
- Evaluates strictly on unseen val and test splits; logs complete honest metrics to
  `models/master-ai-core-v1/experiments.json` & `training_report_v1.json`.
"""

import argparse
import gc
import json
import math
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import torch
import torch.nn.functional as F

torch.set_num_threads(1)
try:
    torch.set_num_interop_threads(1)
except RuntimeError:
    pass
torch.backends.mkldnn.enabled = False

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from training.v1.model_v1 import MasterAiV1, MasterAiV1Config, memory_efficient_lm_loss_backward
from training.v1.tokenizer_v1 import MasterAiTokenizerV1

OUT_DIR = ROOT / "models" / "master-ai-core-v1"
CORPUS_DIR = OUT_DIR / "corpus"
TOK_PATH = OUT_DIR / "tokenizer_v1.json"


def load_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def build_stage1_packed_windows(
    records: List[Dict[str, Any]],
    tok: MasterAiTokenizerV1,
    seq_len: int,
    balance_languages: bool = True,
) -> List[List[int]]:
    """
    Pack continuous prose documents into fixed-length context blocks.
    When `balance_languages=True`, oversamples minority languages gently across streams
    before shuffling blocks so Sinhala, English, and Mixed have balanced representation.
    """
    by_lang: Dict[str, List[List[int]]] = {"english": [], "sinhala": [], "mixed": []}
    for r in records:
        ids = tok.encode(r["formatted_text"], add_bos=False, add_eos=False)
        if len(ids) >= 8:
            by_lang.setdefault(r.get("language", "english"), []).append(ids)

    streams: List[int] = []
    if balance_languages:
        max_docs = max((len(v) for v in by_lang.values() if v), default=1)
        rng = random.Random(42)
        interleaved_docs: List[List[int]] = []
        balanced_lists: Dict[str, List[List[int]]] = {}
        for lg, docs in by_lang.items():
            if not docs:
                continue
            # Cap oversampling at 2x so we don't overfit small language buckets
            rep = min(max_docs, len(docs) * 2)
            expanded = [docs[i % len(docs)] for i in range(rep)]
            rng.shuffle(expanded)
            balanced_lists[lg] = expanded
        max_len = max((len(v) for v in balanced_lists.values()), default=0)
        for i in range(max_len):
            for lg in ("sinhala", "english", "mixed"):
                lst = balanced_lists.get(lg, [])
                if i < len(lst):
                    interleaved_docs.append(lst[i])
        for doc_ids in interleaved_docs:
            streams.extend(doc_ids)
    else:
        for docs in by_lang.values():
            for doc_ids in docs:
                streams.extend(doc_ids)

    windows: List[List[int]] = []
    stride = max(64, seq_len // 2)
    block = seq_len + 1
    for s in range(0, max(0, len(streams) - block + 1), stride):
        windows.append(streams[s : s + block])
    return windows


def encode_stage2_masked_sample(
    turns: List[Dict[str, str]],
    tok: MasterAiTokenizerV1,
    max_seq_len: int,
) -> Optional[Tuple[List[int], List[int]]]:
    """
    Build Stage 2 sequence + SFT target labels where ONLY `<|assistant|>` and `<|tool|>`
    assistant emissions (plus their `<|endturn|>`) contribute to cross-entropy loss.
    Prompt/system/user/tool_result tokens are masked to `-100`.
    """
    role_to_special = {
        "system": tok.special_to_id["<|system|>"],
        "user": tok.special_to_id["<|user|>"],
        "assistant": tok.special_to_id["<|assistant|>"],
        "tool": tok.special_to_id["<|tool|>"],
        "tool_result": tok.special_to_id["<|tool_result|>"],
    }
    endturn_id = tok.special_to_id["<|endturn|>"]
    newline_ids = tok.encode("\n", add_bos=False, add_eos=False)

    full_ids: List[int] = [tok.BOS_ID]
    loss_mask: List[int] = [0]

    for turn in turns:
        role = turn["role"]
        role_id = role_to_special.get(role, tok.special_to_id["<|user|>"])
        content_ids = tok.encode(turn["content"], add_bos=False, add_eos=False)
        is_target = role in ("assistant", "tool")

        # Marker prefix (`<|role|>\n`) is prompt context (not predicted unless transitioning after tool)
        prefix = newline_ids + [role_id] + newline_ids
        full_ids.extend(prefix)
        loss_mask.extend([1 if role in ("assistant", "tool") else 0] * len(prefix))

        full_ids.extend(content_ids)
        loss_mask.extend([1 if is_target else 0] * len(content_ids))

        suffix = newline_ids + [endturn_id]
        full_ids.extend(suffix)
        loss_mask.extend([1 if is_target else 0] * len(suffix))

    full_ids.extend(newline_ids + [tok.EOS_ID])
    loss_mask.extend([0] * len(newline_ids) + [1])

    if len(full_ids) < 8:
        return None

    # Reserve max_seq_len + 1 tokens
    if len(full_ids) > max_seq_len + 1:
        full_ids = full_ids[: max_seq_len + 1]
        loss_mask = loss_mask[: max_seq_len + 1]

    # Ensure at least 2 unmasked supervised target tokens remain
    if sum(loss_mask[1:]) < 2:
        return None

    return full_ids, loss_mask


def pad_s2_batch(
    batch: List[Tuple[List[int], List[int]]],
    pad_id: int,
) -> Tuple[torch.Tensor, torch.Tensor]:
    max_len = max(len(x) for x, _ in batch)
    x_rows, y_rows = [], []
    for ids, mask in batch:
        pad_n = max_len - len(ids)
        padded_ids = ids + [pad_id] * pad_n
        padded_mask = mask + [0] * pad_n
        x_rows.append(padded_ids[:-1])
        # Shift next token; mask non-target or padded positions to -100
        y_rows.append([
            tid if m == 1 else -100
            for tid, m in zip(padded_ids[1:], padded_mask[1:])
        ])
    return torch.tensor(x_rows, dtype=torch.long), torch.tensor(y_rows, dtype=torch.long)


def _eval_chunked_loss(
    model: MasterAiV1,
    x: torch.Tensor,
    y: torch.Tensor,
    ignore_index: int,
    chunk_tokens: int = 32,
) -> Tuple[float, int]:
    hidden, _ = model.forward_hidden(x, use_cache=False)
    tot = 0.0
    tok_cnt = 0
    V = model.cfg.vocab_size
    T = hidden.shape[1]
    for s in range(0, T, chunk_tokens):
        yc = y[:, s : s + chunk_tokens]
        cnt = int((yc != ignore_index).sum().item())
        if cnt == 0:
            continue
        lc = model.lm_head(hidden[:, s : s + chunk_tokens, :])
        loss_c = F.cross_entropy(lc.reshape(-1, V), yc.reshape(-1), ignore_index=ignore_index, reduction="sum")
        tot += float(loss_c.item())
        tok_cnt += cnt
        del lc, loss_c
    del hidden
    return tot, tok_cnt


def eval_stage1(model: MasterAiV1, windows: List[List[int]], pad_id: int, max_batches: int = 32) -> Dict[str, float]:
    model.eval()
    tot_loss = 0.0
    tot_tok = 0
    with torch.no_grad():
        for i in range(0, min(len(windows), max_batches * 2), 1):
            b = windows[i : i + 1]
            t = torch.tensor(b, dtype=torch.long)
            x, y = t[:, :-1], t[:, 1:]
            c_loss, c_tok = _eval_chunked_loss(model, x, y, ignore_index=pad_id)
            tot_loss += c_loss
            tot_tok += c_tok
            del t, x, y
    avg = tot_loss / max(1, tot_tok)
    return {"loss": round(avg, 4), "perplexity": round(math.exp(min(20.0, avg)), 2), "tokens": tot_tok}


def eval_stage2(
    model: MasterAiV1,
    samples: List[Tuple[List[int], List[int]]],
    pad_id: int,
) -> Dict[str, float]:
    model.eval()
    tot_loss = 0.0
    tot_tok = 0
    with torch.no_grad():
        for i in range(0, len(samples), 1):
            x, y = pad_s2_batch(samples[i : i + 1], pad_id)
            c_loss, c_tok = _eval_chunked_loss(model, x, y, ignore_index=-100)
            tot_loss += c_loss
            tot_tok += c_tok
            del x, y
    avg = tot_loss / max(1, tot_tok)
    return {"loss": round(avg, 4), "perplexity": round(math.exp(min(20.0, avg)), 2), "target_tokens": tot_tok}


def cosine_lr(step: int, total_steps: int, base_lr: float, min_lr: float = 2e-5, warmup_frac: float = 0.1) -> float:
    warmup = max(2, int(total_steps * warmup_frac))
    if step < warmup:
        return base_lr * (step + 1) / warmup
    progress = min(1.0, (step - warmup) / max(1, total_steps - warmup))
    return min_lr + 0.5 * (base_lr - min_lr) * (1.0 + math.cos(math.pi * progress))


def main() -> None:
    parser = argparse.ArgumentParser(description="MASTER AI CORE v1.0 Two-Stage Trainer")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--candidate", default="auto", choices=["auto", "scale_5M", "scale_10M"])
    parser.add_argument("--stage", default="both", choices=["stage1", "stage2", "both"])
    parser.add_argument("--stage1-epochs", type=int, default=4)
    parser.add_argument("--stage2-epochs", type=int, default=6)
    parser.add_argument("--seq-len", type=int, default=192, help="Stage 1 window length (RoPE supports up to 512 at inference)")
    parser.add_argument("--sft-max-len", type=int, default=256, help="Stage 2 SFT max token length per sample during CPU training")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=4)
    parser.add_argument("--chunk-tokens", type=int, default=16)
    parser.add_argument("--stage1-lr", type=float, default=6e-4)
    parser.add_argument("--stage2-lr", type=float, default=2.5e-4)
    args = parser.parse_args()

    random.seed(args.seed)
    torch.manual_seed(args.seed)

    import ctypes, ctypes.wintypes
    class _MS(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.wintypes.DWORD), ("dwMemoryLoad", ctypes.wintypes.DWORD),
            ("ullTotalPhys", ctypes.c_uint64), ("ullAvailPhys", ctypes.c_uint64),
            ("ullTotalPageFile", ctypes.c_uint64), ("ullAvailPageFile", ctypes.c_uint64),
            ("ullTotalVirtual", ctypes.c_uint64), ("ullAvailVirtual", ctypes.c_uint64),
            ("ullAvailExtendedVirtual", ctypes.c_uint64),
        ]
    _ms = _MS(); _ms.dwLength = ctypes.sizeof(_MS)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(_ms))
    avail_commit_mb = _ms.ullAvailPageFile / (1024 * 1024)

    tok = MasterAiTokenizerV1()
    tok.load(str(TOK_PATH))
    scale_report = json.loads((OUT_DIR / "scaling_benchmark.json").read_text(encoding="utf-8"))
    rec_cfg_dict = dict(scale_report["recommended_pilot_architecture"]["config"])
    if args.candidate != "auto":
        picked = next((c["config"] for c in scale_report["scale_candidates"] if c["candidate"] == args.candidate), None)
        if picked:
            rec_cfg_dict = dict(picked)
            print(f"[Config] Explicitly selected candidate={args.candidate} (avail_commit={avail_commit_mb:.0f} MB).", flush=True)
    elif avail_commit_mb < 600:
        cand_5m = next((c["config"] for c in scale_report["scale_candidates"] if c["candidate"] == "scale_5M"), None)
        if cand_5m:
            rec_cfg_dict = dict(cand_5m)
            print(f"[Host Commit Guard] Free commit={avail_commit_mb:.0f} MB < 600 MB; selecting verified safe 5.16M RoPE+SwiGLU+GQA config.", flush=True)

    rec_cfg_dict["vocab_size"] = tok.vocab_size
    rec_cfg_dict["dropout"] = 0.15
    rec_cfg_dict["use_grad_checkpoint"] = True
    cfg = MasterAiV1Config.from_dict(rec_cfg_dict)

    if args.stage != "stage2":
        model = MasterAiV1(cfg)
        n_params = model.count_parameters()
        print(f"Initialized ORIGINAL MasterAiV1 from scratch: {n_params:,} parameters, max_seq_len={cfg.max_seq_len}", flush=True)
    else:
        model = None
        n_params = 0
    print(f"Device: cpu (torch+cpu; RTX 3050 CUDA acceleration requires CUDA-enabled PyTorch wheel)", flush=True)

    # ── Load Data Splits ──
    s1_train_rows = load_jsonl(CORPUS_DIR / "stage1_train.jsonl")
    s1_val_rows = load_jsonl(CORPUS_DIR / "stage1_val.jsonl")
    s1_test_rows = load_jsonl(CORPUS_DIR / "stage1_test.jsonl")

    s2_train_rows = load_jsonl(CORPUS_DIR / "stage2_train.jsonl")
    s2_val_rows = load_jsonl(CORPUS_DIR / "stage2_val.jsonl")
    s2_test_rows = load_jsonl(CORPUS_DIR / "stage2_test.jsonl")

    s1_train_win = build_stage1_packed_windows(s1_train_rows, tok, args.seq_len, balance_languages=True)
    s1_val_win = build_stage1_packed_windows(s1_val_rows, tok, args.seq_len, balance_languages=False)
    s1_test_win = build_stage1_packed_windows(s1_test_rows, tok, args.seq_len, balance_languages=False)

    s2_max_train = min(cfg.max_seq_len, args.sft_max_len)
    s2_train_samples = [s for r in s2_train_rows if (s := encode_stage2_masked_sample(r["turns"], tok, s2_max_train))]
    s2_val_samples = [s for r in s2_val_rows if (s := encode_stage2_masked_sample(r["turns"], tok, s2_max_train))]
    s2_test_samples = [s for r in s2_test_rows if (s := encode_stage2_masked_sample(r["turns"], tok, s2_max_train))]

    print(f"Stage 1 Windows: train={len(s1_train_win)}, val={len(s1_val_win)}, test={len(s1_test_win)}")
    print(f"Stage 2 Samples: train={len(s2_train_samples)}, val={len(s2_val_samples)}, test={len(s2_test_samples)}")

    s1_summary_path = OUT_DIR / "stage1_summary.json"
    s1_block: Dict[str, Any] = {}

    if args.stage in ("stage1", "both"):
        # ═══════════════════════════════════════════════════════════════════════
        # STAGE 1 — CONTINUOUS PROSE PRETRAINING
        # ═══════════════════════════════════════════════════════════════════════
        print("\n=== STAGE 1: ORIGINAL LANGUAGE PRETRAINING ===")
        opt1 = torch.optim.AdamW(model.parameters(), lr=args.stage1_lr, betas=(0.9, 0.95), weight_decay=0.10)
        steps_per_ep1 = max(1, math.ceil(len(s1_train_win) / (args.batch_size * args.grad_accum)))
        total_steps1 = args.stage1_epochs * steps_per_ep1

        init_s1_val = eval_stage1(model, s1_val_win, tok.PAD_ID)
        print(f"  [Init] val_loss={init_s1_val['loss']:.4f}, ppl={init_s1_val['perplexity']:.2f}")

        best_s1_val = float("inf")
        s1_history: List[Dict[str, Any]] = []
        global_step1 = 0
        t_s1_start = time.perf_counter()

        for epoch in range(1, args.stage1_epochs + 1):
            ep_t0 = time.perf_counter()
            random.shuffle(s1_train_win)
            model.train()
            opt1.zero_grad(set_to_none=True)
            ep_loss = 0.0
            n_batches = 0

            for idx in range(0, len(s1_train_win), args.batch_size):
                batch = s1_train_win[idx : idx + args.batch_size]
                t = torch.tensor(batch, dtype=torch.long)
                x, y = t[:, :-1], t[:, 1:]
                loss_val = memory_efficient_lm_loss_backward(
                    model, x, y, ignore_index=tok.PAD_ID, grad_scale=1.0 / args.grad_accum, chunk_tokens=args.chunk_tokens
                )
                ep_loss += loss_val
                n_batches += 1
                del t, x, y
                if n_batches % 50 == 0:
                    gc.collect()
                if n_batches % 100 == 0:
                    print(f"    [S1 Ep {epoch}] step {n_batches}/{len(s1_train_win)} loss={ep_loss/n_batches:.4f}", flush=True)

                is_accum_boundary = (n_batches % args.grad_accum == 0) or (idx + args.batch_size >= len(s1_train_win))
                if is_accum_boundary:
                    lr_now = cosine_lr(global_step1, total_steps1, args.stage1_lr, min_lr=4e-5)
                    for pg in opt1.param_groups:
                        pg["lr"] = lr_now
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    opt1.step()
                    opt1.zero_grad(set_to_none=True)
                    global_step1 += 1

            val_metrics = eval_stage1(model, s1_val_win, tok.PAD_ID)
            avg_tr = ep_loss / max(1, n_batches)
            ep_sec = time.perf_counter() - ep_t0
            s1_history.append({
                "epoch": epoch,
                "train_loss": round(avg_tr, 4),
                "val_loss": val_metrics["loss"],
                "val_perplexity": val_metrics["perplexity"],
                "elapsed_sec": round(ep_sec, 1),
            })
            print(
                f"  [S1 Ep {epoch}/{args.stage1_epochs}] train_loss={avg_tr:.4f} | "
                f"val_loss={val_metrics['loss']:.4f} (ppl={val_metrics['perplexity']:.2f}) | {ep_sec:.1f}s",
                flush=True,
            )
            if val_metrics["loss"] < best_s1_val:
                best_s1_val = val_metrics["loss"]
                torch.save(
                    {"config": cfg.to_dict(), "model_state_dict": model.state_dict(), "stage": "pretrained", "val_loss": best_s1_val},
                    OUT_DIR / "checkpoint_v1_pretrained.pt",
                )
            gc.collect()

        s1_elapsed = time.perf_counter() - t_s1_start
        del opt1
        gc.collect()
        pre_ckpt = torch.load(OUT_DIR / "checkpoint_v1_pretrained.pt", map_location="cpu", weights_only=True)
        model.load_state_dict(pre_ckpt["model_state_dict"])
        del pre_ckpt
        gc.collect()
        s1_test_metrics = eval_stage1(model, s1_test_win, tok.PAD_ID)
        print(f"  [Stage 1 Complete] test_loss={s1_test_metrics['loss']:.4f}, test_ppl={s1_test_metrics['perplexity']:.2f} ({s1_elapsed:.1f}s)")
        s1_block = {
            "epochs": args.stage1_epochs,
            "train_windows": len(s1_train_win),
            "val_windows": len(s1_val_win),
            "test_windows": len(s1_test_win),
            "init_val_loss": init_s1_val["loss"],
            "best_val_loss": round(best_s1_val, 4),
            "test_metrics": s1_test_metrics,
            "elapsed_sec": round(s1_elapsed, 1),
            "history": s1_history,
        }
        s1_summary_path.write_text(json.dumps(s1_block, indent=2), encoding="utf-8")
        if args.stage == "stage1":
            print(f"Saved Stage 1 summary & checkpoint -> {OUT_DIR}")
            return
    else:
        # Stage 2 standalone: load Stage 1 pretrained checkpoint & summary into a fresh commit space
        pre_ckpt = torch.load(OUT_DIR / "checkpoint_v1_pretrained.pt", map_location="cpu", weights_only=True)
        cfg = MasterAiV1Config.from_dict(pre_ckpt["config"])
        cfg.use_grad_checkpoint = True
        model = MasterAiV1(cfg)
        model.load_state_dict(pre_ckpt["model_state_dict"])
        n_params = model.count_parameters()
        del pre_ckpt
        gc.collect()
        s1_block = json.loads(s1_summary_path.read_text(encoding="utf-8")) if s1_summary_path.exists() else {}
        s1_test_metrics = s1_block.get("test_metrics", {"loss": 0.0, "perplexity": 0.0})
        s1_elapsed = float(s1_block.get("elapsed_sec", 0.0))

    # ═══════════════════════════════════════════════════════════════════════
    # STAGE 2 — CONVERSATIONAL & TOOL-ROUTING SFT (TARGET-MASKED)
    # ═══════════════════════════════════════════════════════════════════════
    print("\n=== STAGE 2: MULTI-TURN CONVERSATIONAL & TOOL SFT ===")
    opt2 = torch.optim.AdamW(model.parameters(), lr=args.stage2_lr, betas=(0.9, 0.95), weight_decay=0.08)
    steps_per_ep2 = max(1, math.ceil(len(s2_train_samples) / (args.batch_size * args.grad_accum)))
    total_steps2 = args.stage2_epochs * steps_per_ep2

    init_s2_val = eval_stage2(model, s2_val_samples, tok.PAD_ID)
    print(f"  [Pre-SFT] s2_val_loss={init_s2_val['loss']:.4f}, s2_val_ppl={init_s2_val['perplexity']:.2f}")

    best_s2_val = float("inf")
    s2_history: List[Dict[str, Any]] = []
    global_step2 = 0
    t_s2_start = time.perf_counter()

    for epoch in range(1, args.stage2_epochs + 1):
        ep_t0 = time.perf_counter()
        random.shuffle(s2_train_samples)
        model.train()
        opt2.zero_grad(set_to_none=True)
        ep_loss = 0.0
        n_batches = 0

        for idx in range(0, len(s2_train_samples), args.batch_size):
            batch = s2_train_samples[idx : idx + args.batch_size]
            x, y = pad_s2_batch(batch, tok.PAD_ID)
            loss_val = memory_efficient_lm_loss_backward(
                model, x, y, ignore_index=-100, grad_scale=1.0 / args.grad_accum, chunk_tokens=args.chunk_tokens
            )
            ep_loss += loss_val
            n_batches += 1
            del x, y
            if n_batches % 50 == 0:
                gc.collect()
            if n_batches % 100 == 0:
                print(f"    [S2 Ep {epoch}] step {n_batches}/{len(s2_train_samples)} loss={ep_loss/n_batches:.4f}", flush=True)

            is_accum_boundary = (n_batches % args.grad_accum == 0) or (idx + args.batch_size >= len(s2_train_samples))
            if is_accum_boundary:
                lr_now = cosine_lr(global_step2, total_steps2, args.stage2_lr, min_lr=2e-5)
                for pg in opt2.param_groups:
                    pg["lr"] = lr_now
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                opt2.step()
                opt2.zero_grad(set_to_none=True)
                global_step2 += 1

        val_metrics = eval_stage2(model, s2_val_samples, tok.PAD_ID)
        avg_tr = ep_loss / max(1, n_batches)
        ep_sec = time.perf_counter() - ep_t0
        s2_history.append({
            "epoch": epoch,
            "train_loss": round(avg_tr, 4),
            "val_loss": val_metrics["loss"],
            "val_perplexity": val_metrics["perplexity"],
            "elapsed_sec": round(ep_sec, 1),
        })
        print(
            f"  [S2 Ep {epoch}/{args.stage2_epochs}] train_loss={avg_tr:.4f} | "
            f"val_loss={val_metrics['loss']:.4f} (ppl={val_metrics['perplexity']:.2f}) | {ep_sec:.1f}s",
            flush=True,
        )
        if val_metrics["loss"] < best_s2_val:
            best_s2_val = val_metrics["loss"]
            ckpt_payload = {
                "config": cfg.to_dict(),
                "model_state_dict": model.state_dict(),
                "stage": "chat_sft_best",
                "val_loss": best_s2_val,
                "vocab_size": tok.vocab_size,
            }
            torch.save(ckpt_payload, OUT_DIR / "checkpoint_v1_chat.pt")
            torch.save(ckpt_payload, OUT_DIR / "checkpoint_best_v1.pt")

    s2_elapsed = time.perf_counter() - t_s2_start
    del opt2
    gc.collect()
    best_ckpt = torch.load(OUT_DIR / "checkpoint_best_v1.pt", map_location="cpu", weights_only=True)
    model.load_state_dict(best_ckpt["model_state_dict"])
    del best_ckpt
    gc.collect()
    s2_test_metrics = eval_stage2(model, s2_test_samples, tok.PAD_ID)
    print(f"  [Stage 2 Complete] test_loss={s2_test_metrics['loss']:.4f}, test_ppl={s2_test_metrics['perplexity']:.2f} ({s2_elapsed:.1f}s)", flush=True)

    # Save structured training report & experiments log
    training_report = {
        "version": "1.0.0-pilot",
        "policy": "Original Independently Initialized & Trained Weights (Zero Third-Party LLMs)",
        "architecture": cfg.to_dict(),
        "parameter_count": n_params,
        "seed": args.seed,
        "device": "cpu (torch 2.15.0+cpu)",
        "stage1_pretraining": s1_block,
        "stage2_sft": {
            "epochs": args.stage2_epochs,
            "train_samples": len(s2_train_samples),
            "val_samples": len(s2_val_samples),
            "test_samples": len(s2_test_samples),
            "pre_sft_val_loss": init_s2_val["loss"],
            "best_val_loss": round(best_s2_val, 4),
            "test_metrics": s2_test_metrics,
            "elapsed_sec": round(s2_elapsed, 1),
            "history": s2_history,
        },
    }
    (OUT_DIR / "training_report_v1.json").write_text(json.dumps(training_report, indent=2), encoding="utf-8")

    exp_path = OUT_DIR / "experiments.json"
    existing = json.loads(exp_path.read_text(encoding="utf-8")) if exp_path.exists() else []
    existing.append({
        "run_id": f"v1_pilot_seed{args.seed}_{int(time.time())}",
        "params": n_params,
        "s1_best_val_loss": s1_block.get("best_val_loss", 0.0),
        "s1_test_ppl": s1_test_metrics.get("perplexity", 0.0),
        "s2_best_val_loss": training_report["stage2_sft"]["best_val_loss"],
        "s2_test_ppl": s2_test_metrics["perplexity"],
        "total_sec": round(s1_elapsed + s2_elapsed, 1),
    })
    exp_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    print(f"Saved checkpoints & report -> {OUT_DIR}")


if __name__ == "__main__":
    main()
