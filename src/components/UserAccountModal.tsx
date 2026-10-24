import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  HardDrive,
  Upload,
  Trash2,
  X,
  Sparkles,
  Music,
  Check,
  Disc,
  Clock,
  ShieldCheck,
  Camera,
  FolderOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  offlineCount: number;
  onClearOfflineCache: () => void;
  accentColor?: string;
  onOpenAdminPanel?: () => void;
  onOpenDeviceSync?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
];

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  offlineCount,
  onClearOfflineCache,
  accentColor = '#06b6d4',
  onOpenAdminPanel,
  onOpenDeviceSync,
}) => {
  const [userName, setUserName] = useState(profile.name || 'Aura Listener');
  const [userAvatar, setUserAvatar] = useState(profile.avatar || AVATAR_PRESETS[0]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: userName.trim() || 'Aura Listener',
      avatar: userAvatar,
      isLoggedIn: true,
    });
    setSaveSuccess(true);
    confetti({ particleCount: 30, spread: 60 });
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditingProfile(false);
    }, 1200);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setUserAvatar(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearCacheWithConfirm = async () => {
    if (window.confirm('Kya aap sabhi offline cached gaano ko clear karna chahte hain?')) {
      setClearingCache(true);
      try {
        await onClearOfflineCache();
      } finally {
        setClearingCache(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <HardDrive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Offline Library & Storage
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                100% Offline Music Player • Zero Login Friction
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

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Action 1: Auto-Sync Device Folders */}
          {onOpenDeviceSync && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-zinc-900 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Auto-Sync Device Folders</h4>
                    <p className="text-[11px] text-zinc-400">
                      Phone ke sabhi folders se gaane background me load karein
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeviceSync();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Action 2: Direct Upload Song to Storage */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-blue-950/40 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Upload Song to Storage</h4>
                  <p className="text-[11px] text-zinc-400">
                    Title, artist, album aur cover art ke sath upload karein
                  </p>
                </div>
              </div>

              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              )}
            </div>
          </div>

          {/* Storage & Offline Caching Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/5 space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Music className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Offline Tracks
                </span>
              </div>
              <p className="text-2xl font-black text-white">{offlineCount}</p>
              <p className="text-[10px] text-zinc-400">Saved in device IndexedDB</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/5 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400">
                <HardDrive className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Offline Mode
                </span>
              </div>
              <p className="text-lg font-bold text-emerald-300">Active</p>
              <p className="text-[10px] text-zinc-400">Plays without internet</p>
            </div>
          </div>

          {/* Player Persona / Local Profile */}
          <div className="p-4 rounded-2xl bg-zinc-800/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Music Persona (Local)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {isEditingProfile ? 'Cancel' : 'Edit Persona'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Enter your nickname..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-zinc-300">
                      Avatar Photo
                    </label>
                    <label className="text-[11px] text-cyan-400 hover:underline cursor-pointer flex items-center space-x-1">
                      <Camera className="w-3 h-3" />
                      <span>Custom Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="preset"
                        onClick={() => setUserAvatar(p)}
                        className={`w-full aspect-square rounded-xl object-cover cursor-pointer border-2 transition-transform hover:scale-105 ${
                          userAvatar === p
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                            : 'border-transparent opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  {saveSuccess ? 'Saved ✓' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="flex items-center space-x-3">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-400/30"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{userName}</h4>
                  <p className="text-xs text-zinc-400">Offline Music Explorer</p>
                </div>
              </div>
            )}
          </div>

          {/* Offline Cache Cleanup */}
          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 border-t border-white/5">
            <span>Free up local device storage</span>
            <button
              type="button"
              onClick={handleClearCacheWithConfirm}
              disabled={clearingCache}
              className="text-xs text-zinc-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
