"""
MASTER CLOUD — MASTER AI ORIGINAL
Original ONNX Export Pipeline for In-Browser / ONNX Runtime Execution.

Exports the trained MasterAiCore PyTorch model to standard ONNX graph
with dynamic sequence length axes for browser-native execution.
"""

import os
import sys
import json
import torch
import onnx
import onnxruntime as ort

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.model import MasterAiConfig, MasterAiCore
from training.tokenizer import MasterAiTokenizer


def export_model_to_onnx(
    checkpoint_dir: str = "models/master-ai-core",
    onnx_filename: str = "master_ai_core.onnx",
):
    print("=" * 60)
    print(" MASTER CLOUD — EXPORTING MASTER AI CORE TO ONNX")
    print("=" * 60)

    config_path = os.path.join(checkpoint_dir, "config.json")
    checkpoint_path = os.path.join(checkpoint_dir, "checkpoint_best.pt")
    output_path = os.path.join(checkpoint_dir, onnx_filename)

    if not os.path.exists(config_path) or not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Missing config or checkpoint in {checkpoint_dir}")

    # 1. Load config
    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)
    config = MasterAiConfig(**config_dict)

    # 2. Instantiate model and load trained state
    print(f"[*] Loading trained weights from {checkpoint_path}...")
    model = MasterAiCore(config)
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # 3. Create dummy input with sequence length 8
    dummy_input = torch.tensor([[2, 10, 25, 45, 12, 80, 5, 3]], dtype=torch.long)

    # 4. Export to ONNX
    print(f"[*] Exporting graph to {output_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input_ids"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "logits": {0: "batch_size", 1: "sequence_length"},
        },
    )

    # 5. Verify exported ONNX model
    print("[*] Validating exported ONNX graph...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  ✓ Model verified! Graph is valid. File size: {file_size_mb:.2f} MB")

    # 6. Test forward pass with onnxruntime
    print("[*] Testing forward pass with onnxruntime...")
    session = ort.InferenceSession(output_path)
    ort_inputs = {"input_ids": dummy_input.numpy()}
    ort_outputs = session.run(None, ort_inputs)
    logits = ort_outputs[0]
    print(f"  ✓ Output logits shape: {logits.shape} (batch, seq, vocab)")

    print("\n[SUCCESS] MasterAiCore is fully exported and ready for browser deployment!")
    return output_path


if __name__ == "__main__":
    export_model_to_onnx()
