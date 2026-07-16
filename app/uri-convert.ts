export type TunnelProtocol = "native" | "vless" | "vmess" | "trojan";

export type UriExportScope = "outbounds" | "inbounds";

export type UriExportResult = {
  uriText: string;
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
  tls?: boolean;
  cert?: string;
  key?: string;
  server_name?: string;
  insecure?: boolean;
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
};

export type TcptunMux = {
  enabled?: boolean;
  mode?: string;
  udp_mode?: string;
  max_sessions?: number;
  max_streams_per_session?: number;
  warm_spares?: number;
};

export type TcptunOutbound = {
  tag: string;
  type: string;
  server?: string;
  port?: number;
  address?: string;
  via?: string;
  username?: string;
  password?: string;
  uuid?: string;
  token?: string;
  flow?: string;
  network?: string[];
  transport?: TcptunTransport;
  security?: TcptunSecurity;
  mux?: TcptunMux;
  discover?: boolean;
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
  listen?: string;
  listen_addresses?: string[];
  port?: number;
  address?: string;
  network?: string[];
  users?: TcptunUser[];
  transport?: TcptunTransport;
  security?: TcptunSecurity;
  mux?: TcptunMux;
};

type JsonObject = Record<string, unknown>;

const URI_PROTOCOLS = new Set<TunnelProtocol>(["native", "vless", "vmess", "trojan"]);
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
  "mux_mode",
  "mux_udp_mode",
  "mux_max_sessions",
  "mux_max_streams_per_session",
  "mux_warm_spares",
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
        ? "配置中没有可导出 URI 的 tunnel inbound"
        : "配置中没有可导出 URI 的 tunnel outbound",
    );
  }

  const uris = endpoints.map((outbound) => {
    const displayName = endpoints.length === 1 ? name : `${name}-${outbound.tag}`;
    return buildOutboundUri(outbound, displayName);
  });

  return {
    uriText: uris.join("\n"),
    count: uris.length,
    summary: `已从 ${uris.length} 个 ${scope === "inbounds" ? "inbound" : "outbound"} 生成 URI`,
  };
}

export function urisToConfig(raw: string, options: UriImportOptions = {}): UriImportResult {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("请粘贴至少一条 URI");

  const outbounds = lines.map((line, index) => parseOutboundUri(line, uniqueProxyTag(index)));
  const client = options.client !== false;
  let output: unknown = outbounds.length === 1 ? outbounds[0] : outbounds;

  if (client) {
    const localListen = options.localListen?.trim() || "127.0.0.1";
    const localPort = options.localPort ?? 1080;
    assertPort(localPort, "本地端口");
    const defaultOutbound = outbounds[0].tag;
    const networks = outbounds[0].network?.length ? [...outbounds[0].network] : ["tcp", "udp"];
    output = {
      log: { level: "info" },
      inbounds: [
        {
          tag: "local",
          type: "mixed",
          listen: localListen,
          port: localPort,
          network: networks,
          outbound: defaultOutbound,
        },
      ],
      outbounds,
      route: { default_outbound: defaultOutbound, rules: [] as unknown[] },
    };
  }

  return {
    configJson: JSON.stringify(output, null, 2),
    count: outbounds.length,
    summary: `已从 ${outbounds.length} 条 URI 生成${client ? "客户端配置" : " outbound 配置"}`,
  };
}

export function buildOutboundUri(outbound: TcptunOutbound, name = "tcptun"): string {
  const protocol = normalizedProtocol(outbound.type);
  validateRepresentable(outbound, protocol);
  const { server, port } = outboundEndpoint(outbound);
  const transport = outbound.transport || {};
  const security = outbound.security || {};
  const mux = outbound.mux || {};

  if (protocol === "vmess") {
    const payload = {
      v: "2",
      ps: name,
      add: server,
      port: String(port),
      id: requiredCredential(outbound.uuid, "VMess uuid"),
      aid: "0",
      scy: "auto",
      net: transport.type || "raw",
      type: "none",
      host: "",
      path: transport.path || "",
      tls: security.type === "reality" ? "reality" : transport.tls ? "tls" : "",
      ...(security.type === "reality"
        ? {
            sni: security.server_name || "",
            fp: security.fingerprint || "",
            pbk: security.public_key || "",
            sid: security.short_id || "",
            spx: security.spider_x || "",
          }
        : transport.server_name
          ? { sni: transport.server_name }
          : {}),
      ...(transport.insecure ? { allowInsecure: true } : {}),
      ...(mux.enabled ? { tcptun_mux: true } : {}),
      ...(mux.mode ? { tcptun_mux_mode: mux.mode } : {}),
      ...(mux.udp_mode ? { tcptun_mux_udp_mode: mux.udp_mode } : {}),
      ...(positiveInteger(mux.max_sessions)
        ? { tcptun_mux_max_sessions: mux.max_sessions }
        : {}),
      ...(positiveInteger(mux.max_streams_per_session)
        ? { tcptun_mux_max_streams_per_session: mux.max_streams_per_session }
        : {}),
      ...(positiveInteger(mux.warm_spares) ? { tcptun_mux_warm_spares: mux.warm_spares } : {}),
      ...(outbound.network?.length ? { tcptun_network: outbound.network.join(",") } : {}),
      ...(outbound.flow ? { tcptun_flow: outbound.flow } : {}),
    };
    return `vmess://${utf8ToBase64Raw(JSON.stringify(payload))}`;
  }

  const credential =
    protocol === "vless"
      ? requiredCredential(outbound.uuid, "VLESS uuid")
      : protocol === "trojan"
        ? requiredCredential(outbound.password, "Trojan password")
        : requiredCredential(outbound.token, "Native token");
  const query = new URLSearchParams();
  if (protocol === "native") query.set("v", "1");
  if (protocol === "vless") query.set("encryption", "none");
  query.set("type", transport.type || "raw");
  if (outbound.network?.length) query.set("network", outbound.network.join(","));
  if (transport.path) query.set("path", transport.path);

  if (transport.tls) {
    query.set("security", "tls");
    if (transport.server_name) query.set("sni", transport.server_name);
  } else if (security.type !== "reality" && transport.server_name) {
    query.set("sni", transport.server_name);
  }
  if (transport.insecure) query.set("insecure", "true");

  if (security.type === "reality") {
    query.set("security", "reality");
    query.set("sni", security.server_name || "");
    query.set("fp", security.fingerprint || "");
    query.set("pbk", security.public_key || "");
    query.set("sid", security.short_id || "");
    if (security.spider_x) query.set("spx", security.spider_x);
  }
  if (outbound.flow) query.set("flow", outbound.flow);
  if (protocol === "native" || mux.enabled) query.set("mux", String(Boolean(mux.enabled)));
  if (mux.mode) query.set("mux_mode", mux.mode);
  if (mux.udp_mode) query.set("mux_udp_mode", mux.udp_mode);
  if (positiveInteger(mux.max_sessions)) query.set("mux_max_sessions", String(mux.max_sessions));
  if (positiveInteger(mux.max_streams_per_session)) {
    query.set("mux_max_streams_per_session", String(mux.max_streams_per_session));
  }
  if (positiveInteger(mux.warm_spares)) query.set("mux_warm_spares", String(mux.warm_spares));

  const host = server.includes(":") ? `[${server}]` : server;
  const fragment = name ? `#${encodeURIComponent(name)}` : "";
  return `${protocol}://${encodeURIComponent(credential)}@${host}:${port}?${query.toString()}${fragment}`;
}

export function parseOutboundUri(text: string, tag = "proxy"): TcptunOutbound {
  const value = text.trim();
  if (!value) throw new Error("URI 不能为空");
  if (value.toLowerCase().startsWith("vmess://")) return parseVmessUri(value, tag);

  let uri: URL;
  try {
    uri = new URL(value);
  } catch {
    throw new Error("URI 格式无效");
  }
  const query = uri.searchParams;
  if (query.has("mode")) throw new Error("URI 已不支持 mode 参数，请在 JSON 中配置路由");

  let protocol = uri.protocol.replace(/:$/, "").toLowerCase();
  if (protocol === "native" || protocol === "tcptun") {
    validateNativeQuery(query);
    const version = query.get("v")?.trim();
    if (version && version !== "1") throw new Error(`不支持的 tcptun URI 版本 ${version}`);
    const legacyProtocol = query.get("protocol")?.trim().toLowerCase();
    if (legacyProtocol && legacyProtocol !== "native") {
      throw new Error(`tcptun URI protocol 必须是 native，不能是 ${legacyProtocol}`);
    }
    protocol = "native";
  }
  if (protocol !== "native" && protocol !== "vless" && protocol !== "trojan") {
    throw new Error(`不支持的 URI 协议 ${protocol || "(空)"}`);
  }

  const port = Number(uri.port);
  assertPort(port, "URI 端口");
  const server = uri.hostname.replace(/^\[|\]$/g, "");
  if (!server) throw new Error("URI 缺少主机地址");
  const transport: TcptunTransport = {
    type: query.get("type") || query.get("transport") || "raw",
  };
  const path = query.get("path");
  if (path) transport.path = path;
  const insecure = optionalBoolean(query.get("insecure"), "insecure");
  if (insecure) transport.insecure = true;

  const outbound: TcptunOutbound = {
    tag,
    type: protocol,
    server,
    port,
    transport,
    mux: {},
  };
  const networkText = query.get("network")?.trim();
  if (networkText) outbound.network = parseNetworkList(networkText);
  const flow = query.get("flow");
  if (flow) outbound.flow = flow;

  const mux = optionalBoolean(query.get("mux"), "mux");
  if (mux !== undefined) outbound.mux!.enabled = mux;
  setOptionalText(outbound.mux!, "mode", query.get("mux_mode"));
  setOptionalText(outbound.mux!, "udp_mode", query.get("mux_udp_mode"));
  setOptionalInteger(outbound.mux!, "max_sessions", query.get("mux_max_sessions"));
  setOptionalInteger(
    outbound.mux!,
    "max_streams_per_session",
    query.get("mux_max_streams_per_session"),
  );
  setOptionalInteger(outbound.mux!, "warm_spares", query.get("mux_warm_spares"));

  const securityType = (query.get("security") || "none").trim().toLowerCase();
  const sni = query.get("sni") || query.get("serverName") || "";
  if (securityType === "tls") {
    transport.tls = true;
    if (sni) transport.server_name = sni;
  } else if (securityType === "reality") {
    outbound.security = {
      type: "reality",
      server_name: sni,
      fingerprint: query.get("fp") || "",
      public_key: query.get("pbk") || "",
      short_id: query.get("sid") || "",
      spider_x: query.get("spx") || "",
    };
  } else if (securityType === "none" || securityType === "") {
    if (sni) transport.server_name = sni;
  } else {
    outbound.security = { type: securityType };
  }

  const username = decodeUserInfo(uri.username);
  const password = decodeUserInfo(uri.password);
  if (protocol === "vless") outbound.uuid = requiredCredential(username, "VLESS uuid");
  else if (protocol === "trojan") {
    outbound.password = requiredCredential(password || username, "Trojan password");
  } else outbound.token = requiredCredential(username, "Native token");
  return outbound;
}

function parseVmessUri(text: string, tag: string): TcptunOutbound {
  let source: JsonObject;
  try {
    const decoded = decodeBase64Flexible(text.slice("vmess://".length).trim());
    const parsed = JSON.parse(decoded);
    if (!isObject(parsed)) throw new Error();
    source = parsed;
  } catch {
    throw new Error("VMess URI payload 不是有效的 Base64 JSON");
  }
  const port = Number(source.port);
  assertPort(port, "VMess URI 端口");
  const server = String(source.add || "").trim();
  if (!server) throw new Error("VMess URI 缺少服务器地址");
  const outbound: TcptunOutbound = {
    tag,
    type: "vmess",
    server,
    port,
    uuid: requiredCredential(String(source.id || ""), "VMess uuid"),
    transport: {
      type: String(source.net || "raw"),
      ...(source.path ? { path: String(source.path) } : {}),
      ...(source.allowInsecure ? { insecure: true } : {}),
    },
    mux: {
      ...(source.tcptun_mux ? { enabled: true } : {}),
      ...(source.tcptun_mux_mode ? { mode: String(source.tcptun_mux_mode) } : {}),
      ...(source.tcptun_mux_udp_mode ? { udp_mode: String(source.tcptun_mux_udp_mode) } : {}),
    },
  };
  setSourceInteger(outbound.mux!, "max_sessions", source.tcptun_mux_max_sessions);
  setSourceInteger(
    outbound.mux!,
    "max_streams_per_session",
    source.tcptun_mux_max_streams_per_session,
  );
  setSourceInteger(outbound.mux!, "warm_spares", source.tcptun_mux_warm_spares);
  if (source.tcptun_network) outbound.network = parseNetworkList(String(source.tcptun_network));
  if (source.tcptun_flow) outbound.flow = String(source.tcptun_flow);

  const security = String(source.tls || "").toLowerCase();
  if (security === "reality") {
    outbound.security = {
      type: "reality",
      server_name: String(source.sni || ""),
      fingerprint: String(source.fp || ""),
      public_key: String(source.pbk || ""),
      short_id: String(source.sid || ""),
      spider_x: String(source.spx || ""),
    };
  } else if (security && security !== "none") {
    outbound.transport!.tls = true;
    if (source.sni) outbound.transport!.server_name = String(source.sni);
  }
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
  return candidates
    .filter(isObject)
    .filter((item) => isUriProtocol(String(item.type || "")))
    .map((item, index) => asOutbound(item, index));
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
    for (const address of addresses) outbounds.push(await outboundFromInbound(inbound, address));
  }
  return outbounds;
}

async function outboundFromInbound(
  inbound: TcptunInbound,
  address: { server: string; port: number },
): Promise<TcptunOutbound> {
  if (inbound.users?.length !== 1) {
    throw new Error(`inbound ${inbound.tag} 导出 URI 时必须且只能包含一个用户`);
  }
  const user = inbound.users[0];
  const protocol = normalizedProtocol(inbound.type);
  const outbound: TcptunOutbound = {
    tag: inbound.tag,
    type: protocol,
    server: address.server,
    port: address.port,
    ...(inbound.network?.length ? { network: [...inbound.network] } : {}),
    transport: {
      type: inbound.transport?.type,
      path: inbound.transport?.path,
      tls: inbound.transport?.tls,
      server_name: inbound.transport?.server_name,
      insecure: inbound.transport?.insecure,
    },
    mux: { ...(inbound.mux || {}) },
  };
  if (user.flow) outbound.flow = user.flow;
  if (protocol === "vless" || protocol === "vmess") outbound.uuid = user.id;
  else if (protocol === "trojan") outbound.password = user.password;
  else outbound.token = user.id;

  const security = inbound.security || {};
  if ((security.type || "").toLowerCase() === "reality") {
    if (!security.private_key) throw new Error(`inbound ${inbound.tag} 缺少 REALITY private_key`);
    if (!security.server_names?.length) throw new Error(`inbound ${inbound.tag} 缺少 REALITY server_names`);
    outbound.security = {
      type: "reality",
      server_name: security.server_names[0],
      fingerprint: "chrome",
      public_key: x25519PublicKey(security.private_key),
      short_id: security.short_ids?.[0] || "",
      spider_x: "/",
    };
  } else if (security.type) {
    outbound.security = { type: security.type };
  }
  return outbound;
}

function inboundAddresses(inbound: TcptunInbound): Array<{ server: string; port: number }> {
  if (inbound.address?.trim()) return [splitAddress(inbound.address)];
  assertPort(Number(inbound.port), `inbound ${inbound.tag} 端口`);
  const hosts = [...(inbound.listen_addresses || [])];
  if (inbound.listen?.trim()) hosts.push(inbound.listen.trim());
  if (hosts.length === 0) throw new Error(`inbound ${inbound.tag} 缺少监听地址`);
  return [...new Set(hosts)].map((server) => ({ server: server.replace(/^\[|\]$/g, ""), port: Number(inbound.port) }));
}

function validateRepresentable(outbound: TcptunOutbound, protocol: TunnelProtocol) {
  if (outbound.via) throw new Error(`outbound ${outbound.tag} 使用了 via，URI 无法表示出口链`);
  if (outbound.username) throw new Error(`outbound ${outbound.tag} 的 username 无法写入 tunnel URI`);
  if (
    outbound.discover ||
    outbound.primary ||
    outbound.fallback ||
    outbound.probe_timeout ||
    outbound.negative_ttl ||
    outbound.positive_ttl ||
    outbound.failure_threshold
  ) {
    throw new Error(`outbound ${outbound.tag} 的发现或策略字段无法写入 URI`);
  }
  if (outbound.transport?.cert || outbound.transport?.key) {
    throw new Error(`outbound ${outbound.tag} 的证书或密钥文件无法写入 URI`);
  }
  const security = outbound.security || {};
  if (security.type && security.type !== "none" && security.type !== "reality") {
    throw new Error(`outbound ${outbound.tag} 的 security.type=${security.type} 无法写入 URI`);
  }
  if (
    security.server_names?.length ||
    security.private_key ||
    security.short_ids?.length ||
    security.dest ||
    security.max_time_diff
  ) {
    throw new Error(`outbound ${outbound.tag} 含服务端 REALITY 字段，无法写入客户端 URI`);
  }
  if (protocol === "native" && (outbound.password || outbound.uuid)) {
    throw new Error(`outbound ${outbound.tag} 包含非 Native 凭据`);
  }
  if ((protocol === "vless" || protocol === "vmess") && (outbound.password || outbound.token)) {
    throw new Error(`outbound ${outbound.tag} 包含非 ${protocol.toUpperCase()} 凭据`);
  }
  if (protocol === "trojan" && (outbound.uuid || outbound.token)) {
    throw new Error(`outbound ${outbound.tag} 包含非 Trojan 凭据`);
  }
}

function validateNativeQuery(query: URLSearchParams) {
  for (const key of new Set(query.keys())) {
    if (!NATIVE_URI_PARAMETERS.has(key)) throw new Error(`不支持的 tcptun URI 参数 ${key}`);
    if (query.getAll(key).length !== 1) throw new Error(`tcptun URI 参数 ${key} 只能出现一次`);
  }
}

function parseJson(raw: string): unknown {
  if (!raw.trim()) throw new Error("请粘贴 tcptun 配置 JSON");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("配置不是合法 JSON");
  }
}

function asOutbound(value: JsonObject, index: number): TcptunOutbound {
  return { ...(value as TcptunOutbound), tag: String(value.tag || `proxy${index + 1}`) };
}

function asInbound(value: JsonObject, index: number): TcptunInbound {
  return { ...(value as TcptunInbound), tag: String(value.tag || `server${index + 1}`) };
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedProtocol(value: string): TunnelProtocol {
  const protocol = value.trim().toLowerCase();
  if (!isUriProtocol(protocol)) throw new Error(`URI 不支持协议 ${value || "(空)"}`);
  return protocol;
}

function isUriProtocol(value: string): value is TunnelProtocol {
  return URI_PROTOCOLS.has(value.trim().toLowerCase() as TunnelProtocol);
}

function outboundEndpoint(outbound: TcptunOutbound): { server: string; port: number } {
  if (outbound.address?.trim()) {
    if (outbound.server || outbound.port) throw new Error(`outbound ${outbound.tag} 的 address 不能和 server/port 并用`);
    return splitAddress(outbound.address);
  }
  const server = outbound.server?.trim() || "";
  if (!server) throw new Error(`outbound ${outbound.tag} 缺少 server`);
  assertPort(Number(outbound.port), `outbound ${outbound.tag} 端口`);
  return { server: server.replace(/^\[|\]$/g, ""), port: Number(outbound.port) };
}

function splitAddress(address: string): { server: string; port: number } {
  const text = address.trim();
  const bracket = /^\[([^\]]+)]:(\d+)$/.exec(text);
  const plain = /^(.*):(\d+)$/.exec(text);
  const match = bracket || plain;
  if (!match || !match[1]) throw new Error(`地址 ${address} 必须包含主机和端口`);
  const port = Number(match[2]);
  assertPort(port, "地址端口");
  return { server: match[1].replace(/^\[|\]$/g, ""), port };
}

function assertPort(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${label}需为 1–65535`);
}

function requiredCredential(value: string | undefined, label: string): string {
  if (!value) throw new Error(`${label} 不能为空`);
  return value;
}

function positiveInteger(value: number | undefined): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function parseNetworkList(value: string): string[] {
  const items = value.split(",").map((item) => item.trim().toLowerCase());
  if (items.some((item) => !item)) throw new Error("URI network 包含空值");
  return items;
}

function optionalBoolean(value: string | null, label: string): boolean | undefined {
  if (value === null || value === "") return undefined;
  const normalized = value.toLowerCase();
  if (["1", "t", "true"].includes(normalized)) return true;
  if (["0", "f", "false"].includes(normalized)) return false;
  throw new Error(`URI ${label} 必须是布尔值`);
}

function setOptionalText<T extends object, K extends keyof T>(target: T, key: K, value: string | null) {
  if (value) target[key] = value as T[K];
}

function setOptionalInteger<T extends object, K extends keyof T>(target: T, key: K, value: string | null) {
  if (value === null || value === "") return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`URI ${String(key)} 必须是非负整数`);
  target[key] = parsed as T[K];
}

function setSourceInteger<T extends object, K extends keyof T>(target: T, key: K, value: unknown) {
  if (value === undefined || value === null || value === "" || value === 0) return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`VMess URI ${String(key)} 必须是非负整数`);
  target[key] = parsed as T[K];
}

function uniqueProxyTag(index: number): string {
  return index === 0 ? "proxy" : `proxy-${index + 1}`;
}

function decodeUserInfo(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("URI 凭据的百分号编码无效");
  }
}

function utf8ToBase64Raw(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=+$/g, "");
}

function decodeBase64Flexible(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function decodeBase64UrlBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  let binary: string;
  try {
    binary = atob(normalized + padding);
  } catch {
    throw new Error("REALITY private_key 不是有效的 Base64URL");
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
  if (scalar.length !== 32) throw new Error("REALITY private_key 必须是 32 字节");
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
