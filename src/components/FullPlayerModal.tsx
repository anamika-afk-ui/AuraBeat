import React, { useState } from 'react';
import { Song, EqualizerSettings } from '../types';
import { formatTime } from '../utils/lyricsParser';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricsView } from './LyricsView';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Flame,
  Sliders,
  FileText,
  Music,
  Radio,
  Moon,
  Share2,
  List,
  Volume2,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Heart,
  Download,
  Image as ImageIcon,
  Mic2,
} from 'lucide-react';
import { SparkProgressBar, getSongColorPalette } from './SparkProgressBar';

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  eqSettings: EqualizerSettings;
  sleepTimerSeconds: number | null;
  syncConnected: boolean;
  queue: Song[];
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite?: (songId: string) => void;
  onDownloadToDevice?: (song: Song) => void;
  onEditSong?: (song: Song) => void;
  onSelectSongFromQueue: (song: Song) => void;
  onMoveQueueItem?: (index: number, direction: 'up' | 'down') => void;
  onRemoveFromQueue?: (index: number) => void;
  onClearQueue?: () => void;
  onOpenEQ: () => void;
  onOpenSleepTimer: () => void;
  onOpenSync: () => void;
  onOpenShare: () => void;
  onOpenLyricsOverlay?: () => void;
  onUpdateLyrics?: (songId: string, lrc: string) => void;
  accentColor?: string;
  secondaryColor?: string;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  eqSettings,
  sleepTimerSeconds,
  syncConnected,
  queue,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onDownloadToDevice,
  onEditSong,
  onSelectSongFromQueue,
  onMoveQueueItem,
  onRemoveFromQueue,
  onClearQueue,
  onOpenEQ,
  onOpenSleepTimer,
  onOpenSync,
  onOpenShare,
  onOpenLyricsOverlay,
  onUpdateLyrics,
  accentColor = '#06b6d4',
  secondaryColor = '#ec4899',
}) => {
  const [activeTab, setActiveTab] = useState<'art' | 'lyrics' | 'queue'>('art');

  if (!isOpen || !currentSong) return null;

  const boostPercent = Math.round(eqSettings.volumeBoost * 100);
  const palette = getSongColorPalette(currentSong.id, currentSong.title);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Dynamic blurred backdrop from cover art */}
      <div
        className="absolute inset-0 opacity-25 filter blur-3xl scale-125 pointer-events-none"
        style={{
          backgroundImage: `url(${currentSong.coverArt})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between p-4 md:px-8 border-b border-white/5">
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Tab switcher */}
        <div className="flex space-x-1 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('art')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'art' ? 'bg-white/20 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Visualizer
          </button>
          <button
            onClick={() => {
              if (onOpenLyricsOverlay) {
                onOpenLyricsOverlay();
              } else {
                setActiveTab('lyrics');
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              activeTab === 'lyrics' ? 'bg-white/20 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3 h-3 text-cyan-400" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'queue' ? 'bg-white/20 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        {/* Right shortcut buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Lyrics Overlay Button */}
          {onOpenLyricsOverlay && (
            <button
              onClick={onOpenLyricsOverlay}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs shadow-sm shadow-cyan-500/10 transition-all cursor-pointer"
              title="Open Real-time Synchronized Lyrics"
            >
              <Mic2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Live Lyrics</span>
            </button>
          )}

          {/* Favorite Heart Button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentSong.id)}
              className={`p-2 rounded-xl transition-all ${
                currentSong.isFavorite
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-lg shadow-pink-500/20'
                  : 'text-zinc-400 hover:text-white rounded-xl hover:bg-white/10'
              }`}
              title={currentSong.isFavorite ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
            >
              <Heart className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-current text-pink-500 scale-110' : ''}`} />
            </button>
          )}

          {/* Download to Device Button */}
          {onDownloadToDevice && (
            <button
              onClick={() => onDownloadToDevice(currentSong)}
              className={`p-2 rounded-xl transition-all ${
                currentSong.isOffline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-cyan-400 rounded-xl hover:bg-white/10'
              }`}
              title={currentSong.isOffline ? 'डिवाइस में ऑफलाइन सेव है (Re-download)' : 'डिवाइस में डाउनलोड करें (Download to Device)'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenEQ}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 transition-all ${
              boostPercent > 100
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>{boostPercent}%</span>
          </button>

          <button
            onClick={onOpenShare}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full overflow-hidden">
        {activeTab === 'art' && (
          <div className="flex flex-col items-center justify-center w-full max-w-md space-y-6">
            {/* Spinning Vinyl & Glowing Artwork with Dynamic Live Effects (ONLY visible when playing) */}
            <div className="relative group flex items-center justify-center">
              {/* Dynamic Harmonic Glowing Aura Ring (ONLY when playing) */}
              {isPlaying && (
                <>
                  <div
                    className="absolute -inset-4 rounded-[36px] blur-2xl opacity-60 animate-pulse pointer-events-none transition-all duration-700"
                    style={{ background: palette.trackGradient }}
                  />
                  <div
                    className="absolute -inset-8 rounded-[44px] blur-3xl opacity-35 animate-spin-slow pointer-events-none"
                    style={{ background: palette.mistGradient }}
                  />
                </>
              )}

              {/* Dynamic Realistic Rotating Vinyl Record sliding out from behind jacket (ONLY when playing) */}
              {isPlaying && (
                <div
                  className="absolute -right-8 md:-right-12 top-4 md:top-6 w-56 h-56 md:w-68 md:h-68 rounded-full border-4 border-zinc-900 shadow-2xl flex items-center justify-center animate-spin-slow pointer-events-none -z-10 transition-all duration-700"
                  style={{
                    background: 'radial-gradient(circle, #27272a 20%, #09090b 45%, #18181b 70%, #000 100%)',
                    boxShadow: '0 0 25px rgba(0,0,0,0.8), 0 0 14px rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="absolute inset-4 rounded-full border border-white/5" />
                  <div className="absolute inset-8 rounded-full border border-white/5" />
                  <div className="absolute inset-12 rounded-full border border-white/5" />
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden relative shadow-inner">
                    <img src={currentSong.coverArt || '/logo.png'} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-white/40" />
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Musical Notes & Star Sparks (ONLY when playing) */}
              {isPlaying && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  <span
                    className="absolute -top-7 left-4 text-base animate-spark-float-1 select-none font-bold"
                    style={{ color: palette.sparkColors[0] || '#38bdf8' }}
                  >
                    ♪
                  </span>
                  <span
                    className="absolute -top-5 right-6 text-lg animate-spark-float-2 select-none font-bold"
                    style={{ color: palette.sparkColors[1] || '#34d399' }}
                  >
                    ♫
                  </span>
                  <span
                    className="absolute top-1/2 -left-7 text-xl animate-spark-float-3 select-none font-bold"
                    style={{ color: palette.sparkColors[2] || palette.sparkColors[0] || '#f472b6' }}
                  >
                    ✦
                  </span>
                  <span
                    className="absolute top-1/3 -right-6 text-sm animate-spark-float-4 select-none font-bold"
                    style={{ color: palette.sparkColors[0] || '#38bdf8' }}
                  >
                    ♬
                  </span>
                  <span
                    className="absolute -bottom-6 left-1/4 text-xs animate-spark-float-2 select-none font-bold"
                    style={{ color: palette.sparkColors[1] || '#34d399' }}
                  >
                    ⋆
                  </span>
                </div>
              )}

              {/* Main Album Artwork Card */}
              <div
                className={`w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 transition-all duration-700 relative z-10 ${
                  isPlaying ? 'scale-102 ring-4 ring-white/20' : ''
                }`}
                style={
                  isPlaying
                    ? {
                        boxShadow: palette.dotShadow,
                        borderColor: palette.dotBorder,
                      }
                    : undefined
                }
              >
                <img
                  src={currentSong.coverArt || '/logo.png'}
                  alt={currentSong.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Change Cover Art & Publish Online Button */}
              {onEditSong && (
                <button
                  type="button"
                  onClick={() => onEditSong(currentSong)}
                  className="absolute -bottom-3 left-4 px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center space-x-1 shadow-lg transition-all cursor-pointer z-20"
                  title="Change Cover Art & Publish Online (कवर बदलें और ऑनलाइन पब्लिश करें)"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>कवर बदलें / Publish</span>
                </button>
              )}

              {/* Vinyl Groove Badge */}
              <div className="absolute -bottom-3 right-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-400 flex items-center space-x-1 shadow-lg z-20">
                <Music className="w-3 h-3" />
                <span>Hi-Fi 300% Engine</span>
              </div>
            </div>

            {/* Title & Artist with Live Equalizer Indicator */}
            <div className="text-center w-full">
              {/* Dynamic Live Dancing Soundwave Bars (ONLY when playing) */}
              {isPlaying && (
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '14px',
                      backgroundColor: palette.sparkColors[0] || '#38bdf8',
                      animationDuration: '0.45s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '24px',
                      backgroundColor: palette.sparkColors[1] || '#34d399',
                      animationDuration: '0.55s',
                      animationDelay: '0.1s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '16px',
                      backgroundColor: palette.sparkColors[2] || '#f472b6',
                      animationDuration: '0.4s',
                      animationDelay: '0.2s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '26px',
                      backgroundColor: palette.sparkColors[0] || '#eab308',
                      animationDuration: '0.6s',
                      animationDelay: '0.05s',
                    }}
                  />
                  <span
                    className="w-1 rounded-full animate-bounce"
                    style={{
                      height: '18px',
                      backgroundColor: palette.sparkColors[1] || '#818cf8',
                      animationDuration: '0.5s',
                      animationDelay: '0.15s',
                    }}
                  />
                </div>
              )}

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate">
                {currentSong.title}
              </h2>
              <p className="text-sm md:text-base text-zinc-400 font-medium mt-1 truncate">
                {currentSong.artist} • {currentSong.album || currentSong.genre || 'Single'}
              </p>
            </div>

            {/* Embedded Live Visualizer */}
            <div className="w-full">
              <AudioVisualizer
                isPlaying={isPlaying}
                accentColor={accentColor}
                secondaryColor={secondaryColor}
                height={80}
              />
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="w-full h-full max-w-2xl bg-zinc-950/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            <LyricsView
              song={currentSong}
              currentTime={currentTime}
              onSeek={onSeek}
              onUpdateSongLyrics={onUpdateLyrics}
              accentColor={accentColor}
            />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full h-full max-w-2xl bg-zinc-950/70 backdrop-blur-md rounded-2xl border border-white/10 p-4 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Playback Queue ({queue.length})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-400 hidden sm:inline">↑ Aage / ↓ Pichhe</span>
                {onClearQueue && queue.length > 1 && (
                  <button
                    onClick={onClearQueue}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Clear Queue
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 flex-1">
              {queue.map((track, i) => {
                const isCurrent = track.id === currentSong.id;
                return (
                  <div
                    key={`${track.id}-${i}`}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border border-white/5'
                    }`}
                  >
                    {/* Song Info (Click to play) */}
                    <div
                      onClick={() => onSelectSongFromQueue(track)}
                      className="flex items-center space-x-3 truncate cursor-pointer flex-1 mr-2"
                      title="Click to play this track"
                    >
                      <span className="text-xs font-mono w-5 text-zinc-500 shrink-0">{i + 1}</span>
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                            {track.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-400 text-black shrink-0">
                              Playing
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block truncate">{track.artist}</span>
                      </div>
                    </div>

                    {/* Queue Actions: Move Up (Aage), Move Down (Pichhe), Remove (Hatana) */}
                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => onMoveQueueItem && onMoveQueueItem(i, 'up')}
                        disabled={i === 0}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 disabled:opacity-20 disabled:hover:text-zinc-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Move Up (Aage le jayein)"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => onMoveQueueItem && onMoveQueueItem(i, 'down')}
                        disabled={i === queue.length - 1}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 disabled:opacity-20 disabled:hover:text-zinc-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Move Down (Pichhe le jayein)"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Remove from Queue */}
                      <button
                        type="button"
                        onClick={() => onRemoveFromQueue && onRemoveFromQueue(i)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-0.5 cursor-pointer"
                        title="Queue se hatayein (Remove from queue)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="relative z-10 p-6 md:px-12 max-w-2xl mx-auto w-full">
        {/* Spark Progress bar with light blue & green sparks */}
        <div className="space-y-1">
          <SparkProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            isPlaying={isPlaying}
            size="md"
            accentColor={accentColor}
            songId={currentSong.id}
            songTitle={currentSong.title}
          />
          <div className="flex justify-between text-xs font-mono text-zinc-400 -mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrevious}
            className="p-2 text-zinc-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-4 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 text-black shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-zinc-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-2 rounded-full transition-colors relative ${
              repeatMode !== 'none' ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold text-cyan-400">1</span>
            )}
          </button>
        </div>

        {/* Extra Bottom Buttons: Sleep Timer & Sync */}
        <div className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t border-white/5 text-xs text-zinc-400">
          <button
            onClick={onOpenSleepTimer}
            className="flex items-center space-x-1.5 hover:text-white"
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>
              {sleepTimerSeconds !== null && sleepTimerSeconds > 0
                ? `${Math.ceil(sleepTimerSeconds / 60)}m left`
                : 'Sleep Timer'}
            </span>
          </button>

          <button
            onClick={onOpenSync}
            className="flex items-center space-x-1.5 hover:text-white"
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>{syncConnected ? 'Party Sync (Active)' : 'Sync Devices'}</span>
          </button>

          <button
            onClick={onOpenEQ}
            className="flex items-center space-x-1.5 hover:text-white"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>10-Band EQ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
