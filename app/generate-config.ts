export type TunnelProtocol = "native" | "vless" | "vmess" | "trojan";

export type GenerateConfigInput = {
  protocol: TunnelProtocol;
  server: string;
  port: number;
  listen: string;
  localListen: string;
  localPort: number;
  serverName: string;
  dest: string;
  enableMux?: boolean;
};

export type GeneratedConfigs = {
  serverJson: string;
  clientJson: string;
  clientUri: string;
  cliCommand: string;
};

export const protocols: Array<{ id: TunnelProtocol; label: string; hint: string }> = [
  { id: "native", label: "native", hint: "tcptun 私有协议" },
  { id: "vless", label: "vless", hint: "Xray 互通 + Vision" },
  { id: "vmess", label: "vmess", hint: "Xray VMess AEAD" },
  { id: "trojan", label: "trojan", hint: "密码认证" },
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
    enableMux: false,
  };
}

export function validateGenerateInput(input: GenerateConfigInput): string | null {
  if (!["native", "vless", "vmess", "trojan"].includes(input.protocol)) {
    return "不支持的协议";
  }
  if (!input.server.trim()) return "请填写服务端地址";
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    return "端口需为 1–65535";
  }
  if (!input.listen.trim()) return "请填写服务端监听地址";
  if (!input.localListen.trim()) return "请填写本地监听地址";
  if (!Number.isInteger(input.localPort) || input.localPort < 1 || input.localPort > 65535) {
    return "本地端口需为 1–65535";
  }
  if (!input.serverName.trim()) return "请填写 REALITY server name";
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
  const dest = input.dest.trim() || `${serverName}:443`;
  const enableMux = Boolean(input.enableMux);

  const { privateKey, publicKey } = await generateX25519Pair();
  const shortId = randomHex(8);
  const credential = await generateCredential(protocol);

  const serverConfig = {
    log: { level: "info" },
    inbounds: [
      {
        tag: "server",
        type: protocol,
        listen,
        port: input.port,
        network: ["tcp", "udp"],
        users: [serverUser(protocol, credential)],
        transport: { type: "raw" },
        security: {
          type: "reality",
          private_key: privateKey,
          server_names: [serverName],
          short_ids: [shortId],
          dest,
          max_time_diff: "30s",
        },
        mux: { enabled: enableMux },
        outbound: "direct",
      },
    ],
    outbounds: [{ tag: "direct", type: "direct", network: ["tcp", "udp"] }],
    route: { default_outbound: "direct", rules: [] as unknown[] },
  };

  const clientOutbound = {
    tag: "proxy",
    type: protocol,
    server,
    port: input.port,
    network: ["tcp", "udp"] as string[],
    transport: { type: "raw" },
    security: {
      type: "reality",
      server_name: serverName,
      fingerprint: "chrome",
      public_key: publicKey,
      short_id: shortId,
      spider_x: "/",
    },
    mux: { enabled: enableMux },
    ...clientCredentialFields(protocol, credential),
  };

  const clientConfig = {
    log: { level: "info" },
    inbounds: [
      {
        tag: "local",
        type: "mixed",
        listen: localListen,
        port: input.localPort,
        network: ["tcp", "udp"],
        outbound: "proxy",
      },
    ],
    outbounds: [clientOutbound],
    route: { default_outbound: "proxy", rules: [] as unknown[] },
  };

  const clientUri = buildClientUri(protocol, clientOutbound as ClientOutbound);

  const destFlag =
    input.dest.trim() && input.dest.trim() !== `${serverName}:443`
      ? ` --dest ${shellQuote(dest)}`
      : "";

  const cliCommand = [
    `tcptun config ${protocol}`,
    `--server ${shellQuote(server)}`,
    `--port ${input.port}`,
    `--listen ${shellQuote(listen)}`,
    `--local-listen ${shellQuote(localListen)}`,
    `--local-port ${input.localPort}`,
    `--server-name ${shellQuote(serverName)}`,
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

type ClientOutbound = {
  type: TunnelProtocol;
  server: string;
  port: number;
  token?: string;
  uuid?: string;
  password?: string;
  flow?: string;
  network?: string[];
  transport: { type: string };
  security: {
    type: string;
    server_name: string;
    fingerprint: string;
    public_key: string;
    short_id: string;
    spider_x: string;
  };
  mux: { enabled: boolean };
};

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

function buildClientUri(protocol: TunnelProtocol, outbound: ClientOutbound): string {
  if (protocol === "vmess") {
    const payload = {
      v: "2",
      ps: "tcptun",
      add: outbound.server,
      port: String(outbound.port),
      id: outbound.uuid,
      aid: "0",
      scy: "auto",
      net: "raw",
      type: "none",
      tls: "reality",
      sni: outbound.security.server_name,
      fp: outbound.security.fingerprint,
      pbk: outbound.security.public_key,
      sid: outbound.security.short_id,
      spx: outbound.security.spider_x,
      mux: outbound.mux.enabled,
    };
    return `vmess://${utf8ToBase64RawStd(JSON.stringify(payload))}`;
  }

  const credential =
    protocol === "vless"
      ? outbound.uuid
      : protocol === "trojan"
        ? outbound.password
        : outbound.token;

  const params = new URLSearchParams();
  if (protocol === "native") {
    params.set("v", "1");
  } else if (protocol === "vless") {
    params.set("encryption", "none");
  }
  params.set("type", "raw");
  if (outbound.network?.length) {
    params.set("network", outbound.network.join(","));
  }
  params.set("security", "reality");
  params.set("sni", outbound.security.server_name);
  params.set("fp", outbound.security.fingerprint);
  params.set("pbk", outbound.security.public_key);
  params.set("sid", outbound.security.short_id);
  if (outbound.security.spider_x) {
    params.set("spx", outbound.security.spider_x);
  }
  if (outbound.flow) {
    params.set("flow", outbound.flow);
  }
  if (protocol === "native" || outbound.mux.enabled) {
    params.set("mux", String(outbound.mux.enabled));
  }

  const host = outbound.server.includes(":")
    ? `[${outbound.server}]:${outbound.port}`
    : `${outbound.server}:${outbound.port}`;

  return `${protocol}://${encodeURIComponent(credential || "")}@${host}?${params.toString()}#tcptun`;
}

async function generateX25519Pair(): Promise<{ privateKey: string; publicKey: string }> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前环境不支持 Web Crypto");
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
      throw new Error("密钥导出失败");
    }
    return { privateKey: privateJwk.d, publicKey: publicJwk.x };
  } catch {
    throw new Error("浏览器不支持 X25519，请升级浏览器或使用 CLI：tcptun config …");
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

function utf8ToBase64RawStd(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=+$/g, "");
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9._:/-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
