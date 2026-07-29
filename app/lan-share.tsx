"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LanRoom,
  MAX_LAN_FILE_BYTES,
  type ChatMessage,
  type RoomPeer,
  type TransferProgress,
} from "./lan-room";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function defaultRoomName(): string {
  // Shared default so LAN users find each other without coordinating a code.
  // Users can still set a private room name for isolation.
  return "tcptun-lan";
}

function defaultDisplayName(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `User-${n}`;
}

export default function LanShare() {
  const [room, setRoom] = useState(defaultRoomName);
  const [localName, setLocalName] = useState(defaultDisplayName);
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [status, setStatus] = useState("Pick a room name and join to discover nearby peers.");
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [configName, setConfigName] = useState("client.json");
  const [configBody, setConfigBody] = useState("");
  const [busy, setBusy] = useState(false);

  const roomRef = useRef<LanRoom | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const others = useMemo(() => peers.filter((p) => !p.self), [peers]);
  const online = joined && (others.length > 0 || isHost);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, transfers]);

  useEffect(() => {
    return () => {
      roomRef.current?.leave();
      roomRef.current = null;
    };
  }, []);

  function upsertTransfer(progress: TransferProgress) {
    setTransfers((prev) => {
      const next = prev.filter((item) => item.id !== progress.id);
      next.push(progress);
      return next.slice(-12);
    });
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const lan = new LanRoom({
        onStatus: setStatus,
        onPeers: setPeers,
        onMessage: (message) => setMessages((prev) => [...prev, message]),
        onTransfer: upsertTransfer,
        onError: (err) => setError(err),
        onJoined: (info) => {
          setJoined(true);
          setIsHost(info.isHost);
          setPeerId(info.peerId);
        },
      });
      roomRef.current?.leave();
      roomRef.current = lan;
      setMessages([]);
      setTransfers([]);
      await lan.join(room, localName);
      setPeers(lan.listPeers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
      setJoined(false);
    } finally {
      setBusy(false);
    }
  }

  function handleLeave() {
    roomRef.current?.leave();
    roomRef.current = null;
    setJoined(false);
    setIsHost(false);
    setPeerId("");
    setPeers([]);
    setStatus("Left room. Join again to rediscover peers.");
  }

  function handleSendChat() {
    try {
      roomRef.current?.sendChat(draft);
      setDraft("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send chat.");
    }
  }

  function handleShareConfig() {
    try {
      roomRef.current?.sendConfig(configName, configBody);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share config.");
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !roomRef.current) return;
    setError(null);
    for (const file of Array.from(fileList)) {
      try {
        await roomRef.current.sendFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to send ${file.name}`);
        break;
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const transferList = useMemo(
    () =>
      Object.values(
        transfers.reduce<Record<string, TransferProgress>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
      ),
    [transfers],
  );

  return (
    <section className="section lan-section" id="lan">
      <div className="lan-layout">
        <div className="lan-panel">
          <div className="lan-panel-heading">
            <div>
              <p className="eyebrow">WebRTC · auto discovery</p>
              <h2>Find room peers and chat instantly</h2>
              <p>
                Join a shared room name. Devices that open this page with the same room are discovered
                automatically over WebRTC — no host/guest code paste. Chat, share configs, and send
                files peer-to-peer.
              </p>
            </div>
            <div className="lan-status-pills">
              <span className={joined ? "is-live" : undefined}>{joined ? "In room" : "Offline"}</span>
              <span>
                {others.length} peer{others.length === 1 ? "" : "s"}
              </span>
              {isHost ? <span className="is-live">Room host</span> : null}
            </div>
          </div>

          <div className="lan-setup">
            <label className="guide-field">
              <span>Display name</span>
              <input
                value={localName}
                onChange={(event) => setLocalName(event.target.value)}
                disabled={joined || busy}
                autoComplete="off"
              />
            </label>
            <label className="guide-field">
              <span>Room name</span>
              <input
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                disabled={joined || busy}
                placeholder="tcptun-lan"
                autoComplete="off"
              />
            </label>
            <p className="guide-field-hint">
              Anyone who joins the same room name can see you. Default <code>tcptun-lan</code> is
              public on this site — use a private name for your office/home group.
            </p>

            <div className="lan-actions">
              {!joined ? (
                <button type="button" className="button primary" disabled={busy} onClick={() => void handleJoin()}>
                  {busy ? "Joining…" : "Join room & discover"}
                </button>
              ) : (
                <button type="button" className="button ghost" onClick={handleLeave}>
                  Leave room
                </button>
              )}
            </div>

            <div className="lan-meta-row">
              <span className="lan-status-text">{status}</span>
              {peerId ? (
                <span>
                  You: <code>{peerId.slice(0, 12)}…</code>
                </span>
              ) : null}
            </div>

            <div className="lan-peer-list">
              <strong>Online in room</strong>
              {peers.length === 0 ? (
                <p className="guide-field-hint">No peers yet. Ask others to open /lan/ and join this room.</p>
              ) : (
                <ul>
                  {peers.map((peer) => (
                    <li key={peer.id} className={peer.self ? "is-self" : undefined}>
                      <span className="lan-peer-dot" aria-hidden="true" />
                      <span>
                        {peer.name}
                        {peer.self ? "" : ""}
                      </span>
                      <code>{peer.id.slice(0, 10)}…</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ul className="guide-wizard-bullets">
              <li>Auto host election: first joiner hosts the room; others attach automatically.</li>
              <li>Mesh links form between peers so chat works even when more than two people join.</li>
              <li>Uses public PeerJS signaling only to introduce peers; chat/files go over WebRTC DataChannels.</li>
              <li>Max file size {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB per transfer.</li>
            </ul>

            {error ? (
              <p className="generator-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`lan-panel lan-chat-panel ${online ? "is-online" : ""}`}>
          <div className="lan-chat-header">
            <div>
              <strong>Room chat · {room || "—"}</strong>
              <p>
                {joined
                  ? others.length
                    ? `Live with ${others.map((p) => p.name).join(", ")}`
                    : "Waiting for other people to join this room…"
                  : "Join a room to start chatting"}
              </p>
            </div>
          </div>

          <div className="lan-chat-log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="lan-empty">
                No messages yet. When peers appear on the left, messages and files are delivered
                automatically over WebRTC.
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`lan-message lan-message-${message.kind} ${
                    message.fromId && message.fromId === peerId ? "is-self" : ""
                  }`}
                >
                  <header>
                    <span>{message.from}</span>
                    <time>{new Date(message.ts).toLocaleTimeString()}</time>
                  </header>
                  <p>{message.text}</p>
                  {message.fileUrl && message.fileName ? (
                    <a
                      className="button secondary lan-download-link"
                      href={message.fileUrl}
                      download={message.fileName}
                    >
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
                      <span>
                        {item.direction === "send" ? "Sending" : "Receiving"} {item.name}
                      </span>
                      <span>
                        {item.error
                          ? item.error
                          : item.done
                            ? "Done"
                            : `${pct}% · ${formatBytes(item.received)}`}
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
                placeholder={joined ? "Message the room…" : "Join a room first"}
                disabled={!joined}
              />
              <button
                type="button"
                className="button primary"
                disabled={!joined || !draft.trim()}
                onClick={handleSendChat}
              >
                Send
              </button>
            </div>

            <div className="lan-tools">
              <div className="lan-tool-card">
                <strong>Share config</strong>
                <label className="guide-field">
                  <span>File name</span>
                  <input
                    value={configName}
                    onChange={(event) => setConfigName(event.target.value)}
                    disabled={!joined}
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
                    disabled={!joined}
                  />
                </label>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!joined || !configBody.trim()}
                  onClick={handleShareConfig}
                >
                  Share config to room
                </button>
              </div>

              <div className="lan-tool-card">
                <strong>Send file</strong>
                <p className="guide-field-hint">
                  Broadcast any file up to {Math.floor(MAX_LAN_FILE_BYTES / 1024 / 1024)} MiB to peers
                  currently in the room.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  disabled={!joined || others.length === 0}
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
