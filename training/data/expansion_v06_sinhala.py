"""
MASTER CLOUD — MASTER AI ORIGINAL TRAINING CORPUS (v0.6)
Expansion Set: Natural Sinhala Q&A and Multi-Step Instructions.

Curated human-authored question-answer pairs focusing on:
- Authentic Subject-Object-Verb (SOV) Sinhala sentence syntax.
- Accurate technical verb endings (ඔබන්න, සකසන්න, ක්‍රියාත්මක වේ, කළ හැක).
- Strict Unicode NFC normalization for all Sinhala combining marks.
- Complete, grammatically fluent sentences ending with terminal punctuation.
"""

from typing import List, Dict

V06_SINHALA_ENTRIES: List[Dict[str, str]] = [
    # 1. Hotkeys & Basic Video Controls (Sinhala)
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝව නවත්වන්නේ හෝ වාදනය කරන්නේ කෙසේද?",
        "response": "වීඩියෝව නවත්වන්න හෝ නැවත ධාවනය කරන්න ඔබේ යතුරුපුවරුවේ Space bar එක හෝ K යතුර ඔබන්න. තවද වීඩියෝ තිරය මත කෙලින්ම ක්ලික් කිරීමෙන්ද ධාවනය පාලනය කළ හැකිය.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "පූර්ණ තිර ප්‍රකාරයට (Fullscreen) පිවිසෙන්නේ හෝ එයින් ඉවත් වන්නේ කෙසේද?",
        "response": "පූර්ණ තිර ප්‍රකාරයට පිවිසීමට හෝ එයින් ඉවත් වීමට යතුරුපුවරුවේ F යතුර ඔබන්න. එමෙන්ම Escape යතුර එබීමෙන්ද ඕනෑම වේලාවක සාමාන්‍ය තිරයට පැමිණිය හැක.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝව තත්පර 10 ක් ඉදිරියට ගෙනියන්නේ කෙසේද?",
        "response": "වීඩියෝව තත්පර 10 ක් ඉදිරියට ගෙන යාමට Right Arrow යතුර හෝ L යතුර ඔබන්න.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝව තත්පර 10 ක් ආපස්සට ගෙනියන්නේ කෙසේද?",
        "response": "වීඩියෝව තත්පර 10 ක් ආපස්සට ගෙන යාමට Left Arrow යතුර හෝ J යතුර ඔබන්න.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝවේ ඊළඟ රාමුව (next frame) වෙත මාරු වන්නේ කෙසේද?",
        "response": "වීඩියෝව නවත්වා period හෙවත් තිත (.) යතුර එබීමෙන් එක වීඩියෝ රාමුවක් බැගින් ඉදිරියට ගෙන යා හැකිය.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝව එක රාමුව බැගින් ආපස්සට ගෙනියන්නේ කෙසේද?",
        "response": "වීඩියෝව නවත්වා comma හෙවත් කොමාව (,) යතුර එබීමෙන් එක වීඩියෝ රාමුවක් බැගින් ආපස්සට ගෙන යා හැකිය.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "ශබ්දය ක්ෂණිකව නිහඬ (Mute) කරන්නේ කෙසේද?",
        "response": "ශබ්දය ක්ෂණිකව නිහඬ කිරීමට හෝ නැවත සක්‍රිය කිරීමට ඔබේ යතුරුපුවරුවේ M යතුර ඔබන්න.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "ශබ්දය වැඩි කරන්නේ සහ අඩු කරන්නේ කෙසේද?",
        "response": "ශබ්දය 5% කින් වැඩි කිරීමට Up Arrow යතුරත්, 5% කින් අඩු කිරීමට Down Arrow යතුරත් භාවිතා කරන්න.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "video_controls_si",
        "group": "v06_si_controls",
        "language": "sinhala",
        "prompt": "වීඩියෝවේ පැහැදිලි ඡායාරූපයක් (Screenshot) ලබා ගන්නේ කෙසේද?",
        "response": "වත්මන් වීඩියෝ රාමුවේ පැහැදිලි PNG ඡායාරූපයක් ලබා ගැනීමට S යතුර ඔබන්න. එම ඡායාරූපය ස්වයංක්‍රීයව ඔබගේ පරිගණකයට බාගත වේ.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },

    # 2. Audio Studio & 10-Band Equalizer (Sinhala)
    {
        "category": "audio_si",
        "group": "v06_si_audio",
        "language": "sinhala",
        "prompt": "10-Band Equalizer ශබ්ද සැකසුම් පුවරුව ලබා ගන්නේ කෙසේද?",
        "response": "ශබ්ද සැකසුම් සහ 10-Band Equalizer එක විවෘත කිරීමට යතුරුපුවරුවේ E යතුර ඔබන්න. එහිදී ඔබට සංඛ්‍යාත මට්ටම් සකස් කළ හැක.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_si",
        "group": "v06_si_audio",
        "language": "sinhala",
        "prompt": "10-Band Equalizer එකේ ඇති සංඛ්‍යාත මොනවාද?",
        "response": "10-Band Equalizer එකෙහි 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, සහ 16kHz යන සම්මත සංඛ්‍යාත දහය අඩංගු වේ.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_si",
        "group": "v06_si_audio",
        "language": "sinhala",
        "prompt": "Equalizer එකෙහි Bass Boost පෙරසිටුවම (Preset) භාවිත කරන්නේ ඇයි?",
        "response": "Bass Boost පෙරසිටුවම මගින් 32Hz සහ 64Hz අඩු සංඛ්‍යාත වැඩි කර චිත්‍රපට සහ සංගීත ඛණ්ඩ සඳහා ගැඹුරු නාදයක් ලබා දෙයි.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_si",
        "group": "v06_si_audio",
        "language": "sinhala",
        "prompt": "Vocal Clarity පෙරසිටුවමෙන් සිදු වන්නේ කුමක්ද?",
        "response": "Vocal Clarity පෙරසිටුවම මගින් 1kHz සිට 4kHz දක්වා කථන සංඛ්‍යාත වැඩි කර දෙබස් ඉතා පැහැදිලිව ඇසීමට සලස්වයි.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "audio_si",
        "group": "v06_si_audio",
        "language": "sinhala",
        "prompt": "ශබ්ද ප්‍රමාදය (Audio Sync Delay) නිවැරදි කරන්නේ කෙසේද?",
        "response": "E යතුර ඔබා Audio Studio වෙත ගොස් Audio Delay ස්ලයිඩරය තත්පර 0.0 සිට 1.0 දක්වා අවශ්‍ය ප්‍රමාණයට සකස් කර දෙබස් සහ වීඩියෝව සමමුහුර්ත කරන්න.",
        "source": "MASTER CLOUD Sinhala User Guide",
        "license": "Proprietary Project Documentation",
    },

    # 3. Security, Privacy & Local Intelligence (Sinhala)
    {
        "category": "privacy_si",
        "group": "v06_si_privacy",
        "language": "sinhala",
        "prompt": "MasterAI Core මගින් මගේ වීඩියෝ අන්තර්ජාලයට යවනවාද?",
        "response": "නැත. MasterAI Core ඔබේ පරිගණකයේ බ්‍රවුසරය තුළ 100% ක් දේශීයව ක්‍රියාත්මක වේ. ඔබේ වීඩියෝ, හඬ පට, හෝ දත්ත කිසිවක් බාහිර සර්වර් වෙත යවනු නොලැබේ.",
        "source": "MASTER CLOUD Privacy Architecture (Sinhala)",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "privacy_si",
        "group": "v06_si_privacy",
        "language": "sinhala",
        "prompt": "අන්තර්ජාලය නොමැතිව MasterAI භාවිතා කළ හැකිද?",
        "response": "ඔව්. MasterAI Core ආකෘතිය මතකයට එක් වූ පසු අන්තර්ජාල සම්බන්ධතාවයකින් තොරව සම්පූර්ණයෙන්ම නොබැඳිව (offline) ක්‍රියාත්මක වේ.",
        "source": "MASTER CLOUD Privacy Architecture (Sinhala)",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "privacy_si",
        "group": "v06_si_privacy",
        "language": "sinhala",
        "prompt": "MasterAI යනු කුමක්ද?",
        "response": "MasterAI Core යනු MASTER CLOUD සඳහාම මුල සිටම ස්වාධීනව නිර්මාණය කර පුහුණු කළ කෘතිම බුද්ධි ආකෘතියකි. එය බාහිර සූදානම් කළ ආකෘති මත පදනම් නොවේ.",
        "source": "MASTER CLOUD Architecture Manual (Sinhala)",
        "license": "Proprietary Project Documentation",
    },

    # 4. Multi-Step Sinhala Instructions
    {
        "category": "instructions_si",
        "group": "v06_si_instructions",
        "language": "sinhala",
        "prompt": "A-B Repeat භාවිතයෙන් වීඩියෝ කොටසක් නැවත නැවත වාදනය කරන්නේ කෙසේද?",
        "response": "පහත පියවර අනුගමනය කරන්න: 1. නැවත වාදනය ඇරඹිය යුතු ස්ථානයේදී වම් වරහන [ යතුර ඔබා Point A සලකුණු කරන්න. 2. අවසන් විය යුතු ස්ථානයේදී දකුණු වරහන ] යතුර ඔබා Point B සලකුණු කරන්න. 3. එවිට එම කොටස දිගටම නැවත නැවත වාදනය වේ.",
        "source": "MASTER CLOUD Sinhala Workflows",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "instructions_si",
        "group": "v06_si_instructions",
        "language": "sinhala",
        "prompt": "උපසිරැසි (Subtitles) ගොනුවක් ඇතුළත් කරන්නේ කෙසේද?",
        "response": "1. ඔබේ .srt හෝ .vtt උපසිරැසි ගොනුව කෙලින්ම වීඩියෝ තිරය මතට ඇද දමන්න (drag and drop). 2. උපසිරැසි කාලය නොගැලපේ නම් Subtitle settings වෙත යන්න. 3. Subtitle Offset ස්ලයිඩරය මගින් අවශ්‍ය පරිදි කාලය සකස් කරන්න.",
        "source": "MASTER CLOUD Sinhala Workflows",
        "license": "Proprietary Project Documentation",
    },
]
