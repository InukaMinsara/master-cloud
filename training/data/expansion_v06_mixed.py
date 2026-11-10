"""
MASTER CLOUD — MASTER AI ORIGINAL TRAINING CORPUS (v0.6)
Expansion Set: Sinhala-English Mixed Technical Dialogue & Colloquial Support.

Curated human-authored dialogue pairs focusing on:
- Colloquial bilingual phrasing (Sinhala sentence structure with standard English tech terms).
- Direct answers to common user troubleshooting questions.
- Accurate hotkey mappings, audio presets, and player actions.
- Grammatically sound sentences ending with terminal punctuation.
"""

from typing import List, Dict

V06_MIXED_ENTRIES: List[Dict[str, str]] = [
    # 1. Player Navigation & Controls (Mixed Dialogue)
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "MASTER CLOUD එකේ video play හෝ pause කරන්නේ කොහොමද?",
        "response": "Keyboard එකේ Space bar එක හෝ K key එක ඔබලා video එක play හෝ pause කරන්න පුළුවන්. නැත්නම් video player screen එක උඩ click කරන්නත් පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "Video එක fullscreen දාගන්නේ කොහොමද?",
        "response": "Fullscreen mode එකට යන්න හෝ full screen එකෙන් අයින් වෙන්න F key එක ඔබන්න. Escape key එක ඔබලාත් normal screen එකට එන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "Video එක තත්පර 10 ක් forward කරන්නේ කොහොමද?",
        "response": "Right Arrow key එක හෝ L key එක ඔබලා video එක තත්පර 10 ක් ඉදිරියට jump කරන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "Video එක තත්පර 10 ක් rewind කරන්නේ කොහොමද?",
        "response": "Left Arrow key එක හෝ J key එක ඔබලා video එක තත්පර 10 ක් ආපස්සට jump කරන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "Frame by frame video එක බලන්නේ කොහොමද?",
        "response": "Video එක pause කරලා period (.) key එකෙන් frame එකක් forward කරන්නත්, comma (,) key එකෙන් frame එකක් backward කරන්නත් පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_controls",
        "group": "v06_mix_controls",
        "language": "mixed",
        "prompt": "High quality screenshot එකක් ගන්නේ කොහොමද?",
        "response": "Keyboard එකේ S key එක ඔබලා දැනට play වෙන frame එකේ clear PNG screenshot එකක් කෙලින්ම download කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },

    # 2. Audio Studio & Equalizer (Mixed Dialogue)
    {
        "category": "mixed_audio",
        "group": "v06_mix_audio",
        "language": "mixed",
        "prompt": "Audio Studio එක සහ 10-band equalizer එක screen එකට ගන්නේ කොහොමද?",
        "response": "Keyboard එකේ E key එක ඔබලා Web Audio Studio එක සහ 10-band equalizer එක toggle කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_audio",
        "group": "v06_mix_audio",
        "language": "mixed",
        "prompt": "Vocal Clarity කියන sound preset එකෙන් මොන වගේ වෙනසක්ද වෙන්නේ?",
        "response": "Vocal Clarity preset එක මගින් කථන හඬ පැහැදිලි වන සේ 1kHz සිට 4kHz දක්වා frequencies boost කරන අතර, අනවශ්‍ය low-end rumble ශබ්ද අඩු කරයි.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_audio",
        "group": "v06_mix_audio",
        "language": "mixed",
        "prompt": "Bass Boost preset එකෙන් වෙන්නේ මොකක්ද?",
        "response": "Bass Boost preset එක මගින් 32Hz, 64Hz, සහ 125Hz low frequencies වැඩි කරලා movie සහ music tracks සඳහා ගැඹුරු bass punch එකක් ලබා දෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_audio",
        "group": "v06_mix_audio",
        "language": "mixed",
        "prompt": "Audio sync delay එකක් හදාගන්නේ කොහොමද?",
        "response": "E key එක ඔබලා Audio Studio එකට ගිහින් Audio Delay slider එකෙන් 0.0s සිට 1.0s දක්වා delay එක adjust කරලා lipsync mismatch එක හදාගන්න පුළුවන්.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },

    # 3. Privacy, Architecture & Containers (Mixed Dialogue)
    {
        "category": "mixed_privacy",
        "group": "v06_mix_privacy",
        "language": "mixed",
        "prompt": "MasterAI Core එකෙන් මගේ video cloud එකට upload වෙනවද?",
        "response": "නැහැ. MasterAI Core එක 100% ක් local device එකේ browser runtime එක ඇතුළේ දුවන්නේ. ඔයාගේ video frames හෝ audio clips කිසිවක් internet එකට යන්නේ නැහැ.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_privacy",
        "group": "v06_mix_privacy",
        "language": "mixed",
        "prompt": "MASTER CLOUD එකේ Local AI සහ Gemini Cloud AI ක්‍රම දෙකේ ප්‍රධාන වෙනස්කම් මොනවාද?",
        "response": "Local AI mode එක අපේම 5.06M parameter neural model එකෙන් 100% offline සහ private විදිහට run වෙනවා. Cloud Gemini mode එක optional එකක් වන අතර Google API key එකක් දුන්නොත් පමණක් cloud AI එකට connect වෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_privacy",
        "group": "v06_mix_privacy",
        "language": "mixed",
        "prompt": "MKV video එකක sound ඇහෙන්නේ නැත්තේ ඇයි?",
        "response": "MKV container වල බොහෝ විට තියෙන්නේ browser වලට natively demux කරන්න බැරි AC-3 හෝ DTS audio streams. ඒ නිසා video එක MP4 (H.264/AAC) හෝ WebM (VP9/Opus) වලට convert කරලා play කරන්න.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_privacy",
        "group": "v06_mix_privacy",
        "language": "mixed",
        "prompt": "A-B Repeat ක්‍රමයෙන් වීඩියෝවේ කොටසක් දිගටම loop කරන්නේ කොහොමද?",
        "response": "Start point එකේදී [ key එක ඔබලා Point A සෙට් කරන්න. End point එකේදී ] key එක ඔබලා Point B සෙට් කරන්න. එතකොට video එක continuously loop වෙනවා.",
        "source": "MASTER CLOUD Bilingual Support Guide",
        "license": "Proprietary Project Documentation",
    },
]
