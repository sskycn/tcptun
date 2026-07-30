"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendMessage,
  clearHistory,
  loadHistory,
  saveHistory,
  upsertContact,
  type StoredContact,
} from "./lan-history";
import {
  EMPTY_ICE_CONFIG,
  clearIceConfig,
  iceMode,
  iceModeHint,
  iceModeLabel,
  loadIceConfig,
  parseUrlLines,
  saveIceConfig,
  urlsToText,
  type LanIceConfig,
} from "./lan-ice";
import { loadIdentity, saveDisplayName, saveIdentity } from "./lan-identity";
import LanMarkdown, { markdownPreview } from "./lan-markdown";
import {
  LanRoom,
  MAX_CHAT_TEXT_CHARS,
  MAX_LAN_FILE_BYTES,
  type ChatMessage,
  type RoomPeer,
  type TransferProgress,
} from "./lan-room";
import {
  avatarInitials,
  isSafeObjectUrl,
  sanitizeDisplayName,
  sanitizeFileName,
} from "./lan-security";

const DISCOVERY_CHANNEL = "tcptun-direct-users-v1";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return formatClock(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type ContactRow = {
  id: string;
  name: string;
  connected: boolean;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastTs: number;
};

export default function LanShare() {
  const [localName, setLocalName] = useState("User");
  const [stablePeerId, setStablePeerId] = useState("");
  const [joined, setJoined] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [selectedPeerId, setSelectedPeerId] = useState("");
  const [status, setStatus] = useState("Restoring session…");
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyContacts, setHistoryContacts] = useState<StoredContact[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [configName, setConfigName] = useState("client.json");
  const [configBody, setConfigBody] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [showIce, setShowIce] = useState(false);
  const [discoveryKey, setDiscoveryKey] = useState(0);
  const [iceConfig, setIceConfig] = useState<LanIceConfig>(EMPTY_ICE_CONFIG);
  const [stunText, setStunText] = useState("");
  const [turnText, setTurnText] = useState("");
  const [turnUser, setTurnUser] = useState("");
  const [turnCred, setTurnCred] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const roomRef = useRef<LanRoom | null>(null);
  const selectedPeerRef = useRef("");
  const localNameRef = useRef(localName);
  const stablePeerIdRef = useRef(stablePeerId);
  const iceConfigRef = useRef(iceConfig);
  const historyContactsRef = useRef(historyContacts);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composeRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const mode = iceMode(iceConfig);
  const selfId = peerId || stablePeerId;

  const contacts: ContactRow[] = useMemo(() => {
    const online = peers.filter((peer) => !peer.self && peer.connected);
    const byId = new Map<string, ContactRow>();

    for (const peer of online) {
      const peerMessages = messages.filter((m) => m.peerId === peer.id && m.kind !== "system");
      const lastMessage = peerMessages[peerMessages.length - 1];
      byId.set(peer.id, {
        id: peer.id,
        name: peer.name,
        connected: true,
        lastMessage,
        unreadCount: unread[peer.id] || 0,
        lastTs: lastMessage?.ts || Date.now(),
      });
    }

    // Include offline contacts that still have history.
    for (const stored of historyContacts) {
      if (byId.has(stored.id)) {
        const cur = byId.get(stored.id)!;
        if (cur.name === "Peer" || !cur.name) cur.name = stored.name;
        continue;
      }
      const peerMessages = messages.filter((m) => m.peerId === stored.id && m.kind !== "system");
      if (peerMessages.length === 0) continue;
      const lastMessage = peerMessages[peerMessages.length - 1];
      byId.set(stored.id, {
        id: stored.id,
        name: stored.name,
        connected: false,
        lastMessage,
        unreadCount: unread[stored.id] || 0,
        lastTs: lastMessage?.ts || stored.lastTs,
      });
    }

    // Any message peer not yet listed
    for (const msg of messages) {
      if (!msg.peerId || byId.has(msg.peerId) || msg.kind === "system") continue;
      const peerMessages = messages.filter((m) => m.peerId === msg.peerId && m.kind !== "system");
      const lastMessage = peerMessages[peerMessages.length - 1];
      const name =
        lastMessage && lastMessage.fromId === msg.peerId
          ? lastMessage.from
          : historyContacts.find((c) => c.id === msg.peerId)?.name || "Peer";
      byId.set(msg.peerId, {
        id: msg.peerId,
        name,
        connected: false,
        lastMessage,
        unreadCount: unread[msg.peerId] || 0,
        lastTs: lastMessage?.ts || msg.ts,
      });
    }

    return Array.from(byId.values()).sort((a, b) => {
      if (a.connected !== b.connected) return a.connected ? -1 : 1;
      return b.lastTs - a.lastTs;
    });
  }, [peers, messages, unread, historyContacts]);

  const selectedPeer = contacts.find((peer) => peer.id === selectedPeerId);
  const conversation = useMemo(
    () => messages.filter((message) => message.peerId === selectedPeerId),
    [messages, selectedPeerId],
  );
  const transferList = useMemo(
    () => transfers.filter((item) => item.peerId === selectedPeerId),
    [transfers, selectedPeerId],
  );
  const canSend = Boolean(selectedPeer?.connected && joined);

  useEffect(() => {
    selectedPeerRef.current = selectedPeerId;
  }, [selectedPeerId]);

  useEffect(() => {
    localNameRef.current = localName;
  }, [localName]);

  useEffect(() => {
    stablePeerIdRef.current = stablePeerId;
  }, [stablePeerId]);

  useEffect(() => {
    iceConfigRef.current = iceConfig;
  }, [iceConfig]);

  useEffect(() => {
    historyContactsRef.current = historyContacts;
  }, [historyContacts]);

  // Restore identity, history, ICE once on the client.
  useEffect(() => {
    const identity = loadIdentity();
    setLocalName(identity.displayName);
    setStablePeerId(identity.peerId);
    localNameRef.current = identity.displayName;
    stablePeerIdRef.current = identity.peerId;

    const history = loadHistory(identity.peerId);
    setMessages(history.messages);
    setHistoryContacts(history.contacts);
    historyContactsRef.current = history.contacts;

    const storedIce = loadIceConfig();
    setIceConfig(storedIce);
    setStunText(urlsToText(storedIce.stunUrls));
    setTurnText(urlsToText(storedIce.turnUrls));
    setTurnUser(storedIce.turnUsername);
    setTurnCred(storedIce.turnCredential);
    iceConfigRef.current = storedIce;

    setStatus("Session restored. Connecting…");
    setSessionReady(true);
  }, []);

  // Debounced persist of chat history.
  useEffect(() => {
    if (!sessionReady) return;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveHistory(messages, stablePeerIdRef.current || peerId, historyContactsRef.current);
    }, 250);
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [messages, historyContacts, sessionReady, peerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, transferList]);

  useEffect(() => {
    if (!sessionReady || !stablePeerId) return;
    let active = true;
    const lan = new LanRoom({
      onStatus: (next) => active && setStatus(next),
      onPeers: (next) => {
        if (!active) return;
        setPeers(next);
        // Refresh contact names for history directory.
        setHistoryContacts((prev) => {
          let merged = prev;
          for (const peer of next) {
            if (peer.self || !peer.connected) continue;
            merged = upsertContact(merged, peer.id, peer.name);
          }
          historyContactsRef.current = merged;
          return merged;
        });
      },
      onMessage: (message) => {
        if (!active) return;
        setMessages((prev) => appendMessage(prev, message));
        if (message.peerId && message.kind !== "system") {
          const remoteName =
            message.fromId === message.peerId
              ? message.from
              : historyContactsRef.current.find((c) => c.id === message.peerId)?.name || "Peer";
          setHistoryContacts((prev) => {
            const merged = upsertContact(prev, message.peerId!, remoteName, message.ts);
            historyContactsRef.current = merged;
            return merged;
          });
        }
        if (message.peerId && message.peerId !== selectedPeerRef.current && message.kind !== "system") {
          setUnread((prev) => ({ ...prev, [message.peerId!]: (prev[message.peerId!] || 0) + 1 }));
        }
      },
      onTransfer: (progress) => {
        if (!active) return;
        setTransfers((prev) => {
          const next = prev.filter((item) => item.id !== progress.id);
          next.push(progress);
          return next.slice(-12);
        });
      },
      onError: (next) => active && setError(next),
      onJoined: (info) => {
        if (!active) return;
        setJoined(true);
        setPeerId(info.peerId);
        // Host role uses room host id; still keep preferred guest id for next guest join.
        if (!info.isHost) {
          setStablePeerId(info.peerId);
          stablePeerIdRef.current = info.peerId;
          saveIdentity({ peerId: info.peerId, displayName: localNameRef.current });
        }
      },
      onIdentityRotated: (newId) => {
        if (!active) return;
        setStablePeerId(newId);
        stablePeerIdRef.current = newId;
        saveIdentity({ peerId: newId, displayName: localNameRef.current });
      },
    });

    roomRef.current = lan;
    void lan
      .join({
        room: DISCOVERY_CHANNEL,
        displayName: localNameRef.current,
        iceConfig: iceConfigRef.current,
        preferredPeerId: stablePeerIdRef.current,
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to start user discovery.");
        setStatus("Discovery is offline. Retry to reconnect.");
      });

    return () => {
      active = false;
      // Flush history before tear-down.
      saveHistory(messages, stablePeerIdRef.current || peerId, historyContactsRef.current);
      lan.leave();
      if (roomRef.current === lan) roomRef.current = null;
    };
    // messages intentionally not in deps — join only on reconnect/session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoveryKey, sessionReady, stablePeerId]);

  function selectContact(id: string) {
    setSelectedPeerId(id);
    setUnread((prev) => ({ ...prev, [id]: 0 }));
    setError(null);
    setShowTools(false);
    window.setTimeout(() => composeRef.current?.focus(), 0);
  }

  function restartDiscovery() {
    setJoined(false);
    setPeerId("");
    setPeers([]);
    // Keep selected peer + messages so history stays visible while reconnecting.
    setError(null);
    setStatus("Restarting user discovery…");
    setDiscoveryKey((key) => key + 1);
  }

  function applyIceDraft(): LanIceConfig {
    const next: LanIceConfig = {
      stunUrls: parseUrlLines(stunText, "stun"),
      turnUrls: parseUrlLines(turnText, "turn"),
      turnUsername: turnUser,
      turnCredential: turnCred,
    };
    if (next.turnUrls.length > 0 && (!next.turnUsername.trim() || !next.turnCredential)) {
      throw new Error("TURN URLs require both username and credential.");
    }
    return saveIceConfig(next);
  }

  function saveIceAndReconnect() {
    try {
      const saved = applyIceDraft();
      setIceConfig(saved);
      iceConfigRef.current = saved;
      setStunText(urlsToText(saved.stunUrls));
      setTurnText(urlsToText(saved.turnUrls));
      setError(null);
      setShowIce(false);
      setStatus(`ICE saved (${iceModeLabel(iceMode(saved))}). Reconnecting…`);
      restartDiscovery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ICE settings.");
    }
  }

  function resetIceToLanOnly() {
    const empty = clearIceConfig();
    setIceConfig(empty);
    iceConfigRef.current = empty;
    setStunText("");
    setTurnText("");
    setTurnUser("");
    setTurnCred("");
    setError(null);
    setShowIce(false);
    setStatus("Cleared STUN/TURN. LAN-only mode. Reconnecting…");
    restartDiscovery();
  }

  function applyAlias() {
    const alias = sanitizeDisplayName(localName, "User");
    setLocalName(alias);
    localNameRef.current = alias;
    const id = stablePeerIdRef.current || peerId;
    if (id) saveDisplayName(alias, id);
    roomRef.current?.setDisplayName(alias);
    setStatus(`Alias saved as ${alias}.`);
  }

  function clearChatHistory() {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Clear all saved chat history on this device?");
      if (!ok) return;
    }
    clearHistory();
    setMessages([]);
    setHistoryContacts([]);
    historyContactsRef.current = [];
    setUnread({});
    setSelectedPeerId("");
    setStatus("Chat history cleared on this device.");
  }

  async function copyKey() {
    const key = peerId || stablePeerId;
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setStatus("Your key was copied.");
    } catch {
      setError("Could not copy the key. Select it and copy manually.");
    }
  }

  function handleSendChat() {
    if (!selectedPeerId || !canSend) return;
    try {
      roomRef.current?.sendChat(selectedPeerId, draft);
      setDraft("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    }
  }

  function handleShareConfig() {
    if (!selectedPeerId || !canSend) return;
    try {
      roomRef.current?.sendConfig(selectedPeerId, configName, configBody);
      setConfigBody("");
      setError(null);
      setShowTools(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share config.");
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !roomRef.current || !selectedPeerId || !canSend) return;
    setError(null);
    for (const file of Array.from(fileList)) {
      try {
        await roomRef.current.sendFile(selectedPeerId, file);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to send ${file.name}`);
        break;
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowTools(false);
  }

  const displayKey = peerId || stablePeerId;

  return (
    <section className="section lan-section" id="lan">
      <div className="wx-shell" data-online={joined ? "1" : "0"}>
        <aside className="wx-sidebar">
          <header className="wx-sidebar-header">
            <div className="wx-me">
              <span className="wx-avatar wx-avatar-self" aria-hidden="true">
                {avatarInitials(localName)}
              </span>
              <div className="wx-me-copy">
                <strong>{localName}</strong>
                <span className={joined ? "is-live" : undefined}>
                  {joined ? "Online" : "Connecting…"} · {contacts.length} contact
                  {contacts.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="wx-alias-row">
              <input
                value={localName}
                onChange={(event) => setLocalName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyAlias();
                }}
                maxLength={40}
                autoComplete="off"
                aria-label="Your alias"
                placeholder="Alias"
              />
              <button type="button" className="button ghost" onClick={applyAlias}>
                Save
              </button>
            </div>
            <div className="wx-key-row">
              <code title={displayKey || undefined}>
                {displayKey ? `${displayKey.slice(0, 14)}…` : "Generating key…"}
              </code>
              <button type="button" className="button ghost" disabled={!displayKey} onClick={() => void copyKey()}>
                Copy
              </button>
              <button type="button" className="button ghost" onClick={restartDiscovery}>
                Retry
              </button>
            </div>
            <div className="wx-ice-row">
              <span className={`wx-ice-badge ${mode === "lan-only" ? "is-lan" : "is-wan"}`}>
                {iceModeLabel(mode)}
              </span>
              <button
                type="button"
                className="button ghost"
                onClick={() => setShowIce((v) => !v)}
                aria-expanded={showIce}
              >
                {showIce ? "Hide ICE" : "STUN / TURN"}
              </button>
              <button type="button" className="button ghost" onClick={clearChatHistory}>
                Clear history
              </button>
            </div>
            <p className="wx-status-line" title={iceModeHint(mode)}>
              {status}
            </p>
            {showIce ? (
              <div className="wx-ice-panel">
                <p className="wx-ice-hint">
                  Leave empty for <strong>LAN only</strong> (host candidates). Add STUN for NAT traversal and
                  TURN to relay when direct paths fail. Identity, ICE, and chat history stay in this browser.
                </p>
                <label className="guide-field">
                  <span>STUN servers (one per line)</span>
                  <textarea
                    className="lan-code-input wx-ice-textarea"
                    value={stunText}
                    onChange={(event) => setStunText(event.target.value)}
                    placeholder={"stun:stun.example.com:3478\nstuns:stun.example.com:5349"}
                    spellCheck={false}
                    rows={3}
                  />
                </label>
                <label className="guide-field">
                  <span>TURN servers (one per line)</span>
                  <textarea
                    className="lan-code-input wx-ice-textarea"
                    value={turnText}
                    onChange={(event) => setTurnText(event.target.value)}
                    placeholder={"turn:turn.example.com:3478\nturns:turn.example.com:5349"}
                    spellCheck={false}
                    rows={3}
                  />
                </label>
                <div className="wx-ice-creds">
                  <label className="guide-field">
                    <span>TURN username</span>
                    <input
                      value={turnUser}
                      onChange={(event) => setTurnUser(event.target.value)}
                      autoComplete="off"
                      maxLength={256}
                    />
                  </label>
                  <label className="guide-field">
                    <span>TURN credential</span>
                    <input
                      type="password"
                      value={turnCred}
                      onChange={(event) => setTurnCred(event.target.value)}
                      autoComplete="off"
                      maxLength={256}
                    />
                  </label>
                </div>
                <div className="wx-ice-actions">
                  <button type="button" className="button primary" onClick={saveIceAndReconnect}>
                    Save & reconnect
                  </button>
                  <button type="button" className="button ghost" onClick={resetIceToLanOnly}>
                    LAN only
                  </button>
                </div>
              </div>
            ) : null}
          </header>

          <div className="wx-contact-list" role="list">
            {contacts.length === 0 ? (
              <div className="wx-contact-empty">
                No contacts yet.
                <br />
                {mode === "lan-only"
                  ? "LAN-only: peers must share a network, or configure STUN/TURN."
                  : "Keep this page open to stay discoverable. History appears after you chat."}
              </div>
            ) : (
              contacts.map((peer) => {
                const selected = peer.id === selectedPeerId;
                const preview =
                  peer.lastMessage?.kind === "chat"
                    ? markdownPreview(peer.lastMessage.text)
                    : peer.lastMessage
                      ? peer.lastMessage.text
                      : "No messages yet";
                return (
                  <button
                    key={peer.id}
                    type="button"
                    role="listitem"
                    className={`wx-contact ${selected ? "is-selected" : ""} ${peer.connected ? "" : "is-offline"}`}
                    onClick={() => selectContact(peer.id)}
                  >
                    <span className="wx-avatar" aria-hidden="true">
                      {avatarInitials(peer.name)}
                    </span>
                    <span className="wx-contact-body">
                      <span className="wx-contact-top">
                        <strong>
                          {peer.name}
                          {!peer.connected ? " · offline" : ""}
                        </strong>
                        <time>{peer.lastMessage ? formatDayTime(peer.lastMessage.ts) : ""}</time>
                      </span>
                      <span className="wx-contact-bottom">
                        <span className="wx-contact-preview">{preview}</span>
                        {peer.unreadCount > 0 ? (
                          <span className="wx-unread">{peer.unreadCount > 99 ? "99+" : peer.unreadCount}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className={`wx-chat ${selectedPeer ? "is-active" : ""}`}>
          <header className="wx-chat-header">
            {selectedPeer ? (
              <>
                <div className="wx-chat-title">
                  <strong>{selectedPeer.name}</strong>
                  <span>
                    {selectedPeer.connected
                      ? "Online · private peer-to-peer · Markdown"
                      : "Offline · showing saved history"}
                  </span>
                </div>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setShowTools((v) => !v)}
                  aria-expanded={showTools}
                  disabled={!canSend}
                >
                  {showTools ? "Hide tools" : "File / config"}
                </button>
              </>
            ) : (
              <div className="wx-chat-title">
                <strong>Select a contact</strong>
                <span>History is restored from this browser after reload</span>
              </div>
            )}
          </header>

          <div className="wx-chat-log" aria-live="polite">
            {!selectedPeerId ? (
              <div className="wx-empty">
                <p>WeChat-style direct chat</p>
                <span>
                  Your alias, peer key, ICE settings, and chat history are saved on this device.
                </span>
              </div>
            ) : conversation.length === 0 ? (
              <div className="wx-empty">
                <p>Say hello to {selectedPeer?.name}</p>
                <span>
                  {canSend
                    ? "Markdown: **bold**, `code`, lists, tables. Links open safely; images need your click."
                    : "Contact is offline. You can still read history; messaging resumes when they are online."}
                </span>
              </div>
            ) : (
              conversation.map((message) => {
                const mine = Boolean(message.fromId && message.fromId === selfId);
                if (message.kind === "system") {
                  return (
                    <div key={message.id} className="wx-system">
                      {message.text}
                    </div>
                  );
                }
                return (
                  <div key={message.id} className={`wx-bubble-row ${mine ? "is-self" : "is-peer"}`}>
                    {!mine ? (
                      <span className="wx-avatar wx-avatar-sm" aria-hidden="true">
                        {avatarInitials(message.from)}
                      </span>
                    ) : null}
                    <div className={`wx-bubble lan-message-${message.kind}`}>
                      {!mine ? <div className="wx-bubble-name">{message.from}</div> : null}
                      {message.kind === "chat" ? (
                        <LanMarkdown source={message.text} />
                      ) : (
                        <p className="wx-plain">{message.text}</p>
                      )}
                      {message.fileUrl && message.fileName && isSafeObjectUrl(message.fileUrl) ? (
                        <a
                          className="button secondary lan-download-link"
                          href={message.fileUrl}
                          download={sanitizeFileName(message.fileName)}
                          rel="noopener noreferrer"
                        >
                          Download {sanitizeFileName(message.fileName)}
                          {message.fileSize ? ` (${formatBytes(message.fileSize)})` : ""}
                        </a>
                      ) : message.kind === "file" || message.kind === "config" ? (
                        <p className="wx-plain wx-history-note">
                          {message.fileName
                            ? `Saved note: ${sanitizeFileName(message.fileName)}${
                                message.fileSize ? ` (${formatBytes(message.fileSize)})` : ""
                              }. Re-send to download again after reload.`
                            : "Attachment not kept after reload."}
                        </p>
                      ) : null}
                      <time className="wx-bubble-time">{formatDayTime(message.ts)}</time>
                    </div>
                    {mine ? (
                      <span className="wx-avatar wx-avatar-sm wx-avatar-self" aria-hidden="true">
                        {avatarInitials(localName)}
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {transferList.length > 0 ? (
            <div className="wx-transfers">
              {transferList.map((item) => {
                const pct = item.total ? Math.min(100, Math.round((item.received / item.total) * 100)) : 0;
                return (
                  <div key={`${item.id}-${item.direction}`} className="lan-transfer">
                    <div className="lan-transfer-meta">
                      <span>
                        {item.direction === "send" ? "Sending" : "Receiving"} {item.name}
                      </span>
                      <span>
                        {item.error ? item.error : item.done ? "Done" : `${pct}% · ${formatBytes(item.received)}`}
                      </span>
                    </div>
                    <div className="lan-transfer-bar" aria-hidden="true">
                      <span style={{ width: `${item.error ? 100 : pct}%` }} data-error={item.error ? "1" : "0"} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {showTools && selectedPeer && canSend ? (
            <div className="wx-tools">
              <div className="lan-tool-card">
                <strong>Send config</strong>
                <label className="guide-field">
                  <span>File name</span>
                  <input
                    value={configName}
                    onChange={(event) => setConfigName(event.target.value)}
                    maxLength={180}
                    autoComplete="off"
                  />
                </label>
                <label className="guide-field">
                  <span>JSON / URI content</span>
                  <textarea
                    className="lan-code-input lan-config-input"
                    value={configBody}
                    onChange={(event) => setConfigBody(event.target.value)}
                    placeholder="Paste server.json / client.json / client.uri"
                    spellCheck={false}
                  />
                </label>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!configBody.trim()}
                  onClick={handleShareConfig}
                >
                  Send config to {selectedPeer.name}
                </button>
              </div>
              <div className="lan-tool-card">
                <strong>Send file</strong>
                <p className="guide-field-hint">
                  Up to {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB · file bytes are not kept after
                  reload (chat note is).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </div>
            </div>
          ) : null}

          <footer className="wx-compose">
            {error ? (
              <p className="generator-error wx-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="wx-compose-main">
              <textarea
                ref={composeRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHAT_TEXT_CHARS))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={
                  !selectedPeer
                    ? "Select a contact first"
                    : canSend
                      ? `Message ${selectedPeer.name}… (Markdown · Shift+Enter for newline)`
                      : `${selectedPeer.name} is offline — history only`
                }
                disabled={!canSend}
                rows={2}
                maxLength={MAX_CHAT_TEXT_CHARS}
              />
              <div className="wx-compose-actions">
                <span className="wx-char-count">
                  {draft.length}/{MAX_CHAT_TEXT_CHARS}
                </span>
                <button
                  type="button"
                  className="button primary"
                  disabled={!canSend || !draft.trim()}
                  onClick={handleSendChat}
                >
                  Send
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
