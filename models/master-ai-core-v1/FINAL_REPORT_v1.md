# MASTER CLOUD — MASTER AI CORE v1.0 Engineering & Evaluation Report

**Date:** 2026-11-11  
**Policy:** 100% Original Neural Weights Initialized and Trained From Scratch (Zero Third-Party Pretrained LLMs, Tokenizers, ASR Weights, Distillation, External LLM Judges, or Hardcoded Fake Generation)

---

## 1. Executive Summary

MASTER AI CORE v1.0 replaces the static neural fallback and v0.6 small prototype with an end-to-end, independently initialized autoregressive Transformer (`5,164,032` parameters; `RMSNorm + RoPE + SwiGLU + GQA(4/2)`), an `8192`-target (`7,875` learned) custom bilingual Sinhala/English Byte-Level BPE tokenizer, genuine two-stage training (Stage 1 Continuous Prose Pretraining -> Stage 2 Assistant/Tool-Masked Multi-Turn SFT), verified client-side ONNX Runtime Web execution (`27.62 MB`), multi-turn 512-token working-memory management, a rich interactive chat workspace (`MasterAiChatStudio`), and opt-in local human preference dataset collection (`HumanFeedbackStore`).

All legacy checkpoints and artifacts under `models/master-ai-core/` (`v0.2–v0.6`) were audited via SHA-256 (`baseline_audit_v06.json`) and preserved completely untouched.

Honest readiness outcome across our 500-prompt held-out ONNX benchmark (`held_out_500_eval_report_v1.json`):
- **Gate A (Technical Integrity):** **PASSED** — Stage 1 & Stage 2 validation loss converged monotonically before rolling back to best validation checkpoints, ONNX PyTorch numerical parity passed (`max_abs_diff = 6.7e-06`, 100% argmax match across all lengths and bilingual probes), Python/TypeScript tokenizer IDs match bit-for-bit, and `dist/` builds cleanly with local `/ort/` WASM runtimes.
- **Gates B, C, D, E (Fluent Conversational Intelligence & Generalization):** **FAILED (`FAILED_INSUFFICIENT_CORPUS_SCALE`)** — Honest 500-prompt ONNX evaluation proves that while the `5.16M` pilot model generates clean UTF-8 Sinhala/English script with strong EOS termination in English (`97.3%`), training on `96,759` clean subword tokens on CPU (~`0.019` tokens/parameter) is ~1,000x short of Chinchilla scale for general bilingual fluency, leading to template repetition (English concept recall `0.4%`, Sinhala non-loop rate `30.7%`, Mixed non-loop rate `26.0%`, `<|tool|>` emission uncalibrated).

---

## 2. Baseline v0.6 Audit vs. v1.0 Architecture

| Dimension | MASTER AI CORE v0.6 (Preserved Baseline) | MASTER AI CORE v1.0 (Pilot Architecture) |
| :--- | :--- | :--- |
| Normalization | LayerNorm | **RMSNorm** (`eps=1e-6`) |
| Position Encoding | Learned Absolute (`max=256`) | **Rotary Positional Embeddings (RoPE, `theta=10000`, `max=512+`)** |
| Feed-Forward Block | GELU (`d_ff=1024`) | **SwiGLU** (`d_ff=768`) |
| Attention | Standard MHA (`4` heads) | **Grouped Query Attention (`n_heads=4`, `n_kv_heads=2`) + KV Cache** |
| Parameters | `5,060,608` | **`5,164,032`** |
| Custom BPE Vocab | `1,024` tokens | **`7,875` tokens** (`target=8192`, `11` special control tokens) |
| Corpus Scope | `442` QA pairs (`57,839` tok, 0 Stage-1 prose) | **`964` docs (`96,759` exact tok: `33,965` S1 prose + `62,794` S2 multi-turn)** |
| Training Pipeline | Single-stage QA next-token | **Two-Stage: Stage 1 Prose Pretraining + Stage 2 Role-Masked SFT** |
| ONNX Artifact Size | `21.06 MB` (`master_ai_core.onnx`) | **`27.62 MB` (`master_ai_v1.onnx`, SHA-256 `8470db1e...`)** |
| Browser Integration | Static template placeholder on out-of-domain queries | **`onnxruntime-web` streaming runtime + Tool Allowlist + Session Memory** |

---

## 3. Custom Bilingual Tokenizer Benchmark

Evaluated across `18` strict Unicode NFC round-trip cases (Sinhala ZWJ conjuncts `ශ්‍රී ලංකාව`, English, mixed code-switching, emojis, and special role tokens):

| Target Vocab | Actual Vocab | Merges Learned | Round-Trip | SI Tok/Sent | EN Tok/Sent | Mix Tok/Sent | SI/EN Ratio | UTF-8 Bytes/Tok |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `1024` | `1024` | `757` | `100.0%` (`18/18`) | `39.4` | `36.0` | `41.8` | `1.094` | `3.653` |
| `4096` | `4096` | `3829` | `100.0%` (`18/18`) | `20.0` | `22.0` | `27.2` | `0.909` | `6.652` |
| **`8192` (Selected)** | **`7875`** | **`7608`** | **`100.0%` (`18/18`)** | **`15.8`** | **`17.6`** | **`24.2`** | **`0.898`** | **`8.345`** |
| `16384` | `7875` | `7608` | `100.0%` (`18/18`) | `15.8` | `17.6` | `24.2` | `0.898` | `8.345` |

*Note:* With `min_pair_frequency=2` on the `827`-doc train split, BPE saturated naturally at `7,875` tokens; TypeScript (`tokenizerV1.ts`) and Python (`tokenizer_v1.py`) produce **100% bit-identical token IDs** across all verified probes. Because token IDs changed from `1024 -> 7875`, all v1.0 model embeddings were freshly initialized from scratch.

---

## 4. Clean Bilingual Corpus & Leakage Audit (`corpus_manifest_v1.json`)

- **Provenance:** 100% project-original human-authored technical documentation, dialogues, and public-domain technical/mathematical standards (zero third-party LLM outputs).
- **Held-Out De-duplication:** Checked against `held_out_benchmark_100.json`, `held_out_benchmark_additional_50.json`, and `held_out_benchmark_500.json`. Automatically removed `5` leaking Stage-1 items and `5` leaking Stage-2 items (`held_out_leakage_verified_zero: true`).
- **Kept Clean Corpus:**
  - **Stage 1 Continuous Prose:** `480` docs (`33,965` exact v1 tokens — EN `21,977`, SI `7,058`, Mix `4,930`).
  - **Stage 2 Multi-Turn & Tool SFT:** `484` multi-turn dialogues (`62,794` exact v1 tokens — EN `37,967`, SI `13,226`, Mix `11,601`).
  - **Combined Totals:** `964` docs (`827` train), `340,636` UTF-8 bytes, **`96,759` exact subword tokens** (English `61.95%`, Sinhala `20.96%`, Mixed `17.08%`).

---

## 5. Hardware Constraints, Scaling & Controlled Ablation

- **Hardware / PyTorch Reality:** An NVIDIA GeForce RTX 3050 6GB Laptop GPU is physically present, but installed PyTorch is `2.15.0+cpu` (`CUDA available: False`), constraining training to single-thread CPU execution within ~`460–524 MB` baseline desktop commit headroom (~`1,293–1,583 MB` when Vite is idle).
- **Scaling Benchmark (`scaling_benchmark.json`):**
  - `scale_5M` (`5,164,032` params, `19.7 MB` FP32): `595.1 ms/step` (`860.4 tok/s`), uncached decode `43.8 tok/s` vs **KV-cached `110.6 tok/s` (`2.52x` speedup)**.
  - `scale_10M` (`10,337,920` params, `39.44 MB` FP32): `1277.4 ms/step` (`400.8 tok/s`), KV-cached `82.1 tok/s` (`3.27x` speedup).
  - `scale_20M` (~20.73M), `scale_40M` (~44.68M), `scale_50M` (~53.70M): **Skipped honestly (`skipped_host_commit_ceiling`)** because estimated AdamW commit (`416–982 MB`) exceeded available CPU commit (`~460 MB`). During initial Stage 1 launch without closing memory spikes, `10.34M` also hit Windows CPU commit allocation limits, confirming `scale_5M` with chunked cross-entropy (`chunk_tokens=16`) + gradient checkpointing as the reliable host training configuration.
  - **Context Scaling (`scale_10M` RoPE):** `256 -> 171.03ms`, `512 -> 353.82ms`, `1024 -> 1039.39ms`, `2048 -> 3368.41ms`.
- **Controlled 40-Step Ablation (`ablation_report.json`):**
  - `baseline_v06_blocks` (`5,461,248` params): `val_loss=5.2770` (`ppl=195.79`), `32.59s`, KV `1008.1 tok/s`.
  - `v1_rmsnorm_rope_swiglu_mha` (`5,426,176` params): `val_loss=5.3764` (`ppl=216.25`), `17.97s`, KV `336.9 tok/s`.
  - `v1_full` (`RMSNorm + RoPE + SwiGLU + GQA(4/2)`, `5,164,032` params): `val_loss=5.3266` (`ppl=205.74`), `24.25s`, **KV `651.7 tok/s`** — nearly **2x faster inference** than MHA-4 while beating MHA-4 validation perplexity.

---

## 6. Two-Stage Training & ONNX Parity (`training_report_v1.json`)

- **Stage 1 (Pretraining, 4 epochs, `seq_len=192`, `393` train windows):**
  - Init `val_loss`: `9.0440` (`ppl=8467.53`)
  - Ep 1: `train=6.5499`, `val=5.7951` (`ppl=328.69`) | Ep 2: `train=4.5645`, `val=5.4434` (`ppl=231.22`)
  - Ep 3 (**Best**): `train=3.8314`, **`val=5.3667` (`ppl=214.15`)** | Ep 4: `train=3.4887`, `val=5.3736` (`ppl=215.65`)
  - Held-out Stage-1 test: `test_loss=6.5941`, `test_ppl=730.74` (`1131.1s`).
- **Stage 2 (Assistant & Tool-Masked SFT, 4 epochs, `sft_max_len=256`, `415` samples):**
  - Pre-SFT `val_loss`: `7.0171` (`ppl=1115.50`)
  - Ep 1: `train=4.5010`, `val=5.7916` (`ppl=327.54`)
  - Ep 2 (**Best**): `train=3.8054`, **`val=5.6980` (`ppl=298.26`)**
  - Ep 3: `train=3.5476`, `val=5.7120` (`ppl=302.48`) | Ep 4: `train=3.3929`, `val=5.7346` (`ppl=309.39`)
  - Held-out Stage-2 test: `test_loss=6.3827`, **`test_ppl=591.52`** (`1614.1s`).
- **ONNX Export & PyTorch Parity (`onnx_parity_report_v1.json`):**
  - **`status: PASSED`**, `max_abs_diff_overall = 6.7e-06`, `all_argmax_match = true`, size = `27.62 MB`.

---

## 7. Held-Out 500-Prompt ONNX Evaluation (`held_out_500_eval_report_v1.json`)

Evaluated across **all 500 unseen prompts** using `public/models/master-ai-core-v1/master_ai_v1.onnx` (`175.7s` total; zero cherry-picking):

| Cohort | Prompts | Non-Empty | Clean EOS/Stop | Lang Match | 3-Gram Loop Rate | Fluent Non-Loop | Concept Recall | Mean Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `english` | 150 | 100.0% | 97.3% | 94.7% | 11.3% | **83.3%** | **0.4%** | `286.1 ms` |
| `sinhala` | 150 | 100.0% | 37.3% | 93.3% | **62.7%** | **30.7%** | **0.9%** | `390.0 ms` |
| `mixed` | 100 | 100.0% | 41.0% | 100.0% | **74.0%** | **26.0%** | **4.0%** | `389.3 ms` |
| `multi_turn` | 50 | 100.0% | 100.0% | 100.0% | 0.0% | **100.0%** | **0.0%** | `399.1 ms` |
| `reasoning` | 50 | 100.0% | 100.0% | 96.0% | 20.0% | **76.0%** | **6.3%** | `302.7 ms` |

### Verbatim Sample Failure Outputs (Raw ONNX Model)
- `EN_002` (*Why MKV plays without audio?*): `"Press the video frames, and press the audio track to the video frame."` (off-topic memorized template)
- `SI_001` (*Introduce MASTER CLOUD advantages in Sinhala*): `"Press the video එක ඔබලා Web Audio Studio එකට ගිහින් Audio Delay slider එකෙන් (.) key එක press කරලා video එක ඔබලා video එක ඔබලා..."` (mode collapse / repetition loop)
- `RS_001` (*Calculate bitrate for 1,200 MB over 960s*): `"The 10-in-Band Equalizer."` (ungrounded hallucination without tool dispatch; tool-assisted deterministic mode handles this math cleanly at 100% accuracy in the UI)

---

## 8. Software Verification Status

- `node scripts/test_v1_ai_modules.mjs`: **12 passed, 0 failed** (TypeScript/Python tokenizer parity, 512-token working-memory summarization, opt-in feedback JSONL export, neural sampling & `<|tool|>` extraction, fail-closed offline ONNX diagnostics, safe read-only tool allowlist & missing-evidence refusal).
- `node scripts/test_acceptance_tool_assisted.mjs`: **60 passed, 0 failed**.
- `node scripts/testVideoPlayer.mjs`: **248 passed, 0 failed**.
- `npx tsc --noEmit`: **0 TypeScript errors** in all v1.0 AI and UI files (`tokenizerV1.ts`, `conversationMemory.ts`, `feedbackStore.ts`, `neuralRuntime.ts`, `toolAssistedLocalMode.ts`, `masterAiEngine.ts`, `MasterAiMarkdown.tsx`, `MasterAiChatStudio.tsx`, `MasterAiModal.tsx`).
- `npm run build` (`vite build`): **Succeeded cleanly in `20.07s`**, bundling `dist/models/master-ai-core-v1/{master_ai_v1.onnx, tokenizer_v1.json, model_manifest_v1.json}` and `dist/ort/` (`8` offline WASM assets).

---

## 9. Honest Roadmap to Pass Gates B–E

1. **Enable CUDA PyTorch on Local RTX 3050 6GB:** Install CUDA-enabled `torch` wheel matching driver `610.91`, unlocking `scale_20M`/`scale_40M` training speeds ~15–30x faster than CPU without Windows pagefile commit contention.
2. **Execute Stage A -> Stage C Corpus Expansion:** Use `training/v1/corpus_pipeline.py --import-jsonl / --import-txt-dir` to ingest clean public-domain and CC-BY-SA Sinhala/English literature, encyclopedia dumps, and technical manuals (1M -> 5M -> 20M -> 100M+ tokens).
3. **Train Longer Stage 1 + Diverse Stage 2 SFT:** Train with `>= 50x–100x` Stage-1 prose tokens relative to parameters before running diverse multi-turn instruction tuning and curated `<|tool|>` calling episodes.
