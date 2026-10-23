import React, { useState, useRef } from 'react';
import { Song } from '../types';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  Unlock,
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
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSongPublished: (newSong: Song) => void;
  onSongDeleted: (songId: string) => void;
  onPlaySong?: (song: Song) => void;
  accentColor?: string;
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
  const [adminPasskey, setAdminPasskey] = useState(
    () => localStorage.getItem('aurabeat_admin_key') || 'AuraBeatSecretKey26'
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('aurabeat_admin_logged_in') === 'true';
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Tabs inside Admin Panel: 'publish' | 'manage' | 'locals'
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

  if (!isOpen) return null;

  // Filter online published songs
  const onlineSongs = songs.filter(
    (s) =>
      Boolean((s as any).isCloudShared) ||
      Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage')))
  );

  // Filter local songs
  const localSongs = songs.filter(
    (s) =>
      !Boolean((s as any).isCloudShared) &&
      !Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage')))
  );

  // Verify Admin Passkey
  const handleVerifyPasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminPasskey.trim()) {
      setAuthError('Kripya admin passkey enter karein.');
      return;
    }

    setAuthError(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminPasskey.trim(),
        },
        body: JSON.stringify({ adminKey: adminPasskey.trim() }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('aurabeat_admin_key', adminPasskey.trim());
        sessionStorage.setItem('aurabeat_admin_logged_in', 'true');
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
      } else {
        const err = await res.json().catch(() => ({}));
        setAuthError(err.error || 'Galat passkey! Valid admin passkey enter karein.');
      }
    } catch (err: any) {
      setAuthError('Network error: Server se connect nahi ho saka.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('aurabeat_admin_logged_in');
  };

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

  // Execute Song Publish to Cloud
  const handlePublishNewSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setPublishError('Kripya publish karne ke liye ek audio file chunein.');
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

      setPublishStatus('Online library me save ho raha hai...');

      const currentKey = localStorage.getItem('aurabeat_admin_key') || adminPasskey || 'AuraBeatSecretKey26';
      const blobToken = localStorage.getItem('aurabeat_blob_token') || undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-key': currentKey,
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
          adminKey: currentKey,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Publish fail ho gaya.');
      }

      const data = await res.json();
      if (data.song) {
        onSongPublished(data.song);
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
        setPublishStatus('🎉 Song safalta-purvak publish ho gaya!');

        // Reset form
        setTimeout(() => {
          setSelectedFile(null);
          setTitle('');
          setArtist('');
          setAlbum('');
          setPublishStatus(null);
          setIsPublishing(false);
          setActiveTab('manage');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'Publishing me samasya aayi.');
      setIsPublishing(false);
      setPublishStatus(null);
    }
  };

  // Publish an existing local song directly from admin panel
  const handlePublishLocalSong = async (song: Song) => {
    setPublishStatus(`"${song.title}" online library me publish ho raha hai...`);
    setIsPublishing(true);

    try {
      const currentKey = localStorage.getItem('aurabeat_admin_key') || adminPasskey || 'AuraBeatSecretKey26';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-key': currentKey,
      };

      // Get audio base64 from song blob
      let audioBase64: string | undefined = undefined;
      try {
        const resp = await fetch(song.url);
        if (resp.ok) {
          const blob = await resp.blob();
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
        headers,
        body: JSON.stringify({
          ...song,
          audioBase64,
          adminKey: currentKey,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish');
      }

      const data = await res.json();
      if (data.song) {
        onSongPublished(data.song);
        confetti({ particleCount: 30, spread: 50 });
        setPublishStatus(`✅ "${song.title}" ab sabhi users ke liye online live ho gaya!`);
        setTimeout(() => setPublishStatus(null), 3500);
      }
    } catch (err: any) {
      alert(`Publish error: ${err.message || 'Check connection'}`);
      setPublishStatus(null);
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete an online published song
  const handleDeleteOnlineSong = async (song: Song) => {
    if (!window.confirm(`Kya aap "${song.title}" ko online library se permanently delete karna chahte hain?`)) {
      return;
    }

    setDeletingId(song.id);
    try {
      const currentKey = localStorage.getItem('aurabeat_admin_key') || adminPasskey || 'AuraBeatSecretKey26';
      const res = await fetch(`/api/catalog/delete/${song.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': currentKey,
        },
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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 shadow-lg shadow-amber-500/20 text-white">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Admin Control Panel</h2>
                {isAuthenticated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {isAuthenticated
                  ? 'Sirf aap songs ko online library me publish ya delete kar sakte hain'
                  : 'Passkey enter karke admin panel unlock karein'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. AUTHENTICATION GATE (When not authenticated) */}
        {!isAuthenticated ? (
          <div className="py-8 px-2 sm:px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Admin Passkey Verification</h3>
              <p className="text-xs text-zinc-400 mt-1">
                AuraBeat me online songs upload karne aur manage karne ke liye admin passkey daalein.
              </p>
            </div>

            <form onSubmit={handleVerifyPasskey} className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Admin Passkey..."
                  value={adminPasskey}
                  onChange={(e) => setAdminPasskey(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-800/90 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors text-center font-mono"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Passkey...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Admin Panel</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <div className="mt-5 space-y-5">
            {/* Admin Tabs */}
            <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-zinc-800/80 border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'publish'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Naya Song Publish Karein</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span>Online Songs ({onlineSongs.length})</span>
              </button>

              {localSongs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('locals')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeTab === 'locals'
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Local Se Publish ({localSongs.length})</span>
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

            {/* TAB 1: PUBLISH NEW SONG ONLINE */}
            {activeTab === 'publish' && (
              <form onSubmit={handlePublishNewSong} className="space-y-4">
                {/* Audio File Input Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Audio File (MP3, WAV, AAC, M4A, FLAC)
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
                        <p className="text-[10px] text-zinc-500">Audio direct online streaming library me jud jayegi</p>
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
                      placeholder="e.g. Midnight Dream"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      Artist Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arijit Singh / The Weeknd"
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
                      Album / Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hits 2026"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      Genre
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bollywood, Synthwave, Lo-Fi"
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
                      Cover Art
                    </label>
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Custom Photo Upload</span>
                    </button>
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
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
                  className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Publishing to Online Library...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      <span>Publish Song Online (सबके लिए लाइव करें)</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: MANAGE PUBLISHED ONLINE SONGS */}
            {activeTab === 'manage' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Sabhi online songs live stream ho rahe hain ({onlineSongs.length})</span>
                  <span className="text-[11px] text-zinc-500">Only Admin can delete/manage</span>
                </div>

                {onlineSongs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <Globe className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-xs">Abhi koi gaana online publish nahi hai.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('publish')}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
                    >
                      Pehla Gaana Publish Karein
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto pr-1">
                    {onlineSongs.map((song) => (
                      <div
                        key={song.id}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={song.coverArt || '/logo.png'}
                            alt={song.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{song.title}</h4>
                            <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {onPlaySong && (
                            <button
                              type="button"
                              onClick={() => onPlaySong(song)}
                              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                              title="Play Online Track"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOnlineSong(song)}
                            disabled={deletingId === song.id}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete from Online Library"
                          >
                            {deletingId === song.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PUBLISH FROM LOCAL SONGS (IF PRESENT) */}
            {activeTab === 'locals' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Aapke device me pehle se save local songs ko aap 1-click me sabhi users ke liye online library me publish kar sakte hain:
                </p>

                <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto pr-1">
                  {localSongs.map((song) => (
                    <div
                      key={song.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={song.coverArt || '/logo.png'}
                          alt={song.title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{song.title}</h4>
                          <p className="text-[11px] text-zinc-400 truncate">{song.artist} • Local</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePublishLocalSong(song)}
                        disabled={isPublishing}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Publish Online</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
