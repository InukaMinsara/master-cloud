"""
Export MASTER AI CORE v1.0 to self-contained browser/desktop ONNX + verify PyTorch parity.

Outputs:
- models/master-ai-core-v1/master_ai_v1.onnx
- models/master-ai-core-v1/onnx_parity_report_v1.json
- public/models/master-ai-core-v1/master_ai_v1.onnx
- public/models/master-ai-core-v1/tokenizer_v1.json
- public/models/master-ai-core-v1/model_manifest_v1.json
"""

import hashlib
import json
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import onnxruntime as ort
import torch

torch.set_num_threads(1)
torch.backends.mkldnn.enabled = False

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from training.v1.model_v1 import MasterAiV1, MasterAiV1Config, MasterAiV1OnnxWrapper
from training.v1.tokenizer_v1 import MasterAiTokenizerV1

OUT_DIR = ROOT / "models" / "master-ai-core-v1"
PUBLIC_DIR = ROOT / "public" / "models" / "master-ai-core-v1"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    ckpt_path = OUT_DIR / "checkpoint_best_v1.pt"
    tok_path = OUT_DIR / "tokenizer_v1.json"
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Missing trained checkpoint: {ckpt_path}")

    ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=True)
    cfg = MasterAiV1Config.from_dict(ckpt["config"])
    cfg.use_grad_checkpoint = False

    model = MasterAiV1(cfg)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    n_params = model.count_parameters()

    wrapper = MasterAiV1OnnxWrapper(model)
    wrapper.eval()

    onnx_path = OUT_DIR / "master_ai_v1.onnx"
    dummy_in = torch.randint(0, cfg.vocab_size, (1, 16), dtype=torch.long)

    print(f"Exporting MasterAiV1 ({n_params:,} params) -> {onnx_path}")
    export_kwargs = dict(
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input_ids"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "seq_len"},
            "logits": {0: "batch_size", 1: "seq_len"},
        },
    )
    # PyTorch 2.x+: prefer single-file TorchScript exporter so Web ORT loads cleanly without .onnx.data
    try:
        torch.onnx.export(wrapper, (dummy_in,), str(onnx_path), dynamo=False, **export_kwargs)
    except TypeError:
        torch.onnx.export(wrapper, (dummy_in,), str(onnx_path), **export_kwargs)

    # Verify ONNX Parity across varying sequence lengths & real Sinhala/English/Mixed token inputs
    tok = MasterAiTokenizerV1()
    tok.load(str(tok_path))

    so = ort.SessionOptions()
    so.intra_op_num_threads = 1
    so.inter_op_num_threads = 1
    sess = ort.InferenceSession(str(onnx_path), sess_options=so, providers=["CPUExecutionProvider"])

    probe_texts = [
        "Hi! Explain bitrate simply.",
        "වීඩියෝ ගුණාත්මකභාවය වැඩි කරන්නේ කෙසේද?",
        "Machan, 720p video ekak 1080p walata Quality Boost karoth file size eka wenas wenawada?",
    ]
    parity_checks: List[Dict[str, Any]] = []
    max_diff_overall = 0.0
    all_argmax_match = True

    for seq_len in [8, 32, 128, 256]:
        ids = torch.randint(0, cfg.vocab_size, (1, seq_len), dtype=torch.long)
        with torch.no_grad():
            pt_logits = wrapper(ids).numpy()
        t0 = time.perf_counter()
        ort_logits = sess.run(["logits"], {"input_ids": ids.numpy()})[0]
        ort_ms = (time.perf_counter() - t0) * 1000.0
        max_abs = float(np.max(np.abs(pt_logits - ort_logits)))
        pt_top = int(np.argmax(pt_logits[0, -1]))
        ort_top = int(np.argmax(ort_logits[0, -1]))
        match = pt_top == ort_top
        max_diff_overall = max(max_diff_overall, max_abs)
        all_argmax_match = all_argmax_match and match
        parity_checks.append({
            "kind": f"random_seq_{seq_len}",
            "seq_len": seq_len,
            "max_abs_diff": round(max_abs, 7),
            "pt_next_token": pt_top,
            "ort_next_token": ort_top,
            "argmax_match": match,
            "ort_latency_ms": round(ort_ms, 2),
        })

    for idx, ptext in enumerate(probe_texts):
        prompt = tok.format_conversation_prompt([{"role": "user", "content": ptext}])
        tids = tok.encode(prompt)[: cfg.max_seq_len]
        ids = torch.tensor([tids], dtype=torch.long)
        with torch.no_grad():
            pt_logits = wrapper(ids).numpy()
        ort_logits = sess.run(["logits"], {"input_ids": ids.numpy()})[0]
        max_abs = float(np.max(np.abs(pt_logits - ort_logits)))
        pt_top = int(np.argmax(pt_logits[0, -1]))
        ort_top = int(np.argmax(ort_logits[0, -1]))
        match = pt_top == ort_top
        max_diff_overall = max(max_diff_overall, max_abs)
        all_argmax_match = all_argmax_match and match
        parity_checks.append({
            "kind": f"bilingual_probe_{idx}",
            "seq_len": len(tids),
            "max_abs_diff": round(max_abs, 7),
            "pt_next_token": pt_top,
            "ort_next_token": ort_top,
            "argmax_match": match,
        })

    passed = all_argmax_match and max_diff_overall < 1e-4

    # Copy artifacts to public/models/master-ai-core-v1 for real browser/Electron loading
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    pub_onnx = PUBLIC_DIR / "master_ai_v1.onnx"
    pub_tok = PUBLIC_DIR / "tokenizer_v1.json"
    shutil.copy2(onnx_path, pub_onnx)
    shutil.copy2(tok_path, pub_tok)

    onnx_size_mb = round(onnx_path.stat().st_size / (1024 * 1024), 2)
    manifest = {
        "model_name": "MASTER AI CORE v1.0",
        "version": "1.0.0-pilot",
        "architecture": f"{cfg.norm_type.upper()} + {cfg.pos_encoding.upper()} + {cfg.ffn_type.upper()} + GQA({cfg.n_heads}/{cfg.n_kv_heads})",
        "parameter_count": n_params,
        "vocab_size": cfg.vocab_size,
        "max_seq_len": cfg.max_seq_len,
        "onnx_size_mb": onnx_size_mb,
        "onnx_sha256": sha256_file(onnx_path),
        "tokenizer_sha256": sha256_file(tok_path),
        "special_tokens": {
            "pad": tok.PAD_ID,
            "unk": tok.UNK_ID,
            "bos": tok.BOS_ID,
            "eos": tok.EOS_ID,
            "system": tok.special_to_id["<|system|>"],
            "user": tok.special_to_id["<|user|>"],
            "assistant": tok.special_to_id["<|assistant|>"],
            "tool": tok.special_to_id["<|tool|>"],
            "tool_result": tok.special_to_id["<|tool_result|>"],
            "endturn": tok.special_to_id["<|endturn|>"],
        },
        "policy": "100% Original Neural Weights Trained From Scratch — Zero External LLMs",
    }
    (PUBLIC_DIR / "model_manifest_v1.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    parity_report = {
        "status": "PASSED" if passed else "FAILED",
        "max_abs_diff_overall": round(max_diff_overall, 7),
        "all_argmax_match": all_argmax_match,
        "onnx_size_mb": onnx_size_mb,
        "onnx_sha256": manifest["onnx_sha256"],
        "checks": parity_checks,
    }
    (OUT_DIR / "onnx_parity_report_v1.json").write_text(json.dumps(parity_report, indent=2), encoding="utf-8")

    print(f"ONNX Parity: {parity_report['status']} | max_abs_diff={max_diff_overall:.2e} | size={onnx_size_mb} MB")
    print(f"Published web assets -> {PUBLIC_DIR}")


if __name__ == "__main__":
    main()
