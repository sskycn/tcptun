"use client";

import { useMemo, useState } from "react";
import releaseManifestJSON from "./tcptun-release.json";

type JsonRecord = Record<string, unknown>;
type GeneratedJSONFile = "server" | "client" | "route";
type GeneratedFile = GeneratedJSONFile | "uri";
type GeneratedFiles = Record<GeneratedJSONFile, JsonRecord> & { uri: string };
type ConverterTarget = "client" | "server";
type ProtocolPreset = {
  tokenKind: "uuid" | "secret";
  server: JsonRecord;
  client: JsonRecord;
  route: JsonRecord;
};
type ReleaseManifest = {
  version: string;
  protocols: Record<string, ProtocolPreset>;
  transports: string[];
  securities: string[];
};

const defaultClientListen = "127.0.0.1:1080";
const defaultServerListen = "0.0.0.0:9443";
const releaseManifest = releaseManifestJSON as ReleaseManifest;
const protocolNames = Object.keys(releaseManifest.protocols);
const initialProtocol = protocolNames.includes("native") ? "native" : protocolNames[0];
const initialPreset = presetDefaults(initialProtocol);

const supportedProtocols = new Set(["vless", "vmess", "trojan"]);

const initialXrayClient = {
  outbounds: [
    {
      tag: "proxy",
      protocol: "vless",
      settings: {
        vnext: [
          {
            address: "proxy.example.com",
            port: 443,
            users: [
              {
                id: "00000000-0000-4000-8000-000000000000",
                flow: "xtls-rprx-vision",
                encryption: "none",
              },
            ],
          },
        ],
      },
      streamSettings: {
        network: "tcp",
        security: "reality",
        realitySettings: {
          serverName: "example.com",
          fingerprint: "chrome",
          publicKey: "REALITY_PUBLIC_KEY",
          shortId: "",
          spiderX: "/",
        },
      },
    },
  ],
};

const initialXrayServer = {
  inbounds: [
    {
      tag: "proxy",
      listen: "0.0.0.0",
      port: 443,
      protocol: "vless",
      settings: {
        clients: [
          {
            id: "00000000-0000-4000-8000-000000000000",
            flow: "xtls-rprx-vision",
            encryption: "none",
          },
        ],
        decryption: "none",
      },
      streamSettings: {
        network: "tcp",
        security: "reality",
        realitySettings: {
          dest: "example.com:443",
          serverNames: ["example.com"],
          privateKey: "REALITY_PRIVATE_KEY",
          shortIds: [""],
        },
      },
    },
  ],
};

export default function ConfigTools() {
  const [protocol, setProtocol] = useState(initialProtocol);
  const [transport, setTransport] = useState(initialPreset.transport);
  const [security, setSecurity] = useState(initialPreset.security);
  const [serverAddr, setServerAddr] = useState(initialPreset.serverAddr);
  const [serverListen, setServerListen] = useState(initialPreset.serverListen);
  const [clientListen, setClientListen] = useState(initialPreset.clientListen);
  const [path, setPath] = useState(initialPreset.path);
  const [serverName, setServerName] = useState(initialPreset.serverName);
  const [realityDest, setRealityDest] = useState(initialPreset.realityDest);
  const [shortId, setShortId] = useState(initialPreset.shortId);
  const [clientSocks5Username, setClientSocks5Username] = useState("");
  const [clientSocks5Password, setClientSocks5Password] = useState("");
  const [forceCidrs, setForceCidrs] = useState(initialPreset.forceCidrs);
  const [uriName, setUriName] = useState("tcptun");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
  const [activeGeneratedFile, setActiveGeneratedFile] = useState<GeneratedFile>("server");
  const [generatorStatus, setGeneratorStatus] = useState("");

  const [target, setTarget] = useState<ConverterTarget>("client");
  const [tag, setTag] = useState("");
  const [listen, setListen] = useState(defaultClientListen);
  const [upstream, setUpstream] = useState("socks5");
  const [sourceConfig, setSourceConfig] = useState(pretty(initialXrayClient));
  const [convertedConfig, setConvertedConfig] = useState("");
  const [converterStatus, setConverterStatus] = useState("");

  const generatorOutput = generatedFiles
    ? formatGeneratedOutput(generatedFiles[activeGeneratedFile])
    : "点击“生成配置”根据当前发布版 CLI 模板创建 server.json、client.json、route.json 和 client URI。";

  const targetLabel = useMemo(() => (target === "client" ? "client.json" : "server.json"), [target]);

  async function handleGenerate() {
    try {
      const files = await generateConfigs({
        protocol,
        transport,
        security,
        serverAddr,
        serverListen,
        clientListen,
        path,
        serverName,
        realityDest,
        shortId,
        clientSocks5Username,
        clientSocks5Password,
        forceCidrs,
        uriName,
      });
      setGeneratedFiles(files);
      setActiveGeneratedFile("server");
      setGeneratorStatus("已生成 server.json、client.json、route.json 和 client URI。");
    } catch (error) {
      setGeneratorStatus(messageFor(error));
    }
  }

  function handleTargetChange(nextTarget: ConverterTarget) {
    setTarget(nextTarget);
    setSourceConfig(pretty(nextTarget === "client" ? initialXrayClient : initialXrayServer));
    setConvertedConfig("");
    setConverterStatus("");
    if (nextTarget === "client") {
      setListen(defaultClientListen);
      return;
    }
    setListen(defaultServerListen);
  }

  function handleProtocolChange(nextProtocol: string) {
    const defaults = presetDefaults(nextProtocol);
    setProtocol(nextProtocol);
    setTransport(defaults.transport);
    setSecurity(defaults.security);
    setServerAddr(defaults.serverAddr);
    setServerListen(defaults.serverListen);
    setClientListen(defaults.clientListen);
    setPath(defaults.path);
    setServerName(defaults.serverName);
    setRealityDest(defaults.realityDest);
    setShortId(defaults.shortId);
    setForceCidrs(defaults.forceCidrs);
    setGeneratedFiles(null);
    setGeneratorStatus(`已加载 tcptun v${releaseManifest.version} 的 ${nextProtocol} 标准配置。`);
  }

  function handleConvert() {
    try {
      const parsed = JSON.parse(sourceConfig);
      const converted = convertConfig(parsed, {
        target,
        tag,
        listen,
        upstreamProtocol: upstream,
      });
      setConvertedConfig(pretty(converted));
      setConverterStatus("已转换。");
    } catch (error) {
      setConverterStatus(messageFor(error));
    }
  }

  function handleLoadSample() {
    setSourceConfig(pretty(target === "client" ? initialXrayClient : initialXrayServer));
    setConverterStatus("");
  }

  return (
    <section id="tools" className="tools-section">
      <div className="section-heading">
        <p className="eyebrow">在线工具</p>
        <h2>配置生成与 Xray 转换都在浏览器里完成。</h2>
        <p>
          生成器会根据当前发布版的 CLI 模板创建匹配的 server、client、route 文件和客户端 URI，也支持客户端
          SOCKS5 入口认证。转换器支持从 Xray/V2Ray 的
          VLESS、VMess、Trojan 入站或出站提取 tcptun 配置。密钥、token 和配置内容不会上传。
        </p>
      </div>

      <div className="tool-card" id="generator">
        <div className="tool-copy">
          <p className="eyebrow">配置生成器</p>
          <h3>生成可直接运行的 JSON 和 URI。</h3>
          <p>
            适合新部署。协议和默认字段由 tcptun v{releaseManifest.version} 的 CLI 标准配置生成；UUID
            协议会自动生成 token，REALITY 会尝试使用浏览器 WebCrypto 生成 X25519 密钥对。
          </p>
        </div>
        <div className="tool-grid">
          <div className="form-panel">
            <Field label="协议">
              <select value={protocol} onChange={(event) => handleProtocolChange(event.target.value)}>
                {protocolNames.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="承载层">
              <select value={transport} onChange={(event) => setTransport(event.target.value)}>
                {releaseManifest.transports.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="安全层">
              <select value={security} onChange={(event) => setSecurity(event.target.value)}>
                {releaseManifest.securities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="服务端地址">
              <input value={serverAddr} onChange={(event) => setServerAddr(event.target.value)} />
            </Field>
            <Field label="服务端监听">
              <input value={serverListen} onChange={(event) => setServerListen(event.target.value)} />
            </Field>
            <Field label="客户端监听">
              <input value={clientListen} onChange={(event) => setClientListen(event.target.value)} />
            </Field>
            <Field label="隧道路由">
              <input value={path} onChange={(event) => setPath(event.target.value)} />
            </Field>
            <Field label="Server name">
              <input value={serverName} onChange={(event) => setServerName(event.target.value)} />
            </Field>
            <Field label="REALITY dest">
              <input value={realityDest} onChange={(event) => setRealityDest(event.target.value)} />
            </Field>
            <Field label="Short ID">
              <input
                placeholder="允许留空"
                value={shortId}
                onChange={(event) => setShortId(event.target.value)}
              />
            </Field>
            <Field label="SOCKS5 用户">
              <input
                placeholder="可选客户端本地认证"
                value={clientSocks5Username}
                onChange={(event) => setClientSocks5Username(event.target.value)}
              />
            </Field>
            <Field label="SOCKS5 密码">
              <input
                type="password"
                placeholder="可选客户端本地认证"
                value={clientSocks5Password}
                onChange={(event) => setClientSocks5Password(event.target.value)}
              />
            </Field>
            <Field label="强制上游 CIDR">
              <input value={forceCidrs} onChange={(event) => setForceCidrs(event.target.value)} />
            </Field>
            <Field label="URI 名称">
              <input value={uriName} onChange={(event) => setUriName(event.target.value)} />
            </Field>
            <div className="button-row">
              <button type="button" className="button primary" data-testid="generate-config" onClick={handleGenerate}>
                生成配置
              </button>
              <CopyButton text={generatorOutput} onDone={setGeneratorStatus} />
              <DownloadButton
                filename={generatedFilename(activeGeneratedFile)}
                text={generatedFiles ? generatorOutput : ""}
                mimeType={activeGeneratedFile === "uri" ? "text/plain" : "application/json"}
                onDone={setGeneratorStatus}
              />
            </div>
            <p className="status">{generatorStatus}</p>
          </div>
          <div className="output-panel">
            <div className="tabs" role="tablist" aria-label="已生成文件">
              {(["server", "client", "route", "uri"] as GeneratedFile[]).map((file) => (
                <button
                  key={file}
                  type="button"
                  className={file === activeGeneratedFile ? "active" : ""}
                  onClick={() => setActiveGeneratedFile(file)}
                >
                  {generatedLabel(file)}
                </button>
              ))}
            </div>
            <pre className="json-output" aria-live="polite">
              <code>{generatorOutput}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="tool-card" id="converter">
        <div className="tool-copy">
          <p className="eyebrow">Xray / V2Ray 转换器</p>
          <h3>从已有配置生成 tcptun 配置。</h3>
          <p>
            从 outbound 生成 client.json，或从 inbound 生成 server.json。当前支持 raw TCP、WebSocket、
            HTTP/2，以及 TLS 和 REALITY 字段映射；Xray QUIC 不会自动映射成 tcptun HTTP/3。
          </p>
        </div>
        <div className="converter-grid">
          <div className="form-panel">
            <Field label="目标">
              <select
                value={target}
                onChange={(event) => handleTargetChange(event.target.value as ConverterTarget)}
              >
                <option value="client">从 outbound 生成 client.json</option>
                <option value="server">从 inbound 生成 server.json</option>
              </select>
            </Field>
            <Field label="Tag">
              <input placeholder="可选 inbound/outbound tag" value={tag} onChange={(event) => setTag(event.target.value)} />
            </Field>
            <Field label="监听">
              <input value={listen} onChange={(event) => setListen(event.target.value)} />
            </Field>
            {target === "client" ? (
              <Field label="上游协议">
                <select value={upstream} onChange={(event) => setUpstream(event.target.value)}>
                  <option value="socks5">socks5</option>
                  <option value="mixed">mixed</option>
                </select>
              </Field>
            ) : null}
            <label className="textarea-label" htmlFor="source-config">
              Xray / V2Ray JSON
            </label>
            <textarea
              id="source-config"
              spellCheck={false}
              value={sourceConfig}
              onChange={(event) => setSourceConfig(event.target.value)}
            />
            <div className="button-row">
              <button type="button" className="button primary" data-testid="convert-config" onClick={handleConvert}>
                转换
              </button>
              <button type="button" className="button secondary" onClick={handleLoadSample}>
                加载样例
              </button>
            </div>
          </div>
          <div className="output-panel">
            <div className="output-title">
              <span>{targetLabel}</span>
              <div className="button-row compact">
                <CopyButton text={convertedConfig} onDone={setConverterStatus} />
                <DownloadButton filename={targetLabel} text={convertedConfig} onDone={setConverterStatus} />
              </div>
            </div>
            <pre className="json-output tall" aria-live="polite">
              <code>{convertedConfig || "粘贴配置后点击“转换”。"}</code>
            </pre>
            <p className="status">{converterStatus}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CopyButton({ text, onDone }: { text: string; onDone: (message: string) => void }) {
  async function copy() {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      onDone("已复制。");
    } catch (error) {
      onDone(messageFor(error));
    }
  }

  return (
    <button type="button" className="button secondary" onClick={copy}>
      复制
    </button>
  );
}

function DownloadButton({
  filename,
  text,
  mimeType = "application/json",
  onDone,
}: {
  filename: string;
  text: string;
  mimeType?: string;
  onDone: (message: string) => void;
}) {
  function download() {
    if (!text.trim()) return;
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onDone("已开始下载。");
  }

  return (
    <button type="button" className="button secondary" onClick={download}>
      下载
    </button>
  );
}

function generatedLabel(file: GeneratedFile) {
  return file === "uri" ? "client URI" : `${file}.json`;
}

function generatedFilename(file: GeneratedFile) {
  return file === "uri" ? "client-uri.txt" : `${file}.json`;
}

function formatGeneratedOutput(value: JsonRecord | string) {
  return typeof value === "string" ? value : pretty(value);
}

async function generateConfigs(form: Record<string, string>): Promise<GeneratedFiles> {
  if (form.security === "reality" && form.transport !== "raw") {
    throw new Error("REALITY 配置必须使用 raw 承载层。");
  }
  validateSOCKS5Credential("SOCKS5 用户", form.clientSocks5Username);
  validateSOCKS5Credential("SOCKS5 密码", form.clientSocks5Password);

  const preset = releaseManifest.protocols[form.protocol];
  if (!preset) throw new Error(`tcptun v${releaseManifest.version} 没有协议 ${form.protocol} 的配置模板。`);

  const token = tokenForProtocol(form.protocol);
  const tunnelPath = normalizePath(form.path);
  const server = cloneRecord(preset.server);
  const client = cloneRecord(preset.client);
  const tlsCert = stringField(server, "tunnel_tls_cert") || "server.crt";
  const tlsKey = stringField(server, "tunnel_tls_key") || "server.key";
  const preserveUnknownSecurity = !["none", "tls", "reality"].includes(form.security)
    && form.security === securityForPreset(server, client);
  if (!preserveUnknownSecurity) {
    removeSecurityFields(server);
    removeSecurityFields(client);
  }
  Object.assign(server, {
    mode: "server",
    listen_addrs: listenAddrs(form.serverListen, defaultServerListen),
    token,
    tunnel_protocol: form.protocol,
    tunnel_transport: form.transport,
    tunnel_path: tunnelPath,
  });
  Object.assign(client, {
    mode: "client",
    listen_addrs: listenAddrs(form.clientListen, defaultClientListen),
    server_addr: form.serverAddr.trim(),
    token,
    tunnel_protocol: form.protocol,
    tunnel_transport: form.transport,
    tunnel_path: tunnelPath,
  });
  delete client.socks5_username;
  delete client.socks5_password;
  if (form.clientSocks5Username.trim()) client.socks5_username = form.clientSocks5Username.trim();
  if (form.clientSocks5Password) client.socks5_password = form.clientSocks5Password;

  if (form.security === "tls" || form.transport === "h3") {
    server.tunnel_tls_cert = tlsCert;
    server.tunnel_tls_key = tlsKey;
    if (form.transport !== "h3") client.tunnel_tls = true;
    client.tunnel_tls_server_name = form.serverName.trim();
  }

  if (form.security === "reality") {
    const keys = await realityKeyPair();
    server.tunnel_security = "reality";
    server.reality_private_key = keys.privateKey;
    server.reality_server_names = [form.serverName.trim()];
    server.reality_dest = form.realityDest.trim();
    if (form.shortId.trim()) server.reality_short_ids = [form.shortId.trim()];

    client.tunnel_security = "reality";
    client.reality_server_name = form.serverName.trim();
    client.reality_fingerprint = "chrome";
    client.reality_public_key = keys.publicKey;
    client.reality_spider_x = "/";
    if (form.shortId.trim()) client.reality_short_id = form.shortId.trim();
    if (form.protocol === "vless") {
      server.tunnel_flow = "xtls-rprx-vision";
      client.tunnel_flow = "xtls-rprx-vision";
    }
  }

  const route = cloneRecord(preset.route);
  const forceUpstream = record(route.force_upstream);
  forceUpstream.ip_cidrs = commaList(form.forceCidrs);
  route.force_upstream = forceUpstream;

  const serverConfig = cleanObject(server);
  const clientConfig = cleanObject(client);

  return {
    server: serverConfig,
    client: clientConfig,
    route,
    uri: buildClientURI(clientConfig, form.uriName),
  };
}

function buildClientURI(cfg: JsonRecord, name: string) {
  const mode = stringField(cfg, "mode");
  if (mode && mode !== "client") throw new Error(`URI 只能从 client 配置生成，当前 mode 是 ${mode}。`);

  const protocol = stringField(cfg, "tunnel_protocol") || "native";
  const transport = stringField(cfg, "tunnel_transport") || "raw";
  const { host, port } = splitURIHostPort(stringField(cfg, "server_addr"));
  const token = stringField(cfg, "token");
  if (!token) throw new Error("生成 URI 需要 token。");

  switch (protocol) {
    case "native":
      return buildNativeURI(cfg, transport, host, port, token, name);
    case "vless":
      return buildVLESSURI(cfg, transport, host, port, token, name);
    case "vmess":
      return buildVMessURI(cfg, transport, host, port, token, name);
    case "trojan":
      return buildTrojanURI(cfg, transport, host, port, token, name);
    default:
      return buildTcptunURI(cfg, protocol, transport, host, port, token, name);
  }
}

function buildNativeURI(cfg: JsonRecord, transport: string, host: string, port: string, token: string, name: string) {
  return buildTcptunURI(cfg, "native", transport, host, port, token, name);
}

function buildTcptunURI(
  cfg: JsonRecord,
  protocol: string,
  transport: string,
  host: string,
  port: string,
  token: string,
  name: string,
) {
  const query = new URLSearchParams();
  query.set("protocol", protocol);
  addTransportQuery(query, cfg, transport);
  addSecurityQuery(query, cfg);
  return buildStandardURI("tcptun", token, host, port, query, name);
}

function buildVLESSURI(cfg: JsonRecord, transport: string, host: string, port: string, token: string, name: string) {
  const query = new URLSearchParams();
  query.set("encryption", "none");
  query.set("type", xrayURITransportType(transport));
  addTransportQuery(query, cfg, transport);
  addSecurityQuery(query, cfg);
  const flow = stringField(cfg, "tunnel_flow");
  if (flow) query.set("flow", flow);
  return buildStandardURI("vless", token, host, port, query, name);
}

function buildTrojanURI(cfg: JsonRecord, transport: string, host: string, port: string, token: string, name: string) {
  const query = new URLSearchParams();
  query.set("type", xrayURITransportType(transport));
  addTransportQuery(query, cfg, transport);
  addSecurityQuery(query, cfg);
  return buildStandardURI("trojan", token, host, port, query, name);
}

function buildVMessURI(cfg: JsonRecord, transport: string, host: string, port: string, token: string, name: string) {
  const vmess: JsonRecord = {
    v: "2",
    ps: normalizeURIName(name),
    add: host,
    port,
    id: token,
    aid: "0",
    scy: "none",
    net: vmessURITransportNetwork(transport),
    type: "none",
    host: "",
    path: "",
    tls: "",
  };
  const path = normalizePath(stringField(cfg, "tunnel_path"));
  if (path && transport !== "raw") vmess.path = path;
  if (booleanField(cfg, "tunnel_tls")) {
    vmess.tls = "tls";
    vmess.sni = stringField(cfg, "tunnel_tls_server_name");
  }
  return `vmess://${base64Encode(JSON.stringify(vmess))}`;
}

function buildStandardURI(
  scheme: string,
  token: string,
  host: string,
  port: string,
  query: URLSearchParams,
  name: string,
) {
  const queryText = query.toString();
  return `${scheme}://${encodeURIComponent(token)}@${formatURIHostPort(host, port)}?${queryText}#${encodeURIComponent(
    normalizeURIName(name),
  )}`;
}

function addTransportQuery(query: URLSearchParams, cfg: JsonRecord, transport: string) {
  query.set("transport", transport);
  const path = normalizePath(stringField(cfg, "tunnel_path"));
  if (path && transport !== "raw") query.set("path", path);
}

function addSecurityQuery(query: URLSearchParams, cfg: JsonRecord) {
  if (stringField(cfg, "tunnel_security") === "reality") {
    query.set("security", "reality");
    setQueryIfPresent(query, "sni", stringField(cfg, "reality_server_name"));
    setQueryIfPresent(query, "fp", stringField(cfg, "reality_fingerprint"));
    setQueryIfPresent(query, "pbk", stringField(cfg, "reality_public_key"));
    setQueryIfPresent(query, "sid", stringField(cfg, "reality_short_id"));
    setQueryIfPresent(query, "spx", stringField(cfg, "reality_spider_x"));
    return;
  }
  if (booleanField(cfg, "tunnel_tls")) {
    query.set("security", "tls");
    setQueryIfPresent(query, "sni", stringField(cfg, "tunnel_tls_server_name"));
    if (booleanField(cfg, "tunnel_tls_insecure")) query.set("allowInsecure", "1");
    return;
  }
  query.set("security", "none");
}

function setQueryIfPresent(query: URLSearchParams, key: string, value: string) {
  if (value) query.set(key, value);
}

function xrayURITransportType(transport: string) {
  switch (transport) {
    case "raw":
      return "tcp";
    case "h2":
      return "http";
    case "h3":
      return "quic";
    default:
      return transport;
  }
}

function vmessURITransportNetwork(transport: string) {
  switch (transport) {
    case "raw":
      return "tcp";
    case "h2":
      return "h2";
    case "h3":
      return "quic";
    default:
      return transport;
  }
}

function splitURIHostPort(address: string) {
  const trimmed = address.trim();
  if (!trimmed) throw new Error("生成 URI 需要 server_addr。");

  let host = "";
  let port = "";
  if (trimmed.startsWith("[")) {
    const closingBracket = trimmed.indexOf("]");
    if (closingBracket <= 1 || trimmed[closingBracket + 1] !== ":") {
      throw new Error("server_addr 必须是 host:port，IPv6 请使用 [::1]:443 格式。");
    }
    host = trimmed.slice(1, closingBracket);
    port = trimmed.slice(closingBracket + 2);
  } else {
    const lastColon = trimmed.lastIndexOf(":");
    if (lastColon <= 0 || lastColon === trimmed.length - 1 || trimmed.slice(0, lastColon).includes(":")) {
      throw new Error("server_addr 必须是 host:port，IPv6 请使用 [::1]:443 格式。");
    }
    host = trimmed.slice(0, lastColon);
    port = trimmed.slice(lastColon + 1);
  }

  const parsedPort = Number(port);
  if (!host.trim()) throw new Error("server_addr host 为空。");
  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    throw new Error(`server_addr 端口无效: ${port}`);
  }
  return { host: host.trim(), port };
}

function formatURIHostPort(host: string, port: string) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]:${port}` : `${host}:${port}`;
}

function normalizeURIName(name: string) {
  return name.trim() || "tcptun";
}

function stringField(source: JsonRecord, key: string) {
  return String(source[key] ?? "").trim();
}

function booleanField(source: JsonRecord, key: string) {
  const value = source[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["1", "true", "yes"].includes(value.trim().toLowerCase());
  return false;
}

function base64Encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function convertConfig(source: JsonRecord, options: Record<string, string>) {
  if (options.target === "server") return convertServer(source, options);
  return convertClient(source, options);
}

function convertClient(source: JsonRecord, options: Record<string, string>) {
  const outbound = selectEndpoint(source.outbounds, options.tag, "outbound");
  const protocol = normalizeProtocol(outbound.protocol);
  const server = outboundServer(protocol, outbound);
  const stream = record(outbound.streamSettings);
  const transport = mapTransport(stream);
  const output: JsonRecord = {
    mode: "client",
    listen_addrs: listenAddrs(options.listen, defaultClientListen),
    server_addr: joinHostPort(String(server.address || ""), server.port),
    token: server.token,
    tunnel_protocol: protocol,
    tunnel_transport: transport.transport,
    tunnel_path: transport.path,
    tunnel_flow: server.flow,
    upstream_protocol: options.upstreamProtocol || "socks5",
  };
  applyClientSecurity(output, stream);
  return cleanObject(output);
}

function convertServer(source: JsonRecord, options: Record<string, string>) {
  const inbound = selectEndpoint(source.inbounds, options.tag, "inbound");
  const protocol = normalizeProtocol(inbound.protocol);
  const auth = inboundAuth(protocol, inbound);
  const stream = record(inbound.streamSettings);
  const transport = mapTransport(stream);
  const output: JsonRecord = {
    mode: "server",
    listen_addrs: listenAddrs(serverListen(inbound, options.listen), defaultServerListen),
    token: auth.token,
    tunnel_protocol: protocol,
    tunnel_transport: transport.transport,
    tunnel_path: transport.path,
    tunnel_flow: auth.flow,
  };
  applyServerSecurity(output, stream);
  return cleanObject(output);
}

function selectEndpoint(value: unknown, tag: string, name: string) {
  const endpoints = Array.isArray(value) ? value.map(record) : [];
  if (!endpoints.length) throw new Error(`配置里没有 ${name}。`);
  const wanted = tag.trim();
  if (wanted) {
    const found = endpoints.find((endpoint) => endpoint.tag === wanted);
    if (!found) throw new Error(`找不到 tag 为 ${wanted} 的 ${name}。`);
    return found;
  }
  const found = endpoints.find((endpoint) => supportedProtocols.has(String(endpoint.protocol || "").toLowerCase()));
  if (!found) throw new Error(`没有可转换的 ${name}，当前支持 vless、vmess、trojan。`);
  return found;
}

function outboundServer(protocol: string, outbound: JsonRecord) {
  const settings = record(outbound.settings);
  if (protocol === "trojan") {
    const server = first(settings.servers, "Trojan outbound server");
    if (!server.password) throw new Error("Trojan outbound password 为空。");
    return {
      address: server.address,
      port: server.port,
      token: server.password,
      flow: server.flow || "",
    };
  }
  const server = first(settings.vnext, `${protocol} outbound vnext server`);
  const user = first(server.users, `${protocol} outbound user`);
  if (!user.id) throw new Error(`${protocol} outbound user id 为空。`);
  return {
    address: server.address,
    port: server.port,
    token: user.id,
    flow: user.flow || "",
  };
}

function inboundAuth(protocol: string, inbound: JsonRecord) {
  const settings = record(inbound.settings);
  const client = first(settings.clients, `${protocol} inbound client`);
  if (protocol === "trojan") {
    if (!client.password) throw new Error("Trojan inbound client password 为空。");
    return { token: client.password, flow: client.flow || "" };
  }
  if (!client.id) throw new Error(`${protocol} inbound client id 为空。`);
  return { token: client.id, flow: client.flow || "" };
}

function applyClientSecurity(output: JsonRecord, stream: JsonRecord) {
  const security = String(stream.security || "none").trim().toLowerCase();
  if (security === "none") return;
  if (security === "tls") {
    const tls = record(stream.tlsSettings);
    output.tunnel_tls = true;
    output.tunnel_tls_server_name = tls.serverName || "";
    output.tunnel_tls_insecure = Boolean(tls.allowInsecure);
    return;
  }
  if (security === "reality") {
    const reality = record(stream.realitySettings);
    if (!reality.serverName) throw new Error("REALITY outbound 需要 realitySettings.serverName。");
    if (!reality.publicKey) throw new Error("REALITY outbound 需要 realitySettings.publicKey。");
    output.tunnel_security = "reality";
    output.reality_server_name = reality.serverName;
    output.reality_fingerprint = reality.fingerprint || "chrome";
    output.reality_public_key = reality.publicKey;
    output.reality_short_id = reality.shortId || "";
    output.reality_spider_x = reality.spiderX || "";
    return;
  }
  throw new Error(`不支持的 stream security: ${stream.security}`);
}

function applyServerSecurity(output: JsonRecord, stream: JsonRecord) {
  const security = String(stream.security || "none").trim().toLowerCase();
  if (security === "none") return;
  if (security === "tls") {
    const certificate = first(record(stream.tlsSettings).certificates, "TLS certificate");
    output.tunnel_tls_cert = certificate.certificateFile || "";
    output.tunnel_tls_key = certificate.keyFile || "";
    if (!output.tunnel_tls_cert || !output.tunnel_tls_key) {
      throw new Error("TLS inbound 需要 certificateFile 和 keyFile。");
    }
    return;
  }
  if (security === "reality") {
    const reality = record(stream.realitySettings);
    if (!reality.privateKey) throw new Error("REALITY inbound 需要 realitySettings.privateKey。");
    if (!Array.isArray(reality.serverNames) || reality.serverNames.length === 0) {
      throw new Error("REALITY inbound 需要 realitySettings.serverNames。");
    }
    if (!reality.dest) throw new Error("REALITY inbound 需要 realitySettings.dest。");
    output.tunnel_security = "reality";
    output.reality_private_key = reality.privateKey;
    output.reality_server_names = reality.serverNames;
    output.reality_short_ids = Array.isArray(reality.shortIds) ? reality.shortIds : [];
    output.reality_dest = reality.dest;
    return;
  }
  throw new Error(`不支持的 stream security: ${stream.security}`);
}

function mapTransport(stream: JsonRecord) {
  const network = String(stream.network || "tcp").trim().toLowerCase();
  if (network === "tcp" || network === "raw") return { transport: "raw", path: "" };
  if (network === "ws" || network === "websocket") {
    return { transport: "ws", path: normalizePath(record(stream.wsSettings).path) };
  }
  if (network === "http" || network === "h2") {
    return { transport: "h2", path: normalizePath(record(stream.httpSettings).path) };
  }
  if (network === "quic") throw new Error("Xray QUIC 与 tcptun HTTP/3 不是同一种承载层。");
  throw new Error(`不支持的 Xray/V2Ray network: ${stream.network}`);
}

function first(value: unknown, label: string) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`缺少 ${label}。`);
  return record(value[0]);
}

function normalizeProtocol(value: unknown) {
  const protocol = String(value || "").trim().toLowerCase();
  if (!supportedProtocols.has(protocol)) throw new Error(`不支持的协议: ${value}`);
  return protocol;
}

function serverListen(inbound: JsonRecord, override: string) {
  const trimmed = override.trim();
  if (trimmed && trimmed !== defaultClientListen) return trimmed;
  const host = String(inbound.listen || "0.0.0.0");
  if (!inbound.port) return defaultServerListen;
  return joinHostPort(host, inbound.port);
}

function joinHostPort(address: string, port: unknown) {
  const host = address.trim();
  const parsedPort = Number(port);
  if (!host) throw new Error("服务端地址为空。");
  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    throw new Error(`无效端口: ${String(port)}`);
  }
  if (host.includes(":") && !host.startsWith("[")) return `[${host}]:${parsedPort}`;
  return `${host}:${parsedPort}`;
}

function listenAddrs(value: unknown, fallback: string) {
  const parts = String(value || fallback)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [];
}

function normalizePath(value: unknown) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function commaList(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateSOCKS5Credential(label: string, value: string) {
  if (new TextEncoder().encode(value).length > 255) {
    throw new Error(`${label} 不能超过 255 字节。`);
  }
}

function cleanObject(value: unknown): JsonRecord {
  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item)).filter((item) => item !== undefined) as unknown as JsonRecord;
  }
  const source = record(value);
  const output: JsonRecord = {};
  for (const [key, item] of Object.entries(source)) {
    const cleaned = cleanValue(item);
    if (cleaned === undefined) continue;
    if (Array.isArray(cleaned) && cleaned.length === 0) continue;
    output[key] = cleaned;
  }
  return output;
}

function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => cleanValue(item)).filter((item) => item !== undefined);
  if (value && typeof value === "object") return cleanObject(value);
  if (value === "" || value === false || value === null || value === undefined) return undefined;
  return value;
}

function tokenForProtocol(protocol: string) {
  if (releaseManifest.protocols[protocol]?.tokenKind === "uuid") return uuidV4();
  return hexToken(32);
}

function presetDefaults(protocol: string) {
  const preset = releaseManifest.protocols[protocol] || Object.values(releaseManifest.protocols)[0];
  if (!preset) throw new Error("tcptun 发布清单中没有协议配置。");
  const server = preset.server;
  const client = preset.client;
  const security = securityForPreset(server, client);
  const forceUpstream = record(preset.route.force_upstream);

  return {
    transport: stringField(client, "tunnel_transport") || "raw",
    security,
    serverAddr: stringField(client, "server_addr") || "proxy.example.com:9443",
    serverListen: arrayFirst(server.listen_addrs) || defaultServerListen,
    clientListen: arrayFirst(client.listen_addrs) || defaultClientListen,
    path: stringField(client, "tunnel_path") || "/proxy",
    serverName: stringField(client, "reality_server_name") || stringField(client, "tunnel_tls_server_name") || "example.com",
    realityDest: stringField(server, "reality_dest") || "example.com:443",
    shortId: stringField(client, "reality_short_id"),
    forceCidrs: Array.isArray(forceUpstream.ip_cidrs) ? forceUpstream.ip_cidrs.join(",") : "",
  };
}

function securityForPreset(server: JsonRecord, client: JsonRecord) {
  const tunnelSecurity = stringField(client, "tunnel_security") || stringField(server, "tunnel_security");
  if (tunnelSecurity && tunnelSecurity !== "none") return tunnelSecurity;
  if (booleanField(client, "tunnel_tls") || stringField(server, "tunnel_tls_cert")) return "tls";
  return "none";
}

function arrayFirst(value: unknown) {
  return Array.isArray(value) && value.length ? String(value[0]) : "";
}

function cloneRecord(value: JsonRecord) {
  return JSON.parse(JSON.stringify(value)) as JsonRecord;
}

function removeSecurityFields(config: JsonRecord) {
  for (const key of [
    "tunnel_security",
    "tunnel_flow",
    "tunnel_tls",
    "tunnel_tls_cert",
    "tunnel_tls_key",
    "tunnel_tls_server_name",
    "tunnel_tls_insecure",
    "reality_private_key",
    "reality_public_key",
    "reality_server_name",
    "reality_server_names",
    "reality_short_id",
    "reality_short_ids",
    "reality_fingerprint",
    "reality_dest",
    "reality_spider_x",
  ]) {
    delete config[key];
  }
}

function uuidV4() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function hexToken(size: number) {
  return Array.from(randomBytes(size), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomBytes(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function realityKeyPair() {
  if (!crypto.subtle) {
    throw new Error("当前浏览器不支持 WebCrypto X25519 密钥生成。");
  }
  const keyPair = (await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"])) as CryptoKeyPair;
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  if (!privateJwk.d || !publicJwk.x) throw new Error("REALITY 密钥导出失败。");
  return {
    privateKey: privateJwk.d,
    publicKey: publicJwk.x,
  };
}

function record(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  return {};
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
