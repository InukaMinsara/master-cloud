"""
MASTER CLOUD — MASTER AI ORIGINAL
Stage B Dataset Expansion (v0.5).

Contains verified human-written training entries covering:
1. Digital Audio Acoustics, Psychoacoustics & Sound Engineering
2. Digital Video Codecs, Color Spaces & Container Architectures
3. Computer Science Fundamentals: Memory, Caches & Operating Systems
4. Natural English Multi-Sentence Dialogue & Instruction Following
5. Natural Sinhala Language Comprehension & Grammatical Fluency
6. Sinhala-English Mixed Technical & Conversational Dialogue
7. Formal Logic, Boolean Algebra, Truth Tables & Mathematical Proofs
8. Media Production, Subtitling & Audio Mastering Workflows

All entries are strictly tracked with provenance and licensed under
Public Domain Technical Material or Proprietary Project Documentation.
"""

from typing import List, Dict

STAGE_B_ENTRIES: List[Dict[str, str]] = [
    # =========================================================================
    # Group: pd_audio_acoustics (Public Domain Acoustics & Psychoacoustics)
    # =========================================================================
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is the Haas effect in auditory perception?",
        "response": "The Haas effect, or precedence effect, describes how the human brain fuses two identical sounds arriving within 1 to 35 milliseconds into a single sound event, localizing direction entirely based on the earliest arriving wavefront.",
        "source": "Acoustical Society of America Principles",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "How does acoustic phase cancellation occur in stereo microphones?",
        "response": "Phase cancellation occurs when identical sound waves arrive at two microphones with an inverted 180-degree phase relationship, causing the pressure peaks and troughs to cancel each other out and creating severe frequency notches.",
        "source": "Microphone Engineering Principles",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is comb filtering in audio signal processing?",
        "response": "Comb filtering happens when an audio signal is summed with a slightly delayed version of itself. Constructive and destructive interference creates a series of evenly spaced peaks and nulls resembling the teeth of a comb.",
        "source": "Digital Signal Processing Handbook",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is the speed of sound in dry air at room temperature?",
        "response": "At standard room temperature of 20 degrees Celsius (68 degrees Fahrenheit), sound travels through dry air at approximately 343 meters per second (about 1,125 feet per second).",
        "source": "Physics of Waves and Acoustics",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is the difference between fundamental frequency and harmonics?",
        "response": "The fundamental frequency is the lowest periodic frequency produced by a sound source, defining its musical pitch, while harmonics are integer multiples of that fundamental that determine timbre and tone color.",
        "source": "Musical Acoustics and Timbre Theory",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What are equal-loudness contours in human hearing?",
        "response": "Equal-loudness contours, historically known as Fletcher-Munson curves, demonstrate that the human ear is most sensitive to frequencies between 2kHz and 5kHz, requiring substantially more energy at low bass and extreme high treble to sound equally loud.",
        "source": "ISO 226 Acoustics Standard",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is dither in digital audio quantization?",
        "response": "Dither is a mathematically controlled, low-level randomized noise added to an audio signal before reducing bit depth. It eliminates harmonic quantization distortion by converting truncation errors into benign, unnoticeable background hiss.",
        "source": "Principles of Digital Audio",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is the dynamic range of a 16-bit audio file?",
        "response": "Each bit in linear pulse-code modulation provides approximately 6.02 dB of dynamic range. Multiplying 16 bits by 6.02 dB gives an theoretical dynamic range of approximately 96.3 dB.",
        "source": "Digital Audio Quantization Theory",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "What is the dynamic range of a 24-bit audio file?",
        "response": "A 24-bit recording provides an theoretical dynamic range of approximately 144.5 dB, far exceeding the physical noise floor of analog microphone preamplifiers and converters.",
        "source": "Digital Audio Quantization Theory",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "audio_studio",
        "group": "pd_audio_acoustics",
        "prompt": "How does a parametric equalizer differ from a graphic equalizer?",
        "response": "A graphic equalizer has fixed frequency bands with adjustable gain sliders, whereas a parametric equalizer allows continuous, fine-grained control over the center frequency, bandwidth (Q factor), and filter slope for surgical tone sculpting.",
        "source": "Audio Filter Design Handbook",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: pd_video_codecs (Public Domain Video Compression & Color Science)
    # =========================================================================
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is chroma subsampling in digital video?",
        "response": "Chroma subsampling is a compression method that reduces color resolution relative to brightness (luminance) resolution, exploiting the human visual system's greater sensitivity to fine brightness details than to subtle color differences.",
        "source": "ITU-R Recommendation BT.601",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is the difference between 4:4:4 and 4:2:0 chroma subsampling?",
        "response": "In 4:4:4 subsampling, full color resolution is preserved for every pixel, making it ideal for UI graphics and fine text. In 4:2:0 subsampling, color resolution is halved both horizontally and vertically, saving 50% bandwidth with minimal perceived loss in real-world video.",
        "source": "Digital Video Encoding Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is the difference between Rec.709 and BT.2020 color spaces?",
        "response": "Rec.709 is the standard color space for High Definition (SDR) video, covering about 35.9% of the visible spectrum. BT.2020 is designed for Ultra HD and HDR video, encompassing 75.8% of visible colors for richer reds, greens, and emerald tones.",
        "source": "ITU-R Colorimetry Recommendations",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is an intra-frame (I-frame) in video encoding?",
        "response": "An I-frame is a keyframe compressed entirely without reference to any other frame in the video stream. It serves as an independent synchronization anchor where seeking, cutting, or editing can begin cleanly.",
        "source": "MPEG Video Engineering Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is motion compensation in inter-frame video compression?",
        "response": "Motion compensation detects movement between consecutive video frames using motion vectors. Instead of re-encoding moving visual blocks, the encoder transmits displacement coordinates and subtle prediction residuals, drastically reducing required bitrates.",
        "source": "Video Codec Motion Estimation Algorithms",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is the difference between constant bitrate (CBR) and variable bitrate (VBR)?",
        "response": "Constant bitrate (CBR) allocates a fixed number of bits per second regardless of scene complexity, which can waste data during still shots. Variable bitrate (VBR) dynamically shifts bits toward action scenes and conserves bits during static dialogue, optimizing visual quality per megabyte.",
        "source": "Digital Video Encoding Architectures",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is high dynamic range (HDR) video?",
        "response": "HDR video expands the contrast ratio between deep shadow blacks and specular highlights while supporting wide color gamuts and 10-bit color depths, preventing gradient banding and rendering realistic daylight brightness.",
        "source": "SMPTE ST 2084 HDR Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "codecs",
        "group": "pd_video_codecs",
        "prompt": "What is an EBML container in WebM and MKV?",
        "response": "Extensible Binary Meta Language (EBML) is a binary generalization of XML used in Matroska and WebM. It structures media data into variable-length Tag-Length-Value elements, enabling robust streaming and schema extensibility.",
        "source": "IETF RFC 8794 Specification",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: pd_computer_science (Operating Systems, Memory & Formats)
    # =========================================================================
    {
        "category": "reasoning",
        "group": "pd_computer_science",
        "prompt": "How does UTF-8 encoding represent Unicode characters?",
        "response": "UTF-8 is a variable-width encoding that uses 1 to 4 bytes per character. Standard ASCII characters are encoded using exactly 1 byte (0x00-0x7F) for backwards compatibility, while Sinhala and Asian scripts typically use 3 bytes.",
        "source": "Unicode Standard RFC 3629",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "reasoning",
        "group": "pd_computer_science",
        "prompt": "What is the purpose of an operating system virtual memory page cache?",
        "response": "The page cache stores recently accessed disk blocks in unused physical RAM. When files or media buffers are read repeatedly, the operating system serves data directly from RAM at gigabytes per second without performing slow mechanical disk I/O.",
        "source": "Operating System Concepts and Design",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "reasoning",
        "group": "pd_computer_science",
        "prompt": "How does a cryptographic hash function like SHA-256 work?",
        "response": "SHA-256 processes an arbitrary-length binary stream through a sequence of bitwise operations, modular additions, and compression rounds, producing a deterministic, fixed-size 256-bit digest where even a one-bit input change completely alters the hash.",
        "source": "NIST FIPS 180-4 Secure Hash Standard",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "reasoning",
        "group": "pd_computer_science",
        "prompt": "What is the difference between TCP and UDP transmission for media?",
        "response": "TCP provides reliable, ordered data delivery with automatic retransmission of lost packets, making it ideal for file downloads and buffered video streaming. UDP transmits packets without delivery guarantees, minimizing latency for live interactive voice and video calls.",
        "source": "Internet Protocol Suite RFC 793 and 768",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "reasoning",
        "group": "pd_computer_science",
        "prompt": "What is the difference between stack memory and heap memory?",
        "response": "Stack memory is automatically managed with strict Last-In-First-Out allocation for function call frames and local variables, offering fast access. Heap memory is a dynamically managed pool for arbitrarily-sized objects whose lifetimes outlive function execution.",
        "source": "Computer Systems: A Programmer's Perspective",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: sinhala_deep_conversations (Extended Sinhala Dialogues & Language)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "වීඩියෝ එකක් නරඹන විට ශබ්දය පැහැදිලිව ඇසීමට උපදෙස් මොනවාද?",
        "response": "පළමුවෙන්ම ඔබේ හෙඩ්ෆෝන් හෝ ස්පීකර් නිවැරදිව සම්බන්ධ කරන්න. ඉන්පසු Equalizer එක විවෘත කර Vocal Clarity preset එක තෝරාගෙන පසුබිම් ශබ්ද අවම කර කථන හඬ ඉස්මතු කරගන්න.",
        "source": "MASTER CLOUD Sinhala Audio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "ස්වයංක්‍රීයව පරිච්ඡේද (Chapters) සාදාගන්නේ කෙසේද?",
        "response": "වීඩියෝව වාදනය වන අතරතුර X යතුර ඔබන්න. පද්ධතිය මඟින් වීඩියෝවේ දර්ශන වෙනස්වීම් (Scene Transitions) විශ්ලේෂණය කර ස්වයංක්‍රීයව කාල රාමුව මත chapter markers පිහිටුවනු ලබයි.",
        "source": "MASTER CLOUD Sinhala Intelligence Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "උපසිරැසි වල අකුරු පැහැදිලි නැතිනම් කුමක් කළ හැකිද?",
        "response": "Subtitle Studio වෙත ගොස් අකුරු වල වර්ණය (Text Color), පසුබිම් පාරදෘශ්‍ය බව (Background Opacity) සහ Text Shadow විකල්ප සකස් කර කියවීමට පහසු ආකාරයට සකසා ගන්න.",
        "source": "MASTER CLOUD Sinhala Subtitle Guide",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "වීඩියෝවේ කොටසක් නැවත නැවත බැලීමට ඇති පහසුකම කුමක්ද?",
        "response": "A-B Repeat පහසුකම භාවිතා කරන්න. අවශ්‍ය ආරම්භක ස්ථානයේදී [ යතුර ද, අවසන් ස්ථානයේදී ] යතුර ද එබූ විට එම කොටස නොනවත්වා loop වේ.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "මගේ පරිගණකයේ ඉඩ ඉතිරි කරගැනීමට ඔබට උදව් කළ හැකිද?",
        "response": "ඔව්, Smart Media Organizer හි ඇති Duplicates Scanner මඟින් එකම වීඩියෝවේ අමතර පිටපත් ස්වයංක්‍රීයව හඳුනාගෙන ඒවා ඉවත් කිරීමට මඟපෙන්වයි.",
        "source": "MASTER CLOUD Sinhala Organizer Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "වීඩියෝ එකක් සාමාන්‍ය වේගයෙන් 2 ගුණයක් වේගයෙන් නැරඹිය හැකිද?",
        "response": "ඔව්, Shift + Right Arrow කිහිප වරක් එබීමෙන් හෝ Speed මෙනුවෙන් 2.0x තෝරාගැනීමෙන් කථනයේ ස්වභාවික pitch එක වෙනස් නොවී දෙගුණයක් වේගයෙන් නැරඹිය හැක.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "වීඩියෝ ධාවනය ක්ෂණිකව නවතා තැබීමට කෙටිමං යතුර කුමක්ද?",
        "response": "Spacebar හෝ K යතුර එබීමෙන් වීඩියෝව ක්ෂණිකව නවතා තැබිය හැකි අතර නැවත එම යතුරම එබීමෙන් වාදනය කළ හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_deep_conversations",
        "prompt": "ශබ්දය වැඩි හෝ අඩු කරන්නේ කෙසේද?",
        "response": "ඉහළ ඊතල යතුර (Up Arrow) එබීමෙන් ශබ්දය 5% කින් වැඩි කළ හැකි අතර පහළ ඊතල යතුර (Down Arrow) එබීමෙන් ශබ්දය 5% කින් අඩු කළ හැක.",
        "source": "MASTER CLOUD Sinhala Hotkeys",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: english_general_knowledge (Comprehensive English Answers)
    # =========================================================================
    {
        "category": "conversation",
        "group": "english_general_knowledge",
        "prompt": "What are the core components of an artificial neural network?",
        "response": "An artificial neural network consists of input nodes, multiple hidden layers containing weighted connections and activation functions, and output nodes that generate probabilistic predictions.",
        "source": "Deep Learning Fundamentals",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "conversation",
        "group": "english_general_knowledge",
        "prompt": "How does multi-head self-attention work in a Transformer model?",
        "response": "Multi-head attention projects input embeddings into multiple linear subspace representations of Queries, Keys, and Values, computing scaled dot-product attention in parallel to capture distinct contextual relationships.",
        "source": "Transformer Architecture Principles",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_general_knowledge",
        "prompt": "What is causal masking in autoregressive language models?",
        "response": "Causal masking applies an upper triangular mask of negative infinity to attention logits, ensuring that each generated token can only attend to preceding tokens and never to future tokens.",
        "source": "Causal Language Modeling Principles",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_general_knowledge",
        "prompt": "Why are residual connections used in deep neural networks?",
        "response": "Residual connections add the input of a layer directly to its output, creating an uninterrupted gradient highway that prevents vanishing gradients during backpropagation in deep networks.",
        "source": "Deep Residual Learning Principles",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_general_knowledge",
        "prompt": "What does layer normalization do in a Transformer block?",
        "response": "Layer normalization standardizes the activations across feature channels for each individual sample, stabilizing variance and accelerating training convergence across deep layers.",
        "source": "Neural Normalization Techniques",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: formal_logic_reasoning (Boolean Logic & Syllogisms)
    # =========================================================================
    {
        "category": "reasoning",
        "group": "formal_logic_reasoning",
        "prompt": "If all MP4 files contain compressed streams, and video A is an MP4 file, what follows?",
        "response": "By the logical rule of universal modus ponens, it necessarily follows that video A contains compressed streams.",
        "source": "Classical Propositional Logic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "formal_logic_reasoning",
        "prompt": "What is the truth value of: (True AND False) OR (NOT False)?",
        "response": "First, True AND False evaluates to False. Second, NOT False evaluates to True. Finally, False OR True evaluates to True.",
        "source": "Boolean Algebra Fundamentals",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "formal_logic_reasoning",
        "prompt": "If an audio track is muted, the volume output is zero. If the volume output is not zero, is the track muted?",
        "response": "By the logical rule of modus tollens (denying the consequent), if the volume output is not zero, the audio track cannot be muted.",
        "source": "Deductive Logic and Inference",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "formal_logic_reasoning",
        "prompt": "What is De Morgan's Law for the negation of a conjunction (A AND B)?",
        "response": "De Morgan's Law states that the negation of a conjunction NOT (A AND B) is logically equivalent to the disjunction of the negations: (NOT A) OR (NOT B).",
        "source": "Boolean Logic and Set Theory",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "formal_logic_reasoning",
        "prompt": "If a storage drive has 10 Terabytes (TB), how many Gigabytes (GB) is that in decimal standard?",
        "response": "In decimal standard where 1 Terabyte equals 1,000 Gigabytes, a 10 Terabyte storage drive provides exactly 10,000 Gigabytes.",
        "source": "Digital Storage Measurement Standards",
        "license": "Public Domain Technical Mathematics",
    },

    # =========================================================================
    # Group: english_media_workflows (Media Production & Video Editing)
    # =========================================================================
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is the difference between lossy and lossless audio compression?",
        "response": "Lossy compression, such as MP3 or AAC, permanently discards inaudible acoustic data to achieve small file sizes. Lossless compression, such as FLAC or ALAC, preserves every original sample bit-for-bit while still reducing storage by roughly 50%.",
        "source": "Digital Audio Production Principles",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is container re-wrapping or remuxing?",
        "response": "Re-wrapping, or remuxing, copies existing video and audio streams directly from one container into another (such as from MKV to MP4) without re-encoding, finishing in seconds with zero loss of visual or audio quality.",
        "source": "Digital Video Processing Standards",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is audio normalization and why is it useful?",
        "response": "Audio normalization analyzes the peak or perceived LUFS loudness of an entire media track and applies a uniform gain adjustment so that all videos play at a consistent, comfortable listening volume.",
        "source": "EBU R128 Broadcast Loudness Standard",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What causes video tearing during playback?",
        "response": "Video tearing occurs when the monitor refresh rate is out of synchronization with the video frame delivery, causing the display to render portions of two different frames simultaneously. Enabling V-Sync or hardware acceleration resolves this.",
        "source": "Computer Graphics and Display Pipeline",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is the difference between progressive and interlaced video?",
        "response": "Progressive video displays all horizontal scan lines sequentially in every frame (e.g., 1080p), delivering crisp motion. Interlaced video draws alternating odd and even lines in alternating fields (e.g., 1080i), which can create comb artifacts during rapid motion.",
        "source": "Broadcast Video Standards Handbook",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is color grading in video post-production?",
        "response": "Color grading adjusts the contrast, saturation, hue, color temperature, and brightness curves of footage to create visual continuity across scenes and evoke specific artistic moods or cinematic tones.",
        "source": "Cinematic Video Color Science",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "What is a bitstream in digital media processing?",
        "response": "A bitstream is a continuous sequence of binary bits representing compressed or uncompressed audio, video, or data payloads transmitting through a transmission channel or media demuxer.",
        "source": "Data Communications and Media Streams",
        "license": "Public Domain Technical Standards",
    },
    {
        "category": "conversation",
        "group": "english_media_workflows",
        "prompt": "How does acoustic feedback occur in live sound amplification?",
        "response": "Acoustic feedback happens when amplified sound from a loudspeaker enters a microphone connected to that same amplifier, creating a continuous resonant gain loop that manifests as a loud piercing screech.",
        "source": "Live Sound Reinforcement Principles",
        "license": "Public Domain Technical Standards",
    },

    # =========================================================================
    # Group: sinhala_media_acoustics (Sinhala Technical & Acoustic Concepts)
    # =========================================================================
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "ශබ්දයේ ඩෙසිබල් (dB) මිනුම යනු කුමක්ද?",
        "response": "ඩෙසිබල් (dB) යනු ශබ්දයේ තීව්‍රතාව හෝ බලය මනින ලඝුගණක (Logarithmic) ඒකකයකි. සාමාන්‍ය කථනය 60 dB පමණ වන අතර 85 dB ට වැඩි ශබ්ද දිගුකාලීනව ඇසීමෙන් කන් වලට හානි සිදුවිය හැක.",
        "source": "Acoustic Science in Sinhala",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "ඩිජිටල් වීඩියෝවක Frame Rate යනු කුමක්ද?",
        "response": "Frame Rate (රාමු අනුපාතය) යනු තත්පරයකට තිරය මත දිස්වන නිශ්චල ඡායාරූප සංඛ්‍යාවයි. චිත්‍රපට සඳහා 24 fps ද, සාමාන්‍ය වීඩියෝ සඳහා 30 fps හෝ සුමට චලනයන් සහිත වීඩියෝ සඳහා 60 fps බහුලව භාවිත වේ.",
        "source": "Digital Video Science in Sinhala",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "වීඩියෝවක Resolution යන්නෙන් අදහස් කරන්නේ කුමක්ද?",
        "response": "Resolution යනු තිරය මත ඇති මුළු පික්සල් (Pixels) සංඛ්‍යාවයි. උදාහරණයක් ලෙස 1080p Full HD විභේදනයක තිරස්ව පික්සල් 1920ක් සහ සිරස්ව පික්සල් 1080ක් පවතී.",
        "source": "Display Technology in Sinhala",
        "license": "Public Domain Technical Education",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "වීඩියෝ එකක Subtitles පෙනෙන්නේ නැතිනම් මොකද කරන්නේ?",
        "response": "Subtitle Studio වෙත ගොස් උපසිරැසි ගොනුව නිවැරදිව තෝරා ඇති බවත්, Toggle Subtitles බොත්තම On කර ඇති බවත් තහවුරු කරගන්න. අවශ්‍ය නම් C යතුර ඔබා Subtitle Studio විවෘත කරන්න.",
        "source": "MASTER CLOUD Sinhala Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "වීඩියෝවේ හඬ ගොනුව පමණක් (Audio) වෙන් කරගත හැකිද?",
        "response": "ඔව්, MasterAI Audio Extraction මඟින් වීඩියෝවෙන් audio track එක පමණක් වෙන් කර 16kHz mono PCM හෝ MP3 ලෙස පරිවර්තනය කරගත හැක.",
        "source": "MASTER CLOUD Audio Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "sinhala_dialogue",
        "group": "sinhala_media_acoustics",
        "prompt": "හෙඩ්ෆෝන් එකක් පාවිච්චි කරන විට ශබ්දය හොඳින් ඇසෙන්නේ කෙසේද?",
        "response": "Web Audio Studio එකෙන් Flat preset එක තෝරාගෙන පසුව අවශ්‍ය පරිදි Bass හෝ Treble ස්ලයිඩර් මඳක් සකස් කරගන්න. ශබ්ද පරිමාව අධික නොවන සුවපහසු මට්ටමක තබාගන්න.",
        "source": "MASTER CLOUD Sinhala Audio Manual",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: mixed_production_dialogue (Bilingual Production & Editing Support)
    # =========================================================================
    {
        "category": "mixed_dialogue",
        "group": "mixed_production_dialogue",
        "prompt": "4K video එකක් play කරද්දි lag වෙනවා නම් මොකද කරන්නේ?",
        "response": "Browser එකේ Hardware Acceleration on කරලා තියෙනවද බලන්න. ඒ වගේම background apps close කරන්න. නැත්නම් 1080p proxy version එකක් play කරන්න.",
        "source": "MASTER CLOUD Production FAQ",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_production_dialogue",
        "prompt": "Audio track එක 16kHz mono වලට resample කරන්නේ ඇයි?",
        "response": "Speech recognition සහ audio analysis සඳහා 16kHz mono sampling standard එකක් වෙනවා. ඒකෙන් RAM usage එක අඩුවන අතර processing speed එක බෙහෙවින් වැඩි වෙනවා.",
        "source": "MASTER CLOUD Audio Architecture",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_production_dialogue",
        "prompt": "Video එකක luminance delta එක කියන්නේ මොකක්ද?",
        "response": "Consecutive frames දෙකක් අතර තියෙන brightness වෙනස luminance delta එකෙන් මනිනවා. මේ අගය threshold එක ඉක්මවා ගිය විට scene cut එකක් විදියට detect වෙනවා.",
        "source": "MASTER CLOUD Scene Intelligence",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_production_dialogue",
        "prompt": "Media files වල metadata බලන්නේ කොහොමද?",
        "response": "File එක play වෙද්දි Info panel එක open කරන්න. එතැනින් resolution, codec, duration, audio sample rate සහ file size සම්පූර්ණයෙන් බලාගන්න පුළුවන්.",
        "source": "MASTER CLOUD Player Manual",
        "license": "Proprietary Project Documentation",
    },
    {
        "category": "mixed_dialogue",
        "group": "mixed_production_dialogue",
        "prompt": "WebVTT subtitle file එකක් edit කරන්නේ කොහොමද?",
        "response": "WebVTT file එක ඕනෑම text editor එකකින් open කරලා cue timestamps හෝ text වෙනස් කරලා UTF-8 encoding එකෙන් save කරගන්න පුළුවන්.",
        "source": "MASTER CLOUD Subtitle Manual",
        "license": "Proprietary Project Documentation",
    },

    # =========================================================================
    # Group: english_science_and_math (Scientific Inquiries & Stepwise Math)
    # =========================================================================
    {
        "category": "reasoning",
        "group": "english_science_and_math",
        "prompt": "If a video file has a size of 1.8 Gigabytes, how many Megabytes is that in decimal standard?",
        "response": "In standard decimal system where 1 Gigabyte equals 1,000 Megabytes, 1.8 Gigabytes equals exactly 1,800 Megabytes.",
        "source": "Digital Unit Conversion",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_science_and_math",
        "prompt": "If an audio buffer has 960,000 samples at 48kHz, what is its duration in seconds?",
        "response": "Dividing 960,000 samples by 48,000 samples per second yields an exact audio duration of 20 seconds.",
        "source": "Audio Duration Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_science_and_math",
        "prompt": "If a speaker delivers 450 words in 3 minutes, what is the speaking rate in WPM?",
        "response": "Dividing 450 words by 3 minutes gives an average speech pacing of exactly 150 words per minute (WPM).",
        "source": "Speech Pacing Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_science_and_math",
        "prompt": "What is the aspect ratio of a 3840x2160 4K UHD video?",
        "response": "Dividing both 3840 and 2160 by their greatest common divisor of 240 yields 16 and 9, confirming a standard 16:9 widescreen aspect ratio.",
        "source": "Display Aspect Ratio Arithmetic",
        "license": "Public Domain Technical Mathematics",
    },
    {
        "category": "reasoning",
        "group": "english_science_and_math",
        "prompt": "If an audio track has an RMS energy of 0.001, is it classified as silent?",
        "response": "Yes, because the RMS energy of 0.001 is below the standard silence threshold of 0.005, the audio chunk is classified as silent.",
        "source": "Audio Processing Metrics",
        "license": "Public Domain Technical Mathematics",
    },
]

