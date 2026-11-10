"""
Test script for MasterAiTokenizer (True Byte-Level BPE).
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from training.tokenizer import MasterAiTokenizer

def test_tokenizer():
    tok = MasterAiTokenizer(vocab_size=512)
    sample_corpus = [
        "User: Who are you? Assistant: I am MasterAI Core.",
        "User: How to play video? Assistant: Press Spacebar or K.",
        "User: MasterAI යනු කුමක්ද? Assistant: MasterAI යනු MASTER CLOUD සඳහා විශේෂිත බුද්ධි පද්ධතියකි.",
    ]
    tok.train_from_corpus(sample_corpus, max_vocab=400)
    print(f"Base vocab + merges size: {tok.vocab_size}")

    test_strings = [
        "Hello World! Testing MasterAI Core tokenizer.",
        "සැකසුම් සහ වීඩියෝ මාස්ටර් ක්ලවුඩ් (Sinhala script test with modifiers ් ා ැ ෑ ි ී ු ූ)",
        "Emojis: 🎬 🤖 🚀 🔥 ✨ 💡 🎧 📊",
        "Mathematics & symbols: ∀x ∈ ℝ, e^{iπ} + 1 = 0, ∑_{i=1}^n x_i",
        "Multilingual: Español, Français, Deutsch, Русский, 日本語, 한국어, العربية",
    ]

    for s in test_strings:
        tokens = tok.encode(s, add_bos=False, add_eos=False)
        assert not tok.has_unk(tokens), f"Failed: UNK found in tokens for: {s}"
        reconstructed = tok.decode(tokens, skip_special=True)
        assert reconstructed == s, f"Failed roundtrip! Original: '{s}', Reconstructed: '{reconstructed}'"
        print(f"  ✓ Passed ({len(tokens)} tokens, 0 UNK, exact roundtrip match): {s[:40]}...")

    print("\n[ALL TOKENIZER TESTS PASSED PERFECTLY]")

if __name__ == "__main__":
    test_tokenizer()
