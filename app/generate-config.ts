import {
  generateX25519Pair,
  randomBase64Url,
  randomHex,
  randomUuidV4,
} from "./crypto-credentials";
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
  autoReality?: boolean;
  resume?: boolean;
};

export type GeneratedConfigs = {
  serverJson: string;
  clientJson: string;
  clientUri: string;
  cliCommand: string;
};

export const protocols: Array<{ id: TunnelProtocol; label: string; hint: string }> = [
  { id: "native", label: "native", hint: "only tunnel protocol in v0.4.2" },
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
    autoReality: true,
    resume: false,
  };
}

export function validateGenerateInput(input: GenerateConfigInput): string | null {
  if (input.protocol !== "native") {
    return "v0.4.2 generates native configs only; VLESS, VMess, and Trojan were removed";
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
  if (input.autoReality && input.protocol !== "native") return "Automatic Reality carriers support only the native protocol";
  if (input.resume && (!input.autoReality || input.quic || input.protocol !== "native")) {
    return "Resumable streams require native automatic Reality carriers";
  }
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
      // v0.3.0+: keep security.type=reality and select auto/tcp/quic via carrier.mode.
      type: "reality",
      private_key: privateKey,
      server_names: [serverName],
      short_ids: [shortId],
      dest,
      max_time_diff: "30s",
    },
  };
  if (quic) {
    serverInbound.carrier = { mode: "quic" };
    serverInbound.mux = { enabled: true, max_streams_per_session: 128 };
  } else if (protocol === "native" && input.autoReality) {
    serverInbound.carrier = { mode: "auto" };
    serverInbound.mux = {
      enabled: true,
      ...(input.resume
        ? { resume: true, resume_timeout: "15s", resume_buffer_size: 4 * 1024 * 1024 }
        : {}),
    };
  } else {
    // VLESS / VMess / Trojan generators remain Reality TCP (no dual carriers).
    serverInbound.carrier = { mode: "tcp" };
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
      type: "reality",
      server_name: serverName,
      public_key: publicKey,
      short_id: shortId,
      spider_x: "/",
    },
    ...clientCredentialFields(protocol, credential),
  };
  if (quic) {
    clientOutbound.carrier = { mode: "quic", udp_mode: "auto" };
    clientOutbound.mux = {
      enabled: true,
      max_sessions: 4,
      max_streams_per_session: 128,
      warm_spares: 1,
    };
  } else if (protocol === "native" && input.autoReality) {
    clientOutbound.carrier = { mode: "auto" };
    clientOutbound.mux = {
      enabled: true,
      max_sessions: 4,
      max_streams_per_session: 128,
      warm_spares: 1,
      ...(input.resume
        ? { resume: true, resume_timeout: "15s", resume_buffer_size: 4 * 1024 * 1024 }
        : {}),
    };
  } else {
    clientOutbound.carrier = { mode: "tcp" };
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

async function generateCredential(protocol: TunnelProtocol): Promise<string> {
  if (protocol === "vless" || protocol === "vmess") {
    return randomUuidV4();
  }
  return randomBase64Url(24);
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9._:/-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
