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
import { SparkProgressBar, getSongColorPalette } from './SparkProgressBar';

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

  const palette = getSongColorPalette(currentSong.id, currentSong.title);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-x-hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 px-2 sm:px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl gpu-accelerated relative">
      {/* Dynamic Ambient Rhythmic Glow Edge (ONLY visible when music plays) */}
      {isPlaying && (
        <div
          className="absolute -top-[1.5px] left-0 right-0 h-[2.5px] opacity-90 blur-[1px] animate-pulse pointer-events-none transition-all duration-500"
          style={{ background: palette.trackGradient }}
        />
      )}

      {/* Top Spark Seek Progress Bar */}
      <div className="relative w-full -mt-1 mb-1.5">
        <SparkProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          isPlaying={isPlaying}
          size="sm"
          accentColor={accentColor}
          songId={currentSong.id}
          songTitle={currentSong.title}
        />
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full">
        {/* Left: Song Info (Cover + Title + Artist + Time) */}
        <div
          onClick={onOpenFullPlayer}
          className="flex items-center space-x-2.5 min-w-0 max-w-[44%] sm:max-w-xs shrink cursor-pointer group"
          title="Open Fullscreen Player"
        >
          <div className="relative shrink-0">
            <img
              src={currentSong.coverArt || '/logo.png'}
              alt={currentSong.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md transition-all duration-500 ${
                isPlaying ? 'scale-105' : ''
              }`}
              style={
                isPlaying
                  ? {
                      boxShadow: palette.dotShadow,
                      border: `2px solid ${palette.dotBorder}`,
                    }
                  : undefined
              }
            />

            {/* Dynamic Dancing Soundwave Bars Overlay on Thumbnail (ONLY when playing) */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                <div className="flex items-end justify-center space-x-0.5 h-4">
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '70%',
                      backgroundColor: palette.sparkColors[0] || '#38bdf8',
                      animationDuration: '0.5s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '100%',
                      backgroundColor: palette.sparkColors[1] || '#34d399',
                      animationDuration: '0.4s',
                      animationDelay: '0.12s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '55%',
                      backgroundColor: palette.sparkColors[2] || '#f472b6',
                      animationDuration: '0.65s',
                      animationDelay: '0.25s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '85%',
                      backgroundColor: palette.sparkColors[0] || '#38bdf8',
                      animationDuration: '0.45s',
                      animationDelay: '0.08s',
                    }}
                  />
                </div>
              </div>
            )}

            {currentSong.isOffline && (
              <span
                className="absolute -top-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-black shadow-md z-10"
                title="Saved Offline"
              >
                <WifiOff className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="truncate min-w-0">
            <div className="flex items-center space-x-1.5 truncate">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                {currentSong.title}
              </h4>
              {/* Dynamic Animated Pulse Pill (ONLY when playing) */}
              {isPlaying && (
                <span
                  className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold animate-pulse shrink-0 border border-white/20"
                  style={{
                    backgroundColor: `${palette.dotCore}30`,
                    color: palette.dotBorder,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: palette.sparkColors[0] }} />
                  <span className="hidden sm:inline">LIVE</span>
                </span>
              )}
            </div>
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
