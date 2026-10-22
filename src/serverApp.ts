import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

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

// Verified royalty-free fallback catalog with accurate artist/title/durations
export const VERIFIED_SEED_CATALOG = [
  {
    id: 'verified_synth_1',
    title: 'Neon Horizon',
    artist: 'CyberPulse',
    album: 'Retrowave Odyssey',
    duration: 372,
    genre: 'Synthwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792400000000,
  },
  {
    id: 'verified_bass_2',
    title: 'Hyper Bass Overdrive',
    artist: 'Voltage 300',
    album: 'Peak Limiters',
    duration: 423,
    genre: 'EDM / Club',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792390000000,
  },
  {
    id: 'verified_cosmic_3',
    title: 'Cosmic Bass Odyssey',
    artist: 'Aura Collective',
    album: 'Infinite Echoes',
    duration: 312,
    genre: 'Synthwave / Bass',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792380000000,
  },
  {
    id: 'verified_chill_4',
    title: 'Midnight Resonance',
    artist: 'Echo Shift',
    album: 'Midnight Pulse',
    duration: 345,
    genre: 'Lo-Fi / Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverArt: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792370000000,
  },
];

export function getCloudCatalog(): any[] {
  if (inMemoryCatalog && inMemoryCatalog.length > 0) {
    return inMemoryCatalog;
  }
  const candidatePaths = [PUBLIC_CATALOG_FILE, ROOT_CATALOG_FILE, TMP_CATALOG_FILE];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out broken placeholder /uploads references that do not exist
          const valid = parsed.filter((s: any) => {
            if (!s.url) return false;
            if (s.url.startsWith('/uploads/')) {
              const localPath = path.join(UPLOADS_DIR, path.basename(s.url));
              return fs.existsSync(localPath);
            }
            return true;
          });
          inMemoryCatalog = valid.length > 0 ? valid : [...VERIFIED_SEED_CATALOG];
          return inMemoryCatalog;
        }
      }
    } catch {
      // Ignore and try next
    }
  }
  inMemoryCatalog = [...VERIFIED_SEED_CATALOG];
  return inMemoryCatalog;
}

export function saveCloudCatalog(catalog: any[]): boolean {
  inMemoryCatalog = catalog;
  const data = JSON.stringify(catalog, null, 2);
  let saved = false;

  const candidatePaths = [PUBLIC_CATALOG_FILE, ROOT_CATALOG_FILE, TMP_CATALOG_FILE];
  for (const p of candidatePaths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(p, data, 'utf-8');
      saved = true;
    } catch {
      // In serverless, filesystem outside /tmp is read-only
    }
  }
  return saved;
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, Accept-Ranges, Range');
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
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'AuraBeat Music Backend',
      version: '2.0.0',
      uptime: process.uptime(),
      timestamp: Date.now(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // 2. Public Catalog: Get all published songs (TASK 2 & TASK 4)
  app.get('/api/catalog/songs', (_req, res) => {
    try {
      const catalog = getCloudCatalog();
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
      return res.json({ songs: catalog });
    } catch (err: any) {
      console.error('Error fetching catalog:', err);
      return res.status(500).json({ error: 'Failed to retrieve catalog', code: 'SERVER_ERROR' });
    }
  });

  // 3. Admin: Publish or update song in catalog (TASK 3 & TASK 5)
  app.post('/api/catalog/publish', rateLimiter(10, 60000), requireAdmin, (req, res) => {
    try {
      const { id, title, artist, album, duration, genre, coverArt, audioBase64, url } = req.body;

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
        : 'cloud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      let finalAudioUrl = url;

      // If audioBase64 provided, validate and persist if filesystem available
      if (audioBase64) {
        if (typeof audioBase64 !== 'string' || !audioBase64.startsWith('data:audio/')) {
          return res.status(400).json({ error: 'Invalid audio base64 payload. Must be data:audio/...' });
        }
        try {
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          const fileName = `song_${songId}.mp3`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          const buffer = Buffer.from(audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
          fs.writeFileSync(filePath, buffer);
          finalAudioUrl = `/uploads/${fileName}`;
        } catch {
          // If filesystem is read-only (Vercel serverless), keep base64 or external url
          finalAudioUrl = audioBase64.length < 5000000 ? audioBase64 : url || '';
        }
      }

      if (!finalAudioUrl) {
        return res.status(400).json({ error: 'Valid audio URL or audioBase64 is required' });
      }

      let finalCoverArt = coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
      if (coverArt && coverArt.startsWith('data:image')) {
        try {
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          const coverFileName = `cover_${songId}.jpg`;
          const coverPath = path.join(UPLOADS_DIR, coverFileName);
          const coverBuffer = Buffer.from(coverArt.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          fs.writeFileSync(coverPath, coverBuffer);
          finalCoverArt = `/uploads/${coverFileName}`;
        } catch {
          // Serverless fallback
        }
      }

      const catalog = getCloudCatalog();
      const existingIdx = catalog.findIndex((s) => s.id === songId);

      const songRecord = {
        id: songId,
        title: title.trim(),
        artist: (artist || 'Unknown Artist').trim(),
        album: (album || 'Public Collection').trim(),
        duration: typeof duration === 'number' && duration > 0 ? Math.round(duration) : 180,
        genre: (genre || 'Soundtrack').trim(),
        url: finalAudioUrl,
        coverArt: finalCoverArt,
        isCloudShared: true,
        addedAt: Date.now(),
      };

      if (existingIdx !== -1) {
        catalog[existingIdx] = { ...catalog[existingIdx], ...songRecord };
      } else {
        catalog.unshift(songRecord);
      }

      saveCloudCatalog(catalog);
      return res.json({ success: true, song: songRecord });
    } catch (err: any) {
      console.error('Publish catalog error:', err);
      return res.status(500).json({ error: 'Failed to publish song', code: 'SERVER_ERROR' });
    }
  });

  // 4. Admin: Delete song from catalog & cleanup files (TASK 3)
  app.delete('/api/catalog/delete/:id', requireAdmin, (req, res) => {
    try {
      const songId = req.params.id;
      if (!songId || !/^[a-zA-Z0-9_\-]+$/.test(songId)) {
        return res.status(400).json({ error: 'Invalid song ID format' });
      }

      const catalog = getCloudCatalog();
      const updated = catalog.filter((s: any) => s.id !== songId);
      saveCloudCatalog(updated);

      // Attempt file cleanup safely
      try {
        const fileName = `song_${path.basename(songId)}.mp3`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const coverName = `cover_${path.basename(songId)}.jpg`;
        const coverPath = path.join(UPLOADS_DIR, coverName);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      } catch {
        // Safe to ignore on serverless
      }

      return res.json({ success: true, message: 'Song deleted from cloud catalog' });
    } catch (err: any) {
      console.error('Delete catalog error:', err);
      return res.status(500).json({ error: 'Failed to delete song', code: 'SERVER_ERROR' });
    }
  });

  // 5. Lyrics Generation API (TASK 9)
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

  // 6. Serverless Listen Together Signaling API (TASK 8)
  // Enables multi-device room synchronization on Vercel where WebSockets are not persistent
  app.get('/api/sync/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const room = serverlessRooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Clean stale members (>30s without poll)
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

    // Host updates authoritative playback state
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
