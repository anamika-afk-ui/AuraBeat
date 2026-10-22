import { describe, it, expect } from 'vitest';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../utils/audioEngine';

describe('audioEngine DSP constants and presets', () => {
  it('defines 10 distinct standard EQ frequency bands', () => {
    expect(EQ_FREQUENCIES).toHaveLength(10);
    expect(EQ_FREQUENCIES[0]).toBe(32);
    expect(EQ_FREQUENCIES[9]).toBe(16000);
    // Ensure frequencies strictly increase
    for (let i = 1; i < EQ_FREQUENCIES.length; i++) {
      expect(EQ_FREQUENCIES[i]).toBeGreaterThan(EQ_FREQUENCIES[i - 1]);
    }
  });

  it('provides studio-tested EQ presets each with 10 frequency band values', () => {
    expect(EQ_PRESETS.length).toBeGreaterThanOrEqual(8);
    EQ_PRESETS.forEach((preset) => {
      expect(preset.bands).toHaveLength(10);
      expect(preset.name).toBeDefined();
      expect(preset.bass).toBeGreaterThanOrEqual(0);
      expect(preset.bass).toBeLessThanOrEqual(100);
      expect(preset.virt).toBeGreaterThanOrEqual(0);
      expect(preset.virt).toBeLessThanOrEqual(100);
    });
  });

  it('exposes audioEngine singleton with isSupported helper', () => {
    expect(audioEngine).toBeDefined();
    expect(typeof audioEngine.isSupported).toBe('function');
    expect(typeof audioEngine.applySettings).toBe('function');
    expect(typeof audioEngine.ensureRunning).toBe('function');
  });
});
