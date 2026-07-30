import Peer, { type DataConnection } from "peerjs";
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
};

type WireMessage =
  | { v: 1; t: "hello"; id: string; name: string; room: string }
  | { v: 1; t: "peers"; peers: Array<{ id: string; name: string }> }
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

  async join(room: string, displayName: string): Promise<void> {
    this.leave();
    this.closed = false;
    this.room = room.trim().slice(0, 64) || "tcptun-lan";
    this.localName = sanitizeDisplayName(displayName, "User");
    this.peerNames.clear();
    this.connections.clear();

    const hostId = roomHostId(this.room);
    this.handlers.onStatus("Looking for online users…");

    // Same-origin multi-tab discovery
    this.broadcast = new BroadcastChannel(BC_PREFIX + hostId);
    this.broadcast.onmessage = (event) => {
      if (this.closed) return;
      const data = event.data as WireMessage | { v: 1; t: "bc-announce"; id: string; name: string };
      if (!data || typeof data !== "object") return;
      if ("t" in data && data.t === "bc-announce" && data.id && data.id !== this.localId) {
        // Another tab in this browser — ask PeerJS mesh isn't needed; we still use PeerJS for real peers.
        // Optionally show as system presence only if we later add local-only mode.
        return;
      }
    };

    await this.claimOrJoinHost(hostId);
  }

  leave() {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
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
    this.handlers.onStatus("Left room.");
  }

  listPeers(): RoomPeer[] {
    const peers: RoomPeer[] = [
      { id: this.localId || "local", name: `${this.localName} (you)`, self: true, connected: true },
    ];
    for (const [id, name] of this.peerNames) {
      if (id === this.localId) continue;
      peers.push({ id, name, connected: this.connections.get(id)?.open === true });
    }
    return peers;
  }

  sendChat(peerId: string, text: string) {
    const clean = assertSendableChat(text);
    const target = sanitizePeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    const conn = this.connectionFor(target);
    const msg: WireMessage = {
      v: 1,
      t: "chat",
      id: uid(),
      text: clean,
      ts: Date.now(),
      name: this.localName,
      fromId: this.localId,
    };
    this.send(conn, msg);
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

  sendConfig(peerId: string, fileName: string, content: string) {
    const target = sanitizePeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    const name = sanitizeFileName(fileName, "config.json");
    if (!content.trim()) throw new Error("Config content is empty.");
    if (new TextEncoder().encode(content).length > MAX_LAN_FILE_BYTES) {
      throw new Error("Config is too large to send.");
    }
    const conn = this.connectionFor(target);
    const msg: WireMessage = {
      v: 1,
      t: "config",
      id: uid(),
      name,
      content,
      ts: Date.now(),
      from: this.localName,
      fromId: this.localId,
    };
    this.send(conn, msg);
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
    const safeName = sanitizeFileName(file.name, "file.bin");
    const conn = this.connectionFor(target);

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

    this.send(conn, {
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
      this.send(conn, { v: 1, t: "file-chunk", id, index, data: chunks[index] });
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

    this.send(conn, { v: 1, t: "file-end", id });
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
      const hostPeer = new Peer(hostId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });

      let settled = false;

      const failToGuest = (reason: string) => {
        if (settled) return;
        settled = true;
        try {
          hostPeer.destroy();
        } catch {
          // ignore
        }
        this.handlers.onStatus(`${reason} Connecting as participant…`);
        void this.joinAsGuest(hostId).then(resolve).catch(reject);
      };

      hostPeer.on("open", (id) => {
        if (settled) return;
        settled = true;
        this.peer = hostPeer;
        this.localId = id;
        this.isHost = true;
        this.peerNames.set(id, this.localName);
        this.handlers.onJoined({ peerId: id, isHost: true, room: this.room });
        this.handlers.onStatus("You are online. Waiting for other users…");
        this.emitPeers();
        this.bindHost(hostPeer);
        this.broadcast?.postMessage({ v: 1, t: "bc-announce", id, name: this.localName });
        resolve();
      });

      hostPeer.on("error", (err) => {
        const type = String((err as { type?: string }).type || "");
        if (type === "unavailable-id" || type === "network" || type === "server-error") {
          failToGuest(type === "unavailable-id" ? "Discovery service found." : "Connecting to discovery service.");
          return;
        }
        if (!settled) {
          settled = true;
          reject(err instanceof Error ? err : new Error("Failed to join room."));
        } else {
          this.handlers.onError(err.message || "Peer error");
        }
      });
    });
  }

  private async joinAsGuest(hostId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });

      peer.on("open", (id) => {
        this.peer = peer;
        this.localId = id;
        this.isHost = false;
        this.peerNames.set(id, this.localName);
        this.handlers.onJoined({ peerId: id, isHost: false, room: this.room });
        this.handlers.onStatus(`Your key is ready. Finding online users…`);
        this.emitPeers();

        peer.on("connection", (conn) => this.acceptConnection(conn));

        const conn = peer.connect(hostId, { reliable: true });
        this.wireConnection(conn, hostId, true);

        conn.on("open", () => {
          this.handlers.onStatus("Online users will appear automatically.");
          resolve();
        });

        conn.on("error", () => {
          // Host may be temporarily down; retry.
          this.scheduleReconnect(hostId);
          resolve();
        });
      });

      peer.on("error", (err) => {
        this.handlers.onError(err.message || "Peer connection error");
        if (!this.localId) reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  private scheduleReconnect(hostId: string) {
    if (this.closed || this.isHost) return;
    if (this.reconnectTimer !== null) return;
    this.handlers.onStatus("Discovery service is reconnecting…");
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closed || !this.peer || this.isHost) return;
      if (this.connections.has(hostId) && this.connections.get(hostId)?.open) return;
      const conn = this.peer.connect(hostId, { reliable: true });
      this.wireConnection(conn, hostId, true);
    }, 2000);
  }

  private bindHost(hostPeer: Peer) {
    hostPeer.on("connection", (conn) => this.acceptConnection(conn));
    hostPeer.on("disconnected", () => {
      if (this.closed) return;
      this.handlers.onStatus("Disconnected from signaling. Reconnecting…");
      hostPeer.reconnect();
    });
  }

  private acceptConnection(conn: DataConnection) {
    this.wireConnection(conn, conn.peer, false);
  }

  private wireConnection(conn: DataConnection, peerId: string, outgoing: boolean) {
    if (this.connections.has(peerId) && this.connections.get(peerId)?.open) {
      try {
        conn.close();
      } catch {
        // ignore
      }
      return;
    }

    this.connections.set(peerId, conn);

    conn.on("open", () => {
      this.send(conn, { v: 1, t: "hello", id: this.localId, name: this.localName, room: this.room });
      if (this.isHost) this.broadcastPeerList();
      this.handlers.onStatus(
        outgoing ? `Linked to peer ${peerId.slice(0, 8)}…` : `Peer connected: ${peerId.slice(0, 8)}…`,
      );
      this.emitPeers();
    });

    conn.on("data", (data) => {
      try {
        const msg = data as WireMessage;
        this.handleWire(msg, peerId);
      } catch {
        this.handlers.onError("Invalid message from peer.");
      }
    });

    conn.on("close", () => {
      this.connections.delete(peerId);
      this.peerNames.delete(peerId);
      this.emitPeers();
      if (this.isHost) this.broadcastPeerList();
      this.handlers.onMessage({
        id: uid(),
        kind: "system",
        from: "system",
        peerId,
        text: `Peer left (${peerId.slice(0, 8)}…).`,
        ts: Date.now(),
      });
      if (!this.isHost && peerId === roomHostId(this.room)) {
        this.scheduleReconnect(peerId);
      }
    });

    conn.on("error", () => {
      this.handlers.onStatus(`Connection issue with ${peerId.slice(0, 8)}…`);
    });
  }

  private handleWire(msg: WireMessage, viaPeerId: string) {
    // Structural guard — drop anything that is not a plain object with a type.
    if (!msg || typeof msg !== "object" || typeof (msg as { t?: unknown }).t !== "string") return;

    if (msg.t === "hello") {
      const peerId = sanitizePeerId(msg.id) || sanitizePeerId(viaPeerId);
      if (!peerId) return;
      const name = sanitizeDisplayName(msg.name, "Peer");
      this.peerNames.set(peerId, name);
      this.emitPeers();
      this.handlers.onMessage({
        id: uid(),
        kind: "system",
        from: "system",
        peerId,
        text: `${name} is online.`,
        ts: Date.now(),
      });
      // Mesh: connect to any peer we don't know yet when host shares list later.
      if (this.isHost) this.broadcastPeerList();
      return;
    }

    if (msg.t === "peers") {
      if (!Array.isArray(msg.peers)) return;
      for (const peer of msg.peers.slice(0, 64)) {
        const peerId = sanitizePeerId(peer?.id);
        if (!peerId || peerId === this.localId) continue;
        this.peerNames.set(peerId, sanitizeDisplayName(peer?.name, "Peer"));
        this.ensureMeshConnection(peerId);
      }
      this.emitPeers();
      return;
    }

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
      // Always treat as octet-stream download — never execute as HTML/JS in-browser.
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
      // Cap concurrent incomplete transfers to limit memory abuse.
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
      // Bound base64 chunk size (CHARS + small slack)
      if (msg.data.length > CHUNK_CHARS + 64) return;
      // Reject extra chunks beyond expected to stop memory growth
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
        // Size mismatch: peer lied about size — still allow if under global cap.
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
    if (!this.peer || peerId === this.localId) return;
    if (this.connections.has(peerId)) return;
    // Only one side dials to avoid glare: connect if our id is lexicographically greater.
    if (this.localId < peerId) return;
    const conn = this.peer.connect(peerId, { reliable: true });
    this.wireConnection(conn, peerId, true);
  }

  private broadcastPeerList() {
    const peers = Array.from(this.peerNames.entries()).map(([id, name]) => ({ id, name }));
    // Include host self
    peers.push({ id: this.localId, name: this.localName });
    const unique = new Map(peers.map((p) => [p.id, p]));
    const list = Array.from(unique.values());
    this.broadcastWire({ v: 1, t: "peers", peers: list });
  }

  private broadcastWire(msg: WireMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) this.send(conn, msg);
    }
  }

  private send(conn: DataConnection, msg: WireMessage) {
    try {
      conn.send(msg);
    } catch {
      // ignore broken channel
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
