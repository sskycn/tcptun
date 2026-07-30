/**
 * User-configurable STUN / TURN for WebRTC.
 *
 * Default (empty) = LAN mode: only host ICE candidates → same local network.
 * With STUN/TURN: LAN host candidates are ALWAYS still gathered (iceTransportPolicy=all),
 * so local discovery/connect keeps working; STUN/TURN only extend cross-network reach.
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

/** Default: no STUN/TURN — pure LAN host candidates. */
export const EMPTY_ICE_CONFIG: LanIceConfig = {
  stunUrls: [],
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
  const servers: IceServerEntry[] = [];

  for (const url of config.stunUrls) {
    const clean = normalizeUrl(url);
    if (!clean || !/^(stun|stuns):/i.test(clean)) continue;
    servers.push({ urls: clean });
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
  if (typeof window === "undefined") return { ...EMPTY_ICE_CONFIG };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_ICE_CONFIG };
    const parsed = JSON.parse(raw) as Partial<LanIceConfig>;
    return sanitizeIceConfig(parsed);
  } catch {
    return { ...EMPTY_ICE_CONFIG };
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

export function clearIceConfig(): LanIceConfig {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return { ...EMPTY_ICE_CONFIG };
}

/**
 * PeerJS / RTCPeerConnection config.
 * Always iceTransportPolicy "all" so host (LAN) candidates are never disabled
 * when the user adds STUN/TURN for wider reach.
 */
export function peerRtcConfig(config: LanIceConfig): RTCConfiguration {
  const iceServers = buildIceServers(config) as RTCIceServer[];
  return {
    iceServers,
    // Never "relay" — that would kill pure LAN paths when TURN is present.
    iceTransportPolicy: "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceCandidatePoolSize: 4,
  };
}
