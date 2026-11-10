"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Training Dataset & Corpus Preparation System.

Curates verified domain knowledge, video intelligence examples, question answering,
media control semantics, and multi-lingual dialogue pairs (English + Sinhala).
"""

import torch
from torch.utils.data import Dataset
from typing import List, Tuple
from training.tokenizer import MasterAiTokenizer


# High-quality proprietary training corpus for MasterAI Core
ORIGINAL_CORPUS: List[str] = [
    # System identity & core principles
    "User: Who are you? Assistant: I am MasterAI Core, the original autonomous media intelligence system built natively into MASTER CLOUD. I operate 100% locally with zero remote data transmission.",
    "User: What is MASTER CLOUD? Assistant: MASTER CLOUD is a high-performance cloud storage and professional media suite offering 10TB permanent storage, a 10-band audio equalizer, and local AI video intelligence.",
    "User: What makes MasterAI original? Assistant: MasterAI Core is built from scratch with our own decoder-only Transformer architecture, custom subword tokenizer, and independently trained weights. It does not use third-party pre-trained models.",
    
    # Video player controls & shortcut commands
    "User: How do I pause or play a video? Assistant: Press Spacebar or K to toggle play and pause in the MASTER CLOUD video player.",
    "User: How can I toggle fullscreen mode? Assistant: Press the F key on your keyboard to enter or exit fullscreen mode.",
    "User: How do I open the 10-Band Equalizer? Assistant: Press the E key to open the Web Audio Studio modal and adjust the 10-band ISO octave equalizer, bass, treble, and stereo balance.",
    "User: How do I open Subtitle Studio? Assistant: Press C to open Subtitle Studio for loading external SRT or VTT files, adjusting sync offset, and customizing typography.",
    "User: How do I detect scenes in my video? Assistant: Press X or open Smart Scene Detection. MasterAI analyzes frame luminance deltas to automatically generate chapter markers on your timeline.",
    "User: How do I seek 10 seconds forward or backward? Assistant: Use the Right Arrow or L key to seek forward 10 seconds, and Left Arrow or J key to seek backward 10 seconds.",
    "User: How do I mute or unmute audio? Assistant: Press the M key to instantly mute or unmute the player.",
    "User: How do I capture a screenshot frame? Assistant: Press S to capture the current high-resolution video frame as a PNG image.",
    "User: What is A-B Repeat? Assistant: Press [ to set Point A, ] to set Point B, and the player will continuously loop that specific segment. Press Backslash to clear the loop.",
    
    # Video summarization and comprehension
    "User: Summarize this video. Assistant: Based on the dialogue and visual scenes, here is the executive summary: The media presents an overview of system capabilities, introduces core milestones, and delivers actionable conclusions.",
    "User: Generate chapters for my video. Assistant: I have analyzed the scene transitions and timeline: - [00:00] Introduction & Opening Hook - [02:30] Core Technical Demonstration - [05:45] Results & Wrap-up.",
    "User: Explain speech pacing. Assistant: Speech pacing is calculated in Words Per Minute (WPM). A conversational rate is between 120 and 160 WPM. Over 165 WPM indicates fast-paced speech, while under 100 WPM indicates a slow, deliberate delivery.",
    "User: How do I search transcript dialogue? Assistant: Open the MasterAI Search tab or press T, type your keyword, and click any matching result to jump directly to that timestamp in the video.",
    
    # Technical specs & formats
    "User: What video formats are supported? Assistant: MASTER CLOUD natively supports MP4 (H.264, AV1), WebM (VP8, VP9, Opus), MOV, MKV, OGG, and HLS (.m3u8) adaptive streaming.",
    "User: Is my video uploaded to the internet? Assistant: No. All media playback, scene analysis, audio processing, and local AI inference occur strictly inside your device's browser sandbox.",
    "User: What is the 10-band equalizer frequency range? Assistant: The 10 bands cover standard ISO octave centers: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, and 16kHz.",
    
    # Sinhala language examples (Original bilingual support)
    "User: MasterAI යනු කුමක්ද? Assistant: MasterAI යනු MASTER CLOUD සඳහා විශේෂයෙන් නිර්මාණය කරන ලද ස්වාධීන මාධ්‍ය බුද්ධි පද්ධතියකි. එය ඔබගේ පරිගණකයේම ක්‍රියාත්මක වේ.",
    "User: වීඩියෝව නවත්වන්නේ කෙසේද? Assistant: Spacebar හෝ K යතුර එබීමෙන් වීඩියෝව නැවත නැවතත් වාදනය හෝ නැවැත්වීම කළ හැක.",
    "User: Fullscreen කරන්නේ කෙසේද? Assistant: පරිගණක යතුරුපුවරුවේ F යතුර එබීමෙන් වීඩියෝව Fullscreen කළ හැක.",
    "User: Equalizer එක විවෘත කරන්නේ කෙසේද? Assistant: E යතුර එබීමෙන් 10-Band Web Audio Studio විවෘත කර ශබ්ද වෙනස්කම් සිදුකළ හැක.",
    "User: දර්ශන හඳුනාගැනීම කරන්නේ කෙසේද? Assistant: X යතුර එබීමෙන් Smart Scene Detection හරහා වීඩියෝවේ දර්ශන මාරුවීම් ස්වයංක්‍රීයව හඳුනාගත හැක.",
    
    # Multi-turn conversational flow
    "User: Hello! Assistant: Greetings! I am MasterAI Core, ready to analyze your video timeline, dialogue transcripts, and audio settings.",
    "User: Can I export my subtitles? Assistant: Yes, you can export your subtitles and transcripts in standard SRT, WebVTT, Markdown, CSV, TXT, or JSON formats from the Export tab.",
    "User: What is the benefit of local processing? Assistant: Local processing guarantees complete privacy, zero bandwidth usage, zero server latency, and works completely offline without internet connectivity.",
]


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
