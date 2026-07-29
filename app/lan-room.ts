import Peer, { type DataConnection, type PeerError } from "peerjs";

export type ChatMessage = {
  id: string;
  kind: "chat" | "system" | "config" | "file";
  from: string;
  fromId?: string;
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

  async join(room: string, displayName: string): Promise<void> {
    this.leave();
    this.closed = false;
    this.room = room.trim() || "tcptun-lan";
    this.localName = displayName.trim() || "User";
    this.peerNames.clear();
    this.connections.clear();

    const hostId = roomHostId(this.room);
    this.handlers.onStatus(`Joining room “${this.room}”…`);

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
      { id: this.localId || "local", name: `${this.localName} (you)`, self: true },
    ];
    for (const [id, name] of this.peerNames) {
      if (id === this.localId) continue;
      peers.push({ id, name });
    }
    return peers;
  }

  sendChat(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const msg: WireMessage = {
      v: 1,
      t: "chat",
      id: uid(),
      text: clean,
      ts: Date.now(),
      name: this.localName,
      fromId: this.localId,
    };
    this.broadcastWire(msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "chat",
      from: this.localName,
      fromId: this.localId,
      text: clean,
      ts: msg.ts,
    });
  }

  sendConfig(fileName: string, content: string) {
    const name = fileName.trim() || "config.json";
    if (!content.trim()) throw new Error("Config content is empty.");
    if (new TextEncoder().encode(content).length > MAX_LAN_FILE_BYTES) {
      throw new Error("Config is too large to send.");
    }
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
    this.broadcastWire(msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "config",
      from: this.localName,
      fromId: this.localId,
      text: `Shared config ${name}`,
      ts: msg.ts,
      fileName: name,
    });
  }

  async sendFile(file: File) {
    if (file.size > MAX_LAN_FILE_BYTES) {
      throw new Error(`File exceeds ${Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB limit.`);
    }
    if (this.connections.size === 0) throw new Error("No peers connected yet.");

    const id = uid();
    const buffer = await file.arrayBuffer();
    const b64 = toBase64(buffer);
    const chunks: string[] = [];
    for (let i = 0; i < b64.length; i += CHUNK_CHARS) chunks.push(b64.slice(i, i + CHUNK_CHARS));

    this.handlers.onTransfer({
      id,
      name: file.name,
      direction: "send",
      received: 0,
      total: file.size,
      done: false,
    });

    this.broadcastWire({
      v: 1,
      t: "file-start",
      id,
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
      chunks: chunks.length,
      ts: Date.now(),
      from: this.localName,
      fromId: this.localId,
    });

    for (let index = 0; index < chunks.length; index++) {
      this.broadcastWire({ v: 1, t: "file-chunk", id, index, data: chunks[index] });
      this.handlers.onTransfer({
        id,
        name: file.name,
        direction: "send",
        received: Math.min(file.size, Math.floor(((index + 1) / chunks.length) * file.size)),
        total: file.size,
        done: false,
      });
      // Yield so UI can paint progress.
      if (index % 4 === 0) await new Promise((r) => window.setTimeout(r, 0));
    }

    this.broadcastWire({ v: 1, t: "file-end", id });
    this.handlers.onTransfer({
      id,
      name: file.name,
      direction: "send",
      received: file.size,
      total: file.size,
      done: true,
    });
    this.handlers.onMessage({
      id,
      kind: "file",
      from: this.localName,
      fromId: this.localId,
      text: `Sent file ${file.name}`,
      ts: Date.now(),
      fileName: file.name,
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
        this.handlers.onStatus(`Room host online. Waiting for peers in “${this.room}”…`);
        this.emitPeers();
        this.bindHost(hostPeer);
        this.broadcast?.postMessage({ v: 1, t: "bc-announce", id, name: this.localName });
        resolve();
      });

      hostPeer.on("error", (err: PeerError) => {
        const type = String((err as { type?: string }).type || "");
        if (type === "unavailable-id" || type === "network" || type === "server-error") {
          failToGuest(type === "unavailable-id" ? "Room host already exists." : "Host claim failed.");
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
        this.handlers.onStatus(`Joined as ${id}. Connecting to room host…`);
        this.emitPeers();

        peer.on("connection", (conn) => this.acceptConnection(conn));

        const conn = peer.connect(hostId, { reliable: true });
        this.wireConnection(conn, hostId, true);

        conn.on("open", () => {
          this.handlers.onStatus(`Connected to room. Peers will appear automatically.`);
          resolve();
        });

        conn.on("error", () => {
          // Host may be temporarily down; retry.
          this.scheduleReconnect(hostId);
          resolve();
        });
      });

      peer.on("error", (err: PeerError) => {
        this.handlers.onError(err.message || "Peer connection error");
        if (!this.localId) reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  private scheduleReconnect(hostId: string) {
    if (this.closed || this.isHost) return;
    if (this.reconnectTimer !== null) return;
    this.handlers.onStatus("Room host unreachable. Retrying…");
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
    if (msg.t === "hello") {
      this.peerNames.set(msg.id || viaPeerId, msg.name || "Peer");
      this.emitPeers();
      this.handlers.onMessage({
        id: uid(),
        kind: "system",
        from: "system",
        text: `${msg.name || "Peer"} is online.`,
        ts: Date.now(),
      });
      // Mesh: connect to any peer we don't know yet when host shares list later.
      if (this.isHost) this.broadcastPeerList();
      return;
    }

    if (msg.t === "peers") {
      for (const peer of msg.peers) {
        if (!peer.id || peer.id === this.localId) continue;
        this.peerNames.set(peer.id, peer.name || "Peer");
        this.ensureMeshConnection(peer.id);
      }
      this.emitPeers();
      return;
    }

    if (msg.t === "chat") {
      // Host relays to other peers for full-room broadcast if needed.
      if (this.isHost) this.relayExcept(msg, msg.fromId || viaPeerId);
      this.handlers.onMessage({
        id: msg.id,
        kind: "chat",
        from: msg.name || "Peer",
        fromId: msg.fromId,
        text: msg.text,
        ts: msg.ts || Date.now(),
      });
      return;
    }

    if (msg.t === "config") {
      if (this.isHost) this.relayExcept(msg, msg.fromId || viaPeerId);
      const blob = new Blob([msg.content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      this.handlers.onMessage({
        id: msg.id,
        kind: "config",
        from: msg.from || "Peer",
        fromId: msg.fromId,
        text: `Received config ${msg.name}`,
        ts: msg.ts || Date.now(),
        fileName: msg.name,
        fileUrl: url,
      });
      return;
    }

    if (msg.t === "file-start") {
      if (this.isHost) this.relayExcept(msg, msg.fromId || viaPeerId);
      this.incoming.set(msg.id, {
        name: msg.name,
        size: msg.size,
        mime: msg.mime || "application/octet-stream",
        parts: new Map(),
        expected: msg.chunks,
        from: msg.from || "Peer",
        fromId: msg.fromId || viaPeerId,
      });
      this.handlers.onTransfer({
        id: msg.id,
        name: msg.name,
        direction: "receive",
        received: 0,
        total: msg.size,
        done: false,
        peerId: msg.fromId,
      });
      return;
    }

    if (msg.t === "file-chunk") {
      if (this.isHost) this.relayExcept(msg, viaPeerId);
      const entry = this.incoming.get(msg.id);
      if (!entry) return;
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
      if (this.isHost) this.relayExcept(msg, viaPeerId);
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
        const copy = new Uint8Array(bytes.byteLength);
        copy.set(bytes);
        const blob = new Blob([copy], { type: entry.mime });
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
          text: `Received file ${entry.name}`,
          ts: Date.now(),
          fileName: entry.name,
          fileSize: entry.size,
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
    this.broadcastWire({ v: 1, t: "peers", peers: list }, /* include self map */ false);
  }

  private broadcastWire(msg: WireMessage, _unused = true) {
    for (const conn of this.connections.values()) {
      if (conn.open) this.send(conn, msg);
    }
  }

  private relayExcept(msg: WireMessage, exceptPeerId: string) {
    for (const [id, conn] of this.connections) {
      if (id === exceptPeerId) continue;
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

  private emitPeers() {
    this.handlers.onPeers(this.listPeers());
  }
}
