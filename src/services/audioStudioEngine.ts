/**
 * MASTER CLOUD - Audio Studio Web Audio API Engine
 * 10-Band Equalizer, Bass & Treble tone controls, Stereo Balance,
 * Audio Delay, and Preset Management.
 */

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export interface AudioPresets {
  [key: string]: {
    name: string;
    description: string;
    gains: number[]; // 10 values, -12dB to +12dB
    bass?: number;
    treble?: number;
  };
}

export const AUDIO_PRESETS: AudioPresets = {
  flat: {
    name: 'Flat (Default)',
    description: 'Neutral, transparent frequency response',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: 0,
    treble: 0,
  },
  'bass-boost': {
    name: 'Bass Boost',
    description: 'Deep, punchy low-end enhancement for cinema and electronic tracks',
    gains: [6, 5, 4, 2, 0, 0, 0, 1, 2, 3],
    bass: 4,
    treble: 0,
  },
  vocal: {
    name: 'Vocal Enhancer',
    description: 'Boosts dialogue and speech intelligibility, reduces rumble',
    gains: [-3, -2, 0, 2, 4, 5, 4, 2, 0, -1],
    bass: -2,
    treble: 2,
  },
  cinema: {
    name: 'Cinema / Movie',
    description: 'Dynamic cinema profile with sub-bass depth and crisp dialogue presence',
    gains: [5, 4, 2, 0, 2, 3, 4, 3, 2, 4],
    bass: 3,
    treble: 2,
  },
  pop: {
    name: 'Pop',
    description: 'Clear vocals with rounded low end and vibrant high frequencies',
    gains: [-1, 1, 3, 4, 3, 0, -1, 1, 3, 4],
    bass: 1,
    treble: 3,
  },
  rock: {
    name: 'Rock',
    description: 'Punchy bass, scooped midrange, and sharp electric guitars',
    gains: [5, 4, 2, -1, -2, 0, 2, 4, 5, 5],
    bass: 3,
    treble: 3,
  },
  classical: {
    name: 'Classical',
    description: 'Natural acoustic concert hall balance with delicate high end',
    gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
    bass: 2,
    treble: 2,
  },
  electronic: {
    name: 'Electronic / Dance',
    description: 'Elevated sub-bass and bright hi-hat sizzle',
    gains: [6, 5, 2, 0, -2, 1, 2, 3, 5, 6],
    bass: 5,
    treble: 4,
  },
};

class AudioStudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceMap = new WeakMap<HTMLVideoElement, MediaElementAudioSourceNode>();
  private currentVideo: HTMLVideoElement | null = null;

  // Nodes
  private delayNode: DelayNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;
  private gainNode: GainNode | null = null;

  private isConnected = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Connects the Web Audio API processing graph to a video element
   */
  attachVideo(video: HTMLVideoElement): boolean {
    if (!video || typeof window === 'undefined') return false;
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    if (this.currentVideo === video && this.isConnected) {
      return true;
    }

    try {
      this.currentVideo = video;

      // 1. Get or create MediaElementAudioSourceNode (can only be created once per element)
      let sourceNode = this.sourceMap.get(video);
      if (!sourceNode) {
        sourceNode = ctx.createMediaElementSource(video);
        this.sourceMap.set(video, sourceNode);
      } else {
        try {
          sourceNode.disconnect();
        } catch {
          // ignore
        }
      }

      // 2. Delay Node (for audio/video sync adjustment)
      this.delayNode = ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0;

      // 3. 10-band Equalizer filters (peaking filters)
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4; // standard 1-octave bandwidth Q
        filter.gain.value = 0;
        return filter;
      });

      // 4. Dedicated Bass tone control (lowshelf at 100Hz)
      this.bassFilter = ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 100;
      this.bassFilter.gain.value = 0;

      // 5. Dedicated Treble tone control (highshelf at 10kHz)
      this.trebleFilter = ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;
      this.trebleFilter.gain.value = 0;

      // 6. Stereo Panner Node (where supported)
      if (ctx.createStereoPanner) {
        this.stereoPanner = ctx.createStereoPanner();
        this.stereoPanner.pan.value = 0;
      } else {
        this.stereoPanner = null;
      }

      // 7. Master Safe Gain Node (prevents clipping)
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // ── Assemble audio graph ───────────────────────────────────────────
      // source -> delay -> eq[0] -> ... -> eq[9] -> bass -> treble -> pan -> gain -> destination
      let lastNode: AudioNode = sourceNode;

      lastNode.connect(this.delayNode);
      lastNode = this.delayNode;

      for (const eqNode of this.eqFilters) {
        lastNode.connect(eqNode);
        lastNode = eqNode;
      }

      lastNode.connect(this.bassFilter);
      lastNode = this.bassFilter;

      lastNode.connect(this.trebleFilter);
      lastNode = this.trebleFilter;

      if (this.stereoPanner) {
        lastNode.connect(this.stereoPanner);
        lastNode = this.stereoPanner;
      }

      lastNode.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      this.isConnected = true;
      return true;
    } catch (err) {
      console.warn('AudioStudio: Web Audio graph connection failed (falling back to direct output):', err);
      this.isConnected = false;
      return false;
    }
  }

  setBandGain(bandIndex: number, gainDb: number) {
    if (this.eqFilters[bandIndex]) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[bandIndex].gain.value = clamped;
    }
  }

  setAllBands(gains: number[]) {
    gains.forEach((gain, i) => {
      this.setBandGain(i, gain);
    });
  }

  setBass(gainDb: number) {
    if (this.bassFilter) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.bassFilter.gain.value = clamped;
    }
  }

  setTreble(gainDb: number) {
    if (this.trebleFilter) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.trebleFilter.gain.value = clamped;
    }
  }

  setPan(pan: number) {
    if (this.stereoPanner) {
      const clamped = Math.max(-1, Math.min(1, pan));
      this.stereoPanner.pan.value = clamped;
    }
  }

  setAudioDelay(delaySeconds: number) {
    if (this.delayNode) {
      const clamped = Math.max(0, Math.min(1.0, delaySeconds));
      this.delayNode.delayTime.value = clamped;
    }
  }

  applyPreset(presetKey: string): boolean {
    const preset = AUDIO_PRESETS[presetKey];
    if (!preset) return false;

    this.setAllBands(preset.gains);
    if (preset.bass !== undefined) this.setBass(preset.bass);
    if (preset.treble !== undefined) this.setTreble(preset.treble);
    return true;
  }

  reset() {
    this.applyPreset('flat');
    this.setPan(0);
    this.setAudioDelay(0);
  }

  cleanup() {
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
    }
    this.isConnected = false;
    this.currentVideo = null;
  }
}

export const audioStudioEngine = new AudioStudioEngine();
