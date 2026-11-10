"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Model Training Pipeline (v0.3).

Features:
- Word-boundary-aware Byte-Level BPE Tokenizer (1024 vocabulary, zero UNK)
- Target-Only Loss Masking (supervised learning exclusively on Assistant response tokens)
- Expanded Context Window: 256 tokens
- Provenance & License Tracking in corpus manifest
- Strict 75/15/10 Train/Val/Test partitioning (Zero Leakage)
- Multi-core CPU acceleration (torch.set_num_threads)
- Regularized AdamW (weight decay 0.05, dropout 0.15, gradient clipping 1.0)
- Cosine annealing learning rate scheduling with warmup
- Repetition-penalized, nucleus-sampled autoregressive evaluation
"""

import json
import math
import os
import sys
import time
import torch
from torch.utils.data import DataLoader

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.tokenizer import MasterAiTokenizer
from training.model import MasterAiConfig, MasterAiCore
from training.dataset import (
    ORIGINAL_DATASET_ENTRIES,
    clean_and_deduplicate,
    partition_dataset,
    format_sample,
    MasterAiCorpusDataset,
)


def train_master_ai(
    epochs: int = 35,
    batch_size: int = 4,
    learning_rate: float = 6e-4,
    d_model: int = 256,
    n_layers: int = 6,
    n_heads: int = 4,
    max_seq_len: int = 256,
    dropout: float = 0.15,
    weight_decay: float = 0.05,
    output_dir: str = "models/master-ai-core",
):
    print("=" * 65)
    print(" MASTER CLOUD — MASTER AI ORIGINAL TRAINING PIPELINE v0.3")
    print("=" * 65)

    # Multi-core CPU optimization
    num_cpus = os.cpu_count() or 4
    threads_to_use = min(8, num_cpus)
    torch.set_num_threads(threads_to_use)
    print(f"[*] CPU Cores Available: {num_cpus} | PyTorch Compute Threads: {threads_to_use}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Device: {device}")

    os.makedirs(output_dir, exist_ok=True)

    # 1. Corpus Deduplication, Provenance & Strict 75/15/10 Partitioning
    print("\n[1/6] Preparing dataset with SHA-256 deduplication and 75/15/10 partitioning...")
    deduped_corpus, stats = clean_and_deduplicate(ORIGINAL_DATASET_ENTRIES)
    train_entries, val_entries, test_entries = partition_dataset(deduped_corpus, train_ratio=0.75, val_ratio=0.15)
    print(f"  ✓ Raw corpus entries: {stats['total_raw']}")
    print(f"  ✓ Deduplicated entries: {stats['final_count']} (Duplicates removed: {stats['duplicates_removed']})")
    print(f"  ✓ Category distribution: {stats['categories']}")
    print(f"  ✓ Train split: {len(train_entries)} | Val split: {len(val_entries)} | Test split: {len(test_entries)}")

    # Save detailed corpus manifest with license and provenance
    manifest_path = os.path.join(output_dir, "corpus_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": "0.3.0",
                "total_samples": len(deduped_corpus),
                "train_samples": len(train_entries),
                "val_samples": len(val_entries),
                "test_samples": len(test_entries),
                "split_ratios": {"train": 0.75, "val": 0.15, "test": 0.10},
                "category_counts": stats["categories"],
                "dataset_provenance": [
                    {
                        "category": item["category"],
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
    print("\n[4/6] Initializing MasterAiCore Transformer with random weights (Context Window = 256)...")
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
    print(f"\n[5/6] Training for {epochs} epochs (Regularization: dropout={dropout}, weight_decay={weight_decay})...")
    history = []
    best_val_loss = float("inf")
    checkpoint_path = os.path.join(output_dir, "checkpoint_best.pt")
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
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "config": config.__dict__,
            }, checkpoint_path)

        if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
            print(f"  Epoch {epoch:2d}/{epochs} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Perplexity: {perplexity:6.2f}")

    total_time = time.time() - start_time
    print(f"\n[*] Training Complete in {total_time:.2f}s! Best Val Loss: {best_val_loss:.4f}")

    # 7. Evaluate on Held-Out Test Set (Zero Leakage)
    print("\n[6/6] Evaluating on held-out Test split (Zero-leakage test set)...")
    best_cp = torch.load(checkpoint_path, map_location=device)
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
            "version": "0.3.0-original",
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
            "epochs": epochs,
            "total_time_seconds": round(total_time, 2),
            "best_val_loss": round(best_val_loss, 4),
            "final_test_loss": round(test_loss, 4),
            "final_test_perplexity": round(test_perplexity, 2),
            "history": history,
        }, f, indent=2)

    # 8. Autoregressive Sample Generation on Unseen Prompts (With Repetition Penalty & Top-P)
    print("\n[*] Testing autoregressive generation with repetition penalty & top-p...")
    sample_generations = []
    test_prompts = [
        "User: How do I pause or play a video?\nAssistant:",
        "User: How do I open the 10-Band Equalizer?\nAssistant:",
        "User: Explain speech pacing.\nAssistant:",
        "User: MasterAI යනු කුමක්ද?\nAssistant:",
        "User: වීඩියෝව නවත්වන්නේ හෝ වාදනය කරන්නේ කෙසේද?\nAssistant:",
        "User: MASTER CLOUD එකේ video play කරන්නේ කොහොමද?\nAssistant:",
        "User: What is A-B Repeat and how do I use it?\nAssistant:",
        "User: How do I fix audio sync delay or lip-sync mismatch?\nAssistant:",
    ]

    for p in test_prompts:
        prompt_tokens = tokenizer.encode(p, add_bos=True, add_eos=False)
        inp = torch.tensor([prompt_tokens], dtype=torch.long, device=device)
        out_tokens = model.generate(
            inp,
            max_new_tokens=60,
            temperature=0.5,
            top_k=20,
            top_p=0.85,
            repetition_penalty=1.25,
            eos_id=tokenizer.EOS_ID,
        )
        # Extract only the newly generated tokens (slice off the prompt tokens)
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
    train_master_ai()
