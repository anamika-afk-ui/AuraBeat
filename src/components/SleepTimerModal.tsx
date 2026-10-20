import React, { useState } from 'react';
import { Moon, Clock, Check, X, BellOff, VolumeX } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSecondsRemaining: number | null;
  onSetTimer: (minutes: number, fadeOut: boolean, endOfTrack?: boolean) => void;
  onCancelTimer: () => void;
  accentColor?: string;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeSecondsRemaining,
  onSetTimer,
  onCancelTimer,
  accentColor = '#06b6d4',
}) => {
  const [customMin, setCustomMin] = useState('20');
  const [fadeOut, setFadeOut] = useState(true);

  if (!isOpen) return null;

  const presets = [
    { label: '5 Minutes', min: 5 },
    { label: '15 Minutes', min: 15 },
    { label: '30 Minutes', min: 30 },
    { label: '45 Minutes', min: 45 },
    { label: '60 Minutes', min: 60 },
  ];

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Sleep Timer</h2>
              <p className="text-xs text-zinc-400">Drift off peacefully while music gently turns off</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Banner */}
        {activeSecondsRemaining !== null && activeSecondsRemaining > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold block">
                  Timer Active
                </span>
                <span className="text-xl font-mono font-bold text-white">
                  {formatRemaining(activeSecondsRemaining)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 border border-red-500/30"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Options */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.min}
                onClick={() => {
                  onSetTimer(p.min, fadeOut);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 text-xs font-semibold text-zinc-200 transition-all flex items-center justify-center space-x-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{p.label}</span>
              </button>
            ))}

            {/* End of track option */}
            <button
              onClick={() => {
                onSetTimer(0, fadeOut, true);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-all flex items-center justify-center space-x-1.5"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>End of this song</span>
            </button>
          </div>

          {/* Custom Duration Input */}
          <div className="p-3 rounded-xl bg-zinc-950/50 border border-white/5">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Custom Minutes
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="360"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                onClick={() => {
                  const val = parseInt(customMin, 10);
                  if (val > 0) {
                    onSetTimer(val, fadeOut);
                    onClose();
                  }
                }}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                Set
              </button>
            </div>
          </div>

          {/* Smooth Fade Out Checkbox */}
          <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <VolumeX className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-medium text-zinc-200 block">Smooth Audio Fade Out</span>
                <span className="text-[10px] text-zinc-500">Gradually lower volume in last 30 seconds</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fadeOut}
                onChange={(e) => setFadeOut(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
