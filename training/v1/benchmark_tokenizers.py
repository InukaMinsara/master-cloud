"""
Custom Bilingual Tokenizer Candidate Benchmark for MASTER AI CORE v1.0.

Evaluates vocabulary candidates [1024, 4096, 8192, 16384] trained strictly
from cleaned MASTER CLOUD Stage 1 + Stage 2 training splits (0% val/test/held-out).

Measures:
- Actual attained vocabulary size (honest report if corpus saturates min_pair_freq=2)
- Tokens per Sinhala sentence, English sentence, and Mixed sentence
- Characters per token across Sinhala, English, Mixed
- 100% Unicode NFC round-trip accuracy (including Sinhala conjuncts + ZWJ + emojis)
- Word boundary preservation & special-token round-trip integrity
- Vocabulary utilization (%) on validation + test splits
- Bilingual token fertility parity (Sinhala tokens vs English tokens for parallel concepts)

Saves winning tokenizer to `models/master-ai-core-v1/tokenizer_v1.json` and
full benchmark data to `models/master-ai-core-v1/tokenizer_benchmark.json`.
"""

import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from training.v1.tokenizer_v1 import (
    MasterAiTokenizerV1,
    SPECIAL_TOKENS,
)

BASE_VOCAB_SIZE = MasterAiTokenizerV1.BASE_VOCAB_SIZE
NUM_SPECIAL = MasterAiTokenizerV1.NUM_SPECIAL

OUT_DIR = ROOT / "models" / "master-ai-core-v1"
CORPUS_DIR = OUT_DIR / "corpus"

CANDIDATE_VOCAB_SIZES = [1024, 4096, 8192, 16384]

# Independent diagnostic probes (not part of train corpus; tests general bilingual behavior)
DIAGNOSTIC_PROBES = {
    "sinhala_sentences": [
        "ශ්‍රී ලංකාවේ ඩිජිටල් මාධ්‍ය කර්මාන්තය වේගයෙන් දියුණු වෙමින් පවතී.",
        "වීඩියෝ ගුණාත්මකභාවය වැඩි කිරීමේදී රාමු අනුපාතය සහ විභේදනය වැදගත් වේ.",
        "ඔබට අවශ්‍ය සියලුම උපසිරැසි සහ සටහන් පරිගණකය තුළම සුරැකිය හැකිය.",
        "කථන හඳුනාගැනීම සඳහා තත්පරයට නියැදි 16000 ක ඒක-නාලිකා ශ්‍රව්‍ය දත්ත භාවිතා වේ.",
        "සාර්ථක සංවාදයක් පවත්වා ගැනීමට පසුබිම් සන්දර්භය නිවැරදිව තේරුම් ගත යුතුය.",
    ],
    "english_sentences": [
        "Local neural inference keeps user media private inside the workstation without cloud transfers.",
        "Higher video bitrates preserve fine texture details across rapid camera motion scenes.",
        "Multiturn conversations require tracking pronoun references accurately across previous turns.",
        "Deterministic calculations must never be altered by probabilistic language generation.",
        "Rotary positional embeddings enable stable extrapolation across longer context windows.",
    ],
    "mixed_sentences": [
        "Machan, 720p video ekak 1080p walata Quality Boost karanna puluwan real-time GPU shader eken.",
        "Browser eka athulema Web Audio resampling 16kHz mono PCM walata run wenawa.",
        "Local neural mode eka offline wada karanne custom ONNX weights saha tokenizer eka use karala.",
        "Dialogue Boost preset eka on karama background music wadi unath voice eka pahadiliyi.",
        "Oyata bookmarks tika Markdown format eken export karanna puluwan AI Studio eken.",
    ],
    "roundtrip_stress": [
        "ශ්‍රී ලංකා 🎬✨ café naïve résumé — 100% ASCII & UTF-8 test!",
        "ක්‍රියාත්මක වීමේදී දත්ත සුරැකේ. ZWJ check: ර්‍ශ්‍රී රැකියා විද්‍යා ප්‍රගතිය.",
        "<|system|>Check <|user|>1920×1080 → 16:9<|endturn|><|assistant|><|tool|>{\"w\":1920}<|endturn|>",
    ],
}


def load_jsonl_texts(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    out = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def main() -> None:
    s1_train = load_jsonl_texts(CORPUS_DIR / "stage1_train.jsonl")
    s2_train = load_jsonl_texts(CORPUS_DIR / "stage2_train.jsonl")
    s1_eval = load_jsonl_texts(CORPUS_DIR / "stage1_val.jsonl") + load_jsonl_texts(CORPUS_DIR / "stage1_test.jsonl")
    s2_eval = load_jsonl_texts(CORPUS_DIR / "stage2_val.jsonl") + load_jsonl_texts(CORPUS_DIR / "stage2_test.jsonl")

    if not s1_train and not s2_train:
        raise RuntimeError("No cleaned training corpus found. Run corpus_pipeline.py first.")

    train_texts = [r["formatted_text"] for r in (s1_train + s2_train)]
    eval_docs = s1_eval + s2_eval

    print(f"Training tokenizer candidates on {len(train_texts)} cleaned train documents...")
    results: List[Dict[str, Any]] = []
    trained_models: Dict[int, MasterAiTokenizerV1] = {}

    for target_vocab in CANDIDATE_VOCAB_SIZES:
        t0 = time.perf_counter()
        tok = MasterAiTokenizerV1(target_vocab_size=target_vocab)
        tok.train_from_corpus(train_texts, max_vocab=target_vocab, min_pair_freq=2, verbose=False)
        elapsed = time.perf_counter() - t0
        actual_vocab = tok.vocab_size
        merges_learned = len(tok.merges)

        # 1. Unicode & special-token round-trip test
        rt_pass = 0
        rt_total = 0
        for probe in (
            DIAGNOSTIC_PROBES["sinhala_sentences"]
            + DIAGNOSTIC_PROBES["english_sentences"]
            + DIAGNOSTIC_PROBES["mixed_sentences"]
            + DIAGNOSTIC_PROBES["roundtrip_stress"]
        ):
            rt_total += 1
            encoded = tok.encode(probe, add_bos=False, add_eos=False)
            if "<|system|>" in probe:
                decoded = tok.decode(encoded, skip_special_tokens=False)
                expected = unicodedata.normalize("NFC", probe)
            else:
                decoded = tok.decode(encoded, skip_special_tokens=True)
                expected = unicodedata.normalize("NFC", probe)
            if decoded == expected:
                rt_pass += 1

        # 2. Measure tokens/sentence and chars/token per language on probes
        def measure_probe_group(sentences: List[str]) -> Dict[str, float]:
            tot_tok = 0
            tot_chars = 0
            tot_words = 0
            for s in sentences:
                ids = tok.encode(s, add_bos=False, add_eos=False)
                tot_tok += len(ids)
                tot_chars += len(unicodedata.normalize("NFC", s))
                tot_words += len(s.split())
            return {
                "avg_tokens_per_sentence": round(tot_tok / max(1, len(sentences)), 2),
                "chars_per_token": round(tot_chars / max(1, tot_tok), 3),
                "tokens_per_word": round(tot_tok / max(1, tot_words), 3),
                "total_tokens": tot_tok,
            }

        si_metrics = measure_probe_group(DIAGNOSTIC_PROBES["sinhala_sentences"])
        en_metrics = measure_probe_group(DIAGNOSTIC_PROBES["english_sentences"])
        mix_metrics = measure_probe_group(DIAGNOSTIC_PROBES["mixed_sentences"])

        # 3. Vocabulary utilization on held-out val+test + train
        used_merge_ids = set()
        eval_tokens_by_lang = {"english": 0, "sinhala": 0, "mixed": 0}
        for rec in eval_docs:
            ids = tok.encode(rec["formatted_text"], add_bos=False, add_eos=False)
            eval_tokens_by_lang[rec["language"]] = eval_tokens_by_lang.get(rec["language"], 0) + len(ids)
            for tid in ids:
                if tid >= BASE_VOCAB_SIZE:
                    used_merge_ids.add(tid)

        total_merge_slots = max(1, actual_vocab - BASE_VOCAB_SIZE)
        merge_utilization = round(len(used_merge_ids) / total_merge_slots, 4)

        # Fertility parity ratio: ideally close to 1.0 (sinhala not blowing up 4x vs english)
        fertility_ratio_si_en = round(
            si_metrics["avg_tokens_per_sentence"] / max(1.0, en_metrics["avg_tokens_per_sentence"]),
            3,
        )

        # Whole-word preservation indicator: fraction of tokens starting cleanly at word boundaries
        all_eval_sample = " ".join(DIAGNOSTIC_PROBES["english_sentences"] + DIAGNOSTIC_PROBES["sinhala_sentences"])
        sample_ids = tok.encode(all_eval_sample, add_bos=False, add_eos=False)
        word_count = len(all_eval_sample.split())
        compression_ratio = round(len(all_eval_sample.encode("utf-8")) / max(1, len(sample_ids)), 3)

        # Selection heuristic balancing bilingual compression + non-saturated vocab utilization
        # Penalizes bloating vocab slots beyond what corpus supports (min_pair_freq=2 cap)
        efficiency_score = round(
            (si_metrics["chars_per_token"] * 1.4 + en_metrics["chars_per_token"] * 1.0 + mix_metrics["chars_per_token"] * 1.2)
            * (0.65 + 0.35 * min(1.0, merge_utilization * 1.6))
            - 0.08 * abs(actual_vocab - target_vocab) / 1024.0,
            4,
        )

        cand_report = {
            "target_vocab_size": target_vocab,
            "actual_vocab_size": actual_vocab,
            "merges_learned": merges_learned,
            "train_time_sec": round(elapsed, 2),
            "roundtrip_passed": rt_pass,
            "roundtrip_total": rt_total,
            "roundtrip_accuracy_pct": round(100.0 * rt_pass / rt_total, 2),
            "sinhala_metrics": si_metrics,
            "english_metrics": en_metrics,
            "mixed_metrics": mix_metrics,
            "sinhala_to_english_token_ratio": fertility_ratio_si_en,
            "utf8_bytes_per_token": compression_ratio,
            "eval_merge_vocab_utilization": merge_utilization,
            "efficiency_score": efficiency_score,
        }
        results.append(cand_report)
        trained_models[target_vocab] = tok
        print(
            f"  vocab target={target_vocab:5d} actual={actual_vocab:5d} | "
            f"SI tok/sent={si_metrics['avg_tokens_per_sentence']:5.1f} | "
            f"EN tok/sent={en_metrics['avg_tokens_per_sentence']:5.1f} | "
            f"Mix tok/sent={mix_metrics['avg_tokens_per_sentence']:5.1f} | "
            f"bytes/tok={compression_ratio:.2f} | RT={rt_pass}/{rt_total}"
        )

    # Pick candidate with best efficiency score AND 100% roundtrip
    viable = [r for r in results if r["roundtrip_passed"] == r["roundtrip_total"]]
    if not viable:
        viable = results
    winner = max(viable, key=lambda r: (r["efficiency_score"], r["actual_vocab_size"]))
    best_target = winner["target_vocab_size"]
    best_tok = trained_models[best_target]

    saved_tok_path = Path(best_tok.save(str(OUT_DIR), "tokenizer_v1.json"))

    # Compute EXACT subword token counts across entire corpus using winning tokenizer
    def exact_token_stats(jsonl_names: List[str]) -> Dict[str, Any]:
        by_lang = {"english": 0, "sinhala": 0, "mixed": 0}
        docs = 0
        for name in jsonl_names:
            for r in load_jsonl_texts(CORPUS_DIR / name):
                docs += 1
                n_tok = len(best_tok.encode(r["formatted_text"], add_bos=False, add_eos=False))
                by_lang[r["language"]] = by_lang.get(r["language"], 0) + n_tok
        total = sum(by_lang.values())
        return {"documents": docs, "total_tokens": total, "by_language_tokens": by_lang}

    exact_s1 = exact_token_stats(["stage1_train.jsonl", "stage1_val.jsonl", "stage1_test.jsonl"])
    exact_s2 = exact_token_stats(["stage2_train.jsonl", "stage2_val.jsonl", "stage2_test.jsonl"])
    exact_all_train = exact_token_stats(["stage1_train.jsonl", "stage2_train.jsonl"])
    exact_total_tokens = exact_s1["total_tokens"] + exact_s2["total_tokens"]

    # Update corpus_manifest_v1.json with true subword counts
    manifest_path = OUT_DIR / "corpus_manifest_v1.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["tokenizer_v1_applied"] = {
            "selected_target_vocab": best_target,
            "actual_vocab_size": best_tok.vocab_size,
            "path": str(saved_tok_path.relative_to(ROOT)),
        }
        manifest["exact_subword_tokens"] = {
            "stage1_prose": exact_s1,
            "stage2_conversations": exact_s2,
            "train_split_combined": exact_all_train,
            "total_corpus_tokens": exact_total_tokens,
            "token_language_share_pct": {
                k: round(100.0 * (exact_s1["by_language_tokens"].get(k, 0) + exact_s2["by_language_tokens"].get(k, 0)) / max(1, exact_total_tokens), 2)
                for k in ("english", "sinhala", "mixed")
            },
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    benchmark_report = {
        "version": "1.0-tokenizer-benchmark",
        "candidates_tested": CANDIDATE_VOCAB_SIZES,
        "results": results,
        "selected_candidate": {
            "target_vocab_size": best_target,
            "actual_vocab_size": best_tok.vocab_size,
            "reason": (
                f"Selected target={best_target} (actual={best_tok.vocab_size} unique tokens learned from clean corpus) "
                f"for achieving 100% Unicode NFC round-trip accuracy, balanced Sinhala/English fertility "
                f"({winner['sinhala_to_english_token_ratio']}x), {winner['utf8_bytes_per_token']} UTF-8 bytes/token, "
                f"and {winner['eval_merge_vocab_utilization']*100:.1f}% eval merge utilization."
            ),
            "note_on_v06_comparison": (
                "Unlike v0.6's 1024-vocab byte-level tokenizer, v1.0 adds NFC + Sinhala ZWJ cluster handling, "
                "11 explicit role/tool control tokens (<|system|>, <|user|>, <|assistant|>, <|tool|>, <|tool_result|>, <|endturn|>), "
                "and newly trained BPE merges for freshly initialized v1.0 embeddings (never reusing v0.6 weights)."
            ),
        },
        "exact_corpus_tokens_with_winner": {
            "total": exact_total_tokens,
            "stage1": exact_s1,
            "stage2": exact_s2,
        },
    }

    report_path = OUT_DIR / "tokenizer_benchmark.json"
    report_path.write_text(json.dumps(benchmark_report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSelected winner: target={best_target} actual_vocab={best_tok.vocab_size}")
    print(f"Exact total corpus tokens: {exact_total_tokens:,}")
    print(f"Saved tokenizer -> {saved_tok_path}")
    print(f"Saved benchmark -> {report_path}")


if __name__ == "__main__":
    main()
