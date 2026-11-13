"""
Controlled Architecture Ablation Experiment for MASTER AI CORE v1.0.

Compares matched ~5M-parameter original architectures trained from scratch on identical
Stage 1+2 training tokens, seed, batch size, optimizer, and LR schedule:
  A) v0.6-style Block: LayerNorm + Learned Absolute PosEmb + GELU FFN + MHA (kv_heads=n_heads)
  B) v1.0 Intermediate: RMSNorm + RoPE + SwiGLU + MHA (kv_heads=n_heads)
  C) v1.0 Full Block:   RMSNorm + RoPE + SwiGLU + GQA (kv_heads=2)

Evaluates identical held-out validation loss, validation perplexity, training tok/s,
and autoregressive KV-cache speed, writing `models/master-ai-core-v1/ablation_report.json`.
"""

import argparse
import gc
import json
import math
import random
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

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


def build_token_windows(jsonl_paths: List[Path], tok: MasterAiTokenizerV1, seq_len: int = 256) -> List[List[int]]:
    stream: List[int] = []
    for p in jsonl_paths:
        if not p.exists():
            continue
        with p.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                ids = tok.encode(rec["formatted_text"], add_bos=False, add_eos=False)
                if len(ids) >= 8:
                    stream.extend(ids)
    # Chunk into overlapping (train) or non-overlapping windows of seq_len + 1
    windows: List[List[int]] = []
    stride = max(64, seq_len)
    for start in range(0, max(0, len(stream) - (seq_len + 1)), stride):
        windows.append(stream[start : start + seq_len + 1])
    if not windows and len(stream) > 16:
        padded = (stream + [tok.PAD_ID] * (seq_len + 1))[: seq_len + 1]
        windows.append(padded)
    return windows


def evaluate_val_loss(model: MasterAiV1, val_windows: List[List[int]], pad_id: int, max_batches: int = 24) -> Dict[str, float]:
    model.eval()
    total_loss = 0.0
    total_tok = 0
    with torch.no_grad():
        for start in range(0, min(len(val_windows), max_batches * 2), 1):
            batch = val_windows[start : start + 1]
            t = torch.tensor(batch, dtype=torch.long)
            x, y = t[:, :-1], t[:, 1:]
            logits, _ = model(x, use_cache=False)
            loss = F.cross_entropy(
                logits.reshape(-1, logits.shape[-1]),
                y.reshape(-1),
                ignore_index=pad_id,
                reduction="sum",
            )
            n = int((y != pad_id).sum().item())
            total_loss += float(loss.item())
            total_tok += n
    avg_loss = total_loss / max(1, total_tok)
    return {
        "val_loss": round(avg_loss, 4),
        "val_perplexity": round(math.exp(min(20.0, avg_loss)), 2),
        "val_tokens_evaluated": total_tok,
    }


def run_single_variant(
    name: str,
    cfg: MasterAiV1Config,
    train_windows: List[List[int]],
    val_windows: List[List[int]],
    pad_id: int,
    steps: int = 50,
    batch_size: int = 4,
) -> Dict[str, Any]:
    random.seed(42)
    torch.manual_seed(42)
    gc.collect()

    model = MasterAiV1(cfg)
    params = model.count_parameters()
    opt = torch.optim.AdamW(model.parameters(), lr=6e-4, weight_decay=0.05)

    # Initial untrained baseline val loss
    init_eval = evaluate_val_loss(model, val_windows, pad_id)

    t0 = time.perf_counter()
    model.train()
    train_losses: List[float] = []
    idx = 0
    order = list(range(len(train_windows)))
    random.shuffle(order)

    # Micro-batch=1 with grad_accum=batch_size cuts peak activation RAM 4x
    for step in range(steps):
        opt.zero_grad(set_to_none=True)
        step_loss = 0.0
        for _ in range(batch_size):
            if idx >= len(order):
                random.shuffle(order)
                idx = 0
            chosen = [train_windows[order[idx]]]
            idx += 1
            t = torch.tensor(chosen, dtype=torch.long)
            x, y = t[:, :-1], t[:, 1:]
            loss_val = memory_efficient_lm_loss_backward(model, x, y, ignore_index=pad_id, grad_scale=1.0 / batch_size, chunk_tokens=32)
            step_loss += loss_val / batch_size
            del t, x, y
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        train_losses.append(step_loss)

    elapsed = time.perf_counter() - t0
    final_eval = evaluate_val_loss(model, val_windows, pad_id)

    # Measure inference tok/s
    t_inf0 = time.perf_counter()
    _ = model.generate(list(range(12, 44)), max_new_tokens=24, temperature=0.0, use_kv_cache=True)
    inf_dt = time.perf_counter() - t_inf0

    out = {
        "variant": name,
        "exact_params": params,
        "architecture": {
            "norm_type": cfg.norm_type,
            "pos_encoding": cfg.pos_encoding,
            "ffn_type": cfg.ffn_type,
            "n_heads": cfg.n_heads,
            "n_kv_heads": cfg.n_kv_heads,
        },
        "steps": steps,
        "init_val_loss": init_eval["val_loss"],
        "final_train_loss_last5": round(sum(train_losses[-5:]) / max(1, len(train_losses[-5:])), 4),
        "final_val_loss": final_eval["val_loss"],
        "final_val_perplexity": final_eval["val_perplexity"],
        "val_loss_reduction": round(init_eval["val_loss"] - final_eval["val_loss"], 4),
        "train_elapsed_sec": round(elapsed, 2),
        "infer_kv_tok_s": round(24.0 / max(1e-6, inf_dt), 1),
    }
    del model, opt
    gc.collect()
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="MASTER AI v1.0 Controlled Ablation")
    parser.add_argument("--variant-idx", type=int, default=-1, help="Run a single variant cleanly in its own OS commit space")
    args = parser.parse_args()

    out_path = OUT_DIR / "ablation_report.json"

    if args.variant_idx < 0:
        results = []
        for idx in range(3):
            subprocess.run([sys.executable, str(Path(__file__).resolve()), "--variant-idx", str(idx)], check=True)
        existing = json.loads(out_path.read_text(encoding="utf-8"))
        results = existing.get("variants", [])
        best = min(results, key=lambda r: r["final_val_loss"])
        existing["best_variant"] = best["variant"]
        out_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Saved complete ablation report -> {out_path} (best={best['variant']})")
        return

    tok = MasterAiTokenizerV1()
    tok.load(str(TOK_PATH))
    V = tok.vocab_size

    train_windows = build_token_windows(
        [CORPUS_DIR / "stage1_train.jsonl", CORPUS_DIR / "stage2_train.jsonl"], tok, seq_len=128
    )
    val_windows = build_token_windows(
        [CORPUS_DIR / "stage1_val.jsonl", CORPUS_DIR / "stage2_val.jsonl"], tok, seq_len=128
    )
    if args.variant_idx == 0:
        print(f"Ablation windows: train={len(train_windows)}, val={len(val_windows)}, vocab={V}")

    # Matched ~5M parameter budget across variants (GELU d_ff=1152 matches SwiGLU 3-proj d_ff=768)
    variants = [
        (
            "baseline_v06_blocks (LayerNorm+AbsPos+GELU+MHA)",
            MasterAiV1Config(
                vocab_size=V, d_model=256, n_layers=4, n_heads=4, n_kv_heads=4, d_ff=1152,
                max_seq_len=128, dropout=0.10, norm_type="layernorm", pos_encoding="learned_abs", ffn_type="gelu",
                use_grad_checkpoint=True,
            ),
        ),
        (
            "v1_rmsnorm_rope_swiglu_mha",
            MasterAiV1Config(
                vocab_size=V, d_model=256, n_layers=4, n_heads=4, n_kv_heads=4, d_ff=768,
                max_seq_len=128, dropout=0.10, norm_type="rmsnorm", pos_encoding="rope", ffn_type="swiglu",
                use_grad_checkpoint=True,
            ),
        ),
        (
            "v1_full (RMSNorm+RoPE+SwiGLU+GQA2)",
            MasterAiV1Config(
                vocab_size=V, d_model=256, n_layers=4, n_heads=4, n_kv_heads=2, d_ff=768,
                max_seq_len=128, dropout=0.10, norm_type="rmsnorm", pos_encoding="rope", ffn_type="swiglu",
                use_grad_checkpoint=True,
            ),
        ),
    ]

    name, cfg = variants[args.variant_idx]
    r = run_single_variant(name, cfg, train_windows, val_windows, tok.PAD_ID, steps=40, batch_size=4)
    print(
        f"  {r['variant'][:46]:46s} | params={r['exact_params']:,} | "
        f"val_loss={r['final_val_loss']:.4f} (ppl={r['final_val_perplexity']:.2f}) | "
        f"KV={r['infer_kv_tok_s']} tok/s"
    )
    if not out_path.exists():
        results = [r]
    else:
        prev = json.loads(out_path.read_text(encoding="utf-8"))
        results = [v for v in prev.get("variants", []) if v["variant"] != r["variant"]] + [r]

    report = {
        "version": "1.0-controlled-ablation",
        "seed": 42,
        "steps_per_variant": 40,
        "seq_len": 128,
        "vocab_size": V,
        "variants": results,
        "best_variant": min(results, key=lambda item: item["final_val_loss"])["variant"],
    }
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
