"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendMessage,
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
  encrypted: boolean;
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
  /** Alias editor — opened by tapping your avatar. */
  const [showAlias, setShowAlias] = useState(false);
  /** Overflow menu (viewport fill, network settings, …). */
  const [showMenu, setShowMenu] = useState(false);
  /** Network settings panel — STUN / TURN. */
  const [showSettings, setShowSettings] = useState(false);
  /** Fill the browser viewport (not OS display fullscreen). */
  const [viewportFill, setViewportFill] = useState(false);
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
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const composeRef = useRef<HTMLTextAreaElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const stickToBottomRef = useRef(true);
  const prevConversationLenRef = useRef(0);
  const prevSelectedRef = useRef("");
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const mode = iceMode(iceConfig);
  const selfId = peerId || stablePeerId;

  const contacts: ContactRow[] = useMemo(() => {
    // Contact list: online peers only (DataChannel open).
    const online = peers.filter((peer) => !peer.self && peer.connected);
    return online
      .map((peer) => {
        const peerMessages = messages.filter((m) => m.peerId === peer.id && m.kind !== "system");
        const lastMessage = peerMessages[peerMessages.length - 1];
        const storedName = historyContacts.find((c) => c.id === peer.id)?.name;
        return {
          id: peer.id,
          name: peer.name && peer.name !== "User" ? peer.name : storedName || peer.name,
          connected: true,
          encrypted: Boolean(peer.encrypted),
          lastMessage,
          unreadCount: unread[peer.id] || 0,
          lastTs: lastMessage?.ts || Date.now(),
        };
      })
      .sort((a, b) => {
        if (a.encrypted !== b.encrypted) return a.encrypted ? -1 : 1;
        return b.lastTs - a.lastTs || a.name.localeCompare(b.name);
      });
  }, [peers, messages, unread, historyContacts]);

  // Drop selection when the peer goes offline so the UI stays on the online list.
  useEffect(() => {
    if (!selectedPeerId) return;
    if (!contacts.some((peer) => peer.id === selectedPeerId)) {
      setSelectedPeerId("");
    }
  }, [contacts, selectedPeerId]);

  const selectedPeer = contacts.find((peer) => peer.id === selectedPeerId);
  const conversation = useMemo(
    () => messages.filter((message) => message.peerId === selectedPeerId),
    [messages, selectedPeerId],
  );
  const transferList = useMemo(
    () => transfers.filter((item) => item.peerId === selectedPeerId),
    [transfers, selectedPeerId],
  );
  const canSend = Boolean(selectedPeer?.connected && selectedPeer?.encrypted && joined);

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

    setStatus("Connecting…");
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

  // Keep the message list pinned only inside the chat pane — never scroll the page.
  useEffect(() => {
    const el = chatLogRef.current;
    if (!el) return;

    const selectedChanged = prevSelectedRef.current !== selectedPeerId;
    prevSelectedRef.current = selectedPeerId;

    if (selectedChanged) {
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
      prevConversationLenRef.current = conversation.length;
      return;
    }

    const grew = conversation.length !== prevConversationLenRef.current || transferList.length > 0;
    prevConversationLenRef.current = conversation.length;

    if (grew && stickToBottomRef.current) {
      // Instant local scroll only — avoids page jump from scrollIntoView.
      el.scrollTop = el.scrollHeight;
    }
  }, [conversation, transferList, selectedPeerId]);

  useEffect(() => {
    if (viewportFill) {
      document.documentElement.classList.add("lan-viewport-fill-active");
      document.body.classList.add("lan-viewport-fill-active");
    } else {
      document.documentElement.classList.remove("lan-viewport-fill-active");
      document.body.classList.remove("lan-viewport-fill-active");
    }
    return () => {
      document.documentElement.classList.remove("lan-viewport-fill-active");
      document.body.classList.remove("lan-viewport-fill-active");
    };
  }, [viewportFill]);

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
      setStatus(`Network settings saved (${iceModeLabel(iceMode(saved))}). Reconnecting…`);
      setShowSettings(false);
      restartDiscovery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save network settings.");
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
    setStatus("Using local network only. Reconnecting…");
    setShowSettings(false);
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
    setShowAlias(false);
  }

  function openAliasEditor() {
    setShowMenu(false);
    setShowSettings(false);
    setShowAlias((v) => !v);
  }

  function placeMenu() {
    const btn = menuBtnRef.current;
    if (!btn || typeof window === "undefined") return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: Math.round(rect.bottom + 6),
      right: Math.round(Math.max(8, window.innerWidth - rect.right)),
    });
  }

  function openMenu() {
    setShowAlias(false);
    setShowSettings(false);
    setShowMenu((open) => {
      const next = !open;
      if (next) placeMenu();
      return next;
    });
  }

  function openNetworkSettings() {
    setShowMenu(false);
    setShowAlias(false);
    setShowSettings(true);
  }

  function toggleViewportFill() {
    setShowMenu(false);
    setViewportFill((v) => !v);
  }

  // Keep fixed menu aligned + close on outside click / Escape.
  useEffect(() => {
    if (!showMenu) return;

    placeMenu();

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuBtnRef.current?.contains(target)) return;
      if (menuPanelRef.current?.contains(target)) return;
      setShowMenu(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setShowMenu(false);
    }

    function onReposition() {
      placeMenu();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [showMenu]);

  async function handleSendChat() {
    if (!selectedPeerId || !canSend) return;
    const text = draft.trim();
    if (!text) return;
    try {
      await roomRef.current?.sendChat(selectedPeerId, text);
      setDraft("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    }
  }

  function collectClipboardFiles(data: DataTransfer | null): File[] {
    if (!data) return [];
    const files: File[] = [];
    const seen = new Set<string>();

    const push = (file: File | null) => {
      if (!file || file.size <= 0) return;
      const key = `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
      if (seen.has(key)) return;
      seen.add(key);
      // Clipboard images often have an empty name.
      if (!file.name || file.name === "image.png" || file.name === "blob") {
        const ext =
          file.type === "image/jpeg" || file.type === "image/jpg"
            ? "jpg"
            : file.type === "image/webp"
              ? "webp"
              : file.type === "image/gif"
                ? "gif"
                : file.type === "image/png"
                  ? "png"
                  : "bin";
        const named = new File([file], `paste-${Date.now()}.${ext}`, {
          type: file.type || "application/octet-stream",
          lastModified: file.lastModified || Date.now(),
        });
        files.push(named);
        return;
      }
      files.push(file);
    };

    if (data.items?.length) {
      for (const item of Array.from(data.items)) {
        if (item.kind === "file") push(item.getAsFile());
      }
    }
    if (data.files?.length) {
      for (const file of Array.from(data.files)) push(file);
    }
    return files;
  }

  async function handleSendFiles(files: File[]) {
    if (!files.length || !roomRef.current || !selectedPeerId || !canSend) return;
    setError(null);
    for (const file of files) {
      try {
        await roomRef.current.sendFile(selectedPeerId, file);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to send ${file.name}`);
        break;
      }
    }
  }

  async function handleComposePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (!canSend) return;
    const files = collectClipboardFiles(event.clipboardData);
    if (files.length === 0) return;
    // File paste takes precedence over inserting binary garbage as text.
    event.preventDefault();
    await handleSendFiles(files);
  }

  async function handleComposeDrop(event: React.DragEvent<HTMLTextAreaElement>) {
    if (!canSend) return;
    const files = collectClipboardFiles(event.dataTransfer);
    if (files.length === 0) return;
    event.preventDefault();
    await handleSendFiles(files);
  }

  return (
    <section
      className={`section lan-section ${viewportFill ? "is-viewport-fill" : ""}`}
      id="lan"
    >
      <div className="wx-shell" data-online={joined ? "1" : "0"}>
        <aside className="wx-sidebar">
          <header className="wx-sidebar-header">
            <div className="wx-me-bar">
              <button
                type="button"
                className={`wx-me wx-me-button ${showAlias ? "is-open" : ""}`}
                onClick={openAliasEditor}
                aria-expanded={showAlias}
                aria-label="Edit display name"
                title="Edit display name"
              >
                <span className="wx-avatar wx-avatar-self" aria-hidden="true">
                  {avatarInitials(localName)}
                </span>
                <div className="wx-me-copy">
                  <strong>{localName}</strong>
                  <span className={joined ? "is-live" : undefined}>
                    {joined ? "Online" : "Connecting…"}
                    <span className="wx-me-mode"> · {iceModeLabel(mode)}</span>
                  </span>
                </div>
              </button>
              <button
                ref={menuBtnRef}
                type="button"
                className={`wx-settings-btn ${showMenu || showSettings ? "is-open" : ""}`}
                onClick={openMenu}
                aria-expanded={showMenu}
                aria-haspopup="menu"
                aria-label="Menu"
                title="Menu"
              >
                <span className="wx-menu-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>

            {showMenu ? (
              <div
                ref={menuPanelRef}
                className="wx-submenu"
                role="menu"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="wx-submenu-item"
                  onClick={toggleViewportFill}
                >
                  <span className="wx-submenu-label">
                    {viewportFill ? "Exit full browser" : "Fill browser"}
                  </span>
                  <span className="wx-submenu-hint">
                    {viewportFill ? "Restore layout" : "Use full window"}
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="wx-submenu-item"
                  onClick={openNetworkSettings}
                >
                  <span className="wx-submenu-label">Network settings</span>
                  <span className="wx-submenu-hint">STUN / TURN</span>
                </button>
              </div>
            ) : null}

            {showAlias ? (
              <div className="wx-profile-panel">
                <label className="guide-field">
                  <span>Display name</span>
                  <div className="wx-alias-row">
                    <input
                      value={localName}
                      onChange={(event) => setLocalName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyAlias();
                      }}
                      maxLength={40}
                      autoComplete="off"
                      aria-label="Display name"
                      placeholder="Your name"
                      autoFocus
                    />
                    <button type="button" className="button secondary" onClick={applyAlias}>
                      Save
                    </button>
                  </div>
                </label>
              </div>
            ) : null}

            {showSettings ? (
              <div className="wx-profile-panel wx-settings-panel">
                <div className="wx-profile-section">
                  <div className="wx-profile-section-title">
                    <span>Network</span>
                    <span className={`wx-ice-badge ${mode === "lan-only" ? "is-lan" : "is-wan"}`}>
                      {iceModeLabel(mode)}
                    </span>
                  </div>
                  <p className="wx-ice-hint">
                    Local network works by default. Add STUN or TURN servers only if you need to
                    connect across different networks.
                  </p>
                  <label className="guide-field">
                    <span>STUN servers</span>
                    <textarea
                      className="lan-code-input wx-ice-textarea"
                      value={stunText}
                      onChange={(event) => setStunText(event.target.value)}
                      placeholder={"stun:stun.example.com:3478"}
                      spellCheck={false}
                      rows={2}
                    />
                  </label>
                  <label className="guide-field">
                    <span>TURN servers</span>
                    <textarea
                      className="lan-code-input wx-ice-textarea"
                      value={turnText}
                      onChange={(event) => setTurnText(event.target.value)}
                      placeholder={"turn:turn.example.com:3478"}
                      spellCheck={false}
                      rows={2}
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
                      <span>TURN password</span>
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
                      Save network
                    </button>
                    <button type="button" className="button ghost" onClick={resetIceToLanOnly}>
                      Use local network only
                    </button>
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => setShowSettings(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <p className="wx-status-line" title={iceModeHint(mode)}>
                  {status}
                </p>
              </div>
            ) : null}
          </header>

          <div className="wx-contact-list" role="list">
            {contacts.length === 0 ? (
              <div className="wx-contact-empty">
                No one online yet.
                <br />
                Open this page on another device on the same network to get started.
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
              <div className="wx-chat-title">
                <strong>{selectedPeer.name}</strong>
                <span>
                  {selectedPeer.encrypted ? "Online · end-to-end encrypted" : "Online · securing…"}
                </span>
              </div>
            ) : (
              <div className="wx-chat-title">
                <strong>Messages</strong>
                <span>Select a contact to start chatting</span>
              </div>
            )}
          </header>

          <div
            className="wx-chat-log"
            aria-live="polite"
            ref={chatLogRef}
            onScroll={() => {
              const el = chatLogRef.current;
              if (!el) return;
              const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
              stickToBottomRef.current = distance < 72;
            }}
          >
            {!selectedPeerId ? (
              <div className="wx-empty">
                <p>No conversation selected</p>
                <span>Choose a contact from the list to view messages or start a chat.</span>
              </div>
            ) : conversation.length === 0 ? (
              <div className="wx-empty">
                <p>No messages yet</p>
                <span>
                  {canSend
                    ? `Send a message to ${selectedPeer?.name}.`
                    : "Waiting for a secure connection…"}
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
                            ? `${sanitizeFileName(message.fileName)}${
                                message.fileSize ? ` · ${formatBytes(message.fileSize)}` : ""
                              }`
                            : "Attachment"}
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

          <footer className="wx-compose">
            {error ? (
              <p className="generator-error wx-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="wx-compose-main">
              <textarea
                ref={composeRef}
                className="wx-compose-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHAT_TEXT_CHARS))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendChat();
                  }
                }}
                onPaste={(event) => {
                  void handleComposePaste(event);
                }}
                onDragOver={(event) => {
                  if (!canSend) return;
                  if (event.dataTransfer?.types?.includes("Files")) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDrop={(event) => {
                  void handleComposeDrop(event);
                }}
                placeholder={
                  !selectedPeer
                    ? "Select a contact"
                    : !selectedPeer.encrypted
                      ? "Securing connection…"
                      : `Message ${selectedPeer.name} · Enter to send · paste files here`
                }
                disabled={!canSend}
                rows={1}
                maxLength={MAX_CHAT_TEXT_CHARS}
              />
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
