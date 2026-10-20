import React, { useEffect, useRef, useState } from 'react';
import { Song, LyricsLine } from '../types';
import { parseLRC, findCurrentLyricsIndex, requestAutoLyrics, formatTime } from '../utils/lyricsParser';
import { Sparkles, Edit3, Check, Loader2, Music2, RotateCcw } from 'lucide-react';

interface LyricsViewProps {
  song: Song | null;
  currentTime: number;
  onSeek: (timeSec: number) => void;
  onUpdateSongLyrics?: (songId: string, lrcContent: string) => void;
  accentColor?: string;
  isCompact?: boolean;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  song,
  currentTime,
  onSeek,
  onUpdateSongLyrics,
  accentColor = '#06b6d4',
  isCompact = false,
}) => {
  const [lyricsLines, setLyricsLines] = useState<LyricsLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (song?.lyrics) {
      setLyricsLines(parseLRC(song.lyrics));
      setEditText(song.lyrics);
    } else {
      setLyricsLines([]);
      setEditText('');
    }
  }, [song?.id, song?.lyrics]);

  const activeIndex = findCurrentLyricsIndex(lyricsLines, currentTime);

  // Auto-scroll to keep active line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && !isEditing) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isEditing]);

  const handleGenerateLyrics = async () => {
    if (!song) return;
    setIsGenerating(true);
    try {
      const generated = await requestAutoLyrics(song.title, song.artist, song.duration);
      setLyricsLines(parseLRC(generated));
      setEditText(generated);
      if (onUpdateSongLyrics) {
        onUpdateSongLyrics(song.id, generated);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    if (!song) return;
    setLyricsLines(parseLRC(editText));
    if (onUpdateSongLyrics) {
      onUpdateSongLyrics(song.id, editText);
    }
    setIsEditing(false);
  };

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-500">
        <Music2 className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No track currently playing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm border-b border-white/5 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
            Karaoke Lyrics
          </span>
          {lyricsLines.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
              Auto-Synced
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateLyrics}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-all disabled:opacity-50"
            title="Auto generate karaoke timestamped lyrics"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Auto-Generate Lyrics'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Edit / Paste LRC"
          >
            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Lyrics Body */}
      {isEditing ? (
        <div className="flex-1 p-4 flex flex-col">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="[00:04.20] First line...&#10;[00:10.50] Second line..."
            className="flex-1 w-full bg-zinc-950 p-3 rounded-xl border border-white/10 font-mono text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400"
            >
              Save Lyrics
            </button>
          </div>
        </div>
      ) : lyricsLines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Music2 className="w-12 h-12 text-zinc-600 mb-3" />
          <h4 className="text-base font-semibold text-zinc-300">No synchronized lyrics yet</h4>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
            Click "Auto-Generate Lyrics" to generate real-time karaoke timestamps automatically!
          </p>
          <button
            onClick={handleGenerateLyrics}
            disabled={isGenerating}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 flex items-center space-x-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Auto-Generate Now</span>
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-6 py-12 space-y-6 text-center select-none scrollbar-thin scrollbar-thumb-zinc-700"
        >
          {lyricsLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.timeSec)}
                className={`cursor-pointer transition-all duration-300 font-semibold tracking-tight ${
                  isActive
                    ? 'text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400 scale-105 shadow-sm'
                    : isPast
                    ? 'text-base md:text-lg text-zinc-500 hover:text-zinc-300'
                    : 'text-base md:text-lg text-zinc-400/80 hover:text-zinc-200'
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};
