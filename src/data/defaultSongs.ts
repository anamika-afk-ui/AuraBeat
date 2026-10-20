import { Song } from '../types';

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'local_1792434880509_wnas',
    title: 'Kitab Haryanvi',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 182,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792493437569,
  },
  {
    id: 'local_1792436226002_l5on',
    title: 'Alphuliya',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 259,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792492801391,
  },
  {
    id: 'local_1792436238277_idhk',
    title: 'Tiposi Mon',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 253,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792492761373,
  },
  {
    id: 'local_1792491453038_66e8',
    title: 'Tuk Dekhi Mur Ga (PenduJatt.Com.Se)',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 274,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792491759152,
  },
  {
    id: 'track-demo-1',
    title: 'Neon Horizon (SoundHelix 1)',
    artist: 'CyberPulse',
    album: 'Retrowave Odyssey',
    duration: 372,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    genre: 'Synthwave',
    addedAt: 1792400000000,
  },
  {
    id: 'track-demo-2',
    title: 'Hyper Bass Overdrive (SoundHelix 2)',
    artist: 'Voltage 300',
    album: 'Peak Limiters',
    duration: 423,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genre: 'EDM / Club',
    addedAt: 1792390000000,
  },
  {
    id: 'track-demo-3',
    title: 'Cosmic Bass Odyssey (SoundHelix 8)',
    artist: 'Aura Collective',
    album: 'Infinite Echoes',
    duration: 312,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    genre: 'Synthwave / Bass',
    addedAt: 1792380000000,
  },
  {
    id: 'track-demo-4',
    title: 'Midnight Resonance (SoundHelix 9)',
    artist: 'Echo Shift',
    album: 'Midnight Pulse',
    duration: 345,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverArt: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    genre: 'Lo-Fi / Chill',
    addedAt: 1792370000000,
  },
];

export const PRESET_THEMES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    isDark: true,
    primaryColor: '#06b6d4', // cyan
    accentColor: '#ec4899', // pink
    bgGradient: 'from-[#0b0c16] via-[#101328] to-[#080811]',
    cardBg: 'rgba(20, 24, 48, 0.65)',
    textColor: '#f8fafc',
    glassOpacity: 0.7,
  },
  {
    id: 'midnight_oled',
    name: 'Midnight OLED',
    isDark: true,
    primaryColor: '#38bdf8', // sky
    accentColor: '#818cf8', // indigo
    bgGradient: 'from-[#000000] via-[#050508] to-[#000000]',
    cardBg: 'rgba(12, 12, 16, 0.85)',
    textColor: '#f1f5f9',
    glassOpacity: 0.85,
  },
  {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    isDark: true,
    primaryColor: '#f59e0b', // amber
    accentColor: '#f43f5e', // rose
    bgGradient: 'from-[#140b08] via-[#21110b] to-[#0e0705]',
    cardBg: 'rgba(38, 20, 15, 0.7)',
    textColor: '#fffbeb',
    glassOpacity: 0.7,
  },
  {
    id: 'emerald_bass',
    name: 'Emerald Bass',
    isDark: true,
    primaryColor: '#10b981', // emerald
    accentColor: '#06b6d4', // cyan
    bgGradient: 'from-[#06140e] via-[#0b2118] to-[#040c09]',
    cardBg: 'rgba(12, 33, 24, 0.7)',
    textColor: '#ecfdf5',
    glassOpacity: 0.7,
  },
  {
    id: 'cosmic_violet',
    name: 'Cosmic Violet',
    isDark: true,
    primaryColor: '#a855f7', // purple
    accentColor: '#3b82f6', // blue
    bgGradient: 'from-[#130722] via-[#1f0d38] to-[#0b0414]',
    cardBg: 'rgba(32, 15, 54, 0.7)',
    textColor: '#faf5ff',
    glassOpacity: 0.7,
  },
  {
    id: 'royal_gold',
    name: 'Royal Gold',
    isDark: true,
    primaryColor: '#eab308', // gold
    accentColor: '#e11d48', // crimson
    bgGradient: 'from-[#181308] via-[#241c0c] to-[#0d0a04]',
    cardBg: 'rgba(40, 31, 14, 0.7)',
    textColor: '#fefce8',
    glassOpacity: 0.7,
  },
];
