import React, { useState } from 'react';
import { Song } from '../types';
import { Share2, Copy, Check, QrCode, Music, Sparkles, X, Download } from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  roomCode?: string;
  accentColor?: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  song,
  roomCode,
  accentColor = '#06b6d4',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !song) return null;

  const shareUrl = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : `${window.location.origin}${window.location.pathname}?track=${song.id}`;

  const shareText = roomCode
    ? `🎧 Listen Together in AuraBeat: "${song.title}" by ${song.artist}! Join my live synchronized room: ${roomCode} 👉 ${shareUrl}`
    : `🎵 Now playing on AuraBeat: "${song.title}" by ${song.artist} with 300% Super Audio Boost! 🚀 👉 ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} - AuraBeat`,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="AuraBeat Logo"
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 border border-white/10 shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Share Song & Room</h2>
              <p className="text-xs text-zinc-400">Share your music vibe or invite friends to sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aesthetic Social Card Preview */}
        <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Music className="w-32 h-32 text-cyan-400" />
          </div>

          <div className="flex space-x-4 items-center relative z-10">
            <img
              src={song.coverArt}
              alt={song.title}
              className="w-20 h-20 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
            />
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>AuraBeat Player</span>
              </span>
              <h3 className="text-base font-bold text-white truncate">{song.title}</h3>
              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
              {roomCode && (
                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  <span>Sync Room: {roomCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Soundwave graphic */}
          <div className="mt-4 flex items-center justify-between gap-1 h-6 px-1">
            {[40, 70, 90, 50, 30, 80, 100, 60, 45, 95, 65, 35, 75, 85, 55, 30, 60, 80, 50, 20].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400/80 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-5 space-y-3">
          <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400 truncate">
            <span className="truncate mr-2">{shareUrl}</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-sans flex items-center space-x-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp / Social / Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};
