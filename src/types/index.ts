export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  url: string; // http url or blob url
  coverArt: string;
  lyrics?: string; // LRC formatted or plain text
  genre?: string;
  isOffline?: boolean; // cached in IndexedDB
  isCustomUpload?: boolean;
  isCloudShared?: boolean;
  isFavorite?: boolean; // Marked as favorite / liked
  addedAt: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverArt?: string;
  songIds: string[];
  createdAt: number;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  bands: number[]; // 10 bands in dB (-12 to +12)
  bassBoost: number; // 0 to 100%
  virtualizer: number; // 0 to 100%
}

export interface EqualizerSettings {
  enabled: boolean;
  preset: string;
  bands: number[]; // 10 frequency bands: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
  bassBoost: number; // 0 to 100%
  virtualizer: number; // 0 to 100%
  volumeBoost: number; // 1.0 (100%) to 3.0 (300% super boost!)
  limiterEnabled: boolean; // dynamic compressor anti-clipping
  stereoBalance: number; // -1 (full Left), 0 (Center), 1 (full Right)
  stereoChannelMode: 'both' | 'left' | 'right';
}

export interface ThemeConfig {
  id: string;
  name: string;
  isDark: boolean;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
  glassOpacity: number;
}

export interface LyricsLine {
  timeSec: number;
  text: string;
}

export interface SyncMember {
  id: string;
  name: string;
  isHost: boolean;
  hasControl?: boolean; // DJ / playback control permission granted by host
  stereoChannel: 'both' | 'left' | 'right';
  joinedAt?: number;
}

export interface SyncRoomState {
  code: string;
  connected: boolean;
  isHost: boolean;
  hasControl: boolean;
  hostId: string;
  currentSongId: string | null;
  isPlaying: boolean;
  positionSec: number;
  updatedAt: number;
  members: SyncMember[];
  stereoMode: 'both' | 'left' | 'right';
  latencyMs: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  totalMinutesListened: number;
  songsPlayedCount: number;
  favoriteGenre: string;
  isLoggedIn: boolean;
  joinedAt?: number;
}

export const ADMIN_EMAILS: readonly string[] = [
  'itsmejkr66@gmail.com',
  'jk74898713@gmail.com',
];

export const isUserAdmin = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
