import React, { useState, useEffect, useRef } from 'react';
import { Song, Playlist, EqualizerSettings, ThemeConfig, UserProfile, isUserAdmin, ADMIN_EMAILS } from './types';
import { DEFAULT_SONGS, PRESET_THEMES } from './data/defaultSongs';
import { BUNDLED_PUBLISHED_SONGS } from './data/publishedSongs';
import { audioEngine, EQ_PRESETS } from './utils/audioEngine';
import {
  saveSongMetadata,
  getAllSavedSongs,
  saveAudioBlob,
  getAudioBlob,
  downloadSongForOffline,
  deleteSavedSong,
  savePlaylist,
  getAllPlaylists,
  deletePlaylist,
  saveSetting,
  getSetting,
} from './utils/indexedDB';
import { syncClient } from './utils/syncClient';
import { PlayerBar } from './components/PlayerBar';
import { FullPlayerModal } from './components/FullPlayerModal';
import { EqualizerModal } from './components/EqualizerModal';
import { ListenTogetherModal } from './components/ListenTogetherModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { SocialShareModal } from './components/SocialShareModal';
import { PlaylistModal } from './components/PlaylistModal';
import { UserAccountModal } from './components/UserAccountModal';
import { InstallModal } from './components/InstallModal';
import { EditSongModal } from './components/EditSongModal';
import { DeviceAudioPermissionModal } from './components/DeviceAudioPermissionModal';
import { LyricsOverlay } from './components/LyricsOverlay';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AdminPanelModal } from './components/AdminPanelModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  Sliders,
  Flame,
  Radio,
  Moon,
  Palette,
  User,
  Users,
  ListMusic,
  Share2,
  Upload,
  Download,
  Wifi,
  WifiOff,
  Search,
  Sparkles,
  Heart,
  Music,
  Clock,
  Plus,
  Maximize2,
  Check,
  Disc,
  FolderDown,
  FolderOpen,
  Volume2,
  Edit2,
  Globe,
  ArrowUpDown,
  Mic,
  Calendar,
  MoreHorizontal,
  Layers,
  Trash2,
  Image as ImageIcon,
  ArrowLeft,
  CloudUpload,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [songs, setSongs] = useState<Song[]>(DEFAULT_SONGS);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [queue, setQueue] = useState<Song[]>(DEFAULT_SONGS);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Equalizer & 300% Boost settings
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>({
    enabled: true,
    preset: 'bass_heavy',
    bands: [8, 7, 5, 2, 0, 0, 1, 2, 3, 3],
    bassBoost: 80,
    virtualizer: 40,
    volumeBoost: 1.5, // 150% initial boost
    limiterEnabled: true,
    stereoBalance: 0,
    stereoChannelMode: 'both',
  });

  // Themes
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(PRESET_THEMES[0]);
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);

  // User Profile & Stats (Strictly recognizing authorized admins: itsmejkr66@gmail.com & jk74898713@gmail.com)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('aurabeat_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'usr_jk_admin',
      name: 'JK Admin',
      email: 'jk74898713@gmail.com',
      avatar: '/logo.png',
      totalMinutesListened: 240,
      songsPlayedCount: 54,
      favoriteGenre: 'Bass & Electronic',
      isLoggedIn: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('aurabeat_user_profile', JSON.stringify(userProfile));
    } catch {}
  }, [userProfile]);

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-favorites',
      title: '300% Bass Boost Favorites',
      description: 'Maximum energy tracks with peak limiters',
      songIds: ['track-1', 'track-3'],
      createdAt: Date.now() - 1000000,
    },
  ]);

  // Sleep Timer
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [sleepFadeOut, setSleepFadeOut] = useState<boolean>(true);
  const [sleepEndOfTrack, setSleepEndOfTrack] = useState<boolean>(false);

  // Sync Room
  const [syncRoomCode, setSyncRoomCode] = useState<string>('');
  const [syncConnected, setSyncConnected] = useState<boolean>(false);
  const [syncModalTab, setSyncModalTab] = useState<'host' | 'join'>('join');

  // Navigation & Filtering
  const [activeFilter, setActiveFilter] = useState<'all' | 'offline' | 'custom' | 'playlist'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [downloadingSongId, setDownloadingSongId] = useState<string | null>(null);

  // Modals
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isDeviceAudioModalOpen, setIsDeviceAudioModalOpen] = useState(false);
  const [isFirstTimeAudioPrompt, setIsFirstTimeAudioPrompt] = useState(false);
  const [isLyricsOverlayOpen, setIsLyricsOverlayOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isHeaderSearchExpanded, setIsHeaderSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist' | 'duration'>('date');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'artists' | 'playlists' | 'cloud' | 'offline'>('all');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K) to search songs, playlists, artists
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cloud Online Upload state & feedback
  const [blobUploadingCount, setBlobUploadingCount] = useState<number>(0);
  const [blobUploadStatus, setBlobUploadStatus] = useState<string | null>(null);
  const [uploadingSongIds, setUploadingSongIds] = useState<Record<string, boolean>>({});

  const currentSong = queue[currentSongIndex] || songs[0] || null;

  // Initialize DB & load saved data
  useEffect(() => {
    async function loadData() {
      try {
        const savedSongs = await getAllSavedSongs();
        const map = new Map<string, Song>();

        // 1. Built-in default tracks (demo songs removed per user request)
        DEFAULT_SONGS.forEach((s) => map.set(s.id, s));

        // 2. Creator published songs bundled directly into client build (now empty)
        BUNDLED_PUBLISHED_SONGS.forEach((s) => map.set(s.id, s));

        // 3. User local uploads saved in IndexedDB (clean up old legacy demo songs if present)
        if (savedSongs && savedSongs.length > 0) {
          for (const s of savedSongs) {
            // Discard removed demo songs
            if (
              s.id.startsWith('track-demo-') ||
              s.id.startsWith('verified_synth_') ||
              s.id.startsWith('verified_bass_') ||
              s.id.startsWith('verified_cosmic_') ||
              s.id.startsWith('verified_chill_') ||
              (s.url && s.url.includes('soundhelix.com'))
            ) {
              await deleteSavedSong(s.id).catch(() => {});
              continue;
            }
            try {
              const blob = await getAudioBlob(s.id);
              if (blob) {
                s.url = URL.createObjectURL(blob);
              }
            } catch {}
            map.set(s.id, s);
          }
        }

        // 4. Fetch dynamic online cloud songs strictly hosted on Vercel Blob Storage
        try {
          let catalogSongs: Song[] = [];

          try {
            const res = await fetch('/api/catalog/songs');
            if (res.ok) {
              const data = await res.json();
              if (data.songs && Array.isArray(data.songs)) {
                catalogSongs = data.songs.filter((s: Song) =>
                  s && s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage'))
                );
              }
            }
          } catch {
            // API not available
          }

          if (catalogSongs.length === 0) {
            try {
              const staticRes = await fetch('/cloudCatalog.json');
              if (staticRes.ok) {
                const staticData = await staticRes.json();
                if (Array.isArray(staticData)) {
                  catalogSongs = staticData.filter((s: Song) =>
                    s && s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage'))
                  );
                }
              }
            } catch {}
          }

          if (catalogSongs.length > 0) {
            catalogSongs.forEach((s: Song) => map.set(s.id, s));
          }
        } catch {
          // offline
        }

        const baseList = Array.from(map.values());
        setSongs(baseList);
        setQueue(baseList);

        // Pre-initialize audio element with the first track so Play button works instantly
        if (audioRef.current && baseList.length > 0 && !audioRef.current.src) {
          audioRef.current.src = baseList[0].url;
          audioRef.current.preload = 'metadata';
        }

        const savedPlaylists = await getAllPlaylists();
        if (savedPlaylists && savedPlaylists.length > 0) {
          setPlaylists(savedPlaylists);
        }

        const savedTheme = await getSetting<ThemeConfig | null>('active_theme', null);
        if (savedTheme) setCurrentTheme(savedTheme);

        const savedCustomThemes = await getSetting<ThemeConfig[]>('custom_themes', []);
        if (savedCustomThemes) setCustomThemes(savedCustomThemes);

        const savedEQ = await getSetting<EqualizerSettings | null>('eq_settings', null);
        if (savedEQ) setEqSettings(savedEQ);

        const savedProfile = await getSetting<UserProfile | null>('user_profile', null);
        if (savedProfile) setUserProfile(savedProfile);
      } catch (err) {
        console.error('Error loading initial data from IndexedDB:', err);
      }
    }
    loadData();

    // Check online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // First-time visit: Prompt for device audio access so all songs load automatically
    const hasPrompted = localStorage.getItem('aurabeat_audio_permission_asked');
    let promptTimer: NodeJS.Timeout | null = null;
    if (!hasPrompted) {
      promptTimer = setTimeout(() => {
        setIsFirstTimeAudioPrompt(true);
        setIsDeviceAudioModalOpen(true);
      }, 700);
    }

    return () => {
      if (promptTimer) clearTimeout(promptTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle batch of device songs scanned & imported
  const handleDeviceSongsImported = (importedSongs: Song[]) => {
    setSongs((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newUnique = importedSongs.filter((s) => !existingIds.has(s.id));
      return [...newUnique, ...prev];
    });
    setQueue((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newUnique = importedSongs.filter((s) => !existingIds.has(s.id));
      return [...newUnique, ...prev];
    });
    // Set to play the first imported song if available
    if (importedSongs.length > 0 && audioRef.current && !isPlaying) {
      audioRef.current.src = importedSongs[0].url;
      audioRef.current.preload = 'metadata';
    }
  };

  // Initialize Audio Engine once audio element mounts
  useEffect(() => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
      audioEngine.applySettings(eqSettings);
    }
  }, []);

  // Apply EQ changes
  useEffect(() => {
    audioEngine.applySettings(eqSettings);
    saveSetting('eq_settings', eqSettings);
  }, [eqSettings]);

  // Sync client subscription for party mode / listen together
  useEffect(() => {
    const unsub = syncClient.subscribe((event) => {
      if (event.type === 'CONNECTED') {
        setSyncConnected(true);
        if (event.data?.roomCode) setSyncRoomCode(event.data.roomCode);
      } else if (event.type === 'DISCONNECTED') {
        setSyncConnected(false);
        setSyncRoomCode('');
      } else if (event.type === 'STATE_UPDATE') {
        const data = event.data;
        if (data.roomCode) setSyncRoomCode(data.roomCode);
        setSyncConnected(true);

        // Synchronize track
        if (data.songId) {
          const targetSong = queue.find((s) => s.id === data.songId) || songs.find((s) => s.id === data.songId);
          if (targetSong) {
            const currentId = queue[currentSongIndex]?.id;
            if (currentId !== data.songId) {
              const qIdx = queue.findIndex((s) => s.id === data.songId);
              if (qIdx !== -1) {
                setCurrentSongIndex(qIdx);
              } else {
                setQueue((prev) => [targetSong, ...prev]);
                setCurrentSongIndex(0);
              }

              if (audioRef.current) {
                audioRef.current.src = targetSong.url;
                if (typeof data.positionSec === 'number') {
                  audioRef.current.currentTime = data.positionSec;
                  setCurrentTime(data.positionSec);
                }
                if (data.isPlaying) {
                  audioEngine.ensureRunning();
                  audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                } else {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
              }
            }
          }
        }

        // Synchronize play/pause
        if (typeof data.isPlaying === 'boolean' && audioRef.current) {
          if (data.isPlaying && audioRef.current.paused) {
            audioEngine.ensureRunning();
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          } else if (!data.isPlaying && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }

        // Synchronize exact timestamp if drifting
        if (typeof data.positionSec === 'number' && audioRef.current) {
          const drift = Math.abs(audioRef.current.currentTime - data.positionSec);
          if (drift > 0.35) {
            audioRef.current.currentTime = data.positionSec;
            setCurrentTime(data.positionSec);
          }
        }
      }
    });

    return () => {
      unsub();
    };
  }, [queue, currentSongIndex]);

  // Setup Background Play & Media Session API
  useEffect(() => {
    if (!currentSong) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || 'AuraBeat',
        artwork: [
          { src: currentSong.coverArt, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.coverArt, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.coverArt, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => handlePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => handlePlayPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [currentSong, isPlaying]);

  // Sleep Timer Interval & Fade Out
  useEffect(() => {
    if (sleepTimerSeconds === null) {
      // Restore intended volume if sleep timer was cancelled
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
      }
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Pause playback and restore intended volume
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.volume = isMuted ? 0 : volume;
            setIsPlaying(false);
          }
          return null;
        }

        // Smooth fade out in the last 30 seconds
        if (sleepFadeOut && prev <= 30 && audioRef.current) {
          const targetVol = Math.max(0.02, (prev / 30) * volume);
          audioRef.current.volume = targetVol;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds, sleepFadeOut, volume, isMuted]);

  // Track listening minutes (only while audio is genuinely playing, save to IndexedDB every 30s)
  useEffect(() => {
    if (!isPlaying) return;
    let ticks = 0;
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended && audioRef.current.currentTime > 0) {
        ticks++;
        setUserProfile((prev) => {
          const updated = {
            ...prev,
            totalMinutesListened: Number((prev.totalMinutesListened + 1 / 60).toFixed(2)),
          };
          if (ticks % 30 === 0) {
            saveSetting('user_profile', updated);
          }
          return updated;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Robust Audio Player Engine Execution
  const playSong = (index: number, forceSong?: Song) => {
    const targetSong = forceSong || queue[index] || songs[index];
    if (!targetSong) return;

    if (forceSong) {
      const existingIdx = queue.findIndex((s) => s.id === forceSong.id);
      if (existingIdx !== -1) {
        setCurrentSongIndex(existingIdx);
      } else {
        setQueue((prev) => [forceSong, ...prev]);
        setCurrentSongIndex(0);
      }
    } else {
      setCurrentSongIndex(index);
    }

    // 1. Resume AudioContext immediately within direct user interaction tick
    audioEngine.ensureRunning();

    if (!audioRef.current) return;

    const audioEl = audioRef.current;

    const startPlayback = (effectiveSrc: string) => {
      // 2. If already loaded this song and just paused, simply resume
      const isSameSrc =
        audioEl.src === effectiveSrc ||
        audioEl.src.endsWith(effectiveSrc) ||
        (effectiveSrc.startsWith('/') && audioEl.src.endsWith(effectiveSrc));

      if (isSameSrc && audioEl.readyState >= 2) {
        audioEl
          .play()
          .then(() => {
            setIsPlaying(true);
            if (syncConnected) {
              syncClient.broadcastPlayback(targetSong.id, true, audioEl.currentTime, 'play');
            }
          })
          .catch(() => {
            // Force reload if play failed
            audioEl.src = effectiveSrc;
            audioEl.load();
            audioEl.play().catch((e) => console.warn('Audio play retry failed:', e));
          });
        return;
      }

      // 3. New track load and play
      try {
        audioEl.src = effectiveSrc;
        audioEl.load();
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setUserProfile((prev) => {
                const updated = { ...prev, songsPlayedCount: prev.songsPlayedCount + 1 };
                saveSetting('user_profile', updated);
                return updated;
              });
              if (syncConnected) {
                syncClient.broadcastPlayback(targetSong.id, true, 0, 'play');
              }
            })
            .catch((err) => {
              console.warn('Playback play() was prevented or interrupted:', err);
              if (err?.name === 'NotAllowedError') {
                setIsPlaying(false);
                setPlaybackError('Autoplay was prevented by browser policy. Please tap Play.');
                return;
              }
              // Attempt to play cached IndexedDB offline blob
              getAudioBlob(targetSong.id).then((blob) => {
                if (blob && audioRef.current) {
                  audioRef.current.src = URL.createObjectURL(blob);
                  audioRef.current.load();
                  audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setPlaybackError(null);
                  }).catch(() => {
                    setIsPlaying(false);
                    setPlaybackError(`"${targetSong.title}" is currently unavailable or audio source cannot be reached.`);
                  });
                } else {
                  setIsPlaying(false);
                  setPlaybackError(`"${targetSong.title}" is currently unavailable or audio source cannot be reached.`);
                }
              }).catch(() => {
                setIsPlaying(false);
                setPlaybackError(`"${targetSong.title}" is currently unavailable or audio source cannot be reached.`);
              });
            });
        }
      } catch (e) {
        console.error('Error starting audio playback:', e);
      }
    };

    if (targetSong.isCustomUpload || targetSong.isOffline) {
      getAudioBlob(targetSong.id)
        .then((blob) => {
          if (blob) {
            const freshUrl = URL.createObjectURL(blob);
            targetSong.url = freshUrl;
            startPlayback(freshUrl);
          } else {
            startPlayback(targetSong.url);
          }
        })
        .catch(() => startPlayback(targetSong.url));
    } else {
      startPlayback(targetSong.url);
    }
  };

  const handlePlayPause = () => {
    audioEngine.ensureRunning();
    if (!audioRef.current) return;

    const audioEl = audioRef.current;
    const currentSrc = audioEl.currentSrc || audioEl.src;

    // If audio element has no source yet (e.g. fresh page visit), play current track!
    if (!currentSrc || currentSrc === '' || currentSrc === window.location.href) {
      const active = currentSong || queue[currentSongIndex] || queue[0] || songs[0];
      if (active) {
        playSong(currentSongIndex, active);
        return;
      }
    }

    if (isPlaying && !audioEl.paused) {
      audioEl.pause();
      setIsPlaying(false);
      if (syncConnected && currentSong) {
        syncClient.broadcastPlayback(currentSong.id, false, audioEl.currentTime, 'pause');
      }
    } else {
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (syncConnected && currentSong) {
              syncClient.broadcastPlayback(currentSong.id, true, audioEl.currentTime, 'play');
            }
          })
          .catch((err) => {
            console.warn('Play button failed, reloading track:', err);
            const active = currentSong || queue[currentSongIndex] || queue[0] || songs[0];
            if (active) {
              playSong(currentSongIndex, active);
            }
          });
      }
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    let nextIdx = currentSongIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = 0;
    }
    playSong(nextIdx);
  };

  const handlePrevious = () => {
    if (queue.length === 0) return;
    if (currentTime > 4 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    let prevIdx = currentSongIndex - 1;
    if (prevIdx < 0) prevIdx = queue.length - 1;
    playSong(prevIdx);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (syncConnected && currentSong) {
        syncClient.broadcastPlayback(currentSong.id, isPlaying, time, 'seek');
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Core function to publish any song directly to the Online Cloud Library (POST /api/catalog/publish)
  const uploadSongDirectlyToBlob = async (song: Song, providedBlob?: Blob) => {
    setUploadingSongIds((prev) => ({ ...prev, [song.id]: true }));
    setBlobUploadingCount((prev) => prev + 1);
    setBlobUploadStatus(`Online library me publish ho raha hai: "${song.title}"...`);

    try {
      let audioBase64: string | undefined = undefined;
      let blob = providedBlob || (await getAudioBlob(song.id));
      if (!blob && song.url && !song.url.includes('blob.vercel-storage.com')) {
        try {
          const fetched = await fetch(song.url);
          if (fetched.ok) {
            blob = await fetched.blob();
          }
        } catch {}
      }

      if (blob) {
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

      const adminKey = localStorage.getItem('aurabeat_admin_key') || '';
      if (!adminKey) {
        throw new Error('Admin passkey missing. Kripya pehle Admin Panel se passkey enter karke unlock karein.');
      }
      const blobToken = localStorage.getItem('aurabeat_blob_token') || undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      };
      if (blobToken) {
        headers['x-blob-token'] = blobToken;
      }

      const res = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...song,
          audioBase64,
          adminKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.song) {
          const updatedCloudSong: Song = {
            ...data.song,
            isCloudShared: true,
            isOffline: false,
          };
          setSongs((prev) => [updatedCloudSong, ...prev.filter((s) => s.id !== song.id && s.id !== updatedCloudSong.id)]);
          setQueue((prev) => [updatedCloudSong, ...prev.filter((s) => s.id !== song.id && s.id !== updatedCloudSong.id)]);
          await saveSongMetadata(updatedCloudSong);
          confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 } });
          setBlobUploadStatus(`✅ "${song.title}" safalta-purvak online library me publish ho gaya!`);
          setTimeout(() => setBlobUploadStatus(null), 4000);
          return updatedCloudSong;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish song online.');
      }
    } catch (err: any) {
      console.warn('Online publish note:', err);
      setBlobUploadStatus(`⚠️ Local save ho gaya, Publish note: ${err.message || 'Check network'}`);
      setTimeout(() => setBlobUploadStatus(null), 5000);
      throw err;
    } finally {
      setUploadingSongIds((prev) => ({ ...prev, [song.id]: false }));
      setBlobUploadingCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Custom Local Device Audio File Upload (Instant local playback & offline storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    // Reset file input value immediately so subsequent clicks open gallery with 0 friction
    e.target.value = '';

    fileList.forEach(async (file) => {
      const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const url = URL.createObjectURL(file);

      // Estimate audio duration
      const tempAudio = new Audio();
      tempAudio.src = url;
      tempAudio.onloadedmetadata = async () => {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        const newSong: Song = {
          id,
          title: cleanTitle,
          artist: 'My Local Music',
          album: 'Device Offline Tracks',
          duration: Math.round(tempAudio.duration) || 180,
          url,
          coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          genre: 'Custom Audio',
          isOffline: true,
          isCustomUpload: true,
          addedAt: Date.now(),
        };

        // Save blob and metadata to IndexedDB for instant zero-latency offline playback
        await saveAudioBlob(id, file);
        await saveSongMetadata(newSong);

        setSongs((prev) => [newSong, ...prev]);
        setQueue((prev) => [newSong, ...prev]);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      };
    });
  };

  const handleOpenAudioGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Toggle song favorite / like status
  const handleToggleFavorite = async (songId: string) => {
    let isNowFav = false;
    const updatedSongs = songs.map((s) => {
      if (s.id === songId) {
        isNowFav = !s.isFavorite;
        const updated = { ...s, isFavorite: isNowFav };
        saveSongMetadata(updated).catch(console.error);
        return updated;
      }
      return s;
    });
    setSongs(updatedSongs);
    setQueue((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: isNowFav } : s))
    );
    if (isNowFav) {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
  };

  // Save online song to device storage (real file download) & cache in IndexedDB for offline play
  const handleDownloadSongToDevice = async (song: Song) => {
    setDownloadingSongId(song.id);
    try {
      let blob: Blob | null = await getAudioBlob(song.id);
      if (!blob) {
        const resp = await fetch(song.url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        blob = await resp.blob();
        await saveAudioBlob(song.id, blob);
      }

      // Mark offline ready in IndexedDB metadata & app state
      const updated: Song = { ...song, isOffline: true };
      await saveSongMetadata(updated);
      setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
      setQueue((prev) => prev.map((s) => (s.id === song.id ? updated : s)));

      // Trigger real browser file download to local phone / PC download folder
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanTitle = (song.title || 'Track').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanArtist = (song.artist || 'Artist').replace(/[/\\?%*:|"<>]/g, '_');
      a.download = `${cleanArtist} - ${cleanTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);

      confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 } });
    } catch (err) {
      console.warn('Direct blob download error, attempting fallback URL download:', err);
      try {
        const a = document.createElement('a');
        a.href = song.url;
        a.target = '_blank';
        a.download = `${song.title || 'song'}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e2) {
        console.error('Download failed:', e2);
      }
    } finally {
      setDownloadingSongId(null);
    }
  };

  // Set Sleep Timer
  const handleSetSleepTimer = (minutes: number, fadeOut: boolean, endOfTrack = false) => {
    setSleepFadeOut(fadeOut);
    if (endOfTrack) {
      setSleepEndOfTrack(true);
      const remainingSec = Math.max(1, Math.round(duration - currentTime));
      setSleepTimerSeconds(remainingSec);
    } else {
      setSleepEndOfTrack(false);
      setSleepTimerSeconds(minutes * 60);
    }
  };

  // Playlist handlers
  const handleCreatePlaylist = async (title: string, desc?: string) => {
    const newPl: Playlist = {
      id: 'pl_' + Date.now(),
      title,
      description: desc,
      songIds: [],
      createdAt: Date.now(),
    };
    await savePlaylist(newPl);
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSelectPlaylistToPlay = (pl: Playlist) => {
    const plTracks = songs.filter((s) => pl.songIds.includes(s.id));
    if (plTracks.length > 0) {
      setQueue(plTracks);
      setCurrentSongIndex(0);
      playSong(0);
    }
  };

  const handleAddSongToPlaylist = async (playlistId: string, songId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (pl && !pl.songIds.includes(songId)) {
      const updated = { ...pl, songIds: [...pl.songIds, songId] };
      await savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId: string, songId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (pl) {
      const updated = { ...pl, songIds: pl.songIds.filter((id) => id !== songId) };
      await savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    }
  };

  // Theme handlers
  const handleSelectTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
    saveSetting('active_theme', theme);
  };

  const handleSaveCustomTheme = async (theme: ThemeConfig) => {
    const updated = [...customThemes, theme];
    setCustomThemes(updated);
    await saveSetting('custom_themes', updated);
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    const updated = customThemes.filter((t) => t.id !== themeId);
    setCustomThemes(updated);
    await saveSetting('custom_themes', updated);
  };

  const handleSaveSongEdit = async (updatedSong: Song) => {
    await saveSongMetadata(updatedSong);
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
    setQueue((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
  };

  const handlePublishSongToCloud = async (song: Song) => {
    await uploadSongDirectlyToBlob(song);
  };

  const handleUploadSongToBlobQuick = async (song: Song) => {
    try {
      await uploadSongDirectlyToBlob(song);
    } catch (err: any) {
      console.warn('Quick Vercel Blob upload failed:', err);
    }
  };

  // Queue reordering (Aage / Pichhe)
  const handleMoveQueueItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === queue.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentPlayingId = currentSong?.id;

    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;

    setQueue(newQueue);

    // Keep the currently playing song index tracked properly
    if (currentPlayingId) {
      const newIdx = newQueue.findIndex((s) => s.id === currentPlayingId);
      if (newIdx !== -1) {
        setCurrentSongIndex(newIdx);
      }
    }
  };

  // Remove song from playback queue
  const handleRemoveFromQueue = (index: number) => {
    if (queue.length <= 1) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const currentPlayingId = currentSong?.id;
    const isRemovingCurrent = index === currentSongIndex;

    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);

    if (isRemovingCurrent) {
      const nextIdx = index < newQueue.length ? index : 0;
      setCurrentSongIndex(nextIdx);
      if (isPlaying) {
        setTimeout(() => playSong(nextIdx), 60);
      }
    } else if (currentPlayingId) {
      const newIdx = newQueue.findIndex((s) => s.id === currentPlayingId);
      if (newIdx !== -1) {
        setCurrentSongIndex(newIdx);
      }
    }
  };

  // Clear entire queue except current track
  const handleClearQueue = () => {
    if (!currentSong) return;
    setQueue([currentSong]);
    setCurrentSongIndex(0);
  };

  // Delete uploaded / library song permanently
  const handleDeleteSong = async (songId: string) => {
    const isCurrentlyPlaying = currentSong?.id === songId;

    // 1. Delete from IndexedDB (both metadata and audio blob)
    try {
      await deleteSavedSong(songId);
    } catch (err) {
      console.warn('Error deleting from IndexedDB:', err);
    }

    // 2. If it's a cloud-shared song, delete from server
    try {
      await fetch(`/api/catalog/delete/${songId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error deleting from cloud catalog:', err);
    }

    // 3. Remove from any playlists
    setPlaylists((prev) =>
      prev.map((pl) => ({
        ...pl,
        songIds: pl.songIds.filter((id) => id !== songId),
      }))
    );

    // 4. Advance or stop audio if currently playing
    if (isCurrentlyPlaying) {
      if (queue.length > 1) {
        handleNext();
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
      }
    }

    // 5. Update songs & queue state
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setQueue((prev) => prev.filter((s) => s.id !== songId));

    if (editingSong?.id === songId) {
      setEditingSong(null);
    }
  };

  // Filter songs based on search & tab
  const filteredSongs = songs.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album && s.album.toLowerCase().includes(q)) ||
      (s.genre && s.genre.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeTab === 'favorites') return !!s.isFavorite;
    if (activeTab === 'offline') return !!s.isOffline;
    if (activeTab === 'cloud') {
      return (
        !!(s as any).isCloudShared &&
        Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage')))
      );
    }
    if (selectedArtist) return s.artist === selectedArtist;
    return true;
  });

  // Category-wise sorting (Date linked/added, Song Title A-Z, Artist Name, Duration)
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'duration') return b.duration - a.duration;
    // Default 'date': newest added date first
    return (b.addedAt || 0) - (a.addedAt || 0);
  });

  // Group songs category-wise by Artist
  const songsByArtist = React.useMemo(() => {
    const map = new Map<string, Song[]>();
    songs.forEach((song) => {
      const art = song.artist || 'Unknown Artist';
      if (!map.has(art)) map.set(art, []);
      map.get(art)!.push(song);
    });
    return Array.from(map.entries());
  }, [songs]);

  const offlineSongsCount = songs.filter((s) => s.isOffline).length;
  const favoritesCount = songs.filter((s) => s.isFavorite).length;
  const boostPercent = Math.round(eqSettings.volumeBoost * 100);

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-gradient-to-b ${currentTheme.bgGradient} text-white font-sans transition-colors duration-500 pb-28 select-none relative`}
    >
      {/* Floating Ambient Glowing Mesh (Halka Green & Blue Glowing Glass Aesthetic) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-36 -left-36 w-80 sm:w-[520px] h-80 sm:h-[520px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute top-1/4 -right-36 w-80 sm:w-[550px] h-80 sm:h-[550px] rounded-full bg-emerald-500/15 blur-[130px] pointer-events-none animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-80 sm:w-[600px] h-80 sm:h-[450px] rounded-full bg-teal-400/12 blur-[140px] pointer-events-none"
        />
      </div>
      {/* Hidden Core Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const now = audioRef.current.currentTime;
            // Smoothly update time when delta >= 0.2s or near boundary
            if (Math.abs(now - currentTime) >= 0.2 || Math.abs(now - duration) < 0.4) {
              setCurrentTime(now);
            }
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            handleNext();
          }
        }}
        onError={(e) => {
          const mediaError = audioRef.current?.error;
          console.warn('Audio playback error:', mediaError?.code, mediaError?.message, e);
          setIsPlaying(false);
          if (audioRef.current && currentSong) {
            getAudioBlob(currentSong.id).then((blob) => {
              if (blob && audioRef.current) {
                audioRef.current.src = URL.createObjectURL(blob);
                audioRef.current.load();
                audioRef.current.play().then(() => {
                  setIsPlaying(true);
                  setPlaybackError(null);
                }).catch(() => {
                  setPlaybackError(`"${currentSong.title}" is unavailable or audio stream cannot be played.`);
                });
              } else {
                setPlaybackError(`"${currentSong.title}" is unavailable or audio stream cannot be played.`);
              }
            }).catch(() => {
              setPlaybackError(`"${currentSong.title}" is unavailable or audio stream cannot be played.`);
            });
          }
        }}
      />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-8 py-2.5 sm:py-3.5 bg-black/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-2">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="relative group shrink-0">
            <img
              src="/logo.png"
              alt="AuraBeat Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover shadow-lg shadow-cyan-500/25 border border-white/10 ring-1 ring-cyan-400/30 transition-transform group-hover:scale-105"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-white truncate">
              AuraBeat
            </h1>
            <p className="text-[10px] text-zinc-400 hidden sm:block truncate">
              10-Band EQ • Offline Storage • Dual-Device Sync
            </p>
          </div>
        </div>

        {/* Top Status & Shortcut Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Global Search Button - Small glowing button, expands on click or Ctrl+K */}
          <button
            type="button"
            onClick={() => setIsGlobalSearchOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-cyan-400/40 hover:border-emerald-400/60 text-cyan-300 hover:text-white text-xs font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all shrink-0 cursor-pointer group active:scale-95"
            title="Global Search across songs, artists, playlists (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-300 group-hover:text-emerald-300 transition-colors animate-pulse" />
            <span className="hidden sm:inline text-[11px] font-bold text-zinc-200 group-hover:text-white">
              Search
            </span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/50 text-emerald-300 border border-emerald-500/30 shadow-xs">
              Ctrl K
            </kbd>
          </button>
          {/* Party Mode Room Badge - ONLY shown if in an active room, compact */}
          {syncConnected && (
            <button
              onClick={() => {
                setSyncModalTab('host');
                setIsSyncOpen(true);
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse shrink-0"
              title={`Room Active: ${syncRoomCode}`}
            >
              <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{syncRoomCode}</span>
            </button>
          )}

          {/* Sleep Timer Indicator Pill */}
          {sleepTimerSeconds !== null && sleepTimerSeconds > 0 && (
            <button
              onClick={() => setIsSleepOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-bold shrink-0"
            >
              <Moon className="w-3 h-3" />
              <span>{Math.ceil(sleepTimerSeconds / 60)}m</span>
            </button>
          )}

          {/* Theme Selector */}
          <button
            onClick={() => setIsThemeOpen(true)}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/5 transition-colors shrink-0"
            title="Theme & Colors"
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* User Account / Profile */}
          <button
            onClick={() => setIsUserOpen(true)}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 py-1 rounded-xl border transition-all shrink-0 cursor-pointer ${
              userProfile.isLoggedIn
                ? isUserAdmin(userProfile.email)
                  ? 'bg-amber-500/10 hover:ring-2 hover:ring-amber-400 border-amber-500/30 text-amber-300'
                  : 'bg-zinc-800/80 hover:ring-2 hover:ring-cyan-400 border-white/10'
                : 'bg-gradient-to-r from-cyan-500/25 to-blue-500/20 hover:from-cyan-500/35 border-cyan-400/30 text-cyan-300'
            }`}
            title={userProfile.isLoggedIn ? `Account (${userProfile.name}${isUserAdmin(userProfile.email) ? ' • Admin' : ''})` : 'Sign In / Sign Up'}
          >
            {userProfile.isLoggedIn ? (
              <div className="flex items-center space-x-1.5">
                <div className="relative">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover ring-1 ${isUserAdmin(userProfile.email) ? 'ring-amber-400' : 'ring-cyan-400/40'}`}
                  />
                  {isUserAdmin(userProfile.email) && (
                    <span
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 text-black rounded-full flex items-center justify-center text-[8px] font-black shadow-sm"
                      title="Admin Account Verified"
                    >
                      ★
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-xs font-semibold text-zinc-200 max-w-[70px] truncate">
                  {userProfile.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <>
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-[11px] sm:text-xs font-bold text-cyan-300">Sign In</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Playback Error / Status Banner */}
      {playbackError && (
        <div className="mx-3 sm:mx-4 md:mx-8 mt-3 p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-200 text-xs flex items-center justify-between backdrop-blur-md shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-base">⚠️</span>
            <span className="font-medium">{playbackError}</span>
          </div>
          <button
            onClick={() => setPlaybackError(null)}
            className="ml-3 px-2.5 py-1 text-xs font-semibold rounded-xl bg-red-900/50 hover:bg-red-800 text-red-200 hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* HERO SECTION WITH REAL-TIME VISUALIZER & DUAL DEVICE BANNER */}
      <div className="relative px-4 md:px-8 pt-6 pb-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Main Visualizer Hero Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AuraBeat Studio Engine</span>
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                  High-Fidelity Sound with 300% Boost
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  10-band equalizer, offline caching & millisecond dual-device audio sync
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEQOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Open EQ Studio</span>
                </button>
                <button
                  onClick={() => setIsFullPlayerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:opacity-95 flex items-center space-x-1.5 transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Now Playing</span>
                </button>
              </div>
            </div>

            {/* Embedded Live Visualizer */}
            <div className="my-4 relative z-10">
              <AudioVisualizer
                isPlaying={isPlaying}
                accentColor={currentTheme.primaryColor}
                secondaryColor={currentTheme.accentColor}
                height={100}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/5 pt-3 relative z-10">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{isOnline ? 'Network Online' : 'Offline Mode Active'}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-cyan-400">{offlineSongsCount} tracks offline ready</span>
              </div>
              <div className="text-[11px] font-mono">
                Preset: <strong className="text-white capitalize">{eqSettings.preset}</strong>
              </div>
            </div>
          </div>

          {/* Quick Party Sync & Stereo Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-purple-950/30 backdrop-blur-xl border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  Dual Device Link
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-3">Party Sync & Stereo Split</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Connect 2 phones over Wi-Fi/Bluetooth: set one as Left Speaker and second as Right Speaker, or sync with friends across long distance!
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
              {syncConnected ? (
                <button
                  onClick={() => {
                    setSyncModalTab('host');
                    setIsSyncOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 animate-pulse"
                >
                  <Radio className="w-4 h-4" />
                  <span>Manage Active Room: {syncRoomCode}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSyncModalTab('join');
                      setIsSyncOpen(true);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Join Room</span>
                  </button>

                  <button
                    onClick={() => {
                      setSyncModalTab('host');
                      setIsSyncOpen(true);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Host Room</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <button
                  onClick={() => setIsSleepOpen(true)}
                  className="py-2 px-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sleep Timer</span>
                </button>
                <button
                  onClick={() => setIsPlaylistOpen(true)}
                  className="py-2 px-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Playlists</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SONG LIBRARY & CATEGORIES SECTION */}
      <main className="px-4 md:px-8 mt-4 max-w-7xl mx-auto w-full flex-1">
        {/* Online Library Publish Progress Banner */}
        {blobUploadStatus && (
          <div className="mb-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-950/70 via-indigo-950/70 to-purple-950/70 border border-sky-400/40 text-xs text-sky-200 flex items-center justify-between shadow-xl shadow-sky-500/10 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
                <Globe className={`w-4 h-4 ${blobUploadingCount > 0 ? 'animate-bounce text-cyan-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-white">{blobUploadStatus}</p>
                <p className="text-[11px] text-zinc-400">Online library me synchronize ho raha hai</p>
              </div>
            </div>
            {blobUploadingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-sky-500/30 text-sky-200 font-mono text-[10px] font-bold border border-sky-400/40 shrink-0 animate-pulse">
                Publishing ({blobUploadingCount})...
              </span>
            )}
          </div>
        )}

        {/* Main Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              All Songs ({songs.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('favorites');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-white text-white' : 'text-pink-400'}`} />
              <span>Favorites ({favoritesCount})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('artists');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                activeTab === 'artists'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>By Artists ({songsByArtist.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('playlists');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                activeTab === 'playlists'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Playlists ({playlists.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('cloud');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                activeTab === 'cloud'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Online (
                {
                  songs.filter(
                    (s) =>
                      (s as any).isCloudShared ||
                      Boolean(s.url && (s.url.includes('blob.vercel-storage.com') || s.url.includes('vercel-storage')))
                  ).length
                }
                )
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('offline');
                setSelectedArtist(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                activeTab === 'offline'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline ({offlineSongsCount})</span>
            </button>
          </div>

          {/* Search Bar & Upload Button */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search song, artist, genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-zinc-500"
              />
            </div>

            {/* Auto-Scan Device Audio Button */}
            <button
              type="button"
              onClick={() => {
                setIsFirstTimeAudioPrompt(false);
                setIsDeviceAudioModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
              title="Automatic scan all songs from your device storage"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Auto-Scan</span>
              <span>Device Audio</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAudioGallery}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold hover:opacity-95 shadow-md shadow-cyan-500/20 transition-all shrink-0 cursor-pointer active:scale-95"
              title="Open Device Audio Gallery"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Songs</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/flac,audio/ogg,.mp3,.wav,.ogg,.m4a,.flac,.aac"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Sorting Pills Toolbar (Jis date pe link hua, Song Name, Artist Name, Duration) */}
        {activeTab !== 'playlists' && (
          <div className="flex items-center justify-between py-2.5 text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <span className="font-semibold text-zinc-500 flex items-center space-x-1 shrink-0">
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>Sort by:</span>
              </span>
              <button
                onClick={() => setSortBy('date')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  sortBy === 'date'
                    ? 'bg-white/15 text-white font-bold'
                    : 'hover:bg-white/5 text-zinc-400'
                }`}
                title="Jis date pe app me link/upload hua uss date ke hisab se"
              >
                📅 Date Added (Latest)
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  sortBy === 'title'
                    ? 'bg-white/15 text-white font-bold'
                    : 'hover:bg-white/5 text-zinc-400'
                }`}
                title="Song ke naam se (A-Z)"
              >
                🔤 Song Name (A-Z)
              </button>
              <button
                onClick={() => setSortBy('artist')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  sortBy === 'artist'
                    ? 'bg-white/15 text-white font-bold'
                    : 'hover:bg-white/5 text-zinc-400'
                }`}
                title="Artist ke naam se (A-Z)"
              >
                🎤 Artist Name (A-Z)
              </button>
              <button
                onClick={() => setSortBy('duration')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  sortBy === 'duration'
                    ? 'bg-white/15 text-white font-bold'
                    : 'hover:bg-white/5 text-zinc-400'
                }`}
                title="Song duration ke hisab se"
              >
                ⏱️ Duration
              </button>
            </div>

            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {sortedSongs.length} track{sortedSongs.length === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {/* 1. ARTIST CATEGORY VIEW */}
        {activeTab === 'artists' && !selectedArtist && (
          <div className="mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center space-x-1.5">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>All Artists ({songsByArtist.length}) - Tap to open artist tracks</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {songsByArtist.map(([artistName, artistTracks]) => {
                const sampleCover = artistTracks[0]?.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
                return (
                  <div
                    key={artistName}
                    onClick={() => setSelectedArtist(artistName)}
                    className="p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col items-center text-center"
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-lg border-2 border-white/10 group-hover:border-cyan-400 transition-colors">
                      <img
                        src={sampleCover}
                        alt={artistName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-3 truncate w-full group-hover:text-cyan-400 transition-colors">
                      {artistName}
                    </h4>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      {artistTracks.length} song{artistTracks.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueue(artistTracks);
                        setCurrentSongIndex(0);
                        playSong(0);
                      }}
                      className="mt-2.5 px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-cyan-300" />
                      <span>Play Artist</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If an artist is selected inside Artists view */}
        {activeTab === 'artists' && selectedArtist && (
          <div className="mt-2 mb-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Artists</span>
                </button>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">{selectedArtist}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                    {filteredSongs.length} Songs
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (filteredSongs.length > 0) {
                    setQueue(filteredSongs);
                    setCurrentSongIndex(0);
                    playSong(0);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold flex items-center space-x-1 shadow-md shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play All by {selectedArtist}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. PLAYLIST CATEGORY VIEW */}
        {activeTab === 'playlists' && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ListMusic className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Your Playlists ({playlists.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlaylistOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 hover:opacity-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Playlist</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Quick Create Card */}
              <div
                onClick={() => setIsPlaylistOpen(true)}
                className="p-5 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-400/60 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Create New Playlist
                </h4>
                <p className="text-xs text-zinc-400">
                  Add your favorite tracks into custom collections
                </p>
              </div>

              {playlists.map((pl) => {
                const trackCount = pl.songIds.length;
                return (
                  <div
                    key={pl.id}
                    className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                          <ListMusic className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-zinc-300">
                          {trackCount} track{trackCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-3 truncate">{pl.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {pl.description || 'Custom playlist'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => handleSelectPlaylistToPlay(pl)}
                        disabled={trackCount === 0}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold flex items-center space-x-1.5 hover:bg-cyan-400 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play All</span>
                      </button>

                      <button
                        onClick={() => setIsPlaylistOpen(true)}
                        className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. ONLINE STREAMING LIBRARY HUB BANNER */}
        {activeTab === 'cloud' && (
          <div className="mt-2 mb-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-cyan-950/50 border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1.5 w-fit">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Online Music Library</span>
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Online Songs (Live Streaming)
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {isUserAdmin(userProfile.email)
                    ? 'Yahan sabhi online songs live stream ho rahe hain. Admin panel se naye songs publish karein taaki sabhi users online sun saken.'
                    : 'Yahan sabhi online songs live stream ho rahe hain. Bina phone storage use kiye high-fidelity online streaming ka aanand lein.'}
                </p>
              </div>
              {isUserAdmin(userProfile.email) && (
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin: Publish Song</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. MAIN SONGS GRID (Displays sorted tracks for All, Offline, Cloud, or selected artist) */}
        {activeTab !== 'playlists' && (activeTab !== 'artists' || selectedArtist) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedSongs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500">
                {activeTab === 'cloud' ? (
                  <div className="max-w-md mx-auto p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-md text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Globe className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-white">Online Library me abhi koi gaana nahi hai</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isUserAdmin(userProfile.email)
                        ? 'Admin panel se songs publish karein taaki sabhi users ke liye gaane yahan online live play ho saken.'
                        : 'Jald hi yahan naye online tracks add kiye jaayenge!'}
                    </p>
                    {isUserAdmin(userProfile.email) && (
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAdminModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 cursor-pointer flex items-center space-x-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Portal Kholein</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <h4 className="text-sm font-semibold text-zinc-400">No tracks found</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Upload audio files from device gallery or scan your phone music!
                    </p>
                  </>
                )}
              </div>
            ) : (
              sortedSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const isThisPlaying = isCurrent && isPlaying;
                const formattedDate = song.addedAt
                  ? new Date(song.addedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Preset';

                return (
                  <div
                    key={song.id}
                    className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-1.5 sm:gap-2 w-full max-w-full overflow-hidden group ${
                      isCurrent
                        ? 'bg-zinc-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-white/5'
                    }`}
                  >
                    {/* Song Cover & Details (Click to Play) */}
                    <div
                      onClick={() => {
                        if (currentSong?.id === song.id) {
                          handlePlayPause();
                        } else {
                          const queueIdx = queue.findIndex((s) => s.id === song.id);
                          if (queueIdx !== -1) {
                            playSong(queueIdx, song);
                          } else {
                            setQueue((prev) => [song, ...prev]);
                            playSong(0, song);
                          }
                        }
                      }}
                      className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1 overflow-hidden cursor-pointer mr-1 sm:mr-2"
                      title={isThisPlaying ? 'Click to pause' : 'Click to play'}
                    >
                      {/* Cover Art with quick Edit Cover overlay */}
                      <div className="relative shrink-0 group/cover">
                        <img
                          src={song.coverArt || '/logo.png'}
                          alt={song.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover"
                        />
                        <div
                          className={`absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-opacity ${
                            isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          )}
                        </div>

                        {/* Direct Cover Edit & Publish Badge */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSong(song);
                          }}
                          className="absolute -bottom-1 -right-1 p-0.5 bg-black/80 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded border border-white/20 shadow cursor-pointer transition-all"
                          title="कवर बदलें और ऑनलाइन पब्लिश करें (Change Cover & Publish Online)"
                        >
                          <ImageIcon className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Title, Artist, Date Added */}
                      <div className="truncate min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center space-x-1.5 truncate">
                          <h4
                            className={`text-sm font-bold truncate ${
                              isCurrent ? 'text-cyan-400' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </h4>
                          {song.isOffline && (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                              title="Offline Ready"
                            />
                          )}
                          {Boolean(
                            (song as any).isCloudShared ||
                              (song.url &&
                                (song.url.includes('blob.vercel-storage.com') ||
                                  song.url.includes('vercel-storage')))
                          ) && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shrink-0 flex items-center space-x-1"
                              title="Online song (Cloud Streaming)"
                            >
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Online</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>

                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1 font-mono truncate">
                          <span title="Date linked/added to app">📅 {formattedDate}</span>
                          <span>•</span>
                          <span>
                            {Math.floor(song.duration / 60)}:
                            {(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Song Actions: Favorite, Change Cover & Publish, Download, Delete */}
                    <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Favorite / Like Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(song.id)}
                        className={`p-1.5 rounded-lg transition-transform hover:scale-110 active:scale-90 cursor-pointer ${
                          song.isFavorite
                            ? 'text-pink-500 hover:text-pink-400'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                        title={song.isFavorite ? 'पसंदीदा से हटाएं (Remove Favorite)' : 'पसंदीदा में जोड़ें (Add to Favorites)'}
                      >
                        <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Download to Device Storage & Save Offline */}
                      <button
                        type="button"
                        onClick={() => handleDownloadSongToDevice(song)}
                        disabled={downloadingSongId === song.id}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                          song.isOffline ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-400 hover:text-cyan-400'
                        }`}
                        title={
                          song.isOffline
                            ? 'डिवाइस में दोबारा डाउनलोड करें (MP3 File Save)'
                            : 'डिवाइस में डाउनलोड करें (Save to phone & offline)'
                        }
                      >
                        <Download
                          className={`w-4 h-4 ${
                            downloadingSongId === song.id ? 'animate-bounce text-cyan-400' : ''
                          }`}
                        />
                      </button>

                      {/* Change Cover Art & Edit Details - ALWAYS VISIBLE ON ALL SCREENS */}
                      <button
                        type="button"
                        onClick={() => setEditingSong(song)}
                        className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Change Cover Art & Song Details (कवर और डिटेल्स बदलें)"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      {/* Add to Playlist button (shown on sm+) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (playlists.length > 0) {
                            handleAddSongToPlaylist(playlists[0].id, song.id);
                            confetti({ particleCount: 15, spread: 40 });
                          } else {
                            setIsPlaylistOpen(true);
                          }
                        }}
                        className="hidden sm:inline-flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Add to Playlist"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {/* Delete Song button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Kya aap "${song.title}" ko permanently delete karna chahte hain?`)) {
                            handleDeleteSong(song.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="App se gaana delete karein (Delete Song)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* STICKY BOTTOM PLAYER BAR */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        eqSettings={eqSettings}
        sleepTimerSeconds={sleepTimerSeconds}
        syncConnected={syncConnected}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => {
          if (repeatMode === 'none') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('none');
        }}
        onToggleFavorite={handleToggleFavorite}
        onDownloadToDevice={handleDownloadSongToDevice}
        onEditSong={(song) => setEditingSong(song)}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenLyrics={() => setIsLyricsOverlayOpen(true)}
        onOpenSleepTimer={() => setIsSleepOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        accentColor={currentTheme.primaryColor}
      />

      {/* FULLSCREEN PLAYER MODAL */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        eqSettings={eqSettings}
        sleepTimerSeconds={sleepTimerSeconds}
        syncConnected={syncConnected}
        queue={queue}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => {
          if (repeatMode === 'none') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('none');
        }}
        onToggleFavorite={handleToggleFavorite}
        onDownloadToDevice={handleDownloadSongToDevice}
        onEditSong={(song) => {
          setIsFullPlayerOpen(false);
          setEditingSong(song);
        }}
        onSelectSongFromQueue={(track) => {
          const idx = queue.findIndex((s) => s.id === track.id);
          if (idx !== -1) playSong(idx);
        }}
        onMoveQueueItem={handleMoveQueueItem}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenSleepTimer={() => setIsSleepOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenLyricsOverlay={() => setIsLyricsOverlayOpen(true)}
        onUpdateLyrics={(songId, lrc) => {
          setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, lyrics: lrc } : s)));
          setQueue((prev) => prev.map((s) => (s.id === songId ? { ...s, lyrics: lrc } : s)));
        }}
        accentColor={currentTheme.primaryColor}
        secondaryColor={currentTheme.accentColor}
      />

      {/* EQUALIZER & 300% BOOST MODAL */}
      <EqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        settings={eqSettings}
        onChange={setEqSettings}
        accentColor={currentTheme.primaryColor}
      />

      {/* LISTEN TOGETHER & DUAL DEVICE SYNC MODAL */}
      <ListenTogetherModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlaySong={(song) => {
          const idx = queue.findIndex((s) => s.id === song.id);
          if (idx !== -1) {
            playSong(idx, song);
          } else {
            setQueue((prev) => [song, ...prev]);
            playSong(0, song);
          }
        }}
        onPlayPause={handlePlayPause}
        onSeek={(pos) => {
          if (audioRef.current) {
            audioRef.current.currentTime = pos;
            setCurrentTime(pos);
          }
        }}
        onStereoModeChange={(mode) => setEqSettings({ ...eqSettings, stereoChannelMode: mode })}
        accentColor={currentTheme.primaryColor}
        initialTab={syncModalTab}
      />

      {/* SLEEP TIMER MODAL */}
      <SleepTimerModal
        isOpen={isSleepOpen}
        onClose={() => setIsSleepOpen(false)}
        activeSecondsRemaining={sleepTimerSeconds}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={() => setSleepTimerSeconds(null)}
        accentColor={currentTheme.primaryColor}
      />

      {/* THEMES & CUSTOM COLOR STUDIO MODAL */}
      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        customThemes={customThemes}
        onSaveCustomTheme={handleSaveCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
      />

      {/* SOCIAL SHARE MODAL */}
      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        song={currentSong}
        roomCode={syncRoomCode}
        accentColor={currentTheme.primaryColor}
      />

      {/* PLAYLIST MODAL */}
      <PlaylistModal
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        playlists={playlists}
        songs={songs}
        onCreatePlaylist={handleCreatePlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onSelectPlaylistToPlay={handleSelectPlaylistToPlay}
        onAddSongToPlaylist={handleAddSongToPlaylist}
        onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
        onImportPlaylist={async (imported) => {
          if (imported && imported.title) {
            await savePlaylist(imported);
            setPlaylists((prev) => [...prev, imported]);
          }
        }}
        accentColor={currentTheme.primaryColor}
      />

      {/* USER ACCOUNT MODAL */}
      <UserAccountModal
        isOpen={isUserOpen}
        onClose={() => setIsUserOpen(false)}
        profile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          saveSetting('user_profile', updated);
        }}
        offlineCount={offlineSongsCount}
        onClearOfflineCache={async () => {
          setSongs((prev) => prev.map((s) => ({ ...s, isOffline: false })));
          setQueue((prev) => prev.map((s) => ({ ...s, isOffline: false })));
        }}
        accentColor={currentTheme.primaryColor}
        onOpenAdminPanel={
          isUserAdmin(userProfile.email)
            ? () => {
                setIsUserOpen(false);
                setIsAdminModalOpen(true);
              }
            : undefined
        }
      />

      {/* INSTALL ON MOBILE MODAL */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        accentColor={currentTheme.primaryColor}
      />

      {/* EDIT SONG & COVER ART MODAL */}
      <EditSongModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        song={editingSong}
        onSave={handleSaveSongEdit}
        onPublishToCloud={handlePublishSongToCloud}
        onDeleteSong={handleDeleteSong}
        accentColor={currentTheme.primaryColor}
        userEmail={userProfile.email}
      />

      {/* DEVICE AUDIO ACCESS & AUTO-SCAN MODAL */}
      <DeviceAudioPermissionModal
        isOpen={isDeviceAudioModalOpen}
        onClose={() => setIsDeviceAudioModalOpen(false)}
        onSongsImported={handleDeviceSongsImported}
        accentColor={currentTheme.primaryColor}
        isFirstTimePrompt={isFirstTimeAudioPrompt}
      />

      {/* REAL-TIME SYNCHRONIZED LYRICS OVERLAY */}
      <LyricsOverlay
        isOpen={isLyricsOverlayOpen}
        onClose={() => setIsLyricsOverlayOpen(false)}
        currentSong={currentSong}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onToggleFavorite={handleToggleFavorite}
        onUpdateSongLyrics={(songId, lrc) => {
          setSongs((prev) =>
            prev.map((s) => (s.id === songId ? { ...s, lyrics: lrc } : s))
          );
          setQueue((prev) =>
            prev.map((s) => (s.id === songId ? { ...s, lyrics: lrc } : s))
          );
        }}
        accentColor={currentTheme.primaryColor}
      />

      {/* DEDICATED ADMIN CONTROL PORTAL - STRICTLY for authorized emails only */}
      {isAdminModalOpen && isUserAdmin(userProfile.email) && (
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          songs={songs}
          userEmail={userProfile.email}
          onSongPublished={(newSong) => {
            setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
            setQueue((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
            saveSongMetadata(newSong);
          }}
          onSongDeleted={(songId) => {
            setSongs((prev) => prev.filter((s) => s.id !== songId));
            setQueue((prev) => prev.filter((s) => s.id !== songId));
            deleteSavedSong(songId).catch(() => {});
          }}
          onPlaySong={(s) => {
            const idx = songs.findIndex((x) => x.id === s.id);
            if (idx !== -1) {
              playSong(idx, s);
            } else {
              setSongs((prev) => [s, ...prev]);
              setQueue((prev) => [s, ...prev]);
              playSong(0, s);
            }
          }}
          accentColor={currentTheme.primaryColor}
        />
      )}

      {/* GLOBAL PERSISTENT SEARCH MODAL (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        songs={songs}
        playlists={playlists}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySong={(song) => {
          const idx = songs.findIndex((x) => x.id === song.id);
          if (idx !== -1) {
            playSong(idx, song);
          } else {
            setSongs((prev) => [song, ...prev]);
            setQueue((prev) => [song, ...prev]);
            playSong(0, song);
          }
        }}
        onSelectPlaylist={(pl) => {
          setActiveTab('playlists');
          setIsPlaylistOpen(true);
        }}
        onSelectArtist={(artistName) => {
          setActiveTab('artists');
          setSelectedArtist(artistName);
        }}
      />
    </div>
  );
}
