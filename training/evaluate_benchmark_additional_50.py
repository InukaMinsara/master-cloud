"""
MASTER CLOUD — 50-SCENARIO ADDITIONAL HELD-OUT GENERALIZATION BENCHMARK (v0.6)
Strict zero-leakage held-out evaluation on 50 unseen questions:
- 20 English scenarios (controls, audio, privacy, instructions)
- 15 Sinhala scenarios (controls, audio, privacy, instructions)
- 15 Mixed dialogue scenarios (colloquial technical support)

Evaluates transparent 7-metric rubric:
1. Answer Correctness (0-5)
2. Grammar (0-5)
3. Naturalness (0-5)
4. Relevance (0-5)
5. Instruction Following (0-5)
6. Factual Accuracy (0-5)
7. Complete Sentence Generation (Boolean)
"""

import os
import sys
import json
import torch
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.model import MasterAiConfig, MasterAiCore
from training.tokenizer import MasterAiTokenizer
from training.evaluate_benchmark_100 import calculate_3gram_repetition, evaluate_response_rubric


def run_additional_50_benchmark(
    checkpoint_dir: str = "models/master-ai-core",
    checkpoint_file: str = "checkpoint_best.pt",
    benchmark_file: str = "training/held_out_benchmark_additional_50.json",
    output_filename: str = "additional_50_eval_report.json",
    temperature: float = 0.45,
    top_k: int = 20,
    top_p: float = 0.85,
    repetition_penalty: float = 1.25,
    max_new_tokens: int = 85,
) -> Dict[str, Any]:
    print("=" * 65)
    print(" MASTER CLOUD — 50-SCENARIO ADDITIONAL HELD-OUT BENCHMARK (v0.6)")
    print(f" Sampling: T={temperature}, top_k={top_k}, top_p={top_p}, rep_pen={repetition_penalty}, max_new={max_new_tokens}")
    print("=" * 65)

    if not os.path.exists(benchmark_file):
        raise FileNotFoundError(f"Missing benchmark file: {benchmark_file}")

    with open(benchmark_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    # 1. Load Tokenizer
    tokenizer = MasterAiTokenizer()
    tokenizer.load(checkpoint_dir)

    # 2. Load Config & Model
    config_path = os.path.join(checkpoint_dir, "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)
    config = MasterAiConfig(**config_dict)

    device = torch.device("cpu")
    model = MasterAiCore(config).to(device)

    ckpt_path = os.path.join(checkpoint_dir, checkpoint_file)
    if not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"Checkpoint not found: {ckpt_path}")

    checkpoint = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    print(f"[*] Loaded model from {ckpt_path} ({model.count_parameters():,} parameters)")
    print(f"[*] Evaluating model on {len(prompts)} additional held-out unseen prompts...\n")

    eval_results = []
    total_rep_rate = 0.0
    total_eos_stops = 0
    total_keyword_matches = 0
    total_complete_sentences = 0

    sum_correctness = 0.0
    sum_grammar = 0.0
    sum_naturalness = 0.0
    sum_relevance = 0.0
    sum_instruction = 0.0
    sum_factual = 0.0

    for idx, item in enumerate(prompts):
        formatted_prompt = f"User: {item['prompt']}\nAssistant: "
        prompt_tokens = tokenizer.encode(formatted_prompt, add_bos=True, add_eos=False)
        inp = torch.tensor([prompt_tokens], dtype=torch.long, device=device)

        out_tokens = model.generate(
            inp,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            eos_id=tokenizer.EOS_ID,
        )

        all_token_ids = out_tokens[0].tolist()
        gen_token_ids = all_token_ids[len(prompt_tokens) :]
        gen_text = tokenizer.decode(gen_token_ids, skip_special=True).strip()

        stopped_on_eos = len(gen_token_ids) > 0 and gen_token_ids[-1] == tokenizer.EOS_ID
        if stopped_on_eos:
            total_eos_stops += 1

        rep_rate = calculate_3gram_repetition(gen_token_ids)
        total_rep_rate += rep_rate

        rubric = evaluate_response_rubric(
            gen_text,
            item["prompt"],
            item.get("expected_keywords", []),
            rep_rate,
            stopped_on_eos,
        )

        if rubric["matched_keywords"]:
            total_keyword_matches += 1
        if rubric["is_complete_sentence"]:
            total_complete_sentences += 1

        sum_correctness += rubric["correctness"]
        sum_grammar += rubric["grammar"]
        sum_naturalness += rubric["naturalness"]
        sum_relevance += rubric["relevance"]
        sum_instruction += rubric["instruction_following"]
        sum_factual += rubric["factual_accuracy"]

        entry = {
            "id": item["id"],
            "category": item["category"],
            "prompt": item["prompt"],
            "generated_response": gen_text,
            "tokens_generated": len(gen_token_ids),
            "stopped_on_eos": stopped_on_eos,
            "repetition_rate_3gram": round(rep_rate, 4),
            "expected_keywords": item.get("expected_keywords", []),
            "matched_keywords": rubric["matched_keywords"],
            "rubric_scores": {
                "correctness_0_to_5": rubric["correctness"],
                "grammar_0_to_5": rubric["grammar"],
                "naturalness_0_to_5": rubric["naturalness"],
                "relevance_0_to_5": rubric["relevance"],
                "instruction_following_0_to_5": rubric["instruction_following"],
                "factual_accuracy_0_to_5": rubric["factual_accuracy"],
                "is_complete_sentence": rubric["is_complete_sentence"],
            },
            "human_evaluation_note": rubric["human_evaluation_note"],
        }
        eval_results.append(entry)

        if (idx + 1) % 10 == 0 or idx == 0 or (idx + 1) == len(prompts):
            print(f"[{item['id']}] ({item['category']}):")
            print(f"  Q: {item['prompt']}")
            print(f"  A: {gen_text}")
            print(f"  Note: {rubric['human_evaluation_note']} | Rep: {rep_rate:.1%}\n")

    num_p = len(prompts)
    summary = {
        "benchmark_name": "MASTER CLOUD MasterAI Core 50-Scenario Additional Held-Out Benchmark",
        "model_version": "0.6.0",
        "checkpoint_evaluated": checkpoint_file,
        "sampling_parameters": {
            "temperature": temperature,
            "top_k": top_k,
            "top_p": top_p,
            "repetition_penalty": repetition_penalty,
            "max_new_tokens": max_new_tokens,
        },
        "total_prompts": num_p,
        "prompts_by_language": {
            "english": sum(1 for p in prompts if p["id"].startswith("add_en_")),
            "sinhala": sum(1 for p in prompts if p["id"].startswith("add_si_")),
            "mixed": sum(1 for p in prompts if p["id"].startswith("add_mix_")),
        },
        "metrics": {
            "average_3gram_repetition_rate": round(total_rep_rate / num_p, 4),
            "clean_eos_stop_percentage": round((total_eos_stops / num_p) * 100, 2),
            "keyword_relevance_rate": round((total_keyword_matches / num_p) * 100, 2),
            "complete_sentence_generation_rate": round((total_complete_sentences / num_p) * 100, 2),
        },
        "rubric_averages_0_to_5": {
            "correctness": round(sum_correctness / num_p, 2),
            "grammar": round(sum_grammar / num_p, 2),
            "naturalness": round(sum_naturalness / num_p, 2),
            "relevance": round(sum_relevance / num_p, 2),
            "instruction_following": round(sum_instruction / num_p, 2),
            "factual_accuracy": round(sum_factual / num_p, 2),
        },
        "all_responses": eval_results,
    }

    out_path = os.path.join(checkpoint_dir, output_filename)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"[*] 50-Scenario Evaluation Complete! Report written to {out_path}")
    print(f"  Average 3-gram repetition: {summary['metrics']['average_3gram_repetition_rate']:.2%}")
    print(f"  Clean EOS stop rate: {summary['metrics']['clean_eos_stop_percentage']}%")
    print(f"  Keyword relevance hit rate: {summary['metrics']['keyword_relevance_rate']}%")
    print(f"  Complete sentence rate: {summary['metrics']['complete_sentence_generation_rate']}%")
    print(f"  Rubric Averages: Grammar={summary['rubric_averages_0_to_5']['grammar']}/5, Relevance={summary['rubric_averages_0_to_5']['relevance']}/5, Factual={summary['rubric_averages_0_to_5']['factual_accuracy']}/5")

    return summary


if __name__ == "__main__":
    ckpt_arg = sys.argv[1] if len(sys.argv) > 1 else "checkpoint_best.pt"
    run_additional_50_benchmark(checkpoint_file=ckpt_arg)
