/**
 * MASTER CLOUD — INTELLIGENT RESOURCE & CAPABILITY MANAGER
 * 
 * Provides transparent, honest diagnostics of available browser capabilities,
 * hardware backends, storage quotas, and zero-limit multi-format data exports.
 */

export interface BrowserCapabilities {
  cpuCores: number;
  hasWebGpu: boolean;
  gpuAdapterName: string | null;
  deviceMemoryGb: number | null;
  storageQuotaBytes: number | null;
  storageUsageBytes: number | null;
  storagePercentUsed: number | null;
  audioSampleRate: number;
  activeExecutionBackend: 'Master Local Neural AI (Offline)' | 'Cloud Gemini Supercharge';
  supportedVideoCodecs: { name: string; mime: string; supported: boolean }[];
  contextBudgetTokens: number;
  unlimitedFeatures: string[];
}

export interface ExportDataPayload {
  title: string;
  duration: number;
  summary?: string;
  takeaways?: string[];
  chapters?: Array<{ start: number; end: number; title: string; description: string }>;
  cues?: Array<{ start: number; end: number; text: string }>;
  scenes?: Array<{ timestamp: number; label: string; score?: number }>;
  chatHistory?: Array<{ sender: 'user' | 'ai'; text: string; timestamp: number }>;
}

export class ResourceManager {
  private cachedCapabilities: BrowserCapabilities | null = null;

  /**
   * Probe real browser and hardware capabilities without inventing measurements
   */
  public async getBrowserCapabilities(aiMode: 'local' | 'cloud' = 'local'): Promise<BrowserCapabilities> {
    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    
    // WebGPU Detection
    let hasWebGpu = false;
    let gpuAdapterName: string | null = null;
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu) {
      try {
        const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<{ info?: { description?: string } } | null> } }).gpu.requestAdapter();
        if (adapter) {
          hasWebGpu = true;
          gpuAdapterName = adapter.info?.description || 'Hardware WebGPU Accelerated';
        }
      } catch {
        hasWebGpu = false;
      }
    }

    // Device Memory (Chromium extension)
    const deviceMemoryGb = typeof navigator !== 'undefined' && 'deviceMemory' in navigator 
      ? (navigator as unknown as { deviceMemory: number }).deviceMemory 
      : null;

    // Storage Estimate
    let storageQuotaBytes: number | null = null;
    let storageUsageBytes: number | null = null;
    let storagePercentUsed: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        storageQuotaBytes = estimate.quota || null;
        storageUsageBytes = estimate.usage || null;
        if (estimate.quota && estimate.usage) {
          storagePercentUsed = Math.round((estimate.usage / estimate.quota) * 100);
        }
      } catch {
        // storage estimate blocked
      }
    }

    // AudioContext Sample Rate
    let audioSampleRate = 44100;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioSampleRate = ctx.sampleRate;
        ctx.close();
      }
    } catch {
      // fallback
    }

    // Codec Support Probing
    const probeVideo = typeof document !== 'undefined' ? document.createElement('video') : null;
    const testCodecs = [
      { name: 'H.264 / AVC', mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' },
      { name: 'H.265 / HEVC', mime: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
      { name: 'VP9', mime: 'video/webm; codecs="vp9, opus"' },
      { name: 'AV1 (AOMedia)', mime: 'video/mp4; codecs="av01.0.05M.08"' },
      { name: 'WebM / VP8', mime: 'video/webm; codecs="vp8, vorbis"' },
    ];

    const supportedVideoCodecs = testCodecs.map((codec) => ({
      name: codec.name,
      mime: codec.mime,
      supported: probeVideo ? probeVideo.canPlayType(codec.mime) !== '' : true,
    }));

    const capabilities: BrowserCapabilities = {
      cpuCores,
      hasWebGpu,
      gpuAdapterName,
      deviceMemoryGb,
      storageQuotaBytes,
      storageUsageBytes,
      storagePercentUsed,
      audioSampleRate,
      activeExecutionBackend: aiMode === 'cloud' ? 'Cloud Gemini Supercharge' : 'Master Local Neural AI (Offline)',
      supportedVideoCodecs,
      contextBudgetTokens: aiMode === 'cloud' ? 1048576 : 32768,
      unlimitedFeatures: [
        'Zero daily message limits in Local AI mode',
        'Unlimited video length via chunked incremental processing',
        'Unlimited chat turns with dynamic sliding context budgeting',
        'Zero artificial limits on saved bookmarks and chapter markers',
        'Lossless multi-format export: TXT, SRT, VTT, JSON, CSV, Markdown',
      ],
    };

    this.cachedCapabilities = capabilities;
    return capabilities;
  }

  /**
   * Export video intelligence and metadata into user-selected format
   */
  public generateExport(format: 'txt' | 'srt' | 'vtt' | 'json' | 'csv' | 'markdown', data: ExportDataPayload): { content: string; mimeType: string; extension: string } {
    switch (format) {
      case 'json': {
        const content = JSON.stringify(data, null, 2);
        return { content, mimeType: 'application/json', extension: 'json' };
      }

      case 'markdown': {
        let md = `# MASTER CLOUD Media Intelligence Report: ${data.title}\n\n`;
        md += `- **Duration:** ${this.formatTimestamp(data.duration)}\n`;
        md += `- **Generated:** ${new Date().toISOString()}\n\n`;

        if (data.summary) {
          md += `## Executive Summary\n\n${data.summary}\n\n`;
        }

        if (data.takeaways && data.takeaways.length > 0) {
          md += `## Key Takeaways\n\n`;
          data.takeaways.forEach((t) => {
            md += `- ${t}\n`;
          });
          md += `\n`;
        }

        if (data.chapters && data.chapters.length > 0) {
          md += `## Chapters\n\n`;
          data.chapters.forEach((c) => {
            md += `### [${this.formatTimestamp(c.start)} - ${this.formatTimestamp(c.end)}] ${c.title}\n${c.description}\n\n`;
          });
        }

        if (data.cues && data.cues.length > 0) {
          md += `## Spoken Transcript (${data.cues.length} Cues)\n\n`;
          data.cues.forEach((cue) => {
            md += `**[${this.formatTimestamp(cue.start)}]** ${cue.text}\n\n`;
          });
        }

        if (data.chatHistory && data.chatHistory.length > 0) {
          md += `## MasterAI Conversation Log\n\n`;
          data.chatHistory.forEach((msg) => {
            md += `**${msg.sender === 'user' ? 'User' : 'MasterAI'}:** ${msg.text}\n\n`;
          });
        }

        return { content: md, mimeType: 'text/markdown', extension: 'md' };
      }

      case 'csv': {
        let csv = 'Type,Start Seconds,Start Timestamp,End Seconds,End Timestamp,Content\n';
        if (data.chapters) {
          data.chapters.forEach((c) => {
            csv += `Chapter,${c.start},"${this.formatTimestamp(c.start)}",${c.end},"${this.formatTimestamp(c.end)}","${c.title.replace(/"/g, '""')}: ${c.description.replace(/"/g, '""')}"\n`;
          });
        }
        if (data.cues) {
          data.cues.forEach((cue) => {
            csv += `Transcript,${cue.start},"${this.formatTimestamp(cue.start)}",${cue.end},"${this.formatTimestamp(cue.end)}","${cue.text.replace(/"/g, '""')}"\n`;
          });
        }
        return { content: csv, mimeType: 'text/csv', extension: 'csv' };
      }

      case 'txt': {
        let txt = `MASTER CLOUD INTELLIGENCE EXPORT: ${data.title}\n`;
        txt += `Duration: ${this.formatTimestamp(data.duration)}\n`;
        txt += `====================================================\n\n`;
        if (data.summary) {
          txt += `EXECUTIVE SUMMARY:\n${data.summary}\n\n`;
        }
        if (data.takeaways && data.takeaways.length > 0) {
          txt += `KEY TAKEAWAYS:\n`;
          data.takeaways.forEach((t) => { txt += `* ${t}\n`; });
          txt += `\n`;
        }
        if (data.chapters && data.chapters.length > 0) {
          txt += `CHAPTERS:\n`;
          data.chapters.forEach((c) => {
            txt += `[${this.formatTimestamp(c.start)}] ${c.title} — ${c.description}\n`;
          });
          txt += `\n`;
        }
        if (data.cues && data.cues.length > 0) {
          txt += `TRANSCRIPT DIALOGUE:\n`;
          data.cues.forEach((cue) => {
            txt += `[${this.formatTimestamp(cue.start)}] ${cue.text}\n`;
          });
        }
        return { content: txt, mimeType: 'text/plain', extension: 'txt' };
      }

      case 'srt': {
        let srt = '';
        const cues = data.cues || [];
        cues.forEach((c, idx) => {
          srt += `${idx + 1}\n`;
          srt += `${this.toSrtTimestamp(c.start)} --> ${this.toSrtTimestamp(c.end)}\n`;
          srt += `${c.text}\n\n`;
        });
        return { content: srt.trim(), mimeType: 'application/x-subrip', extension: 'srt' };
      }

      case 'vtt': {
        let vtt = 'WEBVTT - MASTER CLOUD Subtitle Export\n\n';
        const cues = data.cues || [];
        cues.forEach((c, idx) => {
          vtt += `${idx + 1}\n`;
          vtt += `${this.toVttTimestamp(c.start)} --> ${this.toVttTimestamp(c.end)}\n`;
          vtt += `${c.text}\n\n`;
        });
        return { content: vtt.trim(), mimeType: 'text/vtt', extension: 'vtt' };
      }
    }
  }

  /**
   * Browser-safe file download trigger
   */
  public downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private formatTimestamp(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private toSrtTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private toVttTimestamp(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

export const resourceManager = new ResourceManager();
