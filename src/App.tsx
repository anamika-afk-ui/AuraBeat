import React, { useState, useEffect, useRef } from 'react';
import { Song, Playlist, EqualizerSettings, ThemeConfig, UserProfile } from './types';
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
import { AudioVisualizer } from './components/AudioVisualizer';
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

  // User Profile & Stats
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'usr_main',
    name: 'Aura Music Master',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    totalMinutesListened: 142,
    songsPlayedCount: 38,
    favoriteGenre: 'Synthwave / Bass',
    isLoggedIn: true,
  });

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
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist' | 'duration'>('date');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'artists' | 'playlists' | 'cloud' | 'offline'>('all');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  const currentSong = queue[currentSongIndex] || songs[0] || null;

  // Initialize DB & load saved data
  useEffect(() => {
    async function loadData() {
      try {
        const savedSongs = await getAllSavedSongs();
        const map = new Map<string, Song>();

        // 1. Built-in default tracks
        DEFAULT_SONGS.forEach((s) => map.set(s.id, s));

        // 2. Creator published songs bundled directly into client build for Vercel
        BUNDLED_PUBLISHED_SONGS.forEach((s) => map.set(s.id, s));

        // 3. User local uploads saved in IndexedDB
        if (savedSongs && savedSongs.length > 0) {
          savedSongs.forEach((s) => map.set(s.id, s));
        }

        // 4. Fetch dynamic online cloud songs (checks /api/catalog/songs first, then /cloudCatalog.json for Vercel)
        try {
          let catalogSongs: Song[] = [];

          // Try server API first
          try {
            const res = await fetch('/api/catalog/songs');
            if (res.ok) {
              const data = await res.json();
              if (data.songs && Array.isArray(data.songs)) {
                catalogSongs = data.songs;
              }
            }
          } catch {
            // API not available on static hosting like Vercel
          }

          // Fallback to static public/cloudCatalog.json (served by Vercel/Netlify static hosts)
          if (catalogSongs.length === 0) {
            try {
              const staticRes = await fetch('/cloudCatalog.json');
              if (staticRes.ok) {
                const staticData = await staticRes.json();
                if (Array.isArray(staticData)) {
                  catalogSongs = staticData;
                }
              }
            } catch {
              // Static file not reachable
            }
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
          const foundIdx = queue.findIndex((s) => s.id === data.songId);
          if (foundIdx !== -1 && foundIdx !== currentSongIndex) {
            setCurrentSongIndex(foundIdx);
          }
        }

        // Synchronize play/pause
        if (typeof data.isPlaying === 'boolean' && audioRef.current) {
          if (data.isPlaying && audioRef.current.paused) {
            audioEngine.ensureRunning();
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else if (!data.isPlaying && !audioRef.current.paused) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }

        // Synchronize exact timestamp
        if (typeof data.positionSec === 'number' && audioRef.current) {
          const drift = Math.abs(audioRef.current.currentTime - data.positionSec);
          if (drift > 0.25) {
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
    if (sleepTimerSeconds === null) return;

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Pause playback
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          return null;
        }

        // Smooth fade out in the last 30 seconds
        if (sleepFadeOut && prev <= 30 && audioRef.current) {
          const targetVol = Math.max(0.05, (prev / 30) * volume);
          audioRef.current.volume = targetVol;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds, sleepFadeOut, volume]);

  // Track listening minutes
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setUserProfile((prev) => {
        const updated = {
          ...prev,
          totalMinutesListened: prev.totalMinutesListened + 1 / 60,
        };
        saveSetting('user_profile', updated);
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Check if song has local blob in IndexedDB
  const resolveAudioUrl = async (song: Song): Promise<string> => {
    try {
      const blob = await getAudioBlob(song.id);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch {
      // fallback to url
    }
    return song.url;
  };

  const playSong = async (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const song = queue[index];
    setCurrentSongIndex(index);

    audioEngine.ensureRunning();

    if (audioRef.current) {
      const resolvedSrc = await resolveAudioUrl(song);
      audioRef.current.src = resolvedSrc;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          // Increment songs count
          setUserProfile((prev) => {
            const updated = { ...prev, songsPlayedCount: prev.songsPlayedCount + 1 };
            saveSetting('user_profile', updated);
            return updated;
          });
          // Broadcast to sync room if connected
          if (syncConnected) {
            syncClient.broadcastPlayback(song.id, true, 0, 'play');
          }
        })
        .catch((e) => console.warn('Autoplay prevented:', e));
    }
  };

  const handlePlayPause = () => {
    audioEngine.ensureRunning();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (syncConnected && currentSong) {
        syncClient.broadcastPlayback(currentSong.id, false, audioRef.current.currentTime, 'pause');
      }
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (syncConnected && currentSong && audioRef.current) {
            syncClient.broadcastPlayback(currentSong.id, true, audioRef.current.currentTime, 'play');
          }
        })
        .catch(() => {});
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

  // Custom Local Audio File Upload (MP3, WAV, FLAC, M4A, AAC)
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
        const newSong: Song = {
          id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'My Local Music',
          album: 'Uploaded Tracks',
          duration: Math.round(tempAudio.duration) || 180,
          url,
          coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          genre: 'Custom Audio',
          isOffline: true,
          isCustomUpload: true,
          addedAt: Date.now(),
        };

        // Save blob and metadata to IndexedDB
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
    let audioBase64: string | undefined = undefined;
    const blob = await getAudioBlob(song.id);
    if (blob) {
      audioBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    try {
      const res = await fetch('/api/catalog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...song,
          audioBase64,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.song) {
          setSongs((prev) => prev.map((s) => (s.id === song.id ? data.song : s)));
          setQueue((prev) => prev.map((s) => (s.id === song.id ? data.song : s)));
          await saveSongMetadata(data.song);
          confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 } });
          return;
        }
      }
    } catch (e) {
      console.warn('Backend publish API not reachable (Vercel static mode), updating local state:', e);
    }

    // Fallback for Vercel static deployments
    const updated: Song = { ...song, isCloudShared: true };
    await saveSongMetadata(updated);
    setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
    setQueue((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
    confetti({ particleCount: 35, spread: 70, origin: { y: 0.7 } });
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
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'favorites') return !!s.isFavorite;
    if (activeTab === 'offline') return !!s.isOffline;
    if (activeTab === 'cloud') return !!(s as any).isCloudShared;
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
      className={`min-h-screen w-full flex flex-col bg-gradient-to-b ${currentTheme.bgGradient} text-white font-sans transition-colors duration-500 pb-28 select-none`}
    >
      {/* Hidden Core Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onDurationChange={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else {
            handleNext();
          }
        }}
      />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 px-4 md:px-8 py-3.5 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.accentColor})`,
            }}
          >
            <Disc className="w-5 h-5 text-white animate-spin [animation-duration:8s]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base md:text-lg font-extrabold tracking-tight text-white">
                AuraBeat
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-500 to-amber-500 text-black">
                300% BOOST
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              10-Band EQ • Offline Storage • Dual-Device Sync • Synced Karaoke
            </p>
          </div>
        </div>

        {/* Top Status & Shortcut Pills */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Party Mode Sync Indicator */}
          <button
            onClick={() => setIsSyncOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              syncConnected
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-300 border-white/5 hover:bg-zinc-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${syncConnected ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{syncConnected ? `Party: ${syncRoomCode}` : 'Listen Together'}</span>
          </button>

          {/* 300% Boost Quick Pill */}
          <button
            onClick={() => setIsEQOpen(true)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              boostPercent > 100
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${boostPercent > 100 ? 'fill-black' : 'text-amber-400'}`} />
            <span>{boostPercent}%</span>
          </button>

          {/* Sleep Timer Indicator Pill */}
          {sleepTimerSeconds !== null && sleepTimerSeconds > 0 && (
            <button
              onClick={() => setIsSleepOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{Math.ceil(sleepTimerSeconds / 60)}m</span>
            </button>
          )}

          {/* Install on Mobile / PWA Button */}
          <button
            onClick={() => setIsInstallOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
            title="Download / Install on Mobile"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Theme Selector */}
          <button
            onClick={() => setIsThemeOpen(true)}
            className="p-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/5 transition-colors"
            title="Theme & Colors"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* User Account */}
          <button
            onClick={() => setIsUserOpen(true)}
            className="p-1 rounded-xl bg-zinc-800/80 hover:ring-2 hover:ring-cyan-400 border border-white/5 transition-all"
            title="User Profile"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-7 h-7 rounded-lg object-cover"
            />
          </button>
        </div>
      </header>

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
              <button
                onClick={() => setIsSyncOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>{syncConnected ? 'Manage Synced Room' : 'Create / Join Sync Room'}</span>
              </button>

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
              <Globe className="w-3.5 h-3.5" />
              <span>Online / Creator Songs ({songs.filter((s) => (s as any).isCloudShared).length})</span>
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

        {/* 3. ONLINE / CREATOR DISTRIBUTION HUB BANNER */}
        {activeTab === 'cloud' && (
          <div className="mt-2 mb-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-cyan-950/50 border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Creator Online Songs Hub
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Users ko Direct Apne Songs Online Kaise Sunayein?
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  Ye gaane server cloud catalog me live hain. Jab bhi koi bhi user iss app ko open karega, to usko ye gaane yahan <strong>bina kisi upload ya download ke directly online stream</strong> karne ko milenge! Aap bhi kisi bhi gaane ke <strong>Cover / Edit</strong> icon par click karke use <strong>Publish for All Users</strong> kar sakte hain.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAudioGallery}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload & Publish Track</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. MAIN SONGS GRID (Displays sorted tracks for All, Offline, Cloud, or selected artist) */}
        {activeTab !== 'playlists' && (activeTab !== 'artists' || selectedArtist) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedSongs.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-500">
                <Music className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <h4 className="text-sm font-semibold text-zinc-400">No tracks found</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Upload audio files from device gallery or download online tracks!
                </p>
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
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-zinc-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-white/5'
                    }`}
                  >
                    {/* Song Cover & Details (Click to Play) */}
                    <div
                      onClick={() => {
                        const queueIdx = queue.findIndex((s) => s.id === song.id);
                        if (queueIdx !== -1) {
                          playSong(queueIdx);
                        } else {
                          setQueue((prev) => [song, ...prev]);
                          playSong(0);
                        }
                      }}
                      className="flex items-center space-x-3 truncate cursor-pointer flex-1 mr-2"
                      title="Click to play"
                    >
                      {/* Cover Art with quick Edit Cover overlay */}
                      <div className="relative shrink-0 group/cover">
                        <img
                          src={song.coverArt}
                          alt={song.title}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover"
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
                      </div>

                      {/* Title, Artist, Date Added */}
                      <div className="truncate">
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
                          {(song as any).isCloudShared && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shrink-0"
                              title="Online Public Track"
                            >
                              Online
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>

                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1 font-mono">
                          <span title="Date linked/added to app">📅 {formattedDate}</span>
                          <span>•</span>
                          <span>
                            {Math.floor(song.duration / 60)}:
                            {(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Song Actions: Favorite, Change Cover/Edit, Download to Device, Add to Playlist, Delete */}
                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

                      {/* Change Cover Art / Edit Song Details */}
                      <button
                        type="button"
                        onClick={() => setEditingSong(song)}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Change Cover Art & Edit Details (कवर बदलें)"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      {/* Add to Playlist button */}
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
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
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
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenLyrics={() => setIsFullPlayerOpen(true)}
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
        currentSongTitle={currentSong?.title}
        onStereoModeChange={(mode) => setEqSettings({ ...eqSettings, stereoChannelMode: mode })}
        accentColor={currentTheme.primaryColor}
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
      />
    </div>
  );
}
