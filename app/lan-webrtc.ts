export type PeerRole = "host" | "guest";

export type ChatMessage = {
  id: string;
  kind: "chat" | "system" | "config" | "file";
  from: string;
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
};

type SessionPayload = {
  v: 1;
  role: PeerRole;
  sdp: RTCSessionDescriptionInit;
  name: string;
};

type WireMessage =
  | { v: 1; t: "hello"; name: string }
  | { v: 1; t: "chat"; id: string; text: string; ts: number; name: string }
  | { v: 1; t: "config"; id: string; name: string; content: string; ts: number; from: string }
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
    }
  | { v: 1; t: "file-chunk"; id: string; index: number; data: string }
  | { v: 1; t: "file-end"; id: string };

const CHUNK_CHARS = 12_000;
export const MAX_LAN_FILE_BYTES = 40 * 1024 * 1024;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 4,
  });
}

export async function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }, 2500);
  });
}

export function encodeSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return `tcptun-lan:1:${payload.role}:${btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

export function decodeSession(raw: string): SessionPayload {
  const text = raw.trim();
  const match = /^tcptun-lan:1:(host|guest):([A-Za-z0-9_-]+)$/.exec(text);
  if (!match) throw new Error("Invalid session code. Paste a full tcptun-lan code.");
  const role = match[1] as PeerRole;
  const b64 = match[2].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as SessionPayload;
  if (payload.v !== 1 || !payload.sdp?.type || !payload.sdp.sdp) {
    throw new Error("Session code is missing SDP data.");
  }
  if (payload.role !== role) throw new Error("Session role mismatch in code.");
  return payload;
}

export function listHostCandidates(pc: RTCPeerConnection): string[] {
  const sdp = pc.localDescription?.sdp || "";
  const hosts: string[] = [];
  for (const line of sdp.split(/\r?\n/)) {
    if (!line.startsWith("a=candidate:")) continue;
    const parts = line.slice("a=candidate:".length).split(" ");
    if (parts.length < 8) continue;
    const ip = parts[4];
    const port = parts[5];
    const typ = parts[7];
    if (typ === "host" || typ === "srflx") hosts.push(`${ip}:${port} (${typ})`);
  }
  return Array.from(new Set(hosts)).slice(0, 8);
}

function uid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export type LanSessionHandlers = {
  onStatus: (status: string) => void;
  onConnection: (state: RTCPeerConnectionState) => void;
  onChannel: (open: boolean) => void;
  onMessage: (message: ChatMessage) => void;
  onTransfer: (progress: TransferProgress) => void;
  onPeerName: (name: string) => void;
  onError: (error: string) => void;
};

export class LanSession {
  readonly role: PeerRole;
  readonly localName: string;
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private handlers: LanSessionHandlers;
  private incoming = new Map<
    string,
    {
      name: string;
      size: number;
      mime: string;
      parts: Map<number, string>;
      expected: number;
      from: string;
    }
  >();
  private closed = false;

  constructor(role: PeerRole, localName: string, handlers: LanSessionHandlers) {
    this.role = role;
    this.localName = localName.trim() || (role === "host" ? "Host" : "Guest");
    this.handlers = handlers;
    this.pc = createPeerConnection();
    this.pc.onconnectionstatechange = () => {
      this.handlers.onConnection(this.pc.connectionState);
      this.handlers.onStatus(`Connection: ${this.pc.connectionState}`);
      if (this.pc.connectionState === "failed") {
        this.handlers.onError(
          "WebRTC connection failed. Both devices must be able to reach each other (same LAN/VPN helps).",
        );
      }
    };
    this.pc.oniceconnectionstatechange = () => {
      this.handlers.onStatus(`ICE: ${this.pc.iceConnectionState}`);
    };
  }

  get peerConnection(): RTCPeerConnection {
    return this.pc;
  }

  get isOpen(): boolean {
    return this.channel?.readyState === "open";
  }

  async createHostOffer(): Promise<string> {
    this.channel = this.pc.createDataChannel("tcptun-lan", { ordered: true });
    this.bindChannel(this.channel);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await waitForIceGathering(this.pc);
    const local = this.pc.localDescription;
    if (!local) throw new Error("Failed to create local offer.");
    this.handlers.onStatus("Offer ready — share the host code with the other device.");
    return encodeSession({
      v: 1,
      role: "host",
      name: this.localName,
      sdp: { type: local.type, sdp: local.sdp },
    });
  }

  async acceptHostOffer(hostCode: string): Promise<string> {
    const host = decodeSession(hostCode);
    if (host.role !== "host") throw new Error("Expected a host session code.");
    this.handlers.onPeerName(host.name || "Host");
    this.pc.ondatachannel = (event) => {
      this.channel = event.channel;
      this.bindChannel(event.channel);
    };
    await this.pc.setRemoteDescription(host.sdp);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await waitForIceGathering(this.pc);
    const local = this.pc.localDescription;
    if (!local) throw new Error("Failed to create local answer.");
    this.handlers.onStatus("Answer ready — send the guest code back to the host.");
    return encodeSession({
      v: 1,
      role: "guest",
      name: this.localName,
      sdp: { type: local.type, sdp: local.sdp },
    });
  }

  async acceptGuestAnswer(guestCode: string): Promise<void> {
    const guest = decodeSession(guestCode);
    if (guest.role !== "guest") throw new Error("Expected a guest session code.");
    this.handlers.onPeerName(guest.name || "Guest");
    await this.pc.setRemoteDescription(guest.sdp);
    this.handlers.onStatus("Guest answer applied. Waiting for DataChannel…");
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
    };
    this.sendWire(msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "chat",
      from: this.localName,
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
    };
    this.sendWire(msg);
    this.handlers.onMessage({
      id: msg.id,
      kind: "config",
      from: this.localName,
      text: `Shared config ${name} (${content.length.toLocaleString()} chars)`,
      ts: msg.ts,
      fileName: name,
    });
  }

  async sendFile(file: File) {
    if (file.size > MAX_LAN_FILE_BYTES) {
      throw new Error(`File exceeds ${Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB limit.`);
    }
    if (!this.channel || this.channel.readyState !== "open") {
      throw new Error("Data channel is not open.");
    }

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

    this.sendWire({
      v: 1,
      t: "file-start",
      id,
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
      chunks: chunks.length,
      ts: Date.now(),
      from: this.localName,
    });

    for (let index = 0; index < chunks.length; index++) {
      await this.waitForBufferedAmount();
      this.sendWire({ v: 1, t: "file-chunk", id, index, data: chunks[index] });
      this.handlers.onTransfer({
        id,
        name: file.name,
        direction: "send",
        received: Math.min(file.size, Math.floor(((index + 1) / chunks.length) * file.size)),
        total: file.size,
        done: false,
      });
    }

    this.sendWire({ v: 1, t: "file-end", id });
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
      text: `Sent file ${file.name}`,
      ts: Date.now(),
      fileName: file.name,
      fileSize: file.size,
    });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.channel?.close();
    } catch {
      // ignore
    }
    try {
      this.pc.close();
    } catch {
      // ignore
    }
    this.handlers.onChannel(false);
    this.handlers.onStatus("Session closed.");
  }

  private bindChannel(channel: RTCDataChannel) {
    channel.binaryType = "arraybuffer";
    channel.onopen = () => {
      this.handlers.onChannel(true);
      this.handlers.onStatus("Data channel open. You can chat and send files.");
      this.sendWire({ v: 1, t: "hello", name: this.localName });
    };
    channel.onclose = () => {
      this.handlers.onChannel(false);
      this.handlers.onStatus("Data channel closed.");
    };
    channel.onerror = () => this.handlers.onError("Data channel error.");
    channel.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      try {
        this.handleWire(JSON.parse(event.data) as WireMessage);
      } catch {
        this.handlers.onError("Received an invalid message.");
      }
    };
  }

  private handleWire(msg: WireMessage) {
    if (msg.t === "hello") {
      this.handlers.onPeerName(msg.name || "Peer");
      this.handlers.onMessage({
        id: uid(),
        kind: "system",
        from: "system",
        text: `${msg.name || "Peer"} joined the session.`,
        ts: Date.now(),
      });
      return;
    }

    if (msg.t === "chat") {
      this.handlers.onMessage({
        id: msg.id,
        kind: "chat",
        from: msg.name || "Peer",
        text: msg.text,
        ts: msg.ts || Date.now(),
      });
      return;
    }

    if (msg.t === "config") {
      const blob = new Blob([msg.content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      this.handlers.onMessage({
        id: msg.id,
        kind: "config",
        from: msg.from || "Peer",
        text: `Received config ${msg.name}`,
        ts: msg.ts || Date.now(),
        fileName: msg.name,
        fileUrl: url,
      });
      return;
    }

    if (msg.t === "file-start") {
      this.incoming.set(msg.id, {
        name: msg.name,
        size: msg.size,
        mime: msg.mime || "application/octet-stream",
        parts: new Map(),
        expected: msg.chunks,
        from: msg.from || "Peer",
      });
      this.handlers.onTransfer({
        id: msg.id,
        name: msg.name,
        direction: "receive",
        received: 0,
        total: msg.size,
        done: false,
      });
      return;
    }

    if (msg.t === "file-chunk") {
      const entry = this.incoming.get(msg.id);
      if (!entry) return;
      entry.parts.set(msg.index, msg.data);
      const receivedParts = entry.parts.size;
      this.handlers.onTransfer({
        id: msg.id,
        name: entry.name,
        direction: "receive",
        received: Math.min(entry.size, Math.floor((receivedParts / entry.expected) * entry.size)),
        total: entry.size,
        done: false,
      });
      return;
    }

    if (msg.t === "file-end") {
      const entry = this.incoming.get(msg.id);
      if (!entry) return;
      if (entry.parts.size !== entry.expected) {
        this.handlers.onTransfer({
          id: msg.id,
          name: entry.name,
          direction: "receive",
          received: 0,
          total: entry.size,
          done: true,
          error: "Incomplete file transfer.",
        });
        this.incoming.delete(msg.id);
        return;
      }

      try {
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
        });
        this.handlers.onMessage({
          id: msg.id,
          kind: "file",
          from: entry.from,
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
        });
      }
      this.incoming.delete(msg.id);
    }
  }

  private sendWire(msg: WireMessage) {
    if (!this.channel || this.channel.readyState !== "open") {
      throw new Error("Not connected.");
    }
    this.channel.send(JSON.stringify(msg));
  }

  private async waitForBufferedAmount() {
    const channel = this.channel;
    if (!channel) return;
    const threshold = 256 * 1024;
    if (channel.bufferedAmount < threshold) return;
    await new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        if (!this.channel || this.channel.bufferedAmount < threshold / 2) {
          window.clearInterval(timer);
          resolve();
        }
      }, 20);
    });
  }
}
