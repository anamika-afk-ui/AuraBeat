import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

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

// Room sync state for Listen Together / Party Mode
interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  stereoChannel: 'both' | 'left' | 'right';
  joinedAt: number;
  ws: WebSocket;
}

interface RoomState {
  code: string;
  hostId: string;
  currentSongId: string | null;
  isPlaying: boolean;
  positionSec: number;
  updatedAt: number; // server timestamp
  members: Map<string, RoomMember>;
}

const rooms = new Map<string, RoomState>();

// Serve Service Worker & Manifest with strict PWA headers
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

app.get('/manifest.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

// CLOUD CATALOG API (Allows creator to upload & publish songs so all users can listen online)
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
const CATALOG_FILE = path.resolve(__dirname, 'cloudCatalog.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getCloudCatalog(): any[] {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const content = fs.readFileSync(CATALOG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading cloud catalog:', err);
  }
  return [];
}

function saveCloudCatalog(catalog: any[]) {
  try {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving cloud catalog:', err);
  }
}

// 1. Get all published public online songs
app.get('/api/catalog/songs', (_req, res) => {
  const catalog = getCloudCatalog();
  res.json({ songs: catalog });
});

// 2. Publish or update a song in the online catalog
app.post('/api/catalog/publish', (req, res) => {
  try {
    const { id, title, artist, album, duration, genre, coverArt, audioBase64 } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Song title is required' });
    }

    const songId = id || 'cloud_' + Date.now();
    let audioUrl = req.body.url;

    // Save audio file if base64 passed
    if (audioBase64) {
      const fileName = `song_${songId}.mp3`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      const buffer = Buffer.from(audioBase64.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(filePath, buffer);
      audioUrl = `/uploads/${fileName}`;
    }

    // Save custom cover if base64 passed
    let finalCoverArt = coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
    if (coverArt && coverArt.startsWith('data:image')) {
      const coverFileName = `cover_${songId}.jpg`;
      const coverPath = path.join(UPLOADS_DIR, coverFileName);
      const coverBuffer = Buffer.from(coverArt.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      fs.writeFileSync(coverPath, coverBuffer);
      finalCoverArt = `/uploads/${coverFileName}`;
    }

    const catalog = getCloudCatalog();
    const existingIdx = catalog.findIndex((s) => s.id === songId);

    const songRecord = {
      id: songId,
      title: title.trim(),
      artist: (artist || 'Unknown Artist').trim(),
      album: (album || 'Public Collection').trim(),
      duration: duration || 180,
      genre: genre || 'Soundtrack',
      url: audioUrl,
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
    return res.status(500).json({ error: err.message || 'Failed to publish song' });
  }
});

// 3. Delete song from online catalog & files
app.delete('/api/catalog/delete/:id', (req, res) => {
  try {
    const songId = req.params.id;
    const catalog = getCloudCatalog();
    const updated = catalog.filter((s: any) => s.id !== songId);
    saveCloudCatalog(updated);

    // Attempt to clean up uploaded mp3 & cover if they exist
    const fileName = `song_${songId}.mp3`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
    const coverName = `cover_${songId}.jpg`;
    const coverPath = path.join(UPLOADS_DIR, coverName);
    if (fs.existsSync(coverPath)) {
      try { fs.unlinkSync(coverPath); } catch {}
    }

    return res.json({ success: true, message: 'Song deleted from cloud catalog' });
  } catch (err: any) {
    console.error('Delete catalog error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete song' });
  }
});

// API for Auto-generated lyrics using Gemini
app.post('/api/lyrics/generate', async (req, res) => {
  const { title, artist, duration } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  // If Gemini is available, generate synchronized LRC lyrics
  if (aiClient) {
    try {
      const prompt = `Generate synchronized karaoke-style LRC lyrics with accurate timestamps for the song "${title}" by "${artist || 'Unknown'}". 
Total duration is approximately ${Math.round(duration || 180)} seconds.
Output strictly LRC format lines, like:
[00:04.50] First line of lyrics
[00:10.20] Second line of lyrics
Include timestamps spread evenly across the song up to ${Math.round(duration || 180)}s. Do not add markdown code blocks or explanatory text, just the LRC content.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || '';
      return res.json({ lyrics: text.trim() });
    } catch (err: any) {
      console.error('Gemini lyrics generation error:', err);
      // Fallback continues below
    }
  }

  // High quality procedural sync lyrics generator for offline or when API key is unset
  const total = Math.max(30, Math.round(duration || 180));
  const lines = [
    `♪ ${title} - ${artist || 'AuraBeat Audio'} ♪`,
    'Feel the rhythm flowing through your mind',
    'Bass reverberating in high fidelity',
    'Turn the volume past the normal line',
    'Three hundred percent audio energy',
    'Lost inside the melody and sound',
    'Syncing up across every device around',
    'Left and right speakers harmonize so clear',
    'The cleanest frequencies you will ever hear',
    'Moving to the groove, feeling alive',
    'AuraBeat keeping the sonic pulse alive',
    'Echoes fade into the ambient night',
    'Music connects us beneath the neon light'
  ];

  let lrc = `[00:01.00] ♪ ${title} ♪\n`;
  const interval = Math.max(4, total / (lines.length + 1));
  lines.forEach((line, idx) => {
    const timeSec = (idx + 1) * interval;
    if (timeSec < total) {
      const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
      const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
      const ms = String(Math.floor((timeSec % 1) * 100)).padStart(2, '0');
      lrc += `[${mm}:${ss}.${ms}] ${line}\n`;
    }
  });

  return res.json({ lyrics: lrc });
});

// Create HTTP server
const httpServer = createServer(app);

// WebSocket server for real-time Listen Together room synchronization
const wss = new WebSocketServer({ server: httpServer, path: '/ws/sync' });

wss.on('connection', (ws) => {
  let userRoomCode: string | null = null;
  let userId: string | null = null;

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      // 1. Clock Ping / Pong for NTP-style millisecond accurate time sync
      if (data.type === 'PING') {
        ws.send(JSON.stringify({
          type: 'PONG',
          clientTime: data.clientTime,
          serverTime: Date.now(),
        }));
        return;
      }

      // 2. JOIN_ROOM
      if (data.type === 'JOIN_ROOM') {
        const { roomCode, userName, stereoChannel } = data;
        const code = (roomCode || '').toUpperCase().trim();
        const memberId = data.userId || `user_${Math.random().toString(36).substring(2, 8)}`;
        userRoomCode = code;
        userId = memberId;

        let room = rooms.get(code);
        const isHost = !room;
        if (!room) {
          room = {
            code,
            hostId: memberId,
            currentSongId: null,
            isPlaying: false,
            positionSec: 0,
            updatedAt: Date.now(),
            members: new Map(),
          };
          rooms.set(code, room);
        }

        const member: RoomMember = {
          id: memberId,
          name: userName || `Listener ${room.members.size + 1}`,
          isHost: room.hostId === memberId || isHost,
          stereoChannel: stereoChannel || 'both',
          joinedAt: Date.now(),
          ws,
        };
        room.members.set(memberId, member);

        // Send room state back to new joiner
        const memberList = Array.from(room.members.values()).map((m) => ({
          id: m.id,
          name: m.name,
          isHost: m.isHost,
          stereoChannel: m.stereoChannel,
        }));

        ws.send(JSON.stringify({
          type: 'ROOM_JOINED',
          roomCode: code,
          userId: memberId,
          isHost: member.isHost,
          state: {
            currentSongId: room.currentSongId,
            isPlaying: room.isPlaying,
            positionSec: room.positionSec,
            updatedAt: room.updatedAt,
          },
          members: memberList,
        }));

        // Broadcast to everyone else in the room
        broadcastToRoom(code, {
          type: 'MEMBER_JOINED',
          member: {
            id: member.id,
            name: member.name,
            isHost: member.isHost,
            stereoChannel: member.stereoChannel,
          },
          members: memberList,
        }, memberId);

        return;
      }

      // 3. BROADCAST_SYNC (play/pause/seek/track change)
      if (data.type === 'SYNC_STATE' && userRoomCode && userId) {
        const room = rooms.get(userRoomCode);
        if (!room) return;

        // Update room authoritative state
        room.currentSongId = data.songId ?? room.currentSongId;
        room.isPlaying = !!data.isPlaying;
        room.positionSec = typeof data.positionSec === 'number' ? data.positionSec : 0;
        room.updatedAt = Date.now();

        // Broadcast to all other peers in the room
        broadcastToRoom(userRoomCode, {
          type: 'SYNC_UPDATE',
          songId: room.currentSongId,
          isPlaying: room.isPlaying,
          positionSec: room.positionSec,
          updatedAt: room.updatedAt,
          senderId: userId,
          action: data.action || 'sync',
        }, userId || undefined);
        return;
      }

      // 4. STEREO CHANNEL CONFIGURATION (e.g. Device 1 = Left, Device 2 = Right)
      if (data.type === 'SET_STEREO_CHANNEL' && userRoomCode && userId) {
        const room = rooms.get(userRoomCode);
        if (room && room.members.has(userId)) {
          const member = room.members.get(userId)!;
          member.stereoChannel = data.stereoChannel || 'both';

          const memberList = Array.from(room.members.values()).map(m => ({
            id: m.id,
            name: m.name,
            isHost: m.isHost,
            stereoChannel: m.stereoChannel,
          }));

          broadcastToRoom(userRoomCode, {
            type: 'ROOM_MEMBERS_UPDATED',
            members: memberList,
          });
        }
        return;
      }

      // 5. CHAT & REACTION
      if (data.type === 'CHAT_MESSAGE' && userRoomCode && userId) {
        broadcastToRoom(userRoomCode, {
          type: 'CHAT_MESSAGE',
          senderId: userId,
          senderName: data.senderName,
          text: data.text,
          reaction: data.reaction,
          timestamp: Date.now(),
        });
        return;
      }

    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    if (userRoomCode && userId) {
      const room = rooms.get(userRoomCode);
      if (room) {
        room.members.delete(userId);
        if (room.members.size === 0) {
          rooms.delete(userRoomCode);
        } else {
          // If host left, elect new host
          if (room.hostId === userId) {
            const nextHost = room.members.values().next().value;
            if (nextHost) {
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
          }

          const memberList = Array.from(room.members.values()).map(m => ({
            id: m.id,
            name: m.name,
            isHost: m.isHost,
            stereoChannel: m.stereoChannel,
          }));

          broadcastToRoom(userRoomCode, {
            type: 'MEMBER_LEFT',
            leftUserId: userId,
            newHostId: room.hostId,
            members: memberList,
          });
        }
      }
    }
  });
});

function broadcastToRoom(roomCode: string, payload: any, excludeUserId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const msg = JSON.stringify(payload);
  room.members.forEach((member, memberId) => {
    if (excludeUserId && memberId === excludeUserId) return;
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(msg);
    }
  });
}

// Vite integration
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraBeat server running on port ${PORT}`);
  });
}

startServer();
