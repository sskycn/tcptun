/**
 * Persistent LAN chat identity for this browser profile.
 * Each user has a globally unique key (UUID-based) used as PeerJS id when
 * chatting, so contacts/history stay bound to that person across reloads.
 */

import { sanitizeDisplayName, sanitizePeerId } from "./lan-security";

const STORAGE_KEY = "tcptun-lan-identity-v1";

export type LanIdentity = {
  /**
   * Globally unique user key — also the PeerJS id for this browser's chat mesh.
   * Format: `tcptu` + 32 hex chars (UUID without dashes) ≈ 122 bits of entropy.
   */
  peerId: string;
  /** Display name shown in chat. */
  displayName: string;
};

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Globally unique, PeerJS-safe user key.
 * Prefers `crypto.randomUUID()` (RFC 4122); falls back to 16 CSPRNG bytes.
 */
export function createUserKey(): string {
  let hex: string;
  if (typeof globalThis.crypto?.randomUUID === "function") {
    hex = globalThis.crypto.randomUUID().replace(/-/g, "");
  } else {
    hex = randomHex(16);
  }
  // PeerJS: alphanumeric, starts with a letter, keep under ~50 chars.
  return `tcptu${hex}`;
}

/** @deprecated Use createUserKey — same generator. */
export function createPeerId(): string {
  return createUserKey();
}

/** True if id looks like our UUID-backed user key (not a short legacy token / room host id). */
export function isStrongUserKey(id: string): boolean {
  return /^tcptu[a-f0-9]{32}$/i.test(id);
}

function defaultDisplayName(): string {
  return `User-${Math.floor(100 + Math.random() * 900)}`;
}

/**
 * Prefer a strong UUID key; keep any valid existing personal id so history
 * stays linked. Never treat room host ids (`tcptun…`) as a user key.
 */
function ensureUserKey(raw: unknown): string {
  const existing = sanitizePeerId(raw);
  if (existing && isStrongUserKey(existing)) return existing;
  // Legacy personal ids (`tcptu` + random) — keep if long enough.
  if (existing && existing.length >= 16 && !/^tcptun/i.test(existing)) {
    return existing;
  }
  return createUserKey();
}

export function loadIdentity(): LanIdentity {
  if (typeof window === "undefined") {
    return { peerId: createUserKey(), displayName: defaultDisplayName() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LanIdentity>;
      const peerId = ensureUserKey(parsed.peerId);
      const displayName = sanitizeDisplayName(parsed.displayName, defaultDisplayName());
      const identity = { peerId, displayName };
      if (parsed.peerId !== peerId || parsed.displayName !== displayName) {
        saveIdentity(identity);
      }
      return identity;
    }
  } catch {
    // fall through
  }
  const identity: LanIdentity = {
    peerId: createUserKey(),
    displayName: defaultDisplayName(),
  };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: LanIdentity): LanIdentity {
  const clean: LanIdentity = {
    peerId: sanitizePeerId(identity.peerId) || createUserKey(),
    displayName: sanitizeDisplayName(identity.displayName, defaultDisplayName()),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // private mode / quota
    }
  }
  return clean;
}

export function saveDisplayName(displayName: string, currentPeerId: string): LanIdentity {
  return saveIdentity({
    peerId: currentPeerId,
    displayName: sanitizeDisplayName(displayName, defaultDisplayName()),
  });
}

/** If PeerJS rejects a stale id, mint a new globally unique key and persist it. */
export function rotatePeerId(displayName: string): LanIdentity {
  return saveIdentity({
    peerId: createUserKey(),
    displayName: sanitizeDisplayName(displayName, defaultDisplayName()),
  });
}

/** Short label for UI (first 8 hex of the UUID body). */
export function shortUserKey(userKey: string): string {
  const clean = sanitizePeerId(userKey) || userKey;
  const body = clean.replace(/^tcptu/i, "");
  return body.slice(0, 8) || clean.slice(0, 8);
}
