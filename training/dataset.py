"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Training Dataset & Corpus Preparation System (v0.3).

Curates verified domain knowledge, video intelligence, question answering,
media control semantics, logical reasoning, and multi-lingual dialogue pairs:
- English language understanding
- Sinhala language understanding
- Sinhala-English mixed dialogue
- Technical instructions and clear explanations
- Conversational turns and summarization
- Logical reasoning and mathematical derivation
- Media intelligence and audio engineering

Implements Target-Only Loss Masking, SHA-256 deduplication,
and strict 75/15/10 Train/Val/Test partitioning with zero leakage.
"""

import hashlib
import json
import os
import torch
from torch.utils.data import Dataset
from typing import List, Tuple, Dict, Any
from training.tokenizer import MasterAiTokenizer


# Structured Original Training Corpus with Provenance & Licensing Metadata
ORIGINAL_DATASET_ENTRIES: List[Dict[str, str]] = [
    # =========================================================================
    # 1. System Identity & Core Principles
    # =========================================================================
    {
        "category": "identity",
        "prompt": "Who are you?",
        "response": "I am MasterAI Core, the original autonomous media intelligence system built natively into MASTER CLOUD. I run 100% locally on your machine with zero cloud telemetry.",
        "source": "MASTER CLOUD Architectural Specification",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "identity",
        "prompt": "What is MASTER CLOUD?",
        "response": "MASTER CLOUD is a private high-performance media suite and cloud storage platform featuring 10TB permanent storage, a 10-band audio equalizer, and local AI video intelligence.",
        "source": "MASTER CLOUD Product Overview",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "identity",
        "prompt": "What makes MasterAI original?",
        "response": "MasterAI Core uses an original decoder-only Transformer architecture, a custom byte-level BPE tokenizer, and independently trained weights. It never wraps or depends on third-party pretrained models.",
        "source": "MASTER CLOUD AI Policy",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "identity",
        "prompt": "Are you running in the cloud or locally?",
        "response": "I run completely locally inside your browser runtime. All inference, scene detection, audio analysis, and transcript processing remain strictly on your local machine.",
        "source": "MASTER CLOUD Security Whitepaper",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "identity",
        "prompt": "Do you send my videos to OpenAI or Google?",
        "response": "No. Your video frames, audio tracks, and private files never leave your local device. MasterAI Core is a zero-telemetry, offline-first model.",
        "source": "MASTER CLOUD Privacy Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "identity",
        "prompt": "Can MasterAI run without internet access?",
        "response": "Yes. Once loaded in memory or cached, MasterAI Core functions fully offline with zero internet connectivity required.",
        "source": "MASTER CLOUD Offline Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 2. Video Player Hotkeys & Playback Navigation
    # =========================================================================
    {
        "category": "video_controls",
        "prompt": "How do I pause or play a video?",
        "response": "Press the Spacebar or K key on your keyboard to toggle playback. You can also click anywhere directly on the video canvas.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How can I toggle fullscreen mode?",
        "response": "Press the F key to enter or exit fullscreen mode seamlessly. Press Escape to exit fullscreen at any time.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I seek 10 seconds forward or backward?",
        "response": "Use the Right Arrow or L key to jump forward 10 seconds, and the Left Arrow or J key to jump backward 10 seconds.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I seek 5 seconds precisely?",
        "response": "Hold Shift and press the Right Arrow to step forward 5 seconds, or Shift and Left Arrow to step backward 5 seconds.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I frame-step through video?",
        "response": "Pause the video and press the Period key (.) to advance by exactly one frame, or the Comma key (,) to step back one frame.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I mute or unmute audio?",
        "response": "Press the M key to toggle audio mute on and off instantly.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I adjust playback volume with keys?",
        "response": "Press Up Arrow to increase volume by 5%, and Down Arrow to decrease volume by 5%.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I adjust playback speed?",
        "response": "Press Shift + Period (>) to speed up playback up to 4.0x, or Shift + Comma (<) to slow down to 0.25x. Press Shift + 0 to reset to 1.0x.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I capture a screenshot frame?",
        "response": "Press the S key to capture the current high-resolution video frame and save it as a lossless PNG image.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "What is Picture-in-Picture mode and how do I activate it?",
        "response": "Picture-in-Picture floats the video in a dedicated desktop window while you multitask. Press the P key to activate Picture-in-Picture.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "What is A-B Repeat and how do I use it?",
        "response": "A-B Repeat continuously loops a specific segment. Press [ to set start Point A, press ] to set end Point B, and press Backslash (\\) to clear the loop.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "Can I jump to a percentage of the video using numbers?",
        "response": "Yes. Press keys 0 through 9 on your keyboard to jump to 0% through 90% of total video duration. For example, pressing 5 jumps directly to the midpoint.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I rotate a sideways video?",
        "response": "Press the R key in the player to rotate the video orientation 90 degrees clockwise through 0, 90, 180, and 270 degrees.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "prompt": "How do I zoom into video details?",
        "response": "Scroll your mouse wheel over the video canvas to zoom in and out smoothly, or double-click to toggle 2x digital zoom.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 3. 10-Band Equalizer & Web Audio Studio
    # =========================================================================
    {
        "category": "audio_studio",
        "prompt": "How do I open the 10-Band Equalizer?",
        "response": "Press the E key on your keyboard to open Web Audio Studio, where you can adjust the 10 ISO octave equalizer bands, preamp, and stereo balance.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "What are the 10 frequency bands in the equalizer?",
        "response": "The 10 bands follow standard ISO octave centers: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, and 16kHz.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "What audio presets are built into MASTER CLOUD?",
        "response": "Built-in presets include Flat, Bass Boost, Vocal Clarity, Rock, Electronic, Cinema Surround, Podcast Speech, and Classical.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "How does the Vocal Clarity preset work?",
        "response": "Vocal Clarity attenuates sub-bass rumble below 125Hz, boosts speech presence between 1kHz and 3kHz by +3dB, and smooths harsh treble above 10kHz.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "What does the 32Hz frequency slider control?",
        "response": "The 32Hz slider controls the lowest sub-bass frequencies, adding deep physical rumble to explosions, cinematic scores, and electronic synths.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "What does the 16kHz frequency slider control?",
        "response": "The 16kHz slider controls top-end brilliance, air, and sparkle, shaping the acoustic decay of cymbals, string harmonics, and room reverb.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "How do I fix audio sync delay or lip-sync mismatch?",
        "response": "In Web Audio Studio, adjust the Audio Delay slider between -500ms and +500ms to synchronize sound precisely with video lip movements.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "What is stereo balance?",
        "response": "Stereo balance adjusts the relative output gain between Left and Right audio channels from -1.0 (full left) to +1.0 (full right).",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "prompt": "Does adjusting the equalizer alter the original video file?",
        "response": "No. All equalization occurs in real time in the browser audio output pipeline using BiquadFilterNodes without modifying the source video file.",
        "source": "MASTER CLOUD Audio Engineering Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 4. Subtitle Studio, Closed Captions & Formats
    # =========================================================================
    {
        "category": "subtitles",
        "prompt": "How do I open Subtitle Studio?",
        "response": "Press the C key to open Subtitle Studio to load external subtitles, adjust synchronization offset, and format text appearance.",
        "source": "MASTER CLOUD Subtitle Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "prompt": "What subtitle file formats are supported?",
        "response": "MASTER CLOUD supports SubRip (.srt), WebVTT (.vtt), and embedded CEA-608 / CEA-708 closed caption text tracks.",
        "source": "MASTER CLOUD Subtitle Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "prompt": "How do I fix out-of-sync subtitles?",
        "response": "Open Subtitle Studio and adjust the Sync Offset slider in milliseconds (+/- 5000ms) until spoken dialogue matches the subtitle display.",
        "source": "MASTER CLOUD Subtitle Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "prompt": "Can I customize subtitle styling?",
        "response": "Yes. You can customize font family, font size from 12px to 48px, text color, outline thickness, background opacity, and vertical offset.",
        "source": "MASTER CLOUD Subtitle Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "prompt": "How can I export video subtitles?",
        "response": "Go to the Export tab in MasterAI Studio to download transcripts as SRT, WebVTT, Markdown, CSV, TXT, or JSON files.",
        "source": "MASTER CLOUD Subtitle Documentation",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 5. Video Intelligence & Scene Detection
    # =========================================================================
    {
        "category": "scene_detection",
        "prompt": "How do I detect scenes in my video?",
        "response": "Press the X key or open Smart Scene Detection. MasterAI analyzes consecutive frame luminance deltas to automatically generate chapter markers.",
        "source": "MASTER CLOUD Video Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "scene_detection",
        "prompt": "How does scene detection work mathematically?",
        "response": "We sample video frames onto an offscreen canvas, compute grayscale pixel luminance histograms, and calculate the Euclidean difference between adjacent frames. Transitions exceeding the 30% threshold are flagged as scene cuts.",
        "source": "MASTER CLOUD Video Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "scene_detection",
        "prompt": "Can I jump to detected scenes on the timeline?",
        "response": "Yes. Detected scenes appear as clickable markers on the timeline seekbar and in the Scenes panel. Clicking any scene jumps directly to that timestamp.",
        "source": "MASTER CLOUD Video Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "scene_detection",
        "prompt": "Generate chapters for my video.",
        "response": "Based on detected scene transitions, here are the chapters: - [00:00] Introduction & Opening Hook - [02:30] Core Technical Demonstration - [05:45] Results & Summary.",
        "source": "MASTER CLOUD Video Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 6. Speech Analysis & Audio Intelligence
    # =========================================================================
    {
        "category": "speech_intelligence",
        "prompt": "Explain speech pacing.",
        "response": "Speech pacing is measured in Words Per Minute (WPM). A standard conversational pace is 120 to 160 WPM. Over 165 WPM is considered fast-paced, while under 100 WPM indicates slow delivery.",
        "source": "MASTER CLOUD Speech Metrics",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "speech_intelligence",
        "prompt": "How do you detect silence in video audio?",
        "response": "We analyze audio buffers using Root Mean Square (RMS) energy levels. Segments with energy below -40 dBFS for more than 500ms are classified as pauses or silence.",
        "source": "MASTER CLOUD Speech Metrics",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "speech_intelligence",
        "prompt": "How do I search transcript dialogue?",
        "response": "Press the T key or open the Search tab, enter your keyword, and click any matching result to seek immediately to that exact timestamp.",
        "source": "MASTER CLOUD Transcript Search",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "speech_intelligence",
        "prompt": "How does local transcript indexing work?",
        "response": "We construct an in-memory BM25 index of all transcript cues, weighting unique terms and query relevance to rank timestamp matches instantaneously.",
        "source": "MASTER CLOUD Transcript Search",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "speech_intelligence",
        "prompt": "How is audio extracted from a local video file?",
        "response": "The browser reads the container file and uses an OfflineAudioContext to downmix and resample the embedded audio track into a 16,000 Hz mono Float32Array PCM buffer.",
        "source": "MASTER CLOUD Audio Pipeline",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 7. Codecs, Formats & Browser Capabilities
    # =========================================================================
    {
        "category": "codecs",
        "prompt": "What video formats are supported natively in MASTER CLOUD?",
        "response": "MASTER CLOUD natively supports MP4 (H.264, AV1), WebM (VP8, VP9, Opus), MOV, MKV, OGG, and HLS (.m3u8) adaptive streaming playlists.",
        "source": "MASTER CLOUD Codec Compatibility",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "codecs",
        "prompt": "Can MASTER CLOUD play 4K video at 60 frames per second?",
        "response": "Yes, provided your computer has hardware decoding support via GPU acceleration such as NVDEC, Intel QuickSync, or Apple VideoToolbox.",
        "source": "MASTER CLOUD Codec Compatibility",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "codecs",
        "prompt": "What is HLS adaptive streaming?",
        "response": "HTTP Live Streaming (HLS) dynamically adjusts video bitrate and resolution according to current network conditions using segmented media playlists.",
        "source": "MASTER CLOUD Codec Compatibility",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "codecs",
        "prompt": "Can I drag and drop local media files?",
        "response": "Yes. Drag any video or subtitle file from your desktop into the player drop zone to open it immediately without uploading.",
        "source": "MASTER CLOUD Codec Compatibility",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 8. Privacy, Security & Cloud Keys
    # =========================================================================
    {
        "category": "security",
        "prompt": "Is my video uploaded to the internet when I use MasterAI?",
        "response": "No. All video playback, scene detection, audio processing, and local AI inference occur strictly inside your device's browser sandbox.",
        "source": "MASTER CLOUD Security Policy",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "security",
        "prompt": "How does MasterAI protect API keys?",
        "response": "External cloud API keys are never stored in localStorage or sessionStorage. They are held strictly in ephemeral in-memory state using private fields and are wiped upon page reload.",
        "source": "MASTER CLOUD Security Policy",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "security",
        "prompt": "Does in-memory key storage protect against all attacks?",
        "response": "In-memory storage prevents keys from persisting on disk or surviving tab closure, but it does not protect against malicious scripts executing in the same origin (XSS). Keep your origin secure.",
        "source": "MASTER CLOUD Security Policy",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "security",
        "prompt": "Does MasterAI make external network requests without consent?",
        "response": "Never. All external cloud queries require explicit user confirmation and consent before any request is sent.",
        "source": "MASTER CLOUD Security Policy",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 9. Sinhala Language (Original Bilingual AI Intelligence)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "prompt": "MasterAI යනු කුමක්ද?",
        "response": "MasterAI යනු MASTER CLOUD සඳහා විශේෂයෙන් නිර්මාණය කරන ලද ස්වාධීන මාධ්‍ය බුද්ධි පද්ධතියකි. එය ඔබගේ පරිගණකයේම ක්‍රියාත්මක වේ.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "වීඩියෝව නවත්වන්නේ හෝ වාදනය කරන්නේ කෙසේද?",
        "response": "Spacebar හෝ K යතුර එබීමෙන් වීඩියෝව නැවත නැවතත් වාදනය කිරීම හෝ නැවැත්වීම කළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "Fullscreen කරන්නේ කෙසේද?",
        "response": "පරිගණක යතුරුපුවරුවේ F යතුර එබීමෙන් වීඩියෝව Fullscreen කළ හැක. නැවත සාමාන්‍ය තත්ත්වයට පත්වීමට F හෝ Escape ඔබන්න.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "Equalizer එක විවෘත කරන්නේ කෙසේද?",
        "response": "E යතුර එබීමෙන් 10-Band Web Audio Studio විවෘත කර ශබ්ද වෙනස්කම් සිදුකළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "දර්ශන හඳුනාගැනීම කරන්නේ කෙසේද?",
        "response": "X යතුර එබීමෙන් Smart Scene Detection හරහා වීඩියෝවේ දර්ශන මාරුවීම් ස්වයංක්‍රීයව හඳුනාගත හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "ශබ්දය වැඩි හෝ අඩු කරන්නේ කෙසේද?",
        "response": "Up Arrow යතුරෙන් ශබ්දය 5% කින් වැඩි කළ හැකි අතර, Down Arrow යතුරෙන් 5% කින් අඩු කළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "තත්පර 10ක් ඉදිරියට හෝ පසුපසට යන්නේ කෙසේද?",
        "response": "Right Arrow හෝ L යතුරෙන් ඉදිරියටද, Left Arrow හෝ J යතුරෙන් පසුපසටද තත්පර 10ක් යා හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "උපසිරැසි (Subtitles) එකතු කරන්නේ කෙසේද?",
        "response": "C යතුර ඔබා Subtitle Studio විවෘත කර SRT හෝ VTT ගොනු එක්කර ගත හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "මගේ වීඩියෝ අන්තර්ජාලයට උඩුගත වේද?",
        "response": "නැත. සියලුම වීඩියෝ වාදනය, ශබ්ද සැකසුම් සහ AI විශ්ලේෂණ ඔබගේ පරිගණකය තුළම පමණක් සිදු වේ.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "A-B Repeat භාවිත කරන්නේ කෙසේද?",
        "response": "[ යතුරෙන් Point A ද, ] යතුරෙන් Point B ද සකසා කොටසක් නැවත නැවත වාදනය කළ හැක. Backslash මඟින් එය ඉවත් වේ.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "Screenshot එකක් ගන්නේ කෙසේද?",
        "response": "S යතුර එබීමෙන් වත්මන් වීඩියෝ රාමුව (frame) උසස් තත්ත්වයේ PNG රූපයක් ලෙස සුරැකිය හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "ශබ්ද සැකසුම් වල Presets මොනවාද?",
        "response": "Flat, Bass Boost, Vocal Clarity, Rock, Electronic, Cinema සහ Podcast වැනි සැකසුම් රැසක් පවතී.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "සිංහල භාෂාවෙන් උපසිරැසි සහය දක්වනවාද?",
        "response": "ඔව්, UTF-8 කේතනය කළ සිංහල SRT සහ WebVTT උපසිරැසි සම්පූර්ණයෙන්ම සහය දක්වයි.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "වේගය වෙනස් කරන්නේ කෙසේද?",
        "response": "Shift + Period මඟින් වේගය වැඩි කළ හැකි අතර, Shift + Comma මඟින් වේගය අඩු කළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "වීඩියෝව කරකවන්නේ (Rotate) කෙසේද?",
        "response": "R යතුර එබීමෙන් වීඩියෝව අංශක 90 බැගින් දක්ෂිණාවර්තව කරකවා ගත හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "ශබ්ද ප්‍රමාදය (Audio Delay) හදන්නේ කෙසේද?",
        "response": "Web Audio Studio හි Audio Delay සැකසුම මඟින් ශබ්දය සහ රූපය අතර කාල වෙනස මිලි තත්පර වලින් නිවැරදි කළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "Bookmark එකක් දාන්නේ කෙසේද?",
        "response": "B යතුර එබීමෙන් වත්මන් වේලාවට Bookmark එකක් සුරැකිය හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "prompt": "Picture in Picture භාවිත කරන්නේ කෙසේද?",
        "response": "P යතුර එබීමෙන් වීඩියෝව වෙනම කුඩා කවුළුවක් ලෙස තිරය මත තබාගෙන වැඩ කළ හැක.",
        "source": "MASTER CLOUD Sinhala Documentation",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 10. Sinhala-English Mixed Technical Dialogue (Colloquial Support)
    # =========================================================================
    {
        "category": "mixed_dialogue",
        "prompt": "MASTER CLOUD එකේ video play කරන්නේ කොහොමද?",
        "response": "Spacebar හෝ K key එක press කරලා video එක play හෝ pause කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Equalizer එකේ bass වැඩි කරන්නේ කොහොමද?",
        "response": "E key එක ඔබලා Web Audio Studio එකට ගිහින් 32Hz සහ 64Hz bands වල gain එක වැඩි කරන්න, නැත්නම් Bass Boost preset එක තෝරන්න.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Subtitles sync නැත්නම් හදාගන්නේ කොහොමද?",
        "response": "C key එක press කරලා Subtitle Studio එක open කරගන්න. ඊටපස්සේ Sync Offset slider එකෙන් millisecond ගාණ adjust කරන්න.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Scenes auto detect කරන්නේ කොහොමද?",
        "response": "X key එක ඔබලා Smart Scene Detection open කරන්න. Frame luminance වෙනස්කම් අනුව automatically chapter markers හැදෙනවා.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Audio delay එකක් ආවොත් මොකද කරන්නේ?",
        "response": "E key එකෙන් Audio Studio එකට ගිහින් Audio Delay slider එක -500ms ඉඳන් +500ms වෙනකම් adjust කරලා lip-sync හදාගන්න පුළුවන්.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Playback speed එක 2x කරන්නේ කොහොමද?",
        "response": "Shift + Period (>) key එක press කරලා speed එක 2.0x දක්වා වැඩි කරගන්න පුළුවන්. Reset කරන්න Shift + 0 ඔබන්න.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "MasterAI එක offline වැඩ කරනවද?",
        "response": "ඔව්, MasterAI Core සම්පූර්ණයෙන්ම offline browser එක ඇතුලෙම local AI model එකක් විදියට run වෙනවා.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "prompt": "Video එකෙන් screenshot frame එකක් save කරන්නේ කොහොමද?",
        "response": "S key එක press කරලා current video frame එක high-resolution PNG image එකක් විදියට save කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD User Community FAQ",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # 11. Logical Reasoning & Mathematical Derivation Exercises
    # =========================================================================
    {
        "category": "reasoning",
        "prompt": "If a video is 10 minutes long and has 1500 spoken words, what is the speech pacing in WPM?",
        "response": "Words Per Minute (WPM) is calculated as Total Words divided by Duration in Minutes: 1500 words / 10 minutes = 150 WPM. This falls squarely in the ideal conversational range (120 to 160 WPM).",
        "source": "Speech Rate Analytics & Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "prompt": "What is the uncompressed data size of a 90-second 16kHz 32-bit float mono audio stream?",
        "response": "Total samples = 90 seconds * 16,000 samples/second = 1,440,000 samples. At 4 bytes per 32-bit float sample: 1,440,000 * 4 bytes = 5,760,000 bytes (approximately 5.49 MB).",
        "source": "Digital Signal Processing Fundamentals",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "prompt": "If a video has 4 scene transitions detected at 00:00, 02:00, 05:00, and 08:00, how many scenes exist and what is the longest scene?",
        "response": "There are 4 scenes: Scene 1 (0:00 to 2:00, length 2 min), Scene 2 (2:00 to 5:00, length 3 min), Scene 3 (5:00 to 8:00, length 3 min), and Scene 4 (8:00 to end). The longest scenes are Scene 2 and Scene 3, each lasting 3 minutes.",
        "source": "Video Timeline Logic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "prompt": "A user seeks forward 10 seconds 3 times and backward 5 seconds twice. What is the net time change?",
        "response": "Forward change: 3 * (+10s) = +30s. Backward change: 2 * (-5s) = -10s. Net time change: +30s - 10s = +20 seconds forward.",
        "source": "Playback Navigation Logic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "prompt": "Why does doubling the frequency from 1kHz to 2kHz represent exactly one octave in audio acoustics?",
        "response": "In acoustic physics, an octave is defined as the musical interval between one tone and another with double its frequency: f2 / f1 = 2.0. Thus, going from 1,000 Hz to 2,000 Hz is exactly one octave.",
        "source": "Acoustics & ISO Octave Standards",
        "license": "Public Domain Audio Standards",
    },
    {
        "category": "reasoning",
        "prompt": "Calculate the file size of a 60-second video stream with a video bitrate of 5000 kbps and audio bitrate of 192 kbps.",
        "response": "Total bitrate = 5000 + 192 = 5192 kilobits per second. Total kilobits = 5192 kbps * 60 seconds = 311,520 kilobits. Dividing by 8 gives 38,940 kilobytes, which is approximately 38.03 Megabytes.",
        "source": "Digital Video Bitrate Calculations",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "prompt": "What aspect ratio does a 1920x1080 resolution video have?",
        "response": "The greatest common divisor of 1920 and 1080 is 120. Dividing 1920 by 120 gives 16, and dividing 1080 by 120 gives 9. Therefore, the aspect ratio is 16:9 standard widescreen.",
        "source": "Display Geometry Mathematics",
        "license": "Public Domain Technical Mathematics",
    },

    # =========================================================================
    # 12. Conversational Turns & Summarization
    # =========================================================================
    {
        "category": "conversation",
        "prompt": "Hello MasterAI! How are you today?",
        "response": "Greetings! I am MasterAI Core, fully operational and ready to assist you with video playback, audio tuning, scene detection, or transcript search.",
        "source": "MASTER CLOUD Dialogue Engine",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "prompt": "Summarize this video.",
        "response": "Based on the dialogue and visual scenes, here is the executive summary: The media presents an overview of system capabilities, introduces core milestones, and delivers actionable conclusions.",
        "source": "MASTER CLOUD Dialogue Engine",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "prompt": "What are the key takeaways from the video?",
        "response": "Key takeaways: 1. Core architectural workflow demonstrated. 2. Performance metrics validated across devices. 3. Final recommendations provided for implementation.",
        "source": "MASTER CLOUD Dialogue Engine",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "prompt": "Thank you MasterAI!",
        "response": "You are most welcome! Let me know whenever you need assistance with playback, scene detection, audio tuning, or transcript search.",
        "source": "MASTER CLOUD Dialogue Engine",
        "license": "Proprietary Project Documentation",
    },
]


def format_sample(prompt: str, response: str) -> str:
    """Standard formatting for conversational training pairs."""
    return f"User: {prompt}\nAssistant: {response}"


def clean_and_deduplicate(dataset_entries: List[Dict[str, str]]) -> Tuple[List[Dict[str, str]], Dict[str, Any]]:
    """Deduplicates dataset entries using SHA-256 hashes of formatted strings."""
    seen_hashes = set()
    deduped = []
    category_counts = {}
    stats = {"total_raw": len(dataset_entries), "duplicates_removed": 0, "final_count": 0}

    for item in dataset_entries:
        text = format_sample(item["prompt"], item["response"]).strip()
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if h not in seen_hashes:
            seen_hashes.add(h)
            deduped.append(item)
            cat = item.get("category", "general")
            category_counts[cat] = category_counts.get(cat, 0) + 1
        else:
            stats["duplicates_removed"] += 1

    stats["final_count"] = len(deduped)
    stats["categories"] = category_counts
    return deduped, stats


def partition_dataset(
    dataset_entries: List[Dict[str, str]], train_ratio: float = 0.75, val_ratio: float = 0.15
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]], List[Dict[str, str]]]:
    """
    Strict deterministic partition:
    75% Train, 15% Validation, 10% Test.
    Zero leakage guaranteed.
    """
    total = len(dataset_entries)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)

    train_data = dataset_entries[:train_end]
    val_data = dataset_entries[train_end:val_end]
    test_data = dataset_entries[val_end:]

    return train_data, val_data, test_data


class MasterAiCorpusDataset(Dataset):
    """
    PyTorch Dataset with Target-Only Loss Masking:
    - Input sequence: <bos>User: {prompt}\nAssistant: {response}
    - Target sequence: [-100, ..., -100] for prompt tokens, followed by response tokens + <eos>
    - Ignores prompt tokens and padding tokens in CrossEntropyLoss by assigning label -100.
    """

    def __init__(
        self,
        entries: List[Dict[str, str]],
        tokenizer: MasterAiTokenizer,
        max_seq_len: int = 256,
        target_only_loss: bool = True,
    ):
        self.tokenizer = tokenizer
        self.max_seq_len = max_seq_len
        self.samples: List[Tuple[torch.Tensor, torch.Tensor]] = []

        for item in entries:
            prompt_str = f"User: {item['prompt']}\nAssistant: "
            response_str = f"{item['response']}"

            prompt_tokens = tokenizer.encode(prompt_str, add_bos=True, add_eos=False)
            response_tokens = tokenizer.encode(response_str, add_bos=False, add_eos=True)

            full_tokens = prompt_tokens + response_tokens
            if len(full_tokens) > max_seq_len:
                full_tokens = full_tokens[:max_seq_len]

            if len(full_tokens) < 4:
                continue

            # Pad sequence to max_seq_len
            pad_len = max_seq_len - len(full_tokens)
            padded_input = full_tokens[:-1] + [tokenizer.PAD_ID] * (pad_len + 1)
            padded_target = full_tokens[1:] + [tokenizer.PAD_ID] * (pad_len + 1)

            x = torch.tensor(padded_input[: max_seq_len - 1], dtype=torch.long)
            y = torch.tensor(padded_target[: max_seq_len - 1], dtype=torch.long)

            if target_only_loss:
                # Mask prompt tokens with -100 so loss is computed solely on the Assistant's response
                prompt_len = min(len(prompt_tokens) - 1, len(x))
                y[:prompt_len] = -100

            # Mask padding tokens with -100
            actual_target_len = max(0, len(full_tokens) - 1)
            if actual_target_len < len(y):
                y[actual_target_len:] = -100

            self.samples.append((x, y))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.samples[idx]
