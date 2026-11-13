"""
Human-authored General Conversational Fluency Dialogues for MASTER AI CORE v1.0 Stage 2 SFT.

Focuses on non-domain-restricted natural human communication across:
- Everyday topics, weather/study planning, productivity, empathy, polite refusals
- Science, history, math word problems, computing concepts in Sinhala, English & Mixed
- Multi-turn context tracking, tone shifts (formal <-> casual), structured lists & step-by-step plans
"""

from typing import Dict, List, Any
from training.v1.data_v1.stage2_conversations import SYSTEM_DEFAULT

STAGE2_GENERAL_DIALOGUES: List[Dict[str, Any]] = [
    # ── Everyday Study, Time Management & Advice (Sinhala) ────────────────
    {
        "id": "gen_si_001",
        "language": "sinhala",
        "group": "gen_si_study_plan",
        "category": "casual",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "මට හෙට විභාගයක් තියෙනවා, ඒත් තාම පාඩම් කිහිපයක් ඉතිරි වෙලා. මම කොහොමද අද රෑ සූදානම් වෙන්නේ?"},
            {"role": "assistant", "content": "කලබල නොවී සැලසුමකට අනුව වැඩ කරමු. පළමුව, වැදගත්ම හා වැඩි ලකුණු හිමිවන පාඩම් දෙක තෝරාගන්න. මිනිත්තු 45 ක් එක දිගට පාඩම් කර මිනිත්තු 10 ක විවේකයක් ගන්න. රෑ ගොඩක් නිදිමත වන තුරු ඉන්නේ නැතිව පැය 6 කවත් නින්දක් ලබා ගැනීම මතක ශක්තියට ගොඩක් උදව් වෙනවා."},
            {"role": "user", "content": "සටහන් (notes) කියවනවට වඩා ප්‍රශ්න පත්‍ර කරන එක හොඳද?"},
            {"role": "assistant", "content": "ඔව්! අන්තිම මොහොතේදී පොත් කියවනවාට වඩා පසුගිය විභාග ප්‍රශ්න හෝ කෙටි ප්‍රශ්න උත්සාහ කර බැලීම (active recall) ඉතා සාර්ථකයි. එවිට ඔබට අමතක වන තැන් ඉක්මනින් හඳුනාගෙන ඒවා විතරක් නැවත බලාගන්න පුළුවන්."},
            {"role": "user", "content": "හරි, මම දැන් පටන් ගන්නම්. ගොඩක් ස්තූතියි!"},
            {"role": "assistant", "content": "ඔබට සුබ පැතුම්! විශ්වාසයෙන් වැඩ කරන්න, හොඳින් ලියන්න."},
        ],
    },
    {
        "id": "gen_si_002",
        "language": "sinhala",
        "group": "gen_si_science_sky",
        "category": "reasoning",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "දවල්ට අහස නිල් පාටට පේන්නේ ඇයි කියලා සරලව කියලා දෙන්න."},
            {"role": "assistant", "content": "හිරුගෙන් එන සුදු ආලෝකය තුළ දේදුන්නේ සියලුම වර්ණ අඩංගු වෙනවා. ආලෝකය පෘථිවි වායුගෝලය හරහා එද්දී, කෙටි තරංග ආයාමයක් ඇති නිල් ආලෝකය වායු අණු වල ගැටී සෑම දිශාවකටම වැඩිපුර විසිරෙනවා (Rayleigh scattering). අපේ ඇස්වලට අහස නිල් පාටට පෙනෙන්නේ ඒ නිසයි."},
            {"role": "user", "content": "එහෙනම් හවසට ඉර බැහැගෙන යද්දී රතු හෝ තැඹිලි පාට වෙන්නේ ඇයි?"},
            {"role": "assistant", "content": "හවසට හිරු ක්ෂිතිජයට පහත් වූ විට, ආලෝකයට අප වෙත පැමිණීමට වඩා ඝන වායුගෝල ස්ථරයක් හරහා දිගු දුරක් ගමන් කිරීමට සිදු වෙනවා. එහිදී නිල් ආලෝකය බොහොමයක් අතරමගදී විසිරී යන අතර, දිගු තරංග ආයාමයක් ඇති රතු සහ තැඹිලි වර්ණ පමණක් අපේ ඇස් වෙත ළඟා වෙනවා."},
        ],
    },
    {
        "id": "gen_si_003",
        "language": "sinhala",
        "group": "gen_si_sinhala_grammar",
        "category": "casual",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "සිංහල වාක්‍යයක උක්ත ආඛ්‍යාත සම්බන්ධය කියන්නේ මොකක්ද?"},
            {"role": "assistant", "content": "වාක්‍යයක ක්‍රියාව කරන පුද්ගලයා හෝ දෙය 'උක්තය' (Subject) ලෙසත්, එම ක්‍රියාව පෙන්වන පදය 'ආඛ්‍යාතය' (Verb) ලෙසත් හඳුන්වනවා. උක්තයේ පුරුෂය (උත්තම, මධ්‍යම, ප්‍රථම) සහ වචනය (ඒකවචන හෝ බහුවචන) අනුව ආඛ්‍යාතය ගැළපිය යුතුයි. උදාහරණයක් ලෙස: 'මම පොතක් කියවමි' සහ 'අපි පොත් කියවමු'."},
            {"role": "user", "content": "'ඔවුන් ගෙදර ගියේය' කියන එක නිවැරදිද?"},
            {"role": "assistant", "content": "ලිඛිත ව්‍යාකරණ රීති අනුව 'ඔවුන්' යනු බහුවචන උක්තයක් නිසා ආඛ්‍යාතය ද බහුවචන විය යුතුයි. එබැවින් 'ඔවුහු ගෙදර ගියහ' (හෝ කටවහරේදී 'ඔවුන් ගෙදර ගියා') ලෙස යෙදීම වඩාත් නිවැරදියි."},
        ],
    },

    # ── General English Problem Solving, Writing & Computing ──────────────
    {
        "id": "gen_en_001",
        "language": "english",
        "group": "gen_en_debugging_mindset",
        "category": "reasoning",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Whenever my code fails with an unexpected bug, I feel stuck staring at the screen. What is a structured way to debug it?"},
            {"role": "assistant", "content": "Try narrowing down the problem in four calm steps: 1) Reproduce the bug reliably with the smallest possible input. 2) Read the exact error message and line number instead of guessing. 3) Verify assumptions — print or inspect actual variable values right before the failure. 4) Change only one thing at a time so you know what fixed it."},
            {"role": "user", "content": "What if there is no error message at all, just the wrong output?"},
            {"role": "assistant", "content": "That is a logic bug. Use binary search by placing checkpoints halfway through your data pipeline: inspect the state after step 1, step 2, and so on until you find the exact boundary where expected values diverge from actual values."},
        ],
    },
    {
        "id": "gen_en_002",
        "language": "english",
        "group": "gen_en_email_drafting",
        "category": "clarification",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Help me write a short message telling a teammate that the project demo will move to Friday afternoon."},
            {"role": "assistant", "content": "Sure! Should the tone be formal for a manager or casual for a close teammate?"},
            {"role": "user", "content": "Friendly and casual, we work together every day."},
            {"role": "assistant", "content": "Here is a clean message you can send:\n'Hey! Quick heads-up — we are shifting our project demo to Friday afternoon so everyone has time to wrap up final testing. Let me know if that time works on your calendar!'"},
            {"role": "user", "content": "Can you make it one sentence shorter?"},
            {"role": "assistant", "content": "'Hey! Quick heads-up: our project demo is moving to Friday afternoon to give us extra testing time — hope that works for you!'"},
        ],
    },
    {
        "id": "gen_en_003",
        "language": "english",
        "group": "gen_en_neural_networks_intro",
        "category": "reasoning",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "In plain words, how does an autoregressive language model generate text one word after another?"},
            {"role": "assistant", "content": "An autoregressive model reads the prompt tokens you gave it, calculates a probability score across its vocabulary for what token fits best next, selects one token (either greedily or by sampling), appends that token to the context, and repeats the loop until it generates a stop token or reaches the length limit."},
            {"role": "user", "content": "Why does temperature change how creative or repetitive the answers look?"},
            {"role": "assistant", "content": "Temperature scales the raw prediction scores before softmax. Low temperature (such as 0.2) sharpens probabilities toward the single most likely token, giving focused, predictable replies. Higher temperature (around 0.8) flattens the curve, giving less common tokens a chance and increasing variety — though too high can cause rambling."},
        ],
    },
    {
        "id": "gen_en_004",
        "language": "english",
        "group": "gen_en_math_word_problem",
        "category": "reasoning",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "A train travels 180 kilometers in 2 hours and 15 minutes. What is its average speed in km/h?"},
            {"role": "assistant", "content": "First, convert 2 hours and 15 minutes into hours: 15 minutes is 15 / 60 = 0.25 hours, so total time is 2.25 hours. Now divide distance by time: 180 km / 2.25 hours = 80 km/h."},
            {"role": "user", "content": "Wait, I meant 2 hours and 30 minutes, not 15 minutes!"},
            {"role": "assistant", "content": "No problem! With 2 hours and 30 minutes (2.5 hours): 180 km / 2.5 hours = 72 km/h."},
        ],
    },

    # ── Natural Bilingual Code-Switching & Cultural Clarity (Mixed) ───────
    {
        "id": "gen_mix_001",
        "language": "mixed",
        "group": "mix_daily_coding_sync",
        "category": "casual",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Machan, AI model ekak train karaddi overfitting wenawa kiyanne mokakda?"},
            {"role": "assistant", "content": "Overfitting කියන්නේ මොඩලය training data ටික කටපාඩම් (memorize) කරගෙන, කලින් නොදැකපු අලුත් ප්‍රශ්න (unseen data) වලදී හරියට උත්තර දෙන්න බැරි වෙන තත්ත්වයයි."},
            {"role": "user", "content": "Eka nawaththanna monawada karanna puluwan?"},
            {"role": "assistant", "content": "ඒක අඩු කරන්න පුළුවන් ප්‍රධාන ක්‍රම කිහිපයක් තියෙනවා: 1) තව විවිධත්වයෙන් යුතු training data එකතු කිරීම, 2) Dropout හෝ Weight Decay භාවිතය, 3) Validation loss එක බලමින් early stopping යෙදීම, සහ 4) Data set එකේ ප්‍රමාණයට ගැළපෙන මොඩල් විශාලත්වයක් තෝරා ගැනීම."},
        ],
    },
    {
        "id": "gen_mix_002",
        "language": "mixed",
        "group": "mix_story_summarize",
        "category": "translation",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Summarize this paragraph in Sinhala: 'Small teams often ship reliable software faster because short communication loops prevent misunderstandings and let engineers test real user workflows early.'"},
            {"role": "assistant", "content": "සාරාංශය: කුඩා කණ්ඩායම් අතර සන්නිවේදනය ඉක්මන් හා පැහැදිලි බැවින් වැරදි අවබෝධ අඩු වී, සැබෑ පරිශීලක වැඩ ක්‍රියාවලීන් කල්තියා පරීක්ෂා කර විශ්වාසදායක මෘදුකාංග ඉක්මනින් නිර්මාණය කිරීමට හැකි වේ."},
            {"role": "user", "content": "Dan eka bullet points dekakin English walin kiyanna."},
            {"role": "assistant", "content": "- Faster, clearer communication in small teams reduces misunderstandings.\n- Early testing of real user workflows helps deliver reliable software quickly."},
        ],
    },
    {
        "id": "gen_mix_003",
        "language": "mixed",
        "group": "mix_honest_medical_refusal",
        "category": "uncertainty",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Mata iye indan thada una ekak ekka oluwa kakkumak thiyenawa, mona behethada ganna one?"},
            {"role": "assistant", "content": "මම AI සහායකයෙක් මිස වෛද්‍යවරයෙක් නොවන නිසා, ඔබට ගැළපෙන නිශ්චිත ඖෂධ නිර්දේශ කිරීමට මට නොහැකියි. තද උණ සහ හිසරදය දිගටම පවතිනවා නම් කරුණාකර සුදුසුකම් ලත් වෛද්‍යවරයෙකු හමුවී පරීක්ෂා කරවා ගන්න."},
            {"role": "user", "content": "Hari, doctor kenek balanna yanakam wathura bonne ekada hoda?"},
            {"role": "assistant", "content": "ඔව්, වෛද්‍යවරයෙකු හමුවන තුරු විවේක ගැනීම සහ පිරිසිදු ජලය ප්‍රමාණවත් ලෙස පානය කර ශරීරය විජලනය වීමෙන් වළක්වා ගැනීම සාමාන්‍යයෙන් ආරක්ෂිත පියවරකි. රෝග ලක්ෂණ දරුණු වන්නේ නම් වහාම වෛද්‍ය ප්‍රතිකාර ලබා ගන්න."},
        ],
    },
    {
        "id": "gen_mix_004",
        "language": "mixed",
        "group": "mix_memory_correction",
        "category": "follow_up",
        "source": "master_cloud_v1_human_authored",
        "license": "Project-Original",
        "turns": [
            {"role": "system", "content": SYSTEM_DEFAULT},
            {"role": "user", "content": "Mage project eke nama 'LankaDocs' kiyala mathaka thiya ganna."},
            {"role": "assistant", "content": "හරි! මේ සංවාදය තුළදී ඔබේ ව්‍යාපෘතියේ නම 'LankaDocs' ලෙස මම මතක තබා ගන්නම්. අපි ඒ ගැන මොනවාද සාකච්ඡා කරන්නේ?"},
            {"role": "user", "content": "Ekata Sinhala saha English search facility ekak hadanna one."},
            {"role": "assistant", "content": "LankaDocs සඳහා සිංහල සහ ඉංග්‍රීසි ද්විභාෂා සෙවුම් පද්ධතියක් (bilingual search) සෑදීමේදී, Unicode NFC සාමාන්‍යකරණය සහ BM25 හෝ subword tokenization භාවිතා කිරීම ඉතා වැදගත් වෙනවා."},
            {"role": "user", "content": "Mage project eke nama mokakda kiwwe?"},
            {"role": "assistant", "content": "ඔබේ ව්‍යාපෘතියේ නම 'LankaDocs' ලෙසයි ඔබ සඳහන් කළේ."},
        ],
    },
]
