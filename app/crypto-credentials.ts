/** Shared Web Crypto helpers for Reality keys and credentials. */

export async function generateX25519Pair(): Promise<{ privateKey: string; publicKey: string }> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is not available in this environment");
  }

  try {
    const keyPair = (await crypto.subtle.generateKey(
      { name: "X25519" },
      true,
      ["deriveBits"],
    )) as CryptoKeyPair;
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    if (!privateJwk.d || !publicJwk.x) {
      throw new Error("Key export failed");
    }
    return { privateKey: privateJwk.d, publicKey: publicJwk.x };
  } catch {
    throw new Error(
      "This browser does not support X25519. Upgrade the browser or use the CLI: tcptun config …",
    );
  }
}

export function randomUuidV4(): string {
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;
  const hex = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** `byteLength` random bytes as lowercase hex (even length). CLI Reality short IDs use 8 bytes. */
export function randomHex(byteLength: number): string {
  const value = new Uint8Array(byteLength);
  crypto.getRandomValues(value);
  return [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomBase64Url(byteLength: number): string {
  const value = new Uint8Array(byteLength);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
