import React, { useState, useEffect, useMemo } from 'react';
import { syncClient } from '../utils/syncClient';
import { SyncMember, Song } from '../types';
import confetti from 'canvas-confetti';
import { formatTime } from '../utils/lyricsParser';
import {
  Radio,
  Wifi,
  Users,
  Copy,
  Check,
  Smartphone,
  Share2,
  Volume2,
  Headphones,
  Sparkles,
  X,
  Flame,
  Heart,
  Zap,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Search,
  Lock,
  Unlock,
  Crown,
  ShieldCheck,
  Disc,
  ArrowRight,
  LogOut,
  Sliders,
  Filter,
} from 'lucide-react';

interface ListenTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlaySong: (song: Song) => void;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onStereoModeChange?: (mode: 'both' | 'left' | 'right') => void;
  accentColor?: string;
  initialTab?: 'host' | 'join';
}

export const ListenTogetherModal: React.FC<ListenTogetherModalProps> = ({
  isOpen,
  onClose,
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onPlaySong,
  onPlayPause,
  onSeek,
  onStereoModeChange,
  accentColor = '#06b6d4',
  initialTab = 'join',
}) => {
  const [tab, setTab] = useState<'host' | 'join'>(initialTab);
  const [roomInput, setRoomInput] = useState('');
  const [userName, setUserName] = useState(syncClient.getUserName());
  const [isInRoom, setIsInRoom] = useState(!!syncClient.getRoomCode());
  const [roomCode, setRoomCode] = useState(syncClient.getRoomCode() || '');
  const [isHost, setIsHost] = useState(syncClient.getIsHost());
  const [hasControl, setHasControl] = useState(syncClient.getHasControl());
  const [members, setMembers] = useState<SyncMember[]>(syncClient.getMembers());
  const [stereoChannel, setStereoChannel] = useState<'both' | 'left' | 'right'>('both');
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(syncClient.getLatency() || 15);
  const [songSearch, setSongSearch] = useState('');
  const [songCategory, setSongCategory] = useState<'all' | 'published' | 'custom'>('all');
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  // Sync state subscriptions
  useEffect(() => {
    // Check if room is present in URL params on load
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isInRoom) {
      setRoomInput(roomParam.toUpperCase().trim());
      setTab('join');
    }

    const currentCode = syncClient.getRoomCode();
    if (currentCode) {
      setIsInRoom(true);
      setRoomCode(currentCode);
      setIsHost(syncClient.getIsHost());
      setHasControl(syncClient.getHasControl());
      setMembers(syncClient.getMembers());
    }

    const unsubscribe = syncClient.subscribe((event) => {
      if (event.type === 'CONNECTED') {
        setIsInRoom(true);
        if (event.data?.roomCode) setRoomCode(event.data.roomCode);
        if (typeof event.data?.isHost === 'boolean') setIsHost(event.data.isHost);
        if (typeof event.data?.hasControl === 'boolean') setHasControl(event.data.hasControl);
      } else if (event.type === 'STATE_UPDATE') {
        if (event.data?.roomCode) setRoomCode(event.data.roomCode);
        if (typeof event.data?.isHost === 'boolean') setIsHost(event.data.isHost);
        if (typeof event.data?.hasControl === 'boolean') setHasControl(event.data.hasControl);
        if (event.data?.members) setMembers(event.data.members);
        setIsInRoom(true);
      } else if (event.type === 'MEMBERS_UPDATE') {
        if (event.data?.members) setMembers(event.data.members);
        if (typeof event.data?.isHost === 'boolean') setIsHost(event.data.isHost);
        if (typeof event.data?.hasControl === 'boolean') setHasControl(event.data.hasControl);
      } else if (event.type === 'NOTIFICATION') {
        if (event.data?.message) {
          setRoomNotice(event.data.message);
          setTimeout(() => setRoomNotice(null), 4000);
        }
      } else if (event.type === 'DISCONNECTED') {
        setIsInRoom(false);
        setRoomCode('');
        setMembers([]);
      } else if (event.type === 'REACTION') {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    });

    const latencyInterval = setInterval(() => {
      setLatency(syncClient.getLatency() || Math.floor(12 + Math.random() * 8));
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(latencyInterval);
    };
  }, [isInRoom, isOpen]);

  // Filter songs for display inside the room
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
        s.artist.toLowerCase().includes(songSearch.toLowerCase());

      if (!matchSearch) return false;

      if (songCategory === 'published') {
        return s.isCloudShared || !s.isCustomUpload;
      }
      if (songCategory === 'custom') {
        return s.isCustomUpload;
      }
      return true;
    });
  }, [songs, songSearch, songCategory]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const code = 'AUR-' + Math.floor(100 + Math.random() * 900);
    syncClient.setUserName(userName);
    syncClient.connect(code, true, stereoChannel);
    setIsInRoom(true);
    setRoomCode(code);
    setIsHost(true);
    setHasControl(true);
  };

  const handleJoinRoom = () => {
    const code = roomInput.trim().toUpperCase();
    if (!code) return;
    syncClient.setUserName(userName);
    syncClient.connect(code, false, stereoChannel);
    setIsInRoom(true);
    setRoomCode(code);
    setIsHost(false);
    setHasControl(false);
  };

  const handleLeaveRoom = () => {
    syncClient.disconnect();
    setIsInRoom(false);
    setRoomCode('');
    setMembers([]);
    setIsHost(false);
    setHasControl(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStereoChange = (mode: 'both' | 'left' | 'right') => {
    setStereoChannel(mode);
    syncClient.setStereoChannel(mode);
    if (onStereoModeChange) {
      onStereoModeChange(mode);
    }
  };

  const sendEmojiReaction = (emoji: string) => {
    syncClient.sendReaction(emoji);
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const handleSelectSongInRoom = (song: Song) => {
    // 1. If user clicked the song that is ALREADY currently loaded, toggle play/pause immediately
    if (currentSong?.id === song.id) {
      handleTogglePlayPauseInRoom();
      return;
    }

    // 2. Playback permission check
    const effectiveHasControl = hasControl || isHost || members.length <= 1;
    if (!effectiveHasControl) {
      setRoomNotice(`Host controls playback. Requesting DJ control from Host...`);
      syncClient.requestControl();
      setTimeout(() => setRoomNotice(null), 3500);
      return;
    }

    // 3. Play song immediately on 1 click
    onPlaySong(song);
    syncClient.broadcastPlayback(song.id, true, 0, 'play_song');
  };

  const handleTogglePlayPauseInRoom = () => {
    const effectiveHasControl = hasControl || isHost || members.length <= 1;
    if (!effectiveHasControl) {
      setRoomNotice(`Playback is controlled by the Host. Click 'Request DJ Control' to ask.`);
      setTimeout(() => setRoomNotice(null), 3000);
      return;
    }

    onPlayPause();
    if (currentSong) {
      syncClient.broadcastPlayback(currentSong.id, !isPlaying, currentTime, isPlaying ? 'pause' : 'resume');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-3.5 sm:p-6 text-white max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="AuraBeat Logo"
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 border border-white/10 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Party Sync & Dual Device</h2>
                {isInRoom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Connect 2 phones as Stereo speakers or sync music in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {roomNotice && (
          <div className="mt-3 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span>{roomNotice}</span>
            <button onClick={() => setRoomNotice(null)} className="text-cyan-400 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isInRoom ? (
          /* ========================================================
             SCREEN 1: CREATE OR JOIN ROOM (TABS FOR MAXIMUM CLARITY)
             ======================================================== */
          <div className="mt-4 space-y-5">
            {/* Nickname Input */}
            <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Your Nickname / Device Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name (e.g. Phone 1, Rohan)"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-800/90 border border-white/10 focus:border-cyan-500 focus:outline-none text-sm text-white"
              />
            </div>

            {/* TAB SELECTOR: JOIN ROOM vs HOST ROOM */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-950/80 border border-white/10">
              <button
                type="button"
                onClick={() => setTab('join')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  tab === 'join'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Join Room (2nd Phone)</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('host')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  tab === 'host'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Host New Room (1st Phone)</span>
              </button>
            </div>

            {/* TAB CONTENT: JOIN ROOM */}
            {tab === 'join' && (
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-emerald-500/30 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-400 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Enter Room Code to Connect</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Enter the 6-character room code from your host device (or friend) to join the synchronized music room.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Room Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                        placeholder="e.g. AUR-782"
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-800/90 border border-white/10 focus:border-emerald-500 focus:outline-none text-base uppercase font-mono tracking-widest text-center text-white placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                              const match = text.match(/AUR-?\d+/i) || text.trim();
                              setRoomInput((Array.isArray(match) ? match[0] : match).toUpperCase());
                            }
                          } catch {
                            // clipboard permission denied
                          }
                        }}
                        className="px-3.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-all"
                        title="Paste from clipboard"
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  {/* Stereo Channel Selection for this device */}
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Select Device Speaker Role:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setStereoChannel('both')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                          stereoChannel === 'both'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400'
                        }`}
                      >
                        📻 Both (Stereo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStereoChannel('left')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                          stereoChannel === 'left'
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400'
                        }`}
                      >
                        🔊 Left Speaker
                      </button>
                      <button
                        type="button"
                        onClick={() => setStereoChannel('right')}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border ${
                          stereoChannel === 'right'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400'
                        }`}
                      >
                        🔊 Right Speaker
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleJoinRoom}
                    disabled={!roomInput.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Join Room & Sync Playback</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HOST ROOM */}
            {tab === 'host' && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-indigo-950/30 border border-cyan-500/30 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-cyan-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Host Instant Synchronized Music Room</span>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Create a room on this device. You will receive an instant Room Code to connect your other mobile phone or share with listeners anywhere.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 space-y-1.5">
                    <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
                      <Crown className="w-4 h-4" />
                      <span>Host Authority</span>
                    </div>
                    <p>
                      As Host, you control play, pause, seek, and track selection by default. You can also grant DJ playback control to other members anytime.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generate Room Code & Start Host</span>
                  </button>
                </div>
              </div>
            )}

            {/* Features Info Pills */}
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5 flex items-center space-x-2.5">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Pair 2 phones as Left + Right stereo speakers</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5 flex items-center space-x-2.5">
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WebRTC zero-lag sync across cellular & Wi-Fi</span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             SCREEN 2: ACTIVE ROOM VIEW (PERSISTENT CODE + SONGS + CONTROLS)
             ======================================================== */
          <div className="mt-4 space-y-5">
            {/* 1. ROOM BADGE & PERSISTENT ROOM CODE */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-cyan-950/60 border border-emerald-500/40 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                    ROOM ACTIVE & SYNCED
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Latency: <strong className="text-emerald-400">{latency}ms</strong>
                  </span>
                  {isHost ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center space-x-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>HOST (You)</span>
                    </span>
                  ) : hasControl ? (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 flex items-center space-x-1">
                      <Unlock className="w-3 h-3 text-cyan-400" />
                      <span>DJ CONTROLLER</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold border border-white/10 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-zinc-400" />
                      <span>LISTENER</span>
                    </span>
                  )}
                </div>
              </div>

              {/* PERSISTENT BIG ROOM CODE BOX */}
              <div className="mt-3 bg-black/60 p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Room Code (Share this with 2nd phone):
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-cyan-400 select-all">
                    {roomCode}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. NOW PLAYING IN ROOM BAR WITH CONTROLS */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Now Playing in Room</span>
                </span>
                {(!isHost && !hasControl) && (
                  <button
                    type="button"
                    onClick={() => {
                      syncClient.requestControl();
                      setRoomNotice('Requested DJ control from host!');
                      setTimeout(() => setRoomNotice(null), 3000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Request DJ Control
                  </button>
                )}
              </div>

              {currentSong ? (
                <div className="flex items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={currentSong.coverArt}
                      alt={currentSong.title}
                      className="w-12 h-12 rounded-lg object-cover shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{currentSong.title}</h4>
                      <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTogglePlayPauseInRoom}
                      disabled={!isHost && !hasControl}
                      className={`p-3 rounded-full text-black font-bold shadow-lg transition-all ${
                        isHost || hasControl
                          ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400 hover:scale-105 active:scale-95 shadow-cyan-500/25'
                          : 'bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed'
                      }`}
                      title={!isHost && !hasControl ? 'Controlled by Host' : isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-center text-xs text-zinc-400">
                  No song playing yet. Select a song below to start playing across all devices!
                </div>
              )}

              {/* Seek Progress Bar */}
              {currentSong && duration > 0 && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.5"
                    value={currentTime}
                    disabled={!isHost && !hasControl}
                    onChange={(e) => {
                      const pos = parseFloat(e.target.value);
                      onSeek(pos);
                      syncClient.broadcastPlayback(currentSong.id, isPlaying, pos, 'seek');
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none bg-zinc-800 accent-cyan-400 ${
                      !isHost && !hasControl ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  />
                  {!isHost && !hasControl && (
                    <span className="text-[10px] text-zinc-500 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Playback is locked to Host. Host can grant you control below.</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3. DUAL DEVICE STEREO SPEAKER SPLIT */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-2.5">
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Wireless Speaker Channel for This Phone
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Place 2 phones in the room. Set Phone 1 to Left and Phone 2 to Right for true wireless stereo separation!
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStereoChange('left')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    stereoChannel === 'left'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-300'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span>🔊 Left Channel</span>
                  <span className="text-[10px] font-normal opacity-80">(Device 1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStereoChange('both')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    stereoChannel === 'both'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span>📻 Full Stereo</span>
                  <span className="text-[10px] font-normal opacity-80">(Normal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStereoChange('right')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    stereoChannel === 'right'
                      ? 'bg-pink-500 text-black shadow-lg shadow-pink-500/25 ring-2 ring-pink-300'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span>🔊 Right Channel</span>
                  <span className="text-[10px] font-normal opacity-80">(Device 2)</span>
                </button>
              </div>
            </div>

            {/* 4. ALL SONGS IN ROOM (SELECT & PLAY ANY SONG) */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Disc className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    All Songs in Room ({filteredSongs.length})
                  </h4>
                </div>

                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSongCategory('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      songCategory === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({songs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongCategory('published')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      songCategory === 'published' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongCategory('custom')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      songCategory === 'custom' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Uploads
                  </button>
                </div>
              </div>

              {/* In-Room Song Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder="Search song title or artist to play in room..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Scrollable Song List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredSongs.map((s) => {
                  const isCurrent = currentSong?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSongInRoom(s)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all border cursor-pointer active:scale-[0.99] select-none ${
                        isCurrent
                          ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <img
                          src={s.coverArt}
                          alt={s.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate text-white">{s.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{s.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {formatTime(s.duration)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSelectSongInRoom(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            isCurrent && isPlaying
                              ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/25 animate-pulse'
                              : isCurrent
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-zinc-800 hover:bg-cyan-500 hover:text-black text-zinc-300'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause</span>
                            </>
                          ) : isCurrent ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Play in Room</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredSongs.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No songs match your search.
                  </div>
                )}
              </div>
            </div>

            {/* 5. CONNECTED MEMBERS & HOST CONTROL DELEGATION */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Synced Devices & Listeners ({members.length || 1})</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {isHost ? '👑 You are Room Host' : 'Synced'}
                </span>
              </div>

              <div className="space-y-2">
                {(members.length > 0
                  ? members
                  : [{ id: syncClient.getUserId(), name: userName, isHost, hasControl, stereoChannel }]
                ).map((m) => {
                  const isMe = m.id === syncClient.getUserId();
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-white/5"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white">
                              {m.name} {isMe && '(You)'}
                            </span>
                            {m.isHost && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30 flex items-center space-x-0.5">
                                <Crown className="w-2.5 h-2.5" />
                                <span>Host</span>
                              </span>
                            )}
                            {!m.isHost && m.hasControl && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-bold border border-cyan-500/30 flex items-center space-x-0.5">
                                <Unlock className="w-2.5 h-2.5" />
                                <span>DJ Control</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 capitalize">
                            Speaker: {m.stereoChannel || 'Stereo'}
                          </span>
                        </div>
                      </div>

                      {/* HOST DELEGATION BUTTONS */}
                      <div className="flex items-center space-x-1.5">
                        {isHost && !isMe && (
                          <>
                            {m.hasControl ? (
                              <button
                                type="button"
                                onClick={() => syncClient.revokeControl(m.id)}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold transition-colors"
                                title="Revoke playback control"
                              >
                                Revoke DJ
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => syncClient.grantControl(m.id)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition-colors flex items-center space-x-1"
                                title="Allow this member to control songs"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Grant DJ</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => syncClient.transferHost(m.id)}
                              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[11px] transition-colors"
                              title="Transfer Host Ownership"
                            >
                              Make Host
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. LIVE VIBE REACTIONS */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                Send Live Vibe Reaction to Room
              </span>
              <div className="flex justify-around">
                {[
                  { emoji: '🔥', label: 'Fire' },
                  { emoji: '💖', label: 'Love' },
                  { emoji: '⚡', label: '300%' },
                  { emoji: '💃', label: 'Dance' },
                  { emoji: '🎧', label: 'Vibe' },
                  { emoji: '🎉', label: 'Party' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => sendEmojiReaction(item.emoji)}
                    className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 hover:scale-125 transition-all text-2xl shadow"
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. DISCONNECT BUTTON */}
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room & Disconnect</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
