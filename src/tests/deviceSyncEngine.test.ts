import { describe, it, expect } from 'vitest';
import { parseAudioFilename, deviceSyncEngine, isSongDuplicate } from '../utils/deviceSyncEngine';

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

  it('strictly prevents duplicate songs with identical name, artist, or album', () => {
    const existingSongs = [
      {
        id: 's1',
        title: 'Kesariya',
        artist: 'Arijit Singh',
        album: 'Brahmastra',
        duration: 240,
        url: 'blob:url1',
        genre: 'Bollywood',
      },
      {
        id: 's2',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 200,
        url: 'blob:url2',
        genre: 'Pop',
      },
    ];

    // Same title, artist, album -> Duplicate
    expect(
      isSongDuplicate(existingSongs as any, {
        title: 'Kesariya',
        artist: 'Arijit Singh',
        album: 'Brahmastra',
      })
    ).toBe(true);

    // Same title and artist with minor punctuation or casing -> Duplicate
    expect(
      isSongDuplicate(existingSongs as any, {
        title: '01 - Kesariya.mp3',
        artist: 'Arijit Singh',
        album: 'Different Album',
      })
    ).toBe(true);

    // Exact same song name (title) -> Duplicate per user requirement
    expect(
      isSongDuplicate(existingSongs as any, {
        title: 'Blinding Lights',
        artist: 'Device Music',
        album: 'Downloads',
      })
    ).toBe(true);

    // Different song -> NOT Duplicate
    expect(
      isSongDuplicate(existingSongs as any, {
        title: 'Starboy',
        artist: 'The Weeknd',
        album: 'Starboy',
      })
    ).toBe(false);
  });
});
