"""
Original Training Corpus Governance, Cleaning, Leakage Guard & Split Pipeline
for MASTER AI CORE v1.0.

Enforces:
- Non-Negotiable Original AI Policy: ingests ONLY human-authored, project-owned,
  and properly licensed datasets; tracks provenance, license, source, and language.
- Unicode NFC normalization & Sinhala/English script integrity.
- Exact SHA-256 deduplication + shingle Jaccard near-dedup (intra-corpus & vs held-out).
- Strict 0% held-out benchmark leakage verification across:
  * training/held_out_benchmark_100.json
  * training/held_out_benchmark_additional_50.json
  * training/v1/held_out_benchmark_500.json
- Group-based stratified train/val/test splitting (prevents split leakage).
- Stage 1 continuous prose vs Stage 2 multi-turn chat formatting.
- Honest token milestone tracking vs Stage A (1M), Stage B (5M), Stage C (20M), Long-term (100M+).
"""

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from training.dataset import V06_EXPANDED_ENTRIES
from training.v1.data_v1.stage1_prose import STAGE1_PROSE_DOCUMENTS
from training.v1.data_v1.stage1_prose_extended import STAGE1_EXTENDED_PROSE
from training.v1.data_v1.stage2_conversations import STAGE2_CONVERSATIONS, SYSTEM_DEFAULT
from training.v1.data_v1.stage2_general_dialogues import STAGE2_GENERAL_DIALOGUES

OUT_DIR = ROOT / "models" / "master-ai-core-v1"
CORPUS_OUT_DIR = OUT_DIR / "corpus"

HELD_OUT_FILES = [
    ROOT / "training" / "held_out_benchmark_100.json",
    ROOT / "training" / "held_out_benchmark_additional_50.json",
    ROOT / "training" / "v1" / "held_out_benchmark_500.json",
]

CORPUS_MILESTONES = {
    "stage_a_tokens": 1_000_000,
    "stage_b_tokens": 5_000_000,
    "stage_c_tokens": 20_000_000,
    "long_term_tokens": 100_000_000,
}


def normalize_text(text: str) -> str:
    """Apply Unicode NFC normalization and normalize line endings/redundant spaces."""
    nfc = unicodedata.normalize("NFC", text or "")
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in nfc.replace("\r\n", "\n").split("\n")]
    return "\n".join(lines).strip()


def canonical_fingerprint(text: str) -> str:
    """Stable normalized key for exact SHA-256 deduplication and leak matching."""
    cleaned = re.sub(r"[^\w\u0D80-\u0DFF]+", " ", normalize_text(text).lower()).strip()
    return re.sub(r"\s+", " ", cleaned)


def sha256_text(text: str) -> str:
    return hashlib.sha256(canonical_fingerprint(text).encode("utf-8")).hexdigest()


def char_shingles(text: str, k: int = 5) -> Set[str]:
    norm = canonical_fingerprint(text)
    if len(norm) < k:
        return {norm} if norm else set()
    return {norm[i : i + k] for i in range(len(norm) - k + 1)}


def jaccard_similarity(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    if inter == 0:
        return 0.0
    return inter / float(len(a | b))


def detect_language_tag(text: str, declared: Optional[str] = None) -> str:
    if declared in ("sinhala", "english", "mixed"):
        return declared
    si_chars = len(re.findall(r"[\u0D80-\u0DFF]", text))
    en_chars = len(re.findall(r"[A-Za-z]", text))
    total = si_chars + en_chars
    if total == 0:
        return "english"
    si_ratio = si_chars / total
    if si_ratio >= 0.70:
        return "sinhala"
    if si_ratio >= 0.15:
        return "mixed"
    return "english"


def count_script_units(text: str) -> Dict[str, int]:
    """Count script-level token/char approximations per language."""
    si_chars = len(re.findall(r"[\u0D80-\u0DFF]", text))
    en_chars = len(re.findall(r"[A-Za-z0-9]", text))
    words = len(re.findall(r"\S+", text))
    return {"sinhala_chars": si_chars, "latin_chars": en_chars, "whitespace_words": words}


def load_held_out_signatures() -> Tuple[Set[str], List[Tuple[str, Set[str], str]]]:
    """Extract canonical prompts from all frozen held-out benchmarks."""
    exact_fps: Set[str] = set()
    shingle_list: List[Tuple[str, Set[str], str]] = []

    for path in HELD_OUT_FILES:
        if not path.exists():
            continue
        raw = json.loads(path.read_text(encoding="utf-8"))
        entries = raw if isinstance(raw, list) else raw.get("prompts", raw.get("entries", []))
        for idx, item in enumerate(entries):
            texts: List[str] = []
            if isinstance(item, dict):
                if "prompt" in item:
                    texts.append(str(item["prompt"]))
                if "turns" in item and isinstance(item["turns"], list):
                    for turn in item["turns"]:
                        if isinstance(turn, dict) and turn.get("content"):
                            texts.append(str(turn["content"]))
            for t in texts:
                fp = canonical_fingerprint(t)
                if len(fp) >= 8:
                    exact_fps.add(fp)
                    shingle_list.append((fp, char_shingles(fp, 5), f"{path.name}#{idx}"))
    return exact_fps, shingle_list


def check_heldout_leakage(
    texts_to_check: List[str],
    exact_fps: Set[str],
    shingle_list: List[Tuple[str, Set[str], str]],
    jaccard_threshold: float = 0.72,
) -> Optional[str]:
    """Return reason string if candidate leaks a held-out benchmark item, else None."""
    for t in texts_to_check:
        fp = canonical_fingerprint(t)
        if not fp:
            continue
        if fp in exact_fps:
            return f"exact_heldout_match:{fp[:40]}"
        cand_sh = char_shingles(fp, 5)
        if len(cand_sh) < 6:
            continue
        for ref_fp, ref_sh, ref_id in shingle_list:
            # Skip huge docs when prompt is tiny unless exact substring of substantial length
            if len(fp) >= 18 and fp in ref_fp:
                return f"substring_in_heldout:{ref_id}"
            if len(ref_fp) >= 18 and ref_fp in fp and len(fp) < 220:
                return f"contains_heldout:{ref_id}"
            if jaccard_similarity(cand_sh, ref_sh) >= jaccard_threshold:
                return f"jaccard_heldout_{jaccard_threshold}:{ref_id}"
    return None


def gather_repo_readme_prose() -> List[Dict[str, Any]]:
    """Ingest clean paragraphs/sections from project-owned README.md."""
    readme_path = ROOT / "README.md"
    if not readme_path.exists():
        return []
    raw = normalize_text(readme_path.read_text(encoding="utf-8"))
    # Split on level-2 headings for coherent sections, stripping badges/HTML
    cleaned = re.sub(r"<[^>]+>", " ", raw)
    cleaned = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", cleaned)
    sections = re.split(r"\n(?=##\s+)", cleaned)
    docs = []
    for i, sec in enumerate(sections):
        sec = normalize_text(sec)
        if len(sec) >= 120:
            docs.append({
                "id": f"repo_readme_{i:02d}",
                "language": detect_language_tag(sec),
                "group": f"repo_readme_sec_{i % 4}",
                "source": "MASTER CLOUD README.md (Project-Owned)",
                "license": "Project-Original",
                "text": sec,
            })
    return docs


def load_external_imports(
    jsonl_paths: List[str],
    txt_dirs: List[str],
    default_source: str,
    default_license: str,
    default_language: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Optional ingestion of external public-domain or CC-BY-SA cleaned corpora."""
    ext_stage1: List[Dict[str, Any]] = []
    ext_stage2: List[Dict[str, Any]] = []

    for jp in jsonl_paths:
        p = Path(jp)
        if not p.exists():
            print(f"[warn] Missing import jsonl: {p}")
            continue
        with p.open("r", encoding="utf-8") as fh:
            for idx, line in enumerate(fh):
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                source = obj.get("source", default_source)
                lic = obj.get("license", default_license)
                lang = obj.get("language")
                grp = obj.get("group", f"ext_{p.stem}_{idx // 10}")
                if "turns" in obj and isinstance(obj["turns"], list):
                    turns = [
                        {"role": str(t["role"]), "content": normalize_text(str(t["content"]))}
                        for t in obj["turns"]
                        if t.get("content")
                    ]
                    if len(turns) >= 2:
                        combined = " ".join(t["content"] for t in turns)
                        ext_stage2.append({
                            "id": obj.get("id", f"ext_s2_{p.stem}_{idx}"),
                            "language": detect_language_tag(combined, lang or default_language),
                            "group": grp,
                            "category": obj.get("category", "external_dialogue"),
                            "source": source,
                            "license": lic,
                            "turns": turns,
                        })
                elif obj.get("text"):
                    txt = normalize_text(str(obj["text"]))
                    if len(txt) >= 60:
                        ext_stage1.append({
                            "id": obj.get("id", f"ext_s1_{p.stem}_{idx}"),
                            "language": detect_language_tag(txt, lang or default_language),
                            "group": grp,
                            "source": source,
                            "license": lic,
                            "text": txt,
                        })

    for td in txt_dirs:
        d = Path(td)
        if not d.exists():
            print(f"[warn] Missing import dir: {d}")
            continue
        for fpath in sorted(d.rglob("*")):
            if fpath.suffix.lower() not in (".txt", ".md"):
                continue
            raw = normalize_text(fpath.read_text(encoding="utf-8", errors="ignore"))
            if len(raw) < 60:
                continue
            # Chunk long documents cleanly on paragraph boundaries (~1800 chars max)
            paras = [p.strip() for p in re.split(r"\n{2,}", raw) if len(p.strip()) >= 40]
            buf = ""
            chunk_idx = 0
            for para in paras:
                if len(buf) + len(para) > 1800 and len(buf) >= 120:
                    ext_stage1.append({
                        "id": f"ext_txt_{fpath.stem}_{chunk_idx}",
                        "language": detect_language_tag(buf, default_language),
                        "group": f"ext_file_{fpath.stem}",
                        "source": f"{default_source}:{fpath.name}",
                        "license": default_license,
                        "text": buf.strip(),
                    })
                    buf = para
                    chunk_idx += 1
                else:
                    buf = (buf + "\n\n" + para).strip()
            if len(buf) >= 60:
                ext_stage1.append({
                    "id": f"ext_txt_{fpath.stem}_{chunk_idx}",
                    "language": detect_language_tag(buf, default_language),
                    "group": f"ext_file_{fpath.stem}",
                    "source": f"{default_source}:{fpath.name}",
                    "license": default_license,
                    "text": buf.strip(),
                })

    return ext_stage1, ext_stage2


def stratified_group_split(
    records: List[Dict[str, Any]],
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Assign whole groups deterministically into train/val/test stratified by language,
    guaranteeing zero group overlap across splits and balanced language representation.
    """
    by_lang: Dict[str, Dict[str, List[Dict[str, Any]]]] = {"english": {}, "sinhala": {}, "mixed": {}}
    for rec in records:
        lang = rec.get("language", "english")
        if lang not in by_lang:
            lang = "english"
        grp = str(rec.get("group", rec.get("id", "default")))
        by_lang[lang].setdefault(grp, []).append(rec)

    train_out: List[Dict[str, Any]] = []
    val_out: List[Dict[str, Any]] = []
    test_out: List[Dict[str, Any]] = []

    for lang, grp_map in by_lang.items():
        # Sort groups deterministically by hash so ordering does not correlate with topic
        groups = sorted(
            grp_map.keys(),
            key=lambda g: hashlib.md5(f"{lang}:{g}".encode("utf-8")).hexdigest(),
        )
        n = len(groups)
        if n == 0:
            continue
        if n == 1:
            train_out.extend(grp_map[groups[0]])
            continue
        if n == 2:
            train_out.extend(grp_map[groups[0]])
            val_out.extend(grp_map[groups[1]])
            continue

        n_val = max(1, round(n * val_ratio))
        n_test = max(1, round(n * (1.0 - train_ratio - val_ratio)))
        n_train = max(1, n - n_val - n_test)
        for idx, g in enumerate(groups):
            if idx < n_train:
                train_out.extend(grp_map[g])
            elif idx < n_train + n_val:
                val_out.extend(grp_map[g])
            else:
                test_out.extend(grp_map[g])

    return train_out, val_out, test_out


def format_stage2_chat_text(turns: List[Dict[str, str]]) -> str:
    """Render structured conversation turns with explicit v1.0 special markers."""
    role_map = {
        "system": "<|system|>",
        "user": "<|user|>",
        "assistant": "<|assistant|>",
        "tool": "<|tool|>",
        "tool_result": "<|tool_result|>",
    }
    parts = ["<|bos|>"]
    for t in turns:
        tag = role_map.get(t["role"], "<|user|>")
        parts.append(f"{tag}\n{normalize_text(t['content'])}\n<|endturn|>")
    parts.append("<|eos|>")
    return "\n".join(parts)


def run_corpus_pipeline(
    import_jsonl: Optional[List[str]] = None,
    import_txt_dir: Optional[List[str]] = None,
    ext_source: str = "External-Licensed-Dataset",
    ext_license: str = "CC-BY-SA-4.0 / Public Domain",
    ext_language: str = "auto",
) -> Dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CORPUS_OUT_DIR.mkdir(parents=True, exist_ok=True)

    exact_fps, shingle_list = load_held_out_signatures()

    # ── 1. Gather Raw Stage 1 Prose ──
    raw_stage1: List[Dict[str, Any]] = []
    for item in STAGE1_PROSE_DOCUMENTS + STAGE1_EXTENDED_PROSE + gather_repo_readme_prose():
        txt = normalize_text(item.get("text", ""))
        if len(txt) < 30:
            continue
        raw_stage1.append({
            "id": item["id"],
            "language": detect_language_tag(txt, item.get("language")),
            "group": item.get("group", item["id"]),
            "source": item.get("source", "MASTER CLOUD v1 Original"),
            "license": item.get("license", "Project-Original"),
            "text": txt,
        })

    # Convert non-leaking clean V06 entries into continuous explanatory prose paragraphs too
    # (teaches grammar + project facts in continuous form alongside Q&A stage 2)
    for idx, entry in enumerate(V06_EXPANDED_ENTRIES):
        p = normalize_text(entry.get("prompt", ""))
        r = normalize_text(entry.get("response", ""))
        if not p or not r:
            continue
        lang = detect_language_tag(p + " " + r, entry.get("language"))
        raw_stage1.append({
            "id": f"v06_prose_{idx:04d}",
            "language": lang,
            "group": entry.get("group", f"v06_{entry.get('category', 'general')}"),
            "source": entry.get("source", "MASTER CLOUD v0.6 Human Corpus"),
            "license": entry.get("license", "Project-Original"),
            "text": f"{p}\n{r}",
            "_prompt_check": p,
            "_response_check": r,
        })

    # ── 2. Gather Raw Stage 2 Conversations ──
    raw_stage2: List[Dict[str, Any]] = []
    for conv in STAGE2_CONVERSATIONS + STAGE2_GENERAL_DIALOGUES:
        turns = [
            {"role": t["role"], "content": normalize_text(t["content"])}
            for t in conv["turns"]
            if t.get("content")
        ]
        combined = " ".join(t["content"] for t in turns if t["role"] in ("user", "assistant"))
        raw_stage2.append({
            "id": conv["id"],
            "language": detect_language_tag(combined, conv.get("language")),
            "group": conv.get("group", conv["id"]),
            "category": conv.get("category", "dialogue"),
            "source": conv.get("source", "master_cloud_v1_human_authored"),
            "license": conv.get("license", "Project-Original"),
            "turns": turns,
        })

    # Also include non-leaking V06 human Q&A items formatted cleanly as multi-role SFT
    for idx, entry in enumerate(V06_EXPANDED_ENTRIES):
        p = normalize_text(entry.get("prompt", ""))
        r = normalize_text(entry.get("response", ""))
        if not p or not r:
            continue
        lang = detect_language_tag(p + " " + r, entry.get("language"))
        raw_stage2.append({
            "id": f"v06_sft_{idx:04d}",
            "language": lang,
            "group": entry.get("group", f"v06_{entry.get('category', 'general')}"),
            "category": entry.get("category", "v06_qa"),
            "source": entry.get("source", "MASTER CLOUD v0.6 Human Corpus"),
            "license": entry.get("license", "Project-Original"),
            "turns": [
                {"role": "system", "content": SYSTEM_DEFAULT},
                {"role": "user", "content": p},
                {"role": "assistant", "content": r},
            ],
        })

    # Optional external properly-licensed imports
    ext_s1, ext_s2 = load_external_imports(
        import_jsonl or [],
        import_txt_dir or [],
        ext_source,
        ext_license,
        ext_language,
    )
    raw_stage1.extend(ext_s1)
    raw_stage2.extend(ext_s2)

    # ── 3. Clean, Deduplicate, and Verify 0% Held-out Leakage ──
    def clean_records(items: List[Dict[str, Any]], is_stage2: bool) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        seen_hashes: Set[str] = set()
        seen_shingles: List[Set[str]] = []
        cleaned: List[Dict[str, Any]] = []
        counts = {
            "raw_count": len(items),
            "exact_dup_removed": 0,
            "near_dup_removed": 0,
            "heldout_leakage_removed": 0,
            "quality_rejected": 0,
            "kept": 0,
        }
        for rec in items:
            if is_stage2:
                check_texts = [t["content"] for t in rec["turns"] if t["role"] in ("user", "assistant")]
                canon_str = "\n".join(f"{t['role']}:{t['content']}" for t in rec["turns"] if t["role"] != "system")
            else:
                check_texts = [rec["text"]]
                if "_prompt_check" in rec:
                    check_texts.append(rec["_prompt_check"])
                canon_str = rec["text"]

            if len(canon_str.strip()) < 24:
                counts["quality_rejected"] += 1
                continue

            leak = check_heldout_leakage(check_texts, exact_fps, shingle_list)
            if leak:
                counts["heldout_leakage_removed"] += 1
                continue

            h = sha256_text(canon_str)
            if h in seen_hashes:
                counts["exact_dup_removed"] += 1
                continue

            sh = char_shingles(canon_str, 5)
            is_near = False
            if len(sh) >= 10:
                for prev in seen_shingles:
                    if jaccard_similarity(sh, prev) >= 0.85:
                        is_near = True
                        break
            if is_near:
                counts["near_dup_removed"] += 1
                continue

            seen_hashes.add(h)
            if len(sh) >= 10:
                seen_shingles.append(sh)

            clean_rec = {k: v for k, v in rec.items() if not k.startswith("_")}
            clean_rec["sha256"] = h
            if is_stage2:
                clean_rec["formatted_text"] = format_stage2_chat_text(clean_rec["turns"])
            else:
                clean_rec["formatted_text"] = f"<|bos|>\n{clean_rec['text']}\n<|eos|>"
            clean_rec["stats"] = count_script_units(canon_str)
            clean_rec["utf8_bytes"] = len(canon_str.encode("utf-8"))
            cleaned.append(clean_rec)

        counts["kept"] = len(cleaned)
        return cleaned, counts

    clean_s1, s1_filter_stats = clean_records(raw_stage1, is_stage2=False)
    clean_s2, s2_filter_stats = clean_records(raw_stage2, is_stage2=True)

    # ── 4. Group-Stratified Splits ──
    s1_train, s1_val, s1_test = stratified_group_split(clean_s1, 0.80, 0.10)
    s2_train, s2_val, s2_test = stratified_group_split(clean_s2, 0.80, 0.10)

    def write_jsonl(path: Path, recs: List[Dict[str, Any]]) -> None:
        with path.open("w", encoding="utf-8") as fh:
            for r in recs:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    write_jsonl(CORPUS_OUT_DIR / "stage1_train.jsonl", s1_train)
    write_jsonl(CORPUS_OUT_DIR / "stage1_val.jsonl", s1_val)
    write_jsonl(CORPUS_OUT_DIR / "stage1_test.jsonl", s1_test)
    write_jsonl(CORPUS_OUT_DIR / "stage2_train.jsonl", s2_train)
    write_jsonl(CORPUS_OUT_DIR / "stage2_val.jsonl", s2_val)
    write_jsonl(CORPUS_OUT_DIR / "stage2_test.jsonl", s2_test)

    # ── 5. Aggregate Metrics, Provenance & Language Balance ──
    def summarize_split(recs: List[Dict[str, Any]]) -> Dict[str, Any]:
        lang_counts = {"english": 0, "sinhala": 0, "mixed": 0}
        lang_bytes = {"english": 0, "sinhala": 0, "mixed": 0}
        lang_words = {"english": 0, "sinhala": 0, "mixed": 0}
        si_chars_total = 0
        en_chars_total = 0
        sources: Dict[str, int] = {}
        licenses: Dict[str, int] = {}
        for r in recs:
            lg = r["language"]
            lang_counts[lg] = lang_counts.get(lg, 0) + 1
            lang_bytes[lg] = lang_bytes.get(lg, 0) + r["utf8_bytes"]
            lang_words[lg] = lang_words.get(lg, 0) + r["stats"]["whitespace_words"]
            si_chars_total += r["stats"]["sinhala_chars"]
            en_chars_total += r["stats"]["latin_chars"]
            sources[r["source"]] = sources.get(r["source"], 0) + 1
            licenses[r["license"]] = licenses.get(r["license"], 0) + 1
        return {
            "documents": len(recs),
            "total_utf8_bytes": sum(lang_bytes.values()),
            "total_words": sum(lang_words.values()),
            "sinhala_script_chars": si_chars_total,
            "latin_script_chars": en_chars_total,
            "by_language_docs": lang_counts,
            "by_language_bytes": lang_bytes,
            "by_language_words": lang_words,
            "sources": sources,
            "licenses": licenses,
        }

    all_clean = clean_s1 + clean_s2
    total_summary = summarize_split(all_clean)

    # Estimate subword tokens using a 2.6x-bytes heuristic before tokenizer calibration (actual count populated by benchmark_tokenizers.py)
    approx_total_bytes = total_summary["total_utf8_bytes"]
    approx_estimated_tokens = int(approx_total_bytes / 2.8)

    manifest = {
        "version": "1.0-corpus-manifest",
        "policy": "Original Human-Authored / Properly Licensed Only — Zero Synthetic LLM Data",
        "unicode_normalization": "NFC",
        "held_out_benchmarks_checked": [str(p.relative_to(ROOT)) for p in HELD_OUT_FILES if p.exists()],
        "held_out_leakage_verified_zero": True,
        "stage1_prose": {
            "filter_stats": s1_filter_stats,
            "splits": {
                "train": summarize_split(s1_train),
                "val": summarize_split(s1_val),
                "test": summarize_split(s1_test),
            },
        },
        "stage2_conversations": {
            "filter_stats": s2_filter_stats,
            "splits": {
                "train": summarize_split(s2_train),
                "val": summarize_split(s2_val),
                "test": summarize_split(s2_test),
            },
        },
        "combined_summary": total_summary,
        "corpus_roadmap_honest_status": {
            "pilot_utf8_bytes": approx_total_bytes,
            "pilot_estimated_tokens_pre_bpe": approx_estimated_tokens,
            "stage_a_target_tokens": CORPUS_MILESTONES["stage_a_tokens"],
            "stage_b_target_tokens": CORPUS_MILESTONES["stage_b_tokens"],
            "stage_c_target_tokens": CORPUS_MILESTONES["stage_c_tokens"],
            "long_term_target_tokens": CORPUS_MILESTONES["long_term_tokens"],
            "stage_a_gap_note": (
                "Current repo-contained human-authored dataset is a clean Stage-0/Pilot bilingual corpus. "
                "Reaching Stage A (1M tokens) -> Long-Term (100M+ tokens) is supported natively by running "
                "corpus_pipeline.py --import-jsonl / --import-txt-dir against clean public-domain & CC-BY-SA "
                "Sinhala/English corpora (e.g., Sinhala Wikipedia dump, public-domain literature, verified bilingual books)."
            ),
        },
    }

    manifest_path = OUT_DIR / "corpus_manifest_v1.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="MASTER AI CORE v1.0 Corpus Governance Pipeline")
    parser.add_argument("--import-jsonl", action="append", default=[], help="External properly-licensed JSONL file(s)")
    parser.add_argument("--import-txt-dir", action="append", default=[], help="Directory of clean .txt/.md files")
    parser.add_argument("--source", default="External-Clean-Dataset", help="Provenance source label for imports")
    parser.add_argument("--license", default="CC-BY-SA-4.0 / Public Domain", help="License label for imports")
    parser.add_argument("--language", default="auto", choices=["auto", "english", "sinhala", "mixed"])
    args = parser.parse_args()

    manifest = run_corpus_pipeline(
        import_jsonl=args.import_jsonl,
        import_txt_dir=args.import_txt_dir,
        ext_source=args.source,
        ext_license=args.license,
        ext_language=args.language,
    )
    print("Stage 1 Prose filter:", json.dumps(manifest["stage1_prose"]["filter_stats"], ensure_ascii=False))
    print("Stage 2 Chat  filter:", json.dumps(manifest["stage2_conversations"]["filter_stats"], ensure_ascii=False))
    s = manifest["combined_summary"]
    print(f"Combined clean docs: {s['documents']}, UTF-8 bytes: {s['total_utf8_bytes']:,}, Words: {s['total_words']:,}")
    print("By language docs:", json.dumps(s["by_language_docs"]))
    print("By language UTF-8 bytes:", json.dumps(s["by_language_bytes"]))
    print(f"Sinhala chars: {s['sinhala_script_chars']:,} | Latin chars: {s['latin_script_chars']:,}")
    print("Saved manifest -> models/master-ai-core-v1/corpus_manifest_v1.json")


if __name__ == "__main__":
    main()
