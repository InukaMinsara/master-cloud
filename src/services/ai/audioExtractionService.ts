/**
 * MASTER CLOUD — ORIGINAL AUDIO INTELLIGENCE & VIDEO AUDIO EXTRACTION (v0.3)
 * 
 * Provides genuine container format inspection, validation, client-side
 * audio demuxing, resampling to 16kHz mono PCM, and timestamped chunking.
 * 
 * 100% local, zero external network requests, zero microphone confusion.
 * Original ASR Architecture Status: RESEARCH / NOT YET TRAINED (zero third-party weights).
 */

export interface DecodedAudioChunk {
  chunkIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  sampleRate: number;
  pcmData: Float32Array;
  rmsEnergy: number;
  isSilent: boolean;
}

export interface AudioExtractionResult {
  fileName: string;
  duration: number;
  sampleRate: number;
  channels: number;
  totalSamples: number;
  formatInfo: ContainerFormatInfo;
  chunks: DecodedAudioChunk[];
}

export interface ContainerFormatInfo {
  format: 'mp4' | 'webm' | 'mkv' | 'ogg' | 'wav' | 'mp3' | 'avi' | 'unknown';
  isSupportedByBrowser: boolean;
  mimeTypeHint: string;
  codecDescription: string;
  errorMessage?: string;
}

/**
 * Inspects raw container header bytes to identify the container signature
 * and verify whether the browser media pipeline natively supports demuxing it.
 */
export function detectContainerFormat(headerBuffer: ArrayBuffer, fileName: string): ContainerFormatInfo {
  const bytes = new Uint8Array(headerBuffer);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. ISO BMFF (MP4, M4A, MOV)
  if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return {
      format: 'mp4',
      isSupportedByBrowser: true,
      mimeTypeHint: 'video/mp4',
      codecDescription: 'ISO BMFF (MP4 / M4A / MOV container with embedded audio stream)',
    };
  }

  // 2. EBML (WebM / Matroska)
  if (bytes.length >= 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
    const headerStr = String.fromCharCode(...bytes.slice(0, Math.min(bytes.length, 1024)));
    if (headerStr.includes('webm') || ext === 'webm') {
      return {
        format: 'webm',
        isSupportedByBrowser: true,
        mimeTypeHint: 'video/webm',
        codecDescription: 'WebM container (Opus / Vorbis audio stream)',
      };
    }
    return {
      format: 'mkv',
      isSupportedByBrowser: false,
      mimeTypeHint: 'video/x-matroska',
      codecDescription: 'Matroska MKV container (Typically contains AC-3, DTS, or un-demuxable streams)',
      errorMessage: `Matroska (.mkv) video containers cannot be natively demuxed by the browser's Web Audio API. Please re-wrap or export your video to MP4 (H.264/AAC) or WebM (VP9/Opus).`,
    };
  }

  // 3. RIFF (WAV or AVI)
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    if (bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
      return {
        format: 'wav',
        isSupportedByBrowser: true,
        mimeTypeHint: 'audio/wav',
        codecDescription: 'WAV Linear PCM audio container',
      };
    }
    if (bytes[8] === 0x41 && bytes[9] === 0x56 && bytes[10] === 0x41 && bytes[11] === 0x20) {
      return {
        format: 'avi',
        isSupportedByBrowser: false,
        mimeTypeHint: 'video/x-msvideo',
        codecDescription: 'Legacy AVI container',
        errorMessage: `Legacy Audio Video Interleave (.avi) containers are unsupported by browser media decoders. Please convert to MP4 or WebM.`,
      };
    }
  }

  // 4. Ogg Container
  if (bytes.length >= 4 && bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return {
      format: 'ogg',
      isSupportedByBrowser: true,
      mimeTypeHint: 'audio/ogg',
      codecDescription: 'Ogg Vorbis/Opus audio container',
    };
  }

  // 5. MP3 (ID3v2 or MPEG Frame Sync)
  if (
    (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes.length >= 2 && bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0)
  ) {
    return {
      format: 'mp3',
      isSupportedByBrowser: true,
      mimeTypeHint: 'audio/mpeg',
      codecDescription: 'MPEG-1/2 Audio Layer III (MP3)',
    };
  }

  // Fallback extension heuristics
  if (ext === 'mp4' || ext === 'm4v' || ext === 'mov') {
    return { format: 'mp4', isSupportedByBrowser: true, mimeTypeHint: 'video/mp4', codecDescription: 'MP4 Video' };
  }
  if (ext === 'webm') {
    return { format: 'webm', isSupportedByBrowser: true, mimeTypeHint: 'video/webm', codecDescription: 'WebM Video' };
  }
  if (ext === 'mkv') {
    return {
      format: 'mkv',
      isSupportedByBrowser: false,
      mimeTypeHint: 'video/x-matroska',
      codecDescription: 'Matroska MKV',
      errorMessage: `Matroska (.mkv) video containers cannot be natively demuxed by browser Web Audio API. Please re-wrap to MP4 or WebM.`,
    };
  }

  return {
    format: 'unknown',
    isSupportedByBrowser: true,
    mimeTypeHint: 'application/octet-stream',
    codecDescription: 'General Media Container',
  };
}

export class VideoAudioExtractionService {
  private static instance: VideoAudioExtractionService;

  public static getInstance(): VideoAudioExtractionService {
    if (!VideoAudioExtractionService.instance) {
      VideoAudioExtractionService.instance = new VideoAudioExtractionService();
    }
    return VideoAudioExtractionService.instance;
  }

  /**
   * Inspects container headers and extracts/resamples the embedded audio track
   * to 16kHz mono PCM using the browser's native Web Audio API.
   */
  public async extractAudioFromVideoFile(
    file: File,
    onProgress?: (progressPercent: number, status: string) => void,
  ): Promise<AudioExtractionResult> {
    if (onProgress) onProgress(5, 'Inspecting container signature…');

    // 1. Genuine Container Demuxing & Validation Stage (Header slice to avoid loading multi-gigabyte files)
    const headerSlice = await file.slice(0, 65536).arrayBuffer();
    const formatInfo = detectContainerFormat(headerSlice, file.name);

    if (!formatInfo.isSupportedByBrowser) {
      throw new Error(formatInfo.errorMessage || `Unsupported video container format for client-side audio extraction.`);
    }

    if (onProgress) onProgress(15, `Reading ${formatInfo.codecDescription}…`);
    const fileBuffer = await file.arrayBuffer();

    if (onProgress) onProgress(35, 'Demuxing audio track & decoding samples…');

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    const tempCtx = new AudioCtx();
    let originalBuffer: AudioBuffer;
    try {
      originalBuffer = await tempCtx.decodeAudioData(fileBuffer);
    } catch {
      await tempCtx.close();
      throw new Error(
        `Unable to decode audio track from "${file.name}". The container may lack an audio stream or use an unsupported audio codec (e.g., AC-3, DTS).`
      );
    } finally {
      await tempCtx.close().catch(() => {});
    }

    if (onProgress) onProgress(65, 'Resampling to 16kHz mono PCM…');

    const targetSampleRate = 16000;
    const targetLength = Math.ceil(originalBuffer.duration * targetSampleRate);

    // Resample to 16kHz Mono using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    // Downmix channels to mono
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampledBuffer = await offlineCtx.startRendering();
    const monoPcm = resampledBuffer.getChannelData(0);

    if (onProgress) onProgress(85, 'Chunking audio into 30s timestamped windows…');

    const chunkSizeSeconds = 30;
    const samplesPerChunk = chunkSizeSeconds * targetSampleRate;
    const totalChunks = Math.ceil(monoPcm.length / samplesPerChunk);
    const chunks: DecodedAudioChunk[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const startSample = i * samplesPerChunk;
      const endSample = Math.min(monoPcm.length, (i + 1) * samplesPerChunk);
      const chunkPcm = monoPcm.slice(startSample, endSample);

      const startTime = i * chunkSizeSeconds;
      const endTime = startTime + chunkPcm.length / targetSampleRate;

      // Compute RMS Energy
      let sumSquares = 0;
      for (let j = 0; j < chunkPcm.length; j++) {
        sumSquares += chunkPcm[j] * chunkPcm[j];
      }
      const rms = Math.sqrt(sumSquares / Math.max(1, chunkPcm.length));

      chunks.push({
        chunkIndex: i + 1,
        startTime,
        endTime,
        duration: endTime - startTime,
        sampleRate: targetSampleRate,
        pcmData: chunkPcm,
        rmsEnergy: Math.round(rms * 1000) / 1000,
        isSilent: rms < 0.005,
      });
    }

    if (onProgress) onProgress(100, 'Audio extraction complete!');

    return {
      fileName: file.name,
      duration: originalBuffer.duration,
      sampleRate: targetSampleRate,
      channels: 1,
      totalSamples: monoPcm.length,
      formatInfo,
      chunks,
    };
  }
}

export const videoAudioExtractor = VideoAudioExtractionService.getInstance();
