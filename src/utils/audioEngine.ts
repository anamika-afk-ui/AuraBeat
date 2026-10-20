/**
 * AuraBeat Web Audio API Engine
 * Handles 300% Volume Boost, 10-band Equalizer, Bass Boost,
 * Dynamic Limiter/Compressor, Stereo Channel routing (L/R/Stereo) and Real-time Analyser.
 */

import { EqualizerSettings } from '../types';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: { id: string; name: string; bands: number[]; bass: number; virt: number }[] = [
  { id: 'flat', name: 'Flat / Studio', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, virt: 0 },
  { id: 'bass_heavy', name: 'Mega Bass 300%', bands: [8, 7, 5, 2, 0, 0, 1, 2, 3, 3], bass: 85, virt: 40 },
  { id: 'rock', name: 'Rock & Metal', bands: [5, 4, 3, 1, -1, -1, 2, 4, 5, 5], bass: 45, virt: 30 },
  { id: 'pop', name: 'Pop & Crisp', bands: [-1, 1, 3, 4, 3, 1, -1, 2, 4, 5], bass: 35, virt: 50 },
  { id: 'edm', name: 'EDM & Club', bands: [7, 6, 4, 1, 0, 1, 3, 5, 6, 6], bass: 75, virt: 60 },
  { id: 'vocal', name: 'Vocal Clarity', bands: [-3, -2, -1, 2, 4, 5, 4, 2, 1, 0], bass: 10, virt: 20 },
  { id: 'jazz', name: 'Acoustic / Jazz', bands: [3, 2, 1, 2, -1, -1, 1, 3, 3, 2], bass: 25, virt: 35 },
  { id: 'cinematic', name: '3D Spatial Cinema', bands: [4, 3, 2, 0, -2, 0, 3, 5, 6, 7], bass: 50, virt: 90 },
];

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private virtualizerFilter: BiquadFilterNode | null = null;
  private boostGainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private stereoPannerNode: StereoPannerNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;

  public init(audioEl: HTMLAudioElement) {
    if (this.isInitialized && this.audioElement === audioEl) return;
    this.audioElement = audioEl;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    try {
      this.audioCtx = new AudioContextClass();
      this.sourceNode = this.audioCtx.createMediaElementSource(audioEl);

      // 1. Create 10-band EQ filters
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // 2. Dedicated Bass Boost filter (lowshelf at 85Hz)
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 85;
      this.bassFilter.gain.value = 0;

      // 3. Virtualizer spatial high-shelf / air filter
      this.virtualizerFilter = this.audioCtx.createBiquadFilter();
      this.virtualizerFilter.type = 'highshelf';
      this.virtualizerFilter.frequency.value = 7500;
      this.virtualizerFilter.gain.value = 0;

      // 4. Boost Gain Node (handles 100% to 300% volume boost)
      this.boostGainNode = this.audioCtx.createGain();
      this.boostGainNode.gain.value = 1.0;

      // 5. Dynamic compressor / brickwall limiter to protect against distortion at 300%
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -16;
      this.compressorNode.knee.value = 30;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      // 6. Stereo Panner
      if (this.audioCtx.createStereoPanner) {
        this.stereoPannerNode = this.audioCtx.createStereoPanner();
        this.stereoPannerNode.pan.value = 0;
      }

      // 7. Analyser for real-time visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect node chain:
      // Source -> Bass -> EQ[0..9] -> Virtualizer -> BoostGain -> Compressor -> StereoPanner -> Analyser -> Destination
      let lastNode: AudioNode = this.sourceNode;

      lastNode.connect(this.bassFilter);
      lastNode = this.bassFilter;

      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.virtualizerFilter);
      lastNode = this.virtualizerFilter;

      lastNode.connect(this.boostGainNode);
      lastNode = this.boostGainNode;

      lastNode.connect(this.compressorNode);
      lastNode = this.compressorNode;

      if (this.stereoPannerNode) {
        lastNode.connect(this.stereoPannerNode);
        lastNode = this.stereoPannerNode;
      }

      lastNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.error('AudioEngine initialization error:', e);
    }
  }

  public ensureRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public applySettings(settings: EqualizerSettings) {
    if (!this.audioCtx) return;
    this.ensureRunning();

    // 1. Equalizer Bands
    if (this.eqFilters.length === settings.bands.length) {
      this.eqFilters.forEach((filter, index) => {
        const gainValue = settings.enabled ? settings.bands[index] : 0;
        filter.gain.setTargetAtTime(gainValue, this.audioCtx!.currentTime, 0.05);
      });
    }

    // 2. Bass Boost (0 - 100% -> 0 to 18 dB gain)
    if (this.bassFilter) {
      const bassGain = settings.enabled ? (settings.bassBoost / 100) * 18 : 0;
      this.bassFilter.gain.setTargetAtTime(bassGain, this.audioCtx.currentTime, 0.05);
    }

    // 3. Virtualizer (0 - 100% -> 0 to 10 dB high shelf)
    if (this.virtualizerFilter) {
      const virtGain = settings.enabled ? (settings.virtualizer / 100) * 10 : 0;
      this.virtualizerFilter.gain.setTargetAtTime(virtGain, this.audioCtx.currentTime, 0.05);
    }

    // 4. Super Volume Boost (1.0 to 3.0 => 100% to 300%)
    if (this.boostGainNode) {
      const boost = Math.max(1.0, Math.min(3.0, settings.volumeBoost));
      this.boostGainNode.gain.setTargetAtTime(boost, this.audioCtx.currentTime, 0.05);
    }

    // 5. Limiter / Compressor toggle
    if (this.compressorNode) {
      if (settings.limiterEnabled || settings.volumeBoost > 1.2) {
        this.compressorNode.threshold.setTargetAtTime(-18, this.audioCtx.currentTime, 0.05);
        this.compressorNode.ratio.setTargetAtTime(14, this.audioCtx.currentTime, 0.05);
      } else {
        this.compressorNode.threshold.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
        this.compressorNode.ratio.setTargetAtTime(1, this.audioCtx.currentTime, 0.05);
      }
    }

    // 6. Stereo Channel routing & balance
    if (this.stereoPannerNode) {
      let pan = settings.stereoBalance;
      if (settings.stereoChannelMode === 'left') {
        pan = -1; // hard left
      } else if (settings.stereoChannelMode === 'right') {
        pan = 1; // hard right
      }
      this.stereoPannerNode.pan.setTargetAtTime(pan, this.audioCtx.currentTime, 0.05);
    }
  }

  public getVisualizerData(freqArray: any, timeArray: any) {
    if (!this.analyserNode) return;
    this.analyserNode.getByteFrequencyData(freqArray);
    this.analyserNode.getByteTimeDomainData(timeArray);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }
}

export const audioEngine = new AudioEngine();
