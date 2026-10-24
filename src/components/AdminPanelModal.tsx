import React, { useState, useRef } from 'react';
import { Song } from '../types';
import confetti from 'canvas-confetti';
import {
  Upload,
  Globe,
  Trash2,
  Play,
  Check,
  X,
  AlertCircle,
  Loader2,
  Music,
  Image as ImageIcon,
  Sparkles,
  CloudUpload,
  HardDrive,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSongPublished: (newSong: Song) => void;
  onSongDeleted: (songId: string) => void;
  onPlaySong?: (song: Song) => void;
  accentColor?: string;
  userEmail?: string;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  songs,
  onSongPublished,
  onSongDeleted,
  onPlaySong,
  accentColor = '#06b6d4',
}) => {
  // Tabs: 'publish' | 'manage' | 'locals'
  const [activeTab, setActiveTab] = useState<'publish' | 'manage' | 'locals'>('publish');

  // Form states for new song upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [coverArt, setCoverArt] = useState(PRESET_COVERS[0]);
  const [genre, setGenre] = useState('Pop / Electronic');
  const [duration, setDuration] = useState<number>(180);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Accessible to every user - no login or admin check required
  if (!isOpen) return null;

  // Filter online published / storage songs
  const onlineSongs = songs.filter(
    (s) =>
      Boolean((s as any).isCloudShared) ||
      Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage') || s.url.startsWith('/uploads/') || s.url.startsWith('uploads/')))
  );

  // Filter local songs
  const localSongs = songs.filter(
    (s) =>
      !Boolean((s as any).isCloudShared) &&
      !Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage') || s.url.startsWith('/uploads/') || s.url.startsWith('uploads/')))
  );

  // Handle Audio File Selection
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!title) setTitle(cleanName);
    if (!artist) setArtist('Featured Artist');
    if (!album) setAlbum('Online Collection');

    // Estimate duration
    const tempUrl = URL.createObjectURL(file);
    const tempAudio = new Audio();
    tempAudio.src = tempUrl;
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        setDuration(Math.round(tempAudio.duration));
      }
      URL.revokeObjectURL(tempUrl);
    };
  };

  // Handle Cover Art File Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCoverArt(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Execute Song Upload to Storage
  const handlePublishNewSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setPublishError('Kripya upload karne ke liye ek audio file chunein.');
      return;
    }
    if (!title.trim()) {
      setPublishError('Song ka title likhna zaroori hai.');
      return;
    }

    setPublishError(null);
    setIsPublishing(true);
    setPublishStatus('Audio file convert & upload ho rahi hai...');

    try {
      // Convert file to Base64
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          let res = reader.result as string;
          if (res && !res.startsWith('data:audio/')) {
            res = res.replace(/^data:[^;]+;base64,/, 'data:audio/mpeg;base64,');
          }
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setPublishStatus('Storage me save ho raha hai...');

      const blobToken = localStorage.getItem('aurabeat_blob_token') || undefined;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (blobToken) headers['x-blob-token'] = blobToken;

      const res = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          artist: (artist || 'Featured Artist').trim(),
          album: (album || 'Online Library').trim(),
          genre: (genre || 'Electronic').trim(),
          duration: duration || 180,
          coverArt,
          audioBase64,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload fail ho gaya.');
      }

      const data = await res.json();
      if (data.song) {
        onSongPublished(data.song);
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        setPublishStatus('🎉 Song safalta-purvak storage me upload ho gaya!');

        // Reset form
        setSelectedFile(null);
        setTitle('');
        setArtist('');
        setAlbum('');
        setCoverArt(PRESET_COVERS[0]);

        setTimeout(() => {
          setPublishStatus(null);
          setActiveTab('manage');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'Server error aayi.');
      setPublishStatus(null);
    } finally {
      setIsPublishing(false);
    }
  };

  // Publish a local detected song to cloud storage
  const handlePublishLocalSong = async (song: Song) => {
    setIsPublishing(true);
    setPublishStatus(`"${song.title}" ko storage me upload kiya ja raha hai...`);

    try {
      let audioBase64: string | undefined = undefined;

      try {
        const response = await fetch(song.url);
        if (response.ok) {
          const blob = await response.blob();
          audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              let res = reader.result as string;
              if (res && !res.startsWith('data:audio/')) {
                res = res.replace(/^data:[^;]+;base64,/, 'data:audio/mpeg;base64,');
              }
              resolve(res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch {}

      const res = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...song,
          audioBase64,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload fail ho gaya.');
      }

      const data = await res.json();
      if (data.song) {
        onSongPublished(data.song);
        confetti({ particleCount: 35, spread: 50 });
        setPublishStatus(`✅ "${song.title}" storage me live ho gaya!`);
        setTimeout(() => setPublishStatus(null), 3000);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || 'Check connection'}`);
      setPublishStatus(null);
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete a song from storage
  const handleDeleteOnlineSong = async (song: Song) => {
    if (!window.confirm(`Kya aap "${song.title}" ko storage se permanently delete karna chahte hain?`)) {
      return;
    }

    setDeletingId(song.id);
    try {
      const res = await fetch(`/api/catalog/delete/${song.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onSongDeleted(song.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Delete karne me samasya aayi.');
      }
    } catch (e: any) {
      alert('Delete failed: ' + (e?.message || 'Server error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 text-white max-h-[92vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
              <CloudUpload className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Upload Song to Storage
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct Upload
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Title, artist, album aur cover image ke sath audio upload karein • No Login Required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DASHBOARD */}
        <div className="mt-5 space-y-5">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-zinc-800/80 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('publish')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'publish'
                  ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Naya Song Upload Karein</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>Storage Library ({onlineSongs.length})</span>
            </button>

            {localSongs.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('locals')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'locals'
                    ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Device Tracks ({localSongs.length})</span>
              </button>
            )}
          </div>

          {/* Status Notifications */}
          {publishStatus && (
            <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="font-medium">{publishStatus}</span>
              </div>
            </div>
          )}

          {publishError && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD NEW SONG */}
          {activeTab === 'publish' && (
            <form onSubmit={handlePublishNewSong} className="space-y-4">
              {/* Audio File Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Audio File (MP3, WAV, AAC, M4A, FLAC) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/15 hover:border-cyan-400/50 bg-zinc-800/40 hover:bg-zinc-800/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-3 text-emerald-300">
                      <Check className="w-5 h-5 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-white truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {Math.floor(duration / 60)}:
                          {(duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-cyan-400" />
                      <p className="text-xs font-bold text-white">Click karein ya audio file drop karein</p>
                      <p className="text-[10px] text-zinc-500">
                        Song upload hone par storage me save ho jayega aur offline & online bajega
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Song Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tum Hi Ho / Kesariya / Starboy"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arijit Singh / AP Dhillon / The Weeknd"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Album & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Album Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aashiqui 2 / After Hours / Top Hits"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Genre / Mood
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bollywood, Punjabi, Lo-Fi, EDM"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Cover Art Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Cover Image (कवर इमेज)
                  </label>
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Custom Photo</span>
                  </button>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                {/* Cover Preview & Presets */}
                <div className="flex items-center space-x-3 mb-2 p-2 rounded-xl bg-zinc-800/60 border border-white/5">
                  <img
                    src={coverArt}
                    alt="Current cover preview"
                    className="w-14 h-14 rounded-lg object-cover ring-2 ring-cyan-400/60 shrink-0"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Selected Cover Art</p>
                    <p className="text-[11px] text-zinc-400">
                      Neeche diye gaye preset artworks me se chunein ya apni photo upload karein
                    </p>
                  </div>
                </div>

                {/* Preset Covers Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_COVERS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCoverArt(preset)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-transform hover:scale-105 ${
                        coverArt === preset ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-transparent'
                      }`}
                    >
                      <img src={preset} alt="preset cover" className="w-full h-full object-cover" />
                      {coverArt === preset && (
                        <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPublishing || !selectedFile}
                className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading to Storage...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-5 h-5" />
                    <span>Upload Song to Storage (स्टोरेज में सेव करें)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: MANAGE STORAGE SONGS */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Storage me uplod kiye gaye gaane ({onlineSongs.length})</span>
                <span className="text-[11px] text-emerald-400">✓ Ready to Stream & Play</span>
              </div>

              {onlineSongs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">Abhi koi gaana storage me uplod nahi hai.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('publish')}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors cursor-pointer"
                  >
                    Pehla Gaana Upload Karein
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto pr-1">
                  {onlineSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={song.coverArt || '/logo.png'}
                          alt={song.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{song.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {song.artist} • {song.album || 'Single'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {onPlaySong && (
                          <button
                            type="button"
                            onClick={() => onPlaySong(song)}
                            className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                            title="Play"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteOnlineSong(song)}
                          disabled={deletingId === song.id}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete from Storage"
                        >
                          {deletingId === song.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PUBLISH LOCAL DETECTED TRACKS */}
          {activeTab === 'locals' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Aapke device ke local audio files jinhe aap storage me upload kar sakte hain:
              </p>
              <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto pr-1">
                {localSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={song.coverArt || '/logo.png'}
                        alt={song.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{song.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {song.artist} • {song.album || 'Local'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePublishLocalSong(song)}
                      disabled={isPublishing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { AdminPanelModal as UploadSongModal };
