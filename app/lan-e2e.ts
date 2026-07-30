/**
 * End-to-end encryption for LAN chat (browser Web Crypto).
 *
 * Per-connection: ECDH P-256 → HKDF-SHA-256 → AES-256-GCM.
 * Keys never leave the two peers; signaling/host only sees ciphertext envelopes.
 */

export const E2E_ALG = "ECDH-P256-AES-GCM-v1" as const;

function b64Encode(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < view.length; i += step) {
    bin += String.fromCharCode(...view.subarray(i, i + step));
  }
  return btoa(bin);
}

function b64Decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function generateE2eKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"],
  );
}

export async function exportPublicJwk(publicKey: CryptoKey): Promise<JsonWebKey> {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  // Strip private material if any; keep only public fields.
  return {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
    ext: true,
  };
}

export async function importPublicJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) {
    throw new Error("Invalid peer key.");
  }
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
}

/** Stable HKDF info so both peers derive the same AES key regardless of dial direction. */
export function sessionInfo(localId: string, remoteId: string): string {
  const a = localId < remoteId ? localId : remoteId;
  const b = localId < remoteId ? remoteId : localId;
  return `${E2E_ALG}|${a}|${b}`;
}

export async function deriveAesKey(
  localPrivate: CryptoKey,
  remotePublic: CryptoKey,
  localId: string,
  remoteId: string,
): Promise<CryptoKey> {
  const bits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: remotePublic },
    localPrivate,
    256,
  );
  const baseKey = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  const info = new TextEncoder().encode(sessionInfo(localId, remoteId));
  const salt = new TextEncoder().encode("tcptun-lan-e2e-salt-v1");
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPayload(
  key: CryptoKey,
  plaintext: unknown,
): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(plaintext));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: b64Encode(iv), ct: b64Encode(ct) };
}

export async function decryptPayload(key: CryptoKey, ivB64: string, ctB64: string): Promise<unknown> {
  const iv = b64Decode(ivB64);
  const ct = b64Decode(ctB64);
  if (iv.length !== 12) throw new Error("Invalid ciphertext.");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
  return JSON.parse(new TextDecoder().decode(plain));
}

export function isPublicJwk(value: unknown): value is JsonWebKey {
  if (!value || typeof value !== "object") return false;
  const j = value as JsonWebKey;
  return j.kty === "EC" && j.crv === "P-256" && typeof j.x === "string" && typeof j.y === "string";
}
