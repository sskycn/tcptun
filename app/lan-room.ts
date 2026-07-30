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
  hasRemoteIce,
  iceMode,
  iceModeLabel,
  peerRtcConfig,
  peerRtcConfigLanOnly,
  sanitizeIceConfigWithLiveStun,
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
  | { v: 1; t: "e2e"; iv: string; ct: string }
  /** Lightweight keepalive — not encrypted so it still works mid-handshake. */
  | { v: 1; t: "ping"; ts: number }
  | { v: 1; t: "pong"; ts: number };

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
/** DataChannel keepalive interval (foreground). Background tabs throttle timers. */
const HEARTBEAT_INTERVAL_MS = 6_000;
/** How long a peer stays "online" after channel drop while we redial (tab switch / brief blip). */
const SOFT_ONLINE_GRACE_MS = 45_000;
/** If an open channel has no traffic for this long, force redial. */
const STALE_CHANNEL_MS = 28_000;
/** Half-open DataChannel: abandon and redial so a stuck STUN gather cannot pin the dial. */
const DIAL_OPEN_TIMEOUT_MS = 14_000;
/** If no peer channel opens while STUN/TURN is configured, fall back to host-only ICE. */
const LAN_ICE_FALLBACK_MS = 18_000;
/** Soft-online window while dialing so peers appear in the list before open. */
const DIALING_SOFT_ONLINE_MS = 30_000;

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
      wireId: string;
      name: string;
      size: number;
      mime: string;
      parts: Map<number, string>;
      expected: number;
      from: string;
      /** Always transport peer id — never a claimed spoof. */
      fromId: string;
    }
  >();
  private reconnectTimer: number | null = null;
  /** Last time we saw activity (open/data/ping/pong) from a peer. */
  private lastAlive = new Map<string, number>();
  /** Peers in soft-online grace after a channel drop (tab switch, brief ICE blip). */
  private softOnlineUntil = new Map<string, number>();
  private softOfflineTimers = new Map<string, number>();
  private redialTimers = new Map<string, number>();
  private dialOpenTimers = new Map<string, number>();
  private heartbeatTimer: number | null = null;
  private lanIceFallbackTimer: number | null = null;
  /**
   * When public STUN/TURN is blocked, PeerJS PCs can stall. After a grace period we
   * rebuild the Peer with host-only ICE so same-LAN discovery still works.
   */
  private iceForceLanOnly = false;
  private lanIceFallbackInFlight = false;
  private presenceBound = false;
  private onVisibilityChange = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      this.resumePresence("visible");
    }
  };
  private onPageShow = () => this.resumePresence("pageshow");
  private onOnline = () => this.resumePresence("online");
  private onFocus = () => this.resumePresence("focus");

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
    this.iceForceLanOnly = false;
    this.lanIceFallbackInFlight = false;
    this.room = options.room.trim().slice(0, 64) || "tcptun-lan";
    this.localName = sanitizeDisplayName(options.displayName, "User");
    this.iceConfig = options.iceConfig ? { ...options.iceConfig } : { ...EMPTY_ICE_CONFIG };
    this.preferredPeerId = sanitizePeerId(options.preferredPeerId) || "";
    this.peerNames.clear();
    this.connections.clear();

    const hostId = roomHostId(this.room);
    // Join PeerJS immediately — do NOT block on STUN probes (that delayed discovery
    // and could empty iceServers on false negatives, breaking find-peers).
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
      // Show in contact list while DataChannel is still negotiating.
      this.enterSoftOnline(id, SOFT_ONLINE_GRACE_MS);
      this.emitPeers();
      // Dial announced peer over PeerJS when we are online (LAN / mesh).
      if (this.peer && this.localId) {
        this.ensureMeshConnection(id);
        this.armLanIceFallback();
      }
    };

    await this.claimOrJoinHost(hostId);
    if (this.closed) return;
    this.startLocalAnnounce();
    this.bindPresenceLifecycle();
    this.startHeartbeat();
    this.armLanIceFallback();

    // Background STUN health check — never blocks discovery. Only drops dead STUN
    // after join if we still have zero live channels and STUN appears fully dead.
    if (hasRemoteIce(this.iceConfig) && !this.iceForceLanOnly) {
      void this.backgroundRefineStun();
    }
  }

  /** Non-blocking STUN check after PeerJS is already up. */
  private async backgroundRefineStun() {
    try {
      const { config: liveIce, failedStun } = await sanitizeIceConfigWithLiveStun(this.iceConfig);
      if (this.closed || this.iceForceLanOnly) return;
      // If every STUN failed and we still have no open channels, switch to host-only ICE once.
      if (failedStun.length > 0 && liveIce.stunUrls.length === 0) {
        for (const conn of this.connections.values()) {
          if (conn.open) return; // already connected — leave ICE as-is
        }
        // Keep TURN if any; only clear STUN.
        this.iceConfig = { ...this.iceConfig, stunUrls: [] };
        if (!hasRemoteIce(this.iceConfig)) {
          await this.maybeSwitchToLanOnlyIce();
        }
      } else if (liveIce.stunUrls.length > 0 && liveIce.stunUrls.length < this.iceConfig.stunUrls.length) {
        // Drop only the dead STUN URLs for future peer rebuilds; don't tear down live mesh.
        this.iceConfig = { ...this.iceConfig, stunUrls: liveIce.stunUrls };
      }
    } catch {
      // ignore — discovery already running
    }
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

  private bindPresenceLifecycle() {
    if (this.presenceBound || typeof window === "undefined") return;
    this.presenceBound = true;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    // Page Lifecycle: resume after OS freezes a background tab.
    document.addEventListener("resume", this.onPageShow as EventListener);
    window.addEventListener("pageshow", this.onPageShow);
    window.addEventListener("online", this.onOnline);
    window.addEventListener("focus", this.onFocus);
  }

  private unbindPresenceLifecycle() {
    if (!this.presenceBound || typeof window === "undefined") return;
    this.presenceBound = false;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    document.removeEventListener("resume", this.onPageShow as EventListener);
    window.removeEventListener("pageshow", this.onPageShow);
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("focus", this.onFocus);
  }

  /**
   * Tab switches / OS sleep throttle PeerJS timers and can drop data channels.
   * On resume: rejoin signaling, redial known peers, keep soft-online presence.
   */
  private resumePresence(_reason: string) {
    if (this.closed || !this.peer || !this.localId) return;
    try {
      // PeerJS socket may be disconnected after a long background period.
      if (this.peer.disconnected && !this.peer.destroyed) {
        this.handlers.onStatus("Reconnecting…");
        this.peer.reconnect();
      }
    } catch {
      // ignore
    }

    // Refresh same-origin announce immediately.
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

    // Refresh soft-online grace for peers already mid-reconnect; redial everyone else quietly.
    for (const peerId of this.peerNames.keys()) {
      if (!peerId || peerId === this.localId) continue;
      const conn = this.connections.get(peerId);
      if (conn?.open) {
        this.touchPeer(peerId);
        this.sendPing(peerId);
        continue;
      }
      // Only extend grace if we already marked them soft-online (real channel drop).
      if (this.isSoftOnline(peerId)) {
        this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
      } else if ((this.lastAlive.get(peerId) || 0) > Date.now() - SOFT_ONLINE_GRACE_MS) {
        // Recently alive channel may have died while we were backgrounded.
        this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
      }
      this.scheduleRedial(peerId, true);
    }

    // Guest: ensure discovery host is dialed.
    if (!this.isHost) {
      const hostId = roomHostId(this.room);
      if (hostId && hostId !== this.localId) {
        this.rememberPeer(hostId, this.peerNames.get(hostId) || "User");
        this.scheduleRedial(hostId, true);
      }
    }

    this.emitPeers();
  }

  private startHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.heartbeatTimer = window.setInterval(() => this.heartbeatTick(), HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private heartbeatTick() {
    if (this.closed || !this.localId) return;
    const now = Date.now();

    // Keep PeerJS signaling alive after long throttle.
    try {
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
        this.peer.reconnect();
      }
    } catch {
      // ignore
    }

    for (const peerId of this.peerNames.keys()) {
      if (!peerId || peerId === this.localId) continue;
      const conn = this.connections.get(peerId);
      if (conn?.open) {
        const last = this.lastAlive.get(peerId) || 0;
        // Proactive ping keeps the DataChannel warm (helps some browsers while backgrounded).
        this.sendPing(peerId);
        if (last > 0 && now - last > STALE_CHANNEL_MS) {
          // Channel looks stuck — replace it.
          try {
            conn.close();
          } catch {
            // ignore
          }
          this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
          this.scheduleRedial(peerId, true);
        }
        continue;
      }

      // No open channel: keep redialing while soft-online or recently seen.
      if (this.isSoftOnline(peerId) || (this.lastAlive.get(peerId) || 0) > now - SOFT_ONLINE_GRACE_MS) {
        this.scheduleRedial(peerId, false);
      }
    }
  }

  private touchPeer(peerId: string) {
    const id = sanitizePeerId(peerId);
    if (!id || id === this.localId) return;
    this.lastAlive.set(id, Date.now());
    // Successful traffic ends soft-offline grace.
    this.clearSoftOnline(id);
  }

  private isSoftOnline(peerId: string): boolean {
    const until = this.softOnlineUntil.get(peerId) || 0;
    return until > Date.now();
  }

  private enterSoftOnline(peerId: string, graceMs: number) {
    const id = sanitizePeerId(peerId);
    if (!id || id === this.localId) return;
    const until = Date.now() + graceMs;
    const prev = this.softOnlineUntil.get(id) || 0;
    if (until > prev) this.softOnlineUntil.set(id, until);

    const existing = this.softOfflineTimers.get(id);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const delay = Math.max(500, until - Date.now());
    const timer = window.setTimeout(() => {
      this.softOfflineTimers.delete(id);
      this.finalizeSoftOffline(id);
    }, delay);
    this.softOfflineTimers.set(id, timer);
    this.emitPeers();
  }

  private clearSoftOnline(peerId: string) {
    this.softOnlineUntil.delete(peerId);
    const timer = this.softOfflineTimers.get(peerId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.softOfflineTimers.delete(peerId);
    }
  }

  private finalizeSoftOffline(peerId: string) {
    if (this.closed) return;
    // Still live? Cancel offline.
    if (this.connections.get(peerId)?.open) {
      this.clearSoftOnline(peerId);
      this.touchPeer(peerId);
      this.emitPeers();
      return;
    }
    this.softOnlineUntil.delete(peerId);
    // Drop e2e leftovers if channel never recovered.
    this.e2eSessions.delete(peerId);
    this.emitPeers();
    if (this.isHost) this.broadcastPeerList();
    // Only announce leave when we previously had a real session with this peer.
    if (!this.lastAlive.has(peerId)) return;
    this.lastAlive.delete(peerId);
    const leftName = this.peerNames.get(peerId) || "User";
    this.handlers.onMessage({
      id: uid(),
      kind: "system",
      from: "system",
      peerId,
      text: `${leftName} left.`,
      ts: Date.now(),
    });
  }

  private sendPing(peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn?.open) return;
    try {
      this.send(conn, { v: 1, t: "ping", ts: Date.now() });
    } catch {
      // ignore
    }
  }

  private scheduleRedial(peerId: string, immediate = false) {
    if (this.closed || !this.peer || !peerId || peerId === this.localId) return;
    if (this.connections.get(peerId)?.open) return;
    if (this.redialTimers.has(peerId)) {
      if (!immediate) return;
      window.clearTimeout(this.redialTimers.get(peerId));
      this.redialTimers.delete(peerId);
    }
    const delay = immediate ? 200 : 1_500 + Math.floor(Math.random() * 800);
    const timer = window.setTimeout(() => {
      this.redialTimers.delete(peerId);
      if (this.closed || !this.peer) return;
      if (this.connections.get(peerId)?.open) return;
      this.dialPeer(peerId, true);
      // Keep trying while soft-online.
      if (!this.connections.get(peerId)?.open && this.isSoftOnline(peerId)) {
        this.scheduleRedial(peerId, false);
      }
    }, delay);
    this.redialTimers.set(peerId, timer);
  }

  leave() {
    this.closed = true;
    this.unbindPresenceLifecycle();
    this.stopHeartbeat();
    this.clearLanIceFallbackTimer();
    this.clearAllDialOpenTimers();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.announceTimer !== null) {
      window.clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    for (const timer of this.softOfflineTimers.values()) window.clearTimeout(timer);
    this.softOfflineTimers.clear();
    for (const timer of this.redialTimers.values()) window.clearTimeout(timer);
    this.redialTimers.clear();
    this.lastAlive.clear();
    this.softOnlineUntil.clear();
    this.iceForceLanOnly = false;
    this.lanIceFallbackInFlight = false;
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
      const live = conn?.open === true;
      // Soft-online: stay in the contact list during brief tab-switch drops.
      const connected = live || this.isSoftOnline(id);
      peers.push({
        id,
        name,
        connected,
        encrypted: Boolean(e2e?.ready && e2e.key),
      });
    }
    return peers;
  }

  private peerServerOptions() {
    // When STUN/TURN is blocked, rebuild uses host-only ICE so LAN still works.
    const rtc = this.iceForceLanOnly ? peerRtcConfigLanOnly() : peerRtcConfig(this.iceConfig);
    return {
      debug: 0 as const,
      // Explicit cloud settings — more reliable than defaults under static HTTPS pages.
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      pingInterval: 5000,
      config: rtc,
    };
  }

  private effectiveIceModeLabel(): string {
    if (this.iceForceLanOnly) return iceModeLabel("lan-only");
    return iceModeLabel(iceMode(this.iceConfig));
  }

  private statusForMode(base: string): string {
    const label = this.effectiveIceModeLabel();
    return `${base} ${label}.`;
  }

  private clearLanIceFallbackTimer() {
    if (this.lanIceFallbackTimer !== null) {
      window.clearTimeout(this.lanIceFallbackTimer);
      this.lanIceFallbackTimer = null;
    }
  }

  private armLanIceFallback() {
    if (this.closed || this.iceForceLanOnly || this.lanIceFallbackInFlight) return;
    if (!hasRemoteIce(this.iceConfig)) return;
    // Already have a live channel — STUN path is fine (or host already won).
    for (const conn of this.connections.values()) {
      if (conn.open) return;
    }
    if (this.lanIceFallbackTimer !== null) return;
    this.lanIceFallbackTimer = window.setTimeout(() => {
      this.lanIceFallbackTimer = null;
      void this.maybeSwitchToLanOnlyIce();
    }, LAN_ICE_FALLBACK_MS);
  }

  private clearDialOpenTimer(peerId: string) {
    const timer = this.dialOpenTimers.get(peerId);
    if (timer === undefined) return;
    window.clearTimeout(timer);
    this.dialOpenTimers.delete(peerId);
  }

  private clearAllDialOpenTimers() {
    for (const timer of this.dialOpenTimers.values()) window.clearTimeout(timer);
    this.dialOpenTimers.clear();
  }

  private armDialOpenWatchdog(peerId: string, conn: DataConnection) {
    this.clearDialOpenTimer(peerId);
    const timer = window.setTimeout(() => {
      this.dialOpenTimers.delete(peerId);
      if (this.closed) return;
      if (this.connections.get(peerId) !== conn) return;
      if (conn.open) return;
      // Stuck half-open (common when STUN gather hangs) — drop and redial.
      try {
        conn.close();
      } catch {
        // ignore
      }
      if (this.connections.get(peerId) === conn) {
        this.connections.delete(peerId);
      }
      this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
      this.scheduleRedial(peerId, true);
      this.armLanIceFallback();
    }, DIAL_OPEN_TIMEOUT_MS);
    this.dialOpenTimers.set(peerId, timer);
  }

  /**
   * Public STUN/TURN blocked → rebuild PeerJS peer with host-only ICE.
   * Signaling (0.peerjs.com) is unchanged; only RTC iceServers become empty so
   * same-LAN host candidates can connect without waiting on STUN timeouts.
   */
  private async maybeSwitchToLanOnlyIce() {
    if (this.closed || this.iceForceLanOnly || this.lanIceFallbackInFlight) return;
    if (!hasRemoteIce(this.iceConfig)) return;
    for (const conn of this.connections.values()) {
      if (conn.open) return;
    }
    // Only fall back when we are actually trying to reach someone.
    const hostId = roomHostId(this.room);
    const trying =
      this.peerNames.size > 0 ||
      this.connections.size > 0 ||
      (!this.isHost && Boolean(this.localId) && this.localId !== hostId);
    if (!trying) return;

    this.lanIceFallbackInFlight = true;
    this.iceForceLanOnly = true;
    this.handlers.onStatus("Public STUN slow/unreachable — using local network ICE…");

    const preferred = this.preferredPeerId || this.localId;
    const wasHost = this.isHost;
    const savedNames = new Map(this.peerNames);

    this.clearAllDialOpenTimers();
    for (const timer of this.redialTimers.values()) window.clearTimeout(timer);
    this.redialTimers.clear();
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
    this.e2eSessions.clear();
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.peer = null;
    this.localId = "";
    this.isHost = false;
    this.peerNames = savedNames;

    try {
      if (wasHost) {
        // Re-claim host id with LAN-only ICE; if taken, join as guest.
        await this.claimOrJoinHost(hostId);
      } else {
        await this.joinAsGuest(hostId, preferred || undefined);
      }
      // Re-dial known peers over host candidates.
      for (const peerId of this.peerNames.keys()) {
        if (!peerId || peerId === this.localId) continue;
        this.scheduleRedial(peerId, true);
      }
      if (!this.isHost) {
        this.scheduleReconnect(hostId, true);
      }
      this.handlers.onStatus(this.statusForMode("Local network discovery active…"));
      this.emitPeers();
    } catch (err) {
      this.handlers.onError(err instanceof Error ? err.message : "Failed to switch to local ICE.");
    } finally {
      this.lanIceFallbackInFlight = false;
    }
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
    const target = this.transportPeerId(peerId);
    if (!target || target === this.localId) throw new Error("Invalid peer.");
    // Snapshot target before await so a UI selection change cannot retarget.
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
      // Local history for the *conversation with target*, not a broadcast.
      peerId: target,
      text: clean,
      ts: msg.ts,
    });
  }

  async sendConfig(peerId: string, fileName: string, content: string) {
    const target = this.transportPeerId(peerId);
    if (!target || target === this.localId) throw new Error("Invalid peer.");
    const name = sanitizeFileName(fileName, "config.json");
    if (!content.trim()) throw new Error("Config content is empty.");
    if (new TextEncoder().encode(content).length > MAX_LAN_FILE_BYTES) {
      throw new Error("Config is too large to send.");
    }
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
    const target = this.transportPeerId(peerId);
    if (!target || target === this.localId) throw new Error("Invalid peer.");
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
          // Keep peers soft-online while signaling reconnects (common on tab switch).
          this.resumePresence("peer-disconnected");
        });

        // Never dial yourself if preferred id somehow collides with host.
        if (id === hostId) {
          finishOk();
          return;
        }

        // Remember the discovery host as a visible peer immediately (show while dialing).
        this.rememberPeer(hostId, "User");
        this.enterSoftOnline(hostId, DIALING_SOFT_ONLINE_MS);
        this.dialPeer(hostId, true);
        // Keep retrying host until the channel opens (host may still be starting).
        this.scheduleReconnect(hostId, true);
        // If STUN is blocked, fall back to host-only ICE so LAN still connects.
        this.armLanIceFallback();
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
      this.resumePresence("peer-disconnected");
    });
  }

  private acceptConnection(conn: DataConnection) {
    const remoteId = sanitizePeerId(conn.peer);
    if (!remoteId || remoteId === this.localId) {
      try {
        conn.close();
      } catch {
        // ignore
      }
      return;
    }
    this.rememberPeer(remoteId, this.peerNames.get(remoteId) || "User");
    this.enterSoftOnline(remoteId, DIALING_SOFT_ONLINE_MS);
    this.wireConnection(conn, remoteId, false);
  }

  /** Open (or re-open) a reliable data connection to peerId. */
  private dialPeer(peerId: string, outgoing: boolean) {
    const target = sanitizePeerId(peerId);
    if (!this.peer || !target || target === this.localId) return;
    const existing = this.connections.get(target);
    if (existing?.open) return;
    // Show in online list while ICE/DataChannel negotiates.
    this.enterSoftOnline(target, DIALING_SOFT_ONLINE_MS);
    // Drop a stuck half-open dial before opening another.
    if (existing && !existing.open) {
      this.clearDialOpenTimer(target);
      try {
        existing.close();
      } catch {
        // ignore
      }
      if (this.connections.get(target) === existing) {
        this.connections.delete(target);
      }
    }
    try {
      // reliable:true uses SCTP ordered mode; serialization json matches wire format.
      const conn = this.peer.connect(target, { reliable: true, serialization: "json" });
      this.wireConnection(conn, target, outgoing);
    } catch {
      // ignore dial failures; scheduleReconnect will retry
      this.armLanIceFallback();
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
      this.clearDialOpenTimer(peerId);
      try {
        existing.close();
      } catch {
        // ignore
      }
    }

    this.connections.set(peerId, conn);
    this.rememberPeer(peerId, this.peerNames.get(peerId) || "User");
    // Watch for STUN/ICE stall before "open".
    if (!conn.open) this.armDialOpenWatchdog(peerId, conn);

    conn.on("open", () => {
      this.clearDialOpenTimer(peerId);
      this.clearLanIceFallbackTimer();
      this.touchPeer(peerId);
      this.clearSoftOnline(peerId);
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
      this.touchPeer(peerId);
      try {
        const msg = (typeof data === "string" ? JSON.parse(data) : data) as WireMessage;
        void this.handleWire(msg, peerId);
      } catch {
        this.handlers.onError("Could not read an incoming message.");
      }
    });

    conn.on("close", () => {
      this.clearDialOpenTimer(peerId);
      if (this.connections.get(peerId) === conn) {
        this.connections.delete(peerId);
      }
      // Drop E2E for this transport — re-handshake on next open.
      this.e2eSessions.delete(peerId);
      // Soft-online grace: stay in the contact list while we redial (tab switch / brief drop).
      this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
      this.scheduleRedial(peerId, true);
      if (this.isHost) this.broadcastPeerList();
      // Guest always re-dials host as well (discovery anchor).
      if (!this.isHost && peerId === roomHostId(this.room)) {
        this.scheduleReconnect(peerId, true);
      }
      this.armLanIceFallback();
    });

    conn.on("error", () => {
      this.clearDialOpenTimer(peerId);
      this.enterSoftOnline(peerId, SOFT_ONLINE_GRACE_MS);
      this.scheduleRedial(peerId, false);
      if (!this.isHost && peerId === roomHostId(this.room)) {
        this.scheduleReconnect(peerId, false);
      }
      this.armLanIceFallback();
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

  /**
   * Conversation peer is always the PeerJS transport id (DataConnection.peer).
   * Never trust a claimed fromId for routing, history, or E2E session keys —
   * otherwise forged ids could file messages under the wrong contact.
   */
  private transportPeerId(raw: string): string | null {
    return sanitizePeerId(raw);
  }

  private async sendSecure(peerId: string, payload: SecurePayload) {
    const target = this.transportPeerId(peerId);
    if (!target) throw new Error("Invalid peer.");
    if (target === this.localId) throw new Error("Cannot send to self.");

    // Never queue/history-blast: only the live draft payload for this target.
    if ("fromId" in payload && payload.fromId !== this.localId) {
      throw new Error("Refusing to send a message with a forged sender id.");
    }

    const conn = this.connectionFor(target);
    // PeerJS connection peer must match the intended recipient.
    const connPeer = this.transportPeerId(conn.peer);
    if (!connPeer || connPeer !== target) {
      throw new Error("Connection peer mismatch; refusing to send.");
    }

    const session = await this.waitForE2e(target);
    if (!session.key) throw new Error("Secure session is not ready yet.");
    // Session map is keyed only by transport id — double-check no aliasing.
    if (this.e2eSessions.get(target) !== session) {
      throw new Error("Secure session is not bound to this peer.");
    }

    const sealed = await encryptPayload(session.key, payload);
    this.send(conn, { v: 1, t: "e2e", iv: sealed.iv, ct: sealed.ct });
  }

  private async handleWire(msg: WireMessage, viaPeerId: string) {
    // Structural guard — drop anything that is not a plain object with a type.
    if (!msg || typeof msg !== "object" || typeof (msg as { t?: unknown }).t !== "string") return;
    const transportId = this.transportPeerId(viaPeerId);
    if (!transportId || transportId === this.localId) return;

    if (msg.t === "ping") {
      this.touchPeer(transportId);
      const conn = this.connections.get(transportId);
      if (conn?.open) {
        try {
          this.send(conn, {
            v: 1,
            t: "pong",
            ts: typeof msg.ts === "number" ? msg.ts : Date.now(),
          });
        } catch {
          // ignore
        }
      }
      return;
    }

    if (msg.t === "pong") {
      this.touchPeer(transportId);
      return;
    }

    if (msg.t === "e2e-hello") {
      if (msg.alg !== E2E_ALG || !isPublicJwk(msg.pub)) return;
      // Claimed fromId must match the transport peer — reject spoofed identities.
      const claimed = sanitizePeerId(msg.fromId);
      if (claimed && claimed !== transportId) return;

      // One session per transport peer id only (no cross-peer aliasing).
      let session = this.e2eSessions.get(transportId);
      if (!session) {
        const localPair = await generateE2eKeyPair();
        session = { localPair, remotePub: null, key: null, ready: false, offered: false, pending: [] };
        this.e2eSessions.set(transportId, session);
      }
      session.remotePub = msg.pub;
      // Offer our public key once (handles the case where the peer dialed first).
      const conn = this.connections.get(transportId);
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
      await this.finalizeE2e(transportId);
      return;
    }

    if (msg.t === "e2e") {
      const session = this.e2eSessions.get(transportId);
      if (!session?.key || typeof msg.iv !== "string" || typeof msg.ct !== "string") return;
      try {
        const inner = (await decryptPayload(session.key, msg.iv, msg.ct)) as SecurePayload;
        if (!inner || typeof inner !== "object" || typeof (inner as { t?: unknown }).t !== "string") return;
        this.handleSecurePayload(inner, transportId);
      } catch {
        this.handlers.onError("Failed to decrypt a message (integrity check failed).");
      }
      return;
    }

    if (msg.t === "hello") {
      // Identity in hello must match the DataChannel peer id.
      const claimed = sanitizePeerId(msg.id);
      if (claimed && claimed !== transportId) return;
      const peerId = transportId;
      const name = sanitizeDisplayName(msg.name, "Peer");
      const wasKnown = this.peerNames.has(peerId);
      this.rememberPeer(peerId, name);
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
    // Conversation binding: always the transport peer that decrypted this envelope.
    const peerId = this.transportPeerId(viaPeerId);
    if (!peerId || peerId === this.localId) return;
    // Optional claimed fromId may only equal this transport peer (never another contact).
    if ("fromId" in msg && msg.fromId != null) {
      const claimed = sanitizePeerId(msg.fromId);
      if (claimed && claimed !== peerId) return;
    }

    if (msg.t === "chat") {
      const text = sanitizeChatText(msg.text);
      if (!text) return;
      this.handlers.onMessage({
        id: typeof msg.id === "string" ? msg.id.slice(0, 80) : uid(),
        kind: "chat",
        from: sanitizeDisplayName(msg.name, "Peer"),
        fromId: peerId,
        peerId,
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
      this.handlers.onMessage({
        id: typeof msg.id === "string" ? msg.id.slice(0, 80) : uid(),
        kind: "config",
        from: sanitizeDisplayName(msg.from, "Peer"),
        fromId: peerId,
        peerId,
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
      const transferId = typeof msg.id === "string" ? msg.id.slice(0, 80) : uid();
      if (this.incoming.size >= 8) return;
      // Namespace transfer ids by peer so concurrent peers cannot collide / hijack.
      const scopedId = `${peerId}:${transferId}`;
      this.incoming.set(scopedId, {
        wireId: transferId,
        name,
        size: msg.size,
        mime: "application/octet-stream",
        parts: new Map(),
        expected: msg.chunks,
        from: sanitizeDisplayName(msg.from, "Peer"),
        fromId: peerId,
      });
      this.handlers.onTransfer({
        id: transferId,
        name,
        direction: "receive",
        received: 0,
        total: msg.size,
        done: false,
        peerId,
      });
      return;
    }

    if (msg.t === "file-chunk") {
      if (typeof msg.id !== "string") return;
      const scopedId = `${peerId}:${msg.id.slice(0, 80)}`;
      const entry = this.incoming.get(scopedId);
      if (!entry || entry.fromId !== peerId) return;
      if (typeof msg.index !== "number" || msg.index < 0 || msg.index >= entry.expected) return;
      if (typeof msg.data !== "string") return;
      if (msg.data.length > CHUNK_CHARS + 64) return;
      if (entry.parts.size >= entry.expected && !entry.parts.has(msg.index)) return;
      entry.parts.set(msg.index, msg.data);
      this.handlers.onTransfer({
        id: entry.wireId,
        name: entry.name,
        direction: "receive",
        received: Math.min(entry.size, Math.floor((entry.parts.size / entry.expected) * entry.size)),
        total: entry.size,
        done: false,
        peerId,
      });
      return;
    }

    if (msg.t === "file-end") {
      if (typeof msg.id !== "string") return;
      const scopedId = `${peerId}:${msg.id.slice(0, 80)}`;
      const entry = this.incoming.get(scopedId);
      if (!entry || entry.fromId !== peerId) return;
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
          id: entry.wireId,
          name: entry.name,
          direction: "receive",
          received: entry.size,
          total: entry.size,
          done: true,
          peerId,
        });
        this.handlers.onMessage({
          id: entry.wireId,
          kind: "file",
          from: entry.from,
          fromId: peerId,
          peerId,
          text: `Received file ${entry.name}`,
          ts: Date.now(),
          fileName: entry.name,
          fileSize: bytes.byteLength,
          fileUrl: url,
        });
      } catch (err) {
        this.handlers.onTransfer({
          id: entry.wireId,
          name: entry.name,
          direction: "receive",
          received: 0,
          total: entry.size,
          done: true,
          error: err instanceof Error ? err.message : "Failed to assemble file.",
          peerId,
        });
      }
      this.incoming.delete(scopedId);
    }
  }

  private ensureMeshConnection(peerId: string) {
    const target = sanitizePeerId(peerId);
    if (!this.peer || !target || target === this.localId) return;
    if (this.connections.get(target)?.open) return;
    // Both sides may dial: LAN discovery is more reliable under NAT/glare than
    // a strict "higher id only" rule (half-open collisions are dropped in wireConnection).
    this.dialPeer(target, true);
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
