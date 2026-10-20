import React, { useState } from 'react';
import { Playlist, Song } from '../types';
import {
  ListMusic,
  Plus,
  Trash2,
  Play,
  Upload,
  Download,
  Check,
  X,
  Music,
  FolderSync,
} from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  songs: Song[];
  onCreatePlaylist: (title: string, desc?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectPlaylistToPlay: (playlist: Playlist) => void;
  onAddSongToPlaylist: (playlistId: string, songId: string) => void;
  onRemoveSongFromPlaylist: (playlistId: string, songId: string) => void;
  onImportPlaylist: (playlistData: any) => void;
  accentColor?: string;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  songs,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylistToPlay,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
  onImportPlaylist,
  accentColor = '#06b6d4',
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleExport = (playlist: Playlist) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playlist, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${playlist.title.replace(/\s+/g, '_')}_playlist.json`);
    dlAnchorElem.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportPlaylist(parsed);
      } catch (err) {
        alert('Invalid playlist JSON file format');
      }
    };
    reader.readAsText(file);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const playlistSongs = selectedPlaylist
    ? songs.filter((s) => selectedPlaylist.songIds.includes(s.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <ListMusic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Playlists & Sync</h2>
              <p className="text-xs text-zinc-400">Manage playlists, offline synchronization & backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer transition-all border border-white/5">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Create Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-cyan-500/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">New Playlist</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Playlist Title (e.g. 300% Bass Boost Workout)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold text-xs"
              >
                Save Playlist
              </button>
            </div>
          </form>
        )}

        {/* Playlist List or Selected View */}
        {selectedPlaylist ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>← Back to all playlists</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSelectPlaylistToPlay(selectedPlaylist)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play All</span>
                </button>
                <button
                  onClick={() => handleExport(selectedPlaylist)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Export to JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{selectedPlaylist.title}</h3>
              {selectedPlaylist.description && (
                <p className="text-xs text-zinc-400">{selectedPlaylist.description}</p>
              )}
            </div>

            {/* Songs in this playlist */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {playlistSongs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No songs in this playlist yet. Add songs from your library!
                </p>
              ) : (
                playlistSongs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-white/5"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <img
                        src={s.coverArt}
                        alt={s.title}
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">{s.artist}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveSongFromPlaylist(selectedPlaylist.id, s.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {playlists.length === 0 ? (
              <div className="col-span-2 py-10 text-center text-zinc-500">
                <FolderSync className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No playlists created yet. Create one to organize your songs!</p>
              </div>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {pl.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleExport(pl)}
                          className="p-1 text-zinc-500 hover:text-white"
                          title="Export"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePlaylist(pl.id)}
                          className="p-1 text-zinc-500 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {pl.description || `${pl.songIds.length} tracks`}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] font-mono text-cyan-400">
                      {pl.songIds.length} songs
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedPlaylistId(pl.id)}
                        className="text-xs text-zinc-300 hover:text-white underline"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => onSelectPlaylistToPlay(pl)}
                        className="p-1.5 rounded-full bg-cyan-500 text-black hover:bg-cyan-400 shadow"
                        title="Play"
                      >
                        <Play className="w-3 h-3 fill-black" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
