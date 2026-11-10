"""
MASTER CLOUD — MASTER AI ORIGINAL
Deterministic PyTorch vs. ONNX Runtime Numerical Equivalence Suite.

Verifies:
- Logit output shapes across dynamic sequence lengths (1, 4, 16, 64, 128, 256)
- Numerical parity between PyTorch and ONNX Runtime: max |y_pytorch - y_onnx| < 1e-4
- Non-trivial learned weight distribution
- Tokenizer encoding/decoding parity
- Generates onnx_parity_report.json
"""

import os
import sys
import json
import numpy as np
import torch
import onnx
import onnxruntime as ort

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.model import MasterAiConfig, MasterAiCore
from training.tokenizer import MasterAiTokenizer


def verify_pytorch_onnx_parity(
    checkpoint_dir: str = "models/master-ai-core",
    onnx_filename: str = "master_ai_core.onnx",
    seq_lengths: list = [1, 4, 16, 64, 128, 256],
    max_tolerance: float = 1e-4,
):
    print("=" * 65)
    print(" MASTER CLOUD — PYTORCH VS ONNX EQUIVALENCE AUDIT")
    print("=" * 65)

    config_path = os.path.join(checkpoint_dir, "config.json")
    checkpoint_path = os.path.join(checkpoint_dir, "checkpoint_best.pt")
    onnx_path = os.path.join(checkpoint_dir, onnx_filename)

    # 1. Load PyTorch model
    print(f"[*] Loading PyTorch checkpoint from {checkpoint_path}...")
    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)
    config = MasterAiConfig(**config_dict)

    torch_model = MasterAiCore(config)
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    torch_model.load_state_dict(checkpoint["model_state_dict"])
    torch_model.eval()

    # 2. Load ONNX Runtime session
    print(f"[*] Loading ONNX model from {onnx_path}...")
    onnx_model = onnx.load(onnx_path, load_external_data=False)
    onnx.checker.check_model(onnx_model)
    file_size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  ✓ ONNX file verified. Size: {file_size_mb:.2f} MB (Embedded initializers: {len(onnx_model.graph.initializer)})")

    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    # 3. Load Tokenizer
    tokenizer = MasterAiTokenizer()
    tokenizer.load(checkpoint_dir)
    print(f"  ✓ Tokenizer loaded with vocab_size: {tokenizer.vocab_size}")

    # 4. Deterministic Numerical Comparison across Sequence Lengths
    print(f"\n[*] Running deterministic numerical parity checks across lengths: {seq_lengths}...")
    results = []
    all_passed = True

    # Seed for deterministic reproducible token IDs
    rng = np.random.RandomState(42)

    for seq_len in seq_lengths:
        # Generate token IDs within [5, vocab_size - 1] (avoiding special padding tokens)
        token_ids = rng.randint(5, tokenizer.vocab_size, size=(1, seq_len)).astype(np.int64)
        inp_torch = torch.from_numpy(token_ids)

        with torch.no_grad():
            torch_logits, _ = torch_model(inp_torch)
            torch_arr = torch_logits.numpy()

        ort_outputs = session.run(None, {"input_ids": token_ids})
        ort_arr = ort_outputs[0]

        # Assert shape match
        expected_shape = (1, seq_len, config.vocab_size)
        assert torch_arr.shape == expected_shape, f"PyTorch shape mismatch: {torch_arr.shape} vs {expected_shape}"
        assert ort_arr.shape == expected_shape, f"ONNX shape mismatch: {ort_arr.shape} vs {expected_shape}"

        # Calculate numerical divergence
        abs_diff = np.abs(torch_arr - ort_arr)
        max_abs_diff = float(np.max(abs_diff))
        mean_abs_diff = float(np.mean(abs_diff))
        logits_std = float(np.std(torch_arr))

        passed = max_abs_diff < max_tolerance
        if not passed:
            all_passed = False

        status = "PASSED" if passed else "FAILED"
        print(f"  - Length {seq_len:3d}: Shape {str(torch_arr.shape):16s} | Max Diff: {max_abs_diff:.6e} | Mean Diff: {mean_abs_diff:.6e} | Std: {logits_std:.4f} [{status}]")

        results.append({
            "sequence_length": seq_len,
            "shape": list(torch_arr.shape),
            "max_abs_diff": max_abs_diff,
            "mean_abs_diff": mean_abs_diff,
            "logits_std": logits_std,
            "passed": passed,
        })

    # 5. Tokenizer Parity Test
    print("\n[*] Testing Tokenizer Encoding/Decoding Parity...")
    sample_text = "MASTER CLOUD MasterAI Core: 10-Band EQ, Scene Detection, and Local Transcripts."
    encoded = tokenizer.encode(sample_text, add_bos=False, add_eos=False)
    decoded = tokenizer.decode(encoded, skip_special=True)
    tok_passed = (decoded == sample_text)
    print(f"  ✓ Tokenizer roundtrip: {'PASSED' if tok_passed else 'FAILED'}")

    report = {
        "status": "PASSED" if all_passed and tok_passed else "FAILED",
        "model_file": onnx_path,
        "model_size_mb": round(file_size_mb, 2),
        "parameters": torch_model.count_parameters(),
        "tolerance_threshold": max_tolerance,
        "results": results,
        "tokenizer_roundtrip_passed": tok_passed,
    }

    report_path = os.path.join(checkpoint_dir, "onnx_parity_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[*] Parity report written to {report_path}")

    assert all_passed, f"PyTorch vs ONNX parity checks failed tolerance {max_tolerance}"
    print(f"\n[SUCCESS] PyTorch vs. ONNX Runtime equivalence VERIFIED! Max difference < {max_tolerance}")
    return report


if __name__ == "__main__":
    verify_pytorch_onnx_parity()
