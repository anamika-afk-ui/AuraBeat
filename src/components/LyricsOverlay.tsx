import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Song, LyricsLine } from '../types';
import { parseLRC, findCurrentLyricsIndex, formatTime, requestAutoLyrics } from '../utils/lyricsParser';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Sparkles,
  Edit3,
  Check,
  Music2,
  Mic2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface LyricsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (timeSec: number) => void;
  onToggleFavorite?: (songId: string) => void;
  onUpdateSongLyrics?: (songId: string, lrcContent: string) => void;
  accentColor?: string;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({
  isOpen,
  onClose,
  currentSong,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleFavorite,
  onUpdateSongLyrics,
  accentColor = '#06b6d4',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse lyrics memoized
  const lyricsLines: LyricsLine[] = useMemo(() => {
    if (!currentSong?.lyrics) return [];
    return parseLRC(currentSong.lyrics);
  }, [currentSong?.lyrics]);

  // Sync edit text when currentSong changes
  useEffect(() => {
    if (currentSong?.lyrics) {
      setEditText(currentSong.lyrics);
    } else {
      setEditText('');
    }
  }, [currentSong?.id, currentSong?.lyrics]);

  // Find active line index
  const activeIndex = useMemo(() => {
    return findCurrentLyricsIndex(lyricsLines, currentTime);
  }, [lyricsLines, currentTime]);

  // Smooth auto-scroll to center active line (unless user is actively dragging/scrolling)
  useEffect(() => {
    if (!isOpen || isEditing || userScrollingRef.current) return;
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isOpen, isEditing]);

  const handleUserScroll = () => {
    userScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 2500);
  };

  const handleGenerateLyrics = async () => {
    if (!currentSong) return;
    setIsGenerating(true);
    try {
      const generated = await requestAutoLyrics(
        currentSong.title,
        currentSong.artist,
        currentSong.duration || duration || 180
      );
      if (onUpdateSongLyrics) {
        onUpdateSongLyrics(currentSong.id, generated);
      }
      setEditText(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLyrics = () => {
    if (!currentSong) return;
    if (onUpdateSongLyrics) {
      onUpdateSongLyrics(currentSong.id, editText);
    }
    setIsEditing(false);
  };

  if (!isOpen || !currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 text-white backdrop-blur-2xl animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Dynamic Ambient Cover Art Glow */}
      <div
        className="absolute inset-0 opacity-20 filter blur-3xl scale-125 pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `url(${currentSong.coverArt})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          title="Close Lyrics"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Song Info Center */}
        <div className="flex items-center space-x-3 text-center max-w-[60%] sm:max-w-md truncate">
          <img
            src={currentSong.coverArt}
            alt={currentSong.title}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-md shrink-0 border border-white/10"
          />
          <div className="text-left truncate">
            <h3 className="text-xs sm:text-sm font-black text-white truncate">
              {currentSong.title}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {lyricsLines.length === 0 && (
            <button
              onClick={handleGenerateLyrics}
              disabled={isGenerating}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Auto Lyrics'}</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Edit Lyrics"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Lyrics Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleUserScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-10 sm:py-16 scrollbar-none"
      >
        {isEditing ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-cyan-400">
                Edit Synchronized LRC Lyrics
              </h4>
              <span className="text-[11px] text-zinc-400 font-mono">
                Format: [mm:ss.xx] Lyrics line
              </span>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="[00:05.00] Enter your lyrics here..."
              rows={14}
              className="w-full p-4 rounded-2xl bg-zinc-900/90 border border-white/15 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLyrics}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20"
              >
                Save Lyrics
              </button>
            </div>
          </div>
        ) : lyricsLines.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-32 pt-8 text-center sm:text-left">
            {lyricsLines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPassed = idx < activeIndex;

              return (
                <div
                  key={`${line.timeSec}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.timeSec)}
                  className={`group transition-all duration-300 cursor-pointer rounded-2xl p-2.5 sm:p-3.5 -mx-2.5 sm:-mx-3.5 will-change-[transform,opacity] ${
                    isActive
                      ? 'scale-105 sm:scale-105 origin-center sm:origin-left bg-white/5 backdrop-blur-sm gpu-accelerated'
                      : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <p
                    className={`font-black transition-all leading-snug sm:leading-tight ${
                      isActive
                        ? 'text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-emerald-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : isPassed
                        ? 'text-lg sm:text-2xl text-zinc-400 group-hover:text-zinc-200'
                        : 'text-lg sm:text-2xl text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    {line.text}
                  </p>

                  {/* Timestamp Indicator */}
                  <span
                    className={`inline-block font-mono text-[10px] mt-1 transition-opacity ${
                      isActive
                        ? 'text-cyan-400 font-bold opacity-100'
                        : 'text-zinc-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {formatTime(line.timeSec)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-4 my-auto pt-16">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Mic2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">
                No Synchronized Lyrics Found
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Is song ke liye lyrics available nahi hain. Aap 1 click me procedural lyrics generate kar sakte hain ya custom lyrics add kar sakte hain.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
              <button
                type="button"
                onClick={handleGenerateLyrics}
                disabled={isGenerating}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isGenerating ? 'Generating...' : 'Auto-Generate Lyrics'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Add Custom Lyrics</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Playback Dock */}
      <div className="relative z-20 px-4 sm:px-8 py-3 bg-zinc-950/90 border-t border-white/10 backdrop-blur-xl">
        {/* Seek Progress Bar */}
        <div className="max-w-2xl mx-auto mb-2">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
              const newTime = (clickX / rect.width) * duration;
              onSeek(newTime);
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer overflow-hidden relative group"
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full will-change-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center justify-center space-x-6 max-w-md mx-auto">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentSong.id)}
              className={`p-2 rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer ${
                currentSong.isFavorite
                  ? 'text-pink-500'
                  : 'text-zinc-500 hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart
                className={`w-5 h-5 ${
                  currentSong.isFavorite ? 'fill-current' : ''
                }`}
              />
            </button>
          )}

          <button
            onClick={onPrevious}
            className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Previous Song"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-3.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Next Song"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
