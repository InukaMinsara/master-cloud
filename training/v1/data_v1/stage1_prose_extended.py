"""
MASTER CLOUD — MASTER AI CORE v1.0 (Stage 1 Extended Original Prose Corpus)
Clean continuous human-authored prose covering everyday conversation structure,
general Sinhala & English grammar, science, programming, digital media,
mathematics explanations, and bilingual troubleshooting narratives.
"""

from typing import Dict, List


STAGE1_EXTENDED_PROSE: List[Dict[str, str]] = [
    # -------------------------------------------------------------------------
    # SINHALA EXTENDED PROSE (General Language, Tech, Stories, Grammar)
    # -------------------------------------------------------------------------
    {
        "id": "s1e_si_01",
        "language": "sinhala",
        "group": "si_grammar_usage",
        "source": "MASTER AI Original Sinhala Grammar Guide",
        "license": "Original Project Authored",
        "text": (
            "සිංහල භාෂාවේ වාක්‍ය රටාව බොහෝ විට 'කර්තෘ - කර්මය - ක්‍රියාව' (SOV) යන පිළිවෙළ අනුගමනය කරයි. "
            "උදාහරණයක් ලෙස 'නිමල් පොතක් කියවයි' යන වාක්‍යයේදී 'නිමල්' යනු කර්තෘ වන අතර 'පොතක්' යනු කර්මය වේ. 'කියවයි' යනු ක්‍රියා පදයයි. "
            "එමෙන්ම කතා කරන සිංහලයේදී මෙය 'නිමල් පොතක් කියවනවා' ලෙස වෙනස් වේ. "
            "වර්තමාන කාලය, අතීත කාලය සහ අනාගත කාලය අනුව ක්‍රියා පදයේ අග අකුරු වෙනස් වීම සිංහල භාෂාවේ වැදගත් ලක්ෂණයකි. "
            "අතීත කාලයේදී 'ඔහු වීඩියෝව බැලුවේය' හෝ කථන භාෂාවෙන් 'එයා වීඩියෝ එක බැලුවා' යනුවෙන් යෙදේ. "
            "ප්‍රශ්නයක් අසන විට 'ද', 'කොහොමද', 'ඇයි', 'මොකක්ද', 'කීයද' වැනි නිපාත හා ප්‍රශ්නවාචී පද නිවැරදිව භාවිතා කිරීමෙන් අදහස පැහැදිලිව ප්‍රකාශ කළ හැකිය."
        ),
    },
    {
        "id": "s1e_si_02",
        "language": "sinhala",
        "group": "si_daily_conversation",
        "source": "MASTER AI Original Sinhala Dialogues",
        "license": "Original Project Authored",
        "text": (
            "දිනක් සවස් වරුවේ කසුන් සහ චමරි තම විශ්වවිද්‍යාල ව්‍යාපෘතිය ගැන කතාබහ කළහ. "
            "කසුන් ඇසුවේ, 'චමරි, අපි රෙකෝඩ් කරපු ප්‍රසන්ටේෂන් වීඩියෝ එකේ සද්දේ පොඩ්ඩක් අඩුයි වගේ නේද?' කියාය. "
            "එවිට චමරි පිළිතුරු දුන්නේ, 'ඔව් කසුන්, කටහඬ පැහැදිලි මදි තමයි. හැබැයි අපිට Audio Studio එකෙන් Vocal Clarity preset එක දාලා 1kHz සහ 2kHz මට්ටම් වැඩි කරගන්න පුළුවන්' යනුවෙනි. "
            "පසුව ඔවුන් දෙදෙනාම වීඩියෝව නැවත පරීක්ෂා කර බැලූ විට කටහඬ ඉතා පැහැදිලිව ඇසෙන්නට විය. "
            "වැඩි වේලාවක් නාස්ති නොකර අන්තර්ජාලය නැතිවම පරිගණකය තුළදී එම සැකසුම සිදු කිරීමට හැකි වීම ගැන ඔවුන් දෙදෙනා බෙහෙවින් සතුටු වූහ."
        ),
    },
    {
        "id": "s1e_si_03",
        "language": "sinhala",
        "group": "si_math_explainer",
        "source": "MASTER AI Original Sinhala Science Series",
        "license": "Original Project Authored",
        "text": (
            "ප්‍රතිශත (Percentages) සහ අනුපාත (Ratios) එදිනෙදා ජීවිතයේදී මෙන්ම පරිගණක වැඩසටහන් වලදීද නිතර භාවිතා වේ. "
            "උදාහරණයක් ලෙස යම් ගොනුවක ප්‍රමාණය මෙගාබයිට් 100ක් යැයි සිතමු. එය සම්පීඩනය (Compress) කිරීමෙන් පසු මෙගාබයිට් 75ක් බවට පත් වුවහොත් ඉතිරි වූ ප්‍රමාණය සියයට විසිපහකි (25%). "
            "තිර අනුපාතය හෙවත් Aspect Ratio යනු රූපයක පළල සහ උස අතර සම්බන්ධයයි. "
            "1920×1080 සහ 1280×720 යන ප්‍රමාණ දෙකම සරල කළ විට 16:9 යන පුළුල් තිර අනුපාතය ලැබේ. "
            "නමුත් ජංගම දුරකථනයකින් සිරස් අතට (Vertical) ගත් 1080×1920 වීඩියෝවක අනුපාතය 9:16 වේ. "
            "මෙම ගණිතමය සම්බන්ධතා තේරුම් ගැනීමෙන් ඕනෑම තිරයකට ගැළපෙන පරිදි රූප විකෘති නොවී පෙන්වීමට අපට හැකියාව ලැබේ."
        ),
    },
    {
        "id": "s1e_si_04",
        "language": "sinhala",
        "group": "si_internet_network",
        "source": "MASTER AI Original Sinhala Tech Essay",
        "license": "Original Project Authored",
        "text": (
            "පරිගණක ජාල සහ අන්තර්ජාලය ක්‍රියාත්මක වන ආකාරය ඉතා ක්‍රමානුකූලය. "
            "ඔබ වෙබ් අඩවියකින් වීඩියෝවක් හෝ ගොනුවක් බාගත කරන විට, එම දත්ත කුඩා පැකට්ටු (Packets) වලට කඩා ජාලය හරහා එවනු ලැබේ. "
            "යම් අවස්ථාවකදී අන්තර්ජාල වේගය අඩු වුවහොත් වීඩියෝව නැරඹීමේදී බෆරින් (Buffering) සිදු විය හැකිය. "
            "එවැනි ගැටලු මඟහරවා ගැනීම සඳහා HLS වැනි Adaptive Streaming තාක්ෂණයන් භාවිතා කරයි. "
            "තවද පෞද්ගලික ගොනු තමන්ගේම පරිගණකයේ ගබඩා කර Local Player එකක් මගින් නැරඹීමෙන් කිසිදු ජාල ප්‍රමාදයකින් තොරව 4K වැනි ඉහළ ගුණාත්මක වීඩියෝ වුවද ඉතා සුමටව ධාවනය කළ හැකිය."
        ),
    },
    {
        "id": "s1e_si_05",
        "language": "sinhala",
        "group": "si_clarity_honesty",
        "source": "MASTER AI Original Ethical Guidelines",
        "license": "Original Project Authored",
        "text": (
            "වගකිවයුතු කෘත්‍රිම බුද්ධි සහායකයෙකු සෑම විටම සත්‍යවාදී විය යුතුය. "
            "පරිශීලකයෙකු අසන ප්‍රශ්නයකට අදාළ තොරතුරු තමන් සතුව නොමැති නම්, වැරදි පිළිතුරක් ගොතා කීම කිසිසේත් සුදුසු නැත. "
            "ඒ වෙනුවට 'මට එම ගොනුවේ උපසිරැසි හෝ දත්ත ලැබී නැති නිසා නිශ්චිත පිළිතුරක් දිය නොහැක' යනුවෙන් අවංකව පැවසීම වඩාත් නිවැරදි වේ. "
            "එමෙන්ම ප්‍රශ්නය අපැහැදිලි නම්, පරිශීලකයාගෙන් කාරුණිකව අමතර විස්තර විමසීම හොඳ සංවාද ලක්ෂණයකි. "
            "පරිශීලකයා කලින් දුන් තොරතුරක් නිවැරදි කළහොත් එය සතුටින් පිළිගෙන අලුත් තොරතුරට අනුව පිළිතුර යාවත්කාලීන කළ යුතුය."
        ),
    },
    {
        "id": "s1e_si_06",
        "language": "sinhala",
        "group": "si_weather_seasons",
        "source": "MASTER AI Original Sinhala Geography Text",
        "license": "Original Project Authored",
        "text": (
            "ශ්‍රී ලංකාව නිවර්තන දූපතක් වන බැවින් වසර පුරාම උණුසුම් හා සෞම්‍ය දේශගුණයක් අත්විඳිය හැකිය. "
            "මෝසම් සුළං රටා දෙකක් මගින් රටේ වර්ෂාපතනය ප්‍රධාන වශයෙන් පාලනය වේ. "
            "මැයි සිට සැප්තැම්බර් දක්වා නිරිතදිග මෝසම සක්‍රීය වන අතර දෙසැම්බර් සිට පෙබරවාරි දක්වා ඊසානදිග මෝසමෙන් වැසි ලැබේ. "
            "මධ්‍යම කඳුකරයේ නුවරඑළිය, හපුතලේ සහ බණ්ඩාරවෙල වැනි ප්‍රදේශවල සිසිල් දේශගුණයක් පවතින අතර වෙරළබඩ ප්‍රදේශවල උණුසුම තරමක් වැඩිය. "
            "මෙම විවිධත්වය නිසා ශ්‍රී ලංකාවේ තේ, කුළුබඩු සහ වී වගාව මෙන්ම සංචාරක කර්මාන්තයද ඉතා සාර්ථකව පවත්වාගෙන යනු ලැබේ."
        ),
    },

    # -------------------------------------------------------------------------
    # ENGLISH EXTENDED PROSE (General Knowledge, Architecture, UX, Science)
    # -------------------------------------------------------------------------
    {
        "id": "s1e_en_01",
        "language": "english",
        "group": "en_tokenizer_mechanics",
        "source": "MASTER AI Tokenizer Engineering Paper",
        "license": "Original Project Authored",
        "text": (
            "Why does vocabulary size matter so profoundly for multilingual language models? "
            "In a minimal 1024-token Byte-Level BPE table, 256 slots are immediately reserved for single UTF-8 bytes and another handful for special control tokens. "
            "That leaves roughly 760 subword merges for all human languages combined. High-frequency English words capture most of those slots, forcing multi-byte Unicode scripts such as Sinhala—where every character spans three UTF-8 bytes—to be represented nearly byte by byte. "
            "A single Sinhala sentence can easily consume four to five times as many tokens as an equivalent English sentence! "
            "Expanding the custom vocabulary to 4096 or 8192 merges with Unicode-cluster-aware pre-tokenization compresses Sinhala sequences dramatically. "
            "As a result, both context retention and long-range grammatical dependencies improve within the same context window budget."
        ),
    },
    {
        "id": "s1e_en_02",
        "language": "english",
        "group": "en_memory_vs_weights",
        "source": "MASTER AI Architecture Clarification Notes",
        "license": "Original Project Authored",
        "text": (
            "Software developers building conversational assistants must draw a clean conceptual boundary between two kinds of memory. "
            "The first is Parametric Knowledge stored inside the trained neural network weights—this shapes grammar, vocabulary, reasoning habits, and general domain facts learned during training epochs. "
            "The second is Session Conversation Memory managed dynamically by the application layer during an active chat. "
            "As users exchange messages back and forth, the session manager tracks token usage against the model's fixed native context limit, compresses older turns into concise summaries when space grows tight, preserves the most recent exchanges intact, and feeds grounded local tool results cleanly alongside the prompt. "
            "Confusing UI session history with genuine neural learning creates misleading claims; honest engineering keeps both layers clear and inspectable."
        ),
    },
    {
        "id": "s1e_en_03",
        "language": "english",
        "group": "en_step_by_step_troubleshoot",
        "source": "MASTER CLOUD Diagnostics Handbook",
        "license": "Original Project Authored",
        "text": (
            "Systematic troubleshooting prevents wasted guesswork when software behaves unexpectedly. "
            "Begin by reproducing the symptom in isolation and reading exact error logs before altering code. "
            "If local neural inference stalls on a Windows laptop, verify system RAM load, Windows virtual commit availability, and GPU VRAM headroom. "
            "When CPU BLAS thread pools attempt to reserve gigabytes of virtual address space under low commit conditions, bounding OpenMP and OpenBLAS threads to a single worker keeps memory allocation predictable. "
            "On the GPU side, enabling gradient checkpointing and small microbatches with gradient accumulation enables larger models to train reliably within a 6 GB VRAM ceiling without triggering out-of-memory crashes."
        ),
    },
    {
        "id": "s1e_en_04",
        "language": "english",
        "group": "en_human_feedback_rlhf_notes",
        "source": "MASTER AI Continuous Improvement Policy",
        "license": "Original Project Authored",
        "text": (
            "Real conversational quality does not end after initial training; it grows steadily through structured human review. "
            "When fluent Sinhala and English speakers review generated replies, they spot subtle flaws that automated metrics overlook—such as stiff translated phrasing, mismatched verb tense endings, missing punctuation, or polite hedging that skips the user's real question. "
            "Recording explicit reviewer tags alongside written human corrections builds verified preference pairs. "
            "Crucially, user privacy demands explicit consent before storing conversational corrections for dataset curation, and preference optimization should only run once enough vetted human examples accumulate."
        ),
    },
    {
        "id": "s1e_en_05",
        "language": "english",
        "group": "en_color_science_display",
        "source": "MASTER CLOUD Display & Shader Guide",
        "license": "Original Project Authored",
        "text": (
            "Human vision perceives luminance contrast far more acutely than fine chrominance detail. "
            "Because of this biological trait, video compression formats convert red-green-blue frames into YCbCr space, storing brightness (Y) at higher fidelity while subsampling color channels. "
            "Good upscaling algorithms exploit the exact same property: rather than amplifying noise across saturated color channels, edge-adaptive shaders extract local luminance gradients first and restrict sharpening where contrast differences already suggest crisp contours. "
            "Meanwhile, ambient lighting around the display perimeter relaxes eye strain during night viewing by softening the stark brightness step between a glowing movie screen and a dark room."
        ),
    },

    # -------------------------------------------------------------------------
    # MIXED SINHALA-ENGLISH EXTENDED PROSE
    # -------------------------------------------------------------------------
    {
        "id": "s1e_mx_01",
        "language": "mixed",
        "group": "mixed_conversation_flow",
        "source": "MASTER AI Bilingual Conversation Guidelines",
        "license": "Original Project Authored",
        "text": (
            "Chat system එකක් එක්ක කතා කරද්දි user බලාපොරොත්තු වෙන්නේ natural සහ helpful පිළිතුරක්. "
            "සමහර වෙලාවට user අහන්නේ 'ඒක පොඩ්ඩක් සරලව explain කරන්න' හෝ 'ඔයා කලින් කිව්ව setting එක කොහෙන්ද හදාගන්නේ?' වගේ follow-up ප්‍රශ්න. "
            "එතකොට AI එකට previous turn එකේ context එක මතක තියෙන්න ඕන. "
            "තව දෙයක් තමයි, user ඉල්ලන video bitrate එක හෝ duration calculation එක වගේ exact numbers ගණනය කරද්දි neural model එකෙන් හිතුමතේ ඉලක්කම් guess කරන්නේ නැතුව deterministic tool එකකට භාර දෙන එක. "
            "ඊට පස්සේ ඒ tool එකෙන් ලැබුණු verified result එක අරගෙන user ට තේරෙන විදියට සිංහලෙන් හෝ English වලින් ලස්සනට explain කරලා දෙන එක තමයි safe hybrid design එක."
        ),
    },
    {
        "id": "s1e_mx_02",
        "language": "mixed",
        "group": "mixed_project_workflow",
        "source": "MASTER CLOUD Engineering Workflow",
        "license": "Original Project Authored",
        "text": (
            "Project එකක් develop කරද්දි අපි හැම වෙලාවෙම step-by-step verify කරගෙන ඉදිරියට යන්න ඕන. "
            "මුලින්ම old checkpoints සහ existing working features කිසිම හේතුවක් නිසා break වෙන්න නොදී preserve කරගන්න ඕන. "
            "ඊට පස්සේ clean dataset pipeline එකක් හදලා duplicate samples සහ bad unicode characters අයින් කරන්න ඕන. "
            "Hardware benchmark එකෙන් අපේ RTX 3050 6GB GPU එකේ හෝ CPU RAM එකේ සැබෑ capacity එක මැනලා, memory overflow වෙන්නේ නැති model size එක තෝරාගන්න පුළුවන්. "
            "අවසානයේ fake metrics පෙන්වන්නේ නැතුව සැබෑ test results සහ raw model outputs check කරලා GATE A සිට GATE E දක්වා පරීක්ෂා කිරීමෙන් තමයි real progress එක මැනගන්න පුළුවන් වෙන්නේ."
        ),
    },
]
