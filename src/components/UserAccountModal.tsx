import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, LogIn, LogOut, HardDrive, BarChart2, ShieldCheck, X, Sparkles, Database } from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  offlineCount: number;
  onClearOfflineCache: () => void;
  accentColor?: string;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  offlineCount,
  onClearOfflineCache,
  accentColor = '#06b6d4',
}) => {
  const [name, setName] = useState(profile.name);
  const [emailInput, setEmailInput] = useState('music.enthusiast@aurabeat.app');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      name: name.trim() || 'Aura Listener',
      isLoggedIn: true,
    });
    setIsEditing(false);
  };

  const handleToggleLogin = () => {
    onUpdateProfile({
      ...profile,
      isLoggedIn: !profile.isLoggedIn,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">User Account & Cloud</h2>
              <p className="text-xs text-zinc-400">Profile, sync status & offline data storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="mt-5 p-5 rounded-2xl bg-zinc-950/70 border border-white/5 flex items-center space-x-4">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/50 shadow-md"
          />
          <div className="flex-1 truncate">
            {isEditing ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-2 py-1 bg-zinc-800 text-xs rounded text-white border border-cyan-500 focus:outline-none flex-1"
                />
                <button
                  onClick={handleSave}
                  className="px-2.5 py-1 bg-cyan-500 text-black text-xs font-bold rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white truncate">{profile.name}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <span className="text-xs text-zinc-400 block truncate">{emailInput}</span>
                <span className="inline-flex items-center space-x-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{profile.isLoggedIn ? 'VIP Hi-Fi Member' : 'Guest Listener'}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Listening Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Total Listened</span>
            <span className="text-lg font-bold font-mono text-cyan-400">
              {Math.round(profile.totalMinutesListened)}m
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Songs Played</span>
            <span className="text-lg font-bold font-mono text-indigo-400">
              {profile.songsPlayedCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Top Genre</span>
            <span className="text-xs font-bold text-pink-400 truncate block mt-1">
              {profile.favoriteGenre || 'Synthwave'}
            </span>
          </div>
        </div>

        {/* Offline Storage Cache Manager */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                IndexedDB Offline Storage
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400">{offlineCount} songs cached</span>
          </div>
          <p className="text-xs text-zinc-400">
            Downloaded songs and audio files are preserved locally in your browser for zero-data offline playback.
          </p>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
            <span className="text-[11px] text-zinc-500">Persistent Storage Active</span>
            <button
              onClick={onClearOfflineCache}
              disabled={offlineCount === 0}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
            >
              Clear Cached Files
            </button>
          </div>
        </div>

        {/* Account Auth toggle */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={handleToggleLogin}
            className="flex items-center space-x-2 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            {profile.isLoggedIn ? (
              <>
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Switch to Guest Mode</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Sign In / Connect Cloud Sync</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
