# MASTER AI CORE — Baseline Audit Report (v0.6 ➔ v1.0)

**Audit Timestamp:** 2026-11-11T10:11:48Z

## 1. Historical Checkpoint Preservation
All `models/master-ai-core/*` artifacts (`v0.2` through `v0.6` and `checkpoint_best.pt`) were audited via SHA-256 and left completely untouched.

| Artifact | Exists | Size (Bytes) | SHA-256 Prefix |
| :--- | :--- | ---: | :--- |
| `checkpoint_v0.2.pt` | Yes | 60,821,043 | `dab9eee6c28fc2a2...` |
| `checkpoint_v0.3.pt` | Yes | 62,393,971 | `2d82e470dd6d9705...` |
| `checkpoint_v0.4.pt` | Yes | 62,393,971 | `6689da607e453388...` |
| `checkpoint_v0.5_stageA.pt` | Yes | 62,396,311 | `3ab372a1ea1b2e97...` |
| `checkpoint_v0.5_stageB.pt` | Yes | 62,396,311 | `4c97f1125e6d1d18...` |
| `checkpoint_v0.5.pt` | Yes | 62,394,035 | `77865d04fd2547d0...` |
| `checkpoint_v0.6.pt` | Yes | 62,394,035 | `644025005b500921...` |
| `checkpoint_best.pt` | Yes | 62,394,035 | `644025005b500921...` |
| `master_ai_core.onnx` | Yes | 22,085,366 | `a645ae4830ac0f1b...` |
| `vocab.json` | Yes | 90,000 | `04b410ab61f9068d...` |
| `merges.json` | Yes | 30,446 | `40ec3cadf313d8d6...` |
| `config.json` | Yes | 164 | `3a0f2d5b5ab71f7a...` |

## 2. v0.6 Model Architecture & Tokenizer
- **Parameters:** `5,060,608` (~5.06M)
- **Layers / Width / Heads:** `6` layers, `d_model=256`, `n_heads=4`, `d_ff=1024`
- **Tokenizer:** Custom Byte-Level BPE, `vocab_size=1024` (256 byte tokens + 5 specials + 763 merges)
- **Context Window:** `256` tokens (learned absolute positional embeddings, no KV cache)
- **Core Bottleneck:** `vocab_size=1024` causes 3-byte UTF-8 Sinhala characters to fragment into byte pieces, exhausting sequence context.

## 3. v0.6 Training Data & Statistics
- **Total Samples / Tokens:** `442` QA pairs / `57,839` tokens (`EN=273`, `SI=90`, `Mixed=79`)
- **Stage-1 Pretraining Prose:** `0` tokens (major root cause of ungrammatical free-text continuation)
- **Losses:** Best Val Loss `3.4972`, Test Loss `3.5774` (Perplexity `35.78`)

## 4. Generation Quality & Real Inference Speed
- **Held-Out 100 Benchmark:** Complete sentences `52.0%`, Clean EOS `60.0%`, Correctness `1.25/5`, Grammar `1.94/5`
- **30-Query Raw ONNX Acceptance:** Mean speed `147.3 tok/s`, EOS stop `16.7%`, 3-gram rep `24.7%`
  - Sample English Output (`ENG_01`): `"key the or the to the press the to to video the to the to to in Press the to the the the the to your playback. press the the the or "`
  - Sample Sinhala Output (`SIN_01`): `"යතුර එබීමෙන් ව කියෝව සැතෝ ව ව ව වේ හැවත ඔබා පු වේ. ව ව විට ව ගේ ව ව ව"`
- **Live 1-Thread CPU ORT Latency (`master_ai_core.onnx`):**
  - `seq=1`: `1.96 ms` | `seq=32`: `6.94 ms` | `seq=128`: `26.27 ms` | `seq=256`: `50.28 ms`
- **Tool-Assisted Acceptance:** `60/60` passed (100% deterministic math, BM25 docs, transcript cues)

## 5. Hardware & Environment Realities
- **GPU Hardware:** `NVIDIA GeForce RTX 3050 6GB Laptop GPU, 6144 MiB, 6001 MiB, 610.91`
- **PyTorch Runtime:** `2.15.0+cpu` (`CUDA available: False` — CPU wheel currently installed despite RTX 3050 6GB hardware present)
- **System Memory:** Physical `15.64 GB` (`1.75 GB` free), Commit Limit `19.64 GB` (`0.36 GB` commit free). Requires single-thread BLAS/OMP guard (`OMP_NUM_THREADS=1`) during heavy operations unless virtual commit headroom increases.

## 6. Critical Application Integration Findings
- **`onnxruntime-web` installed in Node:** `False`
- **`toolAssistedLocalMode.ts` Neural Fallback:** Currently returns a static formatted message (`static_template=True`) instead of running real ONNX token generation.
- **`MasterAiModal.tsx` / `masterAiEngine.ts`:** Uses regex handlers (`chatWithLocalNeuralAi`) without browser ONNX execution, streaming, KV cache, multi-turn conversation memory management, or human feedback collection.

## 7. v1.0 Upgrade Direction
1. Preserve v0.6 cleanly; establish isolated `models/master-ai-core-v1/` and `training/v1/`.
2. Build bilingual word/Sinhala-cluster-preserving Byte-Level BPE (`1024` vs `4096` vs `8192` vs `16384`) and benchmark tokens/sentence & Unicode accuracy.
3. Expand into a clean Two-Stage Corpus: Stage 1 Continuous Prose Pretraining + Stage 2 Multi-Turn Dialogue & Tool-Protocol SFT.
4. Build modern Decoder-Only Transformer v1.0 (`RMSNorm`, `RoPE`, `SwiGLU`, `GQA`, `KV-Cache`, `512-2048` context), benchmark scaling from `5M` to `50M`, and run honest CPU pilot training + ONNX export.
5. Integrate REAL client-side ONNX Runtime (`onnxruntime-web`), streaming, multi-turn conversation memory, safe deterministic tool routing, human feedback capture, and frozen 500-prompt evaluation with honest `GATE A–E` reporting.