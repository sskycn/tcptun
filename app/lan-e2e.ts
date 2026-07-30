/** Cryptographic primitives for one personal LAN-chat DataChannel. */

export const E2E_ALG = "tcptun-lan-ecdh-p256-hkdf-aesgcm-v2" as const;

const IV_BYTES = 12;
const MAX_CIPHERTEXT_CHARS = 32_768;

function encodeBase64(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let raw = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    raw += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(raw);
}

function decodeBase64(value: string, maxChars: number): Uint8Array {
  if (value.length > maxChars || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error("Invalid encrypted payload.");
  }
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function context(localId: string, remoteId: string): Uint8Array {
  const ids = [localId, remoteId].sort();
  return new TextEncoder().encode(`${E2E_ALG}|${ids[0]}|${ids[1]}`);
}

export function generateE2eKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"],
  );
}

export async function exportPublicJwk(publicKey: CryptoKey): Promise<JsonWebKey> {
  const key = await crypto.subtle.exportKey("jwk", publicKey);
  return { kty: "EC", crv: "P-256", x: key.x, y: key.y, ext: true };
}

export function isPublicJwk(value: unknown): value is JsonWebKey {
  if (!value || typeof value !== "object") return false;
  const key = value as JsonWebKey;
  return (
    key.kty === "EC" &&
    key.crv === "P-256" &&
    typeof key.x === "string" && key.x.length >= 40 && key.x.length <= 48 &&
    typeof key.y === "string" && key.y.length >= 40 && key.y.length <= 48
  );
}

export function importPublicJwk(key: JsonWebKey): Promise<CryptoKey> {
  if (!isPublicJwk(key)) return Promise.reject(new Error("Invalid peer public key."));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: key.x, y: key.y, ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
}

export async function deriveAesKey(
  privateKey: CryptoKey,
  remotePublicKey: CryptoKey,
  localId: string,
  remoteId: string,
): Promise<CryptoKey> {
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: remotePublicKey },
    privateKey,
    256,
  );
  const material = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("tcptun-lan-session-v2") as BufferSource,
      info: context(localId, remoteId) as BufferSource,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPayload(
  key: CryptoKey,
  payload: unknown,
): Promise<{ iv: string; ct: string }> {
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  if (plaintext.byteLength > 24_000) throw new Error("Encrypted payload is too large.");
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { iv: encodeBase64(iv), ct: encodeBase64(ciphertext) };
}

export async function decryptPayload(
  key: CryptoKey,
  ivText: string,
  ciphertextText: string,
): Promise<unknown> {
  const iv = decodeBase64(ivText, 32);
  const ciphertext = decodeBase64(ciphertextText, MAX_CIPHERTEXT_CHARS);
  if (iv.byteLength !== IV_BYTES) throw new Error("Invalid encrypted payload.");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}
