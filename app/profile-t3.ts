import type { TcptunMux, TcptunOutbound, TcptunSecurity } from "./uri-convert";

const PREFIX_T3 = "T3:";
const PREFIX_T2 = "T2:";
const BASE45 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const PROTOCOLS = ["native", "vless", "vmess", "trojan"] as const;
const TRANSPORTS = ["raw", "ws", "h2", "h3"] as const;
const SECURITIES = ["", "tls", "reality", "reality-quic"] as const;
const SUFFIXES = [".com", ".net", ".org", ".cn", ".io", ".dev"] as const;
const DEFAULT_PATH = "/proxy";
const DEFAULT_FINGERPRINT = "chrome";
const DEFAULT_SPIDER_X = "/";
const DEFAULT_VLESS_FLOW = "xtls-rprx-vision";
const MAX_BINARY_LENGTH = 43_000;
const MAX_INT32 = 0x7fffffff;

type CompactProfile = {
  protocol: string;
  transport: string;
  security: string;
  tlsInsecure: boolean;
  mux: boolean;
  networkCode: number;
  upstreamMixed: boolean;
  muxMode: string;
  path: string;
  sni: string;
  name: string;
  flow: string;
  publicKey: string;
  shortID: string;
  fingerprint: string;
  spiderX: string;
  muxMaxSessions: number;
  muxMaxStreamsPerSession: number;
  muxWarmSpare: number;
  muxUDPMode: string;
  flowExplicitEmpty: boolean;
  initialStreamWindow: number;
  maxStreamWindow: number;
  initialConnectionWindow: number;
  maxConnectionWindow: number;
  port: number;
  credential: string;
  host: string;
};

export type DecodedProfile = {
  name: string;
  upstreamProtocol: "socks5" | "mixed";
  outbound: TcptunOutbound;
};

/** Encode the exact T3 Base45 payload used by `tcptun uri export --qr-format t3`. */
export function encodeT3(outbound: TcptunOutbound, name: string): string {
  const profile = compactProfileFromOutbound(outbound, name);
  const data = encodeCompactProfile(profile);
  if (data.length > MAX_BINARY_LENGTH) {
    throw new Error(`T3 binary payload exceeds ${MAX_BINARY_LENGTH} bytes`);
  }
  return PREFIX_T3 + encodeBase45(data);
}

/** Decode current T3 and legacy T2 profile payloads. Prefixes are strict. */
export function decodeProfilePayload(value: string, tag = "proxy"): DecodedProfile {
  const text = value.trim();
  let t3: boolean;
  let encoded: string;
  if (text.startsWith(PREFIX_T3)) {
    t3 = true;
    encoded = text.slice(PREFIX_T3.length);
  } else if (text.startsWith(PREFIX_T2)) {
    t3 = false;
    if (!text.endsWith(":")) throw new Error("T2 payload is missing the end marker");
    encoded = text.slice(PREFIX_T2.length, -1);
  } else {
    throw new Error("Unsupported profile prefix");
  }
  const data = decodeBase45(encoded);
  if (data.length > MAX_BINARY_LENGTH) {
    throw new Error(`${t3 ? "T3" : "T2"} binary payload exceeds ${MAX_BINARY_LENGTH} bytes`);
  }
  const profile = decodeCompactProfile(data, t3);
  return {
    name: profile.name,
    upstreamProtocol: profile.upstreamMixed ? "mixed" : "socks5",
    outbound: outboundFromProfile(profile, tag.trim()),
  };
}

function compactProfileFromOutbound(outbound: TcptunOutbound, name: string): CompactProfile {
  if (!outbound.address || outbound.address.length !== 1) {
    throw new Error(`T3 requires outbound address to contain exactly 1 item`);
  }
  if (outbound.via) throw new Error("T3 cannot represent outbound chains");
  if (outbound.username) throw new Error("T3 cannot represent outbound username");
  if (outbound.discover) throw new Error("T3 cannot represent discovery");
  if (outbound.expose?.length) throw new Error("T3 cannot represent reverse-service expose");
  if (outbound.members?.length || hasDuration(outbound.affinity_ttl)) {
    throw new Error("T3 cannot represent balance settings");
  }

  const protocol = outbound.type.trim().toLowerCase();
  if (!PROTOCOLS.includes(protocol as (typeof PROTOCOLS)[number])) {
    throw new Error(`T3 does not support protocol ${outbound.type}`);
  }
  const transport = (outbound.transport?.type || "raw").trim().toLowerCase();
  if (!TRANSPORTS.includes(transport as (typeof TRANSPORTS)[number])) {
    throw new Error(`T3 does not support transport ${outbound.transport?.type || ""}`);
  }
  const path = outbound.transport?.path?.trim() || DEFAULT_PATH;
  if (transport === "raw" && path !== DEFAULT_PATH) {
    throw new Error("T3 cannot represent a custom raw transport path");
  }

  const networkCode = encodeNetworks(outbound.network);
  const { host, port } = splitEndpoint(outbound.address[0]);
  const credential = outboundCredential(outbound, protocol);
  const securityConfig = outbound.security || {};
  const security = normalizeSecurity(securityConfig.type);
  validateSecurity(securityConfig, security);
  const sni = securityConfig.server_name?.trim() || "";
  if (security && !sni) throw new Error("T3 security endpoints must set server_name explicitly");

  const flowSource = outbound.flow?.trim() || "";
  const flowExplicitEmpty = protocol === "vless" && security === "reality" && flowSource === "";
  const mux = normalizeMux(outbound.mux);

  return {
    protocol,
    transport,
    security,
    tlsInsecure: Boolean(securityConfig.insecure),
    mux: outbound.mux != null,
    networkCode,
    upstreamMixed: false,
    muxMode: mux.mode,
    path,
    sni,
    name: name.trim(),
    flow: flowExplicitEmpty ? "" : flowSource,
    publicKey: securityConfig.public_key?.trim() || "",
    shortID: securityConfig.short_id?.trim() || "",
    fingerprint: securityConfig.fingerprint?.trim() || "",
    spiderX: securityConfig.spider_x?.trim() || "",
    muxMaxSessions: mux.maxSessions,
    muxMaxStreamsPerSession: mux.maxStreams,
    muxWarmSpare: mux.warmSpare,
    muxUDPMode: mux.udpMode,
    flowExplicitEmpty,
    initialStreamWindow: mux.initialStreamWindow,
    maxStreamWindow: mux.maxStreamWindow,
    initialConnectionWindow: mux.initialConnectionWindow,
    maxConnectionWindow: mux.maxConnectionWindow,
    port,
    credential,
    host,
  };
}

function normalizeSecurity(value: string | undefined): string {
  const security = (value || "").trim().toLowerCase();
  if (security === "none") return "";
  if (!SECURITIES.includes(security as (typeof SECURITIES)[number])) {
    throw new Error(`T3 does not support security ${value || ""}`);
  }
  return security;
}

function validateSecurity(config: TcptunSecurity, security: string) {
  if (
    config.cert ||
    config.key ||
    config.private_key ||
    config.server_names?.length ||
    config.short_ids?.length ||
    config.dest ||
    hasDuration(config.max_time_diff)
  ) {
    throw new Error("T3 cannot represent server-side security fields");
  }
  if (config.insecure && security !== "tls") {
    throw new Error("T3 insecure applies only to TLS security");
  }
  const hasRealityFields = Boolean(
    config.fingerprint || config.public_key || config.short_id || config.spider_x,
  );
  if (security !== "reality" && security !== "reality-quic" && hasRealityFields) {
    throw new Error("T3 REALITY fields require REALITY security");
  }
  if (security === "reality-quic" && config.spider_x) {
    throw new Error("T3 REALITY QUIC cannot represent SpiderX");
  }
}

function normalizeMux(value: TcptunMux | null | undefined) {
  if (value == null) {
    return {
      mode: "", udpMode: "", maxSessions: 0, maxStreams: 0, warmSpare: 0,
      initialStreamWindow: 0, maxStreamWindow: 0, initialConnectionWindow: 0,
      maxConnectionWindow: 0,
    };
  }
  const mode = (value.mode || "").trim().toLowerCase();
  if (mode && mode !== "group" && mode !== "quic") {
    throw new Error(`T3 does not support mux mode ${value.mode}`);
  }
  const udpMode = (value.udp_mode || "").trim().toLowerCase();
  if (udpMode && !["reliable", "auto", "datagram"].includes(udpMode)) {
    throw new Error(`T3 does not support mux UDP mode ${value.udp_mode}`);
  }
  const fields = [
    ["max_sessions", value.max_sessions || 0],
    ["max_streams_per_session", value.max_streams_per_session || 0],
    ["warm_spares", value.warm_spares || 0],
    ["initial_stream_receive_window", value.initial_stream_receive_window || 0],
    ["max_stream_receive_window", value.max_stream_receive_window || 0],
    ["initial_connection_receive_window", value.initial_connection_receive_window || 0],
    ["max_connection_receive_window", value.max_connection_receive_window || 0],
  ] as const;
  for (const [field, number] of fields) {
    if (!Number.isInteger(number) || number < 0 || number > MAX_INT32) {
      throw new Error(`T3 mux.${field} must be an integer between 0 and ${MAX_INT32}`);
    }
  }
  const hasQuicFields = udpMode || fields.slice(3).some(([, number]) => number !== 0);
  if (hasQuicFields && (mode || "group") !== "quic") {
    throw new Error("T3 mux UDP mode and receive windows require quic mode");
  }
  return {
    mode,
    udpMode,
    maxSessions: fields[0][1],
    maxStreams: fields[1][1],
    warmSpare: fields[2][1],
    initialStreamWindow: fields[3][1],
    maxStreamWindow: fields[4][1],
    initialConnectionWindow: fields[5][1],
    maxConnectionWindow: fields[6][1],
  };
}

function encodeCompactProfile(profile: CompactProfile): Uint8Array {
  const protocolCode = PROTOCOLS.indexOf(profile.protocol as (typeof PROTOCOLS)[number]);
  const transportCode = TRANSPORTS.indexOf(profile.transport as (typeof TRANSPORTS)[number]);
  const securityCode = SECURITIES.indexOf(profile.security as (typeof SECURITIES)[number]);
  const muxModeCode = profile.muxMode === "group" ? 1 : profile.muxMode === "quic" ? 2 : 0;
  const hasPath = profile.transport !== "raw" && profile.path !== DEFAULT_PATH;
  const hasCustomSNI = profile.sni !== "" && profile.sni !== profile.host;
  const name = profile.name || profile.host;
  const hasCustomName = name !== profile.host;
  const hasCustomFlow =
    profile.flow !== "" &&
    !(profile.protocol === "vless" && profile.security === "reality" && profile.flow === DEFAULT_VLESS_FLOW);
  const isReality = profile.security === "reality" || profile.security === "reality-quic";
  const publicKey = isReality ? profile.publicKey : "";
  const shortID = isReality ? profile.shortID : "";
  const hasCustomFingerprint =
    isReality && profile.fingerprint !== "" && profile.fingerprint.toLowerCase() !== DEFAULT_FINGERPRINT;
  const hasCustomSpiderX =
    profile.security === "reality" && profile.spiderX !== "" && profile.spiderX !== DEFAULT_SPIDER_X;

  let header0 = protocolCode | (transportCode << 2) | (securityCode << 4);
  if (profile.tlsInsecure) header0 |= 0x40;
  if (profile.mux) header0 |= 0x80;

  let extensions = 0;
  const udpModeCode = ["", "reliable", "auto", "datagram"].indexOf(profile.muxUDPMode);
  if (udpModeCode < 0) throw new Error(`Invalid T3 mux UDP mode ${profile.muxUDPMode}`);
  extensions |= udpModeCode << 2;
  if (profile.flowExplicitEmpty) extensions |= 1 << 4;
  if (profile.initialStreamWindow > 0) extensions |= 1 << 5;
  if (profile.maxStreamWindow > 0) extensions |= 1 << 6;
  if (profile.initialConnectionWindow > 0) extensions |= 1 << 7;
  if (profile.maxConnectionWindow > 0) extensions |= 1 << 8;
  if (extensions) extensions |= profile.networkCode;

  let header1 = (extensions ? 3 : profile.networkCode) | (muxModeCode << 3);
  if (profile.upstreamMixed) header1 |= 0x04;
  if (hasPath) header1 |= 0x20;
  if (hasCustomSNI) header1 |= 0x40;
  if (hasCustomName) header1 |= 0x80;

  let header2 = 0;
  if (hasCustomFlow) header2 |= 0x01;
  if (publicKey) header2 |= 0x02;
  if (shortID) header2 |= 0x04;
  if (hasCustomFingerprint) header2 |= 0x08;
  if (hasCustomSpiderX) header2 |= 0x10;
  if (profile.muxMaxSessions > 0) header2 |= 0x20;
  if (profile.muxMaxStreamsPerSession > 0) header2 |= 0x40;
  if (profile.muxWarmSpare > 0) header2 |= 0x80;

  const writer = new CompactWriter();
  writer.byte(header0);
  writer.byte(header1);
  writer.byte(header2);
  if (extensions) writer.varUInt(extensions);
  writer.port(profile.port);
  writer.credential(profile.protocol, profile.credential);
  writer.host(profile.host);
  if (hasPath) writer.string(profile.path);
  if (hasCustomSNI) writer.string(profile.sni);
  if (hasCustomFlow) writer.string(profile.flow);
  if (publicKey) writer.realityKey(publicKey);
  if (shortID) writer.shortID(shortID);
  if (hasCustomFingerprint) writer.string(profile.fingerprint);
  if (hasCustomSpiderX) writer.string(profile.spiderX);
  if (profile.muxMaxSessions > 0) writer.varUInt(profile.muxMaxSessions);
  if (profile.muxMaxStreamsPerSession > 0) writer.varUInt(profile.muxMaxStreamsPerSession);
  if (profile.muxWarmSpare > 0) writer.varUInt(profile.muxWarmSpare);
  if (extensions & (1 << 5)) writer.varUInt(profile.initialStreamWindow);
  if (extensions & (1 << 6)) writer.varUInt(profile.maxStreamWindow);
  if (extensions & (1 << 7)) writer.varUInt(profile.initialConnectionWindow);
  if (extensions & (1 << 8)) writer.varUInt(profile.maxConnectionWindow);
  if (hasCustomName) writer.string(name);
  return writer.result();
}

function decodeCompactProfile(data: Uint8Array, t3: boolean): CompactProfile {
  const reader = new CompactReader(data, t3 ? "T3" : "T2");
  const header0 = reader.byte();
  const header1 = reader.byte();
  const header2 = reader.byte();
  const protocol = PROTOCOLS[header0 & 0x03];
  const transport = TRANSPORTS[(header0 >> 2) & 0x03];
  const security = SECURITIES[(header0 >> 4) & 0x03];
  let networkCode = header1 & 0x03;
  let extensions = 0;
  if (networkCode === 3 && t3) {
    extensions = reader.varUInt();
    if (!extensions || (extensions & ~0x1ff) !== 0 || (extensions & 0x03) === 3 || (extensions & ~0x03) === 0) {
      throw new Error("Unsupported T3 extension flags");
    }
    networkCode = extensions & 0x03;
  } else if (networkCode === 3) {
    throw new Error("Unsupported T2 network code");
  }
  const muxUDPMode = t3 ? ["", "reliable", "auto", "datagram"][(extensions >> 2) & 0x03] : "";
  const muxModeBits = (header1 >> 3) & 0x03;
  if (muxModeBits === 3) throw new Error(`Unsupported ${t3 ? "T3" : "T2"} mux mode`);
  const muxMode = muxModeBits === 1 ? "group" : muxModeBits === 2 ? "quic" : "";
  if (t3 && (extensions & (1 << 4)) && (protocol !== "vless" || security !== "reality" || (header2 & 1))) {
    throw new Error("Invalid T3 explicit empty flow marker");
  }
  if (t3 && (extensions & 0x1ec) && (!(header0 & 0x80) || muxMode !== "quic")) {
    throw new Error("T3 QUIC mux extension requires quic mux mode");
  }

  const port = reader.port();
  const credential = reader.credential();
  const host = reader.host();
  if (!host.trim()) throw new Error(`${t3 ? "T3" : "T2"} host cannot be empty`);
  const path = header1 & 0x20 ? reader.string() : DEFAULT_PATH;
  const sni = header1 & 0x40 ? reader.string() : security ? host : "";
  const flow = header2 & 1
    ? reader.string()
    : protocol === "vless" && security === "reality" && !(extensions & (1 << 4))
      ? DEFAULT_VLESS_FLOW
      : "";
  const publicKey = header2 & 0x02 ? reader.realityKey() : "";
  const shortID = header2 & 0x04 ? reader.shortID() : "";
  const fingerprint =
    security === "reality" || security === "reality-quic"
      ? header2 & 0x08 ? reader.string() : DEFAULT_FINGERPRINT
      : "";
  const spiderX = security === "reality" ? (header2 & 0x10 ? reader.string() : DEFAULT_SPIDER_X) : "";
  const muxMaxSessions = header2 & 0x20 ? reader.varUInt() : 0;
  const muxMaxStreamsPerSession = header2 & 0x40 ? reader.varUInt() : 0;
  const muxWarmSpare = header2 & 0x80 ? reader.varUInt() : 0;
  const initialStreamWindow = readPositiveExtension(reader, extensions, 5, "initial stream receive window");
  const maxStreamWindow = readPositiveExtension(reader, extensions, 6, "max stream receive window");
  const initialConnectionWindow = readPositiveExtension(reader, extensions, 7, "initial connection receive window");
  const maxConnectionWindow = readPositiveExtension(reader, extensions, 8, "max connection receive window");
  let name = host;
  if (header1 & 0x80) name = reader.string() || host;
  reader.end();

  return {
    protocol, transport, security, tlsInsecure: Boolean(header0 & 0x40), mux: Boolean(header0 & 0x80),
    networkCode, upstreamMixed: Boolean(header1 & 0x04), muxMode, path, sni, name, flow,
    publicKey, shortID, fingerprint, spiderX, muxMaxSessions, muxMaxStreamsPerSession,
    muxWarmSpare, muxUDPMode, flowExplicitEmpty: Boolean(extensions & (1 << 4)),
    initialStreamWindow, maxStreamWindow, initialConnectionWindow, maxConnectionWindow,
    port, credential, host,
  };
}

function readPositiveExtension(reader: CompactReader, extensions: number, bit: number, label: string): number {
  if (!(extensions & (1 << bit))) return 0;
  const value = reader.varUInt();
  if (!value) throw new Error(`Non-canonical T3 ${label}`);
  return value;
}

function outboundFromProfile(profile: CompactProfile, tag: string): TcptunOutbound {
  const outbound: TcptunOutbound = {
    tag,
    type: profile.protocol,
    address: [joinHostPort(profile.host, profile.port)],
    network: decodeNetworks(profile.networkCode),
    transport: { type: profile.transport, path: profile.path },
  };
  if (profile.flow) outbound.flow = profile.flow;
  if (profile.protocol === "vless" || profile.protocol === "vmess") outbound.uuid = profile.credential;
  else if (profile.protocol === "trojan") outbound.password = profile.credential;
  else outbound.token = profile.credential;
  if (profile.security === "tls") {
    outbound.security = {
      type: "tls",
      server_name: profile.sni,
      ...(profile.tlsInsecure ? { insecure: true } : {}),
    };
  } else if (profile.security === "reality" || profile.security === "reality-quic") {
    outbound.security = {
      type: profile.security,
      server_name: profile.sni,
      fingerprint: profile.fingerprint,
      public_key: profile.publicKey,
      short_id: profile.shortID,
      ...(profile.spiderX ? { spider_x: profile.spiderX } : {}),
    };
  }
  if (profile.mux) {
    outbound.mux = {
      ...(profile.muxMode ? { mode: profile.muxMode } : {}),
      ...(profile.muxUDPMode ? { udp_mode: profile.muxUDPMode } : {}),
      ...(profile.muxMaxSessions ? { max_sessions: profile.muxMaxSessions } : {}),
      ...(profile.muxMaxStreamsPerSession
        ? { max_streams_per_session: profile.muxMaxStreamsPerSession }
        : {}),
      ...(profile.muxWarmSpare ? { warm_spares: profile.muxWarmSpare } : {}),
      ...(profile.initialStreamWindow
        ? { initial_stream_receive_window: profile.initialStreamWindow }
        : {}),
      ...(profile.maxStreamWindow ? { max_stream_receive_window: profile.maxStreamWindow } : {}),
      ...(profile.initialConnectionWindow
        ? { initial_connection_receive_window: profile.initialConnectionWindow }
        : {}),
      ...(profile.maxConnectionWindow
        ? { max_connection_receive_window: profile.maxConnectionWindow }
        : {}),
    };
  }
  return outbound;
}

class CompactWriter {
  private data: number[] = [];

  byte(value: number) { this.data.push(value & 0xff); }

  varUInt(value: number) {
    let remaining = value >>> 0;
    do {
      let part = remaining & 0x7f;
      remaining >>>= 7;
      if (remaining) part |= 0x80;
      this.byte(part);
    } while (remaining);
  }

  string(value: string) {
    const data = new TextEncoder().encode(value);
    this.varUInt(data.length);
    this.data.push(...data);
  }

  port(port: number) {
    if (port === 443) this.byte(0);
    else if (port === 9443) this.byte(1);
    else {
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("T3 port must be 1–65535");
      this.byte(2);
      this.byte(port >> 8);
      this.byte(port);
    }
  }

  credential(protocol: string, value: string) {
    if (value !== value.trim()) throw new Error("T3 cannot preserve credential leading/trailing whitespace");
    const uuid = protocol === "vless" || protocol === "vmess" ? parseUUID(value) : null;
    if (uuid) {
      this.byte(0);
      this.data.push(...uuid);
    } else {
      this.byte(1);
      this.string(value);
    }
  }

  host(value: string) {
    const host = value.trim().replace(/^\[|]$/g, "");
    const ip = parseIP(host);
    if (ip?.length === 4) {
      this.byte(0);
      this.data.push(...ip);
      return;
    }
    if (ip?.length === 16) {
      this.byte(1);
      this.data.push(...ip);
      return;
    }
    const lower = host.toLowerCase();
    const suffixIndex = SUFFIXES.findIndex((suffix) => lower.endsWith(suffix));
    if (suffixIndex >= 0) {
      this.byte(2 + suffixIndex);
      this.string(host.slice(0, -SUFFIXES[suffixIndex].length));
    } else {
      this.byte(2 + SUFFIXES.length);
      this.string(host);
    }
  }

  realityKey(value: string) {
    const decoded = decodeAnyBase64(value);
    if (decoded?.length === 32) {
      this.byte(0);
      this.data.push(...decoded);
    } else {
      this.byte(1);
      this.string(value);
    }
  }

  shortID(value: string) {
    const bytes = value.length >= 2 && value.length <= 32 && value.length % 2 === 0 ? decodeHex(value) : null;
    if (bytes) {
      this.byte(bytes.length);
      this.data.push(...bytes);
    } else {
      this.byte(0);
      this.string(value);
    }
  }

  result() { return Uint8Array.from(this.data); }
}

class CompactReader {
  private offset = 0;
  private data: Uint8Array;
  private label: string;

  constructor(data: Uint8Array, label: string) {
    this.data = data;
    this.label = label;
  }

  byte(): number {
    if (this.offset >= this.data.length) throw new Error(`${this.label} payload is truncated`);
    return this.data[this.offset++];
  }

  varUInt(): number {
    let value = 0;
    for (let index = 0; index < 5; index++) {
      const part = this.byte();
      if (index === 4 && (part & 0xf0)) throw new Error(`${this.label} integer is too large`);
      value += (part & 0x7f) * 2 ** (7 * index);
      if (!(part & 0x80)) {
        if (index > 0 && part === 0) throw new Error(`Non-canonical ${this.label} integer`);
        if (value > MAX_INT32) throw new Error(`${this.label} integer exceeds int32`);
        return value;
      }
    }
    throw new Error(`${this.label} integer is too large`);
  }

  string(): string {
    const data = this.bytes(this.varUInt());
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(data);
    } catch {
      throw new Error(`${this.label} string is not valid UTF-8`);
    }
  }

  port(): number {
    const kind = this.byte();
    if (kind === 0) return 443;
    if (kind === 1) return 9443;
    if (kind !== 2) throw new Error(`Invalid ${this.label} port encoding`);
    const port = (this.byte() << 8) | this.byte();
    if (!port) throw new Error(`Invalid ${this.label} port`);
    return port;
  }

  credential(): string {
    const kind = this.byte();
    if (kind === 0) return formatUUID(this.bytes(16));
    if (kind === 1) return this.string();
    throw new Error(`Invalid ${this.label} credential encoding`);
  }

  host(): string {
    const kind = this.byte();
    if (kind === 0) return [...this.bytes(4)].join(".");
    if (kind === 1) return formatIPv6(this.bytes(16));
    if (kind >= 2 && kind < 2 + SUFFIXES.length) return this.string() + SUFFIXES[kind - 2];
    if (kind === 2 + SUFFIXES.length) return this.string();
    throw new Error(`Invalid ${this.label} host encoding`);
  }

  realityKey(): string {
    const kind = this.byte();
    if (kind === 0) return encodeBase64Url(this.bytes(32));
    if (kind === 1) return this.string();
    throw new Error(`Invalid ${this.label} REALITY key encoding`);
  }

  shortID(): string {
    const length = this.byte();
    if (!length) return this.string();
    if (length > 16) throw new Error(`Invalid ${this.label} short ID length`);
    return encodeHex(this.bytes(length));
  }

  bytes(length: number): Uint8Array {
    if (length < 0 || length > this.data.length - this.offset) throw new Error(`${this.label} field is truncated`);
    const value = this.data.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  end() {
    if (this.offset !== this.data.length) throw new Error(`${this.label} contains unexpected trailing data`);
  }
}

function encodeNetworks(networks: string[] | undefined): number {
  if (!networks?.length) return 0;
  let tcp = false;
  let udp = false;
  networks.forEach((value, index) => {
    const network = value.trim().toLowerCase();
    if (network === "tcp") tcp = true;
    else if (network === "udp") udp = true;
    else throw new Error(`T3 network[${index}] does not support ${value}`);
  });
  if (tcp && udp) return 0;
  if (tcp) return 1;
  if (udp) return 2;
  throw new Error("T3 network cannot be empty");
}

function decodeNetworks(code: number): string[] {
  return code === 1 ? ["tcp"] : code === 2 ? ["udp"] : ["tcp", "udp"];
}

function outboundCredential(outbound: TcptunOutbound, protocol: string): string {
  if (protocol === "vless" || protocol === "vmess") {
    if (outbound.password || outbound.token) throw new Error(`T3 ${protocol} profile contains credentials from another protocol`);
    return outbound.uuid || "";
  }
  if (protocol === "trojan") {
    if (outbound.uuid || outbound.token) throw new Error("T3 Trojan profile contains credentials from another protocol");
    return outbound.password || "";
  }
  if (outbound.uuid || outbound.password) throw new Error("T3 Native profile contains credentials from another protocol");
  return outbound.token || "";
}

function splitEndpoint(value: string): { host: string; port: number } {
  const text = value.trim();
  const bracket = /^\[([^\]]+)]:(\d+)$/.exec(text);
  const plain = /^([^:]+):(\d+)$/.exec(text);
  const match = bracket || plain;
  if (!match) throw new Error(`Invalid T3 outbound address: ${value}`);
  const port = Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("T3 port must be 1–65535");
  if (!match[1]) throw new Error("T3 host cannot be empty");
  return { host: match[1], port };
}

function joinHostPort(host: string, port: number): string {
  return host.includes(":") ? `[${host}]:${port}` : `${host}:${port}`;
}

function hasDuration(value: string | number | undefined): boolean {
  return typeof value === "number" ? value !== 0 : Boolean(value);
}

function parseUUID(value: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) return null;
  return decodeHex(value.replaceAll("-", ""));
}

function formatUUID(value: Uint8Array): string {
  const hex = encodeHex(value);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function decodeHex(value: string): Uint8Array | null {
  if (value.length % 2 || !/^[0-9a-fA-F]*$/.test(value)) return null;
  const data = new Uint8Array(value.length / 2);
  for (let index = 0; index < data.length; index++) data[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return data;
}

function encodeHex(value: Uint8Array): string {
  return [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decodeAnyBase64(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeBase45(data: Uint8Array): string {
  let output = "";
  let index = 0;
  for (; index + 1 < data.length; index += 2) {
    const value = (data[index] << 8) | data[index + 1];
    output += BASE45[value % 45] + BASE45[Math.floor(value / 45) % 45] + BASE45[Math.floor(value / 2025)];
  }
  if (index < data.length) output += BASE45[data[index] % 45] + BASE45[Math.floor(data[index] / 45)];
  return output;
}

function decodeBase45(value: string): Uint8Array {
  if (!value) throw new Error("Base45 payload is empty");
  if (value.length % 3 === 1) throw new Error("Invalid Base45 payload length");
  const output: number[] = [];
  for (let index = 0; index < value.length;) {
    const remaining = value.length - index;
    const first = base45Digit(value[index]);
    const second = base45Digit(value[index + 1]);
    if (remaining >= 3) {
      const combined = first + second * 45 + base45Digit(value[index + 2]) * 2025;
      if (combined > 0xffff) throw new Error("Invalid Base45 group");
      output.push(combined >> 8, combined & 0xff);
      index += 3;
    } else {
      const combined = first + second * 45;
      if (combined > 0xff) throw new Error("Invalid Base45 tail");
      output.push(combined);
      index += 2;
    }
  }
  return Uint8Array.from(output);
}

function base45Digit(value: string): number {
  const digit = BASE45.indexOf(value);
  if (digit < 0) throw new Error(`Invalid Base45 character: ${value}`);
  return digit;
}

function parseIP(value: string): Uint8Array | null {
  if (/^\d+(?:\.\d+){3}$/.test(value)) {
    const parts = value.split(".").map(Number);
    if (parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) return Uint8Array.from(parts);
    return null;
  }
  if (!value.includes(":") || value.includes("%")) return null;
  let source = value;
  const ipv4 = /(?:^|:)(\d+(?:\.\d+){3})$/.exec(source);
  let ipv4Words: string[] = [];
  if (ipv4) {
    const bytes = parseIP(ipv4[1]);
    if (!bytes) return null;
    ipv4Words = [((bytes[0] << 8) | bytes[1]).toString(16), ((bytes[2] << 8) | bytes[3]).toString(16)];
    source = source.slice(0, -ipv4[1].length) + ipv4Words.join(":");
  }
  const halves = source.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];
  if (words.length !== 8 || words.some((word) => !/^[0-9a-fA-F]{1,4}$/.test(word))) return null;
  const output = new Uint8Array(16);
  words.forEach((word, index) => {
    const number = Number.parseInt(word, 16);
    output[index * 2] = number >> 8;
    output[index * 2 + 1] = number & 0xff;
  });
  return output;
}

function formatIPv6(data: Uint8Array): string {
  const words = Array.from({ length: 8 }, (_, index) => (data[index * 2] << 8) | data[index * 2 + 1]);
  let bestStart = -1;
  let bestLength = 0;
  for (let index = 0; index < words.length;) {
    if (words[index] !== 0) { index++; continue; }
    let end = index;
    while (end < words.length && words[end] === 0) end++;
    if (end - index > bestLength && end - index >= 2) { bestStart = index; bestLength = end - index; }
    index = end;
  }
  if (bestStart < 0) return words.map((word) => word.toString(16)).join(":");
  const left = words.slice(0, bestStart).map((word) => word.toString(16)).join(":");
  const right = words.slice(bestStart + bestLength).map((word) => word.toString(16)).join(":");
  return `${left}::${right}`;
}
