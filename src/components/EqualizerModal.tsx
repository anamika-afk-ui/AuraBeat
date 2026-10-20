import React from 'react';
import { EqualizerSettings } from '../types';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../utils/audioEngine';
import { Sliders, Volume2, Flame, ShieldAlert, Sparkles, RotateCcw, X, Check } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EqualizerSettings;
  onChange: (newSettings: EqualizerSettings) => void;
  accentColor?: string;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
  accentColor = '#06b6d4',
}) => {
  if (!isOpen) return null;

  const handleBandChange = (index: number, val: number) => {
    const updatedBands = [...settings.bands];
    updatedBands[index] = val;
    onChange({
      ...settings,
      preset: 'custom',
      bands: updatedBands,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const found = EQ_PRESETS.find((p) => p.id === presetId);
    if (found) {
      onChange({
        ...settings,
        preset: found.id,
        bands: [...found.bands],
        bassBoost: found.bass,
        virtualizer: found.virt,
      });
    }
  };

  const handleBoostChange = (boostVal: number) => {
    onChange({
      ...settings,
      volumeBoost: boostVal,
    });
  };

  const boostPercent = Math.round(settings.volumeBoost * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 shadow-lg shadow-cyan-500/20">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Audio Studio & Equalizer</h2>
              <p className="text-xs text-zinc-400">10-Band Graphic EQ, 300% Super Booster & 3D Spatial Audio</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onChange({
                  ...settings,
                  enabled: !settings.enabled,
                });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                settings.enabled
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{settings.enabled ? 'EQ ACTIVE' : 'EQ BYPASS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 300% SUPER VOLUME BOOST SECTION */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/30 border border-red-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Flame className={`w-5 h-5 ${boostPercent > 100 ? 'text-amber-400 animate-bounce' : 'text-zinc-400'}`} />
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Super Volume Boost (Up to 300%)
                </span>
                <span className="block text-xs text-zinc-400">
                  Web Audio Gain Engine with Dynamic Limiter & Anti-Clipping
                </span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-black font-mono ${
                  boostPercent > 200
                    ? 'text-red-400'
                    : boostPercent > 100
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {boostPercent}%
              </span>
              <span className="block text-[10px] text-zinc-400">
                {boostPercent > 100 ? '⚡ OVERDRIVE' : 'NORMAL'}
              </span>
            </div>
          </div>

          {/* Range Slider for 300% Boost */}
          <div className="relative pt-2 pb-1">
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={settings.volumeBoost}
              onChange={(e) => handleBoostChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1">
              <span>100% (Standard)</span>
              <span>150%</span>
              <span className="text-amber-400 font-bold">200% (High)</span>
              <span>250%</span>
              <span className="text-red-400 font-bold">300% (MAX BOOST)</span>
            </div>
          </div>

          {/* Quick preset boost buttons */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
            {[1.0, 1.5, 2.0, 2.5, 3.0].map((val) => (
              <button
                key={val}
                onClick={() => handleBoostChange(val)}
                className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                  Math.abs(settings.volumeBoost - val) < 0.05
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {Math.round(val * 100)}%
              </button>
            ))}
          </div>

          {/* Limiter notice */}
          <div className="flex items-center justify-between mt-3 text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Smart Brickwall Limiter Enabled (Protects speakers from distortion)</span>
            </div>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.limiterEnabled}
                onChange={(e) => onChange({ ...settings, limiterEnabled: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px] text-emerald-300">Active</span>
            </label>
          </div>
        </div>

        {/* PRESET CHIPS */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Equalizer Presets</span>
            <button
              onClick={() => handlePresetSelect('flat')}
              className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((p) => {
              const isSelected = settings.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10-BAND GRAPHIC EQUALIZER SLIDERS */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-950/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-4">
            <span>+12 dB</span>
            <span className="text-zinc-500 text-[10px]">10 FREQUENCY BANDS</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-10 gap-2 items-center h-44">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = settings.bands[idx] ?? 0;
              const formattedFreq = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between">
                  <span className="text-[10px] font-mono font-medium text-cyan-400">
                    {gain > 0 ? `+${gain}` : gain}
                  </span>
                  <div className="relative flex-1 flex items-center justify-center my-1 w-full">
                    {/* Vertical Range Slider */}
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      disabled={!settings.enabled}
                      onChange={(e) => handleBandChange(idx, parseInt(e.target.value, 10))}
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      className="w-2 h-28 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono text-center">
                    {formattedFreq}Hz
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BASS BOOST & 3D VIRTUALIZER & STEREO MODE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Bass Boost */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-zinc-300">Bass Boost</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{settings.bassBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.bassBoost}
              disabled={!settings.enabled}
              onChange={(e) =>
                onChange({ ...settings, preset: 'custom', bassBoost: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-30"
            />
            <span className="block text-[10px] text-zinc-500 mt-1">Enhances 85Hz sub-frequencies</span>
          </div>

          {/* 3D Virtualizer */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-zinc-300">3D Virtualizer</span>
              <span className="text-xs font-mono font-bold text-pink-400">{settings.virtualizer}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.virtualizer}
              disabled={!settings.enabled}
              onChange={(e) =>
                onChange({ ...settings, preset: 'custom', virtualizer: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-30"
            />
            <span className="block text-[10px] text-zinc-500 mt-1">Simulates wide spatial soundstage</span>
          </div>

          {/* Stereo Speaker Channel Assignment */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-zinc-300">Speaker Channel Mode</span>
              <span className="text-[10px] uppercase font-mono text-amber-400">{settings.stereoChannelMode}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {(['left', 'both', 'right'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ ...settings, stereoChannelMode: mode })}
                  className={`py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                    settings.stereoChannelMode === mode
                      ? 'bg-zinc-200 text-black shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode === 'both' ? 'Stereo' : mode}
                </button>
              ))}
            </div>
            <span className="block text-[10px] text-zinc-500 mt-1">Dual Device Speaker Split</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-95 shadow-lg shadow-cyan-500/25 transition-all text-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
