"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Byte-Level Subword Tokenizer Implementation from Scratch.

Zero external dependencies. No pre-trained downloads.
Implements a true Byte-Level BPE (Byte Pair Encoding) tokenizer:
- 5 Special tokens (<pad>, <unk>, <bos>, <eos>, <sep>)
- 256 Raw byte tokens (0x00 to 0xFF) ensuring 100% vocabulary coverage
- Zero UNK tokens on any arbitrary UTF-8 input (English, Sinhala, Emoji, Math, Asian scripts)
- Lossless roundtrip string reconstruction: decode(encode(text)) == text
"""

import json
import os
from typing import Dict, List, Tuple, Optional, Set


class MasterAiTokenizer:
    SPECIAL_TOKENS = ["<pad>", "<unk>", "<bos>", "<eos>", "<sep>"]
    PAD_ID = 0
    UNK_ID = 1
    BOS_ID = 2
    EOS_ID = 3
    SEP_ID = 4
    NUM_SPECIAL = 5
    NUM_BASE_BYTES = 256

    def __init__(self, vocab_size: int = 1024):
        self.target_vocab_size = vocab_size
        self.id_to_bytes: Dict[int, bytes] = {}
        self.bytes_to_id: Dict[bytes, int] = {}
        self.merges: List[Tuple[int, int, int]] = []  # (id1, id2, new_id)
        self.merge_ranks: Dict[Tuple[int, int], int] = {}
        self._init_base_vocab()

    def _init_base_vocab(self):
        """Initialize the 5 special tokens and all 256 individual byte tokens."""
        self.id_to_bytes = {}
        self.bytes_to_id = {}
        self.merges = []
        self.merge_ranks = {}

        # Special tokens (mapped to empty bytes for identification)
        for idx in range(self.NUM_SPECIAL):
            self.id_to_bytes[idx] = b""

        # Base 256 bytes: Token IDs 5 through 260
        for b in range(self.NUM_BASE_BYTES):
            tid = self.NUM_SPECIAL + b
            byte_val = bytes([b])
            self.id_to_bytes[tid] = byte_val
            self.bytes_to_id[byte_val] = tid

    @property
    def vocab_size(self) -> int:
        return len(self.id_to_bytes)

    def train_from_corpus(self, texts: List[str], max_vocab: int = 1024):
        """
        Train BPE merges directly from a corpus of texts.
        Converts text to UTF-8 byte token IDs and iteratively merges frequent adjacent pairs.
        """
        self.target_vocab_size = max_vocab
        self._init_base_vocab()

        # Convert each text to a list of base byte token IDs
        sequences: List[List[int]] = []
        for text in texts:
            raw_bytes = text.encode("utf-8")
            if not raw_bytes:
                continue
            seq = [self.NUM_SPECIAL + b for b in raw_bytes]
            sequences.append(seq)

        next_id = self.NUM_SPECIAL + self.NUM_BASE_BYTES  # 261

        while len(self.id_to_bytes) < self.target_vocab_size:
            # Count pair frequencies across all sequences
            pair_counts: Dict[Tuple[int, int], int] = {}
            for seq in sequences:
                for i in range(len(seq) - 1):
                    pair = (seq[i], seq[i + 1])
                    pair_counts[pair] = pair_counts.get(pair, 0) + 1

            if not pair_counts:
                break

            best_pair, count = max(pair_counts.items(), key=lambda kv: kv[1])
            if count < 2:
                # Stop if no pair occurs at least twice
                break

            id1, id2 = best_pair
            new_id = next_id
            next_id += 1

            merged_bytes = self.id_to_bytes[id1] + self.id_to_bytes[id2]
            self.id_to_bytes[new_id] = merged_bytes
            self.bytes_to_id[merged_bytes] = new_id

            rank = len(self.merges)
            self.merges.append((id1, id2, new_id))
            self.merge_ranks[best_pair] = rank

            # Replace best_pair in all sequences
            new_sequences: List[List[int]] = []
            for seq in sequences:
                new_seq: List[int] = []
                i = 0
                while i < len(seq):
                    if i < len(seq) - 1 and (seq[i], seq[i + 1]) == best_pair:
                        new_seq.append(new_id)
                        i += 2
                    else:
                        new_seq.append(seq[i])
                        i += 1
                new_sequences.append(new_seq)
            sequences = new_sequences

    def encode(self, text: str, add_bos: bool = True, add_eos: bool = True) -> List[int]:
        """
        Encode string into token IDs.
        Guaranteed to have zero <unk> tokens for any valid UTF-8 string.
        """
        if not text:
            tokens: List[int] = []
            if add_bos:
                tokens.append(self.BOS_ID)
            if add_eos:
                tokens.append(self.EOS_ID)
            return tokens

        raw_bytes = text.encode("utf-8")
        tokens = [self.NUM_SPECIAL + b for b in raw_bytes]

        # Apply BPE merges iteratively by rank
        while len(tokens) >= 2:
            # Find eligible merge with lowest rank
            best_rank = float("inf")
            best_pair: Optional[Tuple[int, int]] = None
            best_new_id: Optional[int] = None

            for i in range(len(tokens) - 1):
                pair = (tokens[i], tokens[i + 1])
                if pair in self.merge_ranks:
                    rank = self.merge_ranks[pair]
                    if rank < best_rank:
                        best_rank = rank
                        best_pair = pair
                        best_new_id = self.merges[rank][2]

            if best_pair is None or best_new_id is None:
                break

            # Replace occurrences of best_pair
            merged_tokens: List[int] = []
            i = 0
            while i < len(tokens):
                if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best_pair:
                    merged_tokens.append(best_new_id)
                    i += 2
                else:
                    merged_tokens.append(tokens[i])
                    i += 1
            tokens = merged_tokens

        res: List[int] = []
        if add_bos:
            res.append(self.BOS_ID)
        res.extend(tokens)
        if add_eos:
            res.append(self.EOS_ID)
        return res

    def decode(self, token_ids: List[int], skip_special: bool = True) -> str:
        """
        Decode token IDs back to a UTF-8 string.
        Concatenates underlying byte buffers and decodes losslessly.
        """
        byte_chunks: List[bytes] = []
        special_ids = {self.PAD_ID, self.UNK_ID, self.BOS_ID, self.EOS_ID, self.SEP_ID}

        for tid in token_ids:
            if skip_special and tid in special_ids:
                continue
            if tid in self.id_to_bytes:
                byte_chunks.append(self.id_to_bytes[tid])

        full_bytes = b"".join(byte_chunks)
        return full_bytes.decode("utf-8", errors="replace")

    def has_unk(self, token_ids: List[int]) -> bool:
        """Checks if any UNK tokens exist in token sequence."""
        return any(tid == self.UNK_ID for tid in token_ids)

    def save(self, directory: str):
        """Save vocabulary, merges, and metadata to disk."""
        os.makedirs(directory, exist_ok=True)
        vocab_path = os.path.join(directory, "vocab.json")
        merges_path = os.path.join(directory, "merges.json")
        meta_path = os.path.join(directory, "tokenizer_meta.json")

        # Serialized vocab mapping: token_id -> hex representation and human-readable preview
        vocab_dict = {}
        for tid, b in self.id_to_bytes.items():
            if tid < self.NUM_SPECIAL:
                vocab_dict[str(tid)] = {
                    "token": self.SPECIAL_TOKENS[tid],
                    "hex": "",
                    "is_special": True,
                }
            else:
                try:
                    text_repr = b.decode("utf-8")
                except UnicodeDecodeError:
                    text_repr = f"<bytes:{b.hex()}>"
                vocab_dict[str(tid)] = {
                    "token": text_repr,
                    "hex": b.hex(),
                    "is_special": False,
                }

        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump(vocab_dict, f, ensure_ascii=False, indent=2)

        with open(merges_path, "w", encoding="utf-8") as f:
            json.dump(self.merges, f, indent=2)

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "type": "MasterAiTrueByteLevelBPE",
                    "vocab_size": len(self.id_to_bytes),
                    "base_bytes": self.NUM_BASE_BYTES,
                    "num_merges": len(self.merges),
                    "special_tokens": {
                        "pad": self.PAD_ID,
                        "unk": self.UNK_ID,
                        "bos": self.BOS_ID,
                        "eos": self.EOS_ID,
                        "sep": self.SEP_ID,
                    },
                    "lossless_utf8": True,
                    "author": "MASTER CLOUD AI Research Team",
                },
                f,
                indent=2,
            )

    def load(self, directory: str):
        """Load vocabulary and merges from disk."""
        vocab_path = os.path.join(directory, "vocab.json")
        merges_path = os.path.join(directory, "merges.json")

        self._init_base_vocab()

        if os.path.exists(merges_path):
            with open(merges_path, "r", encoding="utf-8") as f:
                raw_merges = json.load(f)
                self.merges = [tuple(m) for m in raw_merges]
                self.merge_ranks = {(m[0], m[1]): idx for idx, m in enumerate(self.merges)}

        if os.path.exists(vocab_path):
            with open(vocab_path, "r", encoding="utf-8") as f:
                vocab_dict = json.load(f)
                for tid_str, info in vocab_dict.items():
                    tid = int(tid_str)
                    hex_str = info.get("hex", "")
                    if hex_str:
                        b = bytes.fromhex(hex_str)
                        self.id_to_bytes[tid] = b
                        self.bytes_to_id[b] = tid
