"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LanRoom,
  MAX_LAN_FILE_BYTES,
  type ChatMessage,
  type RoomPeer,
  type TransferProgress,
} from "./lan-room";

const DISCOVERY_CHANNEL = "tcptun-direct-users-v1";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function defaultDisplayName(): string {
  return `User-${Math.floor(100 + Math.random() * 900)}`;
}

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
  const [discoveryKey, setDiscoveryKey] = useState(0);

  const roomRef = useRef<LanRoom | null>(null);
  const selectedPeerRef = useRef("");
  const localNameRef = useRef(localName);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const contacts = useMemo(
    () => peers.filter((peer) => !peer.self && peer.connected),
    [peers],
  );
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
        setMessages((prev) => [...prev, message]);
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
    const alias = localName.trim() || defaultDisplayName();
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
      setError(null);
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
  }

  return (
    <section className="section lan-section" id="lan">
      <div className="lan-layout">
        <div className="lan-panel">
          <div className="lan-panel-heading">
            <div>
              <p className="eyebrow">WebRTC · direct messages</p>
              <h2>Online users</h2>
              <p>
                Your key is generated automatically. Online users appear here; choose one to start a
                private peer-to-peer conversation.
              </p>
            </div>
            <div className="lan-status-pills">
              <span className={joined ? "is-live" : undefined}>{joined ? "Discoverable" : "Offline"}</span>
              <span>
                {contacts.length} user{contacts.length === 1 ? "" : "s"} online
              </span>
            </div>
          </div>

          <div className="lan-setup">
            <label className="guide-field">
              <span>Your alias</span>
              <input
                value={localName}
                onChange={(event) => setLocalName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyAlias();
                }}
                maxLength={40}
                autoComplete="off"
              />
            </label>
            <div className="lan-actions">
              <button type="button" className="button secondary" disabled={!joined} onClick={applyAlias}>
                Save alias
              </button>
              <button type="button" className="button ghost" onClick={restartDiscovery}>
                Retry discovery
              </button>
            </div>

            <div className="lan-identity-card">
              <span>Your key</span>
              <code>{peerId || "Generating…"}</code>
              <button type="button" className="button ghost" disabled={!peerId} onClick={() => void copyKey()}>
                Copy key
              </button>
            </div>

            <p className="lan-status-text">{status}</p>

            <div className="lan-peer-list">
              <strong>Users available to chat</strong>
              {contacts.length === 0 ? (
                <p className="guide-field-hint">No other users are online yet. Keep this page open to stay visible.</p>
              ) : (
                <ul>
                  {contacts.map((peer) => (
                    <li key={peer.id} className={peer.id === selectedPeerId ? "is-selected" : undefined}>
                      <button type="button" onClick={() => selectContact(peer.id)}>
                        <span className="lan-peer-dot" aria-hidden="true" />
                        <span className="lan-peer-name">
                          <strong>{peer.name}</strong>
                          <code>{peer.id.slice(0, 12)}…</code>
                        </span>
                        {unread[peer.id] ? <span className="lan-unread">{unread[peer.id]}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ul className="guide-wizard-bullets">
              <li>No room name or invitation flow: users are discovered automatically.</li>
              <li>Messages and files are sent only to the user you select.</li>
              <li>PeerJS introduces users; content travels over WebRTC DataChannels.</li>
              <li>Max file size {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB per transfer.</li>
            </ul>

            {error ? (
              <p className="generator-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`lan-panel lan-chat-panel ${selectedPeer ? "is-online" : ""}`}>
          <div className="lan-chat-header">
            <div>
              <strong>{selectedPeer ? selectedPeer.name : "Select a user"}</strong>
              <p>
                {selectedPeer
                  ? `Private chat · ${selectedPeer.id.slice(0, 16)}…`
                  : "Choose an online user from the list to start chatting"}
              </p>
            </div>
          </div>

          <div className="lan-chat-log" aria-live="polite">
            {!selectedPeerId ? (
              <div className="lan-empty">Select a user to open a one-to-one conversation.</div>
            ) : conversation.length === 0 ? (
              <div className="lan-empty">No messages yet. Say hello or send a config/file.</div>
            ) : (
              conversation.map((message) => (
                <article
                  key={message.id}
                  className={`lan-message lan-message-${message.kind} ${
                    message.fromId === peerId ? "is-self" : ""
                  }`}
                >
                  <header>
                    <span>{message.from}</span>
                    <time>{new Date(message.ts).toLocaleTimeString()}</time>
                  </header>
                  <p>{message.text}</p>
                  {message.fileUrl && message.fileName ? (
                    <a className="button secondary lan-download-link" href={message.fileUrl} download={message.fileName}>
                      Download {message.fileName}
                      {message.fileSize ? ` (${formatBytes(message.fileSize)})` : ""}
                    </a>
                  ) : null}
                </article>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {transferList.length > 0 ? (
            <div className="lan-transfers">
              {transferList.map((item) => {
                const pct = item.total ? Math.min(100, Math.round((item.received / item.total) * 100)) : 0;
                return (
                  <div key={`${item.id}-${item.direction}`} className="lan-transfer">
                    <div className="lan-transfer-meta">
                      <span>{item.direction === "send" ? "Sending" : "Receiving"} {item.name}</span>
                      <span>{item.error ? item.error : item.done ? "Done" : `${pct}% · ${formatBytes(item.received)}`}</span>
                    </div>
                    <div className="lan-transfer-bar" aria-hidden="true">
                      <span style={{ width: `${item.error ? 100 : pct}%` }} data-error={item.error ? "1" : "0"} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="lan-compose">
            <div className="lan-compose-row">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={selectedPeer ? `Message ${selectedPeer.name}…` : "Select a user first"}
                disabled={!selectedPeer}
              />
              <button type="button" className="button primary" disabled={!selectedPeer || !draft.trim()} onClick={handleSendChat}>
                Send
              </button>
            </div>

            <div className="lan-tools">
              <div className="lan-tool-card">
                <strong>Send config</strong>
                <label className="guide-field">
                  <span>File name</span>
                  <input value={configName} onChange={(event) => setConfigName(event.target.value)} disabled={!selectedPeer} autoComplete="off" />
                </label>
                <label className="guide-field">
                  <span>JSON / URI content</span>
                  <textarea
                    className="lan-code-input lan-config-input"
                    value={configBody}
                    onChange={(event) => setConfigBody(event.target.value)}
                    placeholder="Paste server.json / client.json / client.uri"
                    spellCheck={false}
                    disabled={!selectedPeer}
                  />
                </label>
                <button type="button" className="button secondary" disabled={!selectedPeer || !configBody.trim()} onClick={handleShareConfig}>
                  Send to {selectedPeer?.name || "user"}
                </button>
              </div>

              <div className="lan-tool-card">
                <strong>Send file</strong>
                <p className="guide-field-hint">
                  Send files up to {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB directly to the selected user.
                </p>
                <input ref={fileInputRef} type="file" multiple disabled={!selectedPeer} onChange={(event) => void handleFiles(event.target.files)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
