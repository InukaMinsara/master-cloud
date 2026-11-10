"""
MASTER CLOUD — MASTER AI ORIGINAL
Held-Out Generalization Evaluation Suite (v0.3).

Evaluates the trained model on 10 completely unseen questions across:
- English question answering
- Sinhala question answering
- Sinhala-English mixed dialogue
- Short explanations and technical advice
- Multi-sentence responses
- Logical reasoning tasks
- Conversational follow-ups

Measures and records:
- Response text
- Token count
- Repetition ratio (3-gram uniqueness)
- EOS stopping adherence
- Correctness and coherence scoring
- Honest failure and limitation analysis
"""

import os
import sys
import json
import torch

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.model import MasterAiConfig, MasterAiCore
from training.tokenizer import MasterAiTokenizer


HELD_OUT_EVAL_PROMPTS = [
    {
        "id": "eval_01_en_qa",
        "category": "English Q&A",
        "prompt": "User: What does the audio equalizer do in MASTER CLOUD?\nAssistant:",
        "expected_topics": ["frequencies", "sound", "10-band", "audio"],
    },
    {
        "id": "eval_02_en_hotkey",
        "category": "English Hotkey",
        "prompt": "User: Can you tell me which button toggles fullscreen mode?\nAssistant:",
        "expected_topics": ["F", "fullscreen"],
    },
    {
        "id": "eval_03_en_reasoning",
        "category": "Mathematical Reasoning",
        "prompt": "User: A video is 20 minutes long and has 2000 words. What is its speech rate?\nAssistant:",
        "expected_topics": ["100", "WPM", "words per minute"],
    },
    {
        "id": "eval_04_si_qa",
        "category": "Sinhala Q&A",
        "prompt": "User: MASTER CLOUD එකෙන් වීඩියෝවක් play කරන්නේ කොහොමද?\nAssistant:",
        "expected_topics": ["Spacebar", "K", "යතුර"],
    },
    {
        "id": "eval_05_si_tech",
        "category": "Sinhala Technical",
        "prompt": "User: ශබ්ද ප්‍රමාදය හදාගන්නේ කෙසේද?\nAssistant:",
        "expected_topics": ["Audio Delay", "Web Audio Studio", "මිලි තත්පර"],
    },
    {
        "id": "eval_06_mixed_subs",
        "category": "Mixed Dialogue Subtitles",
        "prompt": "User: මට video එකේ subtitles customize කරගන්න ඕන, ඒකට shortcut key එක මොකක්ද?\nAssistant:",
        "expected_topics": ["C", "Subtitle Studio"],
    },
    {
        "id": "eval_07_mixed_pip",
        "category": "Mixed Dialogue PiP",
        "prompt": "User: Background එකේ video එක float කරලා බලන්න පුළුවන්ද?\nAssistant:",
        "expected_topics": ["P", "Picture-in-Picture"],
    },
    {
        "id": "eval_08_multi_sentence",
        "category": "Multi-sentence Explanation",
        "prompt": "User: Explain the difference between 32Hz bass and 16kHz treble.\nAssistant:",
        "expected_topics": ["sub-bass", "high frequency", "rumble", "sparkle"],
    },
    {
        "id": "eval_09_reasoning_time",
        "category": "Navigation Reasoning",
        "prompt": "User: If I seek forward 10 seconds 4 times, how much time has advanced?\nAssistant:",
        "expected_topics": ["40", "seconds"],
    },
    {
        "id": "eval_10_conversation",
        "category": "Conversation Follow-up",
        "prompt": "User: I need help organizing my media library.\nAssistant:",
        "expected_topics": ["MasterAI", "media", "video"],
    },
]


def calculate_3gram_repetition(tokens: list) -> float:
    """Calculates the ratio of duplicate 3-grams in the token sequence."""
    if len(tokens) < 4:
        return 0.0
    ngrams = [tuple(tokens[i : i + 3]) for i in range(len(tokens) - 2)]
    unique_ngrams = set(ngrams)
    return 1.0 - (len(unique_ngrams) / len(ngrams))


def run_generalization_eval(
    checkpoint_dir: str = "models/master-ai-core",
    output_filename: str = "generalization_eval_report.json",
):
    print("=" * 65)
    print(" MASTER CLOUD — HELD-OUT GENERALIZATION EVALUATION")
    print("=" * 65)

    config_path = os.path.join(checkpoint_dir, "config.json")
    checkpoint_path = os.path.join(checkpoint_dir, "checkpoint_best.pt")

    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)
    config = MasterAiConfig(**config_dict)

    tokenizer = MasterAiTokenizer()
    tokenizer.load(checkpoint_dir)

    model = MasterAiCore(config)
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    eval_results = []
    total_repetition_rate = 0.0

    print(f"[*] Testing {len(HELD_OUT_EVAL_PROMPTS)} held-out evaluation scenarios...\n")

    for item in HELD_OUT_EVAL_PROMPTS:
        prompt_str = item["prompt"]
        prompt_tokens = tokenizer.encode(prompt_str, add_bos=True, add_eos=False)
        inp = torch.tensor([prompt_tokens], dtype=torch.long)

        out_tokens = model.generate(
            inp,
            max_new_tokens=70,
            temperature=0.5,
            top_k=20,
            top_p=0.85,
            repetition_penalty=1.3,
            eos_id=tokenizer.EOS_ID,
        )

        all_token_ids = out_tokens[0].tolist()
        gen_token_ids = all_token_ids[len(prompt_tokens) :]
        gen_text = tokenizer.decode(gen_token_ids, skip_special=True).strip()

        # Check clean EOS stop
        stopped_on_eos = len(gen_token_ids) > 0 and gen_token_ids[-1] == tokenizer.EOS_ID

        # Measure 3-gram repetition
        rep_rate = calculate_3gram_repetition(gen_token_ids)
        total_repetition_rate += rep_rate

        # Topic relevance
        text_lower = gen_text.lower()
        matched_topics = [t for t in item["expected_topics"] if t.lower() in text_lower]
        has_relevance = len(matched_topics) > 0

        # Analysis of output quality
        is_coherent = len(gen_text) > 10 and rep_rate < 0.35
        result_entry = {
            "id": item["id"],
            "category": item["category"],
            "prompt": item["prompt"],
            "generated_response": gen_text,
            "tokens_generated": len(gen_token_ids),
            "stopped_on_eos": stopped_on_eos,
            "repetition_rate_3gram": round(rep_rate, 4),
            "matched_topics": matched_topics,
            "has_relevance": has_relevance,
            "is_coherent": is_coherent,
        }
        eval_results.append(result_entry)

        print(f"[{item['id']}] ({item['category']}):")
        print(f"  Prompt: {item['prompt'].replace(chr(10), ' ')}")
        print(f"  Response: {gen_text}")
        print(f"  Tokens: {len(gen_token_ids)} | 3-gram Repetition: {rep_rate:.2%} | Matched: {matched_topics}\n")

    avg_rep_rate = total_repetition_rate / len(HELD_OUT_EVAL_PROMPTS)

    summary = {
        "evaluation_name": "MasterAiCore Held-Out Generalization Evaluation",
        "version": "0.3.0",
        "total_scenarios": len(HELD_OUT_EVAL_PROMPTS),
        "average_repetition_rate": round(avg_rep_rate, 4),
        "results": eval_results,
    }

    report_path = os.path.join(checkpoint_dir, output_filename)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"[*] Generalization evaluation report saved to {report_path}")
    return summary


if __name__ == "__main__":
    run_generalization_eval()
