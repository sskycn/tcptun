/**
 * Persist LAN chat history in this browser so reloads restore conversations.
 * Stores text chat + file/config *metadata* (name, size, time). Never stores
 * file bytes, config body, or blob URLs.
 */

import type { ChatMessage } from "./lan-room";
import {
  clampText,
  sanitizeChatText,
  sanitizeDisplayName,
  sanitizeFileName,
  sanitizePeerId,
} from "./lan-security";

const STORAGE_KEY = "tcptun-lan-history-v1";
/** Hard cap: keep at most this many messages per conversation (peer). */
export const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_CONTACT_NAMES = 100;
/** Hard cap: keep at most this many messages across all conversations. */
export const MAX_MESSAGES_TOTAL = 1000;

function safeTs(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return Date.now();
  // Keep long-lived history; only reject absurd future skew.
  const now = Date.now();
  if (raw > now + 3_600_000) return now;
  if (raw < 0) return now;
  return Math.floor(raw);
}

export type StoredContact = {
  id: string;
  name: string;
  lastTs: number;
};

type HistoryPayload = {
  v: 1;
  ownerPeerId: string;
  messages: ChatMessage[];
  contacts: StoredContact[];
  updatedAt: number;
};

function isPersistableKind(value: unknown): value is "chat" | "config" | "file" {
  return value === "chat" || value === "config" || value === "file";
}

/** Drop session-only / non-serializable fields before disk write. */
export function serializeMessage(message: ChatMessage): ChatMessage | null {
  // System presence noise is not useful after reload.
  if (!isPersistableKind(message.kind)) return null;

  // Every stored row must belong to exactly one conversation peer.
  // Without peerId, a message could surface under the wrong contact after reload.
  const peerId = sanitizePeerId(message.peerId);
  if (!peerId) return null;
  const fromId = sanitizePeerId(message.fromId) || undefined;

  if (message.kind === "chat") {
    const text = sanitizeChatText(message.text);
    if (!text) return null;
    return {
      id: clampText(String(message.id || ""), 80) || `msg-${message.ts}`,
      kind: "chat",
      from: sanitizeDisplayName(message.from, "Peer"),
      fromId,
      peerId,
      text,
      ts: safeTs(message.ts),
    };
  }

  // File / config: keep name, size, time, short label — never payload or blob URL.
  const fileName = message.fileName
    ? sanitizeFileName(message.fileName)
    : undefined;
  const fileSize =
    typeof message.fileSize === "number" && Number.isFinite(message.fileSize) && message.fileSize >= 0
      ? Math.min(Math.floor(message.fileSize), 40 * 1024 * 1024)
      : undefined;

  // Keep the short "Sent/Received file …" label; never treat body as content store.
  const rawText = clampText(String(message.text || "").replace(/\s+/g, " ").trim(), 300);
  const text =
    rawText ||
    (fileName
      ? message.kind === "config"
        ? `Config ${fileName}`
        : `File ${fileName}`
      : message.kind === "config"
        ? "Config"
        : "File");

  return {
    id: clampText(String(message.id || ""), 80) || `msg-${message.ts}`,
    kind: message.kind,
    from: sanitizeDisplayName(message.from, "Peer"),
    fromId,
    peerId,
    text,
    ts: safeTs(message.ts),
    ...(fileName ? { fileName } : {}),
    ...(fileSize != null ? { fileSize } : {}),
    // fileUrl intentionally omitted — blob: dies with the session and must not hold content.
  };
}

function sanitizeStoredMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<ChatMessage>;
  if (m.kind === "system") return null;
  return serializeMessage({
    id: String(m.id || ""),
    kind: (m.kind as ChatMessage["kind"]) || "chat",
    from: String(m.from || "Peer"),
    fromId: m.fromId,
    peerId: m.peerId,
    text: String(m.text || ""),
    ts: typeof m.ts === "number" ? m.ts : Date.now(),
    fileName: m.fileName,
    fileSize: m.fileSize,
    // Never rehydrate fileUrl from storage even if an old payload had one.
  });
}

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  // Cap each conversation first, then apply a global ceiling.
  const sorted = [...messages].sort((a, b) => a.ts - b.ts);
  const perPeer = new Map<string, ChatMessage[]>();
  for (const msg of sorted) {
    const key = msg.peerId || "_";
    const list = perPeer.get(key) || [];
    list.push(msg);
    perPeer.set(key, list);
  }

  const out: ChatMessage[] = [];
  for (const list of perPeer.values()) {
    out.push(
      ...(list.length > MAX_MESSAGES_PER_CONVERSATION
        ? list.slice(-MAX_MESSAGES_PER_CONVERSATION)
        : list),
    );
  }
  out.sort((a, b) => a.ts - b.ts);
  if (out.length > MAX_MESSAGES_TOTAL) {
    return out.slice(-MAX_MESSAGES_TOTAL);
  }
  return out;
}

/** Append one message and enforce the per-conversation limit (newest kept). */
export function appendMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (message.id && messages.some((m) => m.id === message.id)) return messages;
  return trimMessages([...messages, message]);
}

function contactsFromMessages(messages: ChatMessage[]): StoredContact[] {
  const map = new Map<string, StoredContact>();
  for (const msg of messages) {
    if (!msg.peerId) continue;
    const prev = map.get(msg.peerId);
    // Message is from remote when fromId matches conversation peerId.
    const name =
      msg.fromId && msg.fromId === msg.peerId
        ? sanitizeDisplayName(msg.from, prev?.name || "Peer")
        : prev?.name || "Peer";
    map.set(msg.peerId, {
      id: msg.peerId,
      name,
      lastTs: Math.max(prev?.lastTs || 0, msg.ts),
    });
  }
  return Array.from(map.values())
    .sort((a, b) => b.lastTs - a.lastTs)
    .slice(0, MAX_CONTACT_NAMES);
}

export function loadHistory(ownerPeerId?: string): {
  messages: ChatMessage[];
  contacts: StoredContact[];
} {
  if (typeof window === "undefined") return { messages: [], contacts: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], contacts: [] };
    const parsed = JSON.parse(raw) as Partial<HistoryPayload>;
    // If owner rotated, still show history (local device transcript).
    void ownerPeerId;
    const messages = trimMessages(
      (Array.isArray(parsed.messages) ? parsed.messages : [])
        .map(sanitizeStoredMessage)
        .filter((m): m is ChatMessage => Boolean(m)),
    );
    const contactsRaw = Array.isArray(parsed.contacts) ? parsed.contacts : contactsFromMessages(messages);
    const contacts: StoredContact[] = [];
    const seen = new Set<string>();
    for (const c of contactsRaw) {
      const id = sanitizePeerId(c?.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      contacts.push({
        id,
        name: sanitizeDisplayName(c?.name, "Peer"),
        lastTs: safeTs(c?.lastTs),
      });
    }
    // Merge names derived from messages
    for (const derived of contactsFromMessages(messages)) {
      if (!seen.has(derived.id)) {
        seen.add(derived.id);
        contacts.push(derived);
      } else {
        const idx = contacts.findIndex((x) => x.id === derived.id);
        if (idx >= 0 && derived.lastTs >= contacts[idx]!.lastTs) {
          contacts[idx] = {
            ...contacts[idx]!,
            lastTs: derived.lastTs,
            name: contacts[idx]!.name === "Peer" ? derived.name : contacts[idx]!.name,
          };
        }
      }
    }
    contacts.sort((a, b) => b.lastTs - a.lastTs);
    return { messages, contacts: contacts.slice(0, MAX_CONTACT_NAMES) };
  } catch {
    return { messages: [], contacts: [] };
  }
}

export function saveHistory(
  messages: ChatMessage[],
  ownerPeerId: string,
  contactHints?: StoredContact[],
): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = trimMessages(
      messages.map(serializeMessage).filter((m): m is ChatMessage => Boolean(m)),
    );
    const fromMessages = contactsFromMessages(cleaned);
    const byId = new Map<string, StoredContact>();
    for (const c of fromMessages) byId.set(c.id, c);
    if (contactHints) {
      for (const hint of contactHints) {
        const id = sanitizePeerId(hint.id);
        if (!id) continue;
        const prev = byId.get(id);
        byId.set(id, {
          id,
          name: sanitizeDisplayName(hint.name, prev?.name || "Peer"),
          lastTs: Math.max(prev?.lastTs || 0, safeTs(hint.lastTs)),
        });
      }
    }
    const payload: HistoryPayload = {
      v: 1,
      ownerPeerId: sanitizePeerId(ownerPeerId) || "",
      messages: cleaned,
      contacts: Array.from(byId.values())
        .sort((a, b) => b.lastTs - a.lastTs)
        .slice(0, MAX_CONTACT_NAMES),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — drop oldest half and retry once
    try {
      const half = messages.slice(Math.floor(messages.length / 2));
      const cleaned = trimMessages(
        half.map(serializeMessage).filter((m): m is ChatMessage => Boolean(m)),
      );
      const payload: HistoryPayload = {
        v: 1,
        ownerPeerId: sanitizePeerId(ownerPeerId) || "",
        messages: cleaned,
        contacts: contactsFromMessages(cleaned),
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // give up
    }
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Merge a live peer name into contact directory for history labels. */
export function upsertContact(
  contacts: StoredContact[],
  id: string,
  name: string,
  ts = Date.now(),
): StoredContact[] {
  const peerId = sanitizePeerId(id);
  if (!peerId) return contacts;
  const next = contacts.filter((c) => c.id !== peerId);
  next.push({
    id: peerId,
    name: sanitizeDisplayName(name, "Peer"),
    lastTs: safeTs(ts),
  });
  next.sort((a, b) => b.lastTs - a.lastTs);
  return next.slice(0, MAX_CONTACT_NAMES);
}
