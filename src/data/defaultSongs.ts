import { Song } from '../types';

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'track-1',
    title: 'Neon Horizon',
    artist: 'CyberPulse',
    album: 'Retrowave Odyssey',
    duration: 172,
    url: 'https://cdn.freesound.org/previews/612/612627_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    genre: 'Synthwave',
    addedAt: Date.now() - 100000,
    lyrics: `[00:02.00] ♪ AuraBeat Synthesizer Intro ♪
[00:08.50] Gliding through the digital city lines
[00:15.20] Neon reflections in our eyes
[00:22.00] High voltage beats in three hundred percent
[00:29.10] The ultimate sound wave that heaven sent
[00:36.40] Bass vibrating deep within the chest
[00:43.00] Put the custom equalizer to the test
[00:50.10] Sync both speakers left and right
[00:57.20] We are glowing in the ultraviolet light
[01:04.50] Feel the momentum taking control
[01:11.80] Music echoing directly in the soul
[01:18.90] Across the distance we unite as one
[01:26.00] Playing the melody until the rising sun
[01:33.20] ♪ Synth Solo & Cosmic Drops ♪
[01:47.50] Fade into infinity and sound`
  },
  {
    id: 'track-2',
    title: 'Midnight Coffee & Rain',
    artist: 'Lo-Fi Chill Haven',
    album: 'Midnight Tokyo',
    duration: 148,
    url: 'https://cdn.freesound.org/previews/676/676392_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    genre: 'Lo-Fi Chill',
    addedAt: Date.now() - 80000,
    lyrics: `[00:03.00] ♪ Gentle vinyl crackle & warm piano ♪
[00:11.00] Raindrops tapping soft against the pane
[00:19.20] Washing all the daytime rush away
[00:27.50] Steaming cup of coffee in my hand
[00:35.80] Warm bass frequencies across the land
[00:44.20] Sleep timer ticking peacefully down
[00:52.40] Quiet comfort in this sleepy town
[01:00.60] Headphones on, the volume boosted high
[01:09.00] Watching tranquil stars pass across the sky
[01:17.50] Gentle melody, sweet harmony
[01:26.00] Just you, the music, and me`
  },
  {
    id: 'track-3',
    title: 'Hyper Bass Overdrive',
    artist: 'Voltage 300',
    album: 'Peak Limiters',
    duration: 195,
    url: 'https://cdn.freesound.org/previews/612/612628_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    genre: 'EDM / Club',
    addedAt: Date.now() - 60000,
    lyrics: `[00:01.50] ♪ Subwoofer Pre-Charge (300% Gain) ♪
[00:07.00] Ready for the sonic blast!
[00:12.80] 3-2-1 Hit the floor!
[00:19.00] Drop the frequency down to thirty-two
[00:26.40] This bass was built specially for you
[00:33.20] Dual devices synced in perfect time
[00:40.00] Left channel pumping, right channel sublime
[00:47.00] No clipping distortion, limiter tight
[00:54.00] We rule the audio spectrum tonight
[01:01.50] Feel the sub bass kick again!
[01:15.00] AuraBeat overdrive to the maximum!`
  },
  {
    id: 'track-4',
    title: 'Acoustic Sunset Breeze',
    artist: 'Serenity Strings',
    album: 'Golden Hour Memories',
    duration: 160,
    url: 'https://cdn.freesound.org/previews/573/573539_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    genre: 'Acoustic',
    addedAt: Date.now() - 40000,
    lyrics: `[00:02.00] ♪ Fingerstyle guitar resonance ♪
[00:09.50] Golden rays dancing on the ocean tide
[00:18.00] Peaceful feelings you no longer have to hide
[00:26.50] Crisp highs and crystal vocal warmth
[00:35.00] Flowing gently south and north
[00:43.50] Sharing this song with someone miles away
[00:52.00] Synchronized in real time without delay
[01:00.50] Every pluck and chord resonates true
[01:09.00] Underneath the sky so deep and blue`
  },
  {
    id: 'track-5',
    title: 'Galactic Aurora',
    artist: 'Starlight Dreamer',
    album: 'Deep Space Reverberation',
    duration: 210,
    url: 'https://cdn.freesound.org/previews/518/518305_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    genre: 'Ambient',
    addedAt: Date.now() - 20000,
    lyrics: `[00:04.00] ♪ Ethereal atmospheric pads ♪
[00:14.00] Floating across celestial streams
[00:25.00] Boundless spaces within our dreams
[00:37.00] Equalizer curve like planetary rings
[00:48.00] The celestial sound vibration brings
[01:00.00] Complete tranquility in every breath
[01:12.00] Transcending time, conquering stress
[01:25.00] 3D virtualizer expanding the room
[01:38.00] Chasing away the midnight gloom`
  }
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
  }
];
