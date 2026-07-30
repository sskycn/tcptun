"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  MAX_STORED_MESSAGES,
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

function defaultDisplayName(): string {
  return `User-${Math.floor(100 + Math.random() * 900)}`;
}

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type ContactRow = RoomPeer & {
  lastMessage?: ChatMessage;
  unreadCount: number;
};

export default function LanShare() {
  const [localName, setLocalName] = useState(defaultDisplayName);
  const [joined, setJoined] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [selectedPeerId, setSelectedPeerId] = useState("");
  const [status, setStatus] = useState("Starting automatic user discovery…");
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [configName, setConfigName] = useState("client.json");
  const [configBody, setConfigBody] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [discoveryKey, setDiscoveryKey] = useState(0);

  const roomRef = useRef<LanRoom | null>(null);
  const selectedPeerRef = useRef("");
  const localNameRef = useRef(localName);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composeRef = useRef<HTMLTextAreaElement | null>(null);

  const contacts: ContactRow[] = useMemo(() => {
    const online = peers.filter((peer) => !peer.self && peer.connected);
    return online
      .map((peer) => {
        const peerMessages = messages.filter((m) => m.peerId === peer.id && m.kind !== "system");
        const lastMessage = peerMessages[peerMessages.length - 1];
        return {
          ...peer,
          lastMessage,
          unreadCount: unread[peer.id] || 0,
        };
      })
      .sort((a, b) => {
        const at = a.lastMessage?.ts || 0;
        const bt = b.lastMessage?.ts || 0;
        if (at !== bt) return bt - at;
        return a.name.localeCompare(b.name);
      });
  }, [peers, messages, unread]);

  const selectedPeer = contacts.find((peer) => peer.id === selectedPeerId);
  const conversation = useMemo(
    () => messages.filter((message) => message.peerId === selectedPeerId),
    [messages, selectedPeerId],
  );
  const transferList = useMemo(
    () => transfers.filter((item) => item.peerId === selectedPeerId),
    [transfers, selectedPeerId],
  );

  useEffect(() => {
    selectedPeerRef.current = selectedPeerId;
  }, [selectedPeerId]);

  useEffect(() => {
    localNameRef.current = localName;
  }, [localName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation, transferList]);

  useEffect(() => {
    let active = true;
    const lan = new LanRoom({
      onStatus: (next) => active && setStatus(next),
      onPeers: (next) => active && setPeers(next),
      onMessage: (message) => {
        if (!active) return;
        setMessages((prev) => {
          const next = [...prev, message];
          return next.length > MAX_STORED_MESSAGES ? next.slice(-MAX_STORED_MESSAGES) : next;
        });
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
      },
    });

    roomRef.current = lan;
    void lan.join(DISCOVERY_CHANNEL, localNameRef.current).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Failed to start user discovery.");
      setStatus("Discovery is offline. Retry to reconnect.");
    });

    return () => {
      active = false;
      lan.leave();
      if (roomRef.current === lan) roomRef.current = null;
    };
  }, [discoveryKey]);

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
    setSelectedPeerId("");
    setError(null);
    setStatus("Restarting user discovery…");
    setDiscoveryKey((key) => key + 1);
  }

  function applyAlias() {
    const alias = sanitizeDisplayName(localName, defaultDisplayName());
    setLocalName(alias);
    roomRef.current?.setDisplayName(alias);
    setStatus(`Alias updated to ${alias}.`);
  }

  async function copyKey() {
    if (!peerId) return;
    try {
      await navigator.clipboard.writeText(peerId);
      setStatus("Your key was copied.");
    } catch {
      setError("Could not copy the key. Select it and copy manually.");
    }
  }

  function handleSendChat() {
    if (!selectedPeerId) return;
    try {
      roomRef.current?.sendChat(selectedPeerId, draft);
      setDraft("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    }
  }

  function handleShareConfig() {
    if (!selectedPeerId) return;
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
    if (!fileList?.length || !roomRef.current || !selectedPeerId) return;
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

  return (
    <section className="section lan-section" id="lan">
      <div className="wx-shell" data-online={joined ? "1" : "0"}>
        {/* —— Left: contacts (WeChat-style) —— */}
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
              <button type="button" className="button ghost" disabled={!joined} onClick={applyAlias}>
                Save
              </button>
            </div>
            <div className="wx-key-row">
              <code title={peerId || undefined}>{peerId ? `${peerId.slice(0, 14)}…` : "Generating key…"}</code>
              <button type="button" className="button ghost" disabled={!peerId} onClick={() => void copyKey()}>
                Copy
              </button>
              <button type="button" className="button ghost" onClick={restartDiscovery}>
                Retry
              </button>
            </div>
            <p className="wx-status-line">{status}</p>
          </header>

          <div className="wx-contact-list" role="list">
            {contacts.length === 0 ? (
              <div className="wx-contact-empty">
                No online users yet.
                <br />
                Keep this page open to stay discoverable.
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
                    className={`wx-contact ${selected ? "is-selected" : ""}`}
                    onClick={() => selectContact(peer.id)}
                  >
                    <span className="wx-avatar" aria-hidden="true">
                      {avatarInitials(peer.name)}
                    </span>
                    <span className="wx-contact-body">
                      <span className="wx-contact-top">
                        <strong>{peer.name}</strong>
                        <time>
                          {peer.lastMessage ? formatClock(peer.lastMessage.ts) : ""}
                        </time>
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

        {/* —— Right: conversation —— */}
        <div className={`wx-chat ${selectedPeer ? "is-active" : ""}`}>
          <header className="wx-chat-header">
            {selectedPeer ? (
              <>
                <div className="wx-chat-title">
                  <strong>{selectedPeer.name}</strong>
                  <span>Private · peer-to-peer · Markdown supported</span>
                </div>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setShowTools((v) => !v)}
                  aria-expanded={showTools}
                >
                  {showTools ? "Hide tools" : "File / config"}
                </button>
              </>
            ) : (
              <div className="wx-chat-title">
                <strong>Select a contact</strong>
                <span>Pick someone on the left to start chatting</span>
              </div>
            )}
          </header>

          <div className="wx-chat-log" aria-live="polite">
            {!selectedPeerId ? (
              <div className="wx-empty">
                <p>WeChat-style direct chat</p>
                <span>Contacts on the left · conversation on the right. Messages support secure Markdown.</span>
              </div>
            ) : conversation.length === 0 ? (
              <div className="wx-empty">
                <p>Say hello to {selectedPeer?.name}</p>
                <span>
                  Markdown: **bold**, `code`, lists, tables. Links open safely; images need your click.
                </span>
              </div>
            ) : (
              conversation.map((message) => {
                const mine = message.fromId === peerId;
                if (message.kind === "system") {
                  return (
                    <div key={message.id} className="wx-system">
                      {message.text}
                    </div>
                  );
                }
                return (
                  <div
                    key={message.id}
                    className={`wx-bubble-row ${mine ? "is-self" : "is-peer"}`}
                  >
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
                      ) : null}
                      <time className="wx-bubble-time">{formatClock(message.ts)}</time>
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

          {showTools && selectedPeer ? (
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
                  Up to {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB · stored as download only (not executed).
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
                  selectedPeer
                    ? `Message ${selectedPeer.name}… (Markdown · Shift+Enter for newline)`
                    : "Select a contact first"
                }
                disabled={!selectedPeer}
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
                  disabled={!selectedPeer || !draft.trim()}
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
