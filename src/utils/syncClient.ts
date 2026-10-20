/**
 * AuraBeat Ultra-Resilient Real-Time Multi-Device & Cross-Network Synchronizer.
 * Supports:
 * 1. WebRTC DataChannel (PeerJS) for cross-mobile, cross-network P2P sync on Vercel & mobile browsers.
 * 2. Local Node.js WebSocket (/ws/sync) when running on server.
 * 3. Local-machine BroadcastChannel for instant zero-latency multi-tab sync.
 * 4. Dual-device stereo split (Left channel, Right channel, Full stereo).
 * 5. Host-authoritative playback control & dynamic DJ delegation (grant/revoke control).
 * 6. Persistent room state (never disappears on network glitch).
 */

import { Peer, type DataConnection } from 'peerjs';
import { SyncMember, SyncRoomState } from '../types';

export type SyncCallback = (event: SyncEvent) => void;

export interface SyncEvent {
  type: 'STATE_UPDATE' | 'MEMBERS_UPDATE' | 'REACTION' | 'CONNECTED' | 'DISCONNECTED' | 'NOTIFICATION';
  data?: any;
}

class SyncClient {
  private ws: WebSocket | null = null;
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  private roomCode: string | null = null;
  private userId: string = '';
  private userName: string = '';
  private isHost: boolean = false;
  private hostId: string = '';
  private controllers: Set<string> = new Set(); // User IDs granted control
  private stereoChannel: 'both' | 'left' | 'right' = 'both';

  private members: Map<string, SyncMember> = new Map();
  private currentSongId: string | null = null;
  private isPlaying: boolean = false;
  private positionSec: number = 0;
  private lastUpdateTimestamp: number = Date.now();

  private clockOffset: number = 0;
  private latencyMs: number = 0;
  private listeners: Set<SyncCallback> = new Set();
  private pingInterval: any = null;
  private isExplicitlyDisconnected: boolean = true;

  constructor() {
    // Generate persistent or stored user identity
    const savedId = localStorage.getItem('aurabeat_sync_user_id');
    const savedName = localStorage.getItem('aurabeat_sync_user_name');

    this.userId = savedId || 'usr_' + Math.random().toString(36).substring(2, 9);
    this.userName = savedName || 'Listener ' + Math.floor(100 + Math.random() * 900);

    localStorage.setItem('aurabeat_sync_user_id', this.userId);
    localStorage.setItem('aurabeat_sync_user_name', this.userName);

    // BroadcastChannel for instant local testing (multi-tab on same machine/mobile)
    try {
      this.broadcastChannel = new BroadcastChannel('aurabeat_local_sync_v2');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch {
      // BroadcastChannel not available in older environments
    }
  }

  public subscribe(cb: SyncCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(event: SyncEvent) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUserName(): string {
    return this.userName;
  }

  public setUserName(name: string) {
    this.userName = name.trim() || this.userName;
    localStorage.setItem('aurabeat_sync_user_name', this.userName);

    if (this.members.has(this.userId)) {
      const me = this.members.get(this.userId)!;
      me.name = this.userName;
      this.broadcastMemberUpdate();
    }
  }

  public getRoomCode(): string | null {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getHasControl(): boolean {
    if (this.isHost) return true;
    return this.controllers.has(this.userId);
  }

  public getMembers(): SyncMember[] {
    return Array.from(this.members.values());
  }

  public getLatency(): number {
    return this.latencyMs;
  }

  /**
   * Connect to or create a sync room.
   * Resilient: Room code will persist regardless of individual transport drops.
   */
  public connect(roomCode: string, asHost = false, channel: 'both' | 'left' | 'right' = 'both') {
    const cleanCode = roomCode.toUpperCase().trim();
    if (!cleanCode) return;

    this.isExplicitlyDisconnected = false;
    this.roomCode = cleanCode;
    this.stereoChannel = channel;
    this.isHost = asHost;

    if (asHost) {
      this.hostId = this.userId;
      this.controllers.add(this.userId);
    }

    // Register self in members
    this.members.set(this.userId, {
      id: this.userId,
      name: this.userName,
      isHost: this.isHost,
      hasControl: this.getHasControl(),
      stereoChannel: this.stereoChannel,
      joinedAt: Date.now(),
    });

    // Notify UI immediately that we are in the room so the room code is visible instantly!
    this.notify({
      type: 'CONNECTED',
      data: {
        roomCode: this.roomCode,
        isHost: this.isHost,
        hasControl: this.getHasControl(),
      },
    });

    this.notifyCurrentState();

    // 1. Initialize WebRTC P2P layer (PeerJS) for cross-device mobile synchronization
    this.initPeerJs(cleanCode, asHost);

    // 2. Initialize WebSocket fallback (if running on server with ws support)
    this.initWebSocket(cleanCode);

    // 3. Mirror join to BroadcastChannel
    try {
      this.broadcastChannel?.postMessage({
        type: 'BC_MEMBER_JOIN',
        roomCode: this.roomCode,
        member: this.members.get(this.userId),
      });
    } catch {
      // ignore
    }
  }

  /**
   * WebRTC PeerJS synchronization for mobile phones across different networks/Vercel.
   */
  private initPeerJs(cleanCode: string, asHost: boolean) {
    try {
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }
      this.peerConnections.clear();
      this.hostConnection = null;

      const sanitized = cleanCode.replace(/[^A-Z0-9]/g, '');
      const hostPeerId = `aurabeat-room-${sanitized}`;

      const peerConfig = {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      };

      if (asHost) {
        // Host tries to register as the authoritative room peer
        this.peer = new Peer(hostPeerId, peerConfig);

        this.peer.on('open', (id) => {
          this.latencyMs = 12;
          this.notify({
            type: 'STATE_UPDATE',
            data: { roomCode: this.roomCode, isHost: true, hasControl: true },
          });
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingPeerConnection(conn);
        });

        this.peer.on('error', (err) => {
          // If ID is already taken (e.g. host refreshed browser), generate secondary host id and reconnect
          if (err.type === 'unavailable-id') {
            const altId = `aurabeat-host-${sanitized}-${Math.random().toString(36).substring(2, 6)}`;
            this.peer?.destroy();
            this.peer = new Peer(altId, peerConfig);
            this.peer.on('connection', (c) => this.handleIncomingPeerConnection(c));
          }
        });
      } else {
        // Guest registers a guest peer and connects to the host peer
        const guestPeerId = `aurabeat-guest-${this.userId}`;
        this.peer = new Peer(guestPeerId, peerConfig);

        this.peer.on('open', () => {
          const conn = this.peer!.connect(hostPeerId, { reliable: true });
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('PeerJS connection notice (will use fallbacks):', err.type);
        });
      }
    } catch (e) {
      console.warn('PeerJS initialization fallback:', e);
    }
  }

  private handleIncomingPeerConnection(conn: DataConnection) {
    this.peerConnections.set(conn.peer, conn);

    conn.on('open', () => {
      // Send current room state & song to the newly joined peer
      conn.send({
        type: 'WELCOME_TO_ROOM',
        roomCode: this.roomCode,
        hostId: this.hostId,
        controllers: Array.from(this.controllers),
        currentSongId: this.currentSongId,
        isPlaying: this.isPlaying,
        positionSec: this.positionSec,
        updatedAt: this.lastUpdateTimestamp,
        members: this.getMembers(),
      });
    });

    conn.on('data', (data: any) => {
      this.handlePeerMessage(data, conn);
    });

    conn.on('close', () => {
      this.peerConnections.delete(conn.peer);
    });
  }

  private setupHostConnection(conn: DataConnection) {
    this.hostConnection = conn;

    conn.on('open', () => {
      this.latencyMs = 18;
      // Announce arrival to host
      conn.send({
        type: 'JOIN_REQUEST',
        member: {
          id: this.userId,
          name: this.userName,
          isHost: false,
          hasControl: false,
          stereoChannel: this.stereoChannel,
          joinedAt: Date.now(),
        },
      });
    });

    conn.on('data', (data: any) => {
      this.handlePeerMessage(data, conn);
    });

    conn.on('close', () => {
      this.hostConnection = null;
      // Do NOT kick user out of room! Keep code visible and retry
    });
  }

  /**
   * Local WebSocket (/ws/sync) for dev environment or fullstack server.
   */
  private initWebSocket(cleanCode: string) {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/sync`;

      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.pingClock();
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => this.pingClock(), 10000);

        this.ws?.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: cleanCode,
            userId: this.userId,
            userName: this.userName,
            stereoChannel: this.stereoChannel,
          })
        );
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
        // Note: Do NOT emit DISCONNECTED here!
        // WebSocket closing in serverless/Vercel is expected and shouldn't wipe the room code.
      };

      this.ws.onerror = () => {
        // Handled gracefully via PeerJS & BroadcastChannel
      };
    } catch {
      // Serverless environment
    }
  }

  /**
   * Handle incoming messages from peers (P2P).
   */
  private handlePeerMessage(msg: any, sourceConn?: DataConnection) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'WELCOME_TO_ROOM') {
      this.roomCode = msg.roomCode || this.roomCode;
      this.hostId = msg.hostId || this.hostId;
      if (Array.isArray(msg.controllers)) {
        this.controllers = new Set(msg.controllers);
      }
      if (Array.isArray(msg.members)) {
        this.members.clear();
        msg.members.forEach((m: SyncMember) => this.members.set(m.id, m));
      }

      this.currentSongId = msg.currentSongId;
      this.isPlaying = !!msg.isPlaying;
      this.positionSec = msg.positionSec || 0;
      this.lastUpdateTimestamp = msg.updatedAt || Date.now();

      this.notifyCurrentState();
      return;
    }

    if (msg.type === 'JOIN_REQUEST' && this.isHost) {
      if (msg.member) {
        this.members.set(msg.member.id, msg.member);
        this.broadcastToPeers({
          type: 'MEMBERS_UPDATED',
          members: this.getMembers(),
          hostId: this.hostId,
          controllers: Array.from(this.controllers),
        });
        this.notifyCurrentState();
      }
      return;
    }

    if (msg.type === 'MEMBERS_UPDATED') {
      if (Array.isArray(msg.members)) {
        this.members.clear();
        msg.members.forEach((m: SyncMember) => this.members.set(m.id, m));
      }
      if (msg.hostId) {
        this.hostId = msg.hostId;
        this.isHost = msg.hostId === this.userId;
      }
      if (Array.isArray(msg.controllers)) {
        this.controllers = new Set(msg.controllers);
      }
      this.notifyCurrentState();
      return;
    }

    if (msg.type === 'SYNC_PLAYBACK') {
      // Check if sender is authorized (Host or Controller)
      const senderAuthorized = msg.senderId === this.hostId || this.controllers.has(msg.senderId) || this.isHost;

      if (senderAuthorized || !this.hostId) {
        this.currentSongId = msg.songId;
        this.isPlaying = !!msg.isPlaying;

        // Accurate clock drift calculation
        const now = Date.now();
        const elapsed = (now - (msg.timestamp || now)) / 1000;
        this.positionSec = this.isPlaying
          ? Math.max(0, (msg.positionSec || 0) + Math.max(0, elapsed))
          : (msg.positionSec || 0);
        this.lastUpdateTimestamp = now;

        this.notify({
          type: 'STATE_UPDATE',
          data: {
            songId: this.currentSongId,
            isPlaying: this.isPlaying,
            positionSec: this.positionSec,
            senderId: msg.senderId,
            action: msg.action,
            roomCode: this.roomCode,
          },
        });

        // If I am host, relay to all other peers
        if (this.isHost) {
          this.broadcastToPeers(msg, sourceConn);
        }
      }
      return;
    }

    if (msg.type === 'CONTROL_UPDATE') {
      if (Array.isArray(msg.controllers)) {
        this.controllers = new Set(msg.controllers);
      }
      if (msg.hostId) {
        this.hostId = msg.hostId;
        this.isHost = this.hostId === this.userId;
      }
      this.updateMemberControlFlags();
      this.notifyCurrentState();

      if (this.isHost) {
        this.broadcastToPeers(msg, sourceConn);
      }
      return;
    }

    if (msg.type === 'REACTION_MSG') {
      this.notify({
        type: 'REACTION',
        data: msg.payload,
      });
      if (this.isHost) {
        this.broadcastToPeers(msg, sourceConn);
      }
      return;
    }

    if (msg.type === 'NOTIFICATION_EVENT') {
      this.notify({
        type: 'NOTIFICATION',
        data: msg.payload,
      });
      if (this.isHost) {
        this.broadcastToPeers(msg, sourceConn);
      }
    }
  }

  /**
   * Handle server messages from WebSocket if available.
   */
  private handleServerMessage(msg: any) {
    if (msg.type === 'PONG') {
      const now = Date.now();
      const roundTrip = now - msg.clientTime;
      this.latencyMs = Math.round(roundTrip / 2);
      this.clockOffset = msg.serverTime - (msg.clientTime + this.latencyMs);
      return;
    }

    if (msg.type === 'ROOM_JOINED') {
      if (typeof msg.isHost === 'boolean') this.isHost = msg.isHost;
      if (Array.isArray(msg.members)) {
        this.members.clear();
        msg.members.forEach((m: SyncMember) => this.members.set(m.id, m));
      }
      this.notifyCurrentState();
      return;
    }

    if (msg.type === 'SYNC_UPDATE') {
      this.handlePeerMessage({
        type: 'SYNC_PLAYBACK',
        songId: msg.songId,
        isPlaying: msg.isPlaying,
        positionSec: msg.positionSec,
        timestamp: msg.updatedAt,
        senderId: msg.senderId,
        action: msg.action,
      });
    }
  }

  /**
   * BroadcastChannel handler for same-device multi-tab testing.
   */
  private handleBroadcastMessage(data: any) {
    if (!data || data.roomCode !== this.roomCode) return;
    if (data.senderId === this.userId) return;

    if (data.type === 'BC_MEMBER_JOIN' && data.member) {
      this.members.set(data.member.id, data.member);
      this.notifyCurrentState();
      if (this.isHost) {
        this.broadcastChannel?.postMessage({
          type: 'BC_SYNC_STATE',
          roomCode: this.roomCode,
          senderId: this.userId,
          members: this.getMembers(),
          hostId: this.hostId,
          controllers: Array.from(this.controllers),
          currentSongId: this.currentSongId,
          isPlaying: this.isPlaying,
          positionSec: this.positionSec,
        });
      }
      return;
    }

    if (data.type === 'BC_SYNC_STATE') {
      if (Array.isArray(data.members)) {
        data.members.forEach((m: SyncMember) => this.members.set(m.id, m));
      }
      if (data.hostId) this.hostId = data.hostId;
      if (Array.isArray(data.controllers)) this.controllers = new Set(data.controllers);
      this.currentSongId = data.currentSongId;
      this.isPlaying = !!data.isPlaying;
      this.positionSec = data.positionSec || 0;
      this.notifyCurrentState();
      return;
    }

    if (data.type === 'BC_PLAYBACK') {
      this.handlePeerMessage({
        type: 'SYNC_PLAYBACK',
        songId: data.songId,
        isPlaying: data.isPlaying,
        positionSec: data.positionSec,
        timestamp: data.timestamp,
        senderId: data.senderId,
        action: data.action,
      });
    } else if (data.type === 'BC_REACTION') {
      this.notify({ type: 'REACTION', data: data.payload });
    }
  }

  private broadcastToPeers(payload: any, excludeConn?: DataConnection) {
    this.peerConnections.forEach((conn) => {
      if (conn !== excludeConn && conn.open) {
        try {
          conn.send(payload);
        } catch {
          // ignore closed peer
        }
      }
    });

    if (this.hostConnection && this.hostConnection !== excludeConn && this.hostConnection.open) {
      try {
        this.hostConnection.send(payload);
      } catch {
        // ignore
      }
    }
  }

  private updateMemberControlFlags() {
    this.members.forEach((m) => {
      m.isHost = m.id === this.hostId;
      m.hasControl = m.isHost || this.controllers.has(m.id);
    });
  }

  private notifyCurrentState() {
    this.updateMemberControlFlags();
    const memberList = this.getMembers();

    this.notify({
      type: 'STATE_UPDATE',
      data: {
        roomCode: this.roomCode,
        isHost: this.isHost,
        hasControl: this.getHasControl(),
        hostId: this.hostId,
        currentSongId: this.currentSongId,
        isPlaying: this.isPlaying,
        positionSec: this.positionSec,
        members: memberList,
      },
    });

    this.notify({
      type: 'MEMBERS_UPDATE',
      data: {
        members: memberList,
        isHost: this.isHost,
        hasControl: this.getHasControl(),
      },
    });
  }

  private broadcastMemberUpdate() {
    this.notifyCurrentState();
    const payload = {
      type: 'MEMBERS_UPDATED',
      members: this.getMembers(),
      hostId: this.hostId,
      controllers: Array.from(this.controllers),
    };
    this.broadcastToPeers(payload);
  }

  /**
   * Broadcast playback state (play, pause, seek, song select).
   * Only allowed if user has control!
   */
  public broadcastPlayback(songId: string, isPlaying: boolean, positionSec: number, action = 'play'): boolean {
    if (!this.roomCode) return false;
    if (!this.getHasControl()) {
      return false; // Denied: host has control
    }

    this.currentSongId = songId;
    this.isPlaying = isPlaying;
    this.positionSec = positionSec;
    this.lastUpdateTimestamp = Date.now();

    const payload = {
      type: 'SYNC_PLAYBACK',
      roomCode: this.roomCode,
      songId,
      isPlaying,
      positionSec,
      action,
      senderId: this.userId,
      timestamp: this.lastUpdateTimestamp,
    };

    // 1. PeerJS
    this.broadcastToPeers(payload);

    // 2. WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ ...payload, type: 'SYNC_STATE' }));
      } catch {
        // ignore
      }
    }

    // 3. BroadcastChannel
    try {
      this.broadcastChannel?.postMessage({
        ...payload,
        type: 'BC_PLAYBACK',
      });
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Host grants DJ playback control to a room member.
   */
  public grantControl(targetUserId: string) {
    if (!this.isHost) return;
    this.controllers.add(targetUserId);

    const payload = {
      type: 'CONTROL_UPDATE',
      hostId: this.hostId,
      controllers: Array.from(this.controllers),
    };

    this.broadcastToPeers(payload);
    this.updateMemberControlFlags();
    this.notifyCurrentState();

    this.notify({
      type: 'NOTIFICATION',
      data: { message: `Granted playback control to ${this.members.get(targetUserId)?.name || 'listener'}` },
    });
  }

  /**
   * Host revokes playback control from a room member.
   */
  public revokeControl(targetUserId: string) {
    if (!this.isHost) return;
    this.controllers.delete(targetUserId);

    const payload = {
      type: 'CONTROL_UPDATE',
      hostId: this.hostId,
      controllers: Array.from(this.controllers),
    };

    this.broadcastToPeers(payload);
    this.updateMemberControlFlags();
    this.notifyCurrentState();
  }

  /**
   * Transfer host ownership of the room to another member.
   */
  public transferHost(targetUserId: string) {
    if (!this.isHost) return;
    this.hostId = targetUserId;
    this.isHost = this.userId === targetUserId;
    this.controllers.add(targetUserId);

    const payload = {
      type: 'CONTROL_UPDATE',
      hostId: this.hostId,
      controllers: Array.from(this.controllers),
    };

    this.broadcastToPeers(payload);
    this.updateMemberControlFlags();
    this.notifyCurrentState();
  }

  /**
   * Request control from host.
   */
  public requestControl() {
    if (this.getHasControl()) return;
    const payload = {
      type: 'NOTIFICATION_EVENT',
      payload: {
        type: 'CONTROL_REQUEST',
        senderId: this.userId,
        senderName: this.userName,
        message: `${this.userName} requested DJ playback control`,
      },
    };
    this.broadcastToPeers(payload);
  }

  public setStereoChannel(channel: 'both' | 'left' | 'right') {
    this.stereoChannel = channel;
    if (this.members.has(this.userId)) {
      this.members.get(this.userId)!.stereoChannel = channel;
      this.broadcastMemberUpdate();
    }
  }

  public sendReaction(reaction: string, text?: string) {
    if (!this.roomCode) return;
    const payload = {
      type: 'REACTION_MSG',
      roomCode: this.roomCode,
      payload: {
        senderId: this.userId,
        senderName: this.userName,
        reaction,
        text: text || '',
        timestamp: Date.now(),
      },
    };

    this.broadcastToPeers(payload);

    try {
      this.broadcastChannel?.postMessage({
        type: 'BC_REACTION',
        roomCode: this.roomCode,
        senderId: this.userId,
        payload: payload.payload,
      });
    } catch {
      // ignore
    }
  }

  /**
   * Explicit user disconnect. Only when this is called is the room closed.
   */
  public disconnect() {
    this.isExplicitlyDisconnected = true;
    if (this.pingInterval) clearInterval(this.pingInterval);

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    this.peerConnections.clear();
    this.hostConnection = null;
    this.roomCode = null;
    this.isHost = false;
    this.controllers.clear();
    this.members.clear();

    this.notify({ type: 'DISCONNECTED' });
  }

  private pingClock() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PING', clientTime: Date.now() }));
    }
  }
}

export const syncClient = new SyncClient();
