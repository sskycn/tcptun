(function () {
  "use strict";

  const DEFAULT_CLIENT_LISTEN = "127.0.0.1:1080";
  const DEFAULT_SERVER_LISTEN = "0.0.0.0:443";
  const SUPPORTED_PROTOCOLS = new Set(["vless", "vmess", "trojan"]);
  let generatedFiles = {};
  let activeGeneratedFile = "server";
  let converterText = "";

  function normalizePath(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  function cleanObject(value) {
    if (Array.isArray(value)) {
      return value.map(cleanObject).filter((item) => item !== undefined);
    }
    if (value && typeof value === "object") {
      const output = {};
      for (const [key, item] of Object.entries(value)) {
        const cleaned = cleanObject(item);
        if (cleaned === undefined) continue;
        if (Array.isArray(cleaned) && cleaned.length === 0) continue;
        output[key] = cleaned;
      }
      return output;
    }
    if (value === "" || value === false || value === null || value === undefined) {
      return undefined;
    }
    return value;
  }

  function randomBytes(size) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function hexToken(size) {
    return Array.from(randomBytes(size), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function uuidV4() {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function base64URL(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  async function realityKeyPair() {
    if (!crypto.subtle) {
      throw new Error("This browser does not support WebCrypto X25519 key generation.");
    }
    const keyPair = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]);
    const privateJWK = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const publicJWK = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    if (!privateJWK.d || !publicJWK.x) {
      throw new Error("Failed to export generated REALITY keys.");
    }
    return {
      privateKey: privateJWK.d,
      publicKey: publicJWK.x,
    };
  }

  function tokenForProtocol(protocol) {
    if (protocol === "vless" || protocol === "vmess") return uuidV4();
    return hexToken(32);
  }

  async function generateConfigs(form) {
    const protocol = form.protocol;
    const transport = form.transport;
    const security = form.security;
    if (security === "reality" && protocol !== "vless") {
      throw new Error("REALITY config generation requires VLESS.");
    }
    if (security === "reality" && transport !== "raw") {
      throw new Error("REALITY config generation requires raw transport.");
    }

    const token = tokenForProtocol(protocol);
    const tunnelPath = normalizePath(form.path);
    const server = {
      mode: "server",
      listen_addr: form.serverListen,
      token,
      tunnel_protocol: protocol,
      tunnel_transport: transport,
      tunnel_path: tunnelPath,
    };
    const client = {
      mode: "client",
      listen_addr: form.clientListen,
      server_addr: form.serverAddr,
      token,
      tunnel_protocol: protocol,
      tunnel_transport: transport,
      tunnel_path: tunnelPath,
      upstream_protocol: "socks5",
    };

    if (security === "tls" || transport === "h3") {
      server.tunnel_tls_cert = "server.crt";
      server.tunnel_tls_key = "server.key";
      if (transport !== "h3") {
        client.tunnel_tls = true;
      }
      client.tunnel_tls_server_name = form.serverName;
    }

    if (security === "reality") {
      const keys = await realityKeyPair();
      server.tunnel_security = "reality";
      server.tunnel_flow = "xtls-rprx-vision";
      server.reality_private_key = keys.privateKey;
      server.reality_server_names = [form.serverName];
      server.reality_dest = form.realityDest;
      if (form.shortID) server.reality_short_ids = [form.shortID];

      client.tunnel_security = "reality";
      client.tunnel_flow = "xtls-rprx-vision";
      client.reality_server_name = form.serverName;
      client.reality_fingerprint = "chrome";
      client.reality_public_key = keys.publicKey;
      client.reality_spider_x = "/";
      if (form.shortID) client.reality_short_id = form.shortID;
    }

    const route = {
      force_upstream: {
        domains: [],
        domain_regexes: [],
        domain_suffixes: [],
        ips: [],
        ip_cidrs: commaList(form.forceCIDRs),
        ip_ranges: [],
      },
    };

    return {
      server: cleanObject(server),
      client: cleanObject(client),
      route,
    };
  }

  function commaList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function convertConfig(source, options) {
    const target = options.target || "client";
    if (target === "client") return convertClient(source, options);
    if (target === "server") return convertServer(source, options);
    throw new Error(`Unsupported target: ${target}`);
  }

  function sampleConfig(target) {
    if (target === "server") {
      return {
        inbounds: [
          {
            tag: "proxy",
            listen: "0.0.0.0",
            port: 443,
            protocol: "vless",
            settings: {
              clients: [{ id: uuidV4(), flow: "xtls-rprx-vision", encryption: "none" }],
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
    }
    return {
      outbounds: [
        {
          tag: "proxy",
          protocol: "vless",
          settings: {
            vnext: [
              {
                address: "proxy.example.com",
                port: 443,
                users: [{ id: uuidV4(), flow: "xtls-rprx-vision", encryption: "none" }],
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
  }

  function convertClient(source, options) {
    const outbound = selectEndpoint(source.outbounds, options.tag, "outbound");
    const protocol = normalizeProtocol(outbound.protocol);
    const server = outboundServer(protocol, outbound);
    const stream = outbound.streamSettings || {};
    const transport = mapTransport(stream);
    const output = {
      mode: "client",
      listen_addr: options.listen || DEFAULT_CLIENT_LISTEN,
      server_addr: joinHostPort(server.address, server.port),
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

  function convertServer(source, options) {
    const inbound = selectEndpoint(source.inbounds, options.tag, "inbound");
    const protocol = normalizeProtocol(inbound.protocol);
    const auth = inboundAuth(protocol, inbound);
    const stream = inbound.streamSettings || {};
    const transport = mapTransport(stream);
    const output = {
      mode: "server",
      listen_addr: serverListen(inbound, options.listen),
      token: auth.token,
      tunnel_protocol: protocol,
      tunnel_transport: transport.transport,
      tunnel_path: transport.path,
      tunnel_flow: auth.flow,
    };
    applyServerSecurity(output, stream);
    return cleanObject(output);
  }

  function selectEndpoint(endpoints, tag, name) {
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      throw new Error(`The config has no ${name}s.`);
    }
    const wanted = String(tag || "").trim();
    if (wanted) {
      const found = endpoints.find((endpoint) => endpoint.tag === wanted);
      if (!found) throw new Error(`${name} tag "${wanted}" was not found.`);
      return found;
    }
    const found = endpoints.find((endpoint) => SUPPORTED_PROTOCOLS.has(String(endpoint.protocol || "").toLowerCase()));
    if (!found) throw new Error(`No supported ${name} found. Supported protocols: vless, vmess, trojan.`);
    return found;
  }

  function normalizeProtocol(value) {
    const protocol = String(value || "").trim().toLowerCase();
    if (!SUPPORTED_PROTOCOLS.has(protocol)) throw new Error(`Unsupported protocol: ${value}`);
    return protocol;
  }

  function outboundServer(protocol, outbound) {
    const settings = outbound.settings || {};
    if (protocol === "trojan") {
      const server = first(settings.servers, "trojan outbound server");
      if (!server.password) throw new Error("Trojan outbound password is empty.");
      return {
        address: server.address,
        port: server.port,
        token: server.password,
        flow: server.flow || "",
      };
    }
    const server = first(settings.vnext, `${protocol} outbound vnext server`);
    const user = first(server.users, `${protocol} outbound user`);
    if (!user.id) throw new Error(`${protocol} outbound user id is empty.`);
    return {
      address: server.address,
      port: server.port,
      token: user.id,
      flow: user.flow || "",
    };
  }

  function inboundAuth(protocol, inbound) {
    const settings = inbound.settings || {};
    const client = first(settings.clients, `${protocol} inbound client`);
    if (protocol === "trojan") {
      if (!client.password) throw new Error("Trojan inbound client password is empty.");
      return { token: client.password, flow: client.flow || "" };
    }
    if (!client.id) throw new Error(`${protocol} inbound client id is empty.`);
    return { token: client.id, flow: client.flow || "" };
  }

  function first(values, label) {
    if (!Array.isArray(values) || values.length === 0) throw new Error(`Missing ${label}.`);
    return values[0];
  }

  function joinHostPort(address, port) {
    const host = String(address || "").trim();
    const parsedPort = Number(port);
    if (!host) throw new Error("Server address is empty.");
    if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
      throw new Error(`Invalid server port: ${port}`);
    }
    if (host.includes(":") && !host.startsWith("[")) return `[${host}]:${parsedPort}`;
    return `${host}:${parsedPort}`;
  }

  function serverListen(inbound, override) {
    const trimmed = String(override || "").trim();
    if (trimmed && trimmed !== DEFAULT_CLIENT_LISTEN) return trimmed;
    const host = inbound.listen || "0.0.0.0";
    if (!inbound.port) return DEFAULT_SERVER_LISTEN;
    return joinHostPort(host, inbound.port);
  }

  function mapTransport(stream) {
    const network = String(stream.network || "tcp").trim().toLowerCase();
    if (network === "tcp" || network === "raw") return { transport: "raw", path: "" };
    if (network === "ws" || network === "websocket") {
      return { transport: "ws", path: normalizePath(stream.wsSettings && stream.wsSettings.path) };
    }
    if (network === "http" || network === "h2") {
      return { transport: "h2", path: normalizePath(stream.httpSettings && stream.httpSettings.path) };
    }
    if (network === "quic") throw new Error("Xray QUIC transport is not the same as tcptun HTTP/3.");
    throw new Error(`Unsupported Xray/V2Ray network: ${stream.network}`);
  }

  function applyClientSecurity(output, stream) {
    const security = String(stream.security || "none").trim().toLowerCase();
    if (security === "none") return;
    if (security === "tls") {
      const tls = stream.tlsSettings || {};
      output.tunnel_tls = true;
      output.tunnel_tls_server_name = tls.serverName || "";
      output.tunnel_tls_insecure = Boolean(tls.allowInsecure);
      return;
    }
    if (security === "reality") {
      const reality = stream.realitySettings || {};
      if (!reality.serverName) throw new Error("REALITY outbound requires realitySettings.serverName.");
      if (!reality.publicKey) throw new Error("REALITY outbound requires realitySettings.publicKey.");
      output.tunnel_security = "reality";
      output.reality_server_name = reality.serverName;
      output.reality_fingerprint = reality.fingerprint || "chrome";
      output.reality_public_key = reality.publicKey;
      output.reality_short_id = reality.shortId || "";
      output.reality_spider_x = reality.spiderX || "";
      return;
    }
    throw new Error(`Unsupported stream security: ${stream.security}`);
  }

  function applyServerSecurity(output, stream) {
    const security = String(stream.security || "none").trim().toLowerCase();
    if (security === "none") return;
    if (security === "tls") {
      const certificate = first(stream.tlsSettings && stream.tlsSettings.certificates, "TLS certificate");
      output.tunnel_tls_cert = certificate.certificateFile || "";
      output.tunnel_tls_key = certificate.keyFile || "";
      if (!output.tunnel_tls_cert || !output.tunnel_tls_key) {
        throw new Error("TLS inbound certificateFile and keyFile are required.");
      }
      return;
    }
    if (security === "reality") {
      const reality = stream.realitySettings || {};
      if (!reality.privateKey) throw new Error("REALITY inbound requires realitySettings.privateKey.");
      if (!Array.isArray(reality.serverNames) || reality.serverNames.length === 0) {
        throw new Error("REALITY inbound requires realitySettings.serverNames.");
      }
      if (!reality.dest) throw new Error("REALITY inbound requires realitySettings.dest.");
      output.tunnel_security = "reality";
      output.reality_private_key = reality.privateKey;
      output.reality_server_names = reality.serverNames;
      output.reality_short_ids = reality.shortIds || [];
      output.reality_dest = reality.dest;
      return;
    }
    throw new Error(`Unsupported stream security: ${stream.security}`);
  }

  function pretty(value) {
    return JSON.stringify(value, null, 2);
  }

  function setStatus(element, message, kind) {
    if (!element) return;
    element.textContent = message || "";
    element.classList.remove("ok", "error");
    if (kind) element.classList.add(kind);
  }

  function setCode(element, text) {
    if (!element) return;
    element.textContent = text;
  }

  async function copyText(text, statusElement) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus(statusElement, "Copied.", "ok");
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function initGenerator() {
    const output = document.getElementById("generator-output");
    const status = document.getElementById("generator-status");
    const tabs = Array.from(document.querySelectorAll("[data-generated-file]"));
    const currentText = () => (generatedFiles[activeGeneratedFile] ? pretty(generatedFiles[activeGeneratedFile]) : "");

    function renderActive() {
      const text = currentText();
      setCode(output, text || "Click Generate to create config files.");
      tabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.generatedFile === activeGeneratedFile);
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeGeneratedFile = tab.dataset.generatedFile;
        renderActive();
      });
    });

    document.getElementById("generate-button").addEventListener("click", async () => {
      try {
        generatedFiles = await generateConfigs({
          protocol: document.getElementById("gen-protocol").value,
          transport: document.getElementById("gen-transport").value,
          security: document.getElementById("gen-security").value,
          serverAddr: document.getElementById("gen-server-addr").value.trim(),
          serverListen: document.getElementById("gen-server-listen").value.trim(),
          clientListen: document.getElementById("gen-client-listen").value.trim(),
          path: document.getElementById("gen-path").value.trim(),
          serverName: document.getElementById("gen-server-name").value.trim(),
          realityDest: document.getElementById("gen-reality-dest").value.trim(),
          shortID: document.getElementById("gen-short-id").value.trim(),
          forceCIDRs: document.getElementById("gen-force-cidrs").value.trim(),
        });
        activeGeneratedFile = "server";
        renderActive();
        setStatus(status, "Generated server.json, client.json, and route.json.", "ok");
      } catch (error) {
        setStatus(status, error.message, "error");
      }
    });

    document.getElementById("generator-copy-button").addEventListener("click", () => {
      copyText(currentText(), status).catch((error) => setStatus(status, error.message, "error"));
    });
    document.getElementById("generator-download-button").addEventListener("click", () => {
      const text = currentText();
      if (!text) return;
      downloadText(`${activeGeneratedFile}.json`, text);
    });
  }

  function initConverter() {
    const target = document.getElementById("target");
    const listen = document.getElementById("listen");
    const upstreamRow = document.getElementById("upstream-row");
    const source = document.getElementById("source-config");
    const output = document.getElementById("converter-output");
    const status = document.getElementById("converter-status");

    function syncTarget() {
      const isClient = target.value === "client";
      upstreamRow.style.display = isClient ? "grid" : "none";
      if (isClient && listen.value === DEFAULT_SERVER_LISTEN) listen.value = DEFAULT_CLIENT_LISTEN;
      if (!isClient && listen.value === DEFAULT_CLIENT_LISTEN) listen.value = "";
    }

    target.addEventListener("change", syncTarget);
    syncTarget();

    document.getElementById("sample-button").addEventListener("click", () => {
      source.value = pretty(sampleConfig(target.value));
      setStatus(status, "", "");
    });

    document.getElementById("convert-button").addEventListener("click", () => {
      try {
        const parsed = JSON.parse(source.value);
        const converted = convertConfig(parsed, {
          target: target.value,
          tag: document.getElementById("tag").value,
          listen: listen.value.trim(),
          upstreamProtocol: document.getElementById("upstream").value,
        });
        converterText = pretty(converted);
        setCode(output, converterText);
        setStatus(status, "Converted.", "ok");
      } catch (error) {
        setStatus(status, error.message, "error");
      }
    });

    document.getElementById("copy-button").addEventListener("click", () => {
      copyText(converterText, status).catch((error) => setStatus(status, error.message, "error"));
    });
    document.getElementById("download-button").addEventListener("click", () => {
      if (!converterText) return;
      downloadText(target.value === "server" ? "server.json" : "client.json", converterText);
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      initGenerator();
      initConverter();
    });
  }

  if (typeof module !== "undefined") {
    module.exports = {
      convertConfig,
      generateConfigs,
      sampleConfig,
      uuidV4,
      realityKeyPair,
    };
  }
})();
