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
import { createUserKey } from "./lan-identity";
import {
  EMPTY_ICE_CONFIG,
  iceMode,
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
import { discoveryAnchorId, fileChunkCount, fileChunkLength, shouldInitiateMesh } from "./lan-room-state";

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
  /** A personal chat DataChannel is open. */
  connected?: boolean;
  /** The ECDH/AES-GCM session for that channel is ready. */
  encrypted?: boolean;
};

export type LanRoomHandlers = {
  onStatus: (status: string) => void;
  onPeers: (peers: RoomPeer[]) => void;
  onMessage: (message: ChatMessage) => void;
  onTransfer: (progress: TransferProgress) => void;
  onError: (error: string) => void;
  onJoined: (info: { peerId: string; isHost: boolean; room: string }) => void;
  onIdentityRotated?: (peerId: string) => void;
};

export type LanJoinOptions = {
  room: string;
  displayName: string;
  iceConfig?: LanIceConfig;
  preferredPeerId?: string;
};

type PresencePeer = { id: string; name: string };
type PresencePacket = {
  v: 2;
  t: "presence";
  room: string;
  id: string;
  name: string;
  peers: PresencePeer[];
};

type MeshControl =
  | { v: 2; t: "hello"; room: string; id: string; name: string }
  | { v: 2; t: "key"; alg: typeof E2E_ALG; from: string; pub: JsonWebKey }
  | { v: 2; t: "sealed"; from: string; iv: string; ct: string }
  | { v: 2; t: "ping"; n: number }
  | { v: 2; t: "pong"; n: number };

type SecurePayload =
  | { v: 2; t: "chat"; id: string; text: string; ts: number }
  | {
      v: 2;
      t: "file-start";
      id: string;
      name: string;
      size: number;
      mime: string;
      chunks: number;
      ts: number;
    }
  | { v: 2; t: "file-chunk"; id: string; index: number; data: string }
  | { v: 2; t: "file-end"; id: string };

type PeerMeta = {
  v?: unknown;
  kind?: unknown;
  room?: unknown;
  userId?: unknown;
  name?: unknown;
};

type KnownPeer = { name: string; seenAt: number };
type MeshLink = {
  conn: DataConnection;
  peerId: string;
  opened: boolean;
  encrypted: boolean;
  lastActivity: number;
  keyPair?: Promise<CryptoKeyPair>;
  key?: CryptoKey;
  keySent: boolean;
  receiveChain: Promise<void>;
};

type IncomingFile = {
  id: string;
  name: string;
  size: number;
  mime: string;
  chunks: number;
  parts: Map<number, string>;
  encodedChars: number;
  peerId: string;
};

const DISCOVERY_ANCHORS = 32;
const DISCOVERY_SCAN_INTERVAL_MS = 18_000;
const DISCOVERY_OPEN_TIMEOUT_MS = 6_000;
const MESH_OPEN_TIMEOUT_MS = 12_000;
const HEARTBEAT_INTERVAL_MS = 8_000;
const STALE_LINK_MS = 32_000;
const PRESENCE_TTL_MS = 55_000;
const REDIAL_DELAY_MS = 1_500;
const FILE_CHUNK_CHARS = 12_000;
const MAX_INCOMING_FILES_PER_PEER = 3;
export const MAX_LAN_FILE_BYTES = 40 * 1024 * 1024;

function uid(): string {
  return globalThis.crypto?.randomUUID?.() || `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanRoom(raw: string): string {
  return raw.trim().replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 64) || "tcptun-lan";
}

function parsePacket(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function asMeta(conn: DataConnection): PeerMeta {
  return conn.metadata && typeof conn.metadata === "object" ? (conn.metadata as PeerMeta) : {};
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    out += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(out);
}

function fromBase64(value: string): Uint8Array {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function simpleHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function roomHostId(room: string): string {
  return discoveryAnchorId(cleanRoom(room), 0);
}

export class LanRoom {
  private handlers: LanRoomHandlers;
  private peer: Peer | null = null;
  private discoveryHost: Peer | null = null;
  private discoveryHostId = "";
  private room = "";
  private localId = "";
  private localName = "User";
  private iceConfig: LanIceConfig = { ...EMPTY_ICE_CONFIG };
  private closed = true;
  private joined = false;
  private discoveryIceFailureReported = false;

  private knownPeers = new Map<string, KnownPeer>();
  private mesh = new Map<string, MeshLink>();
  private discoveryLinks = new Map<string, DataConnection>();
  private discoveryClients = new Map<string, DataConnection>();
  private incomingFiles = new Map<string, IncomingFile>();
  private redialTimers = new Map<string, number>();
  private meshOpenTimers = new Map<string, number>();
  private discoveryOpenTimers = new Map<string, number>();
  private scanTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private announceTimer: number | null = null;
  private claimTimer: number | null = null;
  private broadcast: BroadcastChannel | null = null;

  constructor(handlers: LanRoomHandlers) {
    this.handlers = handlers;
  }

  get peerId(): string {
    return this.localId;
  }

  get hostMode(): boolean {
    return Boolean(this.discoveryHost && !this.discoveryHost.destroyed);
  }

  get roomName(): string {
    return this.room;
  }

  async join(roomOrOptions: string | LanJoinOptions, displayName?: string, iceConfig?: LanIceConfig) {
    const options: LanJoinOptions =
      typeof roomOrOptions === "string"
        ? { room: roomOrOptions, displayName: displayName || "User", iceConfig }
        : roomOrOptions;

    this.leave(false);
    this.closed = false;
    this.discoveryIceFailureReported = false;
    this.room = cleanRoom(options.room);
    this.localName = sanitizeDisplayName(options.displayName, "User");
    this.iceConfig = options.iceConfig ? { ...options.iceConfig } : { ...EMPTY_ICE_CONFIG };
    const preferred = sanitizePeerId(options.preferredPeerId) || createUserKey();

    this.handlers.onStatus(this.withMode("Starting nearby chat…"));
    await this.openPersonalPeer(preferred, 0);
    if (this.closed) return;

    this.joined = true;
    this.handlers.onJoined({ peerId: this.localId, isHost: false, room: this.room });
    this.handlers.onStatus(this.withMode("Online. Looking for nearby users…"));
    this.emitPeers();
    this.startSameBrowserDiscovery();
    this.startHeartbeat();
    this.claimDiscoveryAnchor(0);
    this.scanDiscoveryAnchors();
  }

  leave(emit = true) {
    this.closed = true;
    this.joined = false;
    for (const timer of this.redialTimers.values()) window.clearTimeout(timer);
    for (const timer of this.meshOpenTimers.values()) window.clearTimeout(timer);
    for (const timer of this.discoveryOpenTimers.values()) window.clearTimeout(timer);
    this.redialTimers.clear();
    this.meshOpenTimers.clear();
    this.discoveryOpenTimers.clear();
    for (const timer of [this.scanTimer, this.heartbeatTimer, this.announceTimer, this.claimTimer]) {
      if (timer !== null) window.clearTimeout(timer);
    }
    this.scanTimer = this.heartbeatTimer = this.announceTimer = this.claimTimer = null;

    const allConnections = [
      ...this.mesh.values().map((link) => link.conn),
      ...this.discoveryLinks.values(),
      ...this.discoveryClients.values(),
    ];
    this.mesh.clear();
    this.discoveryLinks.clear();
    this.discoveryClients.clear();
    for (const conn of allConnections) {
      try { conn.close(); } catch { /* ignore */ }
    }
    try { this.peer?.destroy(); } catch { /* ignore */ }
    try { this.discoveryHost?.destroy(); } catch { /* ignore */ }
    try { this.broadcast?.close(); } catch { /* ignore */ }
    this.peer = null;
    this.discoveryHost = null;
    this.discoveryHostId = "";
    this.broadcast = null;
    this.knownPeers.clear();
    this.incomingFiles.clear();
    this.localId = "";
    if (emit) {
      this.handlers.onPeers([]);
      this.handlers.onStatus("Disconnected.");
    }
  }

  setDisplayName(displayName: string) {
    this.localName = sanitizeDisplayName(displayName, "User");
    this.announcePresence();
    this.broadcastPresence();
    for (const link of this.mesh.values()) {
      if (link.conn.open) this.sendRaw(link.conn, this.meshHello());
    }
    this.emitPeers();
  }

  listPeers(): RoomPeer[] {
    const peers: RoomPeer[] = [{
      id: this.localId || "local",
      name: `${this.localName} (you)`,
      self: true,
      connected: this.joined,
      encrypted: true,
    }];
    for (const [id, known] of this.knownPeers) {
      const link = this.mesh.get(id);
      peers.push({
        id,
        name: known.name,
        connected: link?.opened === true && link.conn.open,
        encrypted: link?.encrypted === true && Boolean(link.key),
      });
    }
    return peers;
  }

  async sendChat(peerId: string, text: string) {
    const target = this.validTarget(peerId);
    const clean = assertSendableChat(text);
    const id = uid();
    const ts = Date.now();
    await this.sendSecure(target, { v: 2, t: "chat", id, text: clean, ts });
    this.handlers.onMessage({
      id, kind: "chat", from: this.localName, fromId: this.localId,
      peerId: target, text: clean, ts,
    });
  }

  async sendFile(peerId: string, file: File) {
    const target = this.validTarget(peerId);
    if (file.size > MAX_LAN_FILE_BYTES) {
      throw new Error(`File exceeds ${Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB limit.`);
    }
    const id = uid();
    const name = sanitizeFileName(file.name, "file.bin");
    this.emitTransfer(id, name, "send", 0, file.size, false, target);
    try {
      const encoded = toBase64(await file.arrayBuffer());
      const chunks = fileChunkCount(file.size, FILE_CHUNK_CHARS);
      if (chunks < 0 || chunks !== Math.ceil(encoded.length / FILE_CHUNK_CHARS)) {
        throw new Error("Could not prepare file transfer.");
      }
      await this.sendSecure(target, {
        v: 2, t: "file-start", id, name, size: file.size,
        mime: String(file.type || "application/octet-stream").slice(0, 120), chunks, ts: Date.now(),
      });
      for (let index = 0; index < chunks; index++) {
        const data = encoded.slice(index * FILE_CHUNK_CHARS, (index + 1) * FILE_CHUNK_CHARS);
        await this.waitForCapacity(target);
        await this.sendSecure(target, { v: 2, t: "file-chunk", id, index, data });
        const sent = chunks ? Math.min(file.size, Math.floor(((index + 1) / chunks) * file.size)) : file.size;
        this.emitTransfer(id, name, "send", sent, file.size, false, target);
        if (index % 4 === 0) await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      await this.sendSecure(target, { v: 2, t: "file-end", id });
      this.emitTransfer(id, name, "send", file.size, file.size, true, target);
      this.handlers.onMessage({
        id, kind: "file", from: this.localName, fromId: this.localId, peerId: target,
        text: `Sent file ${name}`, ts: Date.now(), fileName: name, fileSize: file.size,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "File transfer failed.";
      this.emitTransfer(id, name, "send", 0, file.size, true, target, message);
      throw error;
    }
  }

  private peerOptions() {
    return {
      debug: 0 as const,
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      pingInterval: 5_000,
      config: peerRtcConfig(this.iceConfig),
    };
  }

  private withMode(message: string): string {
    return `${message} ${iceModeLabel(iceMode(this.iceConfig))}.`;
  }

  private openPersonalPeer(peerId: string, attempt: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(peerId, this.peerOptions());
      this.peer = peer;
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled || this.closed) return;
        settled = true;
        try { peer.destroy(); } catch { /* ignore */ }
        reject(new Error("Timed out while connecting to the discovery service."));
      }, 15_000);

      peer.on("open", (id) => {
        if (settled || this.closed || this.peer !== peer) return;
        settled = true;
        window.clearTimeout(timeout);
        this.localId = sanitizePeerId(id) || peerId;
        this.bindPersonalPeer(peer);
        resolve();
      });
      peer.on("error", (error) => {
        const type = String((error as { type?: string }).type || "");
        if (!settled && type === "unavailable-id" && attempt < 2) {
          settled = true;
          window.clearTimeout(timeout);
          try { peer.destroy(); } catch { /* ignore */ }
          const next = createUserKey();
          this.handlers.onIdentityRotated?.(next);
          void this.openPersonalPeer(next, attempt + 1).then(resolve, reject);
          return;
        }
        if (!settled) {
          settled = true;
          window.clearTimeout(timeout);
          reject(error instanceof Error ? error : new Error("Could not start nearby chat."));
        } else if (!this.closed && type !== "peer-unavailable") {
          this.handlers.onError(error.message || "Peer signaling error.");
        }
      });
    });
  }

  private bindPersonalPeer(peer: Peer) {
    peer.on("connection", (conn) => {
      const meta = asMeta(conn);
      const remoteId = sanitizePeerId(conn.peer);
      if (
        !remoteId || remoteId === this.localId || meta.v !== 2 || meta.kind !== "mesh" ||
        meta.room !== this.room || sanitizePeerId(meta.userId) !== remoteId ||
        !shouldInitiateMesh(remoteId, this.localId)
      ) {
        try { conn.close(); } catch { /* ignore */ }
        return;
      }
      this.rememberPeer(remoteId, meta.name);
      this.bindMesh(conn, remoteId);
    });
    peer.on("disconnected", () => {
      if (this.closed) return;
      this.handlers.onStatus("Signaling interrupted. Reconnecting…");
      try { peer.reconnect(); } catch { /* PeerJS will emit an error */ }
    });
  }

  private startSameBrowserDiscovery() {
    this.broadcast = new BroadcastChannel(`tcptun-lan-v2:${this.room}`);
    this.broadcast.onmessage = (event) => {
      const packet = event.data as Partial<PresencePacket>;
      if (this.closed || packet?.v !== 2 || packet.t !== "presence" || packet.room !== this.room) return;
      const id = sanitizePeerId(packet.id);
      if (!id || id === this.localId) return;
      this.rememberPeer(id, packet.name);
    };
    const tick = () => {
      if (this.closed) return;
      try { this.broadcast?.postMessage(this.presencePacket()); } catch { /* ignore */ }
    };
    tick();
    this.announceTimer = window.setInterval(tick, 3_000);
  }

  private claimDiscoveryAnchor(attempt: number) {
    if (this.closed || this.discoveryHost || attempt >= DISCOVERY_ANCHORS) return;
    const start = simpleHash(this.localId) % DISCOVERY_ANCHORS;
    const index = (start + attempt) % DISCOVERY_ANCHORS;
    const id = discoveryAnchorId(this.room, index);
    const candidate = new Peer(id, this.peerOptions());
    let settled = false;
    const timeout = window.setTimeout(() => fail(), 10_000);
    const fail = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try { candidate.destroy(); } catch { /* ignore */ }
      if (!this.closed && !this.discoveryHost) this.claimDiscoveryAnchor(attempt + 1);
    };
    candidate.on("open", () => {
      if (settled || this.closed || this.discoveryHost) return fail();
      settled = true;
      window.clearTimeout(timeout);
      this.discoveryHost = candidate;
      this.discoveryHostId = id;
      this.bindDiscoveryHost(candidate);
      this.handlers.onJoined({ peerId: this.localId, isHost: true, room: this.room });
      this.handlers.onStatus(this.withMode("Nearby discovery active…"));
    });
    candidate.on("error", () => {
      if (!settled) fail();
    });
  }

  private bindDiscoveryHost(host: Peer) {
    host.on("connection", (conn) => {
      const meta = asMeta(conn);
      const remoteId = sanitizePeerId(conn.peer);
      if (
        !remoteId || remoteId === this.localId || meta.v !== 2 || meta.kind !== "discovery" ||
        meta.room !== this.room || sanitizePeerId(meta.userId) !== remoteId
      ) {
        try { conn.close(); } catch { /* ignore */ }
        return;
      }
      const previous = this.discoveryClients.get(remoteId);
      if (previous && previous !== conn) {
        try { previous.close(); } catch { /* ignore */ }
      }
      this.discoveryClients.set(remoteId, conn);
      let opened = conn.open;
      const onOpen = () => {
        if (this.closed || this.discoveryClients.get(remoteId) !== conn || !conn.open) return;
        opened = true;
        this.rememberPeer(remoteId, meta.name);
        this.sendRaw(conn, this.presencePacket());
        this.broadcastPresence();
      };
      if (conn.open) onOpen(); else conn.on("open", onOpen);
      conn.on("data", (data) => this.handlePresence(parsePacket(data), conn, remoteId));
      conn.on("iceStateChanged", (state) => {
        if (!opened && state === "checking") this.handlers.onStatus("Discovery signal received. Checking local WebRTC path…");
        if (!opened && state === "failed") this.handlers.onError(this.iceFailureMessage());
      });
      const close = () => {
        if (this.discoveryClients.get(remoteId) === conn) this.discoveryClients.delete(remoteId);
      };
      conn.on("close", close);
      conn.on("error", close);
    });
    host.on("disconnected", () => {
      if (this.closed || this.discoveryHost !== host) return;
      try { host.reconnect(); } catch { /* ignore */ }
    });
    host.on("close", () => {
      if (this.closed || this.discoveryHost !== host) return;
      this.discoveryHost = null;
      this.discoveryHostId = "";
      this.claimTimer = window.setTimeout(() => this.claimDiscoveryAnchor(0), 2_000);
    });
  }

  private scanDiscoveryAnchors() {
    if (this.closed || !this.peer) return;
    for (let index = 0; index < DISCOVERY_ANCHORS; index++) {
      const anchorId = discoveryAnchorId(this.room, index);
      if (anchorId === this.discoveryHostId || this.discoveryLinks.has(anchorId)) continue;
      window.setTimeout(() => this.dialDiscoveryAnchor(anchorId), index * 80);
    }
    this.scanTimer = window.setTimeout(() => this.scanDiscoveryAnchors(), DISCOVERY_SCAN_INTERVAL_MS);
  }

  private dialDiscoveryAnchor(anchorId: string) {
    if (this.closed || !this.peer || anchorId === this.discoveryHostId || this.discoveryLinks.has(anchorId)) return;
    const conn = this.peer.connect(anchorId, {
      reliable: true,
      serialization: "json",
      metadata: { v: 2, kind: "discovery", room: this.room, userId: this.localId, name: this.localName },
    });
    this.discoveryLinks.set(anchorId, conn);
    const timeout = window.setTimeout(() => {
      this.discoveryOpenTimers.delete(anchorId);
      if (this.discoveryLinks.get(anchorId) !== conn || conn.open) return;
      this.discoveryLinks.delete(anchorId);
      try { conn.close(); } catch { /* ignore */ }
    }, DISCOVERY_OPEN_TIMEOUT_MS);
    this.discoveryOpenTimers.set(anchorId, timeout);
    const onOpen = () => {
      if (this.closed || this.discoveryLinks.get(anchorId) !== conn || !conn.open) return;
      this.clearDiscoveryTimer(anchorId);
      this.sendRaw(conn, this.presencePacket());
    };
    if (conn.open) onOpen(); else conn.on("open", onOpen);
    conn.on("data", (data) => this.handlePresence(parsePacket(data), conn));
    conn.on("iceStateChanged", (state) => {
      if (
        state === "failed" &&
        !this.discoveryIceFailureReported &&
        this.discoveryLinks.get(anchorId) === conn
      ) {
        this.discoveryIceFailureReported = true;
        this.handlers.onError(this.iceFailureMessage());
      }
    });
    const close = () => {
      this.clearDiscoveryTimer(anchorId);
      if (this.discoveryLinks.get(anchorId) === conn) this.discoveryLinks.delete(anchorId);
    };
    conn.on("close", close);
    conn.on("error", close);
  }

  private handlePresence(raw: unknown, conn: DataConnection, expectedId?: string) {
    if (!conn.open || !raw || typeof raw !== "object") return;
    const packet = raw as Partial<PresencePacket>;
    if (packet.v !== 2 || packet.t !== "presence" || packet.room !== this.room) return;
    const sender = sanitizePeerId(packet.id);
    if (!sender || sender === this.localId || (expectedId && sender !== expectedId)) return;
    this.rememberPeer(sender, packet.name);
    if (Array.isArray(packet.peers)) {
      for (const item of packet.peers.slice(0, 64)) {
        const id = sanitizePeerId(item?.id);
        if (!id || id === this.localId || /^tcptun/i.test(id)) continue;
        this.rememberPeer(id, item?.name);
      }
    }
  }

  private presencePacket(): PresencePacket {
    const now = Date.now();
    const peers: PresencePeer[] = [];
    for (const [id, known] of this.knownPeers) {
      if (known.seenAt < now - PRESENCE_TTL_MS && !this.mesh.get(id)?.opened) continue;
      peers.push({ id, name: known.name });
      if (peers.length >= 63) break;
    }
    return { v: 2, t: "presence", room: this.room, id: this.localId, name: this.localName, peers };
  }

  private announcePresence() {
    try { this.broadcast?.postMessage(this.presencePacket()); } catch { /* ignore */ }
  }

  private broadcastPresence() {
    const packet = this.presencePacket();
    for (const conn of [...this.discoveryLinks.values(), ...this.discoveryClients.values()]) {
      if (conn.open) {
        try { this.sendRaw(conn, packet); } catch { /* ignore */ }
      }
    }
  }

  private rememberPeer(rawId: unknown, rawName: unknown) {
    const id = sanitizePeerId(rawId);
    if (!id || id === this.localId || /^tcptun/i.test(id)) return;
    const previous = this.knownPeers.get(id);
    const name = sanitizeDisplayName(rawName, previous?.name || "User");
    this.knownPeers.set(id, { name, seenAt: Date.now() });
    this.ensureMesh(id);
    this.emitPeers();
  }

  private ensureMesh(peerId: string) {
    if (this.closed || !this.peer || !shouldInitiateMesh(this.localId, peerId)) return;
    const existing = this.mesh.get(peerId);
    // One offer owns the full open timeout. Presence refreshes must not replace
    // a valid half-open offer and restart ICE forever.
    if (existing) return;
    this.dialMesh(peerId);
  }

  private dialMesh(peerId: string) {
    if (this.closed || !this.peer || !shouldInitiateMesh(this.localId, peerId)) return;
    const conn = this.peer.connect(peerId, {
      reliable: true,
      serialization: "json",
      metadata: { v: 2, kind: "mesh", room: this.room, userId: this.localId, name: this.localName },
    });
    this.bindMesh(conn, peerId);
  }

  private bindMesh(conn: DataConnection, peerId: string) {
    const existing = this.mesh.get(peerId);
    if (existing && existing.conn !== conn) {
      if (existing.opened && existing.conn.open) {
        try { conn.close(); } catch { /* ignore */ }
        return;
      }
      this.dropMesh(peerId, existing.conn, false);
    }
    const link: MeshLink = {
      conn, peerId, opened: conn.open, encrypted: false,
      lastActivity: Date.now(), keySent: false, receiveChain: Promise.resolve(),
    };
    this.mesh.set(peerId, link);
    const timeout = window.setTimeout(() => {
      this.meshOpenTimers.delete(peerId);
      if (this.mesh.get(peerId) !== link || link.opened) return;
      this.handlers.onError(this.iceFailureMessage(peerId));
      this.dropMesh(peerId, conn, true);
    }, MESH_OPEN_TIMEOUT_MS);
    this.meshOpenTimers.set(peerId, timeout);

    const onOpen = () => {
      if (this.closed || this.mesh.get(peerId) !== link || !conn.open) return;
      link.opened = true;
      link.lastActivity = Date.now();
      this.clearMeshTimer(peerId);
      this.sendRaw(conn, this.meshHello());
      void this.sendPublicKey(link);
      this.handlers.onStatus(this.withMode(`Connected to ${this.knownPeers.get(peerId)?.name || "user"}…`));
      this.emitPeers();
    };
    if (conn.open) onOpen(); else conn.on("open", onOpen);
    conn.on("data", (data) => {
      if (this.mesh.get(peerId) !== link) return;
      link.lastActivity = Date.now();
      const packet = parsePacket(data);
      link.receiveChain = link.receiveChain
        .then(() => this.handleMeshPacket(link, packet))
        .catch(() => {
          if (this.mesh.get(peerId) === link) {
            this.handlers.onError(`Secure connection to ${this.knownPeers.get(peerId)?.name || "user"} failed.`);
            this.dropMesh(peerId, conn, true);
          }
        });
    });
    conn.on("iceStateChanged", (state) => {
      if (this.mesh.get(peerId) !== link) return;
      if (state === "checking") this.handlers.onStatus(`Found ${this.knownPeers.get(peerId)?.name || "user"}. Checking WebRTC path…`);
      if (state === "failed") this.handlers.onError(this.iceFailureMessage(peerId));
    });
    conn.on("close", () => this.dropMesh(peerId, conn, true));
    conn.on("error", () => this.dropMesh(peerId, conn, true));
  }

  private meshHello(): MeshControl {
    return { v: 2, t: "hello", room: this.room, id: this.localId, name: this.localName };
  }

  private async handleMeshPacket(link: MeshLink, raw: unknown) {
    if (!raw || typeof raw !== "object") return;
    const packet = raw as Partial<MeshControl>;
    if (packet.v !== 2 || typeof packet.t !== "string") return;
    if (packet.t === "hello") {
      if (packet.room !== this.room || sanitizePeerId(packet.id) !== link.peerId) return;
      this.rememberPeer(link.peerId, packet.name);
      return;
    }
    if (packet.t === "ping") {
      this.sendRaw(link.conn, { v: 2, t: "pong", n: Number(packet.n) || Date.now() } satisfies MeshControl);
      return;
    }
    if (packet.t === "pong") return;
    if (packet.t === "key") {
      if (packet.alg !== E2E_ALG || packet.from !== link.peerId || !isPublicJwk(packet.pub)) return;
      const pair = await this.keyPairFor(link);
      const remote = await importPublicJwk(packet.pub);
      link.key = await deriveAesKey(pair.privateKey, remote, this.localId, link.peerId);
      link.encrypted = true;
      if (!link.keySent) await this.sendPublicKey(link);
      this.handlers.onStatus(`Connected securely to ${this.knownPeers.get(link.peerId)?.name || "user"}.`);
      this.emitPeers();
      return;
    }
    if (packet.t === "sealed") {
      if (packet.from !== link.peerId || !link.key || typeof packet.iv !== "string" || typeof packet.ct !== "string") return;
      const payload = await decryptPayload(link.key, packet.iv, packet.ct);
      await this.handleSecurePayload(link.peerId, payload);
    }
  }

  private keyPairFor(link: MeshLink): Promise<CryptoKeyPair> {
    link.keyPair ||= generateE2eKeyPair();
    return link.keyPair;
  }

  private async sendPublicKey(link: MeshLink) {
    const pair = await this.keyPairFor(link);
    if (this.mesh.get(link.peerId) !== link || !link.conn.open) return;
    const pub = await exportPublicJwk(pair.publicKey);
    this.sendRaw(link.conn, { v: 2, t: "key", alg: E2E_ALG, from: this.localId, pub } satisfies MeshControl);
    link.keySent = true;
  }

  private async sendSecure(peerId: string, payload: SecurePayload) {
    const link = await this.waitForSecureLink(peerId);
    const sealed = await encryptPayload(link.key!, payload);
    if (this.mesh.get(peerId) !== link || !link.conn.open) throw new Error("This user went offline.");
    this.sendRaw(link.conn, { v: 2, t: "sealed", from: this.localId, ...sealed } satisfies MeshControl);
  }

  private async waitForSecureLink(peerId: string): Promise<MeshLink> {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const link = this.mesh.get(peerId);
      if (!link?.conn.open) throw new Error("This user is no longer online.");
      if (link.encrypted && link.key) return link;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    throw new Error("Secure connection is not ready.");
  }

  private async handleSecurePayload(peerId: string, raw: unknown) {
    if (!raw || typeof raw !== "object") return;
    const payload = raw as Partial<SecurePayload>;
    if (payload.v !== 2 || typeof payload.t !== "string") return;
    if (payload.t === "chat") {
      const text = sanitizeChatText(payload.text);
      const id = typeof payload.id === "string" ? payload.id.slice(0, 80) : "";
      if (!text || !id) return;
      this.handlers.onMessage({
        id, kind: "chat", from: this.knownPeers.get(peerId)?.name || "User",
        fromId: peerId, peerId, text, ts: isFiniteTimestamp(payload.ts),
      });
      return;
    }
    if (payload.t === "file-start") {
      this.startIncomingFile(peerId, payload);
      return;
    }
    if (payload.t === "file-chunk") {
      this.appendIncomingChunk(peerId, payload);
      return;
    }
    if (payload.t === "file-end") this.finishIncomingFile(peerId, payload);
  }

  private startIncomingFile(peerId: string, payload: Partial<Extract<SecurePayload, { t: "file-start" }>>) {
    const id = typeof payload.id === "string" ? payload.id.slice(0, 80) : "";
    const size = Number(payload.size);
    const chunks = Number(payload.chunks);
    if (!id || !Number.isSafeInteger(size) || size < 0 || size > MAX_LAN_FILE_BYTES) return;
    if (!Number.isSafeInteger(chunks) || chunks !== fileChunkCount(size, FILE_CHUNK_CHARS)) return;
    const active = [...this.incomingFiles.values()].filter((entry) => entry.peerId === peerId).length;
    if (active >= MAX_INCOMING_FILES_PER_PEER) return;
    const key = `${peerId}:${id}`;
    const name = sanitizeFileName(payload.name, "file.bin");
    this.incomingFiles.set(key, {
      id, name, size, chunks, parts: new Map(), encodedChars: 0, peerId,
      mime: typeof payload.mime === "string" ? payload.mime.slice(0, 120) : "application/octet-stream",
    });
    this.emitTransfer(id, name, "receive", 0, size, false, peerId);
  }

  private appendIncomingChunk(peerId: string, payload: Partial<Extract<SecurePayload, { t: "file-chunk" }>>) {
    const id = typeof payload.id === "string" ? payload.id.slice(0, 80) : "";
    const entry = this.incomingFiles.get(`${peerId}:${id}`);
    const index = Number(payload.index);
    if (!entry || !Number.isSafeInteger(index) || index < 0 || index >= entry.chunks) return;
    if (entry.parts.has(index) || typeof payload.data !== "string") return;
    const expected = fileChunkLength(entry.size, FILE_CHUNK_CHARS, index);
    if (expected < 0 || payload.data.length !== expected || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload.data)) {
      this.failIncoming(entry, "Invalid file chunk.");
      return;
    }
    entry.parts.set(index, payload.data);
    entry.encodedChars += payload.data.length;
    const received = entry.chunks ? Math.min(entry.size, Math.floor((entry.parts.size / entry.chunks) * entry.size)) : entry.size;
    this.emitTransfer(entry.id, entry.name, "receive", received, entry.size, false, peerId);
  }

  private finishIncomingFile(peerId: string, payload: Partial<Extract<SecurePayload, { t: "file-end" }>>) {
    const id = typeof payload.id === "string" ? payload.id.slice(0, 80) : "";
    const key = `${peerId}:${id}`;
    const entry = this.incomingFiles.get(key);
    if (!entry) return;
    try {
      if (entry.parts.size !== entry.chunks) throw new Error("File transfer ended before all chunks arrived.");
      let encoded = "";
      for (let index = 0; index < entry.chunks; index++) encoded += entry.parts.get(index) || "";
      if (encoded.length !== entry.encodedChars) throw new Error("File transfer data was incomplete.");
      const bytes = fromBase64(encoded);
      if (bytes.byteLength !== entry.size) throw new Error("Received file size did not match metadata.");
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer], { type: entry.mime || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      this.emitTransfer(entry.id, entry.name, "receive", entry.size, entry.size, true, peerId);
      this.handlers.onMessage({
        id: entry.id, kind: "file", from: this.knownPeers.get(peerId)?.name || "User",
        fromId: peerId, peerId, text: `Received file ${entry.name}`, ts: Date.now(),
        fileName: entry.name, fileSize: entry.size, fileUrl: url,
      });
      this.incomingFiles.delete(key);
    } catch (error) {
      this.failIncoming(entry, error instanceof Error ? error.message : "Could not assemble file.");
    }
  }

  private failIncoming(entry: IncomingFile, error: string) {
    this.incomingFiles.delete(`${entry.peerId}:${entry.id}`);
    this.emitTransfer(entry.id, entry.name, "receive", 0, entry.size, true, entry.peerId, error);
  }

  private async waitForCapacity(peerId: string) {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const link = this.mesh.get(peerId);
      if (!link?.conn.open || link.conn.dataChannel?.readyState !== "open") throw new Error("Connection closed during file transfer.");
      if (link.conn.dataChannel.bufferedAmount <= 2 * 1024 * 1024) return;
      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }
    throw new Error("File transfer timed out while waiting for the connection.");
  }

  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.closed) return;
      const now = Date.now();
      for (const [peerId, link] of this.mesh) {
        if (!link.conn.open) continue;
        if (link.lastActivity < now - STALE_LINK_MS) {
          this.dropMesh(peerId, link.conn, true);
          continue;
        }
        try { this.sendRaw(link.conn, { v: 2, t: "ping", n: now } satisfies MeshControl); } catch { this.dropMesh(peerId, link.conn, true); }
      }
      for (const [peerId, known] of this.knownPeers) {
        if (known.seenAt < now - PRESENCE_TTL_MS && !this.mesh.get(peerId)?.opened) this.knownPeers.delete(peerId);
      }
      this.emitPeers();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private dropMesh(peerId: string, conn: DataConnection, retry: boolean) {
    const link = this.mesh.get(peerId);
    if (!link || link.conn !== conn) return;
    this.mesh.delete(peerId);
    this.clearMeshTimer(peerId);
    try { conn.close(); } catch { /* ignore */ }
    for (const entry of [...this.incomingFiles.values()]) {
      if (entry.peerId === peerId) this.failIncoming(entry, "Connection closed during file transfer.");
    }
    this.emitPeers();
    if (retry && !this.closed && shouldInitiateMesh(this.localId, peerId)) this.scheduleRedial(peerId);
  }

  private scheduleRedial(peerId: string) {
    if (this.redialTimers.has(peerId)) return;
    const known = this.knownPeers.get(peerId);
    if (!known || known.seenAt < Date.now() - PRESENCE_TTL_MS) return;
    const timer = window.setTimeout(() => {
      this.redialTimers.delete(peerId);
      this.ensureMesh(peerId);
    }, REDIAL_DELAY_MS);
    this.redialTimers.set(peerId, timer);
  }

  private clearMeshTimer(peerId: string) {
    const timer = this.meshOpenTimers.get(peerId);
    if (timer !== undefined) window.clearTimeout(timer);
    this.meshOpenTimers.delete(peerId);
  }

  private clearDiscoveryTimer(anchorId: string) {
    const timer = this.discoveryOpenTimers.get(anchorId);
    if (timer !== undefined) window.clearTimeout(timer);
    this.discoveryOpenTimers.delete(anchorId);
  }

  private validTarget(raw: string): string {
    const target = sanitizePeerId(raw);
    if (!target || target === this.localId) throw new Error("Invalid peer.");
    return target;
  }

  private iceFailureMessage(peerId?: string): string {
    const name = peerId ? this.knownPeers.get(peerId)?.name || "the user" : "the nearby browser";
    if (iceMode(this.iceConfig) === "lan-only") {
      return `Could not open a local WebRTC path to ${name}. Allow Local Network access and disable Wi-Fi client/AP isolation, or enable Compatibility mode on both devices.`;
    }
    return `WebRTC ICE negotiation with ${name} failed. Check local-network permission and AP isolation; configure TURN if direct paths are blocked.`;
  }

  private sendRaw(conn: DataConnection, packet: PresencePacket | MeshControl) {
    if (!conn.open) throw new Error("Peer connection is not open.");
    conn.send(packet);
  }

  private emitTransfer(
    id: string, name: string, direction: "send" | "receive", received: number,
    total: number, done: boolean, peerId: string, error?: string,
  ) {
    this.handlers.onTransfer({ id, name, direction, received, total, done, peerId, ...(error ? { error } : {}) });
  }

  private emitPeers() {
    this.handlers.onPeers(this.listPeers());
  }
}
