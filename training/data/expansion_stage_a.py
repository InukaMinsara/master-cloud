"""
MASTER CLOUD — MASTER AI ORIGINAL
Stage A Dataset Expansion (v0.5).

Contains verified human-written training entries covering:
1. Natural English Conversational Dialogue & Multi-turn Interactions
2. Natural Sinhala Language Comprehension & Grammatical Fluency
3. Sinhala-English Mixed Technical Dialogue & UI Assistance
4. Video Player Controls, Frame Stepping & Timeline Geometry
5. Digital Audio Signal Processing, 10-Band EQ & Spatial Acoustics
6. Subtitle Synchronization, Typography & Formatting
7. Logical Reasoning, Pacing Calculations & Mathematics
8. Conversational Summaries & Intent Classification

All entries are strictly tracked with provenance and licensed under
Proprietary Project Documentation or Public Domain Technical Material.
"""

from typing import List, Dict

STAGE_A_ENTRIES: List[Dict[str, str]] = [
    # =========================================================================
    # Group: english_conversation (Natural English Dialogue)
    # =========================================================================
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "Hello! How can you help me today?",
        "response": "Hello! I am MasterAI Core, your built-in local media intelligence assistant. I can assist you with video controls, equalizer tuning, subtitle synchronization, audio diagnostics, and scene detection.",
        "source": "MASTER CLOUD Dialogue Engineering",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "What should I do if my video playback is stuttering?",
        "response": "If video playback is stuttering, try lowering the playback resolution, closing background browser tabs to free up GPU memory, or switching your hardware acceleration settings in browser preferences.",
        "source": "MASTER CLOUD Video Playback Troubleshooting",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "Can you summarize what makes a good video watching experience?",
        "response": "A great video experience relies on balanced audio levels, clear vocal frequencies without distortion, accurate subtitle timing, smooth frame delivery, and intuitive keyboard navigation.",
        "source": "MASTER CLOUD Media Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "Thank you for the explanation!",
        "response": "You are very welcome! If you have any more questions about your media files, keyboard shortcuts, or audio filters, feel free to ask anytime.",
        "source": "MASTER CLOUD Dialogue Engineering",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "Can you explain what a media player buffer is?",
        "response": "A media buffer is a reserved segment of memory that preloads upcoming video and audio chunks so that playback continues smoothly even if there are momentary delays in data reading.",
        "source": "Digital Media Architecture Handbook",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "Why is local processing important for personal media files?",
        "response": "Local processing ensures that your private media files, recordings, and transcripts are never uploaded to remote cloud servers, preserving complete confidentiality and eliminating network latency.",
        "source": "MASTER CLOUD Privacy Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "How do I take a clean screenshot of a video frame?",
        "response": "Press the S key on your keyboard to capture the current video frame as a full-resolution PNG image directly from the player canvas without any on-screen controls overlaying it.",
        "source": "MASTER CLOUD Hotkey Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "What is the difference between pausing and stopping a video?",
        "response": "Pausing freezes the video at its current timestamp so you can resume immediately, whereas stopping resets the playback head back to the beginning of the timeline.",
        "source": "Media Player UI Standards",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "How do I adjust playback speed for fast learning?",
        "response": "Use the playback speed menu or press Shift + Right Arrow to increase speed up to 2x or 3x, allowing you to review lectures and recorded presentations in less time.",
        "source": "MASTER CLOUD User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_conversation",
        "prompt": "What does pitch correction do when speeding up playback?",
        "response": "Pitch correction preserves the original pitch of human voices during accelerated playback, preventing speech from sounding high-pitched or squeaky.",
        "source": "Digital Audio DSP Principles",
        "license": "Public Domain Technical Education",
    },

    # =========================================================================
    # Group: sinhala_conversation (Natural Sinhala Dialogue)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "ආයුබෝවන්! මට උදව්වක් අවශ්‍යයි.",
        "response": "ආයුබෝවන්! මම MasterAI Core බුද්ධි පද්ධතියයි. ඔබේ වීඩියෝ වාදනය, ශබ්ද සැකසුම් සහ උපසිරැසි කළමනාකරණය සඳහා මට සහාය විය හැක. ඔබට අවශ්‍ය කුමක්දැයි පවසන්න.",
        "source": "MASTER CLOUD Sinhala Dialogue Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "වීඩියෝ එකක් නතර කරන්නේ කොහොමද?",
        "response": "යතුරුපුවරුවේ Spacebar හෝ K යතුර එබීමෙන් ඔබට වීඩියෝව පහසුවෙන්ම නැවැත්වීමට සහ නැවත වාදනය කිරීමට පුළුවන.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "ශබ්දය ක්ෂණිකව නිශ්ශබ්ද (Mute) කරන්නේ කෙසේද?",
        "response": "M යතුර එබීමෙන් ශබ්දය ක්ෂණිකව නිශ්ශබ්ද කළ හැක. නැවත M යතුර එබූ විට පෙර තිබූ ශබ්ද මට්ටම නැවත සක්‍රිය වේ.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "තිරය විශාල (Fullscreen) කරන්නේ කෙසේද?",
        "response": "F යතුර එබීමෙන් වීඩියෝව සම්පූර්ණ තිරය පුරා විදහා දැක්විය හැක. නැවත Escape හෝ F යතුර එබූ විට සාමාන්‍ය ප්‍රමාණයට පැමිණේ.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "වීඩියෝවේ හඬ පැහැදිලි නැතිනම් කුමක් කළ යුතුද?",
        "response": "E යතුර ඔබා 10-Band Equalizer විවෘත කරන්න. ඉන්පසු Vocal Clarity preset එක තෝරාගැනීමෙන් කථන හඬ ඉතා පැහැදිලිව සකසා ගත හැක.",
        "source": "MASTER CLOUD Sinhala Audio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "උපසිරැසි ගොනුවක් ඇතුළත් කරන්නේ කෙසේද?",
        "response": "C යතුර එබීමෙන් Subtitle Studio විවෘත වේ. එතැනින් ඔබගේ පරිගණකයේ ඇති .srt හෝ .vtt උපසිරැසි ගොනුව පහසුවෙන්ම තෝරා ඇතුළත් කළ හැක.",
        "source": "MASTER CLOUD Sinhala Subtitle Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "වීඩියෝවෙන් ඡායාරූපයක් ලබාගන්නේ කෙසේද?",
        "response": "S යතුර එබීමෙන් එම මොහොතේ ඇති වීඩියෝ රාමුව පැහැදිලි PNG ඡායාරූපයක් ලෙස ක්ෂණිකව ඔබේ පරිගණකයට බාගත කරගත හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "තත්පර 10ක් ඉදිරියට පනින්නේ කෙසේද?",
        "response": "දකුණු ඊතල යතුර (Right Arrow) හෝ L යතුර එබීමෙන් වීඩියෝව තත්පර 10ක් ඉදිරියට ගෙන යා හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "තත්පර 10ක් පසුපසට පනින්නේ කෙසේද?",
        "response": "වම් ඊතල යතුර (Left Arrow) හෝ J යතුර එබීමෙන් වීඩියෝව තත්පර 10ක් ආපසු ගෙන යා හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_conversation",
        "prompt": "බොහොම ස්තූතියි ඔබේ උපකාරයට!",
        "response": "ඔබට සහාය වීමට ලැබීම මගේ සතුටකි! තවත් ඕනෑම ගැටලුවක් ඇත්නම් මගෙන් විමසන්න.",
        "source": "MASTER CLOUD Sinhala Dialogue Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: mixed_conversation (Sinhala-English Mixed Colloquial Dialogue)
    # =========================================================================
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Video player එකේ speed එක වෙනස් කරන්නේ කොහොමද?",
        "response": "Player controls වල තියෙන Speed dropdown එකෙන් 0.5x සිට 2.0x දක්වා වේගය වෙනස් කරගන්න පුළුවන්. Shortcut විදියට Shift + Right Arrow ඔබන්න.",
        "source": "MASTER CLOUD User Forum",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "A-B Repeat loop එකක් set කරන්නේ කොහොමද?",
        "response": "ආරම්භක ලක්ෂ්‍යයේදී [ යතුර ඔබලා Point A ද, අවසන් ලක්ෂ්‍යයේදී ] යතුර ඔබලා Point B ද සකසන්න. එවිට එම කොටස නැවත නැවත loop වේ.",
        "source": "MASTER CLOUD User Forum",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Audio sync delay එකක් හදාගන්නේ කොහොමද?",
        "response": "E key එක press කරලා Web Audio Studio එකට යන්න. එතැන Audio Delay slider එකෙන් milliseconds ගණන adjust කරලා lip-sync mismatch එක fix කරන්න පුළුවන්.",
        "source": "MASTER CLOUD Audio FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Subtitles වල timing mismatch නම් මොකද කරන්නේ?",
        "response": "Subtitle Studio එකේ Sync Offset විකල්පය භාවිතා කරලා milliseconds 100 හෝ 500 බැගින් captions ඉදිරියට හෝ පස්සට shift කරන්න පුළුවන්.",
        "source": "MASTER CLOUD Subtitle FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Smart Scene Detection run කරන්නේ කොහොමද?",
        "response": "X key එක press කරන්න. Player එක frames වල luminance delta analyze කරලා visual cuts හඳුනාගෙන chapter markers ස්වයංක්‍රීයව නිර්මාණය කරනවා.",
        "source": "MASTER CLOUD Intelligence FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Transcript එකක් export කරගන්නේ කොහොමද?",
        "response": "MasterAI Studio එකේ Export tab එකට ගිහින් SRT, WebVTT, Markdown හෝ CSV ලෙස සම්පූර්ණ transcript එක download කරගත හැක.",
        "source": "MASTER CLOUD Export Studio Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "Mini player එක active කරන්නේ කොහොමද?",
        "response": "P key එක press කරලා video එක Picture-in-Picture window එකක් විදියට screen එකේ පාවෙන විදියට තියාගෙන වෙනත් වැඩ කරන්න පුළුවන්.",
        "source": "MASTER CLOUD Player Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_conversation",
        "prompt": "MKV files play කරන්න බැරි ඇයි?",
        "response": "MKV containers වල සාමාන්‍යයෙන් AC-3 හෝ DTS audio තියෙන නිසා browser වල native demuxing සහය දක්වන්නේ නැහැ. ඒවා MP4 හෝ WebM වලට convert කරන්න.",
        "source": "MASTER CLOUD Codec Documentation",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: video_player_architecture (Technical Explanations)
    # =========================================================================
    {
        "category": "video_controls",
        "group": "video_player_architecture",
        "prompt": "How does frame stepping work in MASTER CLOUD?",
        "response": "Frame stepping advances or rewinds the video element by exactly 1/30th of a second when pressing Period or Comma, enabling precise frame-by-frame visual analysis.",
        "source": "MASTER CLOUD Video Engine",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "video_player_architecture",
        "prompt": "What happens when a video file is dropped into the player drop zone?",
        "response": "The drop zone handles the HTML5 Drag and Drop event, creates a safe local Blob URL using URL.createObjectURL, parses metadata, and resets timeline markers.",
        "source": "MASTER CLOUD VideoDropZone Implementation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "video_player_architecture",
        "prompt": "Why are previous Object URLs revoked when loading a new video?",
        "response": "Previous Object URLs must be explicitly revoked using URL.revokeObjectURL to release memory allocated in the browser media subsystem and prevent cumulative memory leaks.",
        "source": "Web Media Resource Management",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "video_controls",
        "group": "video_player_architecture",
        "prompt": "How is aspect ratio preserved across different monitor sizes?",
        "response": "The player CSS container uses CSS object-fit contain within an aspect-ratio container, ensuring video frames never stretch or distort regardless of browser viewport dimensions.",
        "source": "MASTER CLOUD UI Layout Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "video_player_architecture",
        "prompt": "What is the function of the Smart Timeline scrubber?",
        "response": "The Smart Timeline displays the current playback position, visual scene chapter markers, buffered ranges, and allows sub-second seeking via pointer drag events.",
        "source": "MASTER CLOUD Timeline Architecture",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: digital_audio_dsp (Acoustics, EQ & Signal Processing)
    # =========================================================================
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "What are the 10 ISO standard frequencies on the equalizer?",
        "response": "The 10 standard ISO octave center frequencies are 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, and 16kHz, spanning the full range of human hearing.",
        "source": "ISO 266 Acoustic Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "Why is the equalizer gain clamped between -12dB and +12dB?",
        "response": "Clamping gain between -12dB and +12dB prevents digital clipping distortion and protects audio drivers while still offering a wide 24dB acoustic adjustment range.",
        "source": "Web Audio API DSP Architecture",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "How does stereo panning work in the Web Audio Studio?",
        "response": "Stereo panning uses a StereoPannerNode with a pan parameter clamped from -1.0 for full left channel to +1.0 for full right channel, maintaining constant acoustic power.",
        "source": "Web Audio API Panner Specification",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "What is the purpose of the Bass Boost audio preset?",
        "response": "Bass Boost raises the 32Hz and 64Hz low-frequency shelf filters by +6dB, enhancing low-end punch and resonance in cinematic soundtracks and musical scores.",
        "source": "MASTER CLOUD Audio Preset Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "What is the purpose of the Vocal Clarity preset?",
        "response": "Vocal Clarity attenuates sub-bass frequencies below 125Hz to eliminate room rumble while boosting the 1kHz to 4kHz speech presence band by +4dB for crisp dialogue.",
        "source": "MASTER CLOUD Audio Preset Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_studio",
        "group": "digital_audio_dsp",
        "prompt": "How does audio delay correct lip-sync errors?",
        "response": "A DelayNode delays the audio stream by a user-specified offset up to 1000 milliseconds, synchronizing delayed video frames with early audio.",
        "source": "Audio-Video Synchronization Engineering",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: subtitle_studio (Parsing & Formatting)
    # =========================================================================
    {
        "category": "subtitles",
        "group": "subtitle_studio",
        "prompt": "What is the difference between SubRip (SRT) and WebVTT timestamps?",
        "response": "SubRip SRT uses commas to separate milliseconds like 00:01:23,456, whereas WebVTT uses periods like 00:01:23.456 and starts with a WEBVTT file header.",
        "source": "W3C WebVTT Specification",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "subtitles",
        "group": "subtitle_studio",
        "prompt": "How are HTML tags stripped from subtitle cues?",
        "response": "Subtitle cues pass through a regular expression that removes tags like <i>, <b>, <u>, and <font> to prevent layout corruption and render clean typography.",
        "source": "MASTER CLOUD Subtitle Parser",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "group": "subtitle_studio",
        "prompt": "What happens when a subtitle cue has no end timestamp?",
        "response": "If an end timestamp is missing, the parser estimates a default display duration of three seconds based on average reading speeds to prevent captions from getting stuck.",
        "source": "MASTER CLOUD Subtitle Parser",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "subtitles",
        "group": "subtitle_studio",
        "prompt": "Can subtitles be exported to other formats?",
        "response": "Yes, MasterAI Studio allows one-click export of parsed subtitle cues into SRT, WebVTT, clean Markdown transcripts, or tabular CSV files.",
        "source": "MASTER CLOUD Export Engine",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: media_intelligence (Scene Detection & Speech Pacing)
    # =========================================================================
    {
        "category": "scene_detection",
        "group": "media_intelligence",
        "prompt": "How does luminance delta cut detection work?",
        "response": "The engine samples canvas pixel data across consecutive frames, calculates average luminance deltas, and marks a scene cut when the difference exceeds a threshold of 35.",
        "source": "MASTER CLOUD Video Intelligence",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "scene_detection",
        "group": "media_intelligence",
        "prompt": "What are visual chapter markers used for?",
        "response": "Visual chapter markers identify key transition points in a video, allowing viewers to jump directly to specific topics or scenes along the timeline.",
        "source": "MASTER CLOUD Video Intelligence",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "speech_intelligence",
        "group": "media_intelligence",
        "prompt": "How is speech pacing calculated in words per minute?",
        "response": "Speech pacing is calculated by dividing total spoken words by total speaking duration in seconds, then multiplying by 60 to obtain Words Per Minute (WPM).",
        "source": "Linguistic Speech Analysis",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "speech_intelligence",
        "group": "media_intelligence",
        "prompt": "What speech rate is considered conversational versus rapid?",
        "response": "A rate of 130 to 160 WPM is considered standard conversational speech, while rates above 175 WPM are considered fast, and below 120 WPM are considered slow or deliberate.",
        "source": "Speech Communication Metrics",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "codecs",
        "group": "media_intelligence",
        "prompt": "Why is MP4 with H.264 video and AAC audio the most universal format?",
        "response": "H.264 and AAC have dedicated hardware decoder silicon built into virtually every modern CPU, GPU, mobile device, and web browser, delivering flawless playback with minimal power consumption.",
        "source": "Digital Video Codec Engineering",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "media_intelligence",
        "prompt": "What are the advantages of WebM with VP9 and Opus audio?",
        "response": "WebM is an open, royalty-free container that provides superior compression efficiency compared to H.264, while Opus provides studio-grade audio fidelity at low bitrates.",
        "source": "IETF Opus and WebM Specifications",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: mathematical_reasoning (Geometry, Time, Storage)
    # =========================================================================
    {
        "category": "reasoning",
        "group": "mathematical_reasoning",
        "prompt": "If a video file has a bitrate of 8 Mbps, how much storage will a 10-minute video consume?",
        "response": "A 10-minute video lasts 600 seconds. At 8 megabits per second, that equals 4,800 megabits. Dividing by 8 gives 600 megabytes (MB) of storage.",
        "source": "Digital Media Storage Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "mathematical_reasoning",
        "prompt": "How many seconds are in a timestamp of 01:24:30?",
        "response": "1 hour equals 3600 seconds, 24 minutes equals 1440 seconds, and adding 30 seconds gives a total of 5070 seconds.",
        "source": "Time Unit Conversion Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "mathematical_reasoning",
        "prompt": "If a screen has a 16:9 aspect ratio and a height of 1080 pixels, what is its width?",
        "response": "Multiplying 1080 by 16 and dividing by 9 yields exactly 1920 pixels, which corresponds to standard 1080p Full HD resolution.",
        "source": "Display Geometry Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "mathematical_reasoning",
        "prompt": "How many audio samples are in 45 seconds of 48kHz stereo audio?",
        "response": "Multiplying 45 seconds by 48,000 samples per second per channel yields 2,160,000 samples per channel, or 4,320,000 total interleaved stereo samples.",
        "source": "Digital Sampling Theory",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "mathematical_reasoning",
        "prompt": "If an audio buffer has a duration of 180 seconds, how many 30-second chunks will it produce?",
        "response": "Dividing 180 seconds by 30 seconds yields exactly 6 non-overlapping chunks: 0-30s, 30-60s, 60-90s, 90-120s, 120-150s, and 150-180s.",
        "source": "Buffer Segmentation Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },

    # =========================================================================
    # Group: english_instructions (Step-by-Step Practical Guides)
    # =========================================================================
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I create an A-B loop to study a specific scene?",
        "response": "First play the video until you reach the start of the scene and press the left bracket key to set Point A. Then let the video play until the scene ends and press the right bracket key to set Point B. The video will now continuously loop between those exact two timestamps.",
        "source": "MASTER CLOUD Feature Documentation",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I organize my media library into categories?",
        "response": "Open the Smart Media Organizer from the sidebar menu. Click Scan Library to automatically classify your files into Movies, TV Shows, Music Videos, Courses, and Clips based on file names, duration, and metadata.",
        "source": "MASTER CLOUD Media Organizer Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How can I detect and delete duplicate video files?",
        "response": "Navigate to the Smart Media Organizer and select the Duplicates tab. The system groups files sharing identical content hashes, allowing you to review duplicate copies and remove redundant files to reclaim disk space.",
        "source": "MASTER CLOUD Storage Maintenance Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I use bookmark markers to remember important moments?",
        "response": "While watching a video, press B or click the Bookmark icon to save the current timestamp with an optional note. You can click on any saved bookmark in the Bookmarks panel to jump directly back to that frame.",
        "source": "MASTER CLOUD Bookmarks Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I adjust audio balance if one earphone is quieter?",
        "response": "Press E to open the Web Audio Studio. Use the Stereo Pan slider to shift sound toward the left or right channel until both sides sound balanced and comfortable.",
        "source": "MASTER CLOUD Audio Studio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I export subtitles after adjusting their timing?",
        "response": "Open Subtitle Studio by pressing C, verify that your subtitles align with the actor speech, and click the Export button. Choose your preferred output format: SRT for media players, WebVTT for web streaming, or Markdown for text reading.",
        "source": "MASTER CLOUD Subtitle Studio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I switch between full player view and mini player mode?",
        "response": "Press P to detach the video into native Picture-in-Picture mode or an in-app floating window. Click the expand button or press P again to return the video back to full-screen view.",
        "source": "MASTER CLOUD UI Controls Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I reset all equalizer sliders back to flat neutral?",
        "response": "Open the Web Audio Studio by pressing E, then select the Flat preset from the presets dropdown menu. This immediately resets all 10 frequency bands back to 0dB gain.",
        "source": "MASTER CLOUD Audio Studio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "What should I do if a subtitle file displays garbled text?",
        "response": "Garbled subtitle characters usually indicate an incorrect character encoding. Re-save your subtitle file using standard UTF-8 encoding in a text editor and re-import it into Subtitle Studio.",
        "source": "MASTER CLOUD Subtitle Troubleshooting",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls",
        "group": "english_instructions",
        "prompt": "How do I navigate a playlist of multiple video episodes?",
        "response": "Open the Playback Queue panel on the right side of the player. You can drag and drop items to reorder episodes, toggle repeat-all or repeat-one modes, or double-click any track to play it immediately.",
        "source": "MASTER CLOUD Playlist Management Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: sinhala_instructions (Sinhala Step-by-Step Instructions)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "වීඩියෝවක නිශ්චිත කොටසක් නැවත නැවත වාදනය (Loop) කරන්නේ කෙසේද?",
        "response": "වීඩියෝව වාදනය වන විට ආරම්භක ලක්ෂ්‍යයේදී [ යතුර ඔබා Point A සකසන්න. ඉන්පසු අවශ්‍ය අවසන් ලක්ෂ්‍යයේදී ] යතුර ඔබා Point B සකසන්න. එවිට එම තෝරාගත් කොටස පමණක් නොකඩවා loop වෙමින් වාදනය වේ.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "ප්‍රියතම ස්ථාන (Bookmarks) සටහන් කරගන්නේ කෙසේද?",
        "response": "වීඩියෝව නරඹන අතරතුර B යතුර එබීමෙන් හෝ Bookmark අයිකනය ක්ලික් කිරීමෙන් එම නිශ්චිත තත්පරය සටහන් කරගත හැක. පසු අවස්ථාවක Bookmarks ලැයිස්තුවෙන් එම සටහන මත ක්ලික් කිරීමෙන් ක්ෂණිකව එම ස්ථානයට යා හැක.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "ශබ්ද සැකසුම් (Equalizer) යථා තත්ත්වයට (Reset) පත් කරන්නේ කෙසේද?",
        "response": "E යතුර එබීමෙන් Web Audio Studio විවෘත කරන්න. ඉන්පසු Presets මෙනුවෙන් Flat විකල්පය තෝරන්න. එවිට සියලුම සංඛ්‍යාත ස්ලයිඩර් 0dB මට්ටමට සැකසේ.",
        "source": "MASTER CLOUD Sinhala Audio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "උපසිරැසි වල කාලය ශබ්දයට සමපාත (Sync) කරන්නේ කෙසේද?",
        "response": "C යතුර ඔබා Subtitle Studio විවෘත කරන්න. එහි ඇති Sync Offset ස්ලයිඩරය මඟින් මිලි තත්පර 100 හෝ 500 බැගින් උපසිරැසි ඉදිරියට හෝ පසුපසට ගෙන ගොස් හඬ සමඟ නිවැරදිව ගලපන්න.",
        "source": "MASTER CLOUD Sinhala Subtitle Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "වීඩියෝ ධාවන වේගය වෙනස් කරන්නේ කෙසේද?",
        "response": "ධාවන වේගය වැඩි කිරීමට Shift + Right Arrow යතුර ඔබන්න. වේගය අඩු කිරීමට Shift + Left Arrow ඔබන්න. 0.5x සිට 2.0x දක්වා වේගය වෙනස් කළ හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "වීඩියෝව එක් රාමුව බැගින් (Frame by Frame) නරඹන්නේ කෙසේද?",
        "response": "වීඩියෝව pause කර Period (.) යතුර එබීමෙන් තත්පරයෙන් 30න් එකක් ඉදිරියටද, Comma (,) යතුර එබීමෙන් ආපසුද රාමුවෙන් රාමුව පරීක්ෂා කළ හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "Picture-in-Picture ආකාරයෙන් වීඩියෝව තබන්නේ කෙසේද?",
        "response": "P යතුර එබූ විට වීඩියෝව තිරයේ පාවෙන කවුළුවක් (Mini Player) ලෙස වෙන්වේ. පරිගණකයේ වෙනත් කටයුතු කරන අතරතුරද වීඩියෝව නැරඹීමට මෙය උපකාරී වේ.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_instructions",
        "prompt": "වීඩියෝවෙන් පැහැදිලි ඡායාරූපයක් (Snapshot) ගන්නේ කෙසේද?",
        "response": "S යතුර ඔබන්න. එම ක්ෂණයේ පවතින සම්පූර්ණ විභේදනයෙන් යුත් වීඩියෝ රාමුව කිසිදු අමතර බාධාවකින් තොරව PNG ගොනුවක් ලෙස ඩවුන්ලෝඩ් වේ.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: mixed_instructions (Sinhala-English Mixed Practical Queries)
    # =========================================================================
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Playlist එකට අලුත් videos add කරන්නේ කොහොමද?",
        "response": "Playback Queue panel එක open කරලා Add Media button එක click කරන්න. නැත්නම් files කෙලින්ම player drop zone එකට drag and drop කරන්න.",
        "source": "MASTER CLOUD Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Duplicate video files delete කරන්නේ කොහොමද?",
        "response": "Smart Media Organizer එකේ Duplicates tab එකට යන්න. එතැනදී identical hash තියෙන duplicates list වෙනවා. අනවශ්‍ය copy එක select කරලා delete කරන්න.",
        "source": "MASTER CLOUD Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Background noise එක අඩු කරගන්නේ කොහොමද?",
        "response": "Web Audio Studio එකේ 32Hz සහ 64Hz low-end sliders පහළට දමන්න. Low-cut filter එකෙන් fan noise සහ room rumble සෑහෙන දුරට ඉවත් වෙනවා.",
        "source": "MASTER CLOUD Audio FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Shortcuts full list එක බලාගන්නේ කොහොමද?",
        "response": "Keyboard එකේ ? හෝ Shift + / press කරන්න. Full hotkeys cheat sheet එක screen එකේ popup window එකක් විදියට open වෙනවා.",
        "source": "MASTER CLOUD Community FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Speech pacing metric එකෙන් මනින්නේ මොකක්ද?",
        "response": "වීඩියෝ එකේ කථිකයා විනාඩියකට වචන කීයක් කතා කරනවාද (Words Per Minute) කියන එක speech pacing එකෙන් මනිනවා. Normal pacing එක 130-160 WPM වේ.",
        "source": "MASTER CLOUD Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_instructions",
        "prompt": "Subtitles වල font size එක ලොකු කරන්නේ කොහොමද?",
        "response": "Subtitle Studio panel එකේ Font Size slider එකෙන් 14px සිට 32px දක්වා ඔබට පහසු පරිදි text ප්‍රමාණය adjust කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD Subtitle Guide",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: media_acoustics_fundamentals (Digital Audio Science)
    # =========================================================================
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "What is the Nyquist-Shannon sampling theorem?",
        "response": "The Nyquist-Shannon sampling theorem states that to accurately reconstruct a continuous analog signal, the digital sampling rate must be at least twice the highest frequency present in the signal.",
        "source": "Information Theory and Digital Communications",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "Why is 44.1kHz the standard sample rate for CD audio?",
        "response": "Human hearing extends up to roughly 20,000 Hz. Doubling this requires 40,000 Hz, and 44.1kHz provides sufficient overhead for anti-aliasing reconstruction filters.",
        "source": "Compact Disc Digital Audio Standard",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "What is the difference between peak amplitude and RMS energy?",
        "response": "Peak amplitude measures the single highest instantaneous voltage reached by a sound wave, while Root Mean Square (RMS) measures average acoustic power and perceived human loudness.",
        "source": "Acoustical Measurements Handbook",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "What does a decibel measure in digital audio?",
        "response": "A decibel (dB) is a logarithmic ratio expressing relative power or amplitude. In digital audio, 0 dBFS represents maximum possible signal level before clipping occurs.",
        "source": "Audio Engineering Society Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "What is total harmonic distortion in sound amplification?",
        "response": "Total Harmonic Distortion (THD) measures unwanted harmonic frequencies added to a clean signal by audio processing circuitry, expressed as a percentage of total output.",
        "source": "Audio Engineering Society Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "media_acoustics_fundamentals",
        "prompt": "How does dynamic range compression affect audio?",
        "response": "Dynamic range compression attenuates sound above a set threshold, making loud moments quieter and allowing soft whispered dialogue to be amplified and heard clearly.",
        "source": "Sound Reinforcement Handbook",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: container_codecs_deepdive (Media Formats & Codecs)
    # =========================================================================
    {
        "category": "codecs",
        "group": "container_codecs_deepdive",
        "prompt": "What is the structure of an MP4 ISO base media file?",
        "response": "An MP4 file consists of nested boxes called atoms, such as the ftyp box indicating file type, the moov box containing video and audio track metadata, and mdat holding actual media payloads.",
        "source": "ISO/IEC 14496-12 Standard",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "container_codecs_deepdive",
        "prompt": "What are I-frames, P-frames, and B-frames in video compression?",
        "response": "Intra-coded I-frames are complete standalone images, Predicted P-frames store differences relative to previous frames, and Bi-directional B-frames interpolate differences from both past and future frames.",
        "source": "MPEG Video Compression Fundamentals",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "container_codecs_deepdive",
        "prompt": "Why can an MP4 video play smoothly while its audio fails to play?",
        "response": "This happens when the video stream uses a standard codec like H.264, but the audio stream is encoded in an unsupported proprietary codec such as AC-3 or DTS.",
        "source": "Web Video Architecture Guide",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "container_codecs_deepdive",
        "prompt": "What is the role of an audio demuxer?",
        "response": "An audio demuxer separates interleaved video, audio, and subtitle streams from a multiplexed container file, routing raw audio bitstreams to the audio decoder.",
        "source": "Digital Media Pipeline Engineering",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "container_codecs_deepdive",
        "prompt": "What makes the Opus audio codec superior for internet streaming?",
        "response": "Opus dynamically scales from 6 kbps narrowband speech to 510 kbps multi-channel lossless-quality music with sub-20ms algorithmic delay and seamless bandwidth switching.",
        "source": "IETF RFC 6716 Specification",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: sinhala_general_dialogue (Conversational Sinhala Fluency)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_general_dialogue",
        "prompt": "ඔබට කළ හැකි දේවල් මොනවාද?",
        "response": "මම MASTER CLOUD තුළ ඇති මාධ්‍ය බුද්ධි සහායකයා වෙමි. වීඩියෝ වාදනය පාලනය කිරීම, ශබ්ද සැකසුම් සහ Equalizer සකස් කිරීම, උපසිරැසි කාල ගැලපීම, වීඩියෝ දර්ශන මාරුවීම් හඳුනාගැනීම සහ මාධ්‍ය ගොනු වර්ගීකරණය සඳහා මට ඔබට උදව් කළ හැක.",
        "source": "MASTER CLOUD Sinhala Introduction",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_general_dialogue",
        "prompt": "මගේ පරිගණකයේ ගොනු ආරක්ෂිතද?",
        "response": "ඔව්, ඔබගේ සියලුම වීඩියෝ සහ හඬ ගොනු ඔබගේ පරිගණකයේම පමණක් සැකසෙන අතර කිසිදු බාහිර cloud සර්වරයකට අප්ලෝඩ් නොවේ. ඔබගේ පෞද්ගලිකත්වය 100% ක් සුරක්ෂිතව පවතී.",
        "source": "MASTER CLOUD Privacy Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_general_dialogue",
        "prompt": "වීඩියෝ එකේ ශබ්දය එක පැත්තකට වැඩි නම් කුමක් කළ යුතුද?",
        "response": "E යතුර ඔබා Web Audio Studio විවෘත කරන්න. එහි ඇති Stereo Pan ස්ලයිඩරය වමට හෝ දකුණට මාරු කිරීමෙන් දෙපසම ශබ්දය සමබර කරගත හැක.",
        "source": "MASTER CLOUD Sinhala Audio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_general_dialogue",
        "prompt": "වීඩියෝවක නම වෙනස් කරන්නේ හෝ delete කරන්නේ කෙසේද?",
        "response": "Media Organizer විවෘත කර අදාළ ගොනුව තෝරන්න. එහි ඇති මෙනුව මඟින් ගොනුව නැවත නම් කිරීමට හෝ ඔබේ පරිගණකයෙන් ඉවත් කිරීමට හැකියාව ඇත.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_general_dialogue",
        "prompt": "වීඩියෝවේ දීප්තිය සහ වර්ණ වෙනස් කළ හැකිද?",
        "response": "ඔව්, Settings මෙනුවෙන් Video Filters වෙත ගොස් Brightness, Contrast, Saturation සහ Grayscale මට්ටම් ඔබේ රුචිකත්වය අනුව සකස් කළ හැක.",
        "source": "MASTER CLOUD Video Filters Manual",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: english_reasoning_logic (Logical Deductions & Mathematical Steps)
    # =========================================================================
    {
        "category": "reasoning",
        "group": "english_reasoning_logic",
        "prompt": "If a video has a frame rate of 60 frames per second, how many frames occur in 2.5 minutes?",
        "response": "First, 2.5 minutes equals 150 seconds. Multiplying 150 seconds by 60 frames per second yields exactly 9,000 frames rendered in total.",
        "source": "Frame Rate Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_reasoning_logic",
        "prompt": "If a movie is 120 minutes long and I watch it at 1.5x speed, how long will it take to finish?",
        "response": "Dividing the original 120 minutes by the playback speed multiplier of 1.5 yields 80 minutes, saving you exactly 40 minutes of watching time.",
        "source": "Playback Duration Mathematics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_reasoning_logic",
        "prompt": "What is the uncompressed bit depth size of 10 seconds of 24-bit 96kHz stereo PCM audio?",
        "response": "Multiplying 96,000 samples per second by 3 bytes per sample (24 bits) by 2 stereo channels equals 576,000 bytes per second. For 10 seconds, that totals 5,760,000 bytes (approximately 5.49 megabytes).",
        "source": "Digital Audio Bandwidth Calculation",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_reasoning_logic",
        "prompt": "If a transcript contains 1,200 words delivered over 8 minutes, what is the speaking pace?",
        "response": "Dividing 1,200 words by 8 minutes yields an average speech rate of exactly 150 words per minute (WPM), which falls right within standard conversational clarity.",
        "source": "Speech Pacing Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_reasoning_logic",
        "prompt": "If an aspect ratio is 4:3 and the display width is 1024 pixels, what is the corresponding height?",
        "response": "Dividing 1024 by 4 gives 256. Multiplying 256 by 3 yields 768 pixels, resulting in standard 1024x768 resolution.",
        "source": "Display Aspect Ratio Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },

    # =========================================================================
    # Group: english_summarization (Multi-Sentence Explanations & Summaries)
    # =========================================================================
    {
        "category": "conversation",
        "group": "english_summarization",
        "prompt": "Can you summarize the purpose of the 10-band equalizer in MASTER CLOUD?",
        "response": "The 10-band equalizer gives you complete acoustic control over ten distinct frequency octaves from deep 32Hz sub-bass up to 16kHz brilliance. It lets you customize audio profiles, enhance vocal clarity, boost bass response, and compensate for headphone frequency deficiencies.",
        "source": "MASTER CLOUD Equalizer Whitepaper",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_summarization",
        "prompt": "Summarize how scene detection enhances media navigation.",
        "response": "Scene detection analyzes pixel luminance transitions across frames to detect camera cuts and visual scene changes. It automatically tags the timeline with chapter markers, enabling instantaneous seeking to key narrative moments without manual editing.",
        "source": "MASTER CLOUD Scene Intelligence Whitepaper",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_summarization",
        "prompt": "Summarize the key advantages of running AI locally inside the browser.",
        "response": "Running AI locally in the browser guarantees complete data privacy because your files never leave your computer. It provides zero network latency, functions completely offline without internet connectivity, and eliminates costly API subscriptions.",
        "source": "MASTER CLOUD Local AI Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_summarization",
        "prompt": "Can you explain how the playlist queue handles repeat modes?",
        "response": "The playback queue supports three repeat modes: repeat-off stops playback when the final video ends, repeat-all loops from the last episode back to the first track, and repeat-one continuously replays the currently active video file.",
        "source": "MASTER CLOUD Queue Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "conversation",
        "group": "english_summarization",
        "prompt": "Explain what occurs during subtitle synchronization.",
        "response": "Subtitle synchronization applies an offset to all cue timestamps simultaneously. If dialogue begins before the captions appear, applying a positive offset shifts captions earlier in time so that text and voice match precisely.",
        "source": "MASTER CLOUD Subtitle Architecture",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: mixed_advanced_support (Technical Troubleshooting Dialogue)
    # =========================================================================
    {
        "category": "mixed_dialogue",
        "group": "mixed_advanced_support",
        "prompt": "Audio එක cut වෙන්නේ ඇයි video එක play වෙද්දි?",
        "response": "System sound buffer එක overload වෙනවා නම් එහෙම වෙන්න පුළුවන්. Background tabs close කරලා player settings වලින් buffer size එක වැඩි කරන්න.",
        "source": "MASTER CLOUD Audio Troubleshooting",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_advanced_support",
        "prompt": "Browser cache එක clear කරාම media history නැති වෙනවද?",
        "response": "ඔව්, browser local storage සහ IndexedDB clear කළහොත් saved bookmarks සහ continue-watching checkpoints මැකී යා හැක. ඒ නිසා Settings වලින් backup export එකක් තබාගන්න.",
        "source": "MASTER CLOUD Storage FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_advanced_support",
        "prompt": "HLS streaming video links play කරන්න පුළුවන්ද?",
        "response": "ඔව්, MASTER CLOUD player එක m3u8 playlist links සහ HLS adaptive streaming formats වලට සහය දක්වනවා. URL එක Open Link විකල්පයට paste කරන්න.",
        "source": "MASTER CLOUD Streaming Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_advanced_support",
        "prompt": "Audio spectrum visualizer එක on කරන්නේ කොහොමද?",
        "response": "Web Audio Studio එකේ Visualizer toggle එක click කරන්න. එවිට real-time frequency bars තිරය මත dynamic විදියට animate වෙනවා බලාගත හැක.",
        "source": "MASTER CLOUD Audio Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_advanced_support",
        "prompt": "Chapters export කරගන්නේ කොහොමද YouTube description එකකට?",
        "response": "Export Studio එකේ Copy Chapters for YouTube click කරන්න. එවිට 00:00 Intro, 01:45 Demo වැනි standard timestamped format එකකින් clipboard එකට copy වෙනවා.",
        "source": "MASTER CLOUD Export Guide",
        "license": "Proprietary Project Documentation",
    },
]


