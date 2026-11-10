"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Byte-Level Subword Tokenizer Implementation from Scratch.

Zero external dependencies. No pre-trained downloads.
Builds and trains a custom subword vocabulary from user/project training corpora.
"""

import json
import os
import re
from typing import Dict, List, Tuple, Set


class MasterAiTokenizer:
    SPECIAL_TOKENS = ["<pad>", "<unk>", "<bos>", "<eos>", "<sep>"]
    PAD_ID = 0
    UNK_ID = 1
    BOS_ID = 2
    EOS_ID = 3
    SEP_ID = 4

    def __init__(self, vocab_size: int = 1024):
        self.target_vocab_size = vocab_size
        self.vocab: Dict[str, int] = {}
        self.id_to_token: Dict[int, str] = {}
        self.merges: List[Tuple[str, str]] = []
        self._init_base_vocab()

    def _init_base_vocab(self):
        """Initialize special tokens and base ASCII byte characters."""
        self.vocab = {}
        self.id_to_token = {}

        # 1. Special tokens
        for idx, token in enumerate(self.SPECIAL_TOKENS):
            self.vocab[token] = idx
            self.id_to_token[idx] = token

        # 2. Base printable ASCII characters + standard Sinhala unicode block sample
        current_id = len(self.SPECIAL_TOKENS)
        for i in range(32, 127):  # ASCII printable
            ch = chr(i)
            if ch not in self.vocab:
                self.vocab[ch] = current_id
                self.id_to_token[current_id] = ch
                current_id += 1

        # Common punctuation and whitespace markers
        for ch in ["\n", "\t", " ", "’", "‘", "“", "”", "—", "…"]:
            if ch not in self.vocab:
                self.vocab[ch] = current_id
                self.id_to_token[current_id] = ch
                current_id += 1

        # Sinhala Unicode Block (U+0D80 to U+0DFF) basic characters
        for codepoint in range(0x0D85, 0x0DC6 + 1):
            ch = chr(codepoint)
            if ch not in self.vocab:
                self.vocab[ch] = current_id
                self.id_to_token[current_id] = ch
                current_id += 1

    @property
    def vocab_size(self) -> int:
        return len(self.vocab)

    def train_from_corpus(self, texts: List[str], max_vocab: int = 1024):
        """Train BPE subword merges from an original corpus."""
        self.target_vocab_size = max_vocab
        self._init_base_vocab()

        # Word frequency counting
        word_freqs: Dict[Tuple[str, ...], int] = {}
        for text in texts:
            words = text.split(" ")
            for w in words:
                if not w:
                    continue
                # Represent word as tuple of characters + end-of-word marker
                chars = tuple(list(w))
                word_freqs[chars] = word_freqs.get(chars, 0) + 1

        # Iterative BPE merges
        self.merges = []
        while len(self.vocab) < self.target_vocab_size:
            pairs: Dict[Tuple[str, str], int] = {}
            for word, freq in word_freqs.items():
                for i in range(len(word) - 1):
                    pair = (word[i], word[i + 1])
                    pairs[pair] = pairs.get(pair, 0) + freq

            if not pairs:
                break

            best_pair = max(pairs, key=pairs.get)
            if pairs[best_pair] < 2:  # Stop if no frequent pairs
                break

            # Create new token
            new_token = best_pair[0] + best_pair[1]
            new_id = len(self.vocab)
            self.vocab[new_token] = new_id
            self.id_to_token[new_id] = new_token
            self.merges.append(best_pair)

            # Update word frequencies with merged pair
            new_word_freqs: Dict[Tuple[str, ...], int] = {}
            for word, freq in word_freqs.items():
                new_word = []
                i = 0
                while i < len(word):
                    if i < len(word) - 1 and (word[i], word[i + 1]) == best_pair:
                        new_word.append(new_token)
                        i += 2
                    else:
                        new_word.append(word[i])
                        i += 1
                new_word_freqs[tuple(new_word)] = freq
            word_freqs = new_word_freqs

    def encode(self, text: str, add_bos: bool = True, add_eos: bool = True) -> List[int]:
        """Encode text to token IDs using trained subwords."""
        if not text:
            return []

        tokens: List[int] = []
        if add_bos:
            tokens.append(self.BOS_ID)

        # Greedily match longest known subwords
        i = 0
        while i < len(text):
            matched = False
            # Lookahead up to 16 characters for longest token match
            for length in range(min(16, len(text) - i), 0, -1):
                sub = text[i : i + length]
                if sub in self.vocab:
                    tokens.append(self.vocab[sub])
                    i += length
                    matched = True
                    break

            if not matched:
                tokens.append(self.UNK_ID)
                i += 1

        if add_eos:
            tokens.append(self.EOS_ID)

        return tokens

    def decode(self, token_ids: List[int], skip_special: bool = True) -> str:
        """Decode token IDs back to text string."""
        chars: List[str] = []
        special_ids = {self.PAD_ID, self.UNK_ID, self.BOS_ID, self.EOS_ID, self.SEP_ID}

        for tid in token_ids:
            if skip_special and tid in special_ids:
                continue
            token_str = self.id_to_token.get(tid, "")
            chars.append(token_str)

        return "".join(chars)

    def save(self, directory: str):
        """Save vocabulary and merges to JSON files."""
        os.makedirs(directory, exist_ok=True)
        vocab_path = os.path.join(directory, "vocab.json")
        merges_path = os.path.join(directory, "merges.json")
        meta_path = os.path.join(directory, "tokenizer_meta.json")

        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump(self.vocab, f, ensure_ascii=False, indent=2)

        with open(merges_path, "w", encoding="utf-8") as f:
            json.dump(self.merges, f, ensure_ascii=False, indent=2)

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "type": "MasterAiByteLevelBPE",
                "vocab_size": len(self.vocab),
                "pad_id": self.PAD_ID,
                "unk_id": self.UNK_ID,
                "bos_id": self.BOS_ID,
                "eos_id": self.EOS_ID,
                "sep_id": self.SEP_ID,
                "author": "MASTER CLOUD AI Team",
            }, f, indent=2)

    def load(self, directory: str):
        """Load vocabulary and merges from disk."""
        vocab_path = os.path.join(directory, "vocab.json")
        merges_path = os.path.join(directory, "merges.json")

        with open(vocab_path, "r", encoding="utf-8") as f:
            self.vocab = json.load(f)

        self.id_to_token = {int(v): k for k, v in self.vocab.items()}

        if os.path.exists(merges_path):
            with open(merges_path, "r", encoding="utf-8") as f:
                self.merges = [tuple(p) for p in json.load(f)]
