import { downloadText } from "./generate-config";

export type ConvertOptions = {
  localListen?: string;
  localPort?: number;
  /** Prefer this outbound tag when multiple proxies exist. */
  preferredOutboundTag?: string;
};

export type ConvertResult = {
  clientJson: string | null;
  serverJson: string | null;
  warnings: string[];
  summary: string;
};

type JsonObject = Record<string, unknown>;

type TcptunOutbound = {
  tag: string;
  type: string;
  server?: string;
  port?: number;
  uuid?: string;
  password?: string;
  token?: string;
  flow?: string;
  network?: string[];
  transport?: {
    type?: string;
    path?: string;
    tls?: boolean;
    server_name?: string;
    insecure?: boolean;
    cert?: string;
    key?: string;
  };
  security?: {
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
    max_time_diff?: string;
  };
  mux?: { enabled?: boolean };
};

type TcptunInbound = {
  tag: string;
  type: string;
  listen?: string;
  port?: number;
  network?: string[];
  users?: Array<{ id?: string; password?: string; flow?: string }>;
  transport?: TcptunOutbound["transport"];
  security?: TcptunOutbound["security"];
  mux?: { enabled?: boolean };
  outbound?: string;
};

const SAMPLE_XRAY = `{
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "proxy.example.com",
            "port": 443,
            "users": [
              {
                "id": "00000000-0000-4000-8000-000000000000",
                "encryption": "none",
                "flow": "xtls-rprx-vision"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "serverName": "example.com",
          "fingerprint": "chrome",
          "publicKey": "REPLACE_WITH_SERVER_PUBLIC_KEY",
          "shortId": "00",
          "spiderX": "/"
        }
      }
    },
    { "tag": "direct", "protocol": "freedom" }
  ]
}`;

export function sampleXrayConfig(): string {
  return SAMPLE_XRAY;
}

export { downloadText };

export function convertXrayInput(raw: string, options: ConvertOptions = {}): ConvertResult {
  const text = raw.trim();
  if (!text) {
    throw new Error("请粘贴 Xray 配置 JSON 或分享链接");
  }

  const warnings: string[] = [];
  const localListen = options.localListen?.trim() || "127.0.0.1";
  const localPort = options.localPort && options.localPort > 0 ? options.localPort : 1080;

  // Share links (one or more lines)
  if (looksLikeShareLinks(text)) {
    const outbounds: TcptunOutbound[] = [];
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    lines.forEach((line, index) => {
      try {
        outbounds.push(parseShareLink(line, uniqueTag("proxy", index, outbounds)));
      } catch (err) {
        warnings.push(`第 ${index + 1} 行链接无法解析：${err instanceof Error ? err.message : String(err)}`);
      }
    });

    if (outbounds.length === 0) {
      throw new Error("未能从分享链接中解析出可用的隧道出口");
    }

    const client = buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: `已从 ${outbounds.length} 条分享链接生成客户端配置`,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("输入既不是合法 JSON，也不像分享链接");
  }

  if (Array.isArray(data)) {
    // Array of outbounds or mixed
    const outbounds: TcptunOutbound[] = [];
    data.forEach((item, index) => {
      if (!isObject(item)) return;
      if (isXrayOutbound(item)) {
        try {
          outbounds.push(convertXrayOutbound(item, uniqueTag(String(item.tag || "proxy"), index, outbounds), warnings));
        } catch (err) {
          warnings.push(`outbounds[${index}] 跳过：${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });
    if (outbounds.length === 0) throw new Error("数组中没有可转换的 Xray outbound");
    const client = buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: `已转换 ${outbounds.length} 个出口`,
    };
  }

  if (!isObject(data)) {
    throw new Error("JSON 根节点必须是对象或数组");
  }

  // Single outbound object
  if (isXrayOutbound(data) && !Array.isArray(data.outbounds) && !Array.isArray(data.inbounds)) {
    const outbound = convertXrayOutbound(data, String(data.tag || "proxy"), warnings);
    const client = buildClientConfig([outbound], localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: "已转换单个 outbound",
    };
  }

  // Single inbound object
  if (isXrayInbound(data) && !Array.isArray(data.outbounds) && !Array.isArray(data.inbounds)) {
    const inbound = convertXrayInbound(data, String(data.tag || "server"), warnings);
    const server = buildServerConfig([inbound], warnings);
    return {
      clientJson: null,
      serverJson: pretty(server),
      warnings,
      summary: "已转换单个 inbound",
    };
  }

  const xrayOutbounds = Array.isArray(data.outbounds) ? data.outbounds : [];
  const xrayInbounds = Array.isArray(data.inbounds) ? data.inbounds : [];

  const outbounds: TcptunOutbound[] = [];
  xrayOutbounds.forEach((item, index) => {
    if (!isObject(item)) return;
    if (!isTunnelProtocol(String(item.protocol || ""))) {
      if (String(item.protocol || "") && !["freedom", "blackhole", "dns", "loopback", "block"].includes(String(item.protocol))) {
        warnings.push(`outbound ${item.tag || index}（${item.protocol}）暂不支持，已跳过`);
      }
      return;
    }
    try {
      outbounds.push(
        convertXrayOutbound(item, uniqueTag(String(item.tag || "proxy"), index, outbounds), warnings),
      );
    } catch (err) {
      warnings.push(`outbound ${item.tag || index} 跳过：${err instanceof Error ? err.message : String(err)}`);
    }
  });

  const inbounds: TcptunInbound[] = [];
  xrayInbounds.forEach((item, index) => {
    if (!isObject(item)) return;
    if (!isTunnelProtocol(String(item.protocol || ""))) {
      return;
    }
    try {
      inbounds.push(
        convertXrayInbound(item, uniqueTag(String(item.tag || "server"), index, inbounds), warnings),
      );
    } catch (err) {
      warnings.push(`inbound ${item.tag || index} 跳过：${err instanceof Error ? err.message : String(err)}`);
    }
  });

  if (outbounds.length === 0 && inbounds.length === 0) {
    throw new Error("未找到可转换的 VLESS / VMess / Trojan 入站或出站");
  }

  const clientJson =
    outbounds.length > 0
      ? pretty(buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings))
      : null;
  const serverJson = inbounds.length > 0 ? pretty(buildServerConfig(inbounds, warnings)) : null;

  const parts: string[] = [];
  if (outbounds.length) parts.push(`${outbounds.length} 个出口`);
  if (inbounds.length) parts.push(`${inbounds.length} 个入口`);

  return {
    clientJson,
    serverJson,
    warnings,
    summary: `已转换 ${parts.join("、")}`,
  };
}

function looksLikeShareLinks(text: string): boolean {
  const first = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || "";
  return /^(vless|vmess|trojan|ss):\/\//i.test(first);
}

function isTunnelProtocol(protocol: string): boolean {
  const value = protocol.toLowerCase();
  return value === "vless" || value === "vmess" || value === "trojan";
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isXrayOutbound(value: JsonObject): boolean {
  return typeof value.protocol === "string" && value.protocol.length > 0;
}

function isXrayInbound(value: JsonObject): boolean {
  return typeof value.protocol === "string" && (value.port !== undefined || value.listen !== undefined || value.settings !== undefined);
}

function convertXrayOutbound(source: JsonObject, tag: string, warnings: string[]): TcptunOutbound {
  const protocol = String(source.protocol).toLowerCase();
  if (!isTunnelProtocol(protocol)) {
    throw new Error(`不支持的协议 ${protocol}`);
  }

  const settings = isObject(source.settings) ? source.settings : {};
  const stream = isObject(source.streamSettings) ? source.streamSettings : {};
  const muxEnabled = isObject(source.mux) ? Boolean(source.mux.enabled) : false;

  let server = "";
  let port = 0;
  let uuid = "";
  let password = "";
  let flow = "";

  if (protocol === "trojan") {
    const servers = Array.isArray(settings.servers) ? settings.servers : [];
    const first = isObject(servers[0]) ? servers[0] : null;
    if (!first) throw new Error("trojan settings.servers 缺失");
    server = String(first.address || first.ip || "");
    port = Number(first.port);
    password = String(first.password || "");
  } else {
    const vnext = Array.isArray(settings.vnext) ? settings.vnext : [];
    const first = isObject(vnext[0]) ? vnext[0] : null;
    if (!first) throw new Error(`${protocol} settings.vnext 缺失`);
    server = String(first.address || "");
    port = Number(first.port);
    const users = Array.isArray(first.users) ? first.users : [];
    const user = isObject(users[0]) ? users[0] : null;
    if (!user) throw new Error(`${protocol} users 缺失`);
    uuid = String(user.id || user.uuid || "");
    flow = String(user.flow || "");
  }

  if (!server) throw new Error("缺少服务器地址");
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("端口无效");

  const outbound: TcptunOutbound = {
    tag,
    type: protocol,
    server,
    port,
    network: ["tcp", "udp"],
    transport: finalizeTransport(stream, mapStreamTransport(stream, warnings, `outbound ${tag}`)),
    mux: { enabled: muxEnabled },
  };

  if (protocol === "trojan") {
    if (!password) throw new Error("trojan password 缺失");
    outbound.password = password;
  } else {
    if (!uuid) throw new Error("uuid 缺失");
    outbound.uuid = uuid;
    if (flow) outbound.flow = flow;
  }

  const security = mapStreamSecurity(stream, "client", warnings, `outbound ${tag}`);
  if (security) outbound.security = security;

  // REALITY cannot combine with transport.tls
  if (security?.type === "reality" && outbound.transport) {
    delete outbound.transport.tls;
    delete outbound.transport.server_name;
    delete outbound.transport.insecure;
  }

  return outbound;
}

function convertXrayInbound(source: JsonObject, tag: string, warnings: string[]): TcptunInbound {
  const protocol = String(source.protocol).toLowerCase();
  if (!isTunnelProtocol(protocol)) {
    throw new Error(`不支持的协议 ${protocol}`);
  }

  const settings = isObject(source.settings) ? source.settings : {};
  const stream = isObject(source.streamSettings) ? source.streamSettings : {};
  const port = Number(source.port);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("inbound port 无效");
  }

  const listen = String(source.listen || "0.0.0.0");
  const clients = Array.isArray(settings.clients) ? settings.clients : [];
  if (clients.length === 0) {
    throw new Error("inbound settings.clients 为空");
  }

  const users = clients
    .filter(isObject)
    .map((client) => {
      if (protocol === "trojan") {
        const password = String(client.password || "");
        if (!password) throw new Error("trojan client password 缺失");
        return { password };
      }
      const id = String(client.id || client.uuid || "");
      if (!id) throw new Error("client id 缺失");
      const flow = String(client.flow || "");
      return flow ? { id, flow } : { id };
    });

  if (clients.length > 1) {
    warnings.push(`inbound ${tag} 含 ${clients.length} 个用户，已全部保留`);
  }

  const inbound: TcptunInbound = {
    tag,
    type: protocol,
    listen,
    port,
    network: ["tcp", "udp"],
    users,
    transport: finalizeTransport(stream, mapStreamTransport(stream, warnings, `inbound ${tag}`)),
    mux: { enabled: false },
    outbound: "direct",
  };

  const security = mapStreamSecurity(stream, "server", warnings, `inbound ${tag}`);
  if (security) {
    inbound.security = security;
    if (inbound.transport) {
      delete inbound.transport.tls;
      delete inbound.transport.server_name;
      delete inbound.transport.insecure;
    }
  }

  // TLS certs on server
  if (inbound.transport?.tls) {
    const tls = isObject(stream.tlsSettings) ? stream.tlsSettings : {};
    const certs = Array.isArray(tls.certificates) ? tls.certificates : [];
    const cert = isObject(certs[0]) ? certs[0] : null;
    if (cert) {
      const certFile = String(cert.certificateFile || cert.certificate || "");
      const keyFile = String(cert.keyFile || cert.key || "");
      if (certFile && keyFile && !certFile.includes("\n") && !keyFile.includes("\n")) {
        inbound.transport = {
          ...inbound.transport,
          cert: certFile,
          key: keyFile,
        };
      } else if (certFile || keyFile) {
        warnings.push(`inbound ${tag} 的证书是内联内容或路径不完整，请手动填写 transport.cert/key`);
      }
    } else {
      warnings.push(`inbound ${tag} 启用了 TLS，请手动补充 transport.cert/key`);
    }
  }

  return inbound;
}

function mapStreamTransport(
  stream: JsonObject,
  warnings: string[],
  label: string,
): NonNullable<TcptunOutbound["transport"]> {
  const network = String(stream.network || "tcp").toLowerCase();
  let type = "raw";
  let path = "";

  switch (network) {
    case "tcp":
    case "raw":
    case "none":
      type = "raw";
      break;
    case "ws":
    case "websocket":
      type = "ws";
      {
        const ws = isObject(stream.wsSettings) ? stream.wsSettings : {};
        path = String(ws.path || "");
      }
      break;
    case "h2":
    case "http":
      type = "h2";
      {
        const h2 = isObject(stream.httpSettings)
          ? stream.httpSettings
          : isObject(stream.h2Settings)
            ? stream.h2Settings
            : {};
        const paths = Array.isArray(h2.path) ? h2.path : [];
        path = String(paths[0] || h2.path || "");
      }
      break;
    case "h3":
    case "http3":
      type = "h3";
      break;
    case "grpc":
    case "gun":
      warnings.push(`${label} 使用 gRPC，tcptun 当前不支持，已按 raw 占位，请改用 raw/ws/h2/h3`);
      type = "raw";
      break;
    case "xhttp":
    case "splithttp":
    case "kcp":
    case "mkcp":
    case "quic":
      warnings.push(`${label} 的 network=${network} 不受支持，已回退 raw`);
      type = "raw";
      break;
    default:
      warnings.push(`${label} 未知 network=${network}，已回退 raw`);
      type = "raw";
  }

  const transport: NonNullable<TcptunOutbound["transport"]> = { type };
  if (path) transport.path = path;
  return transport;
}

function mapStreamSecurity(
  stream: JsonObject,
  side: "client" | "server",
  warnings: string[],
  label: string,
): TcptunOutbound["security"] | undefined {
  const security = String(stream.security || "none").toLowerCase();
  const transportHint = String(stream.network || "tcp").toLowerCase();

  if (security !== "reality") {
    if (security === "xtls") {
      warnings.push(`${label} 使用 xtls，已按 TLS 处理`);
    }
    return undefined;
  }

  if (transportHint !== "tcp" && transportHint !== "raw" && transportHint !== "none" && transportHint !== "") {
    warnings.push(`${label} REALITY 通常配合 raw/tcp；当前 network=${transportHint}`);
  }

  const reality = isObject(stream.realitySettings) ? stream.realitySettings : {};
  if (side === "client") {
    const serverName = String(reality.serverName || reality.server_name || "");
    const publicKey = String(reality.publicKey || reality.public_key || "");
    const shortId = String(reality.shortId || reality.short_id || "");
    if (!publicKey) warnings.push(`${label} REALITY 缺少 publicKey`);
    if (!serverName) warnings.push(`${label} REALITY 缺少 serverName`);
    return {
      type: "reality",
      server_name: serverName,
      fingerprint: String(reality.fingerprint || "chrome"),
      public_key: publicKey,
      short_id: shortId,
      spider_x: String(reality.spiderX || reality.spider_x || "/"),
    };
  }

  const privateKey = String(reality.privateKey || reality.private_key || "");
  const serverNames = Array.isArray(reality.serverNames)
    ? reality.serverNames.map(String)
    : reality.serverName
      ? [String(reality.serverName)]
      : [];
  const shortIds = Array.isArray(reality.shortIds)
    ? reality.shortIds.map(String)
    : reality.shortId
      ? [String(reality.shortId)]
      : [];
  const dest = String(reality.dest || reality.target || "");
  if (!privateKey) warnings.push(`${label} REALITY 缺少 privateKey`);
  if (serverNames.length === 0) warnings.push(`${label} REALITY 缺少 serverNames`);
  if (!dest) warnings.push(`${label} REALITY 缺少 dest`);

  return {
    type: "reality",
    private_key: privateKey,
    server_names: serverNames,
    short_ids: shortIds,
    dest,
    max_time_diff: "30s",
  };
}

function finalizeTransport(
  stream: JsonObject,
  transport: NonNullable<TcptunOutbound["transport"]>,
): NonNullable<TcptunOutbound["transport"]> {
  const security = String(stream.security || "none").toLowerCase();
  if (security !== "tls" && security !== "xtls") return transport;
  const tls = isObject(stream.tlsSettings) ? stream.tlsSettings : {};
  const serverName = String(tls.serverName || tls.server_name || "");
  const insecure = Boolean(tls.allowInsecure || tls.insecure);
  return {
    ...transport,
    tls: true,
    ...(serverName ? { server_name: serverName } : {}),
    ...(insecure ? { insecure: true } : {}),
  };
}

function buildClientConfig(
  outbounds: TcptunOutbound[],
  localListen: string,
  localPort: number,
  preferredTag: string | undefined,
  warnings: string[],
) {
  const tags = outbounds.map((item) => item.tag);
  const defaultOutbound =
    preferredTag && tags.includes(preferredTag) ? preferredTag : tags[0];
  if (preferredTag && !tags.includes(preferredTag)) {
    warnings.push(`未找到优先出口 tag=${preferredTag}，已使用 ${defaultOutbound}`);
  }

  // Ensure direct exists for convenience
  const hasDirect = outbounds.some((item) => item.type === "direct");
  const finalOutbounds = hasDirect
    ? outbounds
    : [...outbounds, { tag: "direct", type: "direct" as const }];

  return {
    log: { level: "info" },
    inbounds: [
      {
        tag: "local",
        type: "mixed",
        listen: localListen,
        port: localPort,
        network: ["tcp", "udp"],
        outbound: defaultOutbound,
      },
    ],
    outbounds: finalOutbounds,
    route: {
      default_outbound: defaultOutbound,
      rules: [] as unknown[],
    },
  };
}

function buildServerConfig(inbounds: TcptunInbound[], warnings: string[]) {
  void warnings;
  return {
    log: { level: "info" },
    inbounds,
    outbounds: [{ tag: "direct", type: "direct", network: ["tcp", "udp"] }],
    route: {
      default_outbound: "direct",
      rules: [] as unknown[],
    },
  };
}

function uniqueTag(base: string, index: number, existing: Array<{ tag: string }>): string {
  const cleaned = base.trim() || `proxy${index + 1}`;
  if (!existing.some((item) => item.tag === cleaned)) return cleaned;
  let n = 2;
  while (existing.some((item) => item.tag === `${cleaned}-${n}`)) n += 1;
  return `${cleaned}-${n}`;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/* ---------------- share links ---------------- */

function parseShareLink(text: string, tag: string): TcptunOutbound {
  const lower = text.toLowerCase();
  if (lower.startsWith("vmess://")) return parseVmessLink(text, tag);
  if (lower.startsWith("vless://")) return parseVlessOrTrojanLink(text, tag, "vless");
  if (lower.startsWith("trojan://")) return parseVlessOrTrojanLink(text, tag, "trojan");
  if (lower.startsWith("ss://")) {
    throw new Error("Shadowsocks 暂不支持");
  }
  throw new Error("未知链接协议");
}

function parseVmessLink(text: string, tag: string): TcptunOutbound {
  const payload = text.slice("vmess://".length).trim();
  const jsonText = decodeBase64Flexible(payload);
  const source = JSON.parse(jsonText) as JsonObject;
  const port = Number(source.port);
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("VMess 端口无效");
  const address = String(source.add || source.address || "");
  if (!address) throw new Error("VMess 地址缺失");
  const uuid = String(source.id || "");
  if (!uuid) throw new Error("VMess uuid 缺失");

  const network = String(source.net || source.network || "tcp").toLowerCase();
  const transportType = mapShareNetwork(network);
  const path = String(source.path || "");
  const tls = String(source.tls || source.security || "").toLowerCase();

  const outbound: TcptunOutbound = {
    tag,
    type: "vmess",
    server: address,
    port,
    uuid,
    network: ["tcp", "udp"],
    transport: {
      type: transportType,
      ...(path ? { path } : {}),
    },
    mux: { enabled: false },
  };

  if (tls === "reality") {
    outbound.security = {
      type: "reality",
      server_name: String(source.sni || source.serverName || ""),
      fingerprint: String(source.fp || source.fingerprint || "chrome"),
      public_key: String(source.pbk || source.publicKey || ""),
      short_id: String(source.sid || source.shortId || ""),
      spider_x: String(source.spx || source.spiderX || "/"),
    };
  } else if (tls === "tls") {
    outbound.transport = {
      ...outbound.transport,
      tls: true,
      server_name: String(source.sni || source.serverName || ""),
    };
  }

  return outbound;
}

function parseVlessOrTrojanLink(text: string, tag: string, protocol: "vless" | "trojan"): TcptunOutbound {
  const url = new URL(text);
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 0));
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("端口无效");
  const server = url.hostname;
  if (!server) throw new Error("主机缺失");

  const credential = decodeURIComponent(url.username || "");
  // trojan://password@host:port - password may be in username
  // some use trojan://password@host with password field
  let password = credential;
  if (protocol === "trojan" && url.password) {
    password = decodeURIComponent(url.password);
  }

  const query = url.searchParams;
  const type = mapShareNetwork(String(query.get("type") || query.get("network") || "tcp"));
  const security = String(query.get("security") || query.get("encryption") || "none").toLowerCase();
  const path = query.get("path") || "";
  const sni = query.get("sni") || query.get("host") || query.get("peer") || "";

  const outbound: TcptunOutbound = {
    tag,
    type: protocol,
    server,
    port,
    network: ["tcp", "udp"],
    transport: {
      type,
      ...(path ? { path } : {}),
    },
    mux: { enabled: false },
  };

  if (protocol === "vless") {
    if (!credential) throw new Error("VLESS uuid 缺失");
    outbound.uuid = credential;
    const flow = query.get("flow") || "";
    if (flow) outbound.flow = flow;
  } else {
    if (!password) throw new Error("Trojan password 缺失");
    outbound.password = password;
  }

  if (security === "reality") {
    outbound.security = {
      type: "reality",
      server_name: sni,
      fingerprint: query.get("fp") || "chrome",
      public_key: query.get("pbk") || "",
      short_id: query.get("sid") || "",
      spider_x: query.get("spx") || "/",
    };
  } else if (security === "tls") {
    outbound.transport = {
      ...outbound.transport,
      tls: true,
      ...(sni ? { server_name: sni } : {}),
      ...(query.get("allowInsecure") === "1" || query.get("insecure") === "1"
        ? { insecure: true }
        : {}),
    };
  }

  return outbound;
}

function mapShareNetwork(network: string): string {
  const value = network.toLowerCase();
  if (value === "ws" || value === "websocket") return "ws";
  if (value === "h2" || value === "http") return "h2";
  if (value === "h3" || value === "http3") return "h3";
  return "raw";
}

function decodeBase64Flexible(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
