import { describe, it, expect } from 'vitest';
import { parseLRC, findCurrentLyricsIndex, formatTime } from '../utils/lyricsParser';

describe('lyricsParser utility', () => {
  it('correctly parses standard synchronized LRC lyrics', () => {
    const lrc = `
[00:04.50] First line of the song
[00:10.20] Second line follows
[01:15.00] Chorus kicks in with high bass
    `.trim();

    const parsed = parseLRC(lrc);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].timeSec).toBeCloseTo(4.5, 1);
    expect(parsed[0].text).toBe('First line of the song');
    expect(parsed[1].timeSec).toBeCloseTo(10.2, 1);
    expect(parsed[2].timeSec).toBeCloseTo(75.0, 1);
  });

  it('handles empty or malformed input safely without crashing', () => {
    expect(parseLRC('')).toEqual([]);
    expect(parseLRC('Just plain text without timestamps')).toHaveLength(1);
    expect(parseLRC('Just plain text without timestamps')[0].timeSec).toBe(0);
  });

  it('finds active lyric line based on current playback timestamp', () => {
    const lyrics = [
      { timeSec: 0, text: 'Intro' },
      { timeSec: 10, text: 'Verse 1' },
      { timeSec: 25, text: 'Chorus' },
    ];

    expect(findCurrentLyricsIndex(lyrics, 0)).toBe(0);
    expect(findCurrentLyricsIndex(lyrics, 5)).toBe(0);
    expect(findCurrentLyricsIndex(lyrics, 10)).toBe(1);
    expect(findCurrentLyricsIndex(lyrics, 18)).toBe(1);
    expect(findCurrentLyricsIndex(lyrics, 25)).toBe(2);
    expect(findCurrentLyricsIndex(lyrics, 99)).toBe(2);
  });

  it('formats seconds into clean mm:ss string', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
