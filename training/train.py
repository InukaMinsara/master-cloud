"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Model Training Pipeline from Random Initialization.

Trains MasterAiCore on our proprietary corpus with:
- AdamW optimizer
- Cosine learning rate scheduling
- Gradient clipping
- Validation loss & perplexity tracking
- Checkpoint persistence
"""

import json
import math
import os
import sys
import time
import torch
from torch.utils.data import DataLoader, random_split

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.tokenizer import MasterAiTokenizer
from training.model import MasterAiConfig, MasterAiCore
from training.dataset import ORIGINAL_CORPUS, MasterAiCorpusDataset


def train_master_ai(
    epochs: int = 25,
    batch_size: int = 4,
    learning_rate: float = 6e-4,
    d_model: int = 256,
    n_layers: int = 6,
    n_heads: int = 4,
    max_seq_len: int = 128,
    output_dir: str = "models/master-ai-core",
):
    print("=" * 60)
    print(" MASTER CLOUD — MASTER AI ORIGINAL TRAINING PIPELINE")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Device: {device}")
    if device.type == "cuda":
        print(f"[*] GPU Name: {torch.cuda.get_device_name(0)}")
        print(f"[*] VRAM Available: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")

    os.makedirs(output_dir, exist_ok=True)

    # 1. Train or load custom Tokenizer
    print("\n[1/5] Training custom Byte-Level Subword Tokenizer from scratch...")
    tokenizer = MasterAiTokenizer(vocab_size=1024)
    tokenizer.train_from_corpus(ORIGINAL_CORPUS, max_vocab=1024)
    tokenizer.save(output_dir)
    print(f"  ✓ Tokenizer vocabulary trained: {tokenizer.vocab_size} tokens")

    # 2. Build Dataset
    print("\n[2/5] Preparing training and validation datasets...")
    dataset = MasterAiCorpusDataset(ORIGINAL_CORPUS, tokenizer, max_seq_len=max_seq_len)
    val_size = max(1, int(len(dataset) * 0.15))
    train_size = len(dataset) - val_size
    train_set, val_set = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False)
    print(f"  ✓ Total dataset samples: {len(dataset)} (Train: {train_size}, Val: {val_size})")

    # 3. Initialize Model Architecture with Random Weights
    print("\n[3/5] Initializing MasterAiCore Transformer with random weights...")
    config = MasterAiConfig(
        vocab_size=tokenizer.vocab_size,
        d_model=d_model,
        n_layers=n_layers,
        n_heads=n_heads,
        d_ff=d_model * 4,
        max_seq_len=max_seq_len,
        dropout=0.1,
        tie_weights=True,
    )

    model = MasterAiCore(config).to(device)
    num_params = model.count_parameters()
    print(f"  ✓ Model initialized. Total Trainable Parameters: {num_params:,} ({num_params / 1e6:.2f}M)")

    # Save model architecture configuration
    config_path = os.path.join(output_dir, "config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config.__dict__, f, indent=2)

    # 4. Setup Optimizer & Scheduler
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    # 5. Training Loop
    print(f"\n[4/5] Training for {epochs} epochs...")
    history = []
    best_val_loss = float("inf")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)

            optimizer.zero_grad()
            _, loss = model(x, targets=y)
            loss.backward()

            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item()

        train_loss /= max(1, len(train_loader))
        scheduler.step()

        # Validation pass
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                _, loss = model(x, targets=y)
                val_loss += loss.item()

        val_loss /= max(1, len(val_loader))
        perplexity = math.exp(min(val_loss, 20))  # cap to prevent overflow

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "perplexity": round(perplexity, 2),
            "lr": round(optimizer.param_groups[0]["lr"], 6),
        })

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            checkpoint_path = os.path.join(output_dir, "checkpoint_best.pt")
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

    # Save training metrics report
    report_path = os.path.join(output_dir, "training_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": "MasterAiCore",
            "parameters": num_params,
            "epochs": epochs,
            "total_time_seconds": round(total_time, 2),
            "best_val_loss": round(best_val_loss, 4),
            "final_perplexity": round(history[-1]["perplexity"], 2),
            "history": history,
        }, f, indent=2)

    # 6. Test Autoregressive Text Generation
    print("\n[5/5] Testing autoregressive generation with trained weights...")
    test_prompts = [
        "User: How do I pause or play a video? Assistant:",
        "User: How do I open the 10-Band Equalizer? Assistant:",
        "User: MasterAI යනු කුමක්ද? Assistant:",
    ]

    for p in test_prompts:
        prompt_tokens = tokenizer.encode(p, add_bos=True, add_eos=False)
        inp = torch.tensor([prompt_tokens], dtype=torch.long, device=device)
        out_tokens = model.generate(inp, max_new_tokens=40, temperature=0.6, eos_id=tokenizer.EOS_ID)
        generated_text = tokenizer.decode(out_tokens[0].tolist(), skip_special=True)
        print(f"\n  [PROMPT]: {p}")
        print(f"  [GENERATED]: {generated_text.strip()}")

    return model, tokenizer, config


if __name__ == "__main__":
    train_master_ai()
