/**
 * User-configurable STUN / TURN for WebRTC.
 *
 * Default: public Google STUN servers so ICE works on typical NATs.
 * Unreachable STUNs are probed out before PeerJS connect (see filterReachableStunUrls).
 * Host (LAN) candidates are always gathered (iceTransportPolicy=all).
 * Empty STUN/TURN = pure LAN host candidates only.
 */

export type IceServerEntry = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type LanIceConfig = {
  /** One STUN/STUNS URL per line in the UI; stored as list. */
  stunUrls: string[];
  /** One TURN/TURNS URL per line. */
  turnUrls: string[];
  turnUsername: string;
  turnCredential: string;
};

export type LanIceMode = "lan-only" | "stun" | "turn" | "stun-turn";

const STORAGE_KEY = "tcptun-lan-ice-v1";
const MAX_URLS = 12;
const MAX_URL_LEN = 256;
const MAX_CRED_LEN = 256;

/**
 * Built-in default STUN list for chat discovery.
 * Cloudflare dropped: IPv4 binding often times out from many networks.
 * Runtime probe still drops any URL that does not return srflx in time.
 */
export const DEFAULT_STUN_URLS: string[] = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
];

/** No STUN/TURN — pure LAN host candidates (explicit local-only mode). */
export const EMPTY_ICE_CONFIG: LanIceConfig = {
  stunUrls: [],
  turnUrls: [],
  turnUsername: "",
  turnCredential: "",
};

/** Default chat ICE config (public STUN, no TURN). */
export const DEFAULT_ICE_CONFIG: LanIceConfig = {
  stunUrls: [...DEFAULT_STUN_URLS],
  turnUrls: [],
  turnUsername: "",
  turnCredential: "",
};

const ICE_URL_RE = /^(stun|stuns|turn|turns):[^\s]+$/i;

export function iceMode(config: LanIceConfig): LanIceMode {
  const hasStun = config.stunUrls.length > 0;
  const hasTurn = config.turnUrls.length > 0;
  if (hasStun && hasTurn) return "stun-turn";
  if (hasTurn) return "turn";
  if (hasStun) return "stun";
  return "lan-only";
}

export function iceModeLabel(mode: LanIceMode): string {
  switch (mode) {
    case "lan-only":
      return "Local network";
    case "stun":
      return "Local + STUN";
    case "turn":
      return "Local + TURN";
    case "stun-turn":
      return "Local + STUN/TURN";
  }
}

export function iceModeHint(mode: LanIceMode): string {
  switch (mode) {
    case "lan-only":
      return "Using the local network only.";
    case "stun":
      return "Local network plus STUN for wider reach.";
    case "turn":
      return "Local network plus TURN relay when direct paths fail.";
    case "stun-turn":
      return "Local network plus STUN and TURN.";
  }
}

function normalizeUrl(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, "");
  if (!value || value.length > MAX_URL_LEN) return null;
  if (!ICE_URL_RE.test(value)) return null;
  // Block credentials embedded in URL userinfo for safety (use dedicated fields).
  try {
    // stun:host:port is not a standard WHATWG URL; light parse
    const scheme = value.split(":")[0]!.toLowerCase();
    if (!["stun", "stuns", "turn", "turns"].includes(scheme)) return null;
    if (value.includes("@")) return null;
    return value;
  } catch {
    return null;
  }
}

export function parseUrlLines(text: string, kind: "stun" | "turn"): string[] {
  const allowed = kind === "stun" ? /^(stun|stuns):/i : /^(turn|turns):/i;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const url = normalizeUrl(line);
    if (!url) continue;
    if (!allowed.test(url)) continue;
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
    if (out.length >= MAX_URLS) break;
  }
  return out;
}

export function urlsToText(urls: string[]): string {
  return urls.join("\n");
}

/** Build RTCConfiguration.iceServers from user config. Empty = LAN-only. */
export function buildIceServers(config: LanIceConfig): IceServerEntry[] {
  const stunUrls: string[] = [];
  for (const url of config.stunUrls) {
    const clean = normalizeUrl(url);
    if (!clean || !/^(stun|stuns):/i.test(clean)) continue;
    if (!stunUrls.includes(clean)) stunUrls.push(clean);
  }

  const servers: IceServerEntry[] = [];
  // One STUN entry with multiple URLs — browsers try them without serializing
  // many iceServers (faster, and host candidates are still gathered first).
  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls.length === 1 ? stunUrls[0]! : stunUrls });
  }

  const user = config.turnUsername.trim().slice(0, MAX_CRED_LEN);
  const cred = config.turnCredential.slice(0, MAX_CRED_LEN);
  for (const url of config.turnUrls) {
    const clean = normalizeUrl(url);
    if (!clean || !/^(turn|turns):/i.test(clean)) continue;
    if (!user || !cred) continue; // TURN without auth is almost never useful; skip unsafe open relays
    servers.push({
      urls: clean,
      username: user,
      credential: cred,
    });
  }

  return servers;
}

/** True when config relies on public STUN/TURN (not pure host/LAN). */
export function hasRemoteIce(config: LanIceConfig): boolean {
  return config.stunUrls.length > 0 || config.turnUrls.length > 0;
}

export function sanitizeIceConfig(input: Partial<LanIceConfig> | null | undefined): LanIceConfig {
  const stunUrls = Array.isArray(input?.stunUrls)
    ? parseUrlLines(input!.stunUrls.join("\n"), "stun")
    : [];
  const turnUrls = Array.isArray(input?.turnUrls)
    ? parseUrlLines(input!.turnUrls.join("\n"), "turn")
    : [];
  return {
    stunUrls,
    turnUrls,
    turnUsername: String(input?.turnUsername || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .slice(0, MAX_CRED_LEN),
    turnCredential: String(input?.turnCredential || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .slice(0, MAX_CRED_LEN),
  };
}

export function loadIceConfig(): LanIceConfig {
  if (typeof window === "undefined") {
    return { ...DEFAULT_ICE_CONFIG, stunUrls: [...DEFAULT_STUN_URLS] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // First visit: ship with the public STUN defaults.
    if (!raw) {
      return { ...DEFAULT_ICE_CONFIG, stunUrls: [...DEFAULT_STUN_URLS] };
    }
    const parsed = JSON.parse(raw) as Partial<LanIceConfig>;
    return sanitizeIceConfig(parsed);
  } catch {
    return { ...DEFAULT_ICE_CONFIG, stunUrls: [...DEFAULT_STUN_URLS] };
  }
}

export function saveIceConfig(config: LanIceConfig): LanIceConfig {
  const clean = sanitizeIceConfig(config);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // quota / private mode — still return cleaned config for this session
    }
  }
  return clean;
}

/** Persist empty STUN/TURN so "local only" is not overwritten by defaults on reload. */
export function clearIceConfig(): LanIceConfig {
  return saveIceConfig({ ...EMPTY_ICE_CONFIG });
}

/**
 * PeerJS / RTCPeerConnection config from user (or default) STUN/TURN.
 *
 * - iceTransportPolicy "all": host (LAN) candidates always gathered alongside STUN/TURN.
 * - iceCandidatePoolSize 0: do NOT pre-gather STUN before connect. Pre-warming
 *   (pool>0) can stall for tens of seconds when public STUN is blocked/firewalled,
 *   which delays or breaks same-LAN discovery even though host candidates work.
 * - Empty iceServers = pure local host candidates (LAN-only / STUN fallback mode).
 */
export function peerRtcConfig(config: LanIceConfig): RTCConfiguration {
  const iceServers = buildIceServers(config) as RTCIceServer[];
  return {
    iceServers,
    // Never "relay" — that would kill pure LAN paths when TURN is present.
    iceTransportPolicy: "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceCandidatePoolSize: 0,
  };
}

/** Pure host-candidate RTC config — used when public STUN/TURN is unreachable. */
export function peerRtcConfigLanOnly(): RTCConfiguration {
  return peerRtcConfig(EMPTY_ICE_CONFIG);
}

const STUN_PROBE_TIMEOUT_MS = 2_800;

/**
 * Probe a single STUN URL via a short-lived RTCPeerConnection.
 * Success = we observe a server-reflexive (srflx) ICE candidate.
 */
export function probeStunUrl(url: string, timeoutMs = STUN_PROBE_TIMEOUT_MS): Promise<boolean> {
  const clean = normalizeUrl(url);
  if (!clean || !/^(stun|stuns):/i.test(clean)) return Promise.resolve(false);
  if (typeof RTCPeerConnection === "undefined") return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    let pc: RTCPeerConnection | null = null;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        pc?.close();
      } catch {
        // ignore
      }
      pc = null;
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: clean }],
        iceCandidatePoolSize: 0,
        iceTransportPolicy: "all",
      });
    } catch {
      finish(false);
      return;
    }

    pc.onicecandidate = (event) => {
      const cand = event.candidate;
      if (!cand) return;
      // STUN worked if we got a server-reflexive address.
      if (cand.type === "srflx") {
        finish(true);
        return;
      }
      // Some browsers only put type in the candidate string.
      const line = cand.candidate || "";
      if (/\btyp\s+srflx\b/i.test(line)) finish(true);
    };

    pc.onicegatheringstatechange = () => {
      if (pc?.iceGatheringState === "complete") {
        // Gathering finished without srflx → this STUN is unreachable here.
        finish(false);
      }
    };

    try {
      pc.createDataChannel("stun-probe");
      void pc
        .createOffer()
        .then((offer) => pc?.setLocalDescription(offer))
        .catch(() => finish(false));
    } catch {
      finish(false);
    }
  });
}

/**
 * Keep only STUN URLs that answer with a srflx candidate within timeout.
 * Failed servers are excluded so PeerJS does not stall on dead STUN.
 * If every URL fails, returns [] (LAN host candidates only).
 */
export async function filterReachableStunUrls(
  urls: string[],
  timeoutMs = STUN_PROBE_TIMEOUT_MS,
): Promise<{ reachable: string[]; failed: string[] }> {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const clean = normalizeUrl(raw);
    if (!clean || !/^(stun|stuns):/i.test(clean)) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }

  if (unique.length === 0) return { reachable: [], failed: [] };

  const flags = await Promise.all(unique.map((url) => probeStunUrl(url, timeoutMs)));
  const reachable: string[] = [];
  const failed: string[] = [];
  for (let i = 0; i < unique.length; i++) {
    if (flags[i]) reachable.push(unique[i]!);
    else failed.push(unique[i]!);
  }
  return { reachable, failed };
}

/** Drop unreachable STUN from a full ICE config (TURN left unchanged). */
export async function sanitizeIceConfigWithLiveStun(
  config: LanIceConfig,
  timeoutMs = STUN_PROBE_TIMEOUT_MS,
): Promise<{ config: LanIceConfig; failedStun: string[] }> {
  const base = sanitizeIceConfig(config);
  if (base.stunUrls.length === 0) {
    return { config: base, failedStun: [] };
  }
  const { reachable, failed } = await filterReachableStunUrls(base.stunUrls, timeoutMs);
  return {
    config: { ...base, stunUrls: reachable },
    failedStun: failed,
  };
}
