/**
 * IndexedDB storage for offline songs, audio blobs, playlists, and user preferences.
 * Includes storage quota error handling, safe fallbacks, and Object URL revocation.
 */

import { Song, Playlist } from '../types';

const DB_NAME = 'AuraBeatDB';
const DB_VERSION = 2;

const STORE_SONGS = 'songs';
const STORE_AUDIO_BLOBS = 'audio_blobs';
const STORE_PLAYLISTS = 'playlists';
const STORE_SETTINGS = 'settings';

// Active object URLs tracking to prevent memory leaks
const activeObjectUrls = new Set<string>();

export function createManagedBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  activeObjectUrls.add(url);
  return url;
}

export function revokeManagedBlobUrl(url: string) {
  if (url && activeObjectUrls.has(url)) {
    URL.revokeObjectURL(url);
    activeObjectUrls.delete(url);
  }
}

export function revokeAllManagedBlobUrls() {
  activeObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
  activeObjectUrls.clear();
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_SONGS)) {
        db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO_BLOBS)) {
        db.createObjectStore(STORE_AUDIO_BLOBS, { keyPath: 'songId' });
      }
      if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
        db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Songs Cache
export async function saveSongMetadata(song: Song): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SONGS, 'readwrite');
      tx.objectStore(STORE_SONGS).put(song);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error('Device storage is full. Please delete some offline tracks to free up space.');
    }
    throw err;
  }
}

export async function getAllSavedSongs(): Promise<Song[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SONGS, 'readonly');
      const req = tx.objectStore(STORE_SONGS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteSavedSong(songId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SONGS, STORE_AUDIO_BLOBS], 'readwrite');
      tx.objectStore(STORE_SONGS).delete(songId);
      tx.objectStore(STORE_AUDIO_BLOBS).delete(songId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('deleteSavedSong error:', err);
  }
}

// Audio Blob Cache for Full Offline Playback
export async function saveAudioBlob(songId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, 'readwrite');
      tx.objectStore(STORE_AUDIO_BLOBS).put({ songId, blob, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error('Device storage is full. Cannot save audio file offline.');
    }
    throw err;
  }
}

export async function getAudioBlob(songId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, 'readonly');
      const req = tx.objectStore(STORE_AUDIO_BLOBS).get(songId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// Cache remote song for 100% offline playback
export async function downloadSongForOffline(song: Song): Promise<string> {
  try {
    const resp = await fetch(song.url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    await saveAudioBlob(song.id, blob);
    const updated: Song = { ...song, isOffline: true };
    await saveSongMetadata(updated);
    return createManagedBlobUrl(blob);
  } catch (e: any) {
    console.error('Failed to download song for offline:', e);
    throw e;
  }
}

// Playlists
export async function savePlaylist(playlist: Playlist): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
      tx.objectStore(STORE_PLAYLISTS).put(playlist);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error('Storage is full. Cannot create new playlist.');
    }
    throw err;
  }
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYLISTS, 'readonly');
      const req = tx.objectStore(STORE_PLAYLISTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
      tx.objectStore(STORE_PLAYLISTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('deletePlaylist error:', err);
  }
}

// Generic Settings (Equalizer, Themes, User)
export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      tx.objectStore(STORE_SETTINGS).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('saveSetting caught error (safe fallback):', err);
  }
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const req = tx.objectStore(STORE_SETTINGS).get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result.value : defaultValue);
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}
