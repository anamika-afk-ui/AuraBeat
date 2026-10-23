import React, { useState, useRef } from 'react';
import { Song } from '../types';
import { saveAudioBlob, saveSongMetadata } from '../utils/indexedDB';
import confetti from 'canvas-confetti';
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
  FileAudio,
  ArrowRight,
} from 'lucide-react';

interface DeviceAudioPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongsImported: (newSongs: Song[]) => void;
  accentColor?: string;
  isFirstTimePrompt?: boolean;
}

const COVER_ART_PALETTE = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80',
];

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg', '.opus', '.wma'];

export const DeviceAudioPermissionModal: React.FC<DeviceAudioPermissionModalProps> = ({
  isOpen,
  onClose,
  onSongsImported,
  accentColor = '#06b6d4',
  isFirstTimePrompt = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [scanComplete, setScanComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hidden input for fallback on mobile/browsers without showDirectoryPicker
  const fallbackFolderInputRef = useRef<HTMLInputElement>(null);
  const fallbackFilesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to extract audio duration
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const tempUrl = URL.createObjectURL(file);
      audio.src = tempUrl;
      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration) || 180;
        URL.revokeObjectURL(tempUrl);
        resolve(dur);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(180);
      };
      // Timeout fallback
      setTimeout(() => {
        resolve(180);
      }, 1500);
    });
  };

  // Process a batch of File objects into AuraBeat Songs
  const processAudioFiles = async (files: File[]) => {
    if (!files || files.length === 0) {
      setErrorMessage('Koi audio file select nahi hui.');
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setErrorMessage(null);
    let count = 0;
    const importedSongs: Song[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();
      const isAudio =
        file.type.startsWith('audio/') ||
        AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

      if (!isAudio) continue;

      setCurrentFileName(file.name);
      count++;
      setScannedCount(count);

      const songId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/^[0-9\s._-]+/, '')
        .trim();

      const duration = await getAudioDuration(file);
      const coverArt = COVER_ART_PALETTE[count % COVER_ART_PALETTE.length];

      const songObj: Song = {
        id: songId,
        title: cleanTitle || file.name,
        artist: 'Device Storage',
        album: 'My Device Music',
        duration,
        url: URL.createObjectURL(file),
        coverArt,
        genre: 'Device Audio',
        isOffline: true,
        isCustomUpload: true,
        addedAt: Date.now() + i,
      };

      // Persist in IndexedDB
      await saveAudioBlob(songId, file);
      await saveSongMetadata(songObj);

      importedSongs.push(songObj);
    }

    setIsScanning(false);

    if (importedSongs.length > 0) {
      setScanComplete(true);
      onSongsImported(importedSongs);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      localStorage.setItem('aurabeat_audio_access_status', 'granted');
      localStorage.setItem('aurabeat_audio_permission_asked', 'true');
    } else {
      setErrorMessage('Chune gaye folder me koi audio (.mp3, .m4a, etc.) nahi mila.');
    }
  };

  // Recursive directory scanner for File System Access API
  const scanDirectoryRecursively = async (dirHandle: any, filesAccumulator: File[], depth = 0) => {
    if (depth > 6) return;
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const lower = entry.name.toLowerCase();
          if (AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
            try {
              const file = await entry.getFile();
              filesAccumulator.push(file);
              setScannedCount(filesAccumulator.length);
              setCurrentFileName(entry.name);
            } catch {
              // skip unreadable file
            }
          }
        } else if (entry.kind === 'directory') {
          await scanDirectoryRecursively(entry, filesAccumulator, depth + 1);
        }
      }
    } catch (e) {
      console.warn('Directory scan error:', e);
    }
  };

  // Primary action: Request permission and start scanning
  const handleRequestPermissionAndScan = async () => {
    // 1. Unlock browser audio autoplay policy with AudioContext resume
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const tempCtx = new AudioCtx();
        if (tempCtx.state === 'suspended') {
          await tempCtx.resume();
        }
      }
    } catch {}

    setErrorMessage(null);

    // 2. Try modern File System Access API (Desktop Chrome / Edge / supported Android)
    if ('showDirectoryPicker' in window) {
      try {
        setIsScanning(true);
        setCurrentFileName('Permission requested...');
        const dirHandle = await (window as any).showDirectoryPicker({
          id: 'aurabeat_device_audio',
          mode: 'read',
          startIn: 'music',
        });

        const filesFound: File[] = [];
        await scanDirectoryRecursively(dirHandle, filesFound);

        if (filesFound.length > 0) {
          await processAudioFiles(filesFound);
        } else {
          setIsScanning(false);
          setErrorMessage('Is folder me koi audio files nahi mili. Doosra folder try karein.');
        }
        return;
      } catch (err: any) {
        setIsScanning(false);
        if (err.name === 'AbortError') {
          // User closed the OS folder picker without selecting
          return;
        }
        // If showDirectoryPicker is blocked or unsupported, fallback to standard input
      }
    }

    // 3. Fallback: Trigger HTML5 Directory / Multi-File Picker for mobile & Safari
    if (fallbackFolderInputRef.current) {
      fallbackFolderInputRef.current.click();
    } else if (fallbackFilesInputRef.current) {
      fallbackFilesInputRef.current.click();
    }
  };

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processAudioFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleSkip = () => {
    localStorage.setItem('aurabeat_audio_permission_asked', 'true');
    localStorage.setItem('aurabeat_audio_access_status', 'skipped');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900/95 border border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Glow Accent */}
        <div
          className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="AuraBeat Logo"
              className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-cyan-500/25 shrink-0 border border-white/10"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Device Audio Access
                </h2>
                {isFirstTimePrompt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    1-Time Setup
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                डिवाइस के गानों की परमिशन & ऑटोमैटिक सिंक
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

        {/* Body Content */}
        {!scanComplete && !isScanning && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Apne Device ke saare songs 1 click me load karein:</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                AuraBeat ko aapke phone ya computer storage se music files (.mp3, .m4a, .wav, .flac) scan karne ki permission dein. Iske baad aapke device ke gaane automatic library me aa jayenge aur offline play honge.
              </p>

              {/* Feature Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automatic Folder Scanning</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>300% Boost & 10-Band EQ</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>100% Offline Playback</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Private: Device me hi safe</span>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Pill */}
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px]">
              <HardDrive className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>
                <strong>100% Secure:</strong> Aapki audio files kisi server par upload nahi hoti, sirf aapke browser ki offline memory (IndexedDB) me save hoti hain.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRequestPermissionAndScan}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <FolderOpen className="w-4 h-4 text-white" />
                <span>Allow Permission & Auto-Scan Device (गाने लोड करें)</span>
              </button>

              {/* Mobile Direct Audio Selector Option */}
              <button
                type="button"
                onClick={() => fallbackFilesInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phone File Picker se Select Karein (Select Multiple)</span>
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
        )}

        {/* Scanning In Progress State */}
        {isScanning && (
          <div className="my-8 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                Device Storage Scan Ho Raha Hai...
              </h3>
              <p className="text-xs text-cyan-300 font-mono mt-1">
                {scannedCount} audio files mili
              </p>
              {currentFileName && (
                <p className="text-[11px] text-zinc-400 truncate max-w-xs mx-auto mt-2 bg-zinc-950/80 px-3 py-1 rounded-lg border border-white/5">
                  {currentFileName}
                </p>
              )}
            </div>

            <p className="text-[11px] text-zinc-400">
              Kripya thoda intezar karein, aapke audio files IndexedDB me save ho rahe hain...
            </p>
          </div>
        )}

        {/* Scan Complete / Success State */}
        {scanComplete && (
          <div className="my-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                Success! Audio Access Granted
              </h3>
              <p className="text-xs text-emerald-300 mt-1">
                🎉 Aapke device se <strong>{scannedCount} gaane</strong> successfully AuraBeat me load ho gaye!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 text-left text-xs text-zinc-300 space-y-1.5">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Music className="w-4 h-4" />
                <span>Ready for 300% Boost & Equalizer</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Aapke phone ke songs ab library me sabse upar dikhenge. Offline bhi bina internet ke play honge.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Start Listening (गाने सुनें)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden File Inputs for Directory and Multi-File Pickers */}
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
          multiple
          accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/flac,audio/ogg,.mp3,.wav,.ogg,.m4a,.flac,.aac"
          onChange={handleFallbackChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
