import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  User,
  LogIn,
  LogOut,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Sparkles,
  HardDrive,
  Check,
  Upload,
  Camera,
  Image as ImageIcon,
  Music,
  Clock,
  Disc,
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
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  favoriteGenre: string;
  totalMinutesListened?: number;
  songsPlayedCount?: number;
  createdAt: number;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
];

const GENRES = [
  'Synthwave',
  'EDM / Club',
  'Bollywood',
  'Hip-Hop',
  'Pop',
  'Rock',
  'Lo-Fi / Chill',
  'Punjabi',
];

const STORAGE_USERS_KEY = 'aurabeat_users_db';

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'demo_user_1',
      name: 'Aura Music Master',
      email: 'demo@aurabeat.app',
      password: 'password123',
      avatar: AVATAR_PRESETS[0],
      favoriteGenre: 'Synthwave',
      totalMinutesListened: 142,
      songsPlayedCount: 38,
      createdAt: Date.now() - 86400000 * 30,
    },
  ];
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  offlineCount,
  onClearOfflineCache,
  accentColor = '#06b6d4',
  onOpenAdminPanel,
}) => {
  // Tab state: 'signin' | 'signup' | 'profile'
  const [tab, setTab] = useState<'signin' | 'signup' | 'profile'>(
    profile.isLoggedIn ? 'profile' : 'signin'
  );

  // Sign In inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatar, setRegAvatar] = useState(AVATAR_PRESETS[0]);
  const [regGenre, setRegGenre] = useState('Synthwave');

  // Edit Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email || '');
  const [editGenre, setEditGenre] = useState(profile.favoriteGenre || 'Synthwave');
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(profile.isLoggedIn ? 'profile' : 'signin');
      setEditName(profile.name);
      setEditEmail(profile.email || '');
      setEditGenre(profile.favoriteGenre || 'Synthwave');
      setEditAvatar(profile.avatar);
      setIsChangingPhoto(false);
      setIsEditingProfile(false);
      setStatusMsg(null);
    }
  }, [isOpen, profile.isLoggedIn, profile.name, profile.email, profile.avatar, profile.favoriteGenre]);

  if (!isOpen) return null;

  const showNotification = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // 1. Handle Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail) {
      showNotification('Kripya apna email ya username enter karein', true);
      return;
    }
    if (!cleanPass) {
      showNotification('Kripya apna password enter karein', true);
      return;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find(
      (a) => a.email.toLowerCase() === cleanEmail || a.name.toLowerCase() === cleanEmail
    );

    if (existing) {
      if (existing.password && existing.password !== cleanPass) {
        showNotification('Password galat hai. Kripya dobara try karein', true);
        return;
      }

      // Log in with existing account
      const updated: UserProfile = {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        avatar: existing.avatar,
        favoriteGenre: existing.favoriteGenre,
        totalMinutesListened: existing.totalMinutesListened || profile.totalMinutesListened,
        songsPlayedCount: existing.songsPlayedCount || profile.songsPlayedCount,
        isLoggedIn: true,
        joinedAt: existing.createdAt,
      };

      onUpdateProfile(updated);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      showNotification(`Welcome back, ${existing.name}! Logged in successfully.`);
      setTab('profile');
    } else {
      // Auto-register new account with these credentials
      const newAcc: StoredAccount = {
        id: 'usr_' + Date.now(),
        name: cleanEmail.split('@')[0] || 'Music Lover',
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@aurabeat.app`,
        password: cleanPass,
        avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
        favoriteGenre: 'Synthwave',
        totalMinutesListened: profile.totalMinutesListened,
        songsPlayedCount: profile.songsPlayedCount,
        createdAt: Date.now(),
      };

      accounts.push(newAcc);
      saveStoredAccounts(accounts);

      const updated: UserProfile = {
        id: newAcc.id,
        name: newAcc.name,
        email: newAcc.email,
        avatar: newAcc.avatar,
        favoriteGenre: newAcc.favoriteGenre,
        totalMinutesListened: profile.totalMinutesListened,
        songsPlayedCount: profile.songsPlayedCount,
        isLoggedIn: true,
        joinedAt: newAcc.createdAt,
      };

      onUpdateProfile(updated);
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
      showNotification(`Aapka account create ho gaya aur aap login ho gaye!`);
      setTab('profile');
    }
  };

  // 2. Handle Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPass = regPassword.trim();

    if (!cleanName) {
      showNotification('Kripya apna poora naam enter karein', true);
      return;
    }
    if (!cleanEmail) {
      showNotification('Kripya apna email address enter karein', true);
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      showNotification('Password kam se kam 4 characters ka hona chahiye', true);
      return;
    }

    const accounts = getStoredAccounts();
    const alreadyExists = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (alreadyExists) {
      showNotification('Is email se account already bana hua hai. Kripya Sign In karein.', true);
      setTab('signin');
      setLoginEmail(cleanEmail);
      return;
    }

    const newAcc: StoredAccount = {
      id: 'usr_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      avatar: regAvatar,
      favoriteGenre: regGenre,
      totalMinutesListened: profile.totalMinutesListened,
      songsPlayedCount: profile.songsPlayedCount,
      createdAt: Date.now(),
    };

    accounts.push(newAcc);
    saveStoredAccounts(accounts);

    const updated: UserProfile = {
      id: newAcc.id,
      name: newAcc.name,
      email: newAcc.email,
      avatar: newAcc.avatar,
      favoriteGenre: newAcc.favoriteGenre,
      totalMinutesListened: profile.totalMinutesListened,
      songsPlayedCount: profile.songsPlayedCount,
      isLoggedIn: true,
      joinedAt: newAcc.createdAt,
    };

    onUpdateProfile(updated);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    showNotification(`Aapka account safaltapoorvak ban gaya! Welcome ${newAcc.name}!`);
    setTab('profile');
  };

  // 3. Quick Demo Login
  const handleDemoLogin = () => {
    const demoAcc: UserProfile = {
      id: 'demo_user_1',
      name: 'Aura Music Master',
      email: 'music.enthusiast@aurabeat.app',
      avatar: AVATAR_PRESETS[0],
      favoriteGenre: 'Synthwave / Bass',
      totalMinutesListened: Math.max(142, profile.totalMinutesListened),
      songsPlayedCount: Math.max(38, profile.songsPlayedCount),
      isLoggedIn: true,
      joinedAt: Date.now() - 86400000 * 30,
    };
    onUpdateProfile(demoAcc);
    confetti({ particleCount: 30, spread: 60 });
    showNotification('1-Tap Demo Account se Login ho gaye!');
    setTab('profile');
  };

  // 4. Handle Logout
  const handleLogout = () => {
    onUpdateProfile({
      ...profile,
      isLoggedIn: false,
    });
    showNotification('Aap logout ho gaye hain.');
    setTab('signin');
  };

  // 5. Handle Save Edited Profile
  const handleSaveProfile = () => {
    const updated: UserProfile = {
      ...profile,
      name: editName.trim() || profile.name,
      email: editEmail.trim() || profile.email,
      favoriteGenre: editGenre || profile.favoriteGenre,
      avatar: editAvatar || profile.avatar,
      isLoggedIn: true,
    };

    onUpdateProfile(updated);

    // Update in local database
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === profile.id || a.email === profile.email);
    if (idx !== -1) {
      accounts[idx] = {
        ...accounts[idx],
        name: updated.name,
        email: updated.email || accounts[idx].email,
        favoriteGenre: updated.favoriteGenre,
        avatar: updated.avatar,
      };
      saveStoredAccounts(accounts);
    }

    setIsEditingProfile(false);
    showNotification('Profile details update ho gayi!');
  };

  // Direct avatar update (saves immediately across active profile, IndexedDB & localStorage)
  const handleUpdateAvatarDirect = (newAvatarUrl: string) => {
    const updated: UserProfile = {
      ...profile,
      avatar: newAvatarUrl,
    };
    onUpdateProfile(updated);
    setEditAvatar(newAvatarUrl);

    // Also update stored accounts in localStorage
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === profile.id || a.email === profile.email);
    if (idx !== -1) {
      accounts[idx].avatar = newAvatarUrl;
      saveStoredAccounts(accounts);
    }

    confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });
    showNotification('Profile photo safaltapoorvak badal di gayi!');
    setIsChangingPhoto(false);
  };

  // Handle custom photo upload from gallery or camera
  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can pick the same file again if desired
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (tab === 'signup') {
          setRegAvatar(dataUrl);
        } else if (tab === 'profile' && profile.isLoggedIn) {
          handleUpdateAvatarDirect(dataUrl);
        } else {
          setEditAvatar(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-6 text-white max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="AuraBeat Logo"
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 border border-white/10 shrink-0"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {tab === 'profile' ? 'User Profile & Cloud' : 'Account Login & Sign Up'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {tab === 'profile'
                  ? 'Manage profile, listening stats & offline cache'
                  : 'Sign in to sync your favorites, playlists & custom tracks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Notice */}
        {statusMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200 ${
              statusMsg.isError
                ? 'bg-red-950/80 border border-red-500/40 text-red-200'
                : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="ml-2 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-black/50 rounded-2xl border border-white/10 mt-4">
          {profile.isLoggedIn && (
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                tab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              tab === 'signin'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In (लॉग इन)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              tab === 'signup'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up (रजिस्टर)</span>
          </button>
        </div>

        {/* ========================================================
            VIEW 1: SIGN IN (लॉग इन)
            ======================================================== */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Email Address ya Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="demo@aurabeat.app"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Apna password enter karein"
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-zinc-800 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Remember me on this mobile</span>
              </label>
            </div>

            {/* Sign In Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to AuraBeat</span>
            </button>

            {/* Quick 1-Tap Demo Login Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Tap Demo Login (Direct bina password ke)</span>
            </button>

            {/* Switch to Sign Up */}
            <div className="text-center pt-2 text-xs text-zinc-400">
              Naya account banana chahte hain?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign Up Here
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            VIEW 2: SIGN UP (नया अकाउंट)
            ======================================================== */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Aapka Poora Naam (Full Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul@gmail.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Password (Kam se kam 4 akshar)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Secure password banayein"
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Choose Profile Avatar
              </label>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {AVATAR_PRESETS.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt={`Avatar ${idx}`}
                    onClick={() => setRegAvatar(av)}
                    className={`w-11 h-11 rounded-full object-cover cursor-pointer border-2 transition-all shrink-0 ${
                      regAvatar === av
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}

                <label className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-dashed border-white/20 hover:border-cyan-400 flex items-center justify-center cursor-pointer shrink-0 text-zinc-400 hover:text-white transition-colors" title="Upload Custom Photo">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Favorite Genre */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Favorite Music Genre
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setRegGenre(g)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold truncate transition-all ${
                      regGenre === g
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Up Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>Create Free Account & Sign In</span>
            </button>

            {/* Switch to Sign In */}
            <div className="text-center pt-1 text-xs text-zinc-400">
              Pehle se account hai?{' '}
              <button
                type="button"
                onClick={() => setTab('signin')}
                className="text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign In Here
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            VIEW 3: ACTIVE PROFILE & STATS (जब यूजर लॉगिन हो)
            ======================================================== */}
        {tab === 'profile' && profile.isLoggedIn && (
          <div className="mt-4 space-y-4">
            {/* Profile Header Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 flex items-center space-x-3.5">
              <div className="relative shrink-0">
                <img
                  src={profile.avatar || '/logo.png'}
                  alt={profile.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={() => setIsChangingPhoto(!isChangingPhoto)}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30 hover:scale-105 transition-all border border-zinc-900 cursor-pointer"
                  title="Profile Photo Badlein (Change Photo)"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white truncate">{profile.name}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      if (isChangingPhoto) setIsChangingPhoto(false);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    {isEditingProfile ? 'Close' : 'Edit Info'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {profile.email || 'music.member@aurabeat.app'}
                </p>
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPhoto(!isChangingPhoto);
                      if (isEditingProfile) setIsEditingProfile(false);
                    }}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3 h-3 text-cyan-400" />
                    <span>{isChangingPhoto ? 'फ़ोटो विकल्प बंद करें' : 'फ़ोटो बदलें (Change Photo)'}</span>
                  </button>

                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Hi-Fi Member</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Change Profile Photo Drawer */}
            {isChangingPhoto && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-cyan-500/40 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Profile Photo Badlein (Change Avatar)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingPhoto(false)}
                    className="text-[11px] text-zinc-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Upload Options: Gallery & Camera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Phone Gallery / Device Files */}
                  <label className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer transition-all active:scale-98">
                    <Upload className="w-4 h-4" />
                    <span>गैलरी से फ़ोटो चुनें (Gallery)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* 2. Live Camera / Selfie */}
                  <label className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-98">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>कैमरे से फ़ोटो लें (Camera)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Avatars & AuraBeat Logo */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                    Ya Preset Avatar Chunein (Tap to apply):
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
                    {/* AuraBeat Brand Squircle Logo */}
                    <div
                      onClick={() => handleUpdateAvatarDirect('/logo.png')}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 aspect-square p-0.5 bg-black ${
                        profile.avatar === '/logo.png'
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      title="AuraBeat Logo Squircle"
                    >
                      <img src="/logo.png" alt="AuraBeat Logo" className="w-full h-full object-cover rounded-lg" />
                      {profile.avatar === '/logo.png' && (
                        <span className="absolute top-0.5 right-0.5 bg-cyan-500 text-black rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {AVATAR_PRESETS.map((av, idx) => {
                      const isSelected = profile.avatar === av;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleUpdateAvatarDirect(av)}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 aspect-square ${
                            isSelected
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                              : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                          title={`Preset Avatar ${idx + 1}`}
                        >
                          <img src={av} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-0.5 right-0.5 bg-cyan-500 text-black rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Inline Edit Profile Drawer */}
            {isEditingProfile && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-cyan-500/30 space-y-3 animate-in fade-in duration-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Edit Profile Details
                </h4>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Select Avatar / Upload Custom Photo
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {/* AuraBeat Brand Logo */}
                    <img
                      src="/logo.png"
                      alt="AuraBeat Logo"
                      onClick={() => setEditAvatar('/logo.png')}
                      className={`w-9 h-9 rounded-xl object-cover cursor-pointer border-2 transition-all shrink-0 p-0.5 bg-black ${
                        editAvatar === '/logo.png' ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105' : 'border-white/10 opacity-70'
                      }`}
                      title="AuraBeat Logo"
                    />

                    {AVATAR_PRESETS.map((av, idx) => (
                      <img
                        key={idx}
                        src={av}
                        alt={`Preset ${idx}`}
                        onClick={() => setEditAvatar(av)}
                        className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all shrink-0 ${
                          editAvatar === av ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105' : 'border-white/10 opacity-70'
                        }`}
                      />
                    ))}

                    <label
                      className="w-9 h-9 rounded-xl bg-zinc-800 border-2 border-dashed border-white/20 hover:border-cyan-400 flex items-center justify-center cursor-pointer shrink-0 text-zinc-400 hover:text-white transition-colors"
                      title="Upload Custom Photo from Device"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-md shadow-cyan-500/20"
                  >
                    Save Details
                  </button>
                </div>
              </div>
            )}

            {/* Listening Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Listened</span>
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-cyan-400 block mt-0.5">
                  {Math.round(profile.totalMinutesListened)}m
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block flex items-center justify-center space-x-1">
                  <Disc className="w-3 h-3 text-indigo-400" />
                  <span>Played</span>
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-indigo-400 block mt-0.5">
                  {profile.songsPlayedCount}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 text-center">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block flex items-center justify-center space-x-1">
                  <Music className="w-3 h-3 text-pink-400" />
                  <span>Genre</span>
                </span>
                <span className="text-xs font-bold text-pink-400 truncate block mt-1">
                  {profile.favoriteGenre || 'Synthwave'}
                </span>
              </div>
            </div>

            {/* Offline IndexedDB Cache Section */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Offline Device Storage
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400">{offlineCount} songs cached</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Aapke phone me saved MP3 audio blobs bina internet ke 100% offline playback provide karte hain.
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-500">Persistent Storage Active</span>
                <button
                  type="button"
                  onClick={onClearOfflineCache}
                  disabled={offlineCount === 0}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 cursor-pointer font-semibold"
                >
                  Clear Cached Files
                </button>
              </div>
            </div>

            {/* Admin Control Panel Access */}
            {onOpenAdminPanel && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 hover:from-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Portal (Publish & Manage Online Songs)</span>
                </button>
              </div>
            )}

            {/* Account Switch & Logout Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out (लॉग आउट)</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('signin')}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Done */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
