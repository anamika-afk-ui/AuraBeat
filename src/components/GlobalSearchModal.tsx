import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Song, Playlist } from '../types';
import {
  Search,
  Music,
  Disc,
  User,
  ListMusic,
  Play,
  X,
  Sparkles,
  Globe,
  HardDrive,
  CornerDownLeft,
  Command,
  Radio,
  Flame,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  playlists: Playlist[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onSelectArtist?: (artistName: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  songs,
  playlists,
  currentSong,
  isPlaying,
  onPlaySong,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Aggregate unique artists with count
  const allArtists = useMemo(() => {
    const artistMap = new Map<string, { name: string; count: number; coverArt: string }>();
    songs.forEach((s) => {
      const art = (s.artist || 'Unknown Artist').trim();
      const existing = artistMap.get(art);
      if (existing) {
        existing.count += 1;
      } else {
        artistMap.set(art, { name: art, count: 1, coverArt: s.coverArt || '/logo.png' });
      }
    });
    return Array.from(artistMap.values());
  }, [songs]);

  // Filtered results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        songs: songs.slice(0, 6), // show recent/top 6
        playlists: playlists.slice(0, 3),
        artists: allArtists.slice(0, 3),
        isDefault: true,
      };
    }

    const matchedSongs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q)) ||
        (s.genre && s.genre.toLowerCase().includes(q))
    );

    const matchedPlaylists = playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );

    const matchedArtists = allArtists.filter((a) => a.name.toLowerCase().includes(q));

    return {
      songs: matchedSongs,
      playlists: matchedPlaylists,
      artists: matchedArtists,
      isDefault: false,
    };
  }, [query, songs, playlists, allArtists]);

  // Flattened items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: Array<{
      type: 'song' | 'playlist' | 'artist';
      item: any;
      key: string;
    }> = [];

    results.songs.forEach((s) => items.push({ type: 'song', item: s, key: `song-${s.id}` }));
    results.playlists.forEach((p) =>
      items.push({ type: 'playlist', item: p, key: `pl-${p.id}` })
    );
    results.artists.forEach((a) =>
      items.push({ type: 'artist', item: a, key: `art-${a.name}` })
    );

    return items;
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const active = flatItems[selectedIndex];
        if (active) {
          if (active.type === 'song') {
            onPlaySong(active.item);
            onClose();
          } else if (active.type === 'playlist' && onSelectPlaylist) {
            onSelectPlaylist(active.item);
            onClose();
          } else if (active.type === 'artist' && onSelectArtist) {
            onSelectArtist(active.item.name);
            onClose();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onPlaySong, onSelectPlaylist, onSelectArtist, onClose]);

  if (!isOpen) return null;

  const totalResults = results.songs.length + results.playlists.length + results.artists.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click listener to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Glowing Floating Palette */}
      <div className="relative w-full max-w-2xl bg-zinc-950/90 border border-cyan-500/40 rounded-3xl shadow-[0_0_35px_rgba(6,182,212,0.3),0_0_50px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col text-white backdrop-blur-2xl ring-1 ring-emerald-400/30 animate-in zoom-in-95 duration-200 max-h-[82vh]">
        {/* Glowing Top Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-emerald-950/30 via-zinc-900/60 to-cyan-950/30">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] mr-3 shrink-0">
            <Search className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search songs, artists, albums, playlists across library..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-400 focus:outline-none font-medium selection:bg-cyan-500 selection:text-black"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors mr-2 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-1 shrink-0 pl-1">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 rounded-lg shadow-sm">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories / Filter Pill Row */}
        <div className="flex items-center space-x-2 px-4 py-2 border-b border-white/5 bg-zinc-900/40 text-[11px] text-zinc-400 overflow-x-auto no-scrollbar">
          <span className="flex items-center space-x-1 text-emerald-400 font-bold shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Global Search</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="shrink-0">{results.songs.length} Songs</span>
          <span className="text-zinc-600">•</span>
          <span className="shrink-0">{results.artists.length} Artists</span>
          <span className="text-zinc-600">•</span>
          <span className="shrink-0">{results.playlists.length} Playlists</span>
        </div>

        {/* Scrollable Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {totalResults === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Search className="w-10 h-10 mx-auto text-zinc-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-zinc-300">
                "{query}" ke liye koi result nahi mila
              </p>
              <p className="text-xs text-zinc-500">
                Alag song title, artist ya playlist name search karke dekhein.
              </p>
            </div>
          ) : (
            <>
              {/* 1. SONGS SECTION */}
              {results.songs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5 text-cyan-300">
                      <Music className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{results.isDefault ? 'Recommended Songs' : 'Songs'}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {results.songs.length} found
                    </span>
                  </div>

                  <div className="space-y-1">
                    {results.songs.map((song, idx) => {
                      const isSelected = selectedIndex === idx;
                      const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
                      const isOnline =
                        Boolean((song as any).isCloudShared) ||
                        Boolean(song.url && song.url.includes('blob.vercel-storage'));

                      return (
                        <div
                          key={`song-${song.id}`}
                          onClick={() => {
                            onPlaySong(song);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/10 border border-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                              : 'hover:bg-zinc-900/80 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            {/* Cover Art with Play Button Overlay */}
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm bg-black">
                              <img
                                src={song.coverArt || '/logo.png'}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                              <div
                                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                                  isSelected || isCurrentPlaying
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                              >
                                <Play
                                  className={`w-4 h-4 fill-white text-white ${
                                    isCurrentPlaying ? 'animate-pulse text-cyan-300' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h4
                                  className={`text-xs sm:text-sm font-bold truncate ${
                                    isCurrentPlaying
                                      ? 'text-cyan-300'
                                      : isSelected
                                      ? 'text-white'
                                      : 'text-zinc-200'
                                  }`}
                                >
                                  {song.title}
                                </h4>
                                {isOnline ? (
                                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>Online</span>
                                  </span>
                                ) : song.isOffline ? (
                                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    <HardDrive className="w-2.5 h-2.5" />
                                    <span>Offline</span>
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {song.artist} {song.album ? `• ${song.album}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Quick Duration / Genre */}
                          <div className="flex items-center space-x-2 shrink-0 ml-2">
                            {song.genre && (
                              <span className="hidden md:inline px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                                {song.genre}
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-zinc-400">
                              {Math.floor(song.duration / 60)}:
                              {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. ARTISTS SECTION */}
              {results.artists.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5 text-emerald-300">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Artists</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {results.artists.length} found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.artists.map((artist, aIdx) => {
                      const itemIdx = results.songs.length + aIdx;
                      const isSelected = selectedIndex === itemIdx;

                      return (
                        <div
                          key={`artist-${artist.name}`}
                          onClick={() => {
                            if (onSelectArtist) onSelectArtist(artist.name);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center space-x-2.5 p-2 rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-500/15 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                              : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5'
                          }`}
                        >
                          <img
                            src={artist.coverArt}
                            alt={artist.name}
                            className="w-8 h-8 rounded-full object-cover border border-emerald-400/30 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {artist.name}
                            </h4>
                            <p className="text-[10px] text-emerald-400">
                              {artist.count} {artist.count === 1 ? 'song' : 'songs'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. PLAYLISTS SECTION */}
              {results.playlists.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5 text-indigo-300">
                      <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Playlists</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {results.playlists.length} found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.playlists.map((playlist, pIdx) => {
                      const itemIdx = results.songs.length + results.artists.length + pIdx;
                      const isSelected = selectedIndex === itemIdx;

                      return (
                        <div
                          key={`pl-${playlist.id}`}
                          onClick={() => {
                            if (onSelectPlaylist) onSelectPlaylist(playlist);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center space-x-2.5 p-2 rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                              : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 border border-cyan-500/30 flex items-center justify-center shrink-0">
                            <Disc className="w-4 h-4 text-cyan-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {playlist.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400">
                              {playlist.songIds?.length || 0} tracks
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                ↓
              </kbd>
              <span className="hidden sm:inline">Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono flex items-center">
                <CornerDownLeft className="w-2.5 h-2.5 mr-0.5" /> Enter
              </kbd>
              <span className="hidden sm:inline">Play / Select</span>
            </span>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Instant Aura Search</span>
          </span>
        </div>
      </div>
    </div>
  );
};
