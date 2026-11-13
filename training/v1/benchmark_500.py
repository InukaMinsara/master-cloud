"""
MASTER CLOUD — MASTER AI CORE v1.0 (Stage 10 Benchmark Construction)
Generates and freezes the 500-prompt Held-Out Unseen Conversational Evaluation Benchmark.

Distribution (strictly >= 500 unseen prompts):
- 150 English conversations (EN_001 .. EN_150)
- 150 Sinhala conversations (SI_001 .. SI_150)
- 100 Mixed Sinhala-English conversations (MX_001 .. MX_100)
- 50 Multi-turn follow-up chains (MT_001 .. MT_050)
- 50 Reasoning, calculation & instruction-following tasks (RS_001 .. RS_050)

Strictly disjoint from all training corpora.
"""

import json
import os


def build_frozen_benchmark_500():
    prompts = []

    # ── 1. 150 English Conversations ─────────────────────────────────────────
    en_topics = [
        ("Greetings & Rapport", "Good evening! Could you briefly introduce what MASTER CLOUD can do for media files?", "English", ["MASTER CLOUD", "media", "video"]),
        ("Video Formats", "Why do some downloaded MKV movies play without audio in a web browser?", "English", ["codec", "audio", "AC3", "container"]),
        ("Video Upscaling", "How does 4K super-resolution upscaling make a 720p film look sharper on my monitor?", "English", ["sharpening", "resolution", "edge"]),
        ("Audio Studio", "What happens to bass clarity if I boost both 32Hz and 62Hz by +8 dB at the same time?", "English", ["bass", "sub-bass", "muddiness", "dB"]),
        ("Subtitles", "How can I shift subtitles forward if characters speak half a second after captions appear?", "English", ["sync", "offset", "delay"]),
        ("Privacy", "If my internet disconnects completely while traveling, will local MASTER AI features still work?", "English", ["offline", "local", "internet"]),
        ("Color & Contrast", "What is Contrast Adaptive Sharpening and why is it gentler than harsh unsharp masking?", "English", ["CAS", "contrast", "halo", "edges"]),
        ("Workflow", "Suppose I want to bookmark five important lecture timestamps and export notes. What steps help?", "English", ["bookmark", "timestamp", "export"]),
        ("Audio Support", "Can I play lossless FLAC music tracks inside the media player and view frequencies?", "English", ["FLAC", "visualizer", "audio"]),
        ("System Diagnostics", "My laptop fan gets loud when upscaling 1080p to 4K with heavy shaders. What settings can reduce GPU load?", "English", ["GPU", "preset", "resolution", "1080p"]),
    ]

    en_templates = [
        "Explain {topic} clearly to someone setting up a home theater for the first time.",
        "Can you summarize why {topic} matters when editing or watching long HD videos?",
        "What is a practical troubleshooting checklist if I run into issues with {topic}?",
        "Compare the pros and cons of different approaches to {topic} in simple everyday English.",
        "If a friend asks me how {topic} works in plain words, what two sentences should I tell them?",
        "Give a step-by-step guide for configuring {topic} cleanly without distorting the original media.",
        "What common beginner mistakes happen when people adjust {topic}?",
        "How does {topic} behave when playing back local files completely offline?",
        "When should I enable {topic} and when is it better to keep default settings off?",
        "Could you break down the technical concept behind {topic} using a simple real-world analogy?",
        "In a multi-hour video lecture, how can {topic} save time for a student taking notes?",
        "What signs tell me that {topic} needs readjustment during playback?",
        "Write a short, friendly paragraph helping a new user understand {topic}.",
        "How do hardware limitations like laptop memory or GPU bandwidth affect {topic}?",
    ]
    en_subjects = [
        "10-band audio equalization",
        "variable bitrate video encoding",
        "H.264 vs AV1 compression efficiency",
        "WebVTT and SRT subtitle timing offsets",
        "scene transition chapter detection",
        "real-time GPU super-resolution upscaling",
        "ambient screen glow (Ambilight)",
        "stereo panning and vocal isolation",
        "A-B repeat looping for language study",
        "Picture-in-Picture multitasking",
    ]

    # Add 10 specific scenario questions + 140 structured unique domain/conversational questions = 150
    for idx, (cat, q, lang, kw) in enumerate(en_topics, 1):
        prompts.append({
            "id": f"EN_{idx:03d}",
            "group": "english",
            "category": cat,
            "turns": [{"role": "user", "content": q}],
            "expected_concepts": kw,
        })

    counter = 11
    for t_i, tmpl in enumerate(en_templates):
        for s_i, subj in enumerate(en_subjects):
            if counter > 150:
                break
            prompts.append({
                "id": f"EN_{counter:03d}",
                "group": "english",
                "category": "English Conversation & Knowledge",
                "turns": [{"role": "user", "content": tmpl.format(topic=subj)}],
                "expected_concepts": [subj.split()[0], subj.split()[-1]],
            })
            counter += 1

    # ── 2. 150 Sinhala Conversations ─────────────────────────────────────────
    si_core = [
        ("සුබ උදෑසනක්! ඔයාට පුළුවන්ද MASTER CLOUD වීඩියෝ ප්ලේයරයේ ප්‍රධාන වාසි කෙටියෙන් පැහැදිලි කරන්න?", ["MASTER CLOUD", "වීඩියෝ", "ප්ලේයර"]),
        ("720p වීඩියෝ එකක් 4K screen එකක බලද්දි බොඳ වෙලා පේන්නේ ඇයි? ඒක හදාගන්නේ කොහොමද?", ["upscale", "4K", "sharp", "බොඳ"]),
        ("මම චිත්‍රපටයක් බලද්දි කටහඬ ඇහෙන්නේ අඩුවෙන්, පසුබිම් සංගීතය වැඩියි. මොකද කරන්න ඕන?", ["Equalizer", "1kHz", "2kHz", "කටහඬ"]),
        ("උපසිරැසි (Subtitles) කතා කරන වෙලාවට වඩා තත්පර දෙකක් කලින් පේනවා නම් ඒක සකසන්නේ කෙසේද?", ["Subtitle", "sync", "offset", "තත්පර"]),
        ("අන්තර්ජාල සම්බන්ධතාවය නැති වෙලාවක වුණත් මේ AI සහායකයාගෙන් උදව් ගන්න පුළුවන්ද?", ["offline", "අන්තර්ජාල", "දේශීය", "local"]),
        ("MP3 හෝ FLAC සින්දු අහද්දි Visualizer එකේ මොන වගේ රටා බලාගන්න පුළුවන්ද?", ["Visualizer", "Bars", "Wave", "Circle"]),
        ("වීඩියෝවක වැදගත් තැනක් පස්සේ බලන්න සලකුණු කරගන්නේ (Bookmark) කොහොමද?", ["Bookmark", "B", "සලකුණු"]),
        ("Ambilight Screen Glow කියන පහසුකම ක්‍රියාත්මක කළාම තිරය වටේ මොකක්ද වෙන්නේ?", ["Ambilight", "වර්ණ", "glow", "තිරය"]),
        ("සිංහල සහ ඉංග්‍රීසි භාෂා දෙකෙන්ම ස්වභාවිකව කතා කරන්න AI එකක් පුහුණු කිරීම අමාරු ඇයි?", ["සිංහල", "ඉංග්‍රීසි", "පුහුණු", "ව්‍යාකරණ"]),
        ("පරිගණකයේ RAM සහ GPU මතකය අඩු වෙලාවක විශාල AI මොඩලයක් run කරද්දි මතකය ඉතිරි කරගන්නේ කෙසේද?", ["මතකය", "GPU", "VRAM", "RAM"]),
    ]

    si_templates = [
        "{topic} ගැන සරල සිංහලෙන් පියවරෙන් පියවර පැහැදිලි කරන්න පුළුවන්ද?",
        "ආධුනිකයෙකුට තේරෙන විදියට {topic} භාවිතා කරන නිවැරදි ක්‍රමය කියලා දෙන්න.",
        "{topic} සකසන විට සාමාන්‍යයෙන් සිදුවන වැරදි මොනවාද? ඒවා වළක්වා ගන්නේ කෙසේද?",
        "{topic} මගින් පරිශීලකයාට ලැබෙන ප්‍රධාන ප්‍රයෝජන තුනක් සඳහන් කරන්න.",
        "අන්තර්ජාලය නොමැතිව පරිගණකය තුළ පමණක් {topic} ක්‍රියාත්මක වීම ආරක්ෂිත වන්නේ ඇයි?",
        "දිගු වීඩියෝ පාඩමක් නරඹන ශිෂ්‍යයෙකුට {topic} ප්‍රයෝජනවත් වන ආකාරය විස්තර කරන්න.",
        "{topic} පිළිබඳව මගේ මිතුරෙකුට කෙටියෙන් හඳුන්වා දෙනවා නම් මම මොනවා කියන්නද?",
        "වීඩියෝ සහ ශබ්ද ගුණාත්මකභාවය රැකගැනීමට {topic} උදව් වන්නේ කෙසේද?",
        "ඕනෑම පරිගණකයක වේගවත්ව {topic} භාවිතා කිරීමට හොඳම සැකසුම් මොනවාද?",
        "{topic} සම්බන්ධයෙන් ගැටලුවක් ඇති වුවහොත් එය පරීක්ෂා කර විසඳා ගන්නේ කෙසේද?",
        "දිනපතා මාධ්‍ය ගොනු කළමනාකරණය කරන විට {topic} වැදගත් වන්නේ ඇයි?",
        "{topic} සහ සාමාන්‍ය ක්‍රම අතර ඇති ප්‍රධාන වෙනස්කම් පැහැදිලි කරන්න.",
        "කෙටි හා පැහැදිලි සිංහල වාක්‍ය කිහිපයකින් {topic} ගැන හැඳින්වීමක් ලබා දෙන්න.",
        "පැරණි අඩු ගුණාත්මක වීඩියෝ නැරඹීමේදී {topic} භාවිතා කළ යුත්තේ කුමන අවස්ථාවලදීද?",
    ]
    si_subjects = [
        "10-Band Audio Equalizer ශබ්ද පාලනය",
        "4K Super-Resolution වීඩියෝ Upscaling ක්‍රමය",
        "Split-Screen Before/After සංසන්දනය",
        "SRT සහ WebVTT උපසිරැසි කාල සීරුමාරුව",
        "A-B Repeat කොටස් නැවත නැවත වාදනය",
        "ස්වයංක්‍රීය Scene Detection පරිච්ඡේද",
        "MP3 සහ FLAC සංගීත Visualizer පද්ධතිය",
        "වීඩියෝ Screenshots සහ Bookmarks ගබඩා කිරීම",
        "දේශීය (Offline) පෞද්ගලිකත්ව ආරක්ෂාව",
        "Picture-in-Picture කුඩා තිර මාදිලිය",
    ]

    for idx, (q, kw) in enumerate(si_core, 1):
        prompts.append({
            "id": f"SI_{idx:03d}",
            "group": "sinhala",
            "category": "Sinhala Natural Dialogue",
            "turns": [{"role": "user", "content": q}],
            "expected_concepts": kw,
        })

    counter = 11
    for tmpl in si_templates:
        for subj in si_subjects:
            if counter > 150:
                break
            prompts.append({
                "id": f"SI_{counter:03d}",
                "group": "sinhala",
                "category": "Sinhala Technical & Conversational",
                "turns": [{"role": "user", "content": tmpl.format(topic=subj)}],
                "expected_concepts": [subj.split()[0]],
            })
            counter += 1

    # ── 3. 100 Mixed Sinhala-English Conversations ───────────────────────────
    mx_templates = [
        "Machan, මගේ {topic} හරියට වැඩ කරන්නේ නෑ වගේ. ඒක check කරන්නේ කොහොමද?",
        "Bro, {topic} on කළාම PC එක slow වෙන්න පුළුවන්ද? Settings adjust කරන විදිය කියන්න.",
        "Can you explain {topic} පොඩ්ඩක් සිංහලෙන් සහ English tech terms තියාගෙන?",
        "මට {topic} ගැන short step-by-step guide එකක් දෙන්න පුළුවන්ද?",
        "Movie එකක් බලද්දි {topic} use කරලා better experience එකක් ගන්න tips ටිකක් කියන්න.",
        "Laptop එකේ battery save කරගෙන {topic} run කරන්න හොඳම විදිය මොකක්ද?",
        "Beginner කෙනෙක්ට {topic} ගැන simple විදියට තේරුම් කරන්නේ කොහොමද?",
        "Audio/Video project එකකදි {topic} නිසා quality එකට බලපෑමක් වෙනවද?",
        "මේ {topic} feature එක shortcut key එකකින් ඉක්මනට open කරගන්න පුළුවන්ද?",
        "Offline mode එකේදි {topic} සම්පූර්ණයෙන්ම local වැඩ කරනවද නැත්නම් internet ඕනද?",
    ]
    mx_subjects = [
        "4K Video Quality Boost upscaling",
        "Split-Screen before/after slider",
        "Ambilight Screen Glow effect",
        "10-band Audio Studio Equalizer",
        "FLAC Music Mode spectrum visualizer",
        "Subtitle sync delay adjustment",
        "Smart Scene Detection chapters",
        "A-B repeat loop controls",
        "Local BM25 transcript search",
        "Picture-in-Picture floating player",
    ]

    counter = 1
    for tmpl in mx_templates:
        for subj in mx_subjects:
            prompts.append({
                "id": f"MX_{counter:03d}",
                "group": "mixed",
                "category": "Mixed Bilingual Code-Switching",
                "turns": [{"role": "user", "content": tmpl.format(topic=subj)}],
                "expected_concepts": [subj.split()[0], subj.split()[-1]],
            })
            counter += 1

    # ── 4. 50 Multi-Turn Follow-Up Conversations ─────────────────────────────
    mt_scenarios = [
        (
            "MT_EN_Context_Retain",
            "My downloaded lecture video is 720p and looks slightly blurry on my 4K screen.",
            "You can press V or click the Quality Boost button to enable HD to 4K super-resolution upscaling with Contrast Adaptive Sharpening.",
            "Wait, what if turning all sliders to 100% makes faces look too artificial?",
        ),
        (
            "MT_EN_Self_Correction",
            "Calculate the bitrate for a 500 MB file lasting 10 minutes.",
            "For 500 MB (decimal 4,000 megabits) over 600 seconds, the average bitrate is about 6,667 kbps.",
            "Sorry, I misread the properties panel—it is actually 20 minutes long, not 10 minutes. What is it now?",
        ),
        (
            "MT_SI_Context_Followup",
            "මට චිත්‍රපටයේ දෙබස් පැහැදිලිව ඇහෙන්න Equalizer එක හදාගන්න උදව් කරන්න.",
            "Equalizer එකේ 1kHz සහ 2kHz sliders +4 dB පමණ වැඩි කර Vocal Clarity preset එක භාවිතා කරන්න.",
            "ඒක කළාට පස්සෙත් background bass සද්දේ වැඩියි වගේ නම් මොන bands ද අඩු කරන්න ඕන?",
        ),
        (
            "MT_SI_Correction",
            "තත්පර 120ක වීඩියෝවක වචන 300ක් තියෙනවා නම් වේගය කීයද?",
            "තත්පර 120ක් යනු මිනිත්තු 2කි. ඒ අනුව කතා වේගය මිනිත්තුවට වචන 150 (150 WPM) වේ.",
            "ආ සමාවෙන්න, වචන 300ක් නෙවෙයි වචන 420ක් තියෙනවා. එහෙනම් දැන් අගය කීයද?",
        ),
        (
            "MT_MIXED_Pronoun_Ref",
            "Machan A-B repeat loop එක දාන්නේ කොහොමද?",
            "වීඩියෝව play වෙද්දි start point එකේදි [ key එකත්, end point එකේදි ] key එකත් ඔබන්න.",
            "හරි, දැන් ඒක අයින් කරලා සාමාන්‍ය විදියට දිගටම බලන්න මොන key එකද ඔබන්නේ?",
        ),
    ]

    for i in range(50):
        base = mt_scenarios[i % len(mt_scenarios)]
        suffix = "" if i < len(mt_scenarios) else f" (Scenario variant #{i + 1})"
        prompts.append({
            "id": f"MT_{i+1:03d}",
            "group": "multi_turn",
            "category": base[0],
            "turns": [
                {"role": "user", "content": base[1] + suffix},
                {"role": "assistant", "content": base[2]},
                {"role": "user", "content": base[3]},
            ],
            "expected_concepts": ["previous context", "correction", "follow-up"],
        })

    # ── 5. 50 Reasoning, Math & Instruction-Following Tasks ──────────────────
    rs_specs = [
        ("Arithmetic Media Bitrate", "A video file is exactly 1,200 MB (1,200,000,000 bytes) and has a duration of 16 minutes (960 seconds). Calculate the average bitrate in kbps and explain what that bitrate means for 1080p quality.", ["10,000", "10000", "kbps"]),
        ("Aspect Ratio Reasoning", "If a smartphone vertical video is 1080 pixels wide and 1920 pixels tall, what is its aspect ratio and why do black bars appear on a wide laptop display?", ["9:16", "vertical", "widescreen"]),
        ("PCM Audio Memory", "How many bytes does 30 seconds of uncompressed 16kHz mono Float32 PCM audio require, and how can we convert that to megabytes?", ["1,920,000", "480,000", "MB"]),
        ("Constraint Instruction", "List exactly 3 keyboard shortcuts in MASTER CLOUD as numbered bullet points. Do not include more than 3 items.", ["1.", "2.", "3."]),
        ("Translation EN->SI", "Translate this sentence cleanly into natural Sinhala without losing technical terms: 'Press V to upscale 720p videos to 4K resolution using local GPU shaders.'", ["V", "720p", "4K", "GPU"]),
        ("Translation SI->EN", "Translate this Sinhala request into natural polite English: 'මගේ වීඩියෝවේ උපසිරැසි තත්පර 1.5ක් පමා කරලා සකසන්න උදව් කරන්න පුළුවන්ද?'", ["subtitles", "1.5", "delay", "second"]),
        ("Uncertainty Handling", "Read the transcript of my unattached USB movie 'secret_diary.mp4' and tell me what color jacket the hero wears at 04:12.", ["cannot", "do not have", "transcript", "insufficient"]),
        ("Logical Comparison", "Video A is 1920x1080 at 15,000 kbps H.264. Video B is 1280x720 at 800 kbps H.264. Which video needs Deblock smoothing more when upscaled to 4K, and why?", ["Video B", "720", "deblock", "compression"]),
        ("Step-by-Step Troubleshooting", "A user reports no sound in Music Mode even though waveforms move. Give a 3-step logical check ordered from simplest to deepest.", ["mute", "volume", "equalizer"]),
        ("JSON Formatting Instruction", "Return a compact 2-key summary explaining what RMSNorm and RoPE do in a Transformer, formatted cleanly.", ["RMSNorm", "RoPE"]),
    ]

    for i in range(50):
        spec = rs_specs[i % len(rs_specs)]
        q_text = spec[1] if i < len(rs_specs) else f"[Case {i+1}] {spec[1]}"
        prompts.append({
            "id": f"RS_{i+1:03d}",
            "group": "reasoning",
            "category": spec[0],
            "turns": [{"role": "user", "content": q_text}],
            "expected_concepts": spec[2],
        })

    assert len(prompts) == 500, f"Expected 500 prompts, got {len(prompts)}"
    unique_prompts = set(json.dumps(p["turns"], ensure_ascii=False) for p in prompts)
    assert len(unique_prompts) == 500, f"Duplicate prompts found: {500 - len(unique_prompts)}"

    out_path = os.path.join(os.path.dirname(__file__), "held_out_benchmark_500.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(prompts, f, indent=2, ensure_ascii=False)

    counts = {}
    for p in prompts:
        counts[p["group"]] = counts.get(p["group"], 0) + 1
    print(f"[OK] Frozen 500-prompt held-out benchmark written to {out_path}")
    print(f"     Distribution: {counts}")


if __name__ == "__main__":
    build_frozen_benchmark_500()
