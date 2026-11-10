"""
MASTER CLOUD — MASTER AI ORIGINAL TRAINING CORPUS (v0.6)
Expansion Set: Advanced Troubleshooting, Multi-Step Workflows & Bilingual QA.

Human-authored verified training pairs providing:
- Step-by-step diagnostic workflows.
- Hardware acceleration and playback optimization guidance.
- Subtitle encoding (UTF-8) and font rendering explanations.
- Authentic Sinhala and mixed conversational troubleshooting.
- All responses conclude with grammatically proper terminal punctuation.
"""

from typing import List, Dict

V06_ADVANCED_ENTRIES: List[Dict[str, str]] = [
    # 1. Advanced Playback & Performance Troubleshooting (English)
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "What should I do if a 4K 60fps video drops frames or stutters during playback?",
        "response": "To resolve video stuttering: 1. Ensure hardware acceleration is enabled in your web browser settings under System. 2. Close background tabs that consume excessive GPU or CPU resources. 3. If playing from an external USB drive, copy the media file to your local SSD for higher read throughput. 4. Verify the video is encoded in standard H.264 or VP9 rather than unoptimized high-bitrate profiles.",
        "source": "MASTER CLOUD Performance Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "How does hardware acceleration improve playback in MASTER CLOUD?",
        "response": "Hardware acceleration offloads video decoding directly to your dedicated GPU or integrated graphics processor. This frees up the CPU, prevents dropped frames, reduces laptop battery consumption, and ensures smooth 60fps playback for 4K video.",
        "source": "MASTER CLOUD Technical Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "Can I play audio-only files like MP3, WAV, or FLAC in MASTER CLOUD?",
        "response": "Yes. MASTER CLOUD fully supports standalone audio playback for MP3, WAV, AAC, and OGG formats. When an audio file is loaded, the player displays a dedicated visual waveform and activates the 10-Band Equalizer.",
        "source": "MASTER CLOUD Media Formats Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "Why do my subtitles show broken question marks or weird boxes instead of letters?",
        "response": "Broken subtitle text occurs when subtitle files are saved in legacy encodings like ANSI or Windows-1252. To fix this, open your subtitle file in a text editor like Notepad, choose 'Save As', and ensure the encoding is set to UTF-8.",
        "source": "MASTER CLOUD Subtitle Troubleshooting",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "How do I create and manage video bookmarks in MASTER CLOUD?",
        "response": "To bookmark an important moment: 1. Pause or play to the target timestamp. 2. Press the B key or click the bookmark ribbon icon. 3. Enter an optional text note to describe the scene. You can click any saved bookmark in the Bookmarks panel to jump directly to that timestamp.",
        "source": "MASTER CLOUD Bookmarks Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "What does the Flat preset do in the 10-Band Equalizer?",
        "response": "The Flat preset resets all ten frequency band sliders to zero decibels. This provides completely neutral, uncolored audio reproduction exactly as mastered by the sound engineer.",
        "source": "MASTER CLOUD Audio Studio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "What is the difference between peak volume gain and audio clipping?",
        "response": "Volume gain amplifies the audio waveform. However, boosting equalizer bands beyond plus 12 decibels without lowering the master volume can cause digital clipping, which produces harsh crackling distortion. Keep levels balanced to maintain clean sound.",
        "source": "MASTER CLOUD Audio Studio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting",
        "group": "v06_en_troubleshooting",
        "language": "english",
        "prompt": "How does MasterAI generate video chapters from visual transitions?",
        "response": "MasterAI samples video frames across the timeline and computes luminance histogram differences between consecutive frames. When a transition delta exceeds the cut threshold, a chapter boundary is registered with its exact timestamp.",
        "source": "MASTER CLOUD Scene Detection Specification",
        "license": "Proprietary Project Documentation",
    },

    # 2. Advanced Sinhala Technical Troubleshooting
    {
        "category": "troubleshooting_si",
        "group": "v06_si_troubleshooting",
        "language": "sinhala",
        "prompt": "4K වීඩියෝවක් play වෙද්දී හිරවෙනවා (stutter) නම් කළ යුත්තේ කුමක්ද?",
        "response": "වීඩියෝව හිරවීම වැළැක්වීමට: 1. ඔබේ බ්‍රවුසරයේ සැකසුම් (Settings) වෙත ගොස් Hardware Acceleration සක්‍රිය කරන්න. 2. පසුබිමේ ඇති අනවශ්‍ය ටැබ් වසා දමන්න. 3. වීඩියෝව බාහිර ධාවකයකින් වාදනය කරන්නේ නම් එය ඔබේ පරිගණකයේ SSD ධාවකයට පිටපත් කර වාදනය කරන්න.",
        "source": "MASTER CLOUD Sinhala Troubleshooting Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting_si",
        "group": "v06_si_troubleshooting",
        "language": "sinhala",
        "prompt": "සිංහල උපසිරැසි (Sinhala Subtitles) නිවැරදිව දර්ශනය නොවන්නේ ඇයි?",
        "response": "උපසිරැසි ගොනුව ANSI ආකෘතියෙන් සුරැකී තිබීම මෙයට හේතුවයි. Notepad මගින් උපසිරැසි ගොනුව විවෘත කර Save As තෝරා එහි Encoding අගය UTF-8 ලෙස වෙනස් කර සුරකින්න.",
        "source": "MASTER CLOUD Sinhala Troubleshooting Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting_si",
        "group": "v06_si_troubleshooting",
        "language": "sinhala",
        "prompt": "වීඩියෝවක වැදගත් තැනක් සලකුණු කර (Bookmark) තබා ගන්නේ කෙසේද?",
        "response": "අවශ්‍ය ස්ථානයේදී B යතුර ඔබන්න. එවිට එම වේලාව සහිතව Bookmark එකක් සටහන් වේ. Bookmarks පුවරුවෙන් එම සලකුණ ක්ලික් කර ඕනෑම වේලාවක එම ස්ථානයට පිවිසිය හැකිය.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting_si",
        "group": "v06_si_troubleshooting",
        "language": "sinhala",
        "prompt": "Equalizer එකේ Flat පෙරසිටුවමෙන් සිදු වන්නේ කුමක්ද?",
        "response": "Flat පෙරසිටුවම මගින් සියලුම සංඛ්‍යාත ස්ලයිඩර් 0dB අගයට සකසයි. එමගින් කිසිදු කෘතිම වෙනස් කිරීමකින් තොරව මුල් ශබ්දය එලෙසින්ම ශ්‍රවණය කළ හැකිය.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "troubleshooting_si",
        "group": "v06_si_troubleshooting",
        "language": "sinhala",
        "prompt": "MasterAI Core මගින් පරිගණකයේ RAM මතකය අධික ලෙස භාවිත වෙනවාද?",
        "response": "නැත. MasterAI Core නිර්මාණය කර ඇත්තේ 5.06M පරාමිතීන් සහිත සංයුක්ත සැහැල්ලු ආකෘතියක් වශයෙනි. එය ක්‍රියාත්මක වීමට වැය වන්නේ ඉතා සුළු මතක ප්‍රමාණයකි.",
        "source": "MASTER CLOUD Sinhala Architecture Guide",
        "license": "Proprietary Project Documentation",
    },

    # 3. Advanced Mixed Technical Support Dialogue
    {
        "category": "mixed_advanced",
        "group": "v06_mix_advanced",
        "language": "mixed",
        "prompt": "Video එකක් play වෙද්දී laptop battery එක ඉක්මනට බහින්නේ ඇයි?",
        "response": "Hardware acceleration off වෙලා තිබුණොත් CPU එකෙන් software decoding කරන්න ගිහින් battery එක ඉක්මනට බහිනවා. Browser settings වල Hardware Acceleration on කරලා තියාගන්න.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_advanced",
        "group": "v06_mix_advanced",
        "language": "mixed",
        "prompt": "Subtitles වල timing mismatch එකක් තත්පර 2 කින් හදන්නේ කොහොමද?",
        "response": "Subtitle panel එක open කරලා Subtitle Offset slider එකෙන් +2.0s හෝ -2.0s වලට adjust කරන්න. එතකොට dialogues වලට හරියටම sync වෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_advanced",
        "group": "v06_mix_advanced",
        "language": "mixed",
        "prompt": "Audio crackle හෝ distortion එන එක නවත්තන්නේ කොහොමද?",
        "response": "Equalizer sliders +12dB වලට වඩා boost කරලා තිබුණොත් digital clipping නිසා crackling එන්න පුළුවන්. EQ bands ටික අඩු කරලා master volume එක balance කරන්න.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_advanced",
        "group": "v06_mix_advanced",
        "language": "mixed",
        "prompt": "Chapters export කරලා SRT file එකක් විදිහට download කරගන්නේ කොහොමද?",
        "response": "MasterAI Studio එකේ Chapters tab එකට ගිහින් Export button එක ඔබන්න. එතනින් SRT format එක තේරූ විට file එක කෙලින්ම download වෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_advanced",
        "group": "v06_mix_advanced",
        "language": "mixed",
        "prompt": "MasterAI Core එකට GPU එකක්ම ඕනෙද run වෙන්න?",
        "response": "නැහැ. MasterAI Core එක standard CPU threads 8 ක් උඩ සම්පූර්ණයෙන්ම offline run වෙන්න පුළුවන් විදිහට optimize කරලා තියෙන්නේ. WebGPU තියෙනවා නම් තවත් වේගවත් වෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
]
