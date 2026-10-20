import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, Check, Copy, X, Apple, Sparkles, WifiOff, Disc } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  accentColor = '#06b6d4',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>('android');

  const appUrl = window.location.href.split('?')[0];

  useEffect(() => {
    // Detect standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const isIOSDevice = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIOSDevice) setActivePlatform('ios');

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handle1TapInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Install on Mobile Phone</h2>
              <p className="text-xs text-zinc-400">Add AuraBeat to your phone home screen like a native app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap Native Install (when available in Android Chrome) */}
        {deferredPrompt && (
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-cyan-300 block">Fast 1-Tap Install Ready!</span>
              <span className="text-[11px] text-zinc-300">Click below to install directly to home screen</span>
            </div>
            <button
              onClick={handle1TapInstall}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-all flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Install Now</span>
            </button>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="flex space-x-2 mt-5 p-1 bg-zinc-950 rounded-xl border border-white/5">
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activePlatform === 'android' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android (Chrome / Samsung)</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activePlatform === 'ios' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-zinc-200" />
            <span>iPhone / iPad (Safari)</span>
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-5 space-y-4">
          {activePlatform === 'android' ? (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Android Phone me Install Karne ke 3 Steps:
              </h3>
              <ol className="text-xs text-zinc-300 space-y-2.5 list-decimal list-inside">
                <li className="leading-relaxed">
                  Apne phone ke <strong>Google Chrome</strong> browser me ye app link open karein.
                </li>
                <li className="leading-relaxed">
                  Chrome me upar right side me <strong>3 Dots (⋮)</strong> menu pe click karein.
                </li>
                <li className="leading-relaxed">
                  <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> option pe click karein.
                </li>
              </ol>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Phone ke home screen pe AuraBeat ka icon aa jayega aur full-screen app ki tarah open hoga!</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                iPhone / iPad me Install Karne ke 3 Steps:
              </h3>
              <ol className="text-xs text-zinc-300 space-y-2.5 list-decimal list-inside">
                <li className="leading-relaxed">
                  Apne iPhone me <strong>Safari Browser</strong> me ye link open karein.
                </li>
                <li className="leading-relaxed">
                  Neeche <strong>Share Button</strong> (square jisme upar arrow hota hai ⎋) pe tap karein.
                </li>
                <li className="leading-relaxed">
                  List ko neeche scroll karke <strong>"Add to Home Screen" (+)</strong> pe tap karke <strong>Add</strong> karein.
                </li>
              </ol>
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Aapke iPhone home screen pe AuraBeat app icon create ho jayega!</span>
              </div>
            </div>
          )}

          {/* Copy Link to Open on Mobile */}
          <div className="p-4 rounded-xl bg-zinc-800/40 border border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Mobile me Open Karne ke liye Link Copy Karein:
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-300 border border-white/10 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 flex items-center space-x-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Features available on mobile */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-white/5 flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Offline Chalta hai (Zero Internet)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-white/5 flex items-center space-x-2">
              <Disc className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Lock-Screen Background Play Support</span>
            </div>
          </div>
        </div>

        {/* Close */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium"
          >
            Theek Hai (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
