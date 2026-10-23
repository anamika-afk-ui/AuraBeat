import React, { useState } from 'react';
import { Song } from '../types';
import { Image, Upload, Globe, Check, X, Sparkles, Music, Loader2, Trash2 } from 'lucide-react';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSave: (updatedSong: Song) => void;
  onPublishToCloud?: (song: Song) => Promise<void>;
  onDeleteSong?: (songId: string) => void;
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

export const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  song,
  onSave,
  onPublishToCloud,
  onDeleteSong,
  accentColor = '#06b6d4',
}) => {
  if (!isOpen || !song) return null;

  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album || '');
  const [coverArt, setCoverArt] = useState(song.coverArt || '/logo.png');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showVercelConfig, setShowVercelConfig] = useState(false);
  const [blobTokenInput, setBlobTokenInput] = useState(
    () => localStorage.getItem('aurabeat_blob_token') || ''
  );
  const [adminKeyInput, setAdminKeyInput] = useState(
    () => localStorage.getItem('aurabeat_admin_key') || 'AuraBeatSecretKey26'
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCoverArt(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOnly = () => {
    const updated: Song = {
      ...song,
      title: title.trim() || song.title,
      artist: artist.trim() || song.artist,
      album: album.trim() || song.album,
      coverArt,
    };
    onSave(updated);
    onClose();
  };

  const handlePublishOnline = async () => {
    if (!onPublishToCloud) return;
    setPublishError(null);
    setIsPublishing(true);

    if (blobTokenInput.trim()) {
      localStorage.setItem('aurabeat_blob_token', blobTokenInput.trim());
    }
    if (adminKeyInput.trim()) {
      localStorage.setItem('aurabeat_admin_key', adminKeyInput.trim());
    }

    try {
      const updated: Song = {
        ...song,
        title: title.trim() || song.title,
        artist: artist.trim() || song.artist,
        album: album.trim() || song.album,
        coverArt,
      };
      await onPublishToCloud(updated);
      setPublishedSuccess(true);
      setTimeout(() => {
        setPublishedSuccess(false);
        onSave(updated);
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Publish to Vercel Blob failed:', e);
      setPublishError(
        e?.message ||
          'Failed to upload song to Vercel Blob Storage. Ensure BLOB_READ_WRITE_TOKEN is configured.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Song Details & Cover Art</h2>
              <p className="text-xs text-zinc-400">Change album cover, song name, or publish to all users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Cover Preview & Image Picker */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-zinc-950/60 border border-white/5">
            <img
              src={coverArt}
              alt="Cover preview"
              className="w-24 h-24 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
            />
            <div className="space-y-2">
              <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 cursor-pointer shadow-md shadow-cyan-500/20 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-zinc-400">
                Choose any photo from your phone or select from presets below
              </p>
            </div>
          </div>

          {/* Preset Cover Grid */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              Or Choose Preset Aesthetic Album Art:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COVERS.map((presetUrl, idx) => (
                <img
                  key={idx}
                  src={presetUrl}
                  alt={`Preset ${idx + 1}`}
                  onClick={() => setCoverArt(presetUrl)}
                  className={`w-full h-16 rounded-lg object-cover cursor-pointer border-2 transition-all hover:scale-105 ${
                    coverArt === presetUrl ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Edit Song Details Form */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Song Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Album / Category
                </label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Publish to Online Library Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-zinc-950 to-cyan-950/30 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Online Library me Publish Karein
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Online Streaming
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Is gaane ko online library me publish karne se ye cloud par save hoga aur AuraBeat ke Online tab me sabhi users ke liye instantly play hoga!
            </p>

            {publishError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
                ⚠️ {publishError}
              </div>
            )}

            <button
              onClick={handlePublishOnline}
              disabled={isPublishing || publishedSuccess}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Online Publish Ho Raha Hai...</span>
                </>
              ) : publishedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Successfully Published Online!</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Publish Online (Sabhi Users Ke Liye)</span>
                </>
              )}
            </button>

            {/* Optional Admin Passkey Config toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowVercelConfig(!showVercelConfig)}
                className="text-[10px] text-zinc-400 hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>⚙️ {showVercelConfig ? 'Hide' : 'Configure'} Admin Passkey (Optional)</span>
              </button>
              {showVercelConfig && (
                <div className="mt-2 p-2.5 rounded-lg bg-black/60 border border-white/10 space-y-2 animate-in fade-in">
                  <div>
                    <label className="text-[10px] text-zinc-400 block font-mono">
                      ADMIN_SECRET_KEY (Publishing Passkey):
                    </label>
                    <input
                      type="password"
                      placeholder="AuraBeatSecretKey26"
                      value={adminKeyInput}
                      onChange={(e) => setAdminKeyInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block font-mono">
                      BLOB_READ_WRITE_TOKEN (Optional override):
                    </label>
                    <input
                      type="password"
                      placeholder="vercel_blob_rw_..."
                      value={blobTokenInput}
                      onChange={(e) => setBlobTokenInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500">
                    Server environment me key aur token set hone par yahan daalne ki zaroorat nahi hai.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <div>
            {onDeleteSong && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Kya aap "${song.title}" ko permanently delete karna chahte hain?`)) {
                    onDeleteSong(song.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-red-500/20 cursor-pointer"
                title="App se gaana delete karein"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Song</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOnly}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
