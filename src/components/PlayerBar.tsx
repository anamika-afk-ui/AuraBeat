import React from 'react';
import { Song, EqualizerSettings } from '../types';
import { formatTime } from '../utils/lyricsParser';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Flame,
  Sliders,
  FileText,
  Moon,
  Radio,
  Share2,
  Maximize2,
  Shuffle,
  Repeat,
  Sparkles,
  WifiOff,
  Heart,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { SparkProgressBar } from './SparkProgressBar';

interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  eqSettings: EqualizerSettings;
  sleepTimerSeconds: number | null;
  syncConnected: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite?: (songId: string) => void;
  onDownloadToDevice?: (song: Song) => void;
  onEditSong?: (song: Song) => void;
  onOpenEQ: () => void;
  onOpenLyrics: () => void;
  onOpenSleepTimer: () => void;
  onOpenSync: () => void;
  onOpenShare: () => void;
  onOpenFullPlayer: () => void;
  accentColor?: string;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  eqSettings,
  sleepTimerSeconds,
  syncConnected,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onDownloadToDevice,
  onEditSong,
  onOpenEQ,
  onOpenLyrics,
  onOpenSleepTimer,
  onOpenSync,
  onOpenShare,
  onOpenFullPlayer,
  accentColor = '#06b6d4',
}) => {
  if (!currentSong) return null;

  const boostPercent = Math.round(eqSettings.volumeBoost * 100);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-x-hidden bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-2.5 sm:px-4 py-2 shadow-2xl">
      {/* Top Spark Seek Progress Bar */}
      <div className="relative w-full -mt-1 mb-1">
        <SparkProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          isPlaying={isPlaying}
          size="sm"
          accentColor={accentColor}
        />
      </div>

      <div className="flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 w-full max-w-full">
        {/* Left: Song Info + Favorite & Download */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 max-w-[130px] sm:max-w-[200px] md:max-w-xs shrink">
          <div
            onClick={onOpenFullPlayer}
            className="relative shrink-0 cursor-pointer group"
          >
            <img
              src={currentSong.coverArt}
              alt={currentSong.title}
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl object-cover shadow-md transition-transform group-hover:scale-105 ${
                isPlaying ? 'ring-2 ring-cyan-400/50' : ''
              }`}
            />
            {currentSong.isOffline && (
              <span
                className="absolute -top-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-black shadow-md"
                title="Saved Offline"
              >
                <WifiOff className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="truncate min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h4
                onClick={onOpenFullPlayer}
                className="text-sm font-bold text-white truncate hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {currentSong.title}
              </h4>
            </div>
            <p
              onClick={onOpenFullPlayer}
              className="text-xs text-zinc-400 truncate cursor-pointer hover:text-zinc-300"
            >
              {currentSong.artist}
            </p>
          </div>

          {/* Quick Favorite Heart Button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(currentSong.id);
              }}
              className={`p-1.5 rounded-full transition-transform hover:scale-110 active:scale-90 ${
                currentSong.isFavorite
                  ? 'text-pink-500 hover:text-pink-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={currentSong.isFavorite ? 'पसंदीदा से हटाएं (Remove Favorite)' : 'पसंदीदा में जोड़ें (Add to Favorites)'}
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  currentSong.isFavorite ? 'fill-current scale-110' : ''
                }`}
              />
            </button>
          )}

          {/* Quick Edit Cover & Publish Online */}
          {onEditSong && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSong(currentSong);
              }}
              className="p-1.5 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              title="कवर बदलें और ऑनलाइन पब्लिश करें (Change Cover & Publish Online)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center: Controls & Timers */}
        <div className="flex flex-col items-center flex-1 max-w-lg">
          <div className="flex items-center space-x-3 md:space-x-5">
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevious}
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              className="p-3 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded-full transition-colors relative ${
                repeatMode !== 'none'
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-cyan-400">1</span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: 300% Boost Badge & Feature Shortcuts */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 shrink-0">
          {/* 300% Super Boost Button */}
          <button
            onClick={onOpenEQ}
            className={`flex items-center space-x-0.5 sm:space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
              boostPercent > 100
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 text-black shadow-md shadow-amber-500/20 animate-pulse'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Audio Equalizer & 300% Volume Boost"
          >
            <Flame className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${boostPercent > 100 ? 'fill-black' : 'text-amber-400'}`} />
            <span>{boostPercent}%</span>
          </button>

          {/* Karaoke Lyrics */}
          <button
            onClick={onOpenLyrics}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Synced Karaoke Lyrics"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dual Device / Party Sync */}
          <button
            onClick={onOpenSync}
            className={`p-1.5 sm:p-2 rounded-xl transition-all relative ${
              syncConnected
                ? 'text-emerald-400 bg-emerald-500/20 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Listen Together & Dual Device Sync"
          >
            <Radio className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${syncConnected ? 'animate-pulse' : ''}`} />
            {syncConnected && (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full absolute top-1 right-1" />
            )}
          </button>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`hidden sm:block p-2 rounded-xl transition-colors relative ${
              sleepTimerSeconds !== null && sleepTimerSeconds > 0
                ? 'text-indigo-400 bg-indigo-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
            {sleepTimerSeconds !== null && sleepTimerSeconds > 0 && (
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full absolute top-1.5 right-1.5 animate-ping" />
            )}
          </button>

          {/* Social Share */}
          <button
            onClick={onOpenShare}
            className="hidden sm:block p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Share Song"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Volume Control (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1.5 ml-2">
            <button onClick={onToggleMute} className="text-zinc-400 hover:text-white">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Full Player Modal */}
          <button
            onClick={onOpenFullPlayer}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            title="Open Fullscreen Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
