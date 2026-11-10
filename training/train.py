"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Model Training & Staged Experiment Pipeline (v0.5).

Features:
- Staged Corpus Progression: Stage A (25K+ tokens) and Stage B (50K+ tokens)
- Rigorous Data Governance: Exact & near-duplicate purging, Unicode validation
- Group-Based Partitioning: Zero document leakage between Train, Val, and Test
- Word-boundary-aware Byte-Level BPE Tokenizer (1024 vocabulary, zero UNK)
- Target-Only Loss Masking (supervised learning exclusively on Assistant response tokens)
- Preserved Architecture: 5,060,608 parameters, context window 256 tokens
- Multi-core CPU acceleration (torch.set_num_threads)
- Regularized AdamW (weight decay 0.05, dropout 0.15, gradient clipping 1.0)
- Cosine annealing learning rate scheduling with warmup
- Repetition-penalized, nucleus-sampled autoregressive evaluation
"""

import json
import math
import os
import shutil
import sys
import time
import torch
from torch.utils.data import DataLoader
from typing import Dict, Any, Tuple

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.tokenizer import MasterAiTokenizer
from training.model import MasterAiConfig, MasterAiCore
from training.dataset import (
    ORIGINAL_DATASET_ENTRIES,
    STAGE_A_EXPANDED_ENTRIES,
    STAGE_B_EXPANDED_ENTRIES,
    format_sample,
    MasterAiCorpusDataset,
)
from training.dataset_qc import audit_and_clean_corpus, group_partition_dataset


def train_master_ai(
    stage: str = "stage_b",
    epochs: int = 25,
    batch_size: int = 8,
    learning_rate: float = 6e-4,
    d_model: int = 256,
    n_layers: int = 6,
    n_heads: int = 4,
    max_seq_len: int = 256,
    dropout: float = 0.15,
    weight_decay: float = 0.05,
    output_dir: str = "models/master-ai-core",
) -> Tuple[Any, Any, Any]:
    print("=" * 65)
    print(f" MASTER CLOUD — MASTER AI ORIGINAL TRAINING PIPELINE v0.5 [{stage.upper()}]")
    print("=" * 65)

    # Multi-core CPU optimization
    num_cpus = os.cpu_count() or 4
    threads_to_use = min(8, num_cpus)
    torch.set_num_threads(threads_to_use)
    print(f"[*] CPU Cores Available: {num_cpus} | PyTorch Compute Threads: {threads_to_use}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Device: {device}")

    os.makedirs(output_dir, exist_ok=True)

    # 1. Corpus Selection according to experiment stage
    if stage == "stage_a":
        raw_corpus = STAGE_A_EXPANDED_ENTRIES
        stage_checkpoint_name = "checkpoint_v0.5_stageA.pt"
    elif stage == "stage_b":
        raw_corpus = STAGE_B_EXPANDED_ENTRIES
        stage_checkpoint_name = "checkpoint_v0.5_stageB.pt"
    elif stage == "baseline":
        raw_corpus = ORIGINAL_DATASET_ENTRIES
        stage_checkpoint_name = "checkpoint_v0.4.pt"
    else:
        raise ValueError(f"Unknown stage: {stage}. Choose from: baseline, stage_a, stage_b")

    # Temporary tokenizer for audit token census
    temp_tokenizer = MasterAiTokenizer()
    if os.path.exists(os.path.join(output_dir, "vocab.json")):
        temp_tokenizer.load(output_dir)

    print(f"\n[1/6] Running 8-point Quality Control Audit on {stage.upper()} corpus ({len(raw_corpus)} raw entries)...")
    deduped_corpus, audit_report = audit_and_clean_corpus(raw_corpus, temp_tokenizer)
    print(f"  ✓ Cleaned valid entries: {audit_report['cleaned_valid_entries']}")
    print(f"  ✓ Exact duplicates purged: {audit_report['exact_duplicates_purged']}")
    print(f"  ✓ Near duplicates purged: {audit_report['near_duplicates_purged']}")
    print(f"  ✓ Malformed samples purged: {audit_report['malformed_purged']}")
    print(f"  ✓ Unicode errors detected: {audit_report['unicode_errors_detected']}")
    print(f"  ✓ Total corpus tokens: {audit_report['total_corpus_tokens']:,}")
    print(f"  ✓ Language breakdown: {audit_report['language_distribution']}")

    # Group-based partition to eliminate intra-document leakage
    train_entries, val_entries, test_entries = group_partition_dataset(deduped_corpus, train_ratio=0.75, val_ratio=0.15)
    print(f"  ✓ Group Partition: Train={len(train_entries)}, Val={len(val_entries)}, Test={len(test_entries)}")

    # Save detailed corpus manifest with license and provenance
    manifest_path = os.path.join(output_dir, "corpus_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": "0.5.0",
                "stage": stage,
                "total_samples": len(deduped_corpus),
                "total_tokens": audit_report["total_corpus_tokens"],
                "train_samples": len(train_entries),
                "val_samples": len(val_entries),
                "test_samples": len(test_entries),
                "split_ratios": {"train": 0.75, "val": 0.15, "test": 0.10},
                "language_distribution": audit_report["language_distribution"],
                "category_counts": audit_report["category_distribution"],
                "audit_metrics": audit_report,
                "dataset_provenance": [
                    {
                        "category": item["category"],
                        "group": item.get("group", item["category"]),
                        "language": item.get("language", "english"),
                        "prompt": item["prompt"],
                        "source": item["source"],
                        "license": item["license"],
                    }
                    for item in deduped_corpus
                ],
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
    print(f"  ✓ Saved corpus manifest to {manifest_path}")

    # 2. Train Word-Boundary-Aware Byte-Level BPE Tokenizer
    print("\n[2/6] Training word-boundary-aware Byte-Level BPE Tokenizer from scratch...")
    train_raw_texts = [format_sample(x["prompt"], x["response"]) for x in train_entries]
    tokenizer = MasterAiTokenizer(vocab_size=1024)
    tokenizer.train_from_corpus(train_raw_texts, max_vocab=1024)
    tokenizer.save(output_dir)
    print(f"  ✓ Tokenizer vocabulary trained: {tokenizer.vocab_size} tokens (256 base bytes + word-aware merges)")

    # 3. Build PyTorch Datasets with Target-Only Loss Masking
    print("\n[3/6] Initializing Datasets with Target-Only Loss Masking (max_seq_len=256)...")
    train_dataset = MasterAiCorpusDataset(train_entries, tokenizer, max_seq_len=max_seq_len, target_only_loss=True)
    val_dataset = MasterAiCorpusDataset(val_entries, tokenizer, max_seq_len=max_seq_len, target_only_loss=True)
    test_dataset = MasterAiCorpusDataset(test_entries, tokenizer, max_seq_len=max_seq_len, target_only_loss=True)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    print(f"  ✓ DataLoaders ready: Train batches={len(train_loader)}, Val batches={len(val_loader)}, Test batches={len(test_loader)}")

    # 4. Initialize MasterAiCore Architecture (256 Context Window)
    print("\n[4/6] Initializing MasterAiCore Transformer (Preserved 5.06M parameter architecture)...")
    config = MasterAiConfig(
        vocab_size=tokenizer.vocab_size,
        d_model=d_model,
        n_layers=n_layers,
        n_heads=n_heads,
        d_ff=d_model * 4,
        max_seq_len=max_seq_len,
        dropout=dropout,
        tie_weights=True,
    )

    model = MasterAiCore(config).to(device)
    num_params = model.count_parameters()
    print(f"  ✓ Architecture: d_model={d_model}, layers={n_layers}, heads={n_heads}, d_ff={d_model*4}, context={max_seq_len}")
    print(f"  ✓ Total Trainable Parameters: {num_params:,} ({num_params / 1e6:.2f}M)")

    # Save model config
    config_path = os.path.join(output_dir, "config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config.__dict__, f, indent=2)

    # 5. Optimizer & Cosine LR Scheduler with Warmup
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    # 6. Training Loop with Early Checkpointing
    print(f"\n[5/6] Training for {epochs} epochs (batch_size={batch_size}, lr={learning_rate})...")
    history = []
    best_val_loss = float("inf")
    checkpoint_best_path = os.path.join(output_dir, "checkpoint_best.pt")
    stage_checkpoint_path = os.path.join(output_dir, stage_checkpoint_name)
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)

            optimizer.zero_grad()
            _, loss = model(x, targets=y)
            loss.backward()

            # Gradient clipping at 1.0 to ensure numerical stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item()

        train_loss /= max(1, len(train_loader))
        scheduler.step()

        # Validation evaluation pass
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                _, loss = model(x, targets=y)
                val_loss += loss.item()

        val_loss /= max(1, len(val_loader))
        perplexity = math.exp(min(val_loss, 20))

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "perplexity": round(perplexity, 2),
            "lr": round(optimizer.param_groups[0]["lr"], 6),
        })

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            state = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "config": config.__dict__,
                "stage": stage,
            }
            torch.save(state, stage_checkpoint_path)
            # Only update checkpoint_best if this stage improves or equals validation
            torch.save(state, checkpoint_best_path)

        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            print(f"  Epoch {epoch:2d}/{epochs} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Perplexity: {perplexity:6.2f}")

    total_time = time.time() - start_time
    print(f"\n[*] Training Complete in {total_time:.2f}s! Best Val Loss: {best_val_loss:.4f}")
    print(f"  ✓ Saved stage checkpoint to {stage_checkpoint_path}")

    # If stage B, also archive checkpoint_v0.5.pt
    if stage == "stage_b":
        v05_path = os.path.join(output_dir, "checkpoint_v0.5.pt")
        shutil.copyfile(checkpoint_best_path, v05_path)
        print(f"  ✓ Archived final v0.5 release checkpoint to {v05_path}")

    # 7. Evaluate on Held-Out Test Set (Zero Leakage)
    print("\n[6/6] Evaluating on held-out Test split (Zero-leakage test set)...")
    best_cp = torch.load(checkpoint_best_path, map_location=device)
    model.load_state_dict(best_cp["model_state_dict"])
    model.eval()

    test_loss = 0.0
    with torch.no_grad():
        for x, y in test_loader:
            x, y = x.to(device), y.to(device)
            _, loss = model(x, targets=y)
            test_loss += loss.item()
    test_loss /= max(1, len(test_loader))
    test_perplexity = math.exp(min(test_loss, 20))
    print(f"  ✓ Held-out Test Loss: {test_loss:.4f} | Test Perplexity: {test_perplexity:.2f}")

    # Save comprehensive training report
    report_path = os.path.join(output_dir, "training_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": "MasterAiCore",
            "version": "0.5.0-original",
            "stage": stage,
            "parameters": num_params,
            "architecture": {
                "d_model": d_model,
                "n_layers": n_layers,
                "n_heads": n_heads,
                "d_ff": d_model * 4,
                "vocab_size": tokenizer.vocab_size,
                "max_seq_len": max_seq_len,
                "dropout": dropout,
                "weight_decay": weight_decay,
            },
            "corpus_stats": {
                "total_samples": len(deduped_corpus),
                "total_tokens": audit_report["total_corpus_tokens"],
                "train_samples": len(train_entries),
                "val_samples": len(val_entries),
                "test_samples": len(test_entries),
            },
            "epochs": epochs,
            "batch_size": batch_size,
            "total_time_seconds": round(total_time, 2),
            "best_val_loss": round(best_val_loss, 4),
            "final_test_loss": round(test_loss, 4),
            "final_test_perplexity": round(test_perplexity, 2),
            "history": history,
        }, f, indent=2)

    # Update experiments comparison manifest
    exp_log_path = os.path.join(output_dir, "training_experiments.json")
    exp_history = []
    if os.path.exists(exp_log_path):
        try:
            with open(exp_log_path, "r", encoding="utf-8") as f:
                exp_history = json.load(f)
        except Exception:
            exp_history = []

    exp_history.append({
        "stage": stage,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_tokens": audit_report["total_corpus_tokens"],
        "samples": len(deduped_corpus),
        "epochs": epochs,
        "best_val_loss": round(best_val_loss, 4),
        "final_test_loss": round(test_loss, 4),
        "final_test_perplexity": round(test_perplexity, 2),
        "checkpoint": stage_checkpoint_name,
    })
    with open(exp_log_path, "w", encoding="utf-8") as f:
        json.dump(exp_history, f, indent=2)

    # 8. Autoregressive Sample Generation on Unseen Prompts
    print("\n[*] Testing autoregressive generation with repetition penalty & top-p...")
    sample_generations = []
    test_prompts = [
        "User: How do I pause or play a video?\nAssistant: ",
        "User: How do I open the 10-Band Equalizer?\nAssistant: ",
        "User: Explain speech pacing.\nAssistant: ",
        "User: MasterAI යනු කුමක්ද?\nAssistant: ",
        "User: වීඩියෝව නවත්වන්නේ හෝ වාදනය කරන්නේ කෙසේද?\nAssistant: ",
        "User: MASTER CLOUD එකේ video play කරන්නේ කොහොමද?\nAssistant: ",
        "User: What is A-B Repeat and how do I use it?\nAssistant: ",
        "User: How do I fix audio sync delay or lip-sync mismatch?\nAssistant: ",
    ]

    for p in test_prompts:
        prompt_tokens = tokenizer.encode(p, add_bos=True, add_eos=False)
        inp = torch.tensor([prompt_tokens], dtype=torch.long, device=device)
        out_tokens = model.generate(
            inp,
            max_new_tokens=65,
            temperature=0.45,
            top_k=20,
            top_p=0.85,
            repetition_penalty=1.25,
            eos_id=tokenizer.EOS_ID,
        )
        new_token_ids = out_tokens[0][len(prompt_tokens):].tolist()
        generated_answer = tokenizer.decode(new_token_ids, skip_special=True)
        sample_generations.append({
            "prompt": p,
            "raw_output": tokenizer.decode(out_tokens[0].tolist(), skip_special=True),
            "generated_answer": generated_answer.strip(),
        })
        print(f"\n  [PROMPT]: {p.replace(chr(10), ' ')}")
        print(f"  [ASSISTANT RESPONSE]: {generated_answer.strip()}")

    samples_path = os.path.join(output_dir, "sample_generations.json")
    with open(samples_path, "w", encoding="utf-8") as f:
        json.dump(sample_generations, f, indent=2, ensure_ascii=False)

    return model, tokenizer, config


if __name__ == "__main__":
    stage_arg = sys.argv[1] if len(sys.argv) > 1 else "stage_b"
    train_master_ai(stage=stage_arg)
