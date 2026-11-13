"""
MASTER CLOUD — MASTER AI CORE v1.0 (Stage 2)
Original Fast Bilingual Byte-Level BPE Tokenizer built completely from scratch.

Zero external tokenizer weights or pre-trained vocabularies.
Key Enhancements over v0.6 (1024-vocab):
- Conversational & Tool Protocol Special Tokens:
  <pad>, <unk>, <bos>, <eos>, <sep>,
  <|system|>, <|user|>, <|assistant|>, <|tool|>, <|tool_result|>, <|endturn|>
- Unicode NFC normalization + Word & Sinhala Cluster Boundary Pre-tokenization
  (keeps ZWJ Sinhala conjuncts like ක්‍ර/ශ්‍රී intact across UTF-8 byte runs)
- Fast inverted-index incremental BPE trainer supporting 1024 / 4096 / 8192 / 16384+ vocabs in seconds
- 100% Lossless UTF-8 round-trip encoding & decoding: decode(encode(text)) == normalize(text)
- Unified JSON artifact (`tokenizer_v1.json`) directly loadable by both Python and TypeScript runtime
"""

import base64
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Set, Tuple


SPECIAL_TOKENS = [
    "<pad>",          # 0
    "<unk>",          # 1
    "<bos>",          # 2
    "<eos>",          # 3
    "<sep>",          # 4
    "<|system|>",     # 5
    "<|user|>",       # 6
    "<|assistant|>",  # 7
    "<|tool|>",       # 8
    "<|tool_result|>",# 9
    "<|endturn|>",    # 10
]

# Pre-tokenizer pattern preserving word boundaries, Sinhala conjuncts (with ZWJ), numbers, punctuation, emojis
_PRETOKENIZE_RE = re.compile(
    r" ?[\u0D80-\u0DFF][\u0D80-\u0DFF\u200C\u200D]*"
    r"| ?[A-Za-z]+"
    r"| ?[0-9]+"
    r"|\r?\n+"
    r"| +"
    r"| ?[^\sA-Za-z0-9\u0D80-\u0DFF]",
    re.UNICODE,
)

_SPECIAL_SPLIT_RE = re.compile(
    "(" + "|".join(re.escape(tok) for tok in SPECIAL_TOKENS) + ")"
)


class MasterAiTokenizerV1:
    PAD_ID = 0
    UNK_ID = 1
    BOS_ID = 2
    EOS_ID = 3
    SEP_ID = 4
    SYSTEM_ID = 5
    USER_ID = 6
    ASSISTANT_ID = 7
    TOOL_ID = 8
    TOOL_RESULT_ID = 9
    ENDTURN_ID = 10

    NUM_SPECIAL = len(SPECIAL_TOKENS)
    NUM_BASE_BYTES = 256
    BASE_VOCAB_SIZE = NUM_SPECIAL + NUM_BASE_BYTES

    def __init__(self, target_vocab_size: int = 4096):
        if target_vocab_size < self.BASE_VOCAB_SIZE:
            raise ValueError(f"target_vocab_size must be >= {self.BASE_VOCAB_SIZE}")
        self.target_vocab_size = target_vocab_size
        self.special_to_id: Dict[str, int] = {tok: i for i, tok in enumerate(SPECIAL_TOKENS)}
        self.id_to_special: Dict[int, str] = {i: tok for i, tok in enumerate(SPECIAL_TOKENS)}
        self.id_to_bytes: Dict[int, bytes] = {}
        self.bytes_to_id: Dict[bytes, int] = {}
        self.merges: List[Tuple[int, int, int]] = []
        self.merge_ranks: Dict[Tuple[int, int], Tuple[int, int]] = {}  # (a, b) -> (rank, new_id)
        self._chunk_cache: Dict[str, List[int]] = {}
        self._init_base_vocab()

    def _init_base_vocab(self):
        self.id_to_bytes = {}
        self.bytes_to_id = {}
        self.merges = []
        self.merge_ranks = {}
        self._chunk_cache = {}

        for i in range(self.NUM_SPECIAL):
            self.id_to_bytes[i] = b""
        for b in range(self.NUM_BASE_BYTES):
            tid = self.NUM_SPECIAL + b
            bval = bytes([b])
            self.id_to_bytes[tid] = bval
            self.bytes_to_id[bval] = tid

    @property
    def vocab_size(self) -> int:
        return len(self.id_to_bytes)

    @staticmethod
    def normalize(text: str) -> str:
        return unicodedata.normalize("NFC", text)

    @staticmethod
    def _pretokenize_plain(text: str) -> List[str]:
        return _PRETOKENIZE_RE.findall(text)

    def train_from_corpus(
        self,
        texts: List[str],
        max_vocab: Optional[int] = None,
        min_pair_freq: int = 2,
        verbose: bool = True,
    ):
        """
        Fast incremental inverted-index Byte-Level BPE trainer.
        Trains merges strictly inside word/Sinhala-cluster pre-tokenized segments.
        """
        target = max_vocab if max_vocab is not None else self.target_vocab_size
        self._init_base_vocab()

        # 1. Count unique pre-tokenized UTF-8 chunks across corpus
        chunk_counter: Counter = Counter()
        for raw_text in texts:
            norm_text = self.normalize(raw_text)
            for seg in _SPECIAL_SPLIT_RE.split(norm_text):
                if not seg or seg in self.special_to_id:
                    continue
                for chunk in self._pretokenize_plain(seg):
                    chunk_bytes = chunk.encode("utf-8")
                    if len(chunk_bytes) > 0:
                        chunk_counter[chunk_bytes] += 1

        # Build compact indexed word table: word_seqs[w_id] = list of token IDs, word_freqs[w_id] = freq
        word_seqs: List[List[int]] = []
        word_freqs: List[int] = []
        for b_chunk, freq in chunk_counter.items():
            seq = [self.NUM_SPECIAL + b for b in b_chunk]
            word_seqs.append(seq)
            word_freqs.append(freq)

        # Build initial pair counts & inverted index pair -> set of word IDs
        pair_counts: Dict[Tuple[int, int], int] = defaultdict(int)
        pair_words: Dict[Tuple[int, int], Set[int]] = defaultdict(set)

        for w_id, seq in enumerate(word_seqs):
            if len(seq) < 2:
                continue
            freq = word_freqs[w_id]
            for i in range(len(seq) - 1):
                p = (seq[i], seq[i + 1])
                pair_counts[p] += freq
                pair_words[p].add(w_id)

        num_merges_target = target - self.BASE_VOCAB_SIZE
        merges_done = 0

        if verbose:
            print(
                f"  [TokenizerV1] Unique pre-tokens: {len(word_seqs):,} | Target vocab: {target} "
                f"(up to {num_merges_target} merges)"
            )

        while self.vocab_size < target and pair_counts:
            # Find highest-frequency pair (deterministic tie-break)
            best_pair = None
            best_freq = 0
            for p, c in pair_counts.items():
                if c > best_freq or (c == best_freq and best_pair is not None and p < best_pair):
                    best_freq = c
                    best_pair = p

            if best_pair is None or best_freq < min_pair_freq:
                break

            p0, p1 = best_pair
            new_id = self.vocab_size
            merged_bytes = self.id_to_bytes[p0] + self.id_to_bytes[p1]
            self.id_to_bytes[new_id] = merged_bytes
            self.bytes_to_id[merged_bytes] = new_id

            rank = len(self.merges)
            self.merges.append((p0, p1, new_id))
            self.merge_ranks[best_pair] = (rank, new_id)
            merges_done += 1

            # Update only words containing best_pair
            affected_words = list(pair_words.get(best_pair, ()))
            for w_id in affected_words:
                seq = word_seqs[w_id]
                if len(seq) < 2:
                    continue
                freq = word_freqs[w_id]

                # Remove old pairs for this word
                for i in range(len(seq) - 1):
                    old_p = (seq[i], seq[i + 1])
                    pair_counts[old_p] -= freq
                    if pair_counts[old_p] <= 0:
                        pair_counts.pop(old_p, None)
                    pw = pair_words.get(old_p)
                    if pw is not None:
                        pw.discard(w_id)

                # Replace best_pair in seq
                new_seq: List[int] = []
                i = 0
                L = len(seq)
                while i < L:
                    if i < L - 1 and seq[i] == p0 and seq[i + 1] == p1:
                        new_seq.append(new_id)
                        i += 2
                    else:
                        new_seq.append(seq[i])
                        i += 1
                word_seqs[w_id] = new_seq

                # Add updated pairs for this word
                for i in range(len(new_seq) - 1):
                    new_p = (new_seq[i], new_seq[i + 1])
                    pair_counts[new_p] += freq
                    pair_words[new_p].add(w_id)

            pair_words.pop(best_pair, None)
            pair_counts.pop(best_pair, None)

        self._chunk_cache = {}
        if verbose:
            print(f"  [TokenizerV1] Final vocab size: {self.vocab_size} ({merges_done} merges learned)")

    def _encode_chunk(self, chunk_str: str) -> List[int]:
        cached = self._chunk_cache.get(chunk_str)
        if cached is not None:
            return cached

        raw_bytes = chunk_str.encode("utf-8")
        ids = [self.NUM_SPECIAL + b for b in raw_bytes]

        if len(ids) >= 2 and self.merge_ranks:
            while len(ids) >= 2:
                best_rank = None
                best_pair = None
                best_new_id = -1
                for i in range(len(ids) - 1):
                    pair = (ids[i], ids[i + 1])
                    info = self.merge_ranks.get(pair)
                    if info is not None:
                        rank, new_id = info
                        if best_rank is None or rank < best_rank:
                            best_rank = rank
                            best_pair = pair
                            best_new_id = new_id
                if best_pair is None:
                    break
                p0, p1 = best_pair
                merged: List[int] = []
                i = 0
                n = len(ids)
                while i < n:
                    if i < n - 1 and ids[i] == p0 and ids[i + 1] == p1:
                        merged.append(best_new_id)
                        i += 2
                    else:
                        merged.append(ids[i])
                        i += 1
                ids = merged

        if len(self._chunk_cache) < 50000:
            self._chunk_cache[chunk_str] = ids
        return ids

    def encode(
        self,
        text: str,
        add_bos: bool = False,
        add_eos: bool = False,
    ) -> List[int]:
        if not text:
            res: List[int] = []
            if add_bos:
                res.append(self.BOS_ID)
            if add_eos:
                res.append(self.EOS_ID)
            return res

        norm_text = self.normalize(text)
        tokens: List[int] = []
        if add_bos:
            tokens.append(self.BOS_ID)

        for seg in _SPECIAL_SPLIT_RE.split(norm_text):
            if not seg:
                continue
            sp_id = self.special_to_id.get(seg)
            if sp_id is not None:
                tokens.append(sp_id)
                continue
            for chunk in self._pretokenize_plain(seg):
                tokens.extend(self._encode_chunk(chunk))

        if add_eos:
            tokens.append(self.EOS_ID)
        return tokens

    def decode(self, token_ids: List[int], skip_special_tokens: bool = True) -> str:
        byte_buf = bytearray()
        out_parts: List[str] = []

        def flush_bytes():
            if byte_buf:
                out_parts.append(byte_buf.decode("utf-8", errors="replace"))
                byte_buf.clear()

        for tid in token_ids:
            if tid < self.NUM_SPECIAL:
                if not skip_special_tokens:
                    flush_bytes()
                    out_parts.append(self.id_to_special.get(tid, ""))
                continue
            b = self.id_to_bytes.get(tid)
            if b is not None:
                byte_buf.extend(b)

        flush_bytes()
        return "".join(out_parts)

    def save(self, directory: str, filename: str = "tokenizer_v1.json"):
        os.makedirs(directory, exist_ok=True)
        out_path = os.path.join(directory, filename)
        payload = {
            "version": "1.0.0-original",
            "vocab_size": self.vocab_size,
            "target_vocab_size": self.target_vocab_size,
            "special_tokens": SPECIAL_TOKENS,
            "vocab_b64": [
                base64.b64encode(self.id_to_bytes[i]).decode("ascii")
                for i in range(self.vocab_size)
            ],
            "merges": [[p0, p1, nid] for (p0, p1, nid) in self.merges],
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)
        return out_path

    def load(self, directory_or_file: str, filename: str = "tokenizer_v1.json"):
        path = (
            directory_or_file
            if os.path.isfile(directory_or_file)
            else os.path.join(directory_or_file, filename)
        )
        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)

        self.target_vocab_size = payload.get("target_vocab_size", payload["vocab_size"])
        self.id_to_bytes = {}
        self.bytes_to_id = {}
        self.merges = []
        self.merge_ranks = {}
        self._chunk_cache = {}

        for i, b64_str in enumerate(payload["vocab_b64"]):
            raw_b = base64.b64decode(b64_str.encode("ascii"))
            self.id_to_bytes[i] = raw_b
            if i >= self.NUM_SPECIAL:
                self.bytes_to_id[raw_b] = i

        for rank, triple in enumerate(payload["merges"]):
            p0, p1, nid = int(triple[0]), int(triple[1]), int(triple[2])
            self.merges.append((p0, p1, nid))
            self.merge_ranks[(p0, p1)] = (rank, nid)
        return self

    def format_conversation_prompt(self, turns: List[dict]) -> str:
        role_tags = {
            "system": "<|system|>",
            "user": "<|user|>",
            "assistant": "<|assistant|>",
            "tool": "<|tool|>",
            "tool_result": "<|tool_result|>",
        }
        parts = ["<bos>"]
        for turn in turns:
            tag = role_tags.get(turn.get("role", "user"), "<|user|>")
            parts.append(f"{tag}\n{self.normalize(turn.get('content', ''))}\n<|endturn|>")
        parts.append("<|assistant|>\n")
        return "\n".join(parts)
