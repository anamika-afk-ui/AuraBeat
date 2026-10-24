/**
 * AuraBeat Device Background Audio Sync Engine
 * 
 * Capabilities:
 * 1. 1-Time Permission Prompt: Remembers permission & directory handle in IndexedDB.
 * 2. Deep Recursive Folder Crawling: Traverses all device folders (Music, Downloads, Audio, etc.)
 * 3. 100% Background Execution: Non-blocking, allows the user to continue using the player seamlessly.
 * 4. Live Incremental Streaming: New songs appear in the app library immediately as they are scanned.
 */

import { Song } from '../types';
import {
  saveAudioBlob,
  saveSongMetadata,
  saveSetting,
  getSetting,
  getAllSavedSongs,
} from './indexedDB';

export interface DeviceSyncProgress {
  isSyncing: boolean;
  totalScanned: number;
  currentFileName: string;
  currentFolderName: string;
  foundSongsCount: number;
  isComplete: boolean;
  error: string | null;
}

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg', '.opus', '.wma', '.alac'];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
];

// Helper to extract clean metadata from filename
export function parseAudioFilename(filename: string): { title: string; artist: string; album: string } {
  // Strip file extension
  let clean = filename.replace(/\.[^/.]+$/, '').trim();

  // Strip leading track numbers like "01 - ", "1. ", "01_", etc.
  clean = clean.replace(/^[0-9\s._-]+/, '').trim();

  let artist = 'Device Artist';
  let title = clean;
  let album = 'Device Music';

  // Check common separator formats like "Artist - Title" or "Artist _ Title"
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  } else if (clean.includes(' – ')) {
    const parts = clean.split(' – ');
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' – ').trim();
    }
  }

  // Remove common fluff from title like [Official Audio], (Official Video), (Lyrics)
  title = title
    .replace(/\[(official|audio|video|lyrics|hd|4k|hq)[\w\s]*\]/gi, '')
    .replace(/\((official|audio|video|lyrics|hd|4k|hq)[\w\s]*\)/gi, '')
    .trim();

  return {
    title: title || clean || 'Audio Track',
    artist: artist || 'Device Music',
    album,
  };
}

// Quick duration probe with fast timeout
export function probeAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    let resolved = false;
    const audio = new Audio();
    const tempUrl = URL.createObjectURL(file);
    audio.src = tempUrl;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          URL.revokeObjectURL(tempUrl);
        } catch {}
      }
    };

    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration);
      cleanup();
      resolve(dur && !isNaN(dur) && dur > 0 ? dur : 180);
    };

    audio.onerror = () => {
      cleanup();
      resolve(180);
    };

    // Timeout fallback so one slow file never hangs background sync
    setTimeout(() => {
      cleanup();
      resolve(180);
    }, 1200);
  });
}

class DeviceSyncEngine {
  private progress: DeviceSyncProgress = {
    isSyncing: false,
    totalScanned: 0,
    currentFileName: '',
    currentFolderName: '',
    foundSongsCount: 0,
    isComplete: false,
    error: null,
  };

  private listeners = new Set<(progress: DeviceSyncProgress) => void>();
  private knownSignatures = new Set<string>();
  private isInitialized = false;

  public subscribe(listener: (progress: DeviceSyncProgress) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.progress });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProgress(): DeviceSyncProgress {
    return { ...this.progress };
  }

  private notify(update: Partial<DeviceSyncProgress>) {
    this.progress = { ...this.progress, ...update };
    const snapshot = { ...this.progress };
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  /**
   * Initializes known song cache to prevent duplicate imports
   */
  public async initKnownSongs() {
    if (this.isInitialized) return;
    try {
      const existing = await getAllSavedSongs();
      existing.forEach((s) => {
        if (s.title) {
          this.knownSignatures.add(`${s.title.toLowerCase()}_${s.artist.toLowerCase()}`);
        }
        if (s.id) {
          this.knownSignatures.add(s.id);
        }
      });
      this.isInitialized = true;
    } catch {
      this.isInitialized = true;
    }
  }

  /**
   * Processes a single audio file and yields it immediately to the app
   */
  public async processAndStreamAudioFile(
    file: File,
    folderName: string,
    onSongFound: (song: Song) => void
  ): Promise<Song | null> {
    const lowerName = file.name.toLowerCase();
    const isAudio =
      file.type.startsWith('audio/') ||
      AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isAudio) return null;

    const { title, artist, album } = parseAudioFilename(file.name);
    const signature = `${title.toLowerCase()}_${artist.toLowerCase()}_${file.size}`;
    const nameSignature = `${title.toLowerCase()}_${artist.toLowerCase()}`;

    // Skip if already imported
    if (this.knownSignatures.has(signature) || this.knownSignatures.has(nameSignature)) {
      return null;
    }

    this.notify({
      currentFileName: file.name,
      currentFolderName: folderName,
      totalScanned: this.progress.totalScanned + 1,
    });

    const duration = await probeAudioDuration(file);
    const coverArt = PRESET_COVERS[(this.progress.foundSongsCount + file.size) % PRESET_COVERS.length];

    // Create a deterministic unique ID
    const songId = 'device_' + Math.abs(file.size ^ Date.now()).toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    const newSong: Song = {
      id: songId,
      title,
      artist,
      album: folderName && folderName !== '.' ? folderName : album,
      duration,
      url: URL.createObjectURL(file),
      coverArt,
      genre: 'Device Audio',
      isOffline: true,
      isCustomUpload: true,
      addedAt: Date.now(),
    };

    // Asynchronously persist to IndexedDB
    try {
      await saveAudioBlob(songId, file);
      await saveSongMetadata(newSong);
    } catch (e) {
      console.warn('Could not persist audio blob to IndexedDB:', e);
    }

    this.knownSignatures.add(signature);
    this.knownSignatures.add(nameSignature);
    this.knownSignatures.add(songId);

    const newCount = this.progress.foundSongsCount + 1;
    this.notify({ foundSongsCount: newCount });

    // Stream live to app immediately!
    onSongFound(newSong);

    return newSong;
  }

  /**
   * Deep recursive directory scanner for modern File System Access API
   */
  public async crawlDirectoryRecursive(
    dirHandle: any,
    folderPath: string,
    depth: number,
    onSongFound: (song: Song) => void
  ): Promise<number> {
    if (depth > 15) return 0; // Guard depth

    let added = 0;
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const lower = entry.name.toLowerCase();
          if (AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
            try {
              const file = await entry.getFile();
              const song = await this.processAndStreamAudioFile(file, folderPath || dirHandle.name, onSongFound);
              if (song) added++;
              // Yield briefly to event loop to keep UI smooth and 60 FPS
              await new Promise((r) => setTimeout(r, 10));
            } catch (fileErr) {
              // Skip unreadable files
            }
          }
        } else if (entry.kind === 'directory') {
          // Recursively crawl all subdirectories like Music, Downloads, WhatsApp, Recordings
          const nextFolder = folderPath ? `${folderPath}/${entry.name}` : entry.name;
          this.notify({ currentFolderName: nextFolder });
          const subCount = await this.crawlDirectoryRecursive(entry, nextFolder, depth + 1, onSongFound);
          added += subCount;
        }
      }
    } catch (err) {
      console.warn('Error crawling directory:', folderPath, err);
    }
    return added;
  }

  /**
   * Request 1-time permission from user & kick off deep background scan
   */
  public async requestPermissionAndScan(
    onSongFound: (song: Song) => void,
    onComplete?: (total: number) => void
  ): Promise<{ handleObtained: boolean; fallbackNeeded: boolean }> {
    await this.initKnownSongs();

    // Unlock browser audio policy
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const temp = new AudioCtx();
        if (temp.state === 'suspended') await temp.resume();
      }
    } catch {}

    // Check File System Access API
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          id: 'aurabeat_music_folders',
          mode: 'read',
          startIn: 'music',
        });

        if (dirHandle) {
          // Save handle & permission state in IndexedDB / localStorage
          try {
            await saveSetting('device_dir_handle', dirHandle);
          } catch {}
          localStorage.setItem('aurabeat_device_sync_granted', 'true');
          localStorage.setItem('aurabeat_audio_permission_asked', 'true');

          // Kick off background sync asynchronously WITHOUT BLOCKING
          this.runBackgroundScanOnHandle(dirHandle, onSongFound, onComplete);
          return { handleObtained: true, fallbackNeeded: false };
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { handleObtained: false, fallbackNeeded: false };
        }
        console.warn('showDirectoryPicker failed, falling back:', err);
      }
    }

    // Modern API not available or failed -> fallback input needed
    return { handleObtained: false, fallbackNeeded: true };
  }

  /**
   * Runs the background scan asynchronously
   */
  private async runBackgroundScanOnHandle(
    dirHandle: any,
    onSongFound: (song: Song) => void,
    onComplete?: (total: number) => void
  ) {
    this.notify({
      isSyncing: true,
      isComplete: false,
      error: null,
      totalScanned: 0,
      foundSongsCount: 0,
      currentFolderName: dirHandle.name || 'Device Storage',
    });

    try {
      const total = await this.crawlDirectoryRecursive(dirHandle, dirHandle.name || 'Device', 0, onSongFound);
      this.notify({
        isSyncing: false,
        isComplete: true,
        currentFileName: '',
      });
      localStorage.setItem('aurabeat_last_device_sync', Date.now().toString());
      if (onComplete) onComplete(total);
    } catch (err: any) {
      console.error('Background sync failed:', err);
      this.notify({
        isSyncing: false,
        error: err.message || 'Sync error',
      });
    }
  }

  /**
   * Process a list of File objects in the background (used for mobile file/folder picker)
   */
  public async processFilesListInBackground(
    files: File[],
    onSongFound: (song: Song) => void,
    onComplete?: (total: number) => void
  ) {
    await this.initKnownSongs();

    this.notify({
      isSyncing: true,
      isComplete: false,
      error: null,
      totalScanned: 0,
      foundSongsCount: 0,
      currentFolderName: 'Selected Files / Folders',
    });

    let added = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Extract folder name from webkitRelativePath if available
        let folderName = 'Device Storage';
        if ((file as any).webkitRelativePath) {
          const parts = (file as any).webkitRelativePath.split('/');
          if (parts.length > 1) {
            folderName = parts.slice(0, parts.length - 1).join('/');
          }
        }

        const song = await this.processAndStreamAudioFile(file, folderName, onSongFound);
        if (song) added++;

        // Brief yield so the UI remains 100% responsive and smooth
        if (i % 2 === 0) {
          await new Promise((r) => setTimeout(r, 10));
        }
      }

      localStorage.setItem('aurabeat_device_sync_granted', 'true');
      localStorage.setItem('aurabeat_audio_permission_asked', 'true');
      localStorage.setItem('aurabeat_last_device_sync', Date.now().toString());

      this.notify({
        isSyncing: false,
        isComplete: true,
        currentFileName: '',
      });
      if (onComplete) onComplete(added);
    } catch (err: any) {
      this.notify({
        isSyncing: false,
        error: err.message || 'File processing error',
      });
    }
  }

  /**
   * Automatically attempts silent background sync if permission was previously granted
   */
  public async attemptAutoSilentSync(
    onSongFound: (song: Song) => void,
    onComplete?: (total: number) => void
  ): Promise<boolean> {
    const isGranted = localStorage.getItem('aurabeat_device_sync_granted') === 'true';
    if (!isGranted) return false;

    try {
      const storedHandle = await getSetting<any>('device_dir_handle', null);
      if (storedHandle && typeof storedHandle.queryPermission === 'function') {
        const perm = await storedHandle.queryPermission({ mode: 'read' });
        if (perm === 'granted') {
          await this.initKnownSongs();
          this.runBackgroundScanOnHandle(storedHandle, onSongFound, onComplete);
          return true;
        }
      }
    } catch (e) {
      console.warn('Auto silent sync not possible:', e);
    }
    return false;
  }
}

export const deviceSyncEngine = new DeviceSyncEngine();
