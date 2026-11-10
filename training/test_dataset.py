import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.dataset import ORIGINAL_DATASET_ENTRIES, clean_and_deduplicate, partition_dataset, MasterAiCorpusDataset
from training.tokenizer import MasterAiTokenizer

def test_dataset():
    deduped, stats = clean_and_deduplicate(ORIGINAL_DATASET_ENTRIES)
    train_set, val_set, test_set = partition_dataset(deduped)

    print("Corpus categories:", stats["categories"])
    print(f"Total: {stats['final_count']} | Train: {len(train_set)} | Val: {len(val_set)} | Test: {len(test_set)}")

    tok = MasterAiTokenizer(vocab_size=1024)
    train_texts = [f"User: {x['prompt']}\nAssistant: {x['response']}" for x in train_set]
    tok.train_from_corpus(train_texts, max_vocab=1024)

    ds = MasterAiCorpusDataset(train_set, tok, max_seq_len=256, target_only_loss=True)
    x, y = ds[0]
    print(f"Sample 0 - x.shape: {x.shape}, y.shape: {y.shape}")
    num_masked = (y == -100).sum().item()
    num_targets = (y != -100).sum().item()
    print(f"Target-Only Loss Masking: Masked labels (-100): {num_masked}, Active supervised targets: {num_targets}")
    assert num_targets > 0, "No active supervised target tokens found!"
    assert (y[:3] == -100).all(), "Prompt tokens were not masked with -100!"
    print("✓ Target-Only Loss Masking successfully verified!")

if __name__ == "__main__":
    test_dataset()
