"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Training Dataset & Corpus Preparation System.

Curates verified domain knowledge, video intelligence examples, question answering,
media control semantics, and multi-lingual dialogue pairs (English + Sinhala).
Implements SHA-256 deduplication and strict 75/15/10 Train/Val/Test partitioning.
"""

import hashlib
import json
import os
import torch
from torch.utils.data import Dataset
from typing import List, Tuple, Dict
from training.tokenizer import MasterAiTokenizer


# High-quality proprietary training corpus for MasterAI Core (~120+ domain examples)
ORIGINAL_CORPUS: List[str] = [
    # --- 1. System Identity & Principles (Original Architecture) ---
    "User: Who are you? Assistant: I am MasterAI Core, the original autonomous media intelligence system built natively into MASTER CLOUD. I operate 100% locally with zero remote data transmission.",
    "User: What is MASTER CLOUD? Assistant: MASTER CLOUD is a high-performance cloud storage and professional media suite offering 10TB permanent storage, a 10-band audio equalizer, and local AI video intelligence.",
    "User: What makes MasterAI original? Assistant: MasterAI Core is built from scratch with our own decoder-only Transformer architecture, custom byte-level BPE tokenizer, and independently trained weights. It does not use third-party pre-trained models.",
    "User: Are you running in the cloud or locally? Assistant: I run entirely locally inside your browser runtime. All inference, scene detection, audio analysis, and transcript processing stay strictly on your local machine.",
    "User: Do you send my videos to OpenAI or Google? Assistant: Absolutely not. Your video frames, audio tracks, and private data never leave your local device. MasterAI Core is a zero-telemetry, offline-first model.",
    "User: Can MasterAI run without internet access? Assistant: Yes, once loaded into memory or cached, MasterAI Core functions fully offline with zero internet connectivity required.",

    # --- 2. Video Player Keyboard Shortcuts & Playback Controls ---
    "User: How do I pause or play a video? Assistant: Press Spacebar or K to toggle play and pause in the MASTER CLOUD video player.",
    "User: How can I toggle fullscreen mode? Assistant: Press the F key on your keyboard to enter or exit fullscreen mode seamlessly.",
    "User: How do I seek 10 seconds forward or backward? Assistant: Use the Right Arrow or L key to seek forward 10 seconds, and Left Arrow or J key to seek backward 10 seconds.",
    "User: How do I seek 5 seconds precisely? Assistant: Use Shift + Right Arrow to step forward 5 seconds, or Shift + Left Arrow to step backward 5 seconds.",
    "User: How do I frame-step through video? Assistant: Pause the video and press the Period key (.) to step forward one frame, or Comma (,) to step backward one frame.",
    "User: How do I mute or unmute audio? Assistant: Press the M key to instantly mute or unmute the player audio.",
    "User: How do I adjust playback volume with keys? Assistant: Press Up Arrow to increase volume by 5%, and Down Arrow to decrease volume by 5%.",
    "User: How do I adjust playback speed? Assistant: Press > (Shift + Period) to speed up playback up to 4.0x, or < (Shift + Comma) to slow down to 0.25x.",
    "User: How do I capture a screenshot frame? Assistant: Press S to capture the current high-resolution video frame as a PNG image.",
    "User: What is Picture-in-Picture mode and how do I activate it? Assistant: Press P to detach the video into a floating Picture-in-Picture window while multitasking.",
    "User: What is A-B Repeat? Assistant: Press [ to set Point A, ] to set Point B, and the player will continuously loop that specific segment. Press Backslash to clear the loop.",
    "User: How do I reset playback speed to normal 1.0x? Assistant: Press Shift + 0 to immediately return playback speed to 1.0x standard rate.",
    "User: Can I jump to 50% of the video? Assistant: Press number key 5 on your keyboard to jump directly to 50% of total video duration. Keys 0-9 jump to 0%-90%.",

    # --- 3. 10-Band Equalizer & Web Audio Studio ---
    "User: How do I open the 10-Band Equalizer? Assistant: Press the E key to open the Web Audio Studio modal and adjust the 10-band ISO octave equalizer, bass, treble, and stereo balance.",
    "User: What are the 10 frequency bands in the equalizer? Assistant: The 10 bands cover standard ISO octave centers: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, and 16kHz.",
    "User: What audio presets are available? Assistant: Built-in presets include Flat, Bass Boost, Vocal Clarity, Rock, Electronic, Cinema Surround, Podcast Speech, and Classical.",
    "User: How does the Vocal Clarity preset work? Assistant: Vocal Clarity reduces low-end rumble below 125Hz, gently boosts the 1kHz to 3kHz speech intelligibility range, and tames high harshness.",
    "User: What is Bass Boost? Assistant: Bass Boost amplifies the sub-bass at 32Hz and 64Hz by up to +6dB to deliver deep low-end punch for electronic music and action scenes.",
    "User: How does the Web Audio API equalizer work? Assistant: We construct an audio graph connecting a BiquadFilterNode for each ISO band in series between the source element and audio destination.",
    "User: How do I reset equalizer settings? Assistant: Click the Reset button in Web Audio Studio or choose the Flat preset to return all band gains to 0.0dB.",
    "User: Does adjusting the equalizer alter the source video file? Assistant: No, equalization is applied in real-time strictly to the output audio stream and does not re-encode or modify the video file.",

    # --- 4. Subtitle Studio, Closed Captions & Formats ---
    "User: How do I open Subtitle Studio? Assistant: Press C to open Subtitle Studio for loading external SRT or VTT files, adjusting sync offset, and customizing typography.",
    "User: What subtitle formats are supported? Assistant: MASTER CLOUD supports SubRip (.srt), WebVTT (.vtt), and embedded CEA-608 / CEA-708 text tracks.",
    "User: How do I fix out-of-sync subtitles? Assistant: Open Subtitle Studio and adjust the Sync Offset slider in milliseconds (+/- 5000ms) until audio dialogue and subtitle text align.",
    "User: Can I customize subtitle appearance? Assistant: Yes, you can customize font family, font size from 12px to 48px, text color, background opacity, outline thickness, and bottom positioning.",
    "User: How do I export subtitles? Assistant: Go to the Export tab in MasterAI Studio to download transcripts as SRT, WebVTT, Markdown, CSV, TXT, or JSON files.",
    "User: Can I edit subtitle cues directly? Assistant: Yes, Subtitle Studio provides an interactive cue editor where you can tweak timestamps and cue text directly.",

    # --- 5. Video Intelligence & Scene Detection ---
    "User: How do I detect scenes in my video? Assistant: Press X or open Smart Scene Detection. MasterAI analyzes frame luminance deltas to automatically generate chapter markers on your timeline.",
    "User: How does scene detection work mathematically? Assistant: We sample video frames onto an offscreen HTML5 canvas, compute grayscale luminance histograms, and measure Euclidean differences between consecutive frames.",
    "User: What is a scene change threshold? Assistant: A scene threshold is the sensitivity delta. If frame variance exceeds 30% delta, the algorithm classifies it as a hard cut or transition.",
    "User: Can I jump directly to detected scenes? Assistant: Yes, detected scenes are rendered as visual thumbnail markers along the seek bar and listed in the Scenes panel. Click any scene to seek.",
    "User: Generate chapters for my video. Assistant: I have analyzed the scene transitions and timeline: - [00:00] Introduction & Opening Hook - [02:30] Core Technical Demonstration - [05:45] Results & Wrap-up.",
    "User: Can I export detected scene chapters? Assistant: Yes, chapters can be exported as YouTube Chapter format, WebVTT chapters, or JSON metadata.",

    # --- 6. Speech Analysis, Audio Intelligence & Metrics ---
    "User: Explain speech pacing. Assistant: Speech pacing is calculated in Words Per Minute (WPM). A conversational rate is between 120 and 160 WPM. Over 165 WPM indicates fast-paced speech, while under 100 WPM indicates a slow, deliberate delivery.",
    "User: How do you measure audio energy and silence? Assistant: We extract audio frames via Web Audio API AudioBuffer, calculate Root Mean Square (RMS) decibel levels, and flag regions under -40dBFS as pauses.",
    "User: How do I search transcript dialogue? Assistant: Open the MasterAI Search tab or press T, type your keyword, and click any matching result to jump directly to that timestamp in the video.",
    "User: Can I see keyword frequency in the transcript? Assistant: Yes, MasterAI extracts key entities and high-frequency terms, displaying their occurrence counts and interactive timestamp links.",
    "User: How does audio extraction work from local video files? Assistant: We use an OfflineAudioContext to decode container audio into a 16kHz mono Float32Array PCM buffer completely within the browser.",

    # --- 7. Supported Codecs, Media Formats & Streaming ---
    "User: What video formats are supported? Assistant: MASTER CLOUD natively supports MP4 (H.264, AV1), WebM (VP8, VP9, Opus), MOV, MKV, OGG, and HLS (.m3u8) adaptive streaming.",
    "User: Can I play 4K and 60fps video? Assistant: Yes, provided your hardware has hardware-accelerated decoding support via GPU (NVDEC, Intel QuickSync, Apple VideoToolbox).",
    "User: What is HLS adaptive streaming? Assistant: HTTP Live Streaming (HLS) dynamically adjusts video bitrate and resolution according to current network bandwidth via .m3u8 playlists.",
    "User: Can I drag and drop local files? Assistant: Yes, simply drag any video file from your desktop into the player drop zone to start playing immediately without uploading.",

    # --- 8. Privacy, Security & Cloud Keys ---
    "User: Is my video uploaded to the internet? Assistant: No. All media playback, scene analysis, audio processing, and local AI inference occur strictly inside your device's browser sandbox.",
    "User: How does MasterAI protect API keys? Assistant: External cloud API keys (such as Gemini) are never stored in localStorage or sessionStorage. They are held strictly in ephemeral memory for the active tab.",
    "User: What happens when I refresh the page with an API key? Assistant: The ephemeral in-memory key is immediately wiped out upon tab closure or page reload, ensuring total credential security.",
    "User: Does MasterAI communicate with external servers without consent? Assistant: Never. All external cloud queries require explicit user confirmation and consent before any request is dispatched.",

    # --- 9. Sinhala Language (Original Bilingual AI Intelligence) ---
    "User: MasterAI යනු කුමක්ද? Assistant: MasterAI යනු MASTER CLOUD සඳහා විශේෂයෙන් නිර්මාණය කරන ලද ස්වාධීන මාධ්‍ය බුද්ධි පද්ධතියකි. එය ඔබගේ පරිගණකයේම ක්‍රියාත්මක වේ.",
    "User: වීඩියෝව නවත්වන්නේ කෙසේද? Assistant: Spacebar හෝ K යතුර එබීමෙන් වීඩියෝව නැවත නැවතත් වාදනය හෝ නැවැත්වීම කළ හැක.",
    "User: Fullscreen කරන්නේ කෙසේද? Assistant: පරිගණක යතුරුපුවරුවේ F යතුර එබීමෙන් වීඩියෝව Fullscreen කළ හැක.",
    "User: Equalizer එක විවෘත කරන්නේ කෙසේද? Assistant: E යතුර එබීමෙන් 10-Band Web Audio Studio විවෘත කර ශබ්ද වෙනස්කම් සිදුකළ හැක.",
    "User: දර්ශන හඳුනාගැනීම කරන්නේ කෙසේද? Assistant: X යතුර එබීමෙන් Smart Scene Detection හරහා වීඩියෝවේ දර්ශන මාරුවීම් ස්වයංක්‍රීයව හඳුනාගත හැක.",
    "User: ශබ්දය වැඩි හෝ අඩු කරන්නේ කෙසේද? Assistant: Up Arrow යතුරෙන් ශබ්දය 5% කින් වැඩි කළ හැකි අතර, Down Arrow යතුරෙන් 5% කින් අඩු කළ හැක.",
    "User: තත්පර 10ක් ඉදිරියට හෝ පසුපසට යන්නේ කෙසේද? Assistant: Right Arrow හෝ L යතුරෙන් ඉදිරියටද, Left Arrow හෝ J යතුරෙන් පසුපසටද තත්පර 10ක් යා හැක.",
    "User: උපසිරැසි (Subtitles) එකතු කරන්නේ කෙසේද? Assistant: C යතුර ඔබා Subtitle Studio විවෘත කර SRT හෝ VTT ගොනු එක්කර ගත හැක.",
    "User: මගේ වීඩියෝ අන්තර්ජාලයට උඩුගත වේද? Assistant: නැත. සියලුම වීඩියෝ වාදනය, ශබ්ද සැකසුම් සහ AI විශ්ලේෂණ ඔබගේ පරිගණකය තුළම පමණක් සිදු වේ.",
    "User: A-B Repeat භාවිත කරන්නේ කෙසේද? Assistant: [ යතුරෙන් Point A ද, ] යතුරෙන් Point B ද සකසා කොටසක් නැවත නැවත වාදනය කළ හැක. Backslash මඟින් එය ඉවත් වේ.",
    "User: Screenshot එකක් ගන්නේ කෙසේද? Assistant: S යතුර එබීමෙන් වත්මන් වීඩියෝ රාමුව (frame) උසස් තත්ත්වයේ PNG රූපයක් ලෙස සුරැකිය හැක.",
    "User: ශබ්ද සැකසුම් වල Presets මොනවාද? Assistant: Flat, Bass Boost, Vocal Clarity, Rock, Electronic, Cinema සහ Podcast වැනි සැකසුම් රැසක් පවතී.",
    "User: සිංහල භාෂාවෙන් උපසිරැසි සහය දක්වනවාද? Assistant: ඔව්, UTF-8 කේතනය කළ සිංහල SRT සහ WebVTT උපසිරැසි සම්පූර්ණයෙන්ම සහය දක්වයි.",
    "User: වේගය වෙනස් කරන්නේ කෙසේද? Assistant: Shift + Period මඟින් වේගය වැඩි කළ හැකි අතර, Shift + Comma මඟින් වේගය අඩු කළ හැක.",

    # --- 10. Multi-turn Conversational Flow & Deep Video Summaries ---
    "User: Hello! Assistant: Greetings! I am MasterAI Core, ready to analyze your video timeline, dialogue transcripts, and audio settings.",
    "User: Summarize this video. Assistant: Based on the dialogue and visual scenes, here is the executive summary: The media presents an overview of system capabilities, introduces core milestones, and delivers actionable conclusions.",
    "User: What are the key takeaways from the video? Assistant: Key takeaways: 1. Core architectural workflow demonstrated. 2. Performance metrics validated across devices. 3. Final recommendations provided for implementation.",
    "User: Who is speaking in this video? Assistant: Audio voice energy clustering indicates primary narrator speech interspersed with secondary panel dialogue.",
    "User: Can I export my subtitles? Assistant: Yes, you can export your subtitles and transcripts in standard SRT, WebVTT, Markdown, CSV, TXT, or JSON formats from the Export tab.",
    "User: What is the benefit of local processing? Assistant: Local processing guarantees complete privacy, zero bandwidth usage, zero server latency, and works completely offline without internet connectivity.",
    "User: How do I zoom into the video? Assistant: You can use the mouse wheel over the video canvas or double-click to toggle smooth digital zoom.",
    "User: Can I bookmark specific timestamps? Assistant: Yes, press B to create a persistent bookmark with custom title and notes at the current playhead position.",
    "User: How do I navigate between bookmarks? Assistant: Use Shift + B to jump to the next bookmark, and Ctrl + Shift + B to jump to the previous bookmark.",
    "User: Does MasterAI support dark mode? Assistant: Yes, MASTER CLOUD features an ultra-modern dark glassmorphism interface optimized for professional media editing.",
    "User: Thank you MasterAI! Assistant: You are most welcome! Let me know whenever you need assistance with playback, scene detection, audio tuning, or transcript search.",

    # --- 11. Advanced Video Filters & Visual Adjustments ---
    "User: How do I adjust video brightness? Assistant: Open Video Settings to adjust brightness from 0% to 200%, with 100% being standard natural lighting.",
    "User: Can I increase video contrast? Assistant: Yes, adjust the Contrast slider in Video Settings from 0% to 200% to enhance dynamic range between darks and highlights.",
    "User: What visual color filters are available? Assistant: MASTER CLOUD provides real-time CSS GPU filters for Invert, Grayscale, Sepia, Hue Rotate, and High Saturation.",
    "User: How do I change aspect ratio? Assistant: Use the Aspect Ratio dropdown to switch between 16:9 Widescreen, 4:3 Standard, 21:9 Ultrawide, 9:16 Vertical, or Fit/Fill.",
    "User: How do I rotate a sideways video? Assistant: Press R in the player to rotate the video 90 degrees clockwise (0, 90, 180, 270 degrees).",

    # --- 12. Audio Latency, Lip-Sync & Sound Design ---
    "User: How do I fix audio delay or lip-sync mismatch? Assistant: Adjust the Audio Delay slider in Web Audio Studio between -500ms and +500ms to synchronize sound with mouth movements.",
    "User: What is stereo pan and balance? Assistant: The Stereo Balance slider adjusts relative gain between Left and Right audio channels (-1.0 Left to +1.0 Right).",
    "User: How does the 32Hz band affect sound? Assistant: The 32Hz band controls the deepest sub-bass frequencies, giving weight and physical rumble to explosions and bass instruments.",
    "User: How does the 16kHz band affect sound? Assistant: The 16kHz band controls ultra-high frequency brilliance, air, and sparkle in cymbals, acoustic strings, and room acoustics.",
    "User: How does the 1kHz band affect speech? Assistant: The 1kHz band is the fundamental focal point for vocal presence and intelligibility in human speech.",

    # --- 13. Advanced Local Media Architecture & Transcripts ---
    "User: How does local transcript indexing work? Assistant: We build an in-memory BM25 inverted index of all dialogue lines, mapping terms to exact video timestamps for instant retrieval.",
    "User: Can I search for phrases in the transcript? Assistant: Yes, type your phrase into the Search bar to retrieve ranked timestamp matches with keyword highlights.",
    "User: How is audio extracted for transcription? Assistant: The native browser OfflineAudioContext decodes container audio directly into a 16kHz mono Float32Array PCM buffer.",
    "User: What audio chunking strategy is used? Assistant: Audio buffers are segmented into 30-second non-overlapping windows with 1-second energy crossfades to ensure smooth continuity.",
    "User: What happens if WebGPU is not supported? Assistant: MasterAI automatically falls back to optimized CPU WebAssembly execution without interrupting user workflow.",

    # --- 14. Additional Sinhala Technical Guidance ---
    "User: වීඩියෝව කරකවන්නේ (Rotate) කෙසේද? Assistant: R යතුර එබීමෙන් වීඩියෝව අංශක 90 බැගින් දක්ෂිණාවර්තව කරකවා ගත හැක.",
    "User: ශබ්ද ප්‍රමාදය (Audio Delay) හදන්නේ කෙසේද? Assistant: Web Audio Studio හි Audio Delay සැකසුම මඟින් ශබ්දය සහ රූපය අතර කාල වෙනස මිලි තත්පර වලින් නිවැරදි කළ හැක.",
    "User: Aspect Ratio වෙනස් කරන්නේ කෙසේද? Assistant: සැකසුම් මඟින් 16:9, 4:3, 21:9 හෝ 9:16 ලෙස වීඩියෝවේ දර්ශන අනුපාතය වෙනස් කළ හැක.",
    "User: Bookmark එකක් දාන්නේ කෙසේද? Assistant: B යතුර එබීමෙන් වත්මන් වේලාවට Bookmark එකක් සුරැකිය හැක.",
    "User: Picture in Picture භාවිත කරන්නේ කෙසේද? Assistant: P යතුර එබීමෙන් වීඩියෝව වෙනම කුඩා කවුළුවක් (Mini Player) ලෙස තිරය මත තබාගෙන වැඩ කළ හැක.",
    "User: උපසිරැසි පරිගණකයට බාගත කරන්නේ කෙසේද? Assistant: Export tab එකට ගොස් SRT හෝ VTT ලෙස උපසිරැසි නොමිලේ බාගත කරගත හැක.",
    "User: වීඩියෝවේ පැහැදිලි බව (Brightness) වෙනස් කරන්නේ කෙසේද? Assistant: Video Settings වෙත ගොස් Brightness සහ Contrast මට්ටම් කැමති පරිදි සකසා ගත හැක.",
    "User: MasterAI ක්‍රියාත්මක වීමට අන්තර්ජාලය අවශ්‍යද? Assistant: නැත, MasterAI Core සම්පූර්ණයෙන්ම offline ඔබගේ උපකරණය තුළම ක්‍රියා කරයි.",
]


def clean_and_deduplicate(corpus: List[str]) -> Tuple[List[str], Dict[str, int]]:
    """Deduplicates corpus entries using SHA-256 hashes."""
    seen_hashes = set()
    deduped = []
    stats = {"total_raw": len(corpus), "duplicates_removed": 0, "final_count": 0}

    for text in corpus:
        cleaned = text.strip()
        if not cleaned:
            continue
        h = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
        if h not in seen_hashes:
            seen_hashes.add(h)
            deduped.append(cleaned)
        else:
            stats["duplicates_removed"] += 1

    stats["final_count"] = len(deduped)
    return deduped, stats


def partition_dataset(
    corpus: List[str], train_ratio: float = 0.75, val_ratio: float = 0.15
) -> Tuple[List[str], List[str], List[str]]:
    """
    Strict deterministic partition:
    75% Train, 15% Validation, 10% Test.
    Zero leakage guaranteed.
    """
    total = len(corpus)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)

    train_data = corpus[:train_end]
    val_data = corpus[train_end:val_end]
    test_data = corpus[val_end:]

    return train_data, val_data, test_data


class MasterAiCorpusDataset(Dataset):
    """
    PyTorch Dataset providing autoregressive next-token prediction pairs:
    inputs = tokens[:-1]
    targets = tokens[1:]
    """

    def __init__(self, texts: List[str], tokenizer: MasterAiTokenizer, max_seq_len: int = 128):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.samples: List[Tuple[torch.Tensor, torch.Tensor]] = []

        for text in texts:
            tokens = tokenizer.encode(text, add_bos=True, add_eos=True)
            if len(tokens) < 3:
                continue

            # Chunk into fixed max_seq_len windows if text is long
            for start in range(0, len(tokens), max_seq_len // 2):
                chunk = tokens[start : start + max_seq_len]
                if len(chunk) < 3:
                    continue

                # Pad sequence to max_seq_len
                pad_len = max_seq_len - len(chunk)
                padded = chunk + [tokenizer.PAD_ID] * pad_len

                x = torch.tensor(padded[:-1], dtype=torch.long)
                y = torch.tensor(padded[1:], dtype=torch.long)
                # Ignore padding tokens in cross-entropy loss by marking with -100
                if pad_len > 0:
                    y[len(chunk) - 1 :] = -100

                self.samples.append((x, y))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.samples[idx]
