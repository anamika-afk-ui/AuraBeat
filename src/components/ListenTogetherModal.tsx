import React, { useState, useEffect } from 'react';
import { syncClient } from '../utils/syncClient';
import { SyncRoomState, SyncMember } from '../types';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';

interface ListenTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongTitle?: string;
  onStereoModeChange?: (mode: 'both' | 'left' | 'right') => void;
  accentColor?: string;
}

export const ListenTogetherModal: React.FC<ListenTogetherModalProps> = ({
  isOpen,
  onClose,
  currentSongTitle,
  onStereoModeChange,
  accentColor = '#06b6d4',
}) => {
  const [roomInput, setRoomInput] = useState('');
  const [userName, setUserName] = useState(syncClient.getUserName());
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<SyncMember[]>([]);
  const [stereoChannel, setStereoChannel] = useState<'both' | 'left' | 'right'>('both');
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    // Check if room is present in URL params on load
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !isInRoom) {
      setRoomInput(roomParam);
    }

    const unsubscribe = syncClient.subscribe((event) => {
      if (event.type === 'CONNECTED') {
        setIsInRoom(true);
        setRoomCode(event.data.roomCode);
      } else if (event.type === 'STATE_UPDATE') {
        if (event.data?.roomCode) setRoomCode(event.data.roomCode);
        if (typeof event.data?.isHost === 'boolean') setIsHost(event.data.isHost);
        if (event.data?.members) setMembers(event.data.members);
        setIsInRoom(true);
      } else if (event.type === 'MEMBERS_UPDATE') {
        if (event.data?.members) setMembers(event.data.members);
        if (typeof event.data?.isHost === 'boolean') setIsHost(event.data.isHost);
      } else if (event.type === 'DISCONNECTED') {
        setIsInRoom(false);
      } else if (event.type === 'REACTION') {
        // Trigger live confetti / celebration
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    });

    const latencyInterval = setInterval(() => {
      setLatency(syncClient.getLatency());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(latencyInterval);
    };
  }, [isInRoom]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const code = 'AUR-' + Math.floor(100 + Math.random() * 900);
    syncClient.setUserName(userName);
    syncClient.connect(code, true, stereoChannel);
    setIsInRoom(true);
    setRoomCode(code);
    setIsHost(true);
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) return;
    syncClient.setUserName(userName);
    syncClient.connect(roomInput.trim(), false, stereoChannel);
    setIsInRoom(true);
    setRoomCode(roomInput.toUpperCase().trim());
  };

  const handleLeaveRoom = () => {
    syncClient.disconnect();
    setIsInRoom(false);
    setRoomCode('');
    setMembers([]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Party Sync & Dual Device</h2>
              <p className="text-xs text-zinc-400">
                Sync 2 devices on Wi-Fi/Bluetooth or listen together long-distance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isInRoom ? (
          /* Join / Create Screen */
          <div className="mt-6 space-y-6">
            {/* User Nickname */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-white/10 focus:border-cyan-500 focus:outline-none text-sm text-white"
              />
            </div>

            {/* Create Room Box */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-emerald-950/30 border border-cyan-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-cyan-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Host a Live Music Room</span>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Generate an instant room code. Connect a 2nd device (phone, laptop) or share with friends across the world for millisecond-exact synchronized listening.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateRoom}
                className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-sm hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all"
              >
                Create Instant Sync Room
              </button>
            </div>

            {/* Join Existing Room Box */}
            <div className="p-5 rounded-xl bg-zinc-950/60 border border-white/5">
              <h3 className="text-base font-bold text-zinc-200 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Join Friend's Room or 2nd Device</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">
                Enter the 6-character room code from your other device or friend.
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AUR-782"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800/90 border border-white/10 focus:border-emerald-500 focus:outline-none text-sm uppercase font-mono tracking-widest text-center text-white"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 disabled:opacity-40 transition-all"
                >
                  Join Room
                </button>
              </div>
            </div>

            {/* Explanatory cards */}
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="p-3 rounded-lg bg-zinc-800/40 border border-white/5 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Pair 2 phones as Left + Right stereo boombox speakers</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/40 border border-white/5 flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>NTP clock drift compensation for zero-lag sync</span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Room Screen */
          <div className="mt-6 space-y-6">
            {/* Live Room Badge & Code */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-cyan-950/50 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                    LIVE SYNC ACTIVE
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-400 font-mono">
                    Latency: <strong className="text-emerald-400">{latency}ms</strong>
                  </span>
                  {isHost && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
                      HOST
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between bg-black/50 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Room Code</span>
                  <span className="text-2xl font-black font-mono tracking-widest text-cyan-400">
                    {roomCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Invite'}</span>
                </button>
              </div>

              {currentSongTitle && (
                <div className="mt-2 text-xs text-zinc-300 flex items-center space-x-1.5 truncate">
                  <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Now playing in room: <strong>{currentSongTitle}</strong></span>
                </div>
              )}
            </div>

            {/* DUAL DEVICE STEREO SPEAKER ASSIGNMENT */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Headphones className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Dual-Device Wireless Speaker Split
                </h4>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Place 2 phones or laptops in the room. Set Device 1 to Left and Device 2 to Right to experience real stereo acoustic separation!
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
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

            {/* CONNECTED MEMBERS */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Synced Devices & Listeners ({members.length || 1})</span>
                </span>
                <span className="text-[10px] text-zinc-500">Auto-synced</span>
              </div>

              <div className="space-y-2">
                {(members.length > 0 ? members : [{ id: 'me', name: userName, isHost, stereoChannel }]).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-white/5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white block">{m.name}</span>
                        <span className="text-[10px] text-zinc-400 capitalize">
                          Channel: {m.stereoChannel || 'Stereo'}
                        </span>
                      </div>
                    </div>
                    {m.isHost && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE REACTIONS */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                Send Live Real-time Vibe Reaction
              </span>
              <div className="flex justify-around">
                {[
                  { emoji: '🔥', label: 'Fire' },
                  { emoji: '💖', label: 'Love' },
                  { emoji: '⚡', label: '300%' },
                  { emoji: '💃', label: 'Dance' },
                  { emoji: '🎧', label: 'Vibe' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => sendEmojiReaction(item.emoji)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:scale-125 transition-all text-xl"
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 transition-all"
            >
              Disconnect from Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
