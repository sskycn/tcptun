import { buildOutboundUri, type TcptunOutbound, type TunnelProtocol } from "./uri-convert";

export type { TunnelProtocol } from "./uri-convert";

export type GenerateConfigInput = {
  protocol: TunnelProtocol;
  server: string;
  port: number;
  listen: string;
  localListen: string;
  localPort: number;
  serverName: string;
  dest: string;
  quic?: boolean;
};

export type GeneratedConfigs = {
  serverJson: string;
  clientJson: string;
  clientUri: string;
  cliCommand: string;
};

export const protocols: Array<{ id: TunnelProtocol; label: string; hint: string }> = [
  { id: "native", label: "native", hint: "tcptun private protocol" },
];

export function defaultGenerateInput(): GenerateConfigInput {
  return {
    protocol: "native",
    server: "proxy.example.com",
    port: 9443,
    listen: "0.0.0.0",
    localListen: "127.0.0.1",
    localPort: 1080,
    serverName: "example.com",
    dest: "",
    quic: false,
  };
}

export function validateGenerateInput(input: GenerateConfigInput): string | null {
  if (input.protocol !== "native") {
    return "This generator supports only the native protocol";
  }
  if (!input.server.trim()) return "Server address is required";
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    return "Port must be 1–65535";
  }
  if (!input.listen.trim()) return "Server listen address is required";
  if (!input.localListen.trim()) return "Local listen address is required";
  if (!Number.isInteger(input.localPort) || input.localPort < 1 || input.localPort > 65535) {
    return "Local port must be 1–65535";
  }
  if (!input.serverName.trim()) return "REALITY server name is required";
  if (input.quic && input.protocol !== "native") return "QUIC config generation supports only the native protocol";
  return null;
}

export async function generateConfigPair(input: GenerateConfigInput): Promise<GeneratedConfigs> {
  const error = validateGenerateInput(input);
  if (error) throw new Error(error);

  const protocol = input.protocol;
  const server = input.server.trim();
  const listen = input.listen.trim();
  const localListen = input.localListen.trim();
  const serverName = input.serverName.trim();
  const defaultDest = joinHostPort(serverName, 443);
  const dest = input.dest.trim() || defaultDest;
  const quic = Boolean(input.quic);

  const { privateKey, publicKey } = await generateX25519Pair();
  const shortId = randomHex(8);
  const credential = await generateCredential(protocol);

  const serverInbound: Record<string, unknown> = {
    tag: "server",
    type: protocol,
    address: [joinHostPort(listen, input.port)],
    network: ["tcp", "udp"],
    users: [serverUser(protocol, credential)],
    transport: { type: "raw" },
    security: {
      type: quic ? "reality-quic" : "reality",
      private_key: privateKey,
      server_names: [serverName],
      short_ids: [shortId],
      dest,
      max_time_diff: "30s",
    },
  };
  if (quic) {
    serverInbound.mux = { mode: "quic", max_streams_per_session: 128 };
  }

  const serverConfig = {
    log: { level: "info" },
    inbounds: [serverInbound],
    outbounds: [{ tag: "direct", type: "direct", network: ["tcp", "udp"] }],
    route: { default_outbound: "direct", rules: [] as unknown[] },
  };

  const clientOutbound: Record<string, unknown> = {
    tag: "proxy",
    type: protocol,
    address: [joinHostPort(server, input.port)],
    network: ["tcp", "udp"],
    transport: { type: "raw" },
    security: {
      type: quic ? "reality-quic" : "reality",
      server_name: serverName,
      fingerprint: "chrome",
      public_key: publicKey,
      short_id: shortId,
      ...(quic ? {} : { spider_x: "/" }),
    },
    ...clientCredentialFields(protocol, credential),
  };
  if (quic) {
    clientOutbound.mux = {
      mode: "quic",
      udp_mode: "auto",
      max_sessions: 4,
      max_streams_per_session: 128,
      warm_spares: 1,
    };
  }

  const clientConfig = {
    log: { level: "info" },
    inbounds: [
      {
        tag: "local",
        type: "mixed",
        address: [joinHostPort(localListen, input.localPort)],
        network: ["tcp", "udp"],
      },
    ],
    outbounds: [clientOutbound],
    route: { default_outbound: "proxy", rules: [] as unknown[] },
  };

  const clientUri = buildOutboundUri(clientOutbound as TcptunOutbound, "tcptun");

  const destFlag =
    input.dest.trim() && input.dest.trim() !== defaultDest
      ? `--dest ${shellQuote(dest)}`
      : "";

  const cliCommand = [
    `tcptun config ${protocol}`,
    `--server ${shellQuote(server)}`,
    `--port ${input.port}`,
    `--listen ${shellQuote(listen)}`,
    `--local-listen ${shellQuote(localListen)}`,
    `--local-port ${input.localPort}`,
    `--server-name ${shellQuote(serverName)}`,
    quic ? "--quic" : "",
    destFlag,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    serverJson: JSON.stringify(serverConfig, null, 2),
    clientJson: JSON.stringify(clientConfig, null, 2),
    clientUri,
    cliCommand,
  };
}

export function downloadText(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function joinHostPort(host: string, port: number): string {
  const normalized = host.trim().replace(/^\[|\]$/g, "");
  if (normalized.includes(":") && !normalized.startsWith("[")) {
    return `[${normalized}]:${port}`;
  }
  return `${normalized}:${port}`;
}

function serverUser(protocol: TunnelProtocol, credential: string) {
  if (protocol === "vless") {
    return { id: credential, flow: "xtls-rprx-vision" };
  }
  if (protocol === "vmess") {
    return { id: credential };
  }
  if (protocol === "trojan") {
    return { password: credential };
  }
  return { id: credential };
}

function clientCredentialFields(protocol: TunnelProtocol, credential: string) {
  if (protocol === "vless") {
    return { uuid: credential, flow: "xtls-rprx-vision" };
  }
  if (protocol === "vmess") {
    return { uuid: credential };
  }
  if (protocol === "trojan") {
    return { password: credential };
  }
  return { token: credential };
}

async function generateX25519Pair(): Promise<{ privateKey: string; publicKey: string }> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is not available in this environment");
  }

  try {
    const keyPair = (await crypto.subtle.generateKey(
      { name: "X25519" },
      true,
      ["deriveBits"],
    )) as CryptoKeyPair;
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    if (!privateJwk.d || !publicJwk.x) {
      throw new Error("Key export failed");
    }
    return { privateKey: privateJwk.d, publicKey: publicJwk.x };
  } catch {
    throw new Error("This browser does not support X25519. Upgrade the browser or use the CLI: tcptun config …");
  }
}

async function generateCredential(protocol: TunnelProtocol): Promise<string> {
  if (protocol === "vless" || protocol === "vmess") {
    return randomUuidV4();
  }
  return randomBase64Url(24);
}

function randomUuidV4(): string {
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;
  const hex = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomHex(byteLength: number): string {
  const value = new Uint8Array(byteLength);
  crypto.getRandomValues(value);
  return [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomBase64Url(byteLength: number): string {
  const value = new Uint8Array(byteLength);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9._:/-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
