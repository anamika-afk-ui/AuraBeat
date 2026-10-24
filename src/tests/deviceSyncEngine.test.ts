import { describe, it, expect } from 'vitest';
import { parseAudioFilename, deviceSyncEngine } from '../utils/deviceSyncEngine';

describe('Device Background Audio Sync Engine', () => {
  it('correctly parses audio filenames into clean title and artist', () => {
    const res1 = parseAudioFilename('01 - Arijit Singh - Kesariya.mp3');
    expect(res1.artist).toBe('Arijit Singh');
    expect(res1.title).toBe('Kesariya');

    const res2 = parseAudioFilename('The Weeknd – Blinding Lights [Official Audio].m4a');
    expect(res2.artist).toBe('The Weeknd');
    expect(res2.title).toBe('Blinding Lights');

    const res3 = parseAudioFilename('SimpleTrackName.wav');
    expect(res3.title).toBe('SimpleTrackName');
  });

  it('provides a reactive progress subscription', () => {
    const progress = deviceSyncEngine.getProgress();
    expect(progress).toBeDefined();
    expect(typeof progress.isSyncing).toBe('boolean');
    expect(progress.foundSongsCount).toBeGreaterThanOrEqual(0);

    let received = false;
    const unsub = deviceSyncEngine.subscribe((p) => {
      received = true;
      expect(p).toBeDefined();
    });
    expect(received).toBe(true);
    unsub();
  });
});
