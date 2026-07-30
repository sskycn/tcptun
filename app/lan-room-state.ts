/** Pure helpers shared by the LAN room state machine and its regression tests. */

/**
 * Pick exactly one dialer for every pair. Without this rule, simultaneous
 * PeerJS offers can make both browsers replace the connection the other side
 * is waiting for (glare), leaving both contacts stuck on "securing".
 */
export function shouldInitiateMesh(localId: string, remoteId: string): boolean {
  return Boolean(localId && remoteId && localId !== remoteId && localId < remoteId);
}

/** Number of base64 characters produced by a byte payload. */
export function base64LengthForBytes(byteLength: number): number {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) return -1;
  return Math.ceil(byteLength / 3) * 4;
}

/** Exact number of wire chunks required for a payload of byteLength. */
export function fileChunkCount(byteLength: number, chunkChars: number): number {
  const chars = base64LengthForBytes(byteLength);
  if (chars < 0 || !Number.isSafeInteger(chunkChars) || chunkChars <= 0) return -1;
  return Math.ceil(chars / chunkChars);
}

/** Exact encoded length expected for an individual chunk. */
export function fileChunkLength(
  byteLength: number,
  chunkChars: number,
  index: number,
): number {
  const total = base64LengthForBytes(byteLength);
  const count = fileChunkCount(byteLength, chunkChars);
  if (total < 0 || count < 0 || !Number.isSafeInteger(index) || index < 0 || index >= count) {
    return -1;
  }
  return Math.min(chunkChars, total - index * chunkChars);
}
