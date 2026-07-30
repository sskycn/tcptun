/**
 * Persistent LAN chat identity for this browser profile.
 * Survives reloads and revisits so peers see the same user.
 */

import { sanitizeDisplayName, sanitizePeerId } from "./lan-security";

const STORAGE_KEY = "tcptun-lan-identity-v1";

export type LanIdentity = {
  /** Stable PeerJS id for this browser (guest / personal identity). */
  peerId: string;
  /** Display name shown in chat. */
  displayName: string;
};

function randomToken(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** PeerJS-safe id: alphanumeric, starts with letter, stable across sessions. */
export function createPeerId(): string {
  // PeerJS recommends alphanumeric ids; keep under ~50 chars.
  return `tcptu${randomToken(10)}`;
}

function defaultDisplayName(): string {
  return `User-${Math.floor(100 + Math.random() * 900)}`;
}

export function loadIdentity(): LanIdentity {
  if (typeof window === "undefined") {
    return { peerId: createPeerId(), displayName: defaultDisplayName() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LanIdentity>;
      const peerId = sanitizePeerId(parsed.peerId) || createPeerId();
      // Peer ids from sanitize require A-Za-z0-9._:- — our format matches.
      const displayName = sanitizeDisplayName(parsed.displayName, defaultDisplayName());
      const identity = { peerId, displayName };
      // Re-save if we had to repair fields
      if (parsed.peerId !== peerId || parsed.displayName !== displayName) {
        saveIdentity(identity);
      }
      return identity;
    }
  } catch {
    // fall through
  }
  const identity: LanIdentity = {
    peerId: createPeerId(),
    displayName: defaultDisplayName(),
  };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: LanIdentity): LanIdentity {
  const clean: LanIdentity = {
    peerId: sanitizePeerId(identity.peerId) || createPeerId(),
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

/** If PeerJS rejects a stale id, mint a new stable id and persist it. */
export function rotatePeerId(displayName: string): LanIdentity {
  return saveIdentity({
    peerId: createPeerId(),
    displayName: sanitizeDisplayName(displayName, defaultDisplayName()),
  });
}
