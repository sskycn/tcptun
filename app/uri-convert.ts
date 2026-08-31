import { decodeProfilePayload, encodeT3 } from "./profile-t3";

export type TunnelProtocol = "native";

function assertNativeProtocol(protocol: string) {
  if (protocol !== "native") {
    throw new Error(
      `${protocol} URIs are not supported. tcptun v0.4.2 tunnel endpoints are native only.`,
    );
  }
}

export type UriExportScope = "outbounds" | "inbounds";

export type UriExportResult = {
  uriText: string;
  profileText: string;
  profileWarnings: string[];
  count: number;
  summary: string;
};

export type UriImportOptions = {
  client?: boolean;
  localListen?: string;
  localPort?: number;
};

export type UriImportResult = {
  configJson: string;
  count: number;
  summary: string;
};

export type TcptunTransport = {
  type?: string;
  path?: string;
};

export type TcptunSecurity = {
  type?: string;
  server_name?: string;
  server_names?: string[];
  fingerprint?: string;
  public_key?: string;
  private_key?: string;
  short_id?: string;
  short_ids?: string[];
  dest?: string;
  spider_x?: string;
  max_time_diff?: string | number;
  cert?: string;
  key?: string;
  insecure?: boolean;
};

export type TcptunMux = {
  /** @deprecated Prefer carrier.mode — kept for legacy URI/T3 decode. */
  mode?: string;
  /** @deprecated Prefer carrier.udp_mode. */
  udp_mode?: string;
  enabled?: boolean;
  resume?: boolean;
  resume_timeout?: string | number;
  resume_buffer_size?: number;
  max_sessions?: number;
  max_streams_per_session?: number;
  warm_spares?: number;
  initial_stream_receive_window?: number;
  max_stream_receive_window?: number;
  initial_connection_receive_window?: number;
  max_connection_receive_window?: number;
};

/** v0.2.5+ / v0.3.0 carrier selection (separate from mux pooling). */
export type TcptunCarrier = {
  mode?: string;
  udp_mode?: string;
  initial_stream_receive_window?: number;
  max_stream_receive_window?: number;
  initial_connection_receive_window?: number;
  max_connection_receive_window?: number;
};

export type TcptunOutbound = {
  tag: string;
  type: string;
  address?: string[];
  via?: string;
  username?: string;
  password?: string;
  uuid?: string;
  token?: string;
  flow?: string;
  network?: string[];
  transport?: TcptunTransport;
  security?: TcptunSecurity;
  carrier?: TcptunCarrier;
  mux?: TcptunMux | null;
  discover?: boolean;
  members?: Array<{ outbound: string; weight?: number }>;
  affinity_ttl?: string | number;
  expose?: Array<{ service: string; network?: string; target: string }>;
  primary?: string;
  fallback?: string;
  probe_timeout?: string | number;
  negative_ttl?: string | number;
  positive_ttl?: string | number;
  failure_threshold?: number;
};

type TcptunUser = { id?: string; password?: string; flow?: string };

type TcptunInbound = {
  tag: string;
  type: string;
  address?: string[];
  network?: string[];
  users?: TcptunUser[];
  transport?: TcptunTransport;
  security?: TcptunSecurity;
  carrier?: TcptunCarrier;
  mux?: TcptunMux | null;
};

type JsonObject = Record<string, unknown>;

const URI_PROTOCOLS = new Set<TunnelProtocol>(["native"]);
const NATIVE_URI_PARAMETERS = new Set([
  "v",
  "protocol",
  "type",
  "transport",
  "network",
  "path",
  "security",
  "sni",
  "serverName",
  "fp",
  "pbk",
  "sid",
  "spx",
  "flow",
  "mux",
  // v0.3.0 carrier selection (replaces mux_mode / mux_udp_mode for new URIs)
  "carrier_mode",
  "carrier_udp_mode",
  // Legacy aliases still accepted when importing older URIs
  "mux_mode",
  "mux_udp_mode",
  "mux_max_sessions",
  "mux_max_streams_per_session",
  "mux_warm_spares",
  "mux_resume",
  "mux_resume_timeout",
  "mux_resume_buffer_size",
  "insecure",
]);

export async function configToUris(
  raw: string,
  options: { scope?: UriExportScope; name?: string } = {},
): Promise<UriExportResult> {
  const value = parseJson(raw);
  const scope = options.scope || "outbounds";
  const name = options.name?.trim() || "tcptun";
  const endpoints =
    scope === "inbounds"
      ? await outboundsFromConfigInbounds(value)
      : outboundsFromConfigOutbounds(value);

  if (endpoints.length === 0) {
    throw new Error(
      scope === "inbounds"
        ? "No tunnel inbound in the config can be exported as a URI"
        : "No tunnel outbound in the config can be exported as a URI",
    );
  }

  const uris = endpoints.map((outbound) => {
    const displayName = endpoints.length === 1 ? name : `${name}-${outbound.tag}`;
    return buildOutboundUri(outbound, displayName);
  });
  const profiles: string[] = [];
  const profileWarnings: string[] = [];
  endpoints.forEach((outbound) => {
    const displayName = endpoints.length === 1 ? name : `${name}-${outbound.tag}`;
    try {
      profiles.push(encodeT3(outbound, displayName));
    } catch (error) {
      const message = error instanceof Error ? error.message : "cannot be represented as T3";
      profileWarnings.push(`${displayName}: ${message}`);
    }
  });

  return {
    uriText: uris.join("\n"),
    profileText: profiles.join("\n"),
    profileWarnings,
    count: uris.length,
    summary: `Generated URIs from ${uris.length} ${scope === "inbounds" ? "inbound addresses" : "outbound addresses"}`,
  };
}

export function urisToConfig(raw: string, options: UriImportOptions = {}): UriImportResult {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Paste at least one URI");

  const outbounds = lines.map((line, index) => parseOutboundUri(line, uniqueProxyTag(index)));
  const client = options.client !== false;
  let output: unknown = outbounds.length === 1 ? outbounds[0] : outbounds;

  if (client) {
    const localListen = options.localListen?.trim() || "127.0.0.1";
    const localPort = options.localPort ?? 1080;
    assertPort(localPort, "Local port");
    const defaultOutbound = outbounds[0].tag;
    const networks = outbounds[0].network?.length ? [...outbounds[0].network] : ["tcp", "udp"];
    output = {
      log: { level: "info" },
      inbounds: [
        {
          tag: "local",
          type: "mixed",
          address: [joinHostPort(localListen, localPort)],
          network: networks,
          transport: {},
          security: {},
        },
      ],
      outbounds,
      route: { default_outbound: defaultOutbound },
      dns: {},
    };
  }

  return {
    configJson: JSON.stringify(output, null, 2),
    count: outbounds.length,
    summary: `Generated ${client ? "a client config" : " outbound config"} from ${outbounds.length} share endpoints`,
  };
}

function resolvedCarrierMode(carrier: TcptunCarrier, mux: TcptunMux, securityType = ""): string {
  const fromCarrier = (carrier.mode || "").trim().toLowerCase();
  if (fromCarrier) return fromCarrier === "group" ? "tcp" : fromCarrier;
  const fromMux = (mux.mode || "").trim().toLowerCase();
  if (fromMux === "quic") return "quic";
  if (fromMux === "group" || fromMux === "tcp") return "tcp";
  if (securityType === "reality-quic") return "quic";
  if (securityType === "reality-tcp") return "tcp";
  return "";
}

export function buildOutboundUri(outbound: TcptunOutbound, name = "tcptun"): string {
  const protocol = normalizedProtocol(outbound.type);
  assertNativeProtocol(protocol);
  validateRepresentable(outbound);
  const { server, port } = outboundEndpoint(outbound);
  const transport = outbound.transport || {};
  const security = outbound.security || {};
  const mux = outbound.mux || {};
  const carrier = outbound.carrier || {};
  const muxEnabled = outbound.mux != null;
  const securityType = (security.type || "").trim().toLowerCase();
  const carrierMode = resolvedCarrierMode(carrier, mux, securityType);
  const carrierUdpMode = (carrier.udp_mode || mux.udp_mode || "").trim().toLowerCase();
  const isReality =
    securityType === "reality" || securityType === "reality-tcp" || securityType === "reality-quic";

  const credential = requiredCredential(outbound.token, "Native token");
  const query = new URLSearchParams();
  query.set("v", "1");
  query.set("type", transport.type || "raw");
  if (outbound.network?.length) query.set("network", outbound.network.join(","));
  if (transport.path) query.set("path", transport.path);

  if (securityType === "tls") {
    query.set("security", "tls");
    if (security.server_name) query.set("sni", security.server_name);
  } else if (isReality) {
    // v0.3.0: always emit security=reality; physical path goes in carrier_mode.
    query.set("security", "reality");
    query.set("sni", security.server_name || "");
    query.set("fp", security.fingerprint || "");
    query.set("pbk", security.public_key || "");
    query.set("sid", security.short_id || "");
    if (security.spider_x) query.set("spx", security.spider_x);
  }
  if (security.insecure) query.set("insecure", "true");
  if (outbound.flow) query.set("flow", outbound.flow);
  if (protocol === "native" || muxEnabled) query.set("mux", String(muxEnabled));
  // v0.3.0 URI: carrier_mode / carrier_udp_mode (not mux_mode).
  if (carrierMode) query.set("carrier_mode", carrierMode);
  if (carrierUdpMode) query.set("carrier_udp_mode", carrierUdpMode);
  if (positiveInteger(mux.max_sessions)) query.set("mux_max_sessions", String(mux.max_sessions));
  if (positiveInteger(mux.max_streams_per_session)) {
    query.set("mux_max_streams_per_session", String(mux.max_streams_per_session));
  }
  if (positiveInteger(mux.warm_spares)) query.set("mux_warm_spares", String(mux.warm_spares));
  if (mux.resume) query.set("mux_resume", "true");
  if (hasDuration(mux.resume_timeout)) query.set("mux_resume_timeout", String(mux.resume_timeout));
  if (positiveInteger(mux.resume_buffer_size)) {
    query.set("mux_resume_buffer_size", String(mux.resume_buffer_size));
  }

  const host = server.includes(":") ? `[${server}]` : server;
  const fragment = name ? `#${encodeURIComponent(name)}` : "";
  return `${protocol}://${encodeURIComponent(credential)}@${host}:${port}?${query.toString()}${fragment}`;
}

export function parseOutboundUri(text: string, tag = "proxy"): TcptunOutbound {
  const value = text.trim();
  if (!value) throw new Error("URI cannot be empty");
  if (/^(vless|vmess|trojan):\/\//i.test(value)) {
    throw new Error("vless / vmess / trojan URIs are not supported; tunnel endpoints are native only");
  }
  if (value.startsWith("T3:") || value.startsWith("T2:")) {
    return decodeProfilePayload(value, tag).outbound;
  }

  let uri: URL;
  try {
    uri = new URL(value);
  } catch {
    throw new Error("Invalid URI format");
  }
  const query = uri.searchParams;
  if (query.has("mode")) throw new Error("The mode query parameter is no longer supported; configure routing in JSON");

  let protocol = uri.protocol.replace(/:$/, "").toLowerCase();
  if (protocol === "native" || protocol === "tcptun") {
    validateNativeQuery(query);
    const version = query.get("v")?.trim();
    if (version && version !== "1") throw new Error(`Unsupported tcptun URI version ${version}`);
    const legacyProtocol = query.get("protocol")?.trim().toLowerCase();
    if (legacyProtocol && legacyProtocol !== "native") {
      throw new Error(`tcptun URI protocol must be native, not ${legacyProtocol}`);
    }
    protocol = "native";
  }
  if (protocol !== "native") {
    throw new Error(`Unsupported URI protocol ${protocol || "(empty)"}`);
  }

  const port = Number(uri.port);
  assertPort(port, "URI port");
  const server = uri.hostname.replace(/^\[|\]$/g, "");
  if (!server) throw new Error("URI is missing a host");
  const transport: TcptunTransport = {
    type: query.get("type") || query.get("transport") || "raw",
  };
  const path = query.get("path");
  if (path) transport.path = path;

  const outbound: TcptunOutbound = {
    tag,
    type: protocol,
    address: [joinHostPort(server, port)],
    transport,
  };
  const networkText = query.get("network")?.trim();
  if (networkText) outbound.network = parseNetworkList(networkText);
  const flow = query.get("flow");
  if (flow) outbound.flow = flow;

  const mux = optionalBoolean(query.get("mux"), "mux");
  const muxConfig: TcptunMux = {};
  setOptionalInteger(muxConfig, "max_sessions", query.get("mux_max_sessions"));
  setOptionalInteger(muxConfig, "max_streams_per_session", query.get("mux_max_streams_per_session"));
  setOptionalInteger(muxConfig, "warm_spares", query.get("mux_warm_spares"));
  setOptionalBoolean(muxConfig, "resume", query.get("mux_resume"));
  setOptionalText(muxConfig, "resume_timeout", query.get("mux_resume_timeout"));
  setOptionalInteger(muxConfig, "resume_buffer_size", query.get("mux_resume_buffer_size"));
  const hasMuxFields = Object.keys(muxConfig).length > 0;
  if (mux === true || (mux === undefined && hasMuxFields)) {
    outbound.mux = { enabled: true, ...muxConfig };
  } else if (mux === false) {
    // omit mux
  } else if (hasMuxFields) {
    outbound.mux = { enabled: true, ...muxConfig };
  }

  const carrier: TcptunCarrier = {};
  const carrierMode =
    (query.get("carrier_mode") || query.get("mux_mode") || "").trim().toLowerCase();
  const carrierUdpMode =
    (query.get("carrier_udp_mode") || query.get("mux_udp_mode") || "").trim().toLowerCase();
  if (carrierMode) {
    if (carrierMode !== "auto" && carrierMode !== "tcp" && carrierMode !== "quic" && carrierMode !== "group") {
      throw new Error(`Unsupported carrier_mode ${carrierMode}`);
    }
    // Legacy mux_mode=group maps to carrier tcp mux pool naming in v0.3 docs.
    carrier.mode = carrierMode === "group" ? "tcp" : carrierMode;
  }
  if (carrierUdpMode) carrier.udp_mode = carrierUdpMode;
  if (Object.keys(carrier).length > 0) outbound.carrier = carrier;

  const insecure = optionalBoolean(query.get("insecure"), "insecure");
  const securityType = (query.get("security") || "none").trim().toLowerCase();
  const sni = query.get("sni") || query.get("serverName") || "";
  if (securityType === "tls") {
    outbound.security = {
      type: "tls",
      ...(sni ? { server_name: sni } : {}),
      ...(insecure ? { insecure: true } : {}),
    };
  } else if (
    securityType === "reality" ||
    securityType === "reality-tcp" ||
    securityType === "reality-quic"
  ) {
    // Prefer explicit carrier_mode; legacy reality-tcp / reality-quic remain representable.
    let resolvedSecurity = securityType;
    if (securityType === "reality-tcp" || securityType === "reality-quic") {
      resolvedSecurity = "reality";
      if (!outbound.carrier?.mode) {
        outbound.carrier = {
          ...(outbound.carrier || {}),
          mode: securityType === "reality-quic" ? "quic" : "tcp",
        };
      }
    }
    const includeSpider =
      resolvedSecurity === "reality" && (outbound.carrier?.mode || "auto") !== "quic";
    outbound.security = {
      type: resolvedSecurity,
      server_name: sni,
      fingerprint: query.get("fp") || "",
      public_key: query.get("pbk") || "",
      short_id: query.get("sid") || "",
      ...(includeSpider ? { spider_x: query.get("spx") || "" } : {}),
      ...(insecure ? { insecure: true } : {}),
    };
  } else if (securityType !== "none" && securityType !== "") {
    outbound.security = { type: securityType };
  } else if (insecure) {
    outbound.security = { insecure: true };
  }

  const username = decodeUserInfo(uri.username);
  outbound.token = requiredCredential(username, "Native token");
  return outbound;
}

function outboundsFromConfigOutbounds(value: unknown): TcptunOutbound[] {
  const candidates = Array.isArray(value)
    ? value
    : isObject(value) && Array.isArray(value.outbounds)
      ? value.outbounds
      : isObject(value) && typeof value.type === "string"
        ? [value]
        : [];
  const result: TcptunOutbound[] = [];
  candidates
    .filter(isObject)
    .filter((item) => isUriProtocol(String(item.type || "")))
    .forEach((item, index) => {
      const outbound = asOutbound(item, index);
      const addresses = normalizeAddressList(outbound.address, outbound.tag, "outbound");
      addresses.forEach((address, addressIndex) => {
        const tag =
          addresses.length === 1
            ? outbound.tag
            : `${outbound.tag}-${addressIndex + 1}`;
        result.push({ ...outbound, tag, address: [address] });
      });
    });
  return result;
}

async function outboundsFromConfigInbounds(value: unknown): Promise<TcptunOutbound[]> {
  const candidates = isObject(value) && Array.isArray(value.inbounds)
    ? value.inbounds
    : isObject(value) && typeof value.type === "string"
      ? [value]
      : [];
  const inbounds = candidates
    .filter(isObject)
    .filter((item) => isUriProtocol(String(item.type || "")))
    .map((item, index) => asInbound(item, index));
  const outbounds: TcptunOutbound[] = [];
  for (const inbound of inbounds) {
    const addresses = inboundAddresses(inbound);
    for (const [index, address] of addresses.entries()) {
      const outbound = await outboundFromInbound(inbound, address);
      if (addresses.length > 1) outbound.tag = `${inbound.tag}-${index + 1}`;
      outbounds.push(outbound);
    }
  }
  return outbounds;
}

async function outboundFromInbound(
  inbound: TcptunInbound,
  address: string,
): Promise<TcptunOutbound> {
  if (inbound.users?.length !== 1) {
    throw new Error(`inbound ${inbound.tag} must contain exactly one user when exporting a URI`);
  }
  const user = inbound.users[0];
  const protocol = normalizedProtocol(inbound.type);
  const outbound: TcptunOutbound = {
    tag: inbound.tag,
    type: protocol,
    address: [address],
    ...(inbound.network?.length ? { network: [...inbound.network] } : {}),
    transport: {
      type: inbound.transport?.type,
      path: inbound.transport?.path,
    },
    ...(inbound.carrier ? { carrier: { ...inbound.carrier } } : {}),
    ...(inbound.mux != null ? { mux: { ...(inbound.mux || {}) } } : {}),
  };
  if (user.flow) outbound.flow = user.flow;
  outbound.token = user.id;

  const security = inbound.security || {};
  const securityType = (security.type || "").toLowerCase();
  if (
    securityType === "reality" ||
    securityType === "reality-tcp" ||
    securityType === "reality-quic"
  ) {
    if (!security.private_key) throw new Error(`inbound ${inbound.tag} is missing REALITY private_key`);
    if (!security.server_names?.length) throw new Error(`inbound ${inbound.tag} is missing REALITY server_names`);
    outbound.security = {
      type: securityType,
      server_name: security.server_names[0],
      fingerprint: "chrome",
      public_key: x25519PublicKey(security.private_key),
      short_id: security.short_ids?.[0] || "",
      ...(securityType === "reality" || securityType === "reality-tcp" ? { spider_x: "/" } : {}),
    };
  } else if (securityType === "tls") {
    outbound.security = {
      type: "tls",
      ...(security.server_name ? { server_name: security.server_name } : {}),
    };
  } else if (security.type) {
    outbound.security = { type: security.type };
  }
  return outbound;
}

function inboundAddresses(inbound: TcptunInbound): string[] {
  return normalizeAddressList(inbound.address, inbound.tag, "inbound");
}

function normalizeAddressList(
  address: string[] | undefined,
  tag: string,
  kind: string,
): string[] {
  if (!Array.isArray(address) || address.length === 0) {
    throw new Error(`${kind} ${tag} is missing an address array`);
  }
  const seen = new Set<string>();
  const result: string[] = [];
  address.forEach((value, index) => {
    const text = String(value || "").trim();
    if (!text) throw new Error(`${kind} ${tag} address[${index}] cannot be empty`);
    // validate host:port
    splitAddress(text);
    if (seen.has(text)) return;
    seen.add(text);
    result.push(text);
  });
  return result;
}

function validateRepresentable(outbound: TcptunOutbound) {
  if (outbound.via) throw new Error(`outbound ${outbound.tag} uses via; URIs cannot represent outbound chains`);
  if (outbound.username) throw new Error(`outbound ${outbound.tag} username cannot be written into a tunnel URI`);
  if (
    outbound.discover ||
    outbound.primary ||
    outbound.fallback ||
    outbound.probe_timeout ||
    outbound.negative_ttl ||
    outbound.positive_ttl ||
    outbound.failure_threshold
  ) {
    throw new Error(`outbound ${outbound.tag} discovery or policy fields cannot be written into a URI`);
  }
  const security = outbound.security || {};
  if (security.cert || security.key) {
    throw new Error(`outbound ${outbound.tag} certificate or key files cannot be written into a URI`);
  }
  if (security.type && !["none", "tls", "reality", "reality-tcp", "reality-quic", ""].includes(security.type)) {
    throw new Error(`outbound ${outbound.tag} security.type=${security.type} cannot be written into a URI`);
  }
  if (
    security.server_names?.length ||
    security.private_key ||
    security.short_ids?.length ||
    security.dest ||
    security.max_time_diff
  ) {
    throw new Error(`outbound ${outbound.tag} contains server-side security fields and cannot be written into a client URI`);
  }
  if (outbound.password || outbound.uuid) {
    throw new Error(`outbound ${outbound.tag} contains non-Native credentials`);
  }
}

function validateNativeQuery(query: URLSearchParams) {
  for (const key of new Set(query.keys())) {
    if (!NATIVE_URI_PARAMETERS.has(key)) throw new Error(`Unsupported tcptun URI parameter ${key}`);
    if (query.getAll(key).length !== 1) throw new Error(`tcptun URI parameter ${key} can appear only once`);
  }
}

function parseJson(raw: string): unknown {
  if (!raw.trim()) throw new Error("Paste a tcptun config JSON");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Config is not valid JSON");
  }
}

function asOutbound(value: JsonObject, index: number): TcptunOutbound {
  const outbound = { ...(value as TcptunOutbound), tag: String(value.tag || `proxy${index + 1}`) };
  // normalize legacy server/port if still present in pasted JSON
  if ((!outbound.address || outbound.address.length === 0) && value.server != null && value.port != null) {
    outbound.address = [joinHostPort(String(value.server), Number(value.port))];
  }
  // normalize address if it was a single string
  if (typeof value.address === "string") {
    outbound.address = [value.address];
  }
  // normalize legacy transport.tls into security.tls
  const transport = (value.transport || {}) as JsonObject;
  if (transport.tls && !outbound.security?.type) {
    outbound.security = {
      type: "tls",
      ...(transport.server_name ? { server_name: String(transport.server_name) } : {}),
      ...(transport.insecure ? { insecure: true } : {}),
      ...(transport.cert ? { cert: String(transport.cert) } : {}),
      ...(transport.key ? { key: String(transport.key) } : {}),
    };
  }
  if (outbound.transport) {
    outbound.transport = {
      type: outbound.transport.type,
      path: outbound.transport.path,
    };
  }
  // legacy mux.enabled: true → mux object; enabled:false → omit
  if (isObject(value.mux) && "enabled" in value.mux) {
    const enabled = Boolean(value.mux.enabled);
    if (!enabled) {
      outbound.mux = undefined;
    } else {
      const { enabled: _enabled, ...rest } = value.mux as JsonObject;
      void _enabled;
      outbound.mux = { enabled: true, ...(rest as TcptunMux) };
    }
  }
  if (isObject(value.carrier)) {
    outbound.carrier = { ...(value.carrier as TcptunCarrier) };
  }
  return outbound;
}

function asInbound(value: JsonObject, index: number): TcptunInbound {
  const inbound = { ...(value as TcptunInbound), tag: String(value.tag || `server${index + 1}`) };
  if ((!inbound.address || inbound.address.length === 0) && (value.listen != null || value.port != null)) {
    const host = String(value.listen || "0.0.0.0");
    const port = Number(value.port);
    if (Number.isInteger(port)) inbound.address = [joinHostPort(host, port)];
  }
  if (typeof value.address === "string") {
    inbound.address = [value.address];
  }
  const transport = (value.transport || {}) as JsonObject;
  if (transport.tls && !inbound.security?.type) {
    inbound.security = {
      ...(inbound.security || {}),
      type: "tls",
      ...(transport.server_name ? { server_name: String(transport.server_name) } : {}),
      ...(transport.cert ? { cert: String(transport.cert) } : {}),
      ...(transport.key ? { key: String(transport.key) } : {}),
    };
  }
  if (inbound.transport) {
    inbound.transport = {
      type: inbound.transport.type,
      path: inbound.transport.path,
    };
  }
  if (isObject(value.mux) && "enabled" in value.mux) {
    const enabled = Boolean(value.mux.enabled);
    if (!enabled) {
      inbound.mux = undefined;
    } else {
      const { enabled: _enabled, ...rest } = value.mux as JsonObject;
      void _enabled;
      inbound.mux = { enabled: true, ...(rest as TcptunMux) };
    }
  }
  if (isObject(value.carrier)) {
    inbound.carrier = { ...(value.carrier as TcptunCarrier) };
  }
  return inbound;
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedProtocol(value: string): TunnelProtocol {
  const protocol = value.trim().toLowerCase();
  if (!isUriProtocol(protocol)) throw new Error(`URI does not support protocol ${value || "(empty)"}`);
  return protocol;
}

function isUriProtocol(value: string): value is TunnelProtocol {
  return URI_PROTOCOLS.has(value.trim().toLowerCase() as TunnelProtocol);
}

function outboundEndpoint(outbound: TcptunOutbound): { server: string; port: number } {
  const addresses = outbound.address;
  if (!addresses || addresses.length !== 1) {
    throw new Error(`outbound ${outbound.tag} address must contain exactly 1 item when exporting a URI`);
  }
  return splitAddress(addresses[0]);
}

function splitAddress(address: string): { server: string; port: number } {
  const text = address.trim();
  const bracket = /^\[([^\]]+)]:(\d+)$/.exec(text);
  const plain = /^(.*):(\d+)$/.exec(text);
  const match = bracket || plain;
  if (!match || !match[1]) throw new Error(`Address ${address} must include host and port`);
  const port = Number(match[2]);
  assertPort(port, "Address port");
  return { server: match[1].replace(/^\[|\]$/g, ""), port };
}

function joinHostPort(host: string, port: number): string {
  const normalized = host.trim().replace(/^\[|\]$/g, "");
  if (normalized.includes(":") && !normalized.startsWith("[")) {
    return `[${normalized}]:${port}`;
  }
  return `${normalized}:${port}`;
}

function assertPort(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${label} must be 1–65535`);
}

function requiredCredential(value: string | undefined, label: string): string {
  if (!value) throw new Error(`${label} cannot be empty`);
  return value;
}

function positiveInteger(value: number | undefined): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function hasDuration(value: string | number | undefined): boolean {
  return typeof value === "number" ? value !== 0 : Boolean(value?.trim());
}

function parseNetworkList(value: string): string[] {
  const items = value.split(",").map((item) => item.trim().toLowerCase());
  if (items.some((item) => !item)) throw new Error("URI network contains empty values");
  return items;
}

function optionalBoolean(value: string | null, label: string): boolean | undefined {
  if (value === null || value === "") return undefined;
  const normalized = value.toLowerCase();
  if (["1", "t", "true"].includes(normalized)) return true;
  if (["0", "f", "false"].includes(normalized)) return false;
  throw new Error(`URI ${label} must be a boolean`);
}

function setOptionalText<T extends object, K extends keyof T>(target: T, key: K, value: string | null) {
  if (value) target[key] = value as T[K];
}

function setOptionalBoolean<T extends object, K extends keyof T>(target: T, key: K, value: string | null) {
  if (value === null || value === "") return;
  target[key] = optionalBoolean(value, String(key)) as T[K];
}

function setOptionalInteger<T extends object, K extends keyof T>(target: T, key: K, value: string | null) {
  if (value === null || value === "") return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`URI ${String(key)} must be a non-negative integer`);
  target[key] = parsed as T[K];
}

function uniqueProxyTag(index: number): string {
  return index === 0 ? "proxy" : `proxy-${index + 1}`;
}

function decodeUserInfo(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("URI credential percent-encoding is invalid");
  }
}

function decodeBase64UrlBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  let binary: string;
  try {
    binary = atob(normalized + padding);
  } catch {
    throw new Error("REALITY private_key is not valid Base64URL");
  }
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// RFC 7748 Montgomery ladder; used only to derive an inbound REALITY public key for URI export.
function x25519PublicKey(privateKey: string): string {
  const scalar = decodeBase64UrlBytes(privateKey.trim());
  if (scalar.length !== 32) throw new Error("REALITY private_key must be 32 bytes");
  const clamped = new Uint8Array(scalar);
  clamped[0] &= 248;
  clamped[31] &= 127;
  clamped[31] |= 64;
  let k = BigInt(0);
  for (let index = 31; index >= 0; index -= 1) k = (k << BigInt(8)) + BigInt(clamped[index]);

  const p = (BigInt(1) << BigInt(255)) - BigInt(19);
  const a24 = BigInt(121665);
  const x1 = BigInt(9);
  let x2 = BigInt(1);
  let z2 = BigInt(0);
  let x3 = x1;
  let z3 = BigInt(1);
  let swap = BigInt(0);
  for (let position = 254; position >= 0; position -= 1) {
    const bit = (k >> BigInt(position)) & BigInt(1);
    swap ^= bit;
    [x2, x3] = conditionalSwap(swap, x2, x3);
    [z2, z3] = conditionalSwap(swap, z2, z3);
    swap = bit;
    const a = mod(x2 + z2, p);
    const aa = mod(a * a, p);
    const b = mod(x2 - z2, p);
    const bb = mod(b * b, p);
    const e = mod(aa - bb, p);
    const c = mod(x3 + z3, p);
    const d = mod(x3 - z3, p);
    const da = mod(d * a, p);
    const cb = mod(c * b, p);
    x3 = mod((da + cb) * (da + cb), p);
    z3 = mod(x1 * (da - cb) * (da - cb), p);
    x2 = mod(aa * bb, p);
    z2 = mod(e * (aa + a24 * e), p);
  }
  [x2, x3] = conditionalSwap(swap, x2, x3);
  [z2, z3] = conditionalSwap(swap, z2, z3);
  const result = mod(x2 * modPow(z2, p - BigInt(2), p), p);
  const bytes = new Uint8Array(32);
  let value = result;
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number(value & BigInt(255));
    value >>= BigInt(8);
  }
  return bytesToBase64Url(bytes);
}

function conditionalSwap(swap: bigint, left: bigint, right: bigint): [bigint, bigint] {
  const mask = -swap;
  const value = mask & (left ^ right);
  return [left ^ value, right ^ value];
}

function mod(value: bigint, modulus: bigint): bigint {
  const result = value % modulus;
  return result >= BigInt(0) ? result : result + modulus;
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = BigInt(1);
  let factor = mod(base, modulus);
  let power = exponent;
  while (power > BigInt(0)) {
    if (power & BigInt(1)) result = mod(result * factor, modulus);
    factor = mod(factor * factor, modulus);
    power >>= BigInt(1);
  }
  return result;
}
