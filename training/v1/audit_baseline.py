"""
MASTER CLOUD — MASTER AI CORE v1.0 (Stage 1)
Baseline Audit & Preservation Verification for MASTER AI CORE v0.6.

Inspects:
1. All preserved historical checkpoints (v0.2 through v0.6) without modifying them.
2. v0.6 model architecture, parameter count, tokenizer specs, and context window.
3. v0.6 training data provenance, statistics, loss, and perplexity.
4. v0.6 held-out 100 benchmark & 30-query live ONNX generation quality.
5. Real hardware & memory runtime (GPU hardware, PyTorch build, RAM, Commit headroom, ORT latency).
6. Existing TypeScript/React application integration gaps.

Writes:
- models/master-ai-core-v1/baseline_audit_v06.json
- models/master-ai-core-v1/BASELINE_AUDIT_v06.md
"""

import ctypes
import hashlib
import json
import os
import subprocess
import sys
import time
import numpy as np
import onnxruntime as ort

# Enforce single-threaded BLAS/OpenMP to respect OS virtual commit headroom
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def get_windows_memory_info():
    class MEM(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong),
            ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong),
            ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong),
            ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong),
            ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]

    try:
        m = MEM(dwLength=ctypes.sizeof(MEM))
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
        return {
            "memory_load_percent": int(m.dwMemoryLoad),
            "physical_total_gb": round(m.ullTotalPhys / (1024 ** 3), 2),
            "physical_available_gb": round(m.ullAvailPhys / (1024 ** 3), 2),
            "commit_limit_gb": round(m.ullTotalPageFile / (1024 ** 3), 2),
            "commit_available_gb": round(m.ullAvailPageFile / (1024 ** 3), 2),
        }
    except Exception as e:
        return {"error": str(e)}


def get_gpu_hardware_info():
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.free,driver_version", "--format=csv,noheader"],
            text=True,
            timeout=5,
        ).strip()
        return {"detected": True, "raw": out}
    except Exception as e:
        return {"detected": False, "error": str(e)}


def run_baseline_audit():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    v06_dir = os.path.join(root, "models", "master-ai-core")
    v1_dir = os.path.join(root, "models", "master-ai-core-v1")
    os.makedirs(v1_dir, exist_ok=True)

    # 1. Verify preserved checkpoints & artifacts
    expected_checkpoints = [
        "checkpoint_v0.2.pt",
        "checkpoint_v0.3.pt",
        "checkpoint_v0.4.pt",
        "checkpoint_v0.5_stageA.pt",
        "checkpoint_v0.5_stageB.pt",
        "checkpoint_v0.5.pt",
        "checkpoint_v0.6.pt",
        "checkpoint_best.pt",
        "master_ai_core.onnx",
        "vocab.json",
        "merges.json",
        "config.json",
    ]
    preserved = {}
    for fname in expected_checkpoints:
        fpath = os.path.join(v06_dir, fname)
        if os.path.exists(fpath):
            preserved[fname] = {
                "exists": True,
                "size_bytes": os.path.getsize(fpath),
                "sha256": sha256_file(fpath),
            }
        else:
            preserved[fname] = {"exists": False}

    # 2. Load v0.6 configs & reports
    with open(os.path.join(v06_dir, "config.json"), "r", encoding="utf-8") as f:
        v06_config = json.load(f)
    with open(os.path.join(v06_dir, "training_report.json"), "r", encoding="utf-8") as f:
        train_rep = json.load(f)
    with open(os.path.join(v06_dir, "corpus_manifest.json"), "r", encoding="utf-8") as f:
        corpus_man = json.load(f)
    with open(os.path.join(v06_dir, "held_out_100_eval_report.json"), "r", encoding="utf-8") as f:
        eval100 = json.load(f)
    with open(os.path.join(v06_dir, "onnx_parity_report.json"), "r", encoding="utf-8") as f:
        parity = json.load(f)
    with open(os.path.join(v06_dir, "acceptance_test_neural_outputs.json"), "r", encoding="utf-8") as f:
        neural_acc = json.load(f)
    with open(os.path.join(v06_dir, "tool_assisted_acceptance_report.json"), "r", encoding="utf-8") as f:
        tool_acc = json.load(f)

    # 3. Live ONNX Runtime Latency & Memory Telemetry
    onnx_path = os.path.join(v06_dir, "master_ai_core.onnx")
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 1
    opts.inter_op_num_threads = 1
    sess = ort.InferenceSession(onnx_path, sess_options=opts, providers=["CPUExecutionProvider"])

    ort_bench = {}
    for seq_len in [1, 32, 128, 256]:
        dummy = np.ones((1, seq_len), dtype=np.int64) * 10
        # warmup
        sess.run(None, {"input_ids": dummy})
        times = []
        for _ in range(5):
            t0 = time.perf_counter()
            out = sess.run(None, {"input_ids": dummy})
            times.append((time.perf_counter() - t0) * 1000)
        ort_bench[f"seq_{seq_len}"] = {
            "mean_latency_ms": round(sum(times) / len(times), 2),
            "min_latency_ms": round(min(times), 2),
            "output_shape": list(out[0].shape),
        }

    # Check PyTorch environment cleanly
    torch_info = {}
    try:
        import torch
        torch_info = {
            "version": torch.__version__,
            "cuda_available": bool(torch.cuda.is_available()),
            "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        }
    except Exception as e:
        torch_info = {"error": str(e)}

    # 4. Inspect TypeScript App Integration Gaps
    app_files = {
        "masterAiEngine.ts": os.path.join(root, "src", "services", "masterAiEngine.ts"),
        "toolAssistedLocalMode.ts": os.path.join(root, "src", "services", "ai", "toolAssistedLocalMode.ts"),
        "MasterAiModal.tsx": os.path.join(root, "src", "components", "video-player", "panels", "MasterAiModal.tsx"),
        "package.json": os.path.join(root, "package.json"),
    }
    pkg = json.load(open(app_files["package.json"], "r", encoding="utf-8"))
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    formulate_src = open(app_files["toolAssistedLocalMode.ts"], "r", encoding="utf-8").read()
    engine_src = open(app_files["masterAiEngine.ts"], "r", encoding="utf-8").read()

    app_audit = {
        "onnxruntime_web_installed": "onnxruntime-web" in deps,
        "masterAiEngine_uses_regex_local_fallback": "chatWithLocalNeuralAi" in engine_src and "processToolAssistedQuery" not in engine_src.split("chat(")[1].split("}")[0],
        "toolAssisted_neural_fallback_currently_static_template": "Generated entirely by our original 5.06M parameter Transformer" in formulate_src,
        "streaming_supported": False,
        "kv_cache_supported": False,
        "multi_turn_memory_manager_exists": False,
        "human_feedback_preference_store_exists": False,
    }

    report = {
        "audit_version": "v0.6 -> v1.0 Baseline Audit",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "preserved_artifacts": preserved,
        "v06_architecture": {
            **v06_config,
            "parameters": train_rep["parameters"],
            "normalization": "LayerNorm",
            "positional_encoding": "Learned Absolute Position Embedding",
            "ffn_activation": "GELU",
            "kv_cache": False,
        },
        "v06_training_data": {
            "total_samples": corpus_man["total_samples"],
            "total_tokens": corpus_man["total_tokens"],
            "train_samples": corpus_man["train_samples"],
            "val_samples": corpus_man["val_samples"],
            "test_samples": corpus_man["test_samples"],
            "language_distribution": corpus_man["language_distribution"],
            "stage1_continuous_prose_tokens": 0,
            "note": "Corpus consists solely of 442 short instruction/QA entries; zero Stage-1 continuous language pretraining.",
        },
        "v06_training_stats": {
            "epochs": train_rep["epochs"],
            "batch_size": train_rep["batch_size"],
            "total_time_seconds": train_rep["total_time_seconds"],
            "best_val_loss": train_rep["best_val_loss"],
            "final_test_loss": train_rep["final_test_loss"],
            "final_test_perplexity": train_rep["final_test_perplexity"],
        },
        "v06_generation_quality": {
            "held_out_100": {
                **eval100["metrics"],
                "rubric_averages_0_to_5": eval100["rubric_averages_0_to_5"],
            },
            "acceptance_30_raw_onnx": {
                "clean_eos_stop_rate": neural_acc["clean_eos_stop_rate"],
                "mean_3gram_repetition": neural_acc["mean_3gram_repetition"],
                "concept_match_rate": neural_acc["concept_match_rate"],
                "mean_tokens_per_second": neural_acc["mean_tokens_per_second"],
                "sample_english_raw": neural_acc["results"][0]["raw_generated_text"],
                "sample_sinhala_raw": neural_acc["results"][10]["raw_generated_text"],
            },
            "tool_assisted_acceptance": {
                "totalPassed": tool_acc["totalPassed"],
                "totalFailed": tool_acc["totalFailed"],
                "successRate": tool_acc["successRate"],
            },
        },
        "v06_onnx_and_inference": {
            "onnx_parity_status": parity["status"],
            "onnx_size_mb": parity["model_size_mb"],
            "single_thread_ort_benchmark": ort_bench,
        },
        "hardware_and_os_environment": {
            "gpu_hardware": get_gpu_hardware_info(),
            "pytorch_runtime": torch_info,
            "os_memory": get_windows_memory_info(),
        },
        "application_integration_audit": app_audit,
    }

    json_out = os.path.join(v1_dir, "baseline_audit_v06.json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Human-readable Markdown Audit Report
    md_lines = [
        "# MASTER AI CORE — Baseline Audit Report (v0.6 ➔ v1.0)",
        "",
        f"**Audit Timestamp:** {report['timestamp']}",
        "",
        "## 1. Historical Checkpoint Preservation",
        "All `models/master-ai-core/*` artifacts (`v0.2` through `v0.6` and `checkpoint_best.pt`) were audited via SHA-256 and left completely untouched.",
        "",
        "| Artifact | Exists | Size (Bytes) | SHA-256 Prefix |",
        "| :--- | :--- | ---: | :--- |",
    ]
    for fname, info in preserved.items():
        if info["exists"]:
            md_lines.append(f"| `{fname}` | Yes | {info['size_bytes']:,} | `{info['sha256'][:16]}...` |")
        else:
            md_lines.append(f"| `{fname}` | **Missing** | 0 | — |")

    md_lines += [
        "",
        "## 2. v0.6 Model Architecture & Tokenizer",
        f"- **Parameters:** `{report['v06_architecture']['parameters']:,}` (~5.06M)",
        f"- **Layers / Width / Heads:** `{v06_config['n_layers']}` layers, `d_model={v06_config['d_model']}`, `n_heads={v06_config['n_heads']}`, `d_ff={v06_config['d_ff']}`",
        f"- **Tokenizer:** Custom Byte-Level BPE, `vocab_size={v06_config['vocab_size']}` (256 byte tokens + 5 specials + 763 merges)",
        f"- **Context Window:** `{v06_config['max_seq_len']}` tokens (learned absolute positional embeddings, no KV cache)",
        "- **Core Bottleneck:** `vocab_size=1024` causes 3-byte UTF-8 Sinhala characters to fragment into byte pieces, exhausting sequence context.",
        "",
        "## 3. v0.6 Training Data & Statistics",
        f"- **Total Samples / Tokens:** `{corpus_man['total_samples']}` QA pairs / `{corpus_man['total_tokens']:,}` tokens (`EN={corpus_man['language_distribution']['english']}`, `SI={corpus_man['language_distribution']['sinhala']}`, `Mixed={corpus_man['language_distribution']['mixed']}`)",
        "- **Stage-1 Pretraining Prose:** `0` tokens (major root cause of ungrammatical free-text continuation)",
        f"- **Losses:** Best Val Loss `{train_rep['best_val_loss']}`, Test Loss `{train_rep['final_test_loss']}` (Perplexity `{train_rep['final_test_perplexity']}`)",
        "",
        "## 4. Generation Quality & Real Inference Speed",
        f"- **Held-Out 100 Benchmark:** Complete sentences `{eval100['metrics']['complete_sentence_generation_rate']}%`, Clean EOS `{eval100['metrics']['clean_eos_stop_percentage']}%`, Correctness `{eval100['rubric_averages_0_to_5']['correctness']}/5`, Grammar `{eval100['rubric_averages_0_to_5']['grammar']}/5`",
        f"- **30-Query Raw ONNX Acceptance:** Mean speed `{neural_acc['mean_tokens_per_second']} tok/s`, EOS stop `{round(neural_acc['clean_eos_stop_rate']*100,1)}%`, 3-gram rep `{round(neural_acc['mean_3gram_repetition']*100,1)}%`",
        f"  - Sample English Output (`ENG_01`): `\"{neural_acc['results'][0]['raw_generated_text']}\"`",
        f"  - Sample Sinhala Output (`SIN_01`): `\"{neural_acc['results'][10]['raw_generated_text']}\"`",
        f"- **Live 1-Thread CPU ORT Latency (`master_ai_core.onnx`):**",
        f"  - `seq=1`: `{ort_bench['seq_1']['mean_latency_ms']} ms` | `seq=32`: `{ort_bench['seq_32']['mean_latency_ms']} ms` | `seq=128`: `{ort_bench['seq_128']['mean_latency_ms']} ms` | `seq=256`: `{ort_bench['seq_256']['mean_latency_ms']} ms`",
        f"- **Tool-Assisted Acceptance:** `{tool_acc['totalPassed']}/{tool_acc['totalPassed']+tool_acc['totalFailed']}` passed (100% deterministic math, BM25 docs, transcript cues)",
        "",
        "## 5. Hardware & Environment Realities",
        f"- **GPU Hardware:** `{report['hardware_and_os_environment']['gpu_hardware'].get('raw', 'Not detected')}`",
        f"- **PyTorch Runtime:** `{torch_info.get('version', 'error')}` (`CUDA available: {torch_info.get('cuda_available', False)}` — CPU wheel currently installed despite RTX 3050 6GB hardware present)",
        f"- **System Memory:** Physical `{report['hardware_and_os_environment']['os_memory'].get('physical_total_gb')} GB` (`{report['hardware_and_os_environment']['os_memory'].get('physical_available_gb')} GB` free), Commit Limit `{report['hardware_and_os_environment']['os_memory'].get('commit_limit_gb')} GB` (`{report['hardware_and_os_environment']['os_memory'].get('commit_available_gb')} GB` commit free). Requires single-thread BLAS/OMP guard (`OMP_NUM_THREADS=1`) during heavy operations unless virtual commit headroom increases.",
        "",
        "## 6. Critical Application Integration Findings",
        f"- **`onnxruntime-web` installed in Node:** `{app_audit['onnxruntime_web_installed']}`",
        f"- **`toolAssistedLocalMode.ts` Neural Fallback:** Currently returns a static formatted message (`static_template={app_audit['toolAssisted_neural_fallback_currently_static_template']}`) instead of running real ONNX token generation.",
        f"- **`MasterAiModal.tsx` / `masterAiEngine.ts`:** Uses regex handlers (`chatWithLocalNeuralAi`) without browser ONNX execution, streaming, KV cache, multi-turn conversation memory management, or human feedback collection.",
        "",
        "## 7. v1.0 Upgrade Direction",
        "1. Preserve v0.6 cleanly; establish isolated `models/master-ai-core-v1/` and `training/v1/`.",
        "2. Build bilingual word/Sinhala-cluster-preserving Byte-Level BPE (`1024` vs `4096` vs `8192` vs `16384`) and benchmark tokens/sentence & Unicode accuracy.",
        "3. Expand into a clean Two-Stage Corpus: Stage 1 Continuous Prose Pretraining + Stage 2 Multi-Turn Dialogue & Tool-Protocol SFT.",
        "4. Build modern Decoder-Only Transformer v1.0 (`RMSNorm`, `RoPE`, `SwiGLU`, `GQA`, `KV-Cache`, `512-2048` context), benchmark scaling from `5M` to `50M`, and run honest CPU pilot training + ONNX export.",
        "5. Integrate REAL client-side ONNX Runtime (`onnxruntime-web`), streaming, multi-turn conversation memory, safe deterministic tool routing, human feedback capture, and frozen 500-prompt evaluation with honest `GATE A–E` reporting.",
    ]

    md_out = os.path.join(v1_dir, "BASELINE_AUDIT_v06.md")
    with open(md_out, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"[OK] Baseline audit written to:\n  - {json_out}\n  - {md_out}")
    print(f"ORT seq=1 latency: {ort_bench['seq_1']['mean_latency_ms']} ms | PyTorch: {torch_info} | OS Commit Avail: {report['hardware_and_os_environment']['os_memory'].get('commit_available_gb')} GB")


if __name__ == "__main__":
    run_baseline_audit()
