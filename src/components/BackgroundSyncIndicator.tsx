import React, { useState, useEffect } from 'react';
import { deviceSyncEngine, DeviceSyncProgress } from '../utils/deviceSyncEngine';
import { RefreshCw, CheckCircle2, Music, FolderOpen, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackgroundSyncIndicatorProps {
  accentColor?: string;
}

export const BackgroundSyncIndicator: React.FC<BackgroundSyncIndicatorProps> = ({
  accentColor = '#06b6d4',
}) => {
  const [progress, setProgress] = useState<DeviceSyncProgress>(() => deviceSyncEngine.getProgress());
  const [showCompleteBadge, setShowCompleteBadge] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = deviceSyncEngine.subscribe((newProgress) => {
      setProgress(newProgress);
      if (newProgress.isSyncing) {
        setIsDismissed(false);
      }
      if (newProgress.isComplete && newProgress.foundSongsCount > 0) {
        setShowCompleteBadge(true);
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.85 } });
        const timer = setTimeout(() => {
          setShowCompleteBadge(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  if (isDismissed) return null;

  // Active Background Scanning State
  if (progress.isSyncing) {
    return (
      <aside
        aria-label="Background device sync status"
        className="fixed bottom-24 right-4 z-40 max-w-sm bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl shadow-emerald-950/40 animate-in slide-in-from-bottom-3 duration-250 text-white select-none pointer-events-auto"
      >
        <div className="flex items-center space-x-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between space-x-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Background Syncing...</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  {progress.foundSongsCount} found
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-white/10"
                title="Hide sync notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {progress.currentFileName
                ? `Adding: ${progress.currentFileName}`
                : `Crawling ${progress.currentFolderName}...`}
            </p>

            <div className="w-full bg-zinc-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Finished Toast State
  if (showCompleteBadge && progress.foundSongsCount > 0) {
    return (
      <aside
        aria-label="Sync complete notification"
        className="fixed bottom-24 right-4 z-40 max-w-sm bg-gradient-to-r from-emerald-950/90 to-zinc-900/95 backdrop-blur-xl border border-emerald-400/50 rounded-2xl p-3 shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-bottom-3 duration-250 text-white select-none pointer-events-auto"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Device Sync Complete!</span>
            </h4>
            <p className="text-[11px] text-zinc-300 truncate">
              {progress.foundSongsCount} songs added & ready for offline play
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompleteBadge(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  return null;
};
