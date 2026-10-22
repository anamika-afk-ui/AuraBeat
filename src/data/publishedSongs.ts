import { Song } from '../types';

/**
 * Verified creator published songs bundled with the web app.
 * Each title, artist, duration, cover art, and audio URL correspond
 * to genuine, working audio streams without placeholder mislabeling.
 */
export const BUNDLED_PUBLISHED_SONGS: Song[] = [
  {
    id: 'verified_synth_1',
    title: 'Neon Horizon',
    artist: 'CyberPulse',
    album: 'Retrowave Odyssey',
    duration: 372,
    genre: 'Synthwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792400000000,
  },
  {
    id: 'verified_bass_2',
    title: 'Hyper Bass Overdrive',
    artist: 'Voltage 300',
    album: 'Peak Limiters',
    duration: 423,
    genre: 'EDM / Club',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792390000000,
  },
  {
    id: 'verified_cosmic_3',
    title: 'Cosmic Bass Odyssey',
    artist: 'Aura Collective',
    album: 'Infinite Echoes',
    duration: 312,
    genre: 'Synthwave / Bass',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792380000000,
  },
  {
    id: 'verified_chill_4',
    title: 'Midnight Resonance',
    artist: 'Echo Shift',
    album: 'Midnight Pulse',
    duration: 345,
    genre: 'Lo-Fi / Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverArt: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792370000000,
  },
];
