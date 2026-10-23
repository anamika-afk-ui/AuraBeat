import React from 'react';
import { Song, EqualizerSettings } from '../types';
import { formatTime } from '../utils/lyricsParser';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Mic2,
  WifiOff,
} from 'lucide-react';
import { SparkProgressBar } from './SparkProgressBar';

interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
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
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleFavorite,
  onOpenLyrics,
  onOpenFullPlayer,
  accentColor = '#06b6d4',
}) => {
  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-x-hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 px-2 sm:px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl gpu-accelerated">
      {/* Top Spark Seek Progress Bar */}
      <div className="relative w-full -mt-1 mb-1.5">
        <SparkProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          isPlaying={isPlaying}
          size="sm"
          accentColor={accentColor}
        />
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full">
        {/* Left: Song Info (Cover + Title + Artist + Time) */}
        <div
          onClick={onOpenFullPlayer}
          className="flex items-center space-x-2.5 min-w-0 max-w-[42%] sm:max-w-xs shrink cursor-pointer group"
          title="Open Fullscreen Player"
        >
          <div className="relative shrink-0">
            <img
              src={currentSong.coverArt || '/logo.png'}
              alt={currentSong.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md transition-transform group-hover:scale-105 ${
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

          <div className="truncate min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
              {currentSong.artist}
            </p>
            <span className="text-[10px] font-mono text-zinc-500 block sm:hidden">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Center/Right: Clean essential playback controls (Heart, Prev, Play/Pause, Next, Lyrics) */}
        <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
          {/* Favorite Heart Button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(currentSong.id);
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer hover:bg-white/5 active:scale-90 ${
                currentSong.isFavorite
                  ? 'text-pink-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={currentSong.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  currentSong.isFavorite ? 'fill-current scale-110 text-pink-500' : ''
                }`}
              />
            </button>
          )}

          {/* Previous Song */}
          <button
            onClick={onPrevious}
            className="p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-90"
            title="Previous Song"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause Main Button */}
          <button
            onClick={onPlayPause}
            className="p-2.5 sm:p-3 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          {/* Next Song */}
          <button
            onClick={onNext}
            className="p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-90"
            title="Next Song"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Real-time Synchronized Lyrics Button */}
          <button
            onClick={onOpenLyrics}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 hover:from-cyan-500/25 hover:to-indigo-500/25 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer font-bold text-xs shadow-sm shadow-cyan-500/10 active:scale-95"
            title="Real-Time Synchronized Lyrics (लाइव लिरिक्स)"
          >
            <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lyrics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
