import React, { useState } from 'react';
import { ThemeConfig } from '../types';
import { PRESET_THEMES } from '../data/defaultSongs';
import { Palette, Check, Plus, Trash2, X, Sparkles } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onSelectTheme: (theme: ThemeConfig) => void;
  customThemes: ThemeConfig[];
  onSaveCustomTheme: (theme: ThemeConfig) => void;
  onDeleteCustomTheme: (themeId: string) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  customThemes,
  onSaveCustomTheme,
  onDeleteCustomTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'builder'>('presets');

  // Custom builder states
  const [customName, setCustomName] = useState('My Vibe');
  const [customPrimary, setCustomPrimary] = useState('#06b6d4');
  const [customAccent, setCustomAccent] = useState('#f43f5e');
  const [customBgStyle, setCustomBgStyle] = useState('dark_void');
  const [customGlass, setCustomGlass] = useState(0.75);

  if (!isOpen) return null;

  const bgStyles: Record<string, string> = {
    dark_void: 'from-[#08080c] via-[#101018] to-[#050508]',
    deep_navy: 'from-[#040817] via-[#09152b] to-[#030612]',
    forest_night: 'from-[#05140d] via-[#0b2619] to-[#030d08]',
    velvet_plum: 'from-[#14061a] via-[#240a2f] to-[#0b030e]',
    charcoal_amber: 'from-[#140d05] via-[#24170a] to-[#0c0803]',
  };

  const handleSaveAndApply = () => {
    const newTheme: ThemeConfig = {
      id: 'custom_' + Date.now(),
      name: customName || 'Custom Theme',
      isDark: true,
      primaryColor: customPrimary,
      accentColor: customAccent,
      bgGradient: bgStyles[customBgStyle] || bgStyles.dark_void,
      cardBg: 'rgba(18, 20, 32, 0.75)',
      textColor: '#f8fafc',
      glassOpacity: customGlass,
    };
    onSaveCustomTheme(newTheme);
    onSelectTheme(newTheme);
    setActiveTab('presets');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-cyan-500 shadow-lg shadow-pink-500/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Theme & Aesthetic Studio</h2>
              <p className="text-xs text-zinc-400">Choose dark mode themes or build your own custom color scheme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex space-x-2 mt-5 p-1 bg-zinc-950 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'presets' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Preset Themes
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'builder' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Create Custom Theme</span>
          </button>
        </div>

        {activeTab === 'presets' ? (
          /* Presets list */
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PRESET_THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all overflow-hidden ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                        : 'border-white/10 hover:border-white/30 bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{theme.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    {/* Visual Color Bar */}
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <div
                        className="w-5 h-5 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <div className="h-2 flex-1 rounded bg-gradient-to-r from-zinc-900 to-black border border-white/5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* User Custom Themes */}
            {customThemes.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <span className="text-xs uppercase font-semibold text-zinc-400 block mb-2">
                  My Custom Saved Themes
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {customThemes.map((cTheme) => {
                    const isSelected = currentTheme.id === cTheme.id;
                    return (
                      <div
                        key={cTheme.id}
                        className={`relative p-3 rounded-xl border text-left flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-zinc-800/80 ring-2 ring-cyan-400/30'
                            : 'border-white/10 bg-zinc-800/40 hover:bg-zinc-800/60'
                        }`}
                      >
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => onSelectTheme(cTheme)}
                        >
                          <span className="text-xs font-bold text-white block">{cTheme.name}</span>
                          <div className="flex items-center space-x-1.5 mt-1.5">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: cTheme.primaryColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: cTheme.accentColor }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteCustomTheme(cTheme.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete theme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Custom Theme Creator */
          <div className="mt-5 space-y-4">
            {/* Theme Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Theme Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Neon Sunset, Dark Gold"
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Colors picker */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Primary Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Secondary Glow Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Background Style */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Atmosphere & Deep Gradient
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark_void', label: 'Dark Void' },
                  { id: 'deep_navy', label: 'Deep Navy' },
                  { id: 'forest_night', label: 'Forest Night' },
                  { id: 'velvet_plum', label: 'Velvet Plum' },
                  { id: 'charcoal_amber', label: 'Warm Charcoal' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setCustomBgStyle(bg.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      customBgStyle === bg.id
                        ? 'border-cyan-400 bg-zinc-800 text-white'
                        : 'border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Pill */}
            <div
              className="p-4 rounded-xl border border-white/10 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${customPrimary}33, ${customAccent}22)`,
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                  style={{ backgroundColor: customPrimary }}
                >
                  AB
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{customName || 'Preview'}</span>
                  <span className="text-[10px] text-zinc-300">AuraBeat Custom Audio Theme</span>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow"
                style={{ backgroundColor: customAccent }}
              >
                Active
              </span>
            </div>

            <button
              onClick={handleSaveAndApply}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-cyan-500/25 transition-all"
            >
              Save & Apply Custom Theme
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
