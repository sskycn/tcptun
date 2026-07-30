/**
 * Security helpers for untrusted LAN peer content.
 * Peers are not authenticated — treat all wire payloads as hostile.
 */

/** Hard caps to limit XSS payload size / parser DoS. */
export const MAX_CHAT_TEXT_CHARS = 16_384;
export const MAX_DISPLAY_NAME_CHARS = 40;
export const MAX_FILE_NAME_CHARS = 180;
export const MAX_PEER_ID_CHARS = 96;
export const MAX_MARKDOWN_RENDER_CHARS = 16_384;
export const MAX_URL_CHARS = 2_048;
/** @deprecated Prefer MAX_MESSAGES_PER_CONVERSATION / MAX_MESSAGES_TOTAL in lan-history (100 per chat, 1000 total). */
export const MAX_STORED_MESSAGES = 1000;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const DANGEROUS_SCHEME =
  /^(?:javascript|vbscript|data|blob|file|about|chrome|chrome-extension|moz-extension|ms-browser-extension):/i;

/** Strip control characters and normalize whitespace-heavy abuse. */
export function stripControls(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function clampText(value: string, maxChars: number): string {
  const cleaned = stripControls(value);
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars);
}

/** Display names shown in UI — no newlines / markup-friendly control. */
export function sanitizeDisplayName(raw: unknown, fallback = "Peer"): string {
  if (typeof raw !== "string") return fallback;
  const name = clampText(raw, MAX_DISPLAY_NAME_CHARS)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name || fallback;
}

/**
 * Safe download / display filename.
 * Blocks path traversal, reserved names, and odd separators.
 */
export function sanitizeFileName(raw: unknown, fallback = "file.bin"): string {
  if (typeof raw !== "string") return fallback;
  let name = stripControls(raw)
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.trim() || fallback;
  name = name.replace(/[<>:"|?*\u0000-\u001F]/g, "_");
  name = name.replace(/^\.+/, "");
  if (!name || name === "." || name === "..") name = fallback;
  if (name.length > MAX_FILE_NAME_CHARS) {
    const extMatch = name.match(/(\.[A-Za-z0-9]{1,12})$/);
    const ext = extMatch?.[1] || "";
    name = `${name.slice(0, MAX_FILE_NAME_CHARS - ext.length - 1)}…${ext}`;
  }
  return name;
}

export function sanitizePeerId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = stripControls(raw).trim();
  if (!id || id.length > MAX_PEER_ID_CHARS) return null;
  // PeerJS ids are alphanumeric-ish; reject obvious injection characters.
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) return null;
  return id;
}

export function sanitizeChatText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = clampText(raw, MAX_CHAT_TEXT_CHARS);
  if (!text.trim()) return null;
  return text;
}

export function isFiniteTimestamp(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return Date.now();
  // Reject absurd future/past skew as spam/abuse signal; still display.
  const now = Date.now();
  if (raw < now - 86400_000 * 30 || raw > now + 3_600_000) return now;
  return Math.floor(raw);
}

/**
 * Validate URLs used inside markdown (links / images).
 * Allows only http(s), mailto, tel — no data:, javascript:, blob: remote abuse.
 */
export function safeMarkdownUrl(raw: string | undefined | null, kind: "href" | "src"): string | null {
  if (!raw) return null;
  const trimmed = stripControls(String(raw)).trim();
  if (!trimmed || trimmed.length > MAX_URL_CHARS) return null;
  // Unicode / whitespace scheme smuggling (e.g. "java\nscript:")
  const compact = trimmed.replace(/[\s\u0000-\u001F]+/g, "");
  if (DANGEROUS_SCHEME.test(compact)) return null;
  if (compact.startsWith("//")) return null; // protocol-relative → attacker host

  try {
    if (kind === "href") {
      if (/^(mailto|tel):/i.test(trimmed)) {
        // Basic validation for mail/tel payloads
        if (/[\s<>"']/.test(trimmed.slice(0, 12))) return null;
        return trimmed;
      }
      // Relative paths in peer chat are useless and risky — require absolute http(s)
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (url.username || url.password) return null;
      return url.toString();
    }

    // Images: https only (block http mixed content + tracking over plain HTTP)
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Only allow blob: object URLs we create for downloads (never peer-supplied). */
export function isSafeObjectUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return /^blob:https?:\/\//i.test(url) || /^blob:[a-z0-9.-]+/i.test(url);
}

/** Reduce markdown to plain text for previews (no HTML interpretation). */
export function plainTextPreview(source: string, maxLen = 48): string {
  const plain = clampText(source || "", MAX_CHAT_TEXT_CHARS)
    .replace(/```[\s\S]*?```/g, " [code] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "[image]")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/[*_~|<>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "No messages yet";
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, Math.max(1, maxLen - 1))}…`;
}

/** Initials for avatar badge — never inject HTML. */
export function avatarInitials(name: string): string {
  const clean = sanitizeDisplayName(name, "?");
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase().slice(0, 2);
  }
  return clean.slice(0, 2).toUpperCase() || "?";
}

/** Soft rate: reject empty / oversized chat before send. */
export function assertSendableChat(text: string): string {
  const clean = sanitizeChatText(text);
  if (!clean) throw new Error("Message is empty or invalid.");
  if (clean.length > MAX_CHAT_TEXT_CHARS) {
    throw new Error(`Message exceeds ${MAX_CHAT_TEXT_CHARS} characters.`);
  }
  return clean;
}
