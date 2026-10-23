import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { put, list, del } from '@vercel/blob';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'public', 'uploads');
const PUBLIC_CATALOG_FILE = path.resolve(ROOT_DIR, 'public', 'cloudCatalog.json');
const ROOT_CATALOG_FILE = path.resolve(ROOT_DIR, 'cloudCatalog.json');
const TMP_CATALOG_FILE = '/tmp/cloudCatalog.json';

// Initialize Gemini client if key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini AI initialization skipped:', err);
  }
}

// In-memory catalog cache for serverless resiliency
let inMemoryCatalog: any[] | null = null;

// Empty seed catalog - demo songs removed per user request.
// Only songs stored on Vercel Blob storage will be populated dynamically.
export const VERIFIED_SEED_CATALOG: any[] = [];

/**
 * Helper to retrieve Vercel Blob Read/Write token from request headers or environment variables.
 */
export function getBlobToken(req?: any): string | undefined {
  const token =
    req?.headers?.['x-blob-token'] ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : undefined;
}

/**
 * Checks if a song URL is hosted on Vercel Blob Storage.
 */
export function isVercelBlobUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('blob.vercel-storage.com') || url.includes('vercel-storage');
}

/**
 * Retrieves the catalog from Vercel Blob storage (or local cache).
 * Strictly filters to ONLY return tracks hosted on Vercel Blob storage.
 */
export async function getCloudCatalog(token?: string): Promise<any[]> {
  const blobToken = token || getBlobToken();

  // 1. If Vercel Blob token is available, attempt to fetch catalog directly from Vercel Blob
  if (blobToken) {
    try {
      const blobList = await list({ prefix: 'aurabeat/catalog.json', token: blobToken, limit: 1 });
      if (blobList.blobs && blobList.blobs.length > 0) {
        const catalogBlobUrl = blobList.blobs[0].url;
        const res = await fetch(catalogBlobUrl, { cache: 'no-store' });
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed)) {
            const vercelOnly = parsed.filter((s: any) => s && isVercelBlobUrl(s.url));
            inMemoryCatalog = vercelOnly;
            return vercelOnly;
          }
        }
      }
    } catch (err) {
      console.warn('Vercel Blob catalog fetch error:', err);
    }
  }

  // 2. Return in-memory if already populated with vercel storage tracks
  if (inMemoryCatalog !== null) {
    return inMemoryCatalog.filter((s: any) => s && isVercelBlobUrl(s.url));
  }

  // 3. Fallback to local files only if they contain valid vercel storage songs
  const candidatePaths = [PUBLIC_CATALOG_FILE, ROOT_CATALOG_FILE, TMP_CATALOG_FILE];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const vercelTracks = parsed.filter((s: any) => s && isVercelBlobUrl(s.url));
          inMemoryCatalog = vercelTracks;
          return vercelTracks;
        }
      }
    } catch {
      // Continue
    }
  }

  inMemoryCatalog = [];
  return [];
}

/**
 * Persists the catalog to Vercel Blob storage and local files.
 * Ensures only tracks with Vercel Blob URLs are saved.
 */
export async function saveCloudCatalog(catalog: any[], token?: string): Promise<boolean> {
  const vercelOnly = catalog.filter((s: any) => s && isVercelBlobUrl(s.url));
  inMemoryCatalog = vercelOnly;

  const blobToken = token || getBlobToken();
  let savedToBlob = false;

  if (blobToken) {
    try {
      await put('aurabeat/catalog.json', JSON.stringify(vercelOnly, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: blobToken,
        contentType: 'application/json',
      });
      savedToBlob = true;
    } catch (err) {
      console.warn('Failed to save catalog.json to Vercel Blob:', err);
    }
  }

  // Also sync to local files if writable
  const data = JSON.stringify(vercelOnly, null, 2);
  const candidatePaths = [PUBLIC_CATALOG_FILE, ROOT_CATALOG_FILE, TMP_CATALOG_FILE];
  for (const p of candidatePaths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, data, 'utf-8');
    } catch {}
  }

  return savedToBlob;
}

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }
    record.count++;
    next();
  };
}

// Admin Authorization Middleware (TASK 3)
function requireAdmin(req: any, res: any, next: any) {
  const configuredKey =
    process.env.ADMIN_SECRET_KEY || process.env.ADMIN_KEY || 'aurabeat-admin-secret-2026';
  const providedKey =
    req.headers['x-admin-key'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      error: 'Unauthorized: Valid admin credentials (x-admin-key or Bearer token) required.',
      code: 'UNAUTHORIZED',
    });
  }
  next();
}

// HTTP Serverless Room Signaling Map for Listen Together fallback on Vercel
const serverlessRooms = new Map<string, {
  code: string;
  hostId: string;
  currentSongId: string | null;
  isPlaying: boolean;
  positionSec: number;
  updatedAt: number;
  members: Array<{ id: string; name: string; isHost: boolean; stereoChannel: string; updatedAt: number }>;
}>();

export function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global CORS & Range Headers for Audio Streaming and Catalog Access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, x-blob-token, Accept-Ranges, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Serve uploads with byte-range seeking if directory exists
  if (fs.existsSync(UPLOADS_DIR)) {
    app.use(
      '/uploads',
      express.static(UPLOADS_DIR, {
        setHeaders: (res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
      })
    );
  }

  // 1. Health check endpoint (for Vercel & uptime monitors)
  app.get('/api/health', (req, res) => {
    const blobToken = getBlobToken(req);
    res.json({
      status: 'ok',
      service: 'AuraBeat Music Backend',
      version: '3.0.0',
      uptime: process.uptime(),
      timestamp: Date.now(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      storage: {
        provider: 'vercel-blob',
        configured: !!blobToken,
      },
    });
  });

  // 2. Vercel Blob Status API
  app.get('/api/blob/status', (req, res) => {
    const token = getBlobToken(req);
    res.json({
      configured: !!token,
      provider: 'vercel-blob',
      message: token
        ? 'Vercel Blob Storage is connected and ready.'
        : 'BLOB_READ_WRITE_TOKEN is not configured. Add it in your Vercel project environment variables.',
    });
  });

  // 3. Vercel Blob Direct Upload API
  app.post('/api/blob/upload', rateLimiter(20, 60000), requireAdmin, async (req, res) => {
    try {
      const blobToken = getBlobToken(req);
      if (!blobToken) {
        return res.status(400).json({
          error: 'Vercel Blob token is required. Please set BLOB_READ_WRITE_TOKEN.',
          code: 'BLOB_TOKEN_MISSING',
        });
      }

      const { filename, base64Data, contentType, folder } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'filename and base64Data are required' });
      }

      const cleanFolder = folder === 'covers' ? 'aurabeat/covers' : 'aurabeat/songs';
      const cleanFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const rawBase64 = String(base64Data).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(rawBase64, 'base64');

      const blob = await put(`${cleanFolder}/${cleanFilename}`, buffer, {
        access: 'public',
        token: blobToken,
        contentType: contentType || (cleanFolder.includes('covers') ? 'image/jpeg' : 'audio/mpeg'),
        addRandomSuffix: true,
      });

      return res.json({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      });
    } catch (err: any) {
      console.error('Vercel Blob upload error:', err);
      return res.status(500).json({ error: err.message || 'Blob upload failed' });
    }
  });

  // 4. Vercel Blob List API
  app.get('/api/blob/list', async (req, res) => {
    try {
      const blobToken = getBlobToken(req);
      if (!blobToken) {
        return res.json({ blobs: [], configured: false });
      }
      const result = await list({ prefix: 'aurabeat/', token: blobToken });
      return res.json({ blobs: result.blobs, configured: true });
    } catch (err: any) {
      console.error('Vercel Blob list error:', err);
      return res.status(500).json({ error: err.message || 'Failed to list blobs' });
    }
  });

  // 5. Public Catalog: Get all published songs on Vercel Blob Storage
  app.get('/api/catalog/songs', async (req, res) => {
    try {
      const blobToken = getBlobToken(req);
      const catalog = await getCloudCatalog(blobToken);
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.json({
        songs: catalog,
        storageProvider: 'vercel-blob',
        isBlobConfigured: !!blobToken,
      });
    } catch (err: any) {
      console.error('Error fetching catalog:', err);
      return res.status(500).json({ error: 'Failed to retrieve catalog', code: 'SERVER_ERROR' });
    }
  });

  // 6. Admin: Publish song directly into Vercel Blob Storage
  app.post('/api/catalog/publish', rateLimiter(15, 60000), requireAdmin, async (req, res) => {
    try {
      const { id, title, artist, album, duration, genre, coverArt, audioBase64, url } = req.body;
      const blobToken = getBlobToken(req);

      // Validation
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Song title is required (string, 1-120 chars)' });
      }
      if (title.length > 120) {
        return res.status(400).json({ error: 'Song title exceeds max length of 120 chars' });
      }
      if (artist && (typeof artist !== 'string' || artist.length > 100)) {
        return res.status(400).json({ error: 'Invalid artist name (max 100 chars)' });
      }

      const songId = (id && /^[a-zA-Z0-9_\-]+$/.test(id))
        ? id
        : 'blob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      let finalAudioUrl = url;

      // If audioBase64 provided, upload directly to Vercel Blob
      if (audioBase64) {
        if (typeof audioBase64 !== 'string' || !audioBase64.startsWith('data:audio/')) {
          return res.status(400).json({ error: 'Invalid audio base64 payload. Must be data:audio/...' });
        }

        if (!blobToken) {
          return res.status(400).json({
            error: 'Vercel Blob Storage token (BLOB_READ_WRITE_TOKEN) is required to store audio online.',
            code: 'VERCEL_BLOB_TOKEN_REQUIRED',
          });
        }

        const match = audioBase64.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.*)$/);
        const ext = match ? (match[1] === 'mpeg' ? 'mp3' : match[1]) : 'mp3';
        const rawBase64 = match ? match[2] : audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        const audioBuffer = Buffer.from(rawBase64, 'base64');

        const blobAudio = await put(`aurabeat/songs/${songId}.${ext}`, audioBuffer, {
          access: 'public',
          token: blobToken,
          contentType: `audio/${ext === 'mp3' ? 'mpeg' : ext}`,
          addRandomSuffix: true,
        });
        finalAudioUrl = blobAudio.url;
      }

      if (!finalAudioUrl || !isVercelBlobUrl(finalAudioUrl)) {
        return res.status(400).json({
          error: 'Song audio must be stored on Vercel Blob Storage (https://*.public.blob.vercel-storage.com).',
          code: 'INVALID_VERCEL_BLOB_URL',
        });
      }

      let finalCoverArt = coverArt || '/logo.png';
      if (coverArt && coverArt.startsWith('data:image')) {
        const match = coverArt.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
        const ext = match ? match[1] : 'jpg';
        const rawBase64 = match ? match[2] : coverArt.replace(/^data:image\/\w+;base64,/, '');
        const coverBuffer = Buffer.from(rawBase64, 'base64');

        if (blobToken) {
          try {
            const blobCover = await put(`aurabeat/covers/${songId}.${ext}`, coverBuffer, {
              access: 'public',
              token: blobToken,
              contentType: `image/${ext}`,
              addRandomSuffix: true,
            });
            finalCoverArt = blobCover.url;
          } catch (coverErr) {
            console.warn('Cover upload to Vercel Blob failed, using logo fallback:', coverErr);
          }
        }
      }

      const catalog = await getCloudCatalog(blobToken);
      const existingIdx = catalog.findIndex((s) => s.id === songId);

      const songRecord = {
        id: songId,
        title: title.trim(),
        artist: (artist || 'Unknown Artist').trim(),
        album: (album || 'Vercel Blob Collection').trim(),
        duration: typeof duration === 'number' && duration > 0 ? Math.round(duration) : 180,
        genre: (genre || 'Soundtrack').trim(),
        url: finalAudioUrl,
        coverArt: finalCoverArt,
        isCloudShared: true,
        storageProvider: 'vercel-blob',
        addedAt: Date.now(),
      };

      if (existingIdx !== -1) {
        catalog[existingIdx] = { ...catalog[existingIdx], ...songRecord };
      } else {
        catalog.unshift(songRecord);
      }

      await saveCloudCatalog(catalog, blobToken);
      return res.json({ success: true, song: songRecord });
    } catch (err: any) {
      console.error('Publish catalog error:', err);
      return res.status(500).json({ error: err.message || 'Failed to publish song to Vercel Blob', code: 'SERVER_ERROR' });
    }
  });

  // 7. Admin: Delete song from Vercel Blob Storage & cleanup blobs
  app.delete('/api/catalog/delete/:id', requireAdmin, async (req, res) => {
    try {
      const songId = req.params.id;
      if (!songId || !/^[a-zA-Z0-9_\-]+$/.test(songId)) {
        return res.status(400).json({ error: 'Invalid song ID format' });
      }

      const blobToken = getBlobToken(req);
      const catalog = await getCloudCatalog(blobToken);
      const target = catalog.find((s: any) => s.id === songId);
      const updated = catalog.filter((s: any) => s.id !== songId);
      await saveCloudCatalog(updated, blobToken);

      // Clean up blobs from Vercel Blob Storage
      if (blobToken && target) {
        try {
          if (target.url && isVercelBlobUrl(target.url)) {
            await del(target.url, { token: blobToken });
          }
          if (target.coverArt && isVercelBlobUrl(target.coverArt)) {
            await del(target.coverArt, { token: blobToken });
          }
        } catch (delErr) {
          console.warn('Vercel Blob deletion warning:', delErr);
        }
      }

      return res.json({ success: true, message: 'Song deleted from Vercel Blob catalog' });
    } catch (err: any) {
      console.error('Delete catalog error:', err);
      return res.status(500).json({ error: 'Failed to delete song', code: 'SERVER_ERROR' });
    }
  });

  // 8. Lyrics Generation API
  app.post('/api/lyrics/generate', rateLimiter(20, 60000), async (req, res) => {
    try {
      const { title, artist, duration } = req.body;
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Song title is required' });
      }

      const cleanTitle = title.trim().substring(0, 100);
      const cleanArtist = (artist || 'Unknown Artist').trim().substring(0, 80);
      const totalSec = Math.max(30, Math.min(600, Math.round(Number(duration) || 180)));

      // If Gemini is available, generate synchronized LRC lyrics
      if (aiClient) {
        try {
          const prompt = `Generate synchronized karaoke-style LRC lyrics with accurate timestamps for the song "${cleanTitle}" by "${cleanArtist}". 
Total duration is approximately ${totalSec} seconds.
Output strictly LRC format lines, like:
[00:04.50] First line of lyrics
[00:10.20] Second line of lyrics
Include timestamps spread evenly across the song up to ${totalSec}s. Do not add markdown code blocks or explanatory text, just the LRC content.`;

          const response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

          const text = (response.text || '').trim();
          if (text.includes('[00:')) {
            return res.json({
              lyrics: text,
              isGenerated: true,
              source: 'gemini-ai',
              disclaimer: 'Karaoke sync lyrics generated procedurally for playback timing.',
            });
          }
        } catch (err) {
          console.warn('Gemini lyrics generation fallback:', err);
        }
      }

      // Procedural sync lyrics generator
      const lines = [
        `♪ ${cleanTitle} - ${cleanArtist} ♪`,
        'Feel the rhythm flowing through your mind',
        'Bass reverberating in high fidelity',
        'Turn the volume past the normal line',
        'AuraBeat audio energy in sync',
        'Lost inside the melody and sound',
        'Syncing up across every device around',
        'Left and right speakers harmonize so clear',
        'The cleanest frequencies you will ever hear',
        'Moving to the groove, feeling alive',
        'Keeping the sonic pulse alive',
        'Echoes fade into the ambient night',
        'Music connects us beneath the neon light',
      ];

      let lrc = `[00:01.00] ♪ ${cleanTitle} ♪\n`;
      const interval = Math.max(4, totalSec / (lines.length + 1));
      lines.forEach((line, idx) => {
        const timeSec = (idx + 1) * interval;
        if (timeSec < totalSec) {
          const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
          const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
          const ms = String(Math.floor((timeSec % 1) * 100)).padStart(2, '0');
          lrc += `[${mm}:${ss}.${ms}] ${line}\n`;
        }
      });

      return res.json({
        lyrics: lrc,
        isGenerated: true,
        source: 'procedural-sync',
        disclaimer: 'Karaoke sync lyrics generated procedurally for playback timing.',
      });
    } catch (err: any) {
      console.error('Lyrics generation error:', err);
      return res.status(500).json({ error: 'Failed to generate lyrics', code: 'SERVER_ERROR' });
    }
  });

  // 9. Serverless Listen Together Signaling API
  app.get('/api/sync/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const room = serverlessRooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const now = Date.now();
    room.members = room.members.filter((m) => now - m.updatedAt < 30000);
    return res.json({ room });
  });

  app.post('/api/sync/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const { userId, userName, isHost, songId, isPlaying, positionSec, stereoChannel, action } = req.body;

    let room = serverlessRooms.get(code);
    const now = Date.now();

    if (!room) {
      room = {
        code,
        hostId: userId || 'host',
        currentSongId: songId || null,
        isPlaying: !!isPlaying,
        positionSec: Number(positionSec) || 0,
        updatedAt: now,
        members: [],
      };
      serverlessRooms.set(code, room);
    }

    if (userId) {
      const existingMember = room.members.find((m) => m.id === userId);
      if (existingMember) {
        existingMember.name = userName || existingMember.name;
        existingMember.stereoChannel = stereoChannel || existingMember.stereoChannel;
        existingMember.updatedAt = now;
      } else {
        room.members.push({
          id: userId,
          name: userName || `Listener ${room.members.length + 1}`,
          isHost: !!isHost,
          stereoChannel: stereoChannel || 'both',
          updatedAt: now,
        });
      }
    }

    if (isHost || action === 'sync' || room.hostId === userId) {
      if (songId !== undefined) room.currentSongId = songId;
      if (isPlaying !== undefined) room.isPlaying = !!isPlaying;
      if (positionSec !== undefined) room.positionSec = Number(positionSec);
      room.updatedAt = now;
    }

    return res.json({ success: true, room });
  });

  return app;
}

export const serverApp = createExpressApp();
export default serverApp;
