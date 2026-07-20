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
  address?: string[];
  uuid?: string;
  password?: string;
  token?: string;
  flow?: string;
  network?: string[];
  transport?: {
    type?: string;
    path?: string;
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
    cert?: string;
    key?: string;
    insecure?: boolean;
  };
  mux?: Record<string, unknown>;
};

type TcptunInbound = {
  tag: string;
  type: string;
  address?: string[];
  network?: string[];
  users?: Array<{ id?: string; password?: string; flow?: string }>;
  transport?: TcptunOutbound["transport"];
  security?: TcptunOutbound["security"];
  mux?: Record<string, unknown>;
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
    throw new Error("Paste an Xray config JSON or share links");
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
        warnings.push(`Line ${index + 1} link could not be parsed: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    if (outbounds.length === 0) {
      throw new Error("Could not parse a usable tunnel outbound from the share links");
    }

    const client = buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: `Generated a client config from ${outbounds.length} share links`,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Input is neither valid JSON nor share links");
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
          warnings.push(`outbounds[${index}] skipped: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });
    if (outbounds.length === 0) throw new Error("No convertible Xray outbounds in the array");
    const client = buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: `Converted ${outbounds.length} outbounds`,
    };
  }

  if (!isObject(data)) {
    throw new Error("JSON root must be an object or array");
  }

  // Single outbound object
  if (isXrayOutbound(data) && !Array.isArray(data.outbounds) && !Array.isArray(data.inbounds)) {
    const outbound = convertXrayOutbound(data, String(data.tag || "proxy"), warnings);
    const client = buildClientConfig([outbound], localListen, localPort, options.preferredOutboundTag, warnings);
    return {
      clientJson: pretty(client),
      serverJson: null,
      warnings,
      summary: "Converted a single outbound",
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
      summary: "Converted a single inbound",
    };
  }

  const xrayOutbounds = Array.isArray(data.outbounds) ? data.outbounds : [];
  const xrayInbounds = Array.isArray(data.inbounds) ? data.inbounds : [];

  const outbounds: TcptunOutbound[] = [];
  xrayOutbounds.forEach((item, index) => {
    if (!isObject(item)) return;
    if (!isTunnelProtocol(String(item.protocol || ""))) {
      if (String(item.protocol || "") && !["freedom", "blackhole", "dns", "loopback", "block"].includes(String(item.protocol))) {
        warnings.push(`outbound ${item.tag || index} (${item.protocol}) is not supported and was skipped`);
      }
      return;
    }
    try {
      outbounds.push(
        convertXrayOutbound(item, uniqueTag(String(item.tag || "proxy"), index, outbounds), warnings),
      );
    } catch (err) {
      warnings.push(`outbound ${item.tag || index} skipped: ${err instanceof Error ? err.message : String(err)}`);
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
      warnings.push(`inbound ${item.tag || index} skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  if (outbounds.length === 0 && inbounds.length === 0) {
    throw new Error("No convertible VLESS / VMess / Trojan inbounds or outbounds found");
  }

  const clientJson =
    outbounds.length > 0
      ? pretty(buildClientConfig(outbounds, localListen, localPort, options.preferredOutboundTag, warnings))
      : null;
  const serverJson = inbounds.length > 0 ? pretty(buildServerConfig(inbounds, warnings)) : null;

  const parts: string[] = [];
  if (outbounds.length) parts.push(`${outbounds.length} outbounds`);
  if (inbounds.length) parts.push(`${inbounds.length} inbounds`);

  return {
    clientJson,
    serverJson,
    warnings,
    summary: `Converted ${parts.join(", ")}`,
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
    throw new Error(`Unsupported protocol ${protocol}`);
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
    if (!first) throw new Error("trojan settings.servers is missing");
    server = String(first.address || first.ip || "");
    port = Number(first.port);
    password = String(first.password || "");
  } else {
    const vnext = Array.isArray(settings.vnext) ? settings.vnext : [];
    const first = isObject(vnext[0]) ? vnext[0] : null;
    if (!first) throw new Error(`${protocol} settings.vnext is missing`);
    server = String(first.address || "");
    port = Number(first.port);
    const users = Array.isArray(first.users) ? first.users : [];
    const user = isObject(users[0]) ? users[0] : null;
    if (!user) throw new Error(`${protocol} users is missing`);
    uuid = String(user.id || user.uuid || "");
    flow = String(user.flow || "");
  }

  if (!server) throw new Error("Server address is missing");
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("Invalid port");

  const outbound: TcptunOutbound = {
    tag,
    type: protocol,
    address: [joinHostPort(server, port)],
    network: ["tcp", "udp"],
    transport: mapStreamTransport(stream, warnings, `outbound ${tag}`),
  };
  if (muxEnabled) outbound.mux = {};

  if (protocol === "trojan") {
    if (!password) throw new Error("trojan password is missing");
    outbound.password = password;
  } else {
    if (!uuid) throw new Error("uuid is missing");
    outbound.uuid = uuid;
    if (flow) outbound.flow = flow;
  }

  const security = mapStreamSecurity(stream, "client", warnings, `outbound ${tag}`);
  if (security) outbound.security = security;

  return outbound;
}

function convertXrayInbound(source: JsonObject, tag: string, warnings: string[]): TcptunInbound {
  const protocol = String(source.protocol).toLowerCase();
  if (!isTunnelProtocol(protocol)) {
    throw new Error(`Unsupported protocol ${protocol}`);
  }

  const settings = isObject(source.settings) ? source.settings : {};
  const stream = isObject(source.streamSettings) ? source.streamSettings : {};
  const port = Number(source.port);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("inbound port is invalid");
  }

  const listen = String(source.listen || "0.0.0.0");
  const clients = Array.isArray(settings.clients) ? settings.clients : [];
  if (clients.length === 0) {
    throw new Error("inbound settings.clients is empty");
  }

  const users = clients
    .filter(isObject)
    .map((client) => {
      if (protocol === "trojan") {
        const password = String(client.password || "");
        if (!password) throw new Error("trojan client password is missing");
        return { password };
      }
      const id = String(client.id || client.uuid || "");
      if (!id) throw new Error("client id is missing");
      const flow = String(client.flow || "");
      return flow ? { id, flow } : { id };
    });

  if (clients.length > 1) {
    warnings.push(`inbound ${tag} has ${clients.length} users; all were kept`);
  }

  const inbound: TcptunInbound = {
    tag,
    type: protocol,
    address: [joinHostPort(listen, port)],
    network: ["tcp", "udp"],
    users,
    transport: mapStreamTransport(stream, warnings, `inbound ${tag}`),
  };

  const security = mapStreamSecurity(stream, "server", warnings, `inbound ${tag}`);
  if (security) {
    inbound.security = security;
  }

  // TLS certs on server when using certificate TLS
  if (security?.type === "tls") {
    const tls = isObject(stream.tlsSettings) ? stream.tlsSettings : {};
    const certs = Array.isArray(tls.certificates) ? tls.certificates : [];
    const cert = isObject(certs[0]) ? certs[0] : null;
    if (cert) {
      const certFile = String(cert.certificateFile || cert.certificate || "");
      const keyFile = String(cert.keyFile || cert.key || "");
      if (certFile && keyFile && !certFile.includes("\n") && !keyFile.includes("\n")) {
        inbound.security = {
          ...inbound.security,
          cert: certFile,
          key: keyFile,
        };
      } else if (certFile || keyFile) {
        warnings.push(`inbound ${tag} certificate is inline or incomplete; fill security.cert/key manually`);
      }
    } else {
      warnings.push(`inbound ${tag} enables TLS; fill security.cert/key manually`);
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
      warnings.push(`${label} uses gRPC, which tcptun does not support yet; placeholder is raw — switch to raw/ws/h2/h3`);
      type = "raw";
      break;
    case "xhttp":
    case "splithttp":
    case "kcp":
    case "mkcp":
    case "quic":
      warnings.push(`${label} network=${network} is unsupported; fell back to raw`);
      type = "raw";
      break;
    default:
      warnings.push(`${label} has unknown network=${network}; fell back to raw`);
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

  if (security === "tls" || security === "xtls") {
    if (security === "xtls") {
      warnings.push(`${label} uses xtls; treated as TLS`);
    }
    const tls = isObject(stream.tlsSettings) ? stream.tlsSettings : {};
    const serverName = String(tls.serverName || tls.server_name || "");
    const insecure = Boolean(tls.allowInsecure || tls.insecure);
    return {
      type: "tls",
      ...(serverName ? { server_name: serverName } : {}),
      ...(insecure && side === "client" ? { insecure: true } : {}),
    };
  }

  if (security !== "reality") {
    return undefined;
  }

  if (transportHint !== "tcp" && transportHint !== "raw" && transportHint !== "none" && transportHint !== "") {
    warnings.push(`${label} REALITY usually pairs with raw/tcp; current network=${transportHint}`);
  }

  const reality = isObject(stream.realitySettings) ? stream.realitySettings : {};
  if (side === "client") {
    const serverName = String(reality.serverName || reality.server_name || "");
    const publicKey = String(reality.publicKey || reality.public_key || "");
    const shortId = String(reality.shortId || reality.short_id || "");
    if (!publicKey) warnings.push(`${label} REALITY is missing publicKey`);
    if (!serverName) warnings.push(`${label} REALITY is missing serverName`);
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
  if (!privateKey) warnings.push(`${label} REALITY is missing privateKey`);
  if (serverNames.length === 0) warnings.push(`${label} REALITY is missing serverNames`);
  if (!dest) warnings.push(`${label} REALITY is missing dest`);

  return {
    type: "reality",
    private_key: privateKey,
    server_names: serverNames,
    short_ids: shortIds,
    dest,
    max_time_diff: "30s",
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
    warnings.push(`Preferred outbound tag=${preferredTag} not found; using ${defaultOutbound}`);
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
        address: [joinHostPort(localListen, localPort)],
        network: ["tcp", "udp"],
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
    throw new Error("Shadowsocks is not supported yet");
  }
  throw new Error("Unknown share-link protocol");
}

function parseVmessLink(text: string, tag: string): TcptunOutbound {
  const payload = text.slice("vmess://".length).trim();
  const jsonText = decodeBase64Flexible(payload);
  const source = JSON.parse(jsonText) as JsonObject;
  const port = Number(source.port);
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("VMess Invalid port");
  const address = String(source.add || source.address || "");
  if (!address) throw new Error("VMess address is missing");
  const uuid = String(source.id || "");
  if (!uuid) throw new Error("VMess uuid is missing");

  const network = String(source.net || source.network || "tcp").toLowerCase();
  const transportType = mapShareNetwork(network);
  const path = String(source.path || "");
  const tls = String(source.tls || source.security || "").toLowerCase();

  const outbound: TcptunOutbound = {
    tag,
    type: "vmess",
    address: [joinHostPort(address, port)],
    uuid,
    network: ["tcp", "udp"],
    transport: {
      type: transportType,
      ...(path ? { path } : {}),
    },
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
    outbound.security = {
      type: "tls",
      server_name: String(source.sni || source.serverName || ""),
    };
  }

  return outbound;
}

function parseVlessOrTrojanLink(text: string, tag: string, protocol: "vless" | "trojan"): TcptunOutbound {
  const url = new URL(text);
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 0));
  if (!Number.isFinite(port) || port < 1 || port > 65535) throw new Error("Invalid port");
  const server = url.hostname;
  if (!server) throw new Error("Host is missing");

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
    address: [joinHostPort(server, port)],
    network: ["tcp", "udp"],
    transport: {
      type,
      ...(path ? { path } : {}),
    },
  };

  if (protocol === "vless") {
    if (!credential) throw new Error("VLESS uuid is missing");
    outbound.uuid = credential;
    const flow = query.get("flow") || "";
    if (flow) outbound.flow = flow;
  } else {
    if (!password) throw new Error("Trojan password is missing");
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
    outbound.security = {
      type: "tls",
      ...(sni ? { server_name: sni } : {}),
      ...(query.get("allowInsecure") === "1" || query.get("insecure") === "1"
        ? { insecure: true }
        : {}),
    };
  }

  return outbound;
}

function joinHostPort(host: string, port: number): string {
  const normalized = host.trim().replace(/^\[|\]$/g, "");
  if (normalized.includes(":") && !normalized.startsWith("[")) {
    return `[${normalized}]:${port}`;
  }
  return `${normalized}:${port}`;
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
