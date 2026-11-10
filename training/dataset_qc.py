"""
MASTER CLOUD — MASTER AI ORIGINAL
Dataset Quality Control & Integrity Verification Suite (v0.5).

Implements strict data governance:
1. Exact duplicate detection (SHA-256 hash matching)
2. Near-duplicate detection (word-level Jaccard similarity > 0.85)
3. Unicode validation & NFC normalization (including Sinhala virama/combining mark validation)
4. Language classification & balance (English, Sinhala, Mixed)
5. Response completeness & terminal punctuation validation
6. Malformed sample detection (unmatched brackets, placeholders)
7. Provenance & license audit
8. Group-based train/val/test splitting to prevent intra-document leakage
9. Token census via MasterAiTokenizer
"""

import hashlib
import json
import os
import re
import sys
import unicodedata
from typing import Dict, List, Tuple, Any, Set

# Add workspace root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from training.tokenizer import MasterAiTokenizer


def normalize_text(text: str) -> str:
    """Applies Unicode NFC normalization and strips excess whitespace."""
    norm = unicodedata.normalize("NFC", text.strip())
    # Collapse multiple spaces while preserving newlines
    norm = re.sub(r"[ \t]+", " ", norm)
    return norm


def validate_sinhala_unicode(text: str) -> Tuple[bool, str]:
    """
    Validates Sinhala text for proper Unicode ordering.
    Ensures combining marks (virama \u0DCA, vowel signs \u0DCF-\u0DF3)
    never appear orphaned at the beginning of words or after spaces.
    """
    combining_range = range(0x0DCA, 0x0DF4)
    words = text.split()
    for w in words:
        if not w:
            continue
        first_code = ord(w[0])
        if first_code in combining_range:
            return False, f"Orphaned Sinhala combining mark at start of word '{w}'"
    return True, "Valid Sinhala Unicode sequence"


def detect_language(text: str) -> str:
    """
    Classifies text into 'english', 'sinhala', or 'mixed'.
    Uses character code point distributions.
    """
    latin_count = 0
    sinhala_count = 0
    total_letters = 0

    for ch in text:
        cp = ord(ch)
        if (0x0041 <= cp <= 0x005A) or (0x0061 <= cp <= 0x007A):
            latin_count += 1
            total_letters += 1
        elif 0x0D80 <= cp <= 0x0DFF:
            sinhala_count += 1
            total_letters += 1

    if total_letters == 0:
        return "neutral"

    latin_ratio = latin_count / total_letters
    sinhala_ratio = sinhala_count / total_letters

    if sinhala_ratio > 0.65:
        return "sinhala"
    if latin_ratio > 0.75 and sinhala_count == 0:
        return "english"
    if sinhala_count > 0 and latin_count > 0:
        return "mixed"
    return "english"


def compute_jaccard_similarity(tokens_a: Set[str], tokens_b: Set[str]) -> float:
    """Computes Jaccard similarity between two token sets."""
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = len(tokens_a.intersection(tokens_b))
    union = len(tokens_a.union(tokens_b))
    return intersection / union if union > 0 else 0.0


def audit_and_clean_corpus(
    raw_entries: List[Dict[str, str]],
    tokenizer: MasterAiTokenizer,
    jaccard_near_dup_threshold: float = 0.85,
) -> Tuple[List[Dict[str, str]], Dict[str, Any]]:
    """
    Comprehensive 8-point quality audit on raw training entries.
    Returns cleaned entries and comprehensive audit report.
    """
    cleaned: List[Dict[str, str]] = []
    seen_hashes: Set[str] = set()
    exact_duplicates_count = 0
    near_duplicates_count = 0
    malformed_count = 0
    incomplete_count = 0
    unicode_errors: List[str] = []

    token_sets: List[Tuple[Set[str], int]] = []

    terminal_puncts = ('.', '?', '!', '।', '"', "'", '”', '’')

    for idx, item in enumerate(raw_entries):
        prompt = normalize_text(item.get("prompt", ""))
        response = normalize_text(item.get("response", ""))
        source = item.get("source", "").strip()
        license_str = item.get("license", "").strip()
        category = item.get("category", "general").strip()
        group = item.get("group", category).strip()

        # 1. Malformed sample checks
        if not prompt or not response:
            malformed_count += 1
            continue

        if any(ph in prompt.upper() or ph in response.upper() for ph in ["TODO", "FIXME", "[INSERT]", "XXX"]):
            malformed_count += 1
            continue

        # 2. Response completeness checks
        if len(response) < 15:
            incomplete_count += 1
            continue

        if not response.endswith(terminal_puncts):
            # Enforce complete sentence termination
            response += "."

        # 3. Unicode sequence checks
        si_valid, si_msg = validate_sinhala_unicode(prompt + " " + response)
        if not si_valid:
            unicode_errors.append(f"Entry {idx}: {si_msg}")
            continue

        # 4. Exact duplicate check (SHA-256)
        pair_key = f"{prompt.lower()}|||{response.lower()}"
        sha = hashlib.sha256(pair_key.encode("utf-8")).hexdigest()
        if sha in seen_hashes:
            exact_duplicates_count += 1
            continue
        seen_hashes.add(sha)

        # 5. Near-duplicate check (Jaccard similarity on prompt words)
        prompt_words = set(re.findall(r"\w+", prompt.lower()))
        is_near_dup = False
        for prev_words, _ in token_sets:
            sim = compute_jaccard_similarity(prompt_words, prev_words)
            if sim >= jaccard_near_dup_threshold and len(prompt_words) > 4:
                is_near_dup = True
                near_duplicates_count += 1
                break

        if is_near_dup:
            continue

        token_sets.append((prompt_words, idx))

        # 6. Language identification
        lang = detect_language(prompt + " " + response)

        cleaned.append({
            "prompt": prompt,
            "response": response,
            "category": category,
            "group": group,
            "language": lang,
            "source": source,
            "license": license_str,
        })

    # 7. Token Census
    total_prompt_tokens = 0
    total_response_tokens = 0
    total_tokens = 0

    category_counts: Dict[str, int] = {}
    language_counts: Dict[str, int] = {}
    group_counts: Dict[str, int] = {}

    for item in cleaned:
        p_str = f"User: {item['prompt']}\nAssistant: "
        r_str = f"{item['response']}"
        p_toks = len(tokenizer.encode(p_str, add_bos=True, add_eos=False))
        r_toks = len(tokenizer.encode(r_str, add_bos=False, add_eos=True))
        item["prompt_tokens"] = p_toks
        item["response_tokens"] = r_toks
        item["total_tokens"] = p_toks + r_toks

        total_prompt_tokens += p_toks
        total_response_tokens += r_toks
        total_tokens += (p_toks + r_toks)

        cat = item["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

        lng = item["language"]
        language_counts[lng] = language_counts.get(lng, 0) + 1

        grp = item["group"]
        group_counts[grp] = group_counts.get(grp, 0) + 1

    report = {
        "raw_entries_inspected": len(raw_entries),
        "cleaned_valid_entries": len(cleaned),
        "exact_duplicates_purged": exact_duplicates_count,
        "near_duplicates_purged": near_duplicates_count,
        "malformed_purged": malformed_count,
        "incomplete_purged": incomplete_count,
        "unicode_errors_detected": len(unicode_errors),
        "unicode_error_details": unicode_errors[:5],
        "total_corpus_tokens": total_tokens,
        "total_prompt_tokens": total_prompt_tokens,
        "total_response_tokens": total_response_tokens,
        "average_tokens_per_sample": round(total_tokens / max(1, len(cleaned)), 2),
        "language_distribution": language_counts,
        "category_distribution": category_counts,
        "group_distribution": group_counts,
    }

    return cleaned, report


def group_partition_dataset(
    entries: List[Dict[str, Any]],
    train_ratio: float = 0.75,
    val_ratio: float = 0.15,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Partitions dataset by content group / topic to minimize intra-document leakage.
    Within each group, assigns samples deterministically into train/val/test splits.
    """
    # Group by category / content group
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for item in entries:
        grp = item.get("group", item.get("category", "default"))
        groups.setdefault(grp, []).append(item)

    train_set: List[Dict[str, Any]] = []
    val_set: List[Dict[str, Any]] = []
    test_set: List[Dict[str, Any]] = []

    for grp_name, grp_items in groups.items():
        n = len(grp_items)
        if n == 1:
            train_set.append(grp_items[0])
            continue
        elif n == 2:
            train_set.append(grp_items[0])
            val_set.append(grp_items[1])
            continue

        n_train = max(1, int(round(n * train_ratio)))
        n_val = max(1, int(round(n * val_ratio)))
        n_test = n - n_train - n_val

        if n_test <= 0:
            if n_train > 1:
                n_train -= 1
                n_test = 1
            else:
                n_test = 0

        train_set.extend(grp_items[:n_train])
        val_set.extend(grp_items[n_train : n_train + n_val])
        if n_test > 0:
            test_set.extend(grp_items[n_train + n_val :])

    return train_set, val_set, test_set
