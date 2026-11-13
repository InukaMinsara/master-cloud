"""
MASTER CLOUD — MASTER AI CORE v1.0 (Stage 1 Pretraining Prose)
Clean, continuous, human-authored bilingual English, Natural Sinhala, and Mixed prose.

Zero external LLM synthetic generation. Zero unlicensed scraping.
Balanced intentionally at the token level across Sinhala, English, and Mixed text
to teach morphology, syntax, paragraph transitions, punctuation, and reasoning flow.
"""

from typing import Dict, List


STAGE1_PROSE_DOCUMENTS: List[Dict[str, str]] = [
    # =========================================================================
    # A. NATURAL SINHALA PROSE (Formal, Colloquial & Technical Explanations)
    # =========================================================================
    {
        "id": "s1_si_01",
        "language": "sinhala",
        "group": "sinhala_language_foundations",
        "source": "MASTER AI Original Sinhala Editorial",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "ශ්‍රී ලංකාවේ දෛනික ජීවිතයේදී භාෂාව භාවිතා වන ආකාරය ඉතා සුන්දර හා විවිධාකාර වේ. "
            "අපි මිතුරන් සමඟ කතා කරන විට භාවිතා කරන වචන සහ කාර්යාලයක හෝ ලිපියක භාවිතා කරන භාෂා රටාව අතර පැහැදිලි වෙනසක් පවතී. "
            "සාමාන්‍ය කතාබහේදී 'මම ගෙදර යනවා', 'ඔයා මොකද කරන්නේ?', 'අපි හෙට හමුවෙමු' වැනි සරල හා ස්වභාවික වාක්‍ය භාවිතා කරයි. "
            "නමුත් විධිමත් ලේඛනයකදී 'මම නිවසට යමි', 'ඔබ කුමක් කරන්නෙහිද?' හෝ 'අපි හෙට දිනයේදී හමුවෙමු' යනුවෙන් උක්ත ආඛ්‍යාත සම්බන්ධය නිවැරදිව ගළපා ලියනු ලැබේ. "
            "හොඳ පරිගණක සහායකයෙකුට මෙම භාෂා ස්වරූප දෙකම තේරුම් ගැනීමට හැකි විය යුතුය. "
            "පරිශීලකයෙකු සුහදශීලීව ප්‍රශ්නයක් ඇසූ විට අනවශ්‍ය ලෙස දැඩි වචන භාවිතා නොකර සරලව, පැහැදිලිව සහ උපකාරී ලෙස පිළිතුරු දීම ඉතා වැදගත් වේ."
        ),
    },
    {
        "id": "s1_si_02",
        "language": "sinhala",
        "group": "sinhala_computing_intro",
        "source": "MASTER AI Original Sinhala Technology Guide",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "නවීන පරිගණක විද්‍යාව සහ කෘත්‍රිම බුද්ධිය පිළිබඳව සිංහල භාෂාවෙන් ඉගෙන ගැනීම දැන් ඉතා පහසු වී ඇත. "
            "පරිගණකයක් වැඩ කරන්නේ දත්ත සහ උපදෙස් මාලාවක් මත පදනම්වය. අපි යම් වැඩසටහනක් භාවිතා කරන විට එහි ඇති මධ්‍යම සැකසුම් ඒකකය (CPU) සහ ග්‍රැෆික් සැකසුම් ඒකකය (GPU) එක්ව ගණනය කිරීම් සිදු කරයි. "
            "විශේෂයෙන්ම රූප හා වීඩියෝ සැකසීමේදී ග්‍රැෆික් සැකසුම් ඒකකය මගින් මිලියන ගණනක් වූ පික්සල එකවර සකසනු ලැබේ. "
            "උදාහරණයක් ලෙස තත්පරයකට රාමු හැටක් (60 FPS) ධාවනය වන වීඩියෝවකදී, සෑම මිලි තත්පර දහසයකටම වරක් සම්පූර්ණ තිරයේම වර්ණ හා ආලෝක තත්ත්වයන් ගණනය කර තිරය මත ඇඳිය යුතුය. "
            "මේ සඳහා පරිගණකයේ මතකය (RAM) සහ වේගවත් ඇල්ගොරිතම නිවැරදිව කළමනාකරණය කිරීම අත්‍යවශ්‍ය වේ. "
            "මෘදුකාංග ඉංජිනේරුවන් නිරන්තරයෙන් උත්සාහ කරන්නේ පරිශීලකයාගේ උපාංගයට අධික බරක් නොදී උපරිම වේගයෙන් හා පෞද්ගලිකත්වය ආරක්ෂා වන පරිදි මෙම කාර්යයන් ඉටු කිරීමටයි."
        ),
    },
    {
        "id": "s1_si_03",
        "language": "sinhala",
        "group": "sinhala_video_quality_essay",
        "source": "MASTER CLOUD Sinhala Media Documentation",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "අඩු ගුණාත්මකභාවයෙන් යුත් පැරණි වීඩියෝවක් නවීන විශාල තිරයක නැරඹීමේදී බොඳ වී පෙනීම සාමාන්‍ය ගැටලුවකි. "
            "මෙයට හේතුව මුල් වීඩියෝවේ ඇති පික්සල සංඛ්‍යාව තිරයේ ඇති පික්සල සංඛ්‍යාවට වඩා බොහෝ සෙයින් අඩු වීමයි. "
            "සාමාන්‍ය වීඩියෝ ප්ලේයරයක් සිදු කරන්නේ ළඟම ඇති පික්සලවල වර්ණ සාමාන්‍යය ගෙන හිස් තැන් පිරවීම පමණි. එවිට රූපයේ දාර මොට වී අපැහැදිලි ස්වභාවයක් ගනී. "
            "නමුත් නවීන Super-Resolution Upscaling තාක්ෂණය එයට වඩා බෙහෙවින් බුද්ධිමත්ය. "
            "පළමුවෙන්ම එය වීඩියෝවේ ඇති අනවශ්‍ය කොටු කොටු ස්වභාවය සහ ඝෝෂාව ඉවත් කර රූපය සුමට කරයි. "
            "දෙවනුව Contrast Adaptive Sharpening හෙවත් දාරවල තියුණු බව රැකගනිමින් විස්තර මතු කරන පෙරහනක් යොදයි. "
            "එමගින් කෙනෙකුගේ ඇස්, කෙස්, සහ ගොඩනැගිලිවල දාර කෘත්‍රිම බවක් නොමැතිව ස්වභාවිකව පැහැදිලිව දැකගත හැකි වේ. "
            "හොඳම ප්‍රතිඵල ලබා ගැනීම සඳහා තමන් බලන වීඩියෝව අනුව තියුණු බව සහ වර්ණ සමතුලිතව සකස් කර ගැනීම වඩාත් සුදුසුය."
        ),
    },
    {
        "id": "s1_si_04",
        "language": "sinhala",
        "group": "sinhala_audio_acoustics",
        "source": "MASTER CLOUD Audio Engineering Notes",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "සංගීතයට සවන් දීමේදී හෝ චිත්‍රපටයක් නැරඹීමේදී ශබ්දයේ ගුණාත්මකභාවය රූපය තරම්ම වැදගත් වේ. "
            "මිනිස් කනට ඇසෙන සංඛ්‍යාත පරාසය සාමාන්‍යයෙන් හර්ට්ස් විස්සේ (20Hz) සිට කිලෝහර්ට්ස් විස්ස (20kHz) දක්වා විහිදේ. "
            "අඩු සංඛ්‍යාත හෙවත් Bass හඬ අපට ගැඹුරු කම්පනයක් ලබා දෙයි. උදාහරණයක් ලෙස 32Hz සහ 62Hz කලාප බෙර හඬ සහ පහළ සංගීත රිද්මය පාලනය කරයි. "
            "මැද සංඛ්‍යාත කලාප, එනම් 500Hz සිට 4kHz දක්වා පරාසය මිනිස් කටහඬ සහ දෙබස් පැහැදිලිව ඇසීමට ඉතාම තීරණාත්මක වේ. "
            "ඔබට චිත්‍රපටයක දෙබස් හොඳින් නොඇසේ නම්, මුළු ශබ්දයම වැඩි කිරීම වෙනුවට Equalizer හි 1kHz සහ 2kHz මට්ටම් සුළු වශයෙන් ඉහළ දැමීම ඉතා සාර්ථක විසඳුමකි. "
            "එසේම 8kHz සහ 16kHz වැනි ඉහළ සංඛ්‍යාත මගින් සංගීතයේ දීප්තිමත් බව සහ සියුම් නාදයන් ඉස්මතු කරයි. "
            "FLAC සහ WAV වැනි Lossless ගොනු ආකෘති භාවිතා කිරීමේදී මුල් පටිගත කිරීමේ කිසිදු දත්තයක් විනාශ නොවී පිරිසිදු ශබ්දය ලැබෙන අතර, MP3 ගොනු අඩු ඉඩකින් පහසුවෙන් ගබඩා කිරීමට උපකාරී වේ."
        ),
    },
    {
        "id": "s1_si_05",
        "language": "sinhala",
        "group": "sinhala_story_nature",
        "source": "MASTER AI Original Sinhala Narrative",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "උදෑසන හිරු එළිය කඳු මුදුන් අතරින් මතු වන විට ගමේ වටපිටාව ඉතා සුන්දර දසුනක් මවයි. "
            "කුරුල්ලන්ගේ මිහිරි නාදය මැද ගොවීන් තම කුඹුරු වෙත පිය මනින්නේ අලුත් බලාපොරොත්තු රැසක් සිතේ තබාගෙනය. "
            "පිණි බිඳු වැටුණු තණකොළ පත් මත වැටෙන හිරු රැස් මුතු ඇට මෙන් දිදුලයි. "
            "කුඩා දිය පහරක් ගල් පර අතරින් සෙමෙන් ගලා බසිමින් නිහඬ පරිසරයට සිසිල් සංගීතයක් එක් කරයි. "
            "මෙවැනි නිස්කලංක පරිසරයක ගත කරන සෑම මොහොතක්ම මිනිස් සිතට විශාල සැනසීමක් ගෙන දෙයි. "
            "තාක්ෂණය කෙතරම් දියුණු වුවද සොබාදහම සමඟ ඇති මෙම සබැඳියාව අපේ ජීවිතවල සමබරතාවය රැක ගැනීමට නිරන්තරයෙන් උපකාරී වේ."
        ),
    },
    {
        "id": "s1_si_06",
        "language": "sinhala",
        "group": "sinhala_education_study",
        "source": "MASTER AI Original Sinhala Educational Essay",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "නව දෙයක් ඉගෙන ගැනීමේදී ඉවසීම සහ ක්‍රමානුකූල පුහුණුව අතිශයින් වැදගත් වේ. "
            "ඕනෑම විෂයයක් ආරම්භයේදී සංකීර්ණ ලෙස පෙනුණද, එය කුඩා කොටස්වලට බෙදා අධ්‍යයනය කළ විට ඉතා පහසුවෙන් අවබෝධ කර ගත හැකිය. "
            "විශේෂයෙන්ම විදෙස් භාෂාවක් හෝ ක්‍රමලේඛන භාෂාවක් ඉගෙන ගන්නා ශිෂ්‍යයන්ට පැහැදිලි සටහන් තබා ගැනීම සහ වැරදුණු තැන් නැවත පරීක්ෂා කිරීම හොඳ පුරුද්දකි. "
            "වීඩියෝ පාඩමක් නරඹන විට අපහසු කොටසක් නැවත නැවත ඇසීම සඳහා A-B Repeat වැනි පහසුකම් භාවිතා කළ හැකිය. "
            "එමගින් අදාළ කොටස ස්වයංක්‍රීයව නැවත වාදනය වන බැවින් අවධානය බිඳී යාමකින් තොරව කරුණු මතක තබා ගැනීමට ඉඩ සැලසේ. "
            "තවද වැදගත් ස්ථාන Bookmarks ලෙස සලකුණු කර තබා ගැනීමෙන් විභාග සඳහා පුනරීක්ෂණය කරන විට විශාල කාලයක් ඉතිරි කර ගත හැකිය."
        ),
    },
    {
        "id": "s1_si_07",
        "language": "sinhala",
        "group": "sinhala_privacy_principles",
        "source": "MASTER CLOUD Sinhala Security Whitepaper",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "පුද්ගලික දත්ත ආරක්ෂාව යනු නූතන ඩිජිටල් ලෝකයේ සෑම පරිශීලකයෙකුටම හිමි විය යුතු මූලික අයිතිවාසිකමකි. "
            "බොහෝ අන්තර්ජාල සේවාවන් ඔබේ වීඩියෝ, හඬ පට සහ සෙවුම් විස්තර දුරස්ථ සර්වර් වෙත යවා විශ්ලේෂණය කරයි. "
            "නමුත් දේශීයව ක්‍රියාත්මක වන Local AI පද්ධතියක ඇති විශේෂත්වය වන්නේ ඔබේ කිසිදු ගොනුවක් ඔබේ පරිගණකයෙන් පිටතට නොයාමයි. "
            "වීඩියෝ රාමු හඳුනාගැනීම, ශබ්ද තරංග පරීක්ෂා කිරීම සහ ස්නායු ජාල මගින් පිළිතුරු සැකසීම යන සියල්ලම සිදුවන්නේ ඔබේම උපාංගය ඇතුළතය. "
            "එම නිසා අන්තර්ජාල සම්බන්ධතාවය විසන්ධි කළ අවස්ථාවක පවා පද්ධතිය බාධාවකින් තොරව ක්‍රියාත්මක වේ. "
            "යම් හෙයකින් පරිශීලකයෙකු Cloud AI සේවාවක් භාවිතා කිරීමට තීරණය කළහොත් පමණක්, ඔහුගේ පැහැදිලි අනුමැතිය ඇතිව එම සම්බන්ධතාවය ලබා දිය යුතු අතර රහස් යතුරු කිසිවිටෙකත් තැටියේ ස්ථිරව ගබඩා නොකළ යුතුය."
        ),
    },
    {
        "id": "s1_si_08",
        "language": "sinhala",
        "group": "sinhala_reasoning_logic",
        "source": "MASTER AI Original Sinhala Reasoning Text",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "ගැටලුවක් නිවැරදිව විසඳීම සඳහා මුලින්ම අප සතුව ඇති දත්ත මොනවාද සහ අපෙන් අසන ප්‍රශ්නය කුමක්ද යන්න වෙන්කර හඳුනාගත යුතුය. "
            "උදාහරණයක් ලෙස යම් වීඩියෝ ගොනුවක ප්‍රමාණය මෙගාබයිට් 600ක් වන අතර එහි කාලය මිනිත්තු 10ක් යැයි සිතමු. "
            "මෙහි සාමාන්‍ය දත්ත වේගය හෙවත් Bitrate එක සෙවීමට අපි මුලින්ම ගොනු ප්‍රමාණය බිට් වලට හරවා මුළු තත්පර ගණනින් බෙදිය යුතුය. "
            "මිනිත්තු 10ක් යනු තත්පර 600කි. මෙගාබයිට් 600ක් යනු බයිට් මිලියන 600ක් හෙවත් බිට් මිලියන 4800කි. "
            "එය තත්පර 600න් බෙදූ විට තත්පරයට මෙගාබිට් 8ක් හෙවත් 8,000 kbps ලෙස නිවැරදි පිළිතුර ලැබේ. "
            "මෙවැනි නිශ්චිත ගණිතමය ගණනය කිරීම්වලදී අනුමාන කර පිළිතුරු දීම වෙනුවට නිවැරදි ගණනය කිරීමේ මෙවලම් භාවිතා කිරීමෙන් වැරදි සිදුවීම සම්පූර්ණයෙන්ම වළක්වා ගත හැකිය."
        ),
    },

    # =========================================================================
    # B. NATURAL ENGLISH PROSE (Continuous Essays, Tech Guides & Narrative)
    # =========================================================================
    {
        "id": "s1_en_01",
        "language": "english",
        "group": "english_transformer_architecture",
        "source": "MASTER AI Original Engineering Monograph",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "A conversational language model must balance two fundamentally different responsibilities. "
            "First, it must learn the statistical rhythm, vocabulary, grammar, and discourse flow of human writing across varied topics. "
            "This foundational understanding cannot emerge cleanly from a small collection of isolated question-and-answer templates alone; instead, it grows out of stage-one language pretraining over continuous, well-structured prose. "
            "During causal pretraining, the network reads paragraphs sentence by sentence and learns to anticipate natural continuations, transitions between ideas, proper punctuation, and consistent tone. "
            "Architectural choices also play a crucial role as sequences lengthen. "
            "Replacing absolute position tables with Rotary Positional Embeddings allows attention heads to measure relative token distances smoothly across longer dialogues, while RMSNorm and SwiGLU layers stabilize gradient flow without unnecessary computational overhead. "
            "When paired with KV caching during decoding, an autoregressive Transformer avoids recomputing the entire conversation history at each step, keeping response streaming snappy even on modest laptop hardware."
        ),
    },
    {
        "id": "s1_en_02",
        "language": "english",
        "group": "english_video_engineering",
        "source": "MASTER CLOUD Media Systems Handbook",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "Digital video playback inside a modern browser relies on an intricate pipeline spanning container demuxing, hardware video decoding, color space conversion, and compositor presentation. "
            "A container format such as MP4 or WebM does not define how pixels are compressed; rather, it acts as an indexed wrapper holding separate video, audio, and metadata streams. "
            "When an older MKV or AVI file fails to play sound in a browser, the root cause is rarely the visual track itself—often the audio stream uses legacy AC-3 or DTS codecs that browser media engines omit for licensing or architectural reasons. "
            "Meanwhile, displaying a low-resolution video on a high-DPI panel exposes aliasing, mosquito noise, and macroblocking artifacts created by aggressive bitrate compression. "
            "Client-side WebGL shaders solve this directly on the user's GPU without uploading frames anywhere. "
            "First, a bilateral deblocking filter attenuates block boundaries while preserving genuine textures; next, Contrast Adaptive Sharpening reconstructs sub-pixel edges proportional to local contrast, producing crisp 1080p or 4K output without harsh ringing halos."
        ),
    },
    {
        "id": "s1_en_03",
        "language": "english",
        "group": "english_audio_dsp",
        "source": "MASTER CLOUD Audio Studio Documentation",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "Designing a clean desktop audio engine requires respecting human psychoacoustics as much as digital signal math. "
            "Our perception of loudness varies strongly with frequency: low sub-bass around 32 Hz is felt as physical weight, whereas intelligibility in human speech lives between 1 kHz and 4 kHz where consonant transients articulate meaning. "
            "Over-boosting bass without discretion quickly masks mid-range voices and produces listening fatigue. "
            "A ten-band ISO octave equalizer lets listeners shape each zone with surgical precision: gentle dips around 250 Hz clean up boxy room resonance, slight lifts at 2 kHz bring whispered movie dialogue forward, and modest shelves at 8 kHz to 16 kHz restore air to heavily compressed streams. "
            "In dedicated music playback mode, connecting an FFT analyser node in parallel with the gain stage turns audio signals into real-time visual telemetry, driving responsive frequency bars, oscilloscopes, and ambient lighting without introducing audible latency."
        ),
    },
    {
        "id": "s1_en_04",
        "language": "english",
        "group": "english_conversation_principles",
        "source": "MASTER AI Conversational Design Principles",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "Truly helpful dialogue feels natural because the speaker adapts to context rather than reciting static scripts. "
            "When a user mentions a problem in passing and then asks a brief follow-up such as 'What should I try if that fails?', a reliable assistant remembers the earlier topic without asking the person to repeat everything. "
            "Good communication also knows its own boundaries. If a question depends on missing context—for instance, asking for a quote from a video that has no loaded transcript—stating honestly what is missing builds far more trust than inventing a plausible-sounding guess. "
            "Similarly, whenever exact numerical facts are needed, such as computing file bitrate, duration percentages, or PCM sample counts, delegating arithmetic to deterministic functions ensures precision while allowing natural language to explain what those numbers mean in everyday practice."
        ),
    },
    {
        "id": "s1_en_05",
        "language": "english",
        "group": "english_hardware_optimization",
        "source": "MASTER AI Systems Engineering Guide",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "Training language models on consumer hardware teaches disciplined resource engineering. "
            "A laptop configured with 16 GB of system RAM and a 6 GB VRAM discrete GPU cannot casually hold unoptimized multi-billion parameter checkpoints or naive full-sequence optimizer states. "
            "Instead, thoughtful systems engineers benchmark every candidate scale honestly. "
            "Gradient checkpointing trades a small amount of extra forward compute for dramatically lower activation memory; gradient accumulation achieves stable large effective batch sizes out of tiny micro-batches; and Group Query Attention shrinks the KV cache memory footprint during long-context generation. "
            "Equally vital is keeping the model matched to the scale and diversity of clean verified data: a nimble 10M to 20M parameter network trained thoroughly over millions of clean bilingual tokens outperforms an oversized parameter shell starved of quality data."
        ),
    },
    {
        "id": "s1_en_06",
        "language": "english",
        "group": "english_everyday_narrative",
        "source": "MASTER AI Original English Prose",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "Late in the evening, Maya sat down at her desk with a cup of tea to organize an archive of family videos recorded over the past decade. "
            "Some clips had been captured on an old phone in 480p resolution, their colors slightly faded and their audio barely audible over wind noise. "
            "Rather than uploading private memories to external cloud services, she opened her local workspace and inspected each clip offline. "
            "With a few keyboard shortcuts, she trimmed quiet sections, flagged favorite moments as bookmarks, bumped mid-range speech frequencies so her grandfather's voice rang clearly, and switched on real-time sharpening to watch the footage comfortably on her wide monitor. "
            "By midnight, every precious scene had a clean chapter marker and an exported note ready to share with her family the next morning."
        ),
    },

    # =========================================================================
    # C. MIXED SINHALA-ENGLISH PROSE (Natural Code-Switching Discourse)
    # =========================================================================
    {
        "id": "s1_mx_01",
        "language": "mixed",
        "group": "mixed_tech_walkthrough",
        "source": "MASTER AI Original Bilingual Guide",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "ලංකාවේ අපි ගොඩක් වෙලාවට technology ගැන කතා කරද්දි සිංහල සහ English වචන මිශ්‍ර කරලා natural විදියට කතා කරනවා. "
            "උදාහරණයක් විදියට, 'මචං මේ video එක 720p නිසා 4K monitor එකේ බලද්දි පොඩ්ඩක් blur වගේ, Quality Boost එක on කරමු' කියලා කියන එක ඉතාම සාමාන්‍යයි. "
            "එහෙම කතා කරනකොට AI assistant කෙනෙක් 'video', 'bitrate', 'equalizer', 'upscaling', 'keyboard shortcut' වැනි English technical words එහෙම්මම තේරුම් අරගෙන, "
            "ප්‍රධාන පැහැදිලි කිරීම හොඳ සිංහල ව්‍යාකරණ එක්ක දෙන්න පුළුවන් වෙන්න ඕන. "
            "නිකන් English වාක්‍යයක් මැද්දට සිංහල වචන දෙක තුනක් ඔබන එක නෙවෙයි හරි bilingual intelligence එක කියන්නේ. "
            "අහන ප්‍රශ්නයේ context එක හරියටම තේරුම් අරගෙන, අවශ්‍ය නම් තව විස්තර අහලා, user ගේ style එකට ගැළපෙන්න reply කරන එක තමයි සැබෑ conversational skill එක."
        ),
    },
    {
        "id": "s1_mx_02",
        "language": "mixed",
        "group": "mixed_player_workflow",
        "source": "MASTER CLOUD Bilingual Manual",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "MASTER CLOUD Media Player එක ඇතුළේ video විතරක් නෙවෙයි, MP3, FLAC, WAV වගේ ඕනෑම audio track එකක් play කරන්න පුළුවන්. "
            "Audio file එකක් drop කළ ගමන් player එක auto switch වෙනවා Music Mode එකට, එතනදි spinning vinyl disc එකක් එක්ක 60fps real-time spectrum visualizer එකක් වැඩ කරනවා. "
            "ඊට පස්සේ ඔයාට E key එක press කරලා 10-band Audio Studio එක ඇරගෙන Bass Boost හෝ Vocal Clarity preset එකක් select කරන්න පුළුවන්. "
            "Movie එකක් බලන වෙලාවක subtitles audio එකත් එක්ක sync නැත්නම්, C key එකෙන් Subtitle Studio එක open කරලා milliseconds ගාණකින් offset එක adjust කරන්න පුළුවන්. "
            "තව V key එකෙන් 4K Super-Resolution upscaling active කරලා split-screen slider එක එහා මෙහා කරලා before/after quality difference එක ඇස් දෙකෙන්ම check කරගන්න පුළුවන්."
        ),
    },
    {
        "id": "s1_mx_03",
        "language": "mixed",
        "group": "mixed_ai_architecture_note",
        "source": "MASTER AI Bilingual Engineering Notes",
        "license": "Original Project Authored (MIT/Proprietary)",
        "text": (
            "අලුත් MASTER AI CORE v1.0 architecture එක හදලා තියෙන්නේ පරණ GPT-2 style LayerNorm සහ static positional embeddings වෙනුවට නවීන RMSNorm, RoPE (Rotary Positional Embeddings), සහ SwiGLU activation layers පාවිච්චි කරලා. "
            "ඇයි අපි RoPE සහ KV Cache පාවිච්චි කරන්නේ? "
            "මොකද multi-turn conversation එකක් දිගට යද්දි පරණ context window එක tokens 256කට විතරක් සීමා වුණොත් conversation history එක ඉක්මනින් අමතක වෙනවා. "
            "RoPE මගින් tokens 512, 1024, 2048 වගේ දිග sequences වල relative positions හරියටම maintain කරනවා. "
            "ඊට අමතරව Byte-Level BPE tokenizer එක tokens 1024 සිට 4096/8192 දක්වා වැඩි කළාම සිංහල අකුරු bytes වලට කැඩෙන්නේ නැතුව සම්පූර්ණ වචන කොටස් විදියට ඉගෙන ගන්න නිසා model එකේ context capacity එක දෙගුණ තෙගුණ වෙනවා."
        ),
    },
]
