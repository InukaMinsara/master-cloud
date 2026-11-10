/**
 * MASTER CLOUD — ORIGINAL AUDIO INTELLIGENCE & VIDEO AUDIO EXTRACTION
 * 
 * Provides client-side local video container audio demuxing, decoding,
 * resampling to 16kHz mono PCM, and chunking with timestamp tracking.
 * 
 * 100% local, zero external network requests, zero microphone confusion.
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
  chunks: DecodedAudioChunk[];
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
   * Reads a local video File as an ArrayBuffer and decodes the embedded audio track
   * to 16kHz mono PCM using the browser's native Web Audio API.
   */
  public async extractAudioFromVideoFile(
    file: File,
    onProgress?: (progressPercent: number, status: string) => void,
  ): Promise<AudioExtractionResult> {
    if (onProgress) onProgress(10, 'Reading video file bytes…');

    const fileBuffer = await file.arrayBuffer();

    if (onProgress) onProgress(30, 'Demuxing container & decoding audio track…');

    // Create an AudioContext to decode native AAC/MP3/Opus/Vorbis/PCM from video container
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
      throw new Error(`Unable to decode audio track from "${file.name}". The container may lack an audio stream or use an unsupported codec.`);
    } finally {
      await tempCtx.close().catch(() => {});
    }

    if (onProgress) onProgress(60, 'Resampling to 16kHz mono PCM…');

    const targetSampleRate = 16000;
    const targetLength = Math.ceil(originalBuffer.duration * targetSampleRate);

    // Resample to 16kHz Mono using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    // Downmix channels to mono if multichannel
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
      const endTime = startTime + (chunkPcm.length / targetSampleRate);

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
        isSilent: rms < 0.005, // Silence threshold
      });
    }

    if (onProgress) onProgress(100, 'Audio extraction complete!');

    return {
      fileName: file.name,
      duration: originalBuffer.duration,
      sampleRate: targetSampleRate,
      channels: 1,
      totalSamples: monoPcm.length,
      chunks,
    };
  }
}

export const videoAudioExtractor = VideoAudioExtractionService.getInstance();
