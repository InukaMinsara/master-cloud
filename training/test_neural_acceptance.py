"""
MASTER CLOUD — MASTER AI CORE v0.6: REAL-WORLD NEURAL ACCEPTANCE TEST
Executes 30 unseen questions (10 English, 10 Sinhala, 10 Mixed) directly
against the exported ONNX model (master_ai_core.onnx).

Verifies:
1. Actual neural autoregressive generation (not hardcoded/mocked).
2. Input tokenization and generated token IDs.
3. Clean EOS stop rate, repetition, generation latency, and output tokens.
4. Generates acceptance_test_neural_outputs.json with exact raw model outputs.
"""

import os
import sys
import json
import time
import numpy as np
import onnxruntime as ort

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.tokenizer import MasterAiTokenizer


TEST_QUESTIONS = [
    # --- Category 1: 10 English Questions ---
    {
        "id": "ENG_01",
        "category": "English",
        "question": "How do I pause and resume video playback?",
        "expected_concepts": ["space", "k", "pause", "play"],
    },
    {
        "id": "ENG_02",
        "category": "English",
        "question": "What is the keyboard shortcut for full screen mode?",
        "expected_concepts": ["f", "fullscreen", "escape"],
    },
    {
        "id": "ENG_03",
        "category": "English",
        "question": "How do I adjust the 10-band equalizer settings?",
        "expected_concepts": ["e", "equalizer", "audio", "preset"],
    },
    {
        "id": "ENG_04",
        "category": "English",
        "question": "Where are the media files stored on my computer?",
        "expected_concepts": ["local", "device", "offline", "stored"],
    },
    {
        "id": "ENG_05",
        "category": "English",
        "question": "Does Master Cloud send video data to external servers?",
        "expected_concepts": ["zero", "cloud", "offline", "local", "privacy"],
    },
    {
        "id": "ENG_06",
        "category": "English",
        "question": "How can I jump forward 10 seconds in the timeline?",
        "expected_concepts": ["right", "arrow", "l", "10", "jump", "forward"],
    },
    {
        "id": "ENG_07",
        "category": "English",
        "question": "How do I enable vocal clarity in the audio studio?",
        "expected_concepts": ["vocal", "clarity", "preset", "equalizer"],
    },
    {
        "id": "ENG_08",
        "category": "English",
        "question": "What video formats are supported by the player?",
        "expected_concepts": ["mp4", "webm", "container", "format"],
    },
    {
        "id": "ENG_09",
        "category": "English",
        "question": "How do I set up an A-B repeat loop for a video clip?",
        "expected_concepts": ["[", "]", "loop", "repeat", "a-b"],
    },
    {
        "id": "ENG_10",
        "category": "English",
        "question": "Can I adjust the subtitle sync timing if audio is delayed?",
        "expected_concepts": ["subtitle", "sync", "offset", "delay"],
    },

    # --- Category 2: 10 Sinhala Questions ---
    {
        "id": "SIN_01",
        "category": "Sinhala",
        "question": "වීඩියෝව නවත්වන්නේ සහ නැවත ධාවනය කරන්නේ කෙසේද?",
        "expected_concepts": ["Space", "K", "නවත්වන්න", "ධාවනය"],
    },
    {
        "id": "SIN_02",
        "category": "Sinhala",
        "question": "පූර්ණ තිරය (Fullscreen) සඳහා භාවිතා කරන කෙටිමං යතුර කුමක්ද?",
        "expected_concepts": ["F", "යතුර", "තිරය"],
    },
    {
        "id": "SIN_03",
        "category": "Sinhala",
        "question": "ශබ්ද සැකසුම් (Equalizer) විවෘත කරන්නේ කෙසේද?",
        "expected_concepts": ["E", "Equalizer", "ශබ්ද"],
    },
    {
        "id": "SIN_04",
        "category": "Sinhala",
        "question": "වීඩියෝව තත්පර 10ක් ඉදිරියට ගෙන යන්නේ කෙසේද?",
        "expected_concepts": ["Right", "Arrow", "ඉදිරියට", "තත්පර"],
    },
    {
        "id": "SIN_05",
        "category": "Sinhala",
        "question": "Master Cloud හි මගේ දත්ත ආරක්ෂිතව පවතීද?",
        "expected_concepts": ["ආරක්ෂිත", "local", "offline", "දත්ත"],
    },
    {
        "id": "SIN_06",
        "category": "Sinhala",
        "question": "උපසිරැසි කාලය (Subtitle Sync) සකසන්නේ කෙසේද?",
        "expected_concepts": ["උපසිරැසි", "sync", "කාලය"],
    },
    {
        "id": "SIN_07",
        "category": "Sinhala",
        "question": "ශබ්ද පාලනය (Volume) වැඩි කරන්නේ කුමන යතුරෙන්ද?",
        "expected_concepts": ["Up", "Arrow", "ශබ්ද"],
    },
    {
        "id": "SIN_08",
        "category": "Sinhala",
        "question": "A-B Repeat ලූපය භාවිතා කරන්නේ කෙසේද?",
        "expected_concepts": ["[", "]", "loop", "ලූපය"],
    },
    {
        "id": "SIN_09",
        "category": "Sinhala",
        "question": "වීඩියෝවක දර්ශන මාරුවීම් (Scene Transitions) හඳුනා ගන්නේ කෙසේද?",
        "expected_concepts": ["Scene", "දර්ශන", "මාරුවීම්"],
    },
    {
        "id": "SIN_10",
        "category": "Sinhala",
        "question": "Master Cloud ක්‍රියාත්මක වන්නේ නොබැඳිව (Offline) ද?",
        "expected_concepts": ["offline", "නොබැඳිව", "cloud", "පරිගණකය"],
    },

    # --- Category 3: 10 Sinhala-English Mixed Questions ---
    {
        "id": "MIX_01",
        "category": "Mixed",
        "question": "Video එක pause කරන්න keyboard shortcut එක මොකක්ද?",
        "expected_concepts": ["Space", "K", "pause", "ඔබන්න"],
    },
    {
        "id": "MIX_02",
        "category": "Mixed",
        "question": "Audio studio එකේ 10-Band EQ open කරන්නේ කොහොමද?",
        "expected_concepts": ["E", "Equalizer", "EQ", "ඔබන්න"],
    },
    {
        "id": "MIX_03",
        "category": "Mixed",
        "question": "Master Cloud එක 100% offline වැඩ කරනවද?",
        "expected_concepts": ["offline", "local", "දත්ත", "cloud"],
    },
    {
        "id": "MIX_04",
        "category": "Mixed",
        "question": "Timeline එකේ 10s forward යන්න press කරන්න ඕන key එක මොකක්ද?",
        "expected_concepts": ["Right", "Arrow", "L", "forward"],
    },
    {
        "id": "MIX_05",
        "category": "Mixed",
        "question": "Video resolution සහ bitrate check කරගන්නේ කොහොමද?",
        "expected_concepts": ["resolution", "bitrate", "video", "specs"],
    },
    {
        "id": "MIX_06",
        "category": "Mixed",
        "question": "Subtitle sync delay එක adjust කරන්නේ කොහොමද?",
        "expected_concepts": ["subtitle", "sync", "offset", "delay"],
    },
    {
        "id": "MIX_07",
        "category": "Mixed",
        "question": "A-B Repeat loop එකක් set කරන්නේ කොහොමද?",
        "expected_concepts": ["[", "]", "loop", "repeat"],
    },
    {
        "id": "MIX_08",
        "category": "Mixed",
        "question": "Vocal Clarity preset එක audio settings වල තියෙනවද?",
        "expected_concepts": ["vocal", "clarity", "preset", "equalizer"],
    },
    {
        "id": "MIX_09",
        "category": "Mixed",
        "question": "Full screen mode එකට යන්න press කරන්න ඕන shortcut එක මොකක්ද?",
        "expected_concepts": ["F", "fullscreen", "escape"],
    },
    {
        "id": "MIX_10",
        "category": "Mixed",
        "question": "Scene detection run කරලා chapter markers හදාගන්නේ කොහොමද?",
        "expected_concepts": ["scene", "chapter", "markers", "detection"],
    },
]


def calculate_3gram_repetition(tokens: list) -> float:
    if len(tokens) < 4:
        return 0.0
    ngrams = [tuple(tokens[i : i + 3]) for i in range(len(tokens) - 2)]
    return 1.0 - (len(set(ngrams)) / len(ngrams))


def generate_autoregressive_onnx(
    session: ort.InferenceSession,
    tokenizer: MasterAiTokenizer,
    prompt_ids: list,
    max_new_tokens: int = 70,
    temperature: float = 0.45,
    top_k: int = 20,
    top_p: float = 0.85,
    repetition_penalty: float = 1.20,
    rng: np.random.RandomState = None,
):
    if rng is None:
        rng = np.random.RandomState(42)

    cur_ids = list(prompt_ids)
    generated_tokens = []
    stopped_on_eos = False
    start_time = time.perf_counter()

    # Structural tokens exempted from repetition penalty to allow natural syntax
    structural_chars = {" ", ".", ",", "\n", "-", "(", ")"}
    exempt_token_ids = {tokenizer.EOS_ID, tokenizer.PAD_ID, tokenizer.BOS_ID}
    for tid in range(tokenizer.vocab_size):
        try:
            tok_str = tokenizer.decode([tid], skip_special=False)
            if tok_str in structural_chars or tok_str.strip() in structural_chars:
                exempt_token_ids.add(tid)
        except Exception:
            pass

    for _ in range(max_new_tokens):
        # Window slicing to maximum context of 256
        ctx = cur_ids[-256:]
        inp = np.array([ctx], dtype=np.int64)
        ort_out = session.run(None, {"input_ids": inp})
        logits = ort_out[0][0, -1, :].copy()

        # Apply repetition penalty to non-structural tokens
        if repetition_penalty != 1.0 and len(generated_tokens) > 0:
            for tid in set(generated_tokens):
                if tid not in exempt_token_ids:
                    if logits[tid] > 0:
                        logits[tid] /= repetition_penalty
                    else:
                        logits[tid] *= repetition_penalty

        # Temperature scaling
        if temperature > 0:
            scaled_logits = logits / temperature

            # Top-K filtering
            if top_k > 0 and top_k < len(scaled_logits):
                indices_to_remove = scaled_logits < np.partition(scaled_logits, -top_k)[-top_k]
                scaled_logits[indices_to_remove] = -1e9

            # Softmax
            max_l = np.max(scaled_logits)
            exp_l = np.exp(scaled_logits - max_l)
            probs = exp_l / np.sum(exp_l)

            # Top-P (nucleus) filtering
            if top_p < 1.0:
                sorted_indices = np.argsort(probs)[::-1]
                sorted_probs = probs[sorted_indices]
                cumulative_probs = np.cumsum(sorted_probs)
                cutoff_index = np.searchsorted(cumulative_probs, top_p)
                valid_indices = sorted_indices[: max(1, cutoff_index + 1)]
                filtered_probs = np.zeros_like(probs)
                filtered_probs[valid_indices] = probs[valid_indices]
                sum_p = np.sum(filtered_probs)
                if sum_p > 0:
                    probs = filtered_probs / sum_p

            next_token = int(rng.choice(len(probs), p=probs))
        else:
            next_token = int(np.argmax(logits))

        if next_token == tokenizer.EOS_ID:
            stopped_on_eos = True
            break

        cur_ids.append(next_token)
        generated_tokens.append(next_token)

    elapsed_time = time.perf_counter() - start_time
    return generated_tokens, stopped_on_eos, elapsed_time


def run_neural_acceptance_test():
    print("=" * 72)
    print(" MASTER CLOUD — MASTER AI CORE v0.6 NEURAL ACCEPTANCE TEST")
    print(" Target Model: models/master-ai-core/master_ai_core.onnx (100% Embedded)")
    print("=" * 72)

    model_dir = "models/master-ai-core"
    onnx_path = os.path.join(model_dir, "master_ai_core.onnx")

    if not os.path.exists(onnx_path):
        raise FileNotFoundError(f"ONNX model not found: {onnx_path}")

    # 1. Load ONNX Session
    print(f"[*] Initializing ONNX Runtime Session: {onnx_path}...")
    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    file_size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  ✓ Session loaded. File size: {file_size_mb:.2f} MB")

    # 2. Load Tokenizer
    tokenizer = MasterAiTokenizer()
    tokenizer.load(model_dir)
    print(f"  ✓ Custom Byte-Level BPE Tokenizer loaded. Vocab size: {tokenizer.vocab_size}")

    # Reproducible seed for evaluation consistency
    eval_rng = np.random.RandomState(42)

    results = []
    total_tokens = 0
    total_time = 0.0
    clean_eos_count = 0
    repetition_rates = []

    print(f"\n[*] Executing {len(TEST_QUESTIONS)} Unseen Acceptance Test Queries...\n")

    for idx, test_item in enumerate(TEST_QUESTIONS):
        q_id = test_item["id"]
        cat = test_item["category"]
        question = test_item["question"]
        concepts = test_item["expected_concepts"]

        # Exact prompt format as trained: User: ... \nAssistant: 
        prompt_text = f"User: {question}\nAssistant: "
        prompt_ids = tokenizer.encode(prompt_text, add_bos=True, add_eos=False)

        gen_tokens, stopped_on_eos, elapsed = generate_autoregressive_onnx(
            session=session,
            tokenizer=tokenizer,
            prompt_ids=prompt_ids,
            max_new_tokens=65,
            temperature=0.45,
            top_k=20,
            top_p=0.85,
            repetition_penalty=1.20,
            rng=eval_rng,
        )

        gen_text = tokenizer.decode(gen_tokens, skip_special=True)
        rep_rate = calculate_3gram_repetition(gen_tokens)
        tokens_per_sec = len(gen_tokens) / max(0.001, elapsed)

        total_tokens += len(gen_tokens)
        total_time += elapsed
        if stopped_on_eos:
            clean_eos_count += 1
        repetition_rates.append(rep_rate)

        # Concept match detection
        gen_lower = gen_text.lower()
        matched = [c for c in concepts if c.lower() in gen_lower]

        results.append({
            "test_id": q_id,
            "category": cat,
            "question": question,
            "prompt_formatted": prompt_text,
            "input_token_count": len(prompt_ids),
            "generated_token_count": len(gen_tokens),
            "generated_token_ids": gen_tokens,
            "raw_generated_text": gen_text,
            "stopped_on_eos": stopped_on_eos,
            "generation_time_seconds": round(elapsed, 4),
            "tokens_per_second": round(tokens_per_sec, 1),
            "three_gram_repetition_rate": round(rep_rate, 4),
            "expected_concepts": concepts,
            "matched_concepts": matched,
            "concept_match_success": len(matched) > 0,
        })

        eos_tag = "EOS" if stopped_on_eos else "MAX"
        print(f"[{idx+1:02d}/30] [{cat:7s}] {q_id}: {question[:45]}...")
        print(f"       -> Generated ({len(gen_tokens)} tok, {tokens_per_sec:.1f} t/s, {eos_tag}): {gen_text.strip()[:65]}...")
        print(f"       -> Matched concepts: {matched} | 3-gram rep: {rep_rate:.1%}\n")

    summary = {
        "model_path": onnx_path,
        "model_size_mb": round(file_size_mb, 2),
        "total_test_queries": len(TEST_QUESTIONS),
        "category_counts": {
            "English": sum(1 for q in TEST_QUESTIONS if q["category"] == "English"),
            "Sinhala": sum(1 for q in TEST_QUESTIONS if q["category"] == "Sinhala"),
            "Mixed": sum(1 for q in TEST_QUESTIONS if q["category"] == "Mixed"),
        },
        "clean_eos_stop_rate": round(clean_eos_count / len(TEST_QUESTIONS), 4),
        "mean_3gram_repetition": round(float(np.mean(repetition_rates)), 4),
        "total_generated_tokens": total_tokens,
        "total_elapsed_seconds": round(total_time, 3),
        "mean_generation_latency_seconds": round(total_time / len(TEST_QUESTIONS), 3),
        "mean_tokens_per_second": round(total_tokens / max(0.001, total_time), 1),
        "concept_match_rate": round(sum(1 for r in results if r["concept_match_success"]) / len(results), 4),
        "results": results,
    }

    out_file = os.path.join(model_dir, "acceptance_test_neural_outputs.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print("=" * 72)
    print(" NEURAL ACCEPTANCE TEST SUMMARY")
    print(f" Total Queries: {len(TEST_QUESTIONS)} (10 English, 10 Sinhala, 10 Mixed)")
    print(f" Clean EOS Stop Rate: {summary['clean_eos_stop_rate']:.1%}")
    print(f" Mean 3-gram Repetition: {summary['mean_3gram_repetition']:.2%}")
    print(f" Concept Match Rate: {summary['concept_match_rate']:.1%}")
    print(f" Mean Generation Speed: {summary['mean_tokens_per_second']:.1f} tokens/sec")
    print(f" Output written to: {out_file}")
    print("=" * 72)

    return summary


if __name__ == "__main__":
    run_neural_acceptance_test()
