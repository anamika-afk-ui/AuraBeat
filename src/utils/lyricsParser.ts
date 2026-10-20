import { LyricsLine } from '../types';

export function parseLRC(lrcText: string): LyricsLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split('\n');
  const result: LyricsLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    let match;
    timeRegex.lastIndex = 0;
    const timestamps: number[] = [];

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSec = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push(totalSec);
    }

    const cleanText = trimmed.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
    if (timestamps.length > 0 && cleanText) {
      for (const time of timestamps) {
        result.push({ timeSec: time, text: cleanText });
      }
    } else if (timestamps.length === 0 && cleanText) {
      // plain text fallback line
      result.push({ timeSec: 0, text: cleanText });
    }
  }

  // Sort by timestamp
  return result.sort((a, b) => a.timeSec - b.timeSec);
}

export function findCurrentLyricsIndex(lyrics: LyricsLine[], currentTime: number): number {
  if (!lyrics.length) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].timeSec) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function requestAutoLyrics(title: string, artist: string, duration: number): Promise<string> {
  try {
    const res = await fetch('/api/lyrics/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, duration }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.lyrics || '';
    }
  } catch (e) {
    console.warn('Backend lyrics generation failed, using procedural fallback:', e);
  }

  // Client-side auto generator fallback
  const total = Math.max(30, Math.round(duration || 180));
  const lines = [
    `♪ ${title} ♪`,
    'Feel the bass vibrating through the air',
    '300 percent energy everywhere',
    'Sonic waves running through the night',
    'Equalizer peaks with neon light',
    'Synced in harmony across the globe',
    'Lost inside the music groove',
    'Feel the stereo channel surround',
    'Pure acoustic and electric sound',
    'The night is young, the beat goes on',
    'AuraBeat rhythm until the dawn',
    '♪ Outro - Melodic fade ♪'
  ];

  let lrc = `[00:01.00] ♪ ${title} - ${artist} ♪\n`;
  const interval = total / (lines.length + 1);
  lines.forEach((line, idx) => {
    const timeSec = (idx + 1) * interval;
    const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
    const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
    lrc += `[${mm}:${ss}.00] ${line}\n`;
  });
  return lrc;
}
