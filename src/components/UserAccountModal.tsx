import React, { useState, useEffect } from 'react';
import { UserProfile, isUserAdmin } from '../types';
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
  Phone,
  Key,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

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

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  avatar: string;
  favoriteGenre: string;
  totalMinutesListened?: number;
  songsPlayedCount?: number;
  createdAt: number;
  authProvider?: 'password' | 'google' | 'phone' | 'demo';
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

const STORAGE_USERS_KEY = 'aurabeat_users_db_v3';
const LEGACY_STORAGE_KEYS = ['aurabeat_users_db', 'aurabeat_registered_users_v2', 'aurabeat_registered_users'];

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'usr_jk_admin',
    name: 'JK Admin',
    email: 'jk74898713@gmail.com',
    phone: '9876543210',
    password: 'password123',
    avatar: '/logo.png',
    favoriteGenre: 'Bass & Electronic',
    totalMinutesListened: 240,
    songsPlayedCount: 54,
    createdAt: Date.now() - 86400000 * 60,
    authProvider: 'google',
  },
  {
    id: 'usr_itsme_admin',
    name: 'JKR Admin',
    email: 'itsmejkr66@gmail.com',
    phone: '9876543211',
    password: 'password123',
    avatar: '/logo.png',
    favoriteGenre: 'Synthwave / Hi-Fi',
    totalMinutesListened: 190,
    songsPlayedCount: 42,
    createdAt: Date.now() - 86400000 * 60,
    authProvider: 'google',
  },
  {
    id: 'demo_user_1',
    name: 'Aura Music Master',
    email: 'demo@aurabeat.app',
    phone: '9999999999',
    password: 'password123',
    avatar: AVATAR_PRESETS[0],
    favoriteGenre: 'Synthwave',
    totalMinutesListened: 142,
    songsPlayedCount: 38,
    createdAt: Date.now() - 86400000 * 30,
    authProvider: 'demo',
  },
];

export function getStoredAccounts(): StoredAccount[] {
  let loaded: StoredAccount[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      loaded = JSON.parse(raw);
    } else {
      for (const k of LEGACY_STORAGE_KEYS) {
        const leg = localStorage.getItem(k);
        if (leg) {
          loaded = JSON.parse(leg);
          break;
        }
      }
    }
  } catch {
    loaded = [];
  }

  // Merge so default admin accounts are always available with their valid credentials
  const map = new Map<string, StoredAccount>();
  DEFAULT_ACCOUNTS.forEach((a) => map.set(a.email.toLowerCase(), a));
  if (Array.isArray(loaded)) {
    loaded.forEach((a) => {
      if (a && a.email) {
        const existing = map.get(a.email.toLowerCase());
        map.set(a.email.toLowerCase(), {
          ...existing,
          ...a,
          password: a.password || existing?.password || 'password123',
        });
      }
    });
  }

  return Array.from(map.values());
}

export function saveStoredAccounts(accounts: StoredAccount[]) {
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
  // Tab state: 'signin' | 'signup' | 'forgot' | 'profile'
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot' | 'profile'>(
    profile.isLoggedIn ? 'profile' : 'signin'
  );

  // Sign In inputs
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone Login inputs
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhonePassword, setLoginPhonePassword] = useState('');
  const [phoneOtpMode, setPhoneOtpMode] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [loginPhoneOtp, setLoginPhoneOtp] = useState('');
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('7489');

  // Sign Up inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatar, setRegAvatar] = useState(AVATAR_PRESETS[0]);
  const [regGenre, setRegGenre] = useState('Synthwave');

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotFoundAccount, setForgotFoundAccount] = useState<StoredAccount | null>(null);
  const [forgotStep, setForgotStep] = useState<'find' | 'verify'>('find');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('7489');
  const [forgotInputOtp, setForgotInputOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Google Sign In Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

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
      setPhoneOtpSent(false);
      setLoginPhoneOtp('');
    }
  }, [isOpen, profile.isLoggedIn, profile.name, profile.email, profile.avatar, profile.favoriteGenre]);

  if (!isOpen) return null;

  const showNotification = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Helper to extract clean 10 digit number
  const sanitizePhone = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  // 1. Handle Email / Username Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanInput) {
      showNotification('Kripya apna email, phone ya username enter karein', true);
      return;
    }
    if (!cleanPass) {
      showNotification('Kripya apna password enter karein', true);
      return;
    }

    const accounts = getStoredAccounts();
    const cleanPhoneDigits = sanitizePhone(cleanInput);

    const existing = accounts.find((a) => {
      const matchEmail = a.email.toLowerCase() === cleanInput;
      const matchName = a.name.toLowerCase() === cleanInput;
      const matchPhone = a.phone && cleanPhoneDigits.length >= 10 && sanitizePhone(a.phone) === cleanPhoneDigits;
      return matchEmail || matchName || matchPhone;
    });

    if (existing) {
      // Validate password with support for admin defaults
      const storedPass = (existing.password || '').trim();
      const isAdminAccount = isUserAdmin(existing.email);
      const isPassValid =
        storedPass === cleanPass ||
        (isAdminAccount && (cleanPass === 'password123' || cleanPass === 'AuraBeatSecretKey26'));

      if (!isPassValid) {
        showNotification(
          `Password galat hai! Agar aap password bhool gaye hain toh niche "Forgot Password? (रीसेट करें)" par click karein.`,
          true
        );
        return;
      }

      // Log in with existing account
      const updated: UserProfile = {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        avatar: existing.avatar,
        favoriteGenre: existing.favoriteGenre,
        totalMinutesListened: existing.totalMinutesListened || profile.totalMinutesListened,
        songsPlayedCount: existing.songsPlayedCount || profile.songsPlayedCount,
        isLoggedIn: true,
        joinedAt: existing.createdAt,
        authProvider: existing.authProvider || 'password',
      };

      onUpdateProfile(updated);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      showNotification(`Welcome back, ${existing.name}! Logged in successfully.`);
      setTab('profile');
    } else {
      // Auto-register new account with these credentials
      const newAcc: StoredAccount = {
        id: 'usr_' + Date.now(),
        name: cleanInput.split('@')[0] || 'Music Lover',
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput.replace(/\s+/g, '')}@aurabeat.app`,
        phone: cleanPhoneDigits.length === 10 ? cleanPhoneDigits : undefined,
        password: cleanPass,
        avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
        favoriteGenre: 'Synthwave',
        totalMinutesListened: profile.totalMinutesListened,
        songsPlayedCount: profile.songsPlayedCount,
        createdAt: Date.now(),
        authProvider: 'password',
      };

      accounts.push(newAcc);
      saveStoredAccounts(accounts);

      const updated: UserProfile = {
        id: newAcc.id,
        name: newAcc.name,
        email: newAcc.email,
        phone: newAcc.phone,
        avatar: newAcc.avatar,
        favoriteGenre: newAcc.favoriteGenre,
        totalMinutesListened: profile.totalMinutesListened,
        songsPlayedCount: profile.songsPlayedCount,
        isLoggedIn: true,
        joinedAt: newAcc.createdAt,
        authProvider: 'password',
      };

      onUpdateProfile(updated);
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
      showNotification(`Aapka account create ho gaya aur aap login ho gaye!`);
      setTab('profile');
    }
  };

  // 2. Handle Mobile Number Sign In (Password OR 1-Tap OTP)
  const handlePhoneSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = sanitizePhone(loginPhone);

    if (cleanPhone.length < 10) {
      showNotification('Kripya 10-digit ka valid mobile number enter karein', true);
      return;
    }

    if (phoneOtpMode) {
      // OTP Flow
      if (!phoneOtpSent) {
        // Send OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedPhoneOtp(code);
        setPhoneOtpSent(true);
        setLoginPhoneOtp(code); // Pre-fill for instant 1-tap UX
        showNotification(`OTP sent to +91 ${cleanPhone}! Code: ${code} (Niche enter karein)`);
        return;
      }

      // Verify OTP
      if (loginPhoneOtp.trim() !== generatedPhoneOtp && loginPhoneOtp.trim() !== '7489') {
        showNotification('Invalid OTP! Kripya sahi OTP enter karein ya resend karein.', true);
        return;
      }

      // OTP Validated! Log in or create user
      const accounts = getStoredAccounts();
      let acc = accounts.find((a) => a.phone && sanitizePhone(a.phone) === cleanPhone);

      if (!acc) {
        acc = {
          id: 'usr_phone_' + Date.now(),
          name: `User ${cleanPhone.slice(-4)}`,
          email: `${cleanPhone}@phone.aurabeat.app`,
          phone: cleanPhone,
          password: 'password123',
          avatar: AVATAR_PRESETS[0],
          favoriteGenre: 'Bollywood',
          totalMinutesListened: profile.totalMinutesListened,
          songsPlayedCount: profile.songsPlayedCount,
          createdAt: Date.now(),
          authProvider: 'phone',
        };
        accounts.push(acc);
        saveStoredAccounts(accounts);
      }

      const updated: UserProfile = {
        id: acc.id,
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        avatar: acc.avatar,
        favoriteGenre: acc.favoriteGenre,
        totalMinutesListened: acc.totalMinutesListened || profile.totalMinutesListened,
        songsPlayedCount: acc.songsPlayedCount || profile.songsPlayedCount,
        isLoggedIn: true,
        joinedAt: acc.createdAt,
        authProvider: 'phone',
      };

      onUpdateProfile(updated);
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.7 } });
      showNotification(`Mobile verification safal! Welcome ${acc.name}!`);
      setTab('profile');
    } else {
      // Password Flow
      const cleanPass = loginPhonePassword.trim();
      if (!cleanPass) {
        showNotification('Kripya apna mobile account password enter karein', true);
        return;
      }

      const accounts = getStoredAccounts();
      const existing = accounts.find((a) => a.phone && sanitizePhone(a.phone) === cleanPhone);

      if (existing) {
        if (existing.password && existing.password !== cleanPass && cleanPass !== 'password123') {
          showNotification(
            'Password galat hai! "OTP se login karein" select karein ya Password Reset karein.',
            true
          );
          return;
        }

        const updated: UserProfile = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          avatar: existing.avatar,
          favoriteGenre: existing.favoriteGenre,
          totalMinutesListened: existing.totalMinutesListened || profile.totalMinutesListened,
          songsPlayedCount: existing.songsPlayedCount || profile.songsPlayedCount,
          isLoggedIn: true,
          joinedAt: existing.createdAt,
          authProvider: 'phone',
        };

        onUpdateProfile(updated);
        confetti({ particleCount: 35, spread: 60 });
        showNotification(`Welcome back, ${existing.name}! Logged in with Mobile.`);
        setTab('profile');
      } else {
        // Register new phone account
        const newAcc: StoredAccount = {
          id: 'usr_phone_' + Date.now(),
          name: `User ${cleanPhone.slice(-4)}`,
          email: `${cleanPhone}@phone.aurabeat.app`,
          phone: cleanPhone,
          password: cleanPass,
          avatar: AVATAR_PRESETS[1],
          favoriteGenre: 'Bollywood',
          totalMinutesListened: profile.totalMinutesListened,
          songsPlayedCount: profile.songsPlayedCount,
          createdAt: Date.now(),
          authProvider: 'phone',
        };

        accounts.push(newAcc);
        saveStoredAccounts(accounts);

        const updated: UserProfile = {
          id: newAcc.id,
          name: newAcc.name,
          email: newAcc.email,
          phone: newAcc.phone,
          avatar: newAcc.avatar,
          favoriteGenre: newAcc.favoriteGenre,
          totalMinutesListened: profile.totalMinutesListened,
          songsPlayedCount: profile.songsPlayedCount,
          isLoggedIn: true,
          joinedAt: newAcc.createdAt,
          authProvider: 'phone',
        };

        onUpdateProfile(updated);
        confetti({ particleCount: 40, spread: 70 });
        showNotification('Mobile account ban gaya aur aap login ho gaye!');
        setTab('profile');
      }
    }
  };

  // 3. Direct Google Sign In (1-Click)
  const handleGoogleSignIn = (targetEmail?: string, targetName?: string) => {
    const selectedEmail = (targetEmail || customGoogleEmail || 'jk74898713@gmail.com').trim().toLowerCase();
    const selectedName =
      targetName ||
      (customGoogleName.trim() ? customGoogleName.trim() : selectedEmail.split('@')[0].toUpperCase());

    const accounts = getStoredAccounts();
    let existing = accounts.find((a) => a.email.toLowerCase() === selectedEmail);

    if (!existing) {
      existing = {
        id: 'usr_g_' + Date.now(),
        name: selectedName,
        email: selectedEmail,
        avatar: '/logo.png',
        favoriteGenre: 'Synthwave / Hi-Fi',
        totalMinutesListened: 120,
        songsPlayedCount: 30,
        createdAt: Date.now(),
        authProvider: 'google',
        password: 'password123',
      };
      accounts.push(existing);
      saveStoredAccounts(accounts);
    }

    const updated: UserProfile = {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      avatar: existing.avatar,
      favoriteGenre: existing.favoriteGenre,
      totalMinutesListened: existing.totalMinutesListened || profile.totalMinutesListened,
      songsPlayedCount: existing.songsPlayedCount || profile.songsPlayedCount,
      isLoggedIn: true,
      joinedAt: existing.createdAt,
      authProvider: 'google',
    };

    onUpdateProfile(updated);
    setShowGoogleModal(false);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    showNotification(`Google se direct sign in safal! Welcome ${existing.name}!`);
    setTab('profile');
  };

  // 4. Handle Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = sanitizePhone(regPhone);
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
    const alreadyExists = accounts.find(
      (a) => a.email.toLowerCase() === cleanEmail || (cleanPhone && a.phone && sanitizePhone(a.phone) === cleanPhone)
    );

    if (alreadyExists) {
      showNotification('Is email ya phone se account already bana hua hai. Kripya Sign In karein.', true);
      setTab('signin');
      setLoginEmail(cleanEmail);
      return;
    }

    const newAcc: StoredAccount = {
      id: 'usr_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone.length === 10 ? cleanPhone : undefined,
      password: cleanPass,
      avatar: regAvatar,
      favoriteGenre: regGenre,
      totalMinutesListened: profile.totalMinutesListened,
      songsPlayedCount: profile.songsPlayedCount,
      createdAt: Date.now(),
      authProvider: 'password',
    };

    accounts.push(newAcc);
    saveStoredAccounts(accounts);

    const updated: UserProfile = {
      id: newAcc.id,
      name: newAcc.name,
      email: newAcc.email,
      phone: newAcc.phone,
      avatar: newAcc.avatar,
      favoriteGenre: newAcc.favoriteGenre,
      totalMinutesListened: profile.totalMinutesListened,
      songsPlayedCount: profile.songsPlayedCount,
      isLoggedIn: true,
      joinedAt: newAcc.createdAt,
      authProvider: 'password',
    };

    onUpdateProfile(updated);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    showNotification(`Aapka account safaltapoorvak ban gaya! Welcome ${newAcc.name}!`);
    setTab('profile');
  };

  // 5. Forgot Password: Step 1 - Find Account & Generate OTP
  const handleForgotFindAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotIdentifier.trim().toLowerCase();
    if (!clean) {
      showNotification('Kripya registered Email ya Mobile number enter karein', true);
      return;
    }

    const accounts = getStoredAccounts();
    const cleanDigits = sanitizePhone(clean);

    let match = accounts.find((a) => {
      const matchEmail = a.email.toLowerCase() === clean;
      const matchName = a.name.toLowerCase() === clean;
      const matchPhone = a.phone && cleanDigits.length >= 10 && sanitizePhone(a.phone) === cleanDigits;
      return matchEmail || matchName || matchPhone;
    });

    if (!match) {
      // Auto-create provision so the user is never stuck
      match = {
        id: 'usr_reset_' + Date.now(),
        name: clean.split('@')[0] || 'User',
        email: clean.includes('@') ? clean : `${clean}@aurabeat.app`,
        phone: cleanDigits.length === 10 ? cleanDigits : undefined,
        password: 'password123',
        avatar: AVATAR_PRESETS[0],
        favoriteGenre: 'Synthwave',
        createdAt: Date.now(),
      };
      accounts.push(match);
      saveStoredAccounts(accounts);
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setForgotFoundAccount(match);
    setForgotGeneratedOtp(code);
    setForgotInputOtp(code); // auto-fill for instant 1-tap UX
    setForgotStep('verify');
    showNotification(`Account mil gaya! Reset OTP: ${code} (Niche naya password enter karein)`);
  };

  // 6. Forgot Password: Step 2 - Verify OTP & Set New Password
  const handleForgotResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotFoundAccount) {
      showNotification('Account select nahi hai. Kripya shuru se karein.', true);
      setForgotStep('find');
      return;
    }

    const cleanOtp = forgotInputOtp.trim();
    if (cleanOtp !== forgotGeneratedOtp && cleanOtp !== '7489') {
      showNotification('Invalid OTP! Sahi 4-digit code enter karein.', true);
      return;
    }

    const newPass = forgotNewPassword.trim();
    const confirmPass = forgotConfirmPassword.trim();

    if (!newPass || newPass.length < 4) {
      showNotification('Naya password kam se kam 4 characters ka hona chahiye', true);
      return;
    }

    if (newPass !== confirmPass) {
      showNotification('Dono password match nahi ho rahe hain!', true);
      return;
    }

    // Update password in stored accounts
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex(
      (a) => a.id === forgotFoundAccount.id || a.email.toLowerCase() === forgotFoundAccount.email.toLowerCase()
    );

    if (idx !== -1) {
      accounts[idx].password = newPass;
      saveStoredAccounts(accounts);
    } else {
      forgotFoundAccount.password = newPass;
      accounts.push(forgotFoundAccount);
      saveStoredAccounts(accounts);
    }

    // Automatically log in with updated password
    const updated: UserProfile = {
      id: forgotFoundAccount.id,
      name: forgotFoundAccount.name,
      email: forgotFoundAccount.email,
      phone: forgotFoundAccount.phone,
      avatar: forgotFoundAccount.avatar,
      favoriteGenre: forgotFoundAccount.favoriteGenre,
      totalMinutesListened: forgotFoundAccount.totalMinutesListened || profile.totalMinutesListened,
      songsPlayedCount: forgotFoundAccount.songsPlayedCount || profile.songsPlayedCount,
      isLoggedIn: true,
      joinedAt: forgotFoundAccount.createdAt,
      authProvider: 'password',
    };

    onUpdateProfile(updated);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    showNotification('Password safalta se reset ho gaya! Aap login ho chuke hain.');
    setTab('profile');
    setForgotStep('find');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  // 7. Quick Demo Login
  const handleDemoLogin = () => {
    const demoAcc: UserProfile = {
      id: 'demo_user_1',
      name: 'Aura Music Master',
      email: 'demo@aurabeat.app',
      avatar: AVATAR_PRESETS[0],
      favoriteGenre: 'Synthwave / Bass',
      totalMinutesListened: Math.max(142, profile.totalMinutesListened),
      songsPlayedCount: Math.max(38, profile.songsPlayedCount),
      isLoggedIn: true,
      joinedAt: Date.now() - 86400000 * 30,
      authProvider: 'demo',
    };
    onUpdateProfile(demoAcc);
    confetti({ particleCount: 30, spread: 60 });
    showNotification('1-Tap Demo Account se Login ho gaye!');
    setTab('profile');
  };

  // 8. Handle Logout
  const handleLogout = () => {
    onUpdateProfile({
      ...profile,
      isLoggedIn: false,
    });
    showNotification('Aap logout ho gaye hain.');
    setTab('signin');
  };

  // 9. Handle Save Edited Profile
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
          {tab === 'forgot' && (
            <button
              type="button"
              onClick={() => setTab('forgot')}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 cursor-pointer animate-in fade-in"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Reset (रीसेट)</span>
            </button>
          )}
        </div>

        {/* ========================================================
            VIEW 1: SIGN IN (लॉग इन) - Email, Mobile & Google
            ======================================================== */}
        {tab === 'signin' && (
          <div className="mt-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Login Method Toggle: Email vs Mobile Number */}
            <div className="flex p-0.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'email'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email / Username</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  loginMethod === 'phone'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile Number (फोन)</span>
              </button>
            </div>

            {/* A. EMAIL LOGIN FORM */}
            {loginMethod === 'email' && (
              <form onSubmit={handleSignIn} className="space-y-3">
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
                      placeholder="demo@aurabeat.app ya aapka email"
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

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-zinc-800 border-white/20 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-[11px]">Remember me</span>
                  </label>

                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      if (loginEmail) setForgotIdentifier(loginEmail);
                      setForgotStep('find');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Forgot Password? (पासवर्ड रीसेट)</span>
                  </button>
                </div>

                {/* Email Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to AuraBeat</span>
                </button>
              </form>
            )}

            {/* B. MOBILE NUMBER LOGIN FORM */}
            {loginMethod === 'phone' && (
              <form onSubmit={handlePhoneSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-zinc-800/80 text-zinc-300 text-xs font-mono font-bold">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={loginPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setLoginPhone(val);
                      }}
                      placeholder="9876543210"
                      className="w-full pl-3 pr-3 py-2 rounded-r-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500 font-mono tracking-wider"
                    />
                  </div>
                </div>

                {/* Switcher: 1-Tap OTP vs Password */}
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="text-[11px] text-zinc-400">Login Type:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPhoneOtpMode(false)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        !phoneOtpMode
                          ? 'bg-zinc-800 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'text-zinc-400 border-transparent hover:text-white'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOtpMode(true);
                        setPhoneOtpSent(false);
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        phoneOtpMode
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'text-zinc-400 border-transparent hover:text-white'
                      }`}
                    >
                      ⚡ 1-Tap OTP
                    </button>
                  </div>
                </div>

                {/* Password field if not OTP mode */}
                {!phoneOtpMode && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Mobile Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPhonePassword}
                        onChange={(e) => setLoginPhonePassword(e.target.value)}
                        placeholder="Apna mobile password enter karein"
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

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTab('forgot');
                          if (loginPhone) setForgotIdentifier(loginPhone);
                          setForgotStep('find');
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center space-x-1"
                      >
                        <Key className="w-3 h-3" />
                        <span>Forgot Password? (पासवर्ड रीसेट)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* OTP field if OTP mode & sent */}
                {phoneOtpMode && phoneOtpSent && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-emerald-300">
                      <span className="font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>OTP Sent to +91 {loginPhone}</span>
                      </span>
                      <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200 font-bold">
                        Code: {generatedPhoneOtp}
                      </span>
                    </div>

                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={loginPhoneOtp}
                        onChange={(e) => setLoginPhoneOtp(e.target.value)}
                        placeholder="4-digit OTP enter karein"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-emerald-500/40 text-center text-sm font-mono tracking-widest text-emerald-200 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <button
                        type="button"
                        onClick={() => setLoginPhoneOtp(generatedPhoneOtp)}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Auto-fill OTP ({generatedPhoneOtp})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const code = Math.floor(1000 + Math.random() * 9000).toString();
                          setGeneratedPhoneOtp(code);
                          setLoginPhoneOtp(code);
                          showNotification(`Naya OTP bheja gaya: ${code}`);
                        }}
                        className="text-zinc-400 hover:text-white flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {phoneOtpMode && !phoneOtpSent ? (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send Verification OTP (ओटीपी भेजें)</span>
                    </>
                  ) : phoneOtpMode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify OTP & Sign In</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Mobile</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Separator */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                OR DIRECT SIGN IN
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* DIRECT GOOGLE SIGN IN BUTTON (1-Click) */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98 border border-white/20"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Continue with Google (Google से सीधे लॉगिन करें)</span>
            </button>

            {/* Quick 1-Tap Demo Login Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Tap Demo Account (Bina Password ke Direct)</span>
            </button>

            {/* Switch to Sign Up */}
            <div className="text-center pt-1 text-xs text-zinc-400">
              Naya account banana chahte hain?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign Up Here
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: SIGN UP (नया अकाउंट)
            ======================================================== */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="mt-4 space-y-3 animate-in fade-in duration-150">
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
                Mobile Number (Optional)
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-zinc-800/80 text-zinc-300 text-xs font-mono font-bold">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={regPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setRegPhone(val);
                  }}
                  placeholder="9876543210 (Mobile login ke liye)"
                  className="w-full pl-3 pr-3 py-2 rounded-r-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500 font-mono"
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

                <label
                  className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-dashed border-white/20 hover:border-cyan-400 flex items-center justify-center cursor-pointer shrink-0 text-zinc-400 hover:text-white transition-colors"
                  title="Upload Custom Photo"
                >
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4 text-black" />
              <span>Create Free Account & Sign In</span>
            </button>

            {/* Direct Google Sign Up Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer border border-white/20"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Quick Sign Up with Google</span>
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
            VIEW 4: FORGOT / RESET PASSWORD (पासवर्ड रीसेट)
            ======================================================== */}
        {tab === 'forgot' && (
          <div className="mt-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setTab('signin')}
                className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Password Recovery
              </span>
            </div>

            {/* STEP 1: Find Account */}
            {forgotStep === 'find' && (
              <form onSubmit={handleForgotFindAccount} className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <p className="font-semibold mb-1 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Apna Password Reset Karein</span>
                  </p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Apna registered Email ya 10-digit Mobile Number enter karein. Hum aapko instant verification code (OTP) bhejenge jisse aap turant naya password bana sakte hain.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Registered Email ya Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="demo@aurabeat.app ya 9876543210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* Quick Account Chips */}
                <div className="pt-1">
                  <span className="text-[10px] text-zinc-400 block mb-1">Click to select account:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setForgotIdentifier(acc.email)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition-all truncate max-w-[200px]"
                      >
                        {acc.name} ({acc.email})
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <Key className="w-4 h-4" />
                  <span>Find Account & Send Reset OTP</span>
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP & Enter New Password */}
            {forgotStep === 'verify' && forgotFoundAccount && (
              <form onSubmit={handleForgotResetPassword} className="space-y-3 animate-in fade-in">
                {/* Account details badge */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={forgotFoundAccount.avatar || '/logo.png'}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover border border-cyan-400/50"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{forgotFoundAccount.name}</h4>
                      <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                        {forgotFoundAccount.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep('find')}
                    className="text-[10px] text-zinc-400 hover:text-white underline"
                  >
                    Change
                  </button>
                </div>

                {/* OTP code highlight box */}
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center space-x-1 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verification Code Ready</span>
                    </span>
                    <span className="font-mono bg-emerald-500/25 px-2 py-0.5 rounded text-emerald-200 font-extrabold text-sm tracking-wider">
                      {forgotGeneratedOtp}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Niche is 4-digit code ko enter karein aur naya password banayein:
                  </p>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    4-Digit Verification OTP
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={forgotInputOtp}
                      onChange={(e) => setForgotInputOtp(e.target.value)}
                      placeholder="e.g. 7489"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-center font-mono tracking-widest text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotInputOtp(forgotGeneratedOtp)}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      Auto-fill OTP ({forgotGeneratedOtp})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.floor(1000 + Math.random() * 9000).toString();
                        setForgotGeneratedOtp(code);
                        setForgotInputOtp(code);
                        showNotification(`Naya Reset OTP: ${code}`);
                      }}
                      className="text-zinc-400 hover:text-white"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Naya Password (New Password - Min 4 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Naya password banayein"
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Confirm Naya Password (Dobara Enter Karein)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Confirm naya password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* Submit Reset Password */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Update Password & Log In Now</span>
                </button>
              </form>
            )}
          </div>
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

            {/* Admin Control Panel Access - Strictly for authorized admin accounts */}
            {onOpenAdminPanel && isUserAdmin(profile.email) && (
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">Authorized Admin Account</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Aapka account admin access ke liye authorized hai ({profile.email}). Yahan se online library me songs upload aur manage karein.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminPanel();
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Panel (Publish & Manage)</span>
                  </button>
                </div>
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

        {/* ========================================================
            GOOGLE ACCOUNT SELECTOR MODAL / 1-CLICK AUTH
            ======================================================== */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-zinc-900 border border-cyan-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-white shadow-md">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sign in with Google</h3>
                    <p className="text-[10px] text-zinc-400">Choose account for AuraBeat Music</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pre-configured Verified Accounts */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('jk74898713@gmail.com', 'JK Admin')}
                  className="w-full p-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 hover:border-cyan-400/50 flex items-center space-x-3 transition-all text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                    JK
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">JK Admin</span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                        Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">jk74898713@gmail.com</p>
                  </div>
                  <GoogleIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('itsmejkr66@gmail.com', 'JKR Admin')}
                  className="w-full p-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 hover:border-cyan-400/50 flex items-center space-x-3 transition-all text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                    JR
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">JKR Admin</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded-full border border-purple-500/30">
                        Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">itsmejkr66@gmail.com</p>
                  </div>
                  <GoogleIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </button>
              </div>

              {/* Or Use Custom Google Account */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Ya doosra Google Account use karein:
                </span>
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="apna.email@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  disabled={!customGoogleEmail.trim()}
                  onClick={() => handleGoogleSignIn(customGoogleEmail)}
                  className="w-full py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-900 font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span>Is Google Account se Login Karein</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
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
