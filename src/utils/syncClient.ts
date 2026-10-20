/**
 * AuraBeat Real-Time Multi-Device & Long-Distance Audio Synchronizer.
 * Supports:
 * 1. Long-distance WebSocket sync with NTP millisecond drift compensation.
 * 2. Local Wi-Fi / same-machine BroadcastChannel synchronization.
 * 3. Dual-device stereo split (Device 1 = Left, Device 2 = Right).
 */

import { SyncRoomState, SyncMember } from '../types';

export type SyncCallback = (event: SyncEvent) => void;

export interface SyncEvent {
  type: 'STATE_UPDATE' | 'MEMBERS_UPDATE' | 'REACTION' | 'CONNECTED' | 'DISCONNECTED';
  data?: any;
}

class SyncClient {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private roomCode: string | null = null;
  private userId: string = '';
  private userName: string = '';
  private isHost: boolean = false;
  private stereoChannel: 'both' | 'left' | 'right' = 'both';
  private clockOffset: number = 0; // serverTime - localTime
  private latencyMs: number = 0;
  private listeners: Set<SyncCallback> = new Set();
  private pingInterval: any = null;

  constructor() {
    this.userId = 'user_' + Math.random().toString(36).substring(2, 8);
    this.userName = 'Listener ' + Math.floor(100 + Math.random() * 900);

    // BroadcastChannel for instant zero-latency multi-tab/same-device testing
    try {
      this.broadcastChannel = new BroadcastChannel('aurabeat_local_sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleLocalBroadcast(event.data);
      };
    } catch {
      // BroadcastChannel not available
    }
  }

  public subscribe(cb: SyncCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(event: SyncEvent) {
    this.listeners.forEach((cb) => cb(event));
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUserName(): string {
    return this.userName;
  }

  public setUserName(name: string) {
    this.userName = name;
  }

  public getClockOffset(): number {
    return this.clockOffset;
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  public connect(roomCode: string, isHostRole = false, channel: 'both' | 'left' | 'right' = 'both') {
    this.roomCode = roomCode.toUpperCase().trim();
    this.stereoChannel = channel;
    this.isHost = isHostRole;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/sync`;

    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Measure clock latency
        this.pingClock();
        this.pingInterval = setInterval(() => this.pingClock(), 10000);

        // Join room
        this.ws?.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomCode: this.roomCode,
          userId: this.userId,
          userName: this.userName,
          stereoChannel: this.stereoChannel,
        }));

        this.notify({ type: 'CONNECTED', data: { roomCode: this.roomCode } });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.notify({ type: 'DISCONNECTED' });
      };

      this.ws.onerror = (err) => {
        console.warn('Sync server connection notice:', err);
      };
    } catch (err) {
      console.warn('Sync connection fallback to local broadcast:', err);
    }
  }

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.notify({ type: 'DISCONNECTED' });
  }

  private pingClock() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'PING',
        clientTime: Date.now(),
      }));
    }
  }

  private handleServerMessage(msg: any) {
    if (msg.type === 'PONG') {
      const now = Date.now();
      const roundTrip = now - msg.clientTime;
      this.latencyMs = Math.round(roundTrip / 2);
      this.clockOffset = msg.serverTime - (msg.clientTime + this.latencyMs);
      return;
    }

    if (msg.type === 'ROOM_JOINED') {
      this.isHost = msg.isHost;
      this.notify({
        type: 'STATE_UPDATE',
        data: {
          roomCode: msg.roomCode,
          isHost: msg.isHost,
          state: msg.state,
          members: msg.members,
        },
      });
      return;
    }

    if (msg.type === 'MEMBER_JOINED' || msg.type === 'MEMBER_LEFT' || msg.type === 'ROOM_MEMBERS_UPDATED') {
      if (msg.newHostId && msg.newHostId === this.userId) {
        this.isHost = true;
      }
      this.notify({
        type: 'MEMBERS_UPDATE',
        data: { members: msg.members, isHost: this.isHost },
      });
      return;
    }

    if (msg.type === 'SYNC_UPDATE') {
      // Calculate adjusted song position based on server clock drift
      const now = Date.now();
      const serverNow = now + this.clockOffset;
      const timeElapsed = (serverNow - msg.updatedAt) / 1000;
      const correctedPosition = msg.isPlaying
        ? Math.max(0, msg.positionSec + Math.max(0, timeElapsed))
        : msg.positionSec;

      this.notify({
        type: 'STATE_UPDATE',
        data: {
          songId: msg.songId,
          isPlaying: msg.isPlaying,
          positionSec: correctedPosition,
          senderId: msg.senderId,
          action: msg.action,
        },
      });
      return;
    }

    if (msg.type === 'CHAT_MESSAGE') {
      this.notify({
        type: 'REACTION',
        data: {
          senderName: msg.senderName,
          text: msg.text,
          reaction: msg.reaction,
          timestamp: msg.timestamp,
        },
      });
      return;
    }
  }

  private handleLocalBroadcast(data: any) {
    if (!this.roomCode || data.roomCode !== this.roomCode) return;
    if (data.senderId === this.userId) return;

    if (data.type === 'SYNC_UPDATE') {
      this.notify({
        type: 'STATE_UPDATE',
        data: {
          songId: data.songId,
          isPlaying: data.isPlaying,
          positionSec: data.positionSec,
          senderId: data.senderId,
          action: data.action,
        },
      });
    } else if (data.type === 'REACTION') {
      this.notify({
        type: 'REACTION',
        data: data.payload,
      });
    }
  }

  // Broadcast current play/pause/seek state to everyone in room
  public broadcastPlayback(songId: string, isPlaying: boolean, positionSec: number, action = 'play') {
    if (!this.roomCode) return;

    const payload = {
      type: 'SYNC_STATE',
      roomCode: this.roomCode,
      songId,
      isPlaying,
      positionSec,
      action,
      senderId: this.userId,
      timestamp: Date.now(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }

    // Also mirror to local BroadcastChannel
    try {
      this.broadcastChannel?.postMessage({
        ...payload,
        type: 'SYNC_UPDATE',
      });
    } catch {
      // ignore
    }
  }

  public setStereoChannel(channel: 'both' | 'left' | 'right') {
    this.stereoChannel = channel;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomCode) {
      this.ws.send(JSON.stringify({
        type: 'SET_STEREO_CHANNEL',
        stereoChannel: channel,
      }));
    }
  }

  public sendReaction(reaction: string, text?: string) {
    if (!this.roomCode) return;
    const payload = {
      type: 'CHAT_MESSAGE',
      senderName: this.userName,
      reaction,
      text: text || '',
      roomCode: this.roomCode,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }

    try {
      this.broadcastChannel?.postMessage({
        type: 'REACTION',
        roomCode: this.roomCode,
        senderId: this.userId,
        payload: {
          senderName: this.userName,
          reaction,
          text: text || '',
          timestamp: Date.now(),
        },
      });
    } catch {
      // ignore
    }
  }
}

export const syncClient = new SyncClient();
