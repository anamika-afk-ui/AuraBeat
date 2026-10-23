import { Song } from '../types';

export const DEFAULT_SONGS: Song[] = [];

export const PRESET_THEMES = [
  {
    id: 'aura_emerald_cyan',
    name: 'Aura Glow (Light Green & Blue Glass)',
    isDark: true,
    primaryColor: '#06b6d4', // glowing cyan/blue
    accentColor: '#10b981', // glowing light green
    bgGradient: 'from-[#020b0e]/90 via-[#041517]/85 to-[#020a0d]/95',
    cardBg: 'rgba(6, 26, 28, 0.45)',
    textColor: '#f0fdfa',
    glassOpacity: 0.65,
  },
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
