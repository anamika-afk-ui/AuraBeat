import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import serverApp from './src/serverApp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = serverApp;
const httpServer = createServer(app);

// Room sync state for Listen Together / Party Mode in Node environments
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
  updatedAt: number;
  members: Map<string, RoomMember>;
}

const rooms = new Map<string, RoomState>();

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

        room.currentSongId = data.songId ?? room.currentSongId;
        room.isPlaying = !!data.isPlaying;
        room.positionSec = typeof data.positionSec === 'number' ? data.positionSec : 0;
        room.updatedAt = Date.now();

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

      // 4. STEREO CHANNEL CONFIGURATION
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
    app.use(serverApp);
    // Serve client build
    const distPath = path.resolve(__dirname, 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraBeat server running on port ${PORT}`);
  });
}

startServer();

export { app, httpServer };
