import Peer, { type DataConnection } from "peerjs";
import {
  E2E_ALG,
  decryptPayload,
  deriveAesKey,
  encryptPayload,
  exportPublicJwk,
  generateE2eKeyPair,
  importPublicJwk,
  isPublicJwk,
} from "./lan-e2e";
import {
  EMPTY_ICE_CONFIG,
  iceMode,
  iceModeHint,
  iceModeLabel,
  peerRtcConfig,
  type LanIceConfig,
} from "./lan-ice";
import {
  MAX_CHAT_TEXT_CHARS,
  assertSendableChat,
  isFiniteTimestamp,
  sanitizeChatText,
  sanitizeDisplayName,
  sanitizeFileName,
  sanitizePeerId,
} from "./lan-security";

export { MAX_CHAT_TEXT_CHARS };
export type { LanIceConfig };

export type ChatMessage = {
  id: string;
  kind: "chat" | "system" | "config" | "file";
  from: string;
  fromId?: string;
  peerId?: string;
  text: string;
  ts: number;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
};

export type TransferProgress = {
  id: string;
  name: string;
  direction: "send" | "receive";
  received: number;
  total: number;
  done: boolean;
  error?: string;
  peerId?: string;
};

export type RoomPeer = {
  id: string;
  name: string;
  self?: boolean;
  connected?: boolean;
  /** True when an E2E session key is ready for this peer. */
  encrypted?: boolean;
};

/** Cleartext control-plane messages (discovery only). */
type ClearWireMessage =
  | { v: 1; t: "hello"; id: string; name: string; room: string }
  | { v: 1; t: "peers"; peers: Array<{ id: string; name: string }> }
  | { v: 1; t: "e2e-hello"; alg: typeof E2E_ALG; fromId: string; pub: JsonWebKey }
  | { v: 1; t: "e2e"; iv: string; ct: string };

/** Payloads sealed inside AES-GCM envelopes. */
type SecurePayload =
  | { v: 1; t: "chat"; id: string; text: string; ts: number; name: string; fromId: string }
  | { v: 1; t: "config"; id: string; name: string; content: string; ts: number; from: string; fromId: string }
  | {
      v: 1;
      t: "file-start";
      id: string;
      name: string;
      size: number;
      mime: string;
      chunks: number;
      ts: number;
      from: string;
      fromId: string;
    }
  | { v: 1; t: "file-chunk"; id: string; index: number; data: string }
  | { v: 1; t: "file-end"; id: string };

type WireMessage = ClearWireMessage | SecurePayload;

type E2eSession = {
  localPair: CryptoKeyPair;
  remotePub: JsonWebKey | null;
  key: CryptoKey | null;
  ready: boolean;
  offered: boolean;
  pending: SecurePayload[];
};

export const MAX_LAN_FILE_BYTES = 40 * 1024 * 1024;
const CHUNK_CHARS = 12_000;
const BC_PREFIX = "tcptun-lan-room:";

export type LanRoomHandlers = {
  onStatus: (status: string) => void;
  onPeers: (peers: RoomPeer[]) => void;
  onMessage: (message: ChatMessage) => void;
  onTransfer: (progress: TransferProgress) => void;
  onError: (error: string) => void;
  onJoined: (info: { peerId: string; isHost: boolean; room: string }) => void;
  /** Called when a preferred peer id was rejected and a new one was minted. */
  onIdentityRotated?: (peerId: string) => void;
};

export type LanJoinOptions = {
  room: string;
  displayName: string;
  iceConfig?: LanIceConfig;
  /** Stable PeerJS id for guest / personal identity (persisted by the UI). */
  preferredPeerId?: string;
};

function uid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function roomHostId(room: string): string {
  const cleaned = room.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = cleaned.slice(0, 18) || "lan";
  let hash = 0;
  for (let i = 0; i < room.length; i++) hash = (hash * 33 + room.charCodeAt(i)) >>> 0;
  return `tcptun${base}${hash.toString(36)}`.slice(0, 48);
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class LanRoom {
  private peer: Peer | null = null;
  private room = "";
  private localName = "User";
  private localId = "";
  private isHost = false;
  private handlers: LanRoomHandlers;
  private connections = new Map<string, DataConnection>();
  private peerNames = new Map<string, string>();
  private broadcast: BroadcastChannel | null = null;
  private closed = false;
  private iceConfig: LanIceConfig = { ...EMPTY_ICE_CONFIG };
  private preferredPeerId = "";
  private announceTimer: number | null = null;
  private e2eSessions = new Map<string, E2eSession>();
  private incoming = new Map<
    string,
    {
      name: string;
      size: number;
      mime: string;
      parts: Map<number, string>;
      expected: number;
      from: string;
      fromId: string;
    }
  >();
  private reconnectTimer: number | null = null;

  constructor(handlers: LanRoomHandlers) {
    this.handlers = handlers;
  }

  private statusForMode(base: string): string {
    const mode = iceMode(this.iceConfig);
    const label = iceModeLabel(mode);
    return `${base} ${label}.`;
  }

  get peerId(): string {
    return this.localId;
  }

  get hostMode(): boolean {
    return this.isHost;
  }

  get roomName(): string {
    return this.room;
  }

  setDisplayName(displayName: string) {
    this.localName = sanitizeDisplayName(displayName, "User");
    if (!this.localId) return;
    this.peerNames.set(this.localId, this.localName);
    this.broadcastWire({ v: 1, t: "hello", id: this.localId, name: this.localName, room: this.room });
    if (this.isHost) this.broadcastPeerList();
    this.emitPeers();
  }

  async join(
    roomOrOptions: string | LanJoinOptions,
    displayName?: string,
    iceConfig?: LanIceConfig,
  ): Promise<void> {
    const options: LanJoinOptions =
      typeof roomOrOptions === "string"
        ? { room: roomOrOptions, displayName: displayName || "User", iceConfig, preferredPeerId: undefined }
        : roomOrOptions;

    this.leave();
    this.closed = false;
    this.room = options.room.trim().slice(0, 64) || "tcptun-lan";
    this.localName = sanitizeDisplayName(options.displayName, "User");
    this.iceConfig = options.iceConfig ? { ...options.iceConfig } : { ...EMPTY_ICE_CONFIG };
    this.preferredPeerId = sanitizePeerId(options.preferredPeerId) || "";
    this.peerNames.clear();
    this.connections.clear();

    const hostId = roomHostId(this.room);
    this.handlers.onStatus(this.statusForMode("Looking for nearby users…"));

    // Local same-origin discovery (other tabs / windows on this machine).
    // Complements PeerJS room discovery for multi-device LAN.
    this.broadcast = new BroadcastChannel(BC_PREFIX + hostId);
    this.broadcast.onmessage = (event) => {
      if (this.closed) return;
      const data = event.data as { v?: number; t?: string; id?: string; name?: string };
      if (!data || typeof data !== "object" || data.t !== "bc-announce") return;
      const id = sanitizePeerId(data.id);
      if (!id || id === this.localId) return;
      const name = sanitizeDisplayName(data.name, "Peer");
      this.peerNames.set(id, name);
      this.emitPeers();
      // Dial announced peer over PeerJS when we are online (LAN / mesh).
      if (this.peer && this.localId) {
        this.ensureMeshConnection(id);
      }
    };

    await this.claimOrJoinHost(hostId);
    this.startLocalAnnounce();
  }

  private startLocalAnnounce() {
    if (this.announceTimer !== null) {
      window.clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    const tick = () => {
      if (this.closed || !this.localId) return;
      try {
        this.broadcast?.postMessage({
          v: 1,
          t: "bc-announce",
          id: this.localId,
          name: this.localName,
        });
      } catch {
        // ignore
      }
    };
    tick();
    // Periodic announce so late joiners on the same origin see us quickly.
    this.announceTimer = window.setInterval(tick, 4000);
  }

  leave() {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.announceTimer !== null) {
      window.clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch {
        // ignore
      }
    }
    this.connections.clear();
    this.peerNames.clear();
    this.e2eSessions.clear();
    this.incoming.clear();
    try {
      this.broadcast?.close();
    } catch {
      // ignore
    }
    this.broadcast = null;
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.peer = null;
    this.localId = "";
    this.isHost = false;
    this.handlers.onPeers([]);
    this.handlers.onStatus("Disconnected.");
  }

  listPeers(): RoomPeer[] {
    const peers: RoomPeer[] = [
      {
        id: this.localId || "local",
        name: `${this.localName} (you)`,
        self: true,
        connected: true,
        encrypted: true,
      },
    ];
    for (const [id, name] of this.peerNames) {
      if (!id || id === this.localId) continue;
      const conn = this.connections.get(id);
      const e2e = this.e2eSessions.get(id);
      peers.push({
        id,
        name,
        connected: conn?.open === true,
        encrypted: Boolean(e2e?.ready && e2e.key),
      });
    }
    return peers;
  }

  private peerServerOptions() {
    return {
      debug: 0 as const,
      // Explicit cloud settings — more reliable than defaults under static HTTPS pages.
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      pingInterval: 5000,
      config: peerRtcConfig(this.iceConfig),
    };
  }

  private rememberPeer(id: string, name?: string) {
    const peerId = sanitizePeerId(id);
    if (!peerId || peerId === this.localId) return;
    const label = sanitizeDisplayName(name, this.peerNames.get(peerId) || "User");
    this.peerNames.set(peerId, label);
    this.emitPeers();
  }

  async sendChat(peerId: string, text: string) {
    const clean = assertSendableChat(text);
    const target = sanitizePeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    this.connectionFor(target);
    const msg: SecurePayload = {
      v: 1,
      t: "chat",
      id: uid(),
      text: clean,
      ts: Date.now(),
      name: this.localName,
      fromId: this.localId,
    };
    await this.sendSecure(target, msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "chat",
      from: this.localName,
      fromId: this.localId,
      peerId: target,
      text: clean,
      ts: msg.ts,
    });
  }

  async sendConfig(peerId: string, fileName: string, content: string) {
    const target = sanitizePeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    const name = sanitizeFileName(fileName, "config.json");
    if (!content.trim()) throw new Error("Config content is empty.");
    if (new TextEncoder().encode(content).length > MAX_LAN_FILE_BYTES) {
      throw new Error("Config is too large to send.");
    }
    this.connectionFor(target);
    const msg: SecurePayload = {
      v: 1,
      t: "config",
      id: uid(),
      name,
      content,
      ts: Date.now(),
      from: this.localName,
      fromId: this.localId,
    };
    await this.sendSecure(target, msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "config",
      from: this.localName,
      fromId: this.localId,
      peerId: target,
      text: `Shared config ${name}`,
      ts: msg.ts,
      fileName: name,
    });
  }

  async sendFile(peerId: string, file: File) {
    const target = sanitizePeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    if (file.size > MAX_LAN_FILE_BYTES) {
      throw new Error(`File exceeds ${Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB limit.`);
    }
    this.requireE2e(target);
    const safeName = sanitizeFileName(file.name, "file.bin");

    const id = uid();
    const buffer = await file.arrayBuffer();
    const b64 = toBase64(buffer);
    const chunks: string[] = [];
    for (let i = 0; i < b64.length; i += CHUNK_CHARS) chunks.push(b64.slice(i, i + CHUNK_CHARS));

    this.handlers.onTransfer({
      id,
      name: safeName,
      direction: "send",
      received: 0,
      total: file.size,
      done: false,
      peerId: target,
    });

    await this.sendSecure(target, {
      v: 1,
      t: "file-start",
      id,
      name: safeName,
      size: file.size,
      mime: "application/octet-stream",
      chunks: chunks.length,
      ts: Date.now(),
      from: this.localName,
      fromId: this.localId,
    });

    for (let index = 0; index < chunks.length; index++) {
      await this.sendSecure(target, { v: 1, t: "file-chunk", id, index, data: chunks[index] });
      this.handlers.onTransfer({
        id,
        name: safeName,
        direction: "send",
        received: Math.min(file.size, Math.floor(((index + 1) / chunks.length) * file.size)),
        total: file.size,
        done: false,
        peerId: target,
      });
      // Yield so UI can paint progress.
      if (index % 4 === 0) await new Promise((r) => window.setTimeout(r, 0));
    }

    await this.sendSecure(target, { v: 1, t: "file-end", id });
    this.handlers.onTransfer({
      id,
      name: safeName,
      direction: "send",
      received: file.size,
      total: file.size,
      done: true,
      peerId: target,
    });
    this.handlers.onMessage({
      id,
      kind: "file",
      from: this.localName,
      fromId: this.localId,
      peerId: target,
      text: `Sent file ${safeName}`,
      ts: Date.now(),
      fileName: safeName,
      fileSize: file.size,
    });
  }

  private async claimOrJoinHost(hostId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const hostPeer = new Peer(hostId, this.peerServerOptions());
      let settled = false;

      const failToGuest = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        try {
          hostPeer.destroy();
        } catch {
          // ignore
        }
        this.handlers.onStatus(this.statusForMode("Joining…"));
        void this.joinAsGuest(hostId).then(resolve).catch(reject);
      };

      // If host claim hangs (common with flaky signaling), fall through to guest.
      const timeout = window.setTimeout(() => failToGuest(), 3500);

      hostPeer.on("open", (id) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        this.peer = hostPeer;
        this.localId = id;
        this.isHost = true;
        this.peerNames.set(id, this.localName);
        this.handlers.onJoined({ peerId: id, isHost: true, room: this.room });
        this.handlers.onStatus(this.statusForMode("You are online. Waiting for others…"));
        this.emitPeers();
        this.bindHost(hostPeer);
        this.startLocalAnnounce();
        resolve();
      });

      hostPeer.on("error", (err) => {
        const type = String((err as { type?: string }).type || "");
        // unavailable-id → someone else is host; join as guest.
        // network/server-error → still try guest path (may recover).
        if (
          type === "unavailable-id" ||
          type === "network" ||
          type === "server-error" ||
          type === "socket-error" ||
          type === "socket-closed"
        ) {
          failToGuest();
          return;
        }
        if (!settled) {
          settled = true;
          window.clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error("Failed to join."));
        } else {
          this.handlers.onError(err.message || "Connection error");
        }
      });
    });
  }

  private async joinAsGuest(hostId: string, preferredId?: string, attempt = 0): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      // Reuse a stable peer id so reloads look like the same user to others.
      const wantId = preferredId || this.preferredPeerId || undefined;
      const peer = wantId
        ? new Peer(wantId, this.peerServerOptions())
        : new Peer(this.peerServerOptions());

      let settled = false;

      const finishOk = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      peer.on("open", (id) => {
        this.peer = peer;
        this.localId = id;
        this.isHost = false;
        this.preferredPeerId = id;
        this.peerNames.set(id, this.localName);
        this.handlers.onJoined({ peerId: id, isHost: false, room: this.room });
        this.handlers.onStatus(this.statusForMode("Looking for nearby users…"));
        this.emitPeers();
        this.startLocalAnnounce();

        peer.on("connection", (conn) => this.acceptConnection(conn));
        peer.on("disconnected", () => {
          if (this.closed) return;
          this.handlers.onStatus("Connection lost. Reconnecting…");
          try {
            peer.reconnect();
          } catch {
            // ignore
          }
        });

        // Never dial yourself if preferred id somehow collides with host.
        if (id === hostId) {
          finishOk();
          return;
        }

        // Remember the discovery host as a visible peer immediately.
        this.rememberPeer(hostId, "User");
        this.dialPeer(hostId, true);
        // Keep retrying host until the channel opens (host may still be starting).
        this.scheduleReconnect(hostId, true);
        // Join succeeds once we are registered with the signaling server;
        // peer discovery continues in the background.
        finishOk();
      });

      peer.on("error", (err) => {
        const type = String((err as { type?: string }).type || "");
        // Stale tab may still hold our id — mint a new stable id once.
        if (type === "unavailable-id" && attempt < 3) {
          if (settled && this.localId) return;
          try {
            peer.destroy();
          } catch {
            // ignore
          }
          const fresh =
            typeof globalThis.crypto?.randomUUID === "function"
              ? `tcptu${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`
              : `tcptu${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
          this.preferredPeerId = fresh;
          this.handlers.onIdentityRotated?.(fresh);
          this.handlers.onStatus("Reconnecting with a new session…");
          void this.joinAsGuest(hostId, fresh, attempt + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        // peer-unavailable: host not ready — keep retrying in background.
        if (type === "peer-unavailable") {
          this.scheduleReconnect(hostId, true);
          if (!settled && this.localId) finishOk();
          return;
        }
        this.handlers.onError(err.message || "Connection error");
        if (!this.localId && !settled) {
          settled = true;
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  }

  private scheduleReconnect(hostId: string, immediate = false) {
    if (this.closed || this.isHost) return;
    if (this.reconnectTimer !== null) return;
    const delay = immediate ? 800 : 2000;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closed || !this.peer || this.isHost) return;
      const existing = this.connections.get(hostId);
      if (existing?.open) return;
      this.handlers.onStatus(this.statusForMode("Searching for nearby users…"));
      this.dialPeer(hostId, true);
      // Keep polling until connected or closed.
      if (!this.connections.get(hostId)?.open) {
        this.scheduleReconnect(hostId, false);
      }
    }, delay);
  }

  private bindHost(hostPeer: Peer) {
    hostPeer.on("connection", (conn) => this.acceptConnection(conn));
    hostPeer.on("disconnected", () => {
      if (this.closed) return;
      this.handlers.onStatus("Connection lost. Reconnecting…");
      try {
        hostPeer.reconnect();
      } catch {
        // ignore
      }
    });
  }

  private acceptConnection(conn: DataConnection) {
    const remoteId = sanitizePeerId(conn.peer) || conn.peer;
    this.rememberPeer(remoteId, this.peerNames.get(remoteId) || "User");
    this.wireConnection(conn, remoteId, false);
  }

  /** Open (or re-open) a reliable data connection to peerId. */
  private dialPeer(peerId: string, outgoing: boolean) {
    if (!this.peer || !peerId || peerId === this.localId) return;
    const existing = this.connections.get(peerId);
    if (existing?.open) return;
    try {
      const conn = this.peer.connect(peerId, { reliable: true, serialization: "json" });
      this.wireConnection(conn, peerId, outgoing);
    } catch {
      // ignore dial failures; scheduleReconnect will retry
    }
  }

  private wireConnection(conn: DataConnection, peerId: string, outgoing: boolean) {
    const existing = this.connections.get(peerId);
    if (existing && existing !== conn) {
      if (existing.open) {
        // Already have a live channel — drop the duplicate.
        try {
          conn.close();
        } catch {
          // ignore
        }
        return;
      }
      // Replace a half-open connection.
      try {
        existing.close();
      } catch {
        // ignore
      }
    }

    this.connections.set(peerId, conn);
    this.rememberPeer(peerId, this.peerNames.get(peerId) || "User");

    conn.on("open", () => {
      this.send(conn, { v: 1, t: "hello", id: this.localId, name: this.localName, room: this.room });
      void this.beginE2eHandshake(peerId);
      if (this.isHost) this.broadcastPeerList();
      this.handlers.onStatus(this.statusForMode("Connected."));
      this.emitPeers();
      // Guest: once host is open, stop aggressive reconnect noise.
      if (!this.isHost && peerId === roomHostId(this.room) && this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    conn.on("data", (data) => {
      try {
        const msg = (typeof data === "string" ? JSON.parse(data) : data) as WireMessage;
        void this.handleWire(msg, peerId);
      } catch {
        this.handlers.onError("Could not read an incoming message.");
      }
    });

    conn.on("close", () => {
      if (this.connections.get(peerId) === conn) {
        this.connections.delete(peerId);
      }
      this.e2eSessions.delete(peerId);
      const leftName = this.peerNames.get(peerId) || "User";
      // Keep name in directory for a moment so UI can show offline; mark disconnected via listPeers.
      this.emitPeers();
      if (this.isHost) this.broadcastPeerList();
      this.handlers.onMessage({
        id: uid(),
        kind: "system",
        from: "system",
        peerId,
        text: `${leftName} left.`,
        ts: Date.now(),
      });
      if (!this.isHost && peerId === roomHostId(this.room)) {
        this.scheduleReconnect(peerId, true);
      }
    });

    conn.on("error", () => {
      if (!this.isHost && peerId === roomHostId(this.room)) {
        this.scheduleReconnect(peerId, false);
      }
    });

    void outgoing;
  }

  private async beginE2eHandshake(peerId: string) {
    if (this.closed || !this.localId) return;
    let session = this.e2eSessions.get(peerId);
    if (!session) {
      const localPair = await generateE2eKeyPair();
      session = { localPair, remotePub: null, key: null, ready: false, offered: false, pending: [] };
      this.e2eSessions.set(peerId, session);
    }
    const conn = this.connections.get(peerId);
    if (!conn?.open) return;
    try {
      if (!session.offered) {
        const pub = await exportPublicJwk(session.localPair.publicKey);
        this.send(conn, {
          v: 1,
          t: "e2e-hello",
          alg: E2E_ALG,
          fromId: this.localId,
          pub,
        });
        session.offered = true;
      }
      if (session.remotePub && !session.ready) {
        await this.finalizeE2e(peerId);
      }
    } catch {
      this.handlers.onError("Could not start encrypted session.");
    }
  }

  private async finalizeE2e(peerId: string) {
    const session = this.e2eSessions.get(peerId);
    if (!session?.remotePub || session.ready) return;
    try {
      const remoteKey = await importPublicJwk(session.remotePub);
      const key = await deriveAesKey(session.localPair.privateKey, remoteKey, this.localId, peerId);
      session.key = key;
      session.ready = true;
      this.emitPeers();
      const pending = session.pending.splice(0, session.pending.length);
      for (const payload of pending) {
        await this.sendSecure(peerId, payload);
      }
    } catch {
      this.handlers.onError("Could not establish encryption with a peer.");
      this.e2eSessions.delete(peerId);
    }
  }

  private requireE2e(peerId: string): E2eSession {
    const session = this.e2eSessions.get(peerId);
    if (!session?.ready || !session.key) {
      throw new Error("Secure session is not ready yet. Wait a moment and try again.");
    }
    return session;
  }

  private async waitForE2e(peerId: string, timeoutMs = 5000): Promise<E2eSession> {
    const start = Date.now();
    if (!this.e2eSessions.get(peerId)) {
      await this.beginE2eHandshake(peerId);
    }
    while (Date.now() - start < timeoutMs) {
      const session = this.e2eSessions.get(peerId);
      if (session?.ready && session.key) return session;
      await new Promise((r) => window.setTimeout(r, 80));
    }
    throw new Error("Secure session is not ready yet. Wait a moment and try again.");
  }

  private async sendSecure(peerId: string, payload: SecurePayload) {
    const conn = this.connectionFor(peerId);
    const session = await this.waitForE2e(peerId);
    if (!session.key) throw new Error("Secure session is not ready yet.");
    const sealed = await encryptPayload(session.key, payload);
    this.send(conn, { v: 1, t: "e2e", iv: sealed.iv, ct: sealed.ct });
  }

  private async handleWire(msg: WireMessage, viaPeerId: string) {
    // Structural guard — drop anything that is not a plain object with a type.
    if (!msg || typeof msg !== "object" || typeof (msg as { t?: unknown }).t !== "string") return;

    if (msg.t === "e2e-hello") {
      if (msg.alg !== E2E_ALG || !isPublicJwk(msg.pub)) return;
      const fromId = sanitizePeerId(msg.fromId) || sanitizePeerId(viaPeerId) || viaPeerId;
      let session = this.e2eSessions.get(fromId) || this.e2eSessions.get(viaPeerId);
      if (!session) {
        const localPair = await generateE2eKeyPair();
        session = { localPair, remotePub: null, key: null, ready: false, offered: false, pending: [] };
        this.e2eSessions.set(fromId, session);
        if (viaPeerId !== fromId) this.e2eSessions.set(viaPeerId, session);
      } else {
        this.e2eSessions.set(fromId, session);
        this.e2eSessions.set(viaPeerId, session);
      }
      session.remotePub = msg.pub;
      // Offer our public key once (handles the case where the peer dialed first).
      const conn = this.connections.get(viaPeerId) || this.connections.get(fromId);
      if (conn?.open && !session.offered) {
        try {
          const pub = await exportPublicJwk(session.localPair.publicKey);
          this.send(conn, {
            v: 1,
            t: "e2e-hello",
            alg: E2E_ALG,
            fromId: this.localId,
            pub,
          });
          session.offered = true;
        } catch {
          // ignore
        }
      }
      await this.finalizeE2e(fromId);
      return;
    }

    if (msg.t === "e2e") {
      const session = this.e2eSessions.get(viaPeerId);
      if (!session?.key || typeof msg.iv !== "string" || typeof msg.ct !== "string") return;
      try {
        const inner = (await decryptPayload(session.key, msg.iv, msg.ct)) as SecurePayload;
        if (!inner || typeof inner !== "object" || typeof (inner as { t?: unknown }).t !== "string") return;
        this.handleSecurePayload(inner, viaPeerId);
      } catch {
        this.handlers.onError("Failed to decrypt a message (integrity check failed).");
      }
      return;
    }

    if (msg.t === "hello") {
      const peerId = sanitizePeerId(msg.id) || sanitizePeerId(viaPeerId);
      if (!peerId) return;
      const name = sanitizeDisplayName(msg.name, "Peer");
      const wasKnown = this.peerNames.has(peerId);
      this.rememberPeer(peerId, name);
      // Also map the transport peer id if it differs (should not for PeerJS).
      if (viaPeerId && viaPeerId !== peerId) this.rememberPeer(viaPeerId, name);
      if (!wasKnown) {
        this.handlers.onMessage({
          id: uid(),
          kind: "system",
          from: "system",
          peerId,
          text: `${name} is online.`,
          ts: Date.now(),
        });
      }
      // Host redistributes full roster so every guest can mesh.
      if (this.isHost) this.broadcastPeerList();
      // Dial mesh path to this peer when needed.
      this.ensureMeshConnection(peerId);
      return;
    }

    if (msg.t === "peers") {
      if (!Array.isArray(msg.peers)) return;
      for (const peer of msg.peers.slice(0, 64)) {
        const peerId = sanitizePeerId(peer?.id);
        if (!peerId || peerId === this.localId) continue;
        this.rememberPeer(peerId, peer?.name || "User");
        this.ensureMeshConnection(peerId);
      }
      this.emitPeers();
      return;
    }

    // Reject plaintext application payloads — only sealed e2e is accepted for content.
    if (
      msg.t === "chat" ||
      msg.t === "config" ||
      msg.t === "file-start" ||
      msg.t === "file-chunk" ||
      msg.t === "file-end"
    ) {
      return;
    }
  }

  private handleSecurePayload(msg: SecurePayload, viaPeerId: string) {
    if (msg.t === "chat") {
      const text = sanitizeChatText(msg.text);
      if (!text) return;
      const fromId = sanitizePeerId(msg.fromId) || sanitizePeerId(viaPeerId) || viaPeerId;
      this.handlers.onMessage({
        id: typeof msg.id === "string" ? msg.id.slice(0, 80) : uid(),
        kind: "chat",
        from: sanitizeDisplayName(msg.name, "Peer"),
        fromId,
        peerId: fromId,
        text,
        ts: isFiniteTimestamp(msg.ts),
      });
      return;
    }

    if (msg.t === "config") {
      if (typeof msg.content !== "string") return;
      if (new TextEncoder().encode(msg.content).length > MAX_LAN_FILE_BYTES) return;
      const name = sanitizeFileName(msg.name, "config.json");
      const blob = new Blob([msg.content], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const fromId = sanitizePeerId(msg.fromId) || sanitizePeerId(viaPeerId) || viaPeerId;
      this.handlers.onMessage({
        id: typeof msg.id === "string" ? msg.id.slice(0, 80) : uid(),
        kind: "config",
        from: sanitizeDisplayName(msg.from, "Peer"),
        fromId,
        peerId: fromId,
        text: `Received config ${name}`,
        ts: isFiniteTimestamp(msg.ts),
        fileName: name,
        fileUrl: url,
      });
      return;
    }

    if (msg.t === "file-start") {
      if (typeof msg.size !== "number" || !Number.isFinite(msg.size) || msg.size < 0) return;
      if (msg.size > MAX_LAN_FILE_BYTES) return;
      if (typeof msg.chunks !== "number" || msg.chunks < 1 || msg.chunks > 50_000) return;
      const name = sanitizeFileName(msg.name, "file.bin");
      const fromId = sanitizePeerId(msg.fromId) || sanitizePeerId(viaPeerId) || viaPeerId;
      const transferId = typeof msg.id === "string" ? msg.id.slice(0, 80) : uid();
      if (this.incoming.size >= 8) return;
      this.incoming.set(transferId, {
        name,
        size: msg.size,
        mime: "application/octet-stream",
        parts: new Map(),
        expected: msg.chunks,
        from: sanitizeDisplayName(msg.from, "Peer"),
        fromId,
      });
      this.handlers.onTransfer({
        id: transferId,
        name,
        direction: "receive",
        received: 0,
        total: msg.size,
        done: false,
        peerId: fromId,
      });
      return;
    }

    if (msg.t === "file-chunk") {
      const entry = this.incoming.get(msg.id);
      if (!entry) return;
      if (typeof msg.index !== "number" || msg.index < 0 || msg.index >= entry.expected) return;
      if (typeof msg.data !== "string") return;
      if (msg.data.length > CHUNK_CHARS + 64) return;
      if (entry.parts.size >= entry.expected && !entry.parts.has(msg.index)) return;
      entry.parts.set(msg.index, msg.data);
      this.handlers.onTransfer({
        id: msg.id,
        name: entry.name,
        direction: "receive",
        received: Math.min(entry.size, Math.floor((entry.parts.size / entry.expected) * entry.size)),
        total: entry.size,
        done: false,
        peerId: entry.fromId,
      });
      return;
    }

    if (msg.t === "file-end") {
      const entry = this.incoming.get(msg.id);
      if (!entry) return;
      try {
        if (entry.parts.size !== entry.expected) throw new Error("Incomplete file transfer.");
        let b64 = "";
        for (let i = 0; i < entry.expected; i++) {
          const part = entry.parts.get(i);
          if (part === undefined) throw new Error("Missing file chunk.");
          b64 += part;
        }
        const bytes = fromBase64(b64);
        if (bytes.byteLength > MAX_LAN_FILE_BYTES) throw new Error("File too large.");
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        const blob = new Blob([copy], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        this.handlers.onTransfer({
          id: msg.id,
          name: entry.name,
          direction: "receive",
          received: entry.size,
          total: entry.size,
          done: true,
          peerId: entry.fromId,
        });
        this.handlers.onMessage({
          id: msg.id,
          kind: "file",
          from: entry.from,
          fromId: entry.fromId,
          peerId: entry.fromId,
          text: `Received file ${entry.name}`,
          ts: Date.now(),
          fileName: entry.name,
          fileSize: bytes.byteLength,
          fileUrl: url,
        });
      } catch (err) {
        this.handlers.onTransfer({
          id: msg.id,
          name: entry.name,
          direction: "receive",
          received: 0,
          total: entry.size,
          done: true,
          error: err instanceof Error ? err.message : "Failed to assemble file.",
          peerId: entry.fromId,
        });
      }
      this.incoming.delete(msg.id);
    }
  }

  private ensureMeshConnection(peerId: string) {
    if (!this.peer || !peerId || peerId === this.localId) return;
    if (this.connections.get(peerId)?.open) return;
    // Only one side dials to avoid glare: higher id initiates.
    // Exception: anyone may dial the discovery host.
    const hostId = roomHostId(this.room);
    if (peerId !== hostId && this.localId < peerId) return;
    this.dialPeer(peerId, true);
  }

  private broadcastPeerList() {
    const peers = Array.from(this.peerNames.entries()).map(([id, name]) => ({ id, name }));
    peers.push({ id: this.localId, name: this.localName });
    const unique = new Map(peers.map((p) => [p.id, p]));
    const list = Array.from(unique.values()).filter((p) => p.id);
    this.broadcastWire({ v: 1, t: "peers", peers: list });
  }

  private broadcastWire(msg: WireMessage) {
    for (const conn of this.connections.values()) {
      if (!conn.open) continue;
      try {
        this.send(conn, msg);
      } catch {
        // ignore individual fan-out failures
      }
    }
  }

  private send(conn: DataConnection, msg: WireMessage) {
    if (!conn.open) throw new Error("Peer is not connected.");
    try {
      conn.send(msg);
    } catch {
      throw new Error("Failed to send.");
    }
  }

  private connectionFor(peerId: string): DataConnection {
    const conn = this.connections.get(peerId);
    if (!conn?.open) throw new Error("This user is no longer online.");
    return conn;
  }

  private emitPeers() {
    this.handlers.onPeers(this.listPeers());
  }
}
