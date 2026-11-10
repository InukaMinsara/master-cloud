"""
MASTER CLOUD — MASTER AI ORIGINAL
Original ONNX Export Pipeline for In-Browser / ONNX Runtime Execution.

Exports the trained MasterAiCore PyTorch model to a single, self-contained ONNX graph
with 100% embedded weights (no external .data files), valid graph structure,
and dynamic sequence length axes for browser-native execution.
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
    print("=" * 65)
    print(" MASTER CLOUD — EXPORTING MASTER AI CORE TO SELF-CONTAINED ONNX")
    print("=" * 65)

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

    num_params = model.count_parameters()
    expected_weight_bytes = num_params * 4
    print(f"  ✓ Trainable parameters: {num_params:,} (Raw weight size: {expected_weight_bytes / (1024**2):.2f} MB)")

    # 3. Create dummy input with dynamic sequence length
    dummy_input = torch.tensor([[2, 10, 25, 45, 12, 80, 5, 3]], dtype=torch.long)

    # 4. Export to ONNX graph
    raw_export_path = os.path.join(checkpoint_dir, "_temp_raw_export.onnx")
    print(f"[*] Exporting graph via PyTorch ONNX exporter...")
    torch.onnx.export(
        model,
        dummy_input,
        raw_export_path,
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

    # 5. Embed ALL initializers directly inside a single .onnx protobuf
    print("[*] Consolidating all tensor initializers into single self-contained ONNX file...")
    onnx_model = onnx.load(raw_export_path, load_external_data=True)
    onnx.checker.check_model(onnx_model)
    onnx.save_model(onnx_model, output_path, save_as_external_data=False)

    # Clean up temporary export files
    if os.path.exists(raw_export_path):
        os.remove(raw_export_path)
    raw_data_file = raw_export_path + ".data"
    if os.path.exists(raw_data_file):
        os.remove(raw_data_file)
    old_data_file = output_path + ".data"
    if os.path.exists(old_data_file):
        os.remove(old_data_file)

    # 6. Verify single-file integrity and size
    onnx_final = onnx.load(output_path, load_external_data=False)
    onnx.checker.check_model(onnx_final)
    file_size_bytes = os.path.getsize(output_path)
    file_size_mb = file_size_bytes / (1024 * 1024)

    # Count initializers
    num_initializers = len(onnx_final.graph.initializer)
    external_initializers = [init.name for init in onnx_final.graph.initializer if init.data_location == onnx.TensorProto.EXTERNAL]

    print(f"  ✓ Validated ONNX graph! File size: {file_size_mb:.2f} MB ({file_size_bytes:,} bytes)")
    print(f"  ✓ Initializers count: {num_initializers} (External detached: {len(external_initializers)})")
    assert len(external_initializers) == 0, f"Error: Detached initializers found: {external_initializers}"
    assert file_size_mb > 15.0, f"Error: ONNX file size ({file_size_mb:.2f} MB) is smaller than expected weights!"

    # 7. Test inference with onnxruntime
    print("[*] Testing forward pass with onnxruntime...")
    session = ort.InferenceSession(output_path)
    ort_inputs = {"input_ids": dummy_input.numpy()}
    ort_outputs = session.run(None, ort_inputs)
    logits = ort_outputs[0]
    print(f"  ✓ Inference output logits shape: {logits.shape} (batch, seq, vocab)")

    print("\n[SUCCESS] MasterAiCore single-file ONNX export completed with 100% embedded weights!")
    return output_path


if __name__ == "__main__":
    export_model_to_onnx()
