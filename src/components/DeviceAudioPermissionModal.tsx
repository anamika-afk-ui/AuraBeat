import React, { useState, useRef } from 'react';
import { Song } from '../types';
import { deviceSyncEngine } from '../utils/deviceSyncEngine';
import {
  FolderOpen,
  Music,
  ShieldCheck,
  Sparkles,
  X,
  Smartphone,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  FolderSearch,
} from 'lucide-react';

interface DeviceAudioPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongFound: (newSong: Song) => void;
  onSongsImported?: (newSongs: Song[]) => void;
  accentColor?: string;
  isFirstTimePrompt?: boolean;
}

export const DeviceAudioPermissionModal: React.FC<DeviceAudioPermissionModalProps> = ({
  isOpen,
  onClose,
  onSongFound,
  onSongsImported,
  accentColor = '#06b6d4',
  isFirstTimePrompt = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Hidden inputs for fallback on mobile/browsers without showDirectoryPicker
  const fallbackFolderInputRef = useRef<HTMLInputElement>(null);
  const fallbackFilesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Single-song receiver callback
  const handleSongDiscovered = (song: Song) => {
    onSongFound(song);
    if (onSongsImported) {
      onSongsImported([song]);
    }
  };

  // Primary 1-Time Permission Request
  const handleRequestPermissionAndScan = async () => {
    setErrorMessage(null);
    setIsRequesting(true);

    try {
      const result = await deviceSyncEngine.requestPermissionAndScan(
        handleSongDiscovered,
        (totalCount) => {
          console.log(`Background sync complete: ${totalCount} songs found.`);
        }
      );

      setIsRequesting(false);

      if (result.handleObtained) {
        // PERMISSION GRANTED: Close modal immediately so user can freely use the app
        // while the sync runs in the background!
        onClose();
        return;
      }

      if (result.fallbackNeeded) {
        // Fallback for mobile / Safari: Trigger directory or multi-file picker
        if (fallbackFolderInputRef.current) {
          fallbackFolderInputRef.current.click();
        } else if (fallbackFilesInputRef.current) {
          fallbackFilesInputRef.current.click();
        }
      }
    } catch (err: any) {
      setIsRequesting(false);
      setErrorMessage(err.message || 'Permission request cancel ho gaya.');
    }
  };

  // Handle fallback file / folder selection (Mobile / Safari)
  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      // Kick off background processing
      deviceSyncEngine.processFilesListInBackground(
        filesArray,
        handleSongDiscovered,
        (totalCount) => {
          console.log(`Background files processed: ${totalCount} songs.`);
        }
      );
      // Immediately close modal so user can use the app without being blocked!
      onClose();
    }
    e.target.value = '';
  };

  const handleSkip = () => {
    localStorage.setItem('aurabeat_audio_permission_asked', 'true');
    localStorage.setItem('aurabeat_device_sync_status', 'skipped');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-7 text-white max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Glow Accent */}
        <div
          className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20">
              <FolderSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Device Music Auto-Sync
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1-Time Permission
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                डिवाइस के सभी फोल्डर्स से गाने ऑटोमैटिक बैकग्राउंड में लोड करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-300 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Permission Request Body */}
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Sirf 1 baar permission dein — Sabhi folders automatic scan honge:</span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              AuraBeat aapke device ke music folders (Music, Downloads, WhatsApp Audio, Recordings) ko scan karke sabhi gaano ko app me jod dega. Permission milte hi <strong>sync background me chalega</strong> taaki aap turant gaane sun sakein aur app use kar sakein.
            </p>

            {/* Feature Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Deep Subfolder Scanning</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Background Sync (No Waiting)</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Real-Time Song Streaming</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% Private & Offline</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px]">
            <HardDrive className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>
              <strong>Surakshit:</strong> Aapki files kahin upload nahi hoti, device ke local IndexedDB me offline save hoti hain.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={isRequesting}
              onClick={handleRequestPermissionAndScan}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Requesting Folder Permission...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 text-white" />
                  <span>Allow Permission & Auto-Sync (अनुमति दें और सिंक करें)</span>
                </>
              )}
            </button>

            {/* Mobile / Direct Files Alternative */}
            <button
              type="button"
              onClick={() => fallbackFilesInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Audio Files Manually (Phone Picker)</span>
            </button>

            {isFirstTimePrompt && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Skip for now (Baad me karenge)
              </button>
            )}
          </div>
        </div>

        {/* Hidden Fallback Inputs */}
        <input
          ref={fallbackFolderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFallbackChange}
          className="hidden"
        />
        <input
          ref={fallbackFilesInputRef}
          type="file"
          accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/flac,audio/ogg,.mp3,.wav,.m4a,.flac"
          multiple
          onChange={handleFallbackChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
