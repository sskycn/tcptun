export const releaseVersion = "0.2.5";

/** Download and package links for the published npm package `tcptun`. */
export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  packageVersion: `https://www.npmjs.com/package/tcptun/v/${releaseVersion}`,
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
  /** Individual binaries from the npm package (served via jsDelivr). */
  binaryBase: `https://cdn.jsdelivr.net/npm/tcptun@${releaseVersion}/dist`,
  latestBinaryBase: "https://cdn.jsdelivr.net/npm/tcptun@latest/dist",
};

/** @deprecated Prefer npmLinks.binaryBase — binaries are no longer hosted on Pages. */
export const releaseBasePath = npmLinks.binaryBase;

export const installCommand = "curl -fsSL https://tcptun.com/install.sh | sh";

export const pinnedInstallCommand = `curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=${releaseVersion} sh`;

export const npmInstallCommand = `npm install -g tcptun@${releaseVersion}`;

export const releaseHighlights = [
  {
    label: "Carrier control",
    title: "carrier.mode separate from mux",
    body: "v0.2.5 selects Reality carriers with carrier.mode=auto|tcp|quic while security.type stays reality. Mux remains enablement and pooling; forced QUIC no longer depends on inventing alternate security type names alone.",
  },
  {
    label: "Native camouflage",
    title: "TLS passthrough + ECH ClientHello",
    body: "security.type=none inbounds can fall back ordinary HTTPS probes via tls_passthrough, or protect carried TLS 1.3 SNI with client_hello.type=ech (tcptun config native --ech).",
  },
  {
    label: "Mux & QUIC under loss",
    title: "Transactional failover and high-loss recovery",
    body: "Endpoint failover is transactional, response timeouts stay isolated, and QUIC paths penalize lossy carriers with stronger retransmission and adaptive recovery under burst loss.",
  },
  {
    label: "Hot path performance",
    title: "Leaner UDP, Reality, and framed writes",
    body: "UDP relay buffer leasing, Reality TLS record batching, framed-write reductions, and uquic packet ownership reuse cut allocation noise on long-lived tunnels.",
  },
] as const;

/** Detailed native + raw + reality capability notes (available since v0.2.3). */
export const nativeRealityAutoNotes = [
  {
    title: "Required stack",
    body: "Automatic dual carriers need type=native, transport.type=raw, mux enabled, security.type=reality, and carrier.mode=auto (default for generators). Missing mux keeps ordinary TCP-only Reality.",
  },
  {
    title: "carrier.mode",
    body: "Set carrier.mode to auto (QUIC-first with TCP fallback), tcp, or quic. security.type remains reality in all three cases. quic and auto require mux.enabled.",
  },
  {
    title: "One address, two sockets",
    body: "The inbound binds TCP and UDP to the same host:port. Clients race the same address over both carriers without a second listen entry.",
  },
  {
    title: "QUIC first, TCP fallback",
    body: "Outbounds prefer the Reality QUIC carrier. When UDP is blocked or unhealthy, they fall back to Reality TCP with jittered exponential backoff, then probe to restore QUIC preference.",
  },
  {
    title: "Shared camouflage",
    body: "Both carriers share the same REALITY keys, short IDs, SNI, and dest. The camouflage destination should support HTTPS over TCP and HTTP/3 over UDP.",
  },
  {
    title: "Scope of selection",
    body: "TCP streams, UDP relay, and reverse carriers follow the same automatic carrier policy when the stack is Reality-auto.",
  },
  {
    title: "Escape hatches",
    body: "carrier.mode=tcp forces Reality TCP only. carrier.mode=quic forces the dedicated QUIC pool without TCP fallback. security.type remains reality.",
  },
] as const;

export const nativeRealityAutoLayers = [
  {
    label: "Protocol",
    value: "native",
    body: "Token auth, TCP/UDP tunnel semantics, reverse publish, and resumable logical streams.",
  },
  {
    label: "Transport",
    value: "raw",
    body: "Required base transport for automatic dual carriers. Do not stack ws / h2 / h3 in this mode.",
  },
  {
    label: "Security",
    value: "reality",
    body: "Camouflage keys/SNI/dest. Pair with carrier.mode for auto, TCP-only, or QUIC-only selection.",
  },
  {
    label: "Carrier",
    value: "mode=auto",
    body: "v0.2.5 default generator path: QUIC-first Reality with TCP fallback on one address.",
  },
  {
    label: "Multiplexing",
    value: "mux.enabled",
    body: "Mux enables dual-carrier and pooling. Optional mux.resume preserves eligible TCP flows across carrier replacement.",
  },
] as const;

export const faqItems = [
  {
    question: "Can I use Xray config files directly?",
    answer: "No. tcptun uses its own JSON topology. Xray compatibility covers wire protocols such as VLESS / VMess / Trojan, not the config format.",
  },
  {
    question: "What is the native protocol?",
    answer: "native is tcptun’s private tunnel protocol for tcptun-to-tcptun setups. A typical path is local mixed → native outbound → native inbound → direct, with matching users[].id and token. See the Native guide for a full tutorial and examples.",
  },
  {
    question: "How do I run my first native tunnel?",
    answer: "Install tcptun, run tcptun config native --server <host> --port <port>, edit the generated server/client endpoints and token, validate with tcptun config check, start the server then the client, and point apps at 127.0.0.1:1080.",
  },
  {
    question: "How do I choose among the four tunnel protocols?",
    answer: "Prefer native for tcptun-to-tcptun throughput, mux, QUIC, and reverse publish. Use vless / vmess / trojan when you need wire interop with Xray-compatible clients or servers.",
  },
  {
    question: "How do I validate a config?",
    answer: "Run tcptun config check --config config.json. It validates and compiles without listening on ports.",
  },
  {
    question: "Where does one-line install put the binary, and how do I pin a version?",
    answer:
      "It installs to /usr/local/bin by default. Use TCPTUN_INSTALL_DIR to change the directory and TCPTUN_VERSION to pin a version. The installer downloads platform binaries from the published npm package (cdn.jsdelivr.net/npm/tcptun).",
  },
  {
    question: "Which platforms are supported?",
    answer: "macOS, Linux, and Windows on amd64 / arm64 (Linux also includes armv7). Prefer npm install -g tcptun or the one-line installer for CLI builds.",
  },
  {
    question: "How is the native token configured?",
    answer: "Server users[].id and client token must match. Use tcptun config native to generate a paired config.",
  },
  {
    question: "What is native + raw + reality in v0.2.5?",
    answer:
      "It is the automatic dual-carrier stack: type=native, transport raw, mux enabled, security.type=reality, and carrier.mode=auto. The server binds TCP and UDP on one address; the client prefers Reality QUIC, falls back to Reality TCP with backoff, and probes to restore QUIC. Camouflage keys/SNI/dest are shared by both carriers. Without mux, Reality stays TCP-only.",
  },
  {
    question: "How do I choose carrier.mode?",
    answer:
      "carrier.mode=auto (default generators) is QUIC-first with Reality TCP fallback. mode=tcp is Reality TCP only. mode=quic is the dedicated QUIC pool without TCP fallback. security.type stays reality; mux must be enabled for auto and quic.",
  },
  {
    question: "When should I enable mux or QUIC?",
    answer:
      "For many short connections, prefer mux.enabled. In v0.2.5, native + raw + mux + reality with carrier.mode=auto prefers QUIC and falls back to Reality TCP. Use carrier.mode=tcp to force TCP, or carrier.mode=quic to force QUIC without fallback.",
  },
  {
    question: "How do resumable streams work?",
    answer:
      "Set mux.resume=true on both native endpoints using the Reality-auto stack (raw + mux + security.type=reality + carrier.mode=auto). A TCP logical stream can reattach after its physical QUIC/TCP carrier fails. It does not cover UDP, reverse publish, forced tcp/quic-only modes, or cross-process failover; keep it off during rolling upgrades until both peers run v0.2.5 or newer.",
  },
  {
    question: "What is TLS passthrough fallback?",
    answer:
      "A native raw TCP inbound with security.type=none can set fallback.type=tls_passthrough to forward ordinary HTTPS probes (matching SNI) to a fixed dest while authenticating native mux traffic. It is inbound-only camouflage, not REALITY, and does not encrypt the native payload.",
  },
  {
    question: "What is Native ECH ClientHello protection?",
    answer:
      "With security.type=none and client_hello.type=ech, the tunnel can hide only the SNI of a carried TLS 1.3 ClientHello (tcptun config native --ech). Later application bytes stay on the security-none path; this is not full application ECH to the destination site.",
  },
  {
    question: "Can REALITY be used together with TLS?",
    answer: "No. REALITY works only with raw and cannot be combined with security.type=tls.",
  },
  {
    question: "How should the address field be written?",
    answer:
      "Both inbound and outbound address values are host:port string arrays. Multiple addresses are candidate entry points for the same logical service and race on first handshake; they are not balance load balancing.",
  },
  {
    question: "What is reverse publish?",
    answer:
      "native + raw + mux (group or QUIC) can publish NAT-side TCP/UDP services to the server: configure publish on the server and expose on the client, with matching service names.",
  },
  {
    question: "Is browser-based config generation safe?",
    answer:
      "Keys and credentials are generated locally with Web Crypto and never uploaded. You can also use the CLI: tcptun config <protocol> --server ….",
  },
  {
    question: "How do I convert an Xray config to tcptun?",
    answer:
      "Paste Xray JSON or vless/vmess/trojan links in Convert. REALITY/TLS and raw/ws/h2/h3 are supported; unsupported transports such as gRPC produce warnings.",
  },
  {
    question: "What happens when no config file is provided?",
    answer:
      "tcptun never searches the current directory for server.json, client.json, or config.json. Without --config it reserves 127.0.0.1:1080, scans private IPv4 LAN peers for SOCKS5:1080, then starts a mixed proxy after the first successful handshake. --retry keeps the listener and retries discovery; it cannot be combined with --config.",
  },
  {
    question: "How do I load-balance and switch among outbounds?",
    answer:
      "Use a balance outbound to group members with weights and affinity_ttl. Multiple addresses on one outbound only race as candidate entry points; they are not load balancing. The embeddable Runtime and Android bridge also support start/stop, probing, and atomic switches of declared outbounds.",
  },
] as const;

export const disclaimerItems = [
  {
    title: "Lawful use only",
    body: "tcptun and this website may be used only for lawful purposes and only in compliance with applicable laws, regulations, and the policies of any network or service you connect to. Any illegal use is strictly prohibited. You must determine for yourself whether a particular use is lawful in your jurisdiction.",
  },
  {
    title: "You bear all consequences",
    body: "You alone are responsible for how you download, install, configure, and operate this software, including the systems you access, the traffic you forward, and the configs you create. Any risk, loss, liability, dispute, claim, penalty, or other consequence arising from your use is borne solely by you.",
  },
  {
    title: "No warranty or promise from the author",
    body: "The author makes no warranty, guarantee, representation, or promise—express or implied—about fitness for a particular purpose, merchantability, non-infringement, availability, security, correctness, or any outcome. The software, binaries, install scripts, website, and browser tools are provided strictly “as is” and “as available”.",
  },
  {
    title: "No liability for your use",
    body: "To the maximum extent permitted by law, the author, contributors, and site operators are not liable for any direct, indirect, incidental, special, consequential, or punitive damages, or for any loss of data, profits, business, or goodwill, arising from your use of or inability to use tcptun or this website.",
  },
  {
    title: "Your obligation to assess risk",
    body: "Before using this software you must evaluate legal, technical, and operational risks yourself. If you are unsure whether a use is lawful, or whether the software is suitable for your needs, do not use it.",
  },
  {
    title: "Acceptance by use",
    body: "By downloading, installing, configuring, or using tcptun or any tool on this website, you acknowledge and accept this disclaimer in full—especially lawful use, self-borne consequences, and the absence of any warranty or promise by the author. If you do not agree, do not use this software.",
  },
] as const;

export const cookieNotice = {
  title: "Cookies and local storage",
  intro:
    "This website may use cookies and similar technologies (including browser local storage) to operate the site and remember preferences.",
  points: [
    "Theme preference may be stored in your browser (for example localStorage key tcptun-theme) so light, dark, or system mode can be restored on later visits.",
    "Hosting, CDN, or security infrastructure that serves this site may set technical cookies or logs needed to deliver pages, assets, and basic reliability.",
    "Browser tools on this site (config generation, URI conversion, and Xray conversion) process data locally in your browser; those tools are not used by us to set advertising cookies.",
    "We do not use first-party advertising or marketing tracking cookies on this site. Third-party services outside our control may still process requests according to their own policies.",
    "You can clear cookies and site data in your browser settings at any time. Disabling storage may reset preferences such as theme.",
  ],
  acceptance:
    "By continuing to browse or use this website, you acknowledge and accept this cookies statement. If you do not agree, please stop using the site and clear this site’s cookies and stored data from your browser.",
} as const;

/** CLI binaries published inside the npm package `tcptun` under dist/. */
export const binaryDownloads = [
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 20612032),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 19092594),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 20033698),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 18415778),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 18808994),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 20523008),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 18622976),
] as const;

export const inboundTypes = ["mixed", "socks5", "native", "vless", "vmess", "trojan"] as const;
export const outboundTypes = [
  "direct",
  "balance",
  "blackhole",
  "socks5",
  "mixed",
  "native",
  "vless",
  "vmess",
  "trojan",
] as const;

export const tunnelProtocols = [
  {
    name: "native",
    credential: "Token",
    interoperability: "tcptun ↔ tcptun",
    generatedSecurity: "REALITY auto / reality-tcp / reality-quic",
    mux: "Recommended when both ends match",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "Private low-overhead protocol. raw + mux + reality with carrier.mode=auto prefers QUIC and falls back to TCP; resumable streams can preserve eligible TCP flows across carrier replacement.",
  },
  {
    name: "vless",
    credential: "UUID",
    interoperability: "Xray VLESS",
    generatedSecurity: "raw + REALITY + Vision",
    mux: "Optional",
    command: "tcptun config vless --server proxy.example.com --port 9443",
    description: "Supports TCP/UDP. Generated configs default to Vision + REALITY and can interoperate with Xray.",
  },
  {
    name: "vmess",
    credential: "UUID",
    interoperability: "Xray VMess AEAD",
    generatedSecurity: "raw + REALITY",
    mux: "Optional",
    command: "tcptun config vmess --server proxy.example.com --port 9443",
    description: "VMess AEAD with TCP/UDP support and Xray interop.",
  },
  {
    name: "trojan",
    credential: "Password",
    interoperability: "Xray Trojan",
    generatedSecurity: "raw + REALITY",
    mux: "Optional",
    command: "tcptun config trojan --server proxy.example.com --port 9443",
    description: "Password-authenticated Trojan tunnel with TCP/UDP support.",
  },
] as const;

/** Long-form native protocol guide shown on the homepage. */
export const nativeGuideIntro = {
  eyebrow: "Native protocol",
  title: "How native works, and how to run it end to end.",
  lede: "native is tcptun’s private tunnel protocol for tcptun-to-tcptun deployments. One JSON topology describes server and client; the runtime validates auth, transport, security, mux, and reverse publish before listening.",
  points: [
    {
      title: "What it is",
      body: "A token-authenticated tunnel that carries TCP and UDP. The server exposes a native inbound; the client usually listens as mixed/socks5 locally and forwards through a native outbound.",
    },
    {
      title: "When to use it",
      body: "Use native when both ends run tcptun and you want low overhead, mux, automatic QUIC/TCP REALITY, resumable TCP streams, forced QUIC, or reverse publish of services behind NAT.",
    },
    {
      title: "What you configure",
      body: "Match users[].id with token, set address as host:port arrays, choose transport (prefer raw), optional security, and optional mux. Everything else is ordinary tcptun route / inbound / outbound wiring.",
    },
  ],
} as const;

export const nativeGuideConcepts = [
  {
    title: "Topology",
    body: "Typical path: app → local mixed :1080 → native outbound → internet → native :9443 → direct. Server and client are two configs that share credentials and security parameters.",
  },
  {
    title: "Authentication",
    body: "Server inbound users[].id must equal client outbound token. Generate long random tokens; never reuse example values like change-me in production.",
  },
  {
    title: "Address",
    body: "address is always a string array of host:port. Multiple outbound addresses race as candidate entry points for the same logical service; they are not load balancing (use balance for that).",
  },
  {
    title: "Transport",
    body: "raw is the default and best for throughput. ws / h2 / h3 are available when you need path-based fronting; QUIC mode requires raw.",
  },
  {
    title: "Security (v0.2.5)",
    body: "With native + raw + mux + security.type=reality + carrier.mode=auto, QUIC is preferred with Reality TCP fallback on one address. carrier.mode=tcp|quic forces a single carrier. TLS still needs cert/key when not using REALITY.",
  },
  {
    title: "Mux & resume",
    body: "mux.enabled enables multiplexing and dual-carrier Reality auto. Optional mux.resume preserves eligible TCP streams. carrier.mode selects auto/tcp/quic independently of mux pooling knobs.",
  },
] as const;

/**
 * Interactive wizard for first-time setup with the recommended v0.2.5 stack:
 * native + raw + group mux + security.type=reality (QUIC-first, TCP fallback).
 */
export const realityAutoWizardSteps = [
  {
    id: "goal",
    title: "What you will build",
    summary: "A private native tunnel with automatic Reality carriers.",
    body: "This wizard walks through the recommended v0.2.5 path: native + raw + mux + security.type=reality + carrier.mode=auto. One public address carries Reality QUIC (preferred) and Reality TCP (fallback). Your laptop runs a local mixed proxy on 127.0.0.1:1080 and forwards through the tunnel.",
    bullets: [
      "Server: VPS or edge host with a public IP (or DNS name)",
      "Client: laptop / phone / second host that needs a local proxy",
      "Stack: type=native, transport raw, mux enabled, security reality, carrier.mode auto",
      "Outcome: apps use socks5h://127.0.0.1:1080 after both sides start",
    ],
    tips: [
      "Use the same tcptun version (v0.2.5+) on both ends for auto carriers and optional resume.",
      "Camouflage dest should support HTTPS on TCP and ideally HTTP/3 on UDP.",
    ],
    commands: [] as string[],
    configSide: null as null | "server" | "client" | "both",
  },
  {
    id: "install",
    title: "Install tcptun",
    summary: "Put the binary on the server and the client.",
    body: "Install on both machines. Prefer the one-line installer or npm package; both pull CLI binaries from the published npm package. Confirm the binary works with --version.",
    bullets: [
      "Server and client both need the tcptun binary",
      "Binaries are published on npm as package tcptun (dist/*)",
      "Pin with TCPTUN_VERSION or npm install -g tcptun@x.y.z",
    ],
    tips: [
      "If you pin a version: TCPTUN_VERSION=0.2.5 sh -c \"$(curl -fsSL https://tcptun.com/install.sh)\"",
    ],
    commands: [
      "curl -fsSL https://tcptun.com/install.sh | sh",
      "npm install -g tcptun",
      "tcptun --version",
    ],
    configSide: null as null | "server" | "client" | "both",
  },
  {
    id: "stack",
    title: "Understand the stack",
    summary: "Why native + raw + reality + group mux.",
    body: "Automatic dual carriers need native + raw + mux + reality + carrier.mode=auto. Missing mux keeps Reality TCP-only. Forced modes use carrier.mode=tcp or carrier.mode=quic.",
    bullets: [
      "native — private tunnel protocol and token auth",
      "raw — required transport for Reality auto carriers",
      "security.type=reality — QUIC-first with TCP fallback on one address",
      "mux.enabled + carrier.mode=auto — dual carriers (optional mux.resume later)",
    ],
    tips: [
      "Server binds TCP and UDP on the same port.",
      "Client tries Reality QUIC first, falls back to Reality TCP with backoff, then probes to restore QUIC.",
    ],
    commands: [] as string[],
    configSide: null as null | "server" | "client" | "both",
  },
  {
    id: "generate",
    title: "Generate a matching pair",
    summary: "Create server.json and client.json with REALITY keys.",
    body: "Run the generator on a trusted machine. It creates paired credentials: users[].id ↔ token, private_key ↔ public_key, short_ids ↔ short_id. You can use the CLI or the browser generator on this site.",
    bullets: [
      "--server is the public host clients will dial",
      "--port is the public listen/dial port",
      "--server-name and --dest are the REALITY camouflage site",
      "dest should look like example.com:443 and support HTTPS (+ HTTP/3 if possible)",
    ],
    tips: [
      "Browser path: open /generate/, choose native, keep Reality auto enabled.",
      "Do not reuse sample tokens or placeholder keys in production.",
    ],
    commands: [
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
      "ls -l server.json client.json",
    ],
    configSide: "both" as null | "server" | "client" | "both",
  },
  {
    id: "edit",
    title: "Edit endpoints and secrets",
    summary: "Point configs at real hosts and keep credentials matched.",
    body: "Open the generated files and replace placeholders. Server listen address is usually 0.0.0.0:PORT. Client outbound address is the public host:port. users[].id on the server must equal token on the client.",
    bullets: [
      "Server inbound.address → where this machine listens",
      "Client outbound.address → public DNS/IP:port clients dial",
      "users[].id === token",
      "Keep transport raw, security.type reality, mux enabled, and carrier.mode auto",
    ],
    tips: [
      "If the server is behind a firewall/security group, open both TCP and UDP for the listen port.",
      "Multiple client addresses race as candidates for one logical service; use balance for independent nodes.",
    ],
    commands: [
      "# server: inbounds[0].address = [\"0.0.0.0:9443\"]",
      "# client: outbounds[0].address = [\"your.domain.or.ip:9443\"]",
      "# client: outbounds[0].token  = server users[0].id",
    ],
    configSide: "both" as null | "server" | "client" | "both",
  },
  {
    id: "validate",
    title: "Validate before listening",
    summary: "Catch missing keys and bad references without opening ports.",
    body: "Run config check on both files. Fix any REALITY field mismatches, empty credentials, or unknown fields before you start the process.",
    bullets: [
      "Does not bind listeners",
      "Compiles tags, refs, auth, transport, security, and mux",
      "Run it after every edit",
    ],
    tips: [
      "If check fails on security fields, regenerate keys rather than hand-editing base64.",
    ],
    commands: [
      "tcptun config check --config server.json",
      "tcptun config check --config client.json",
    ],
    configSide: "both" as null | "server" | "client" | "both",
  },
  {
    id: "run",
    title: "Start server, then client",
    summary: "Bring the edge up first so the client can dial.",
    body: "Start the server process on the public host, confirm it is listening, then start the client. The client local mixed inbound (default 127.0.0.1:1080) becomes the app-facing proxy.",
    bullets: [
      "Server first, client second",
      "Keep both processes running",
      "Client default local proxy: 127.0.0.1:1080",
    ],
    tips: [
      "Use a process supervisor (systemd, launchd, tmux) for long-running edges.",
      "Logs at log.level=info help confirm carrier selection during first connects.",
    ],
    commands: [
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    configSide: "both" as null | "server" | "client" | "both",
  },
  {
    id: "test",
    title: "Test the local proxy",
    summary: "Send traffic through 127.0.0.1:1080.",
    body: "With both sides running, point a browser or CLI tool at the client mixed proxy. A successful fetch means the native tunnel, Reality carrier, and local inbound are healthy.",
    bullets: [
      "SOCKS5 / mixed on 127.0.0.1:1080 by default",
      "Use socks5h so DNS happens on the proxy path",
      "If it fails, re-check UDP/TCP firewall and token/key pairing",
    ],
    tips: [
      "If only TCP works, UDP may be blocked and Reality auto fell back to TCP — that can still be success.",
      "Optional next step: set mux.resume=true on both ends for resumable TCP streams (v0.2.5+).",
    ],
    commands: [
      "curl -x socks5h://127.0.0.1:1080 https://example.com -I",
      "# or point your app / system proxy to 127.0.0.1:1080",
    ],
    configSide: "client" as null | "server" | "client" | "both",
  },
  {
    id: "next",
    title: "Optional next steps",
    summary: "Harden, resume, or explore more topologies.",
    body: "Once the basic Reality-auto tunnel works, you can enable resumable TCP streams, reverse publish services from behind NAT, or force a single carrier when the network requires it.",
    bullets: [
      "Resumable: mux.resume=true on both Reality-auto peers",
      "Force TCP only: carrier.mode=tcp (security.type stays reality)",
      "Force QUIC only: security.type=reality-quic with mux.mode=quic",
      "Browse more copy-ready topologies on the Examples page",
    ],
    tips: [
      "Keep resume off during rolling upgrades until both peers run v0.2.5+.",
      "Resumable streams need one unique server process address — not multi-backend L4 load balancing.",
    ],
    commands: [
      "tcptun config native --quic --server proxy.example.com --port 9443",
      "# or open /examples/ for reverse publish, balance, and route split",
    ],
    configSide: null as null | "server" | "client" | "both",
  },
] as const;

export const nativeTutorialSteps = [
  {
    step: "01",
    title: "Install tcptun",
    body: "Install a binary for your platform, or use the one-line installer / npm package.",
    commands: [
      "curl -fsSL https://tcptun.com/install.sh | sh",
      "tcptun --version",
    ],
  },
  {
    step: "02",
    title: "Generate a native pair",
    body: "Create matching server.json and client.json with REALITY keys and a shared token. Prefer the CLI on the server host, or use the browser generator on this site.",
    commands: [
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
      "# writes server.json and client.json in the current directory (CLI defaults may vary by version flags)",
    ],
  },
  {
    step: "03",
    title: "Edit the real endpoints",
    body: "On the server config, set the native inbound listen address (for example 0.0.0.0:9443). On the client, set the outbound address to the public host:port, and keep token identical to users[].id.",
    commands: [
      "# server inbound address → where this machine listens",
      "# client outbound address → public host:port clients dial",
      "# users[].id  ===  token",
    ],
  },
  {
    step: "04",
    title: "Validate before start",
    body: "config check compiles the topology without opening ports. Fix any missing keys, bad tags, or REALITY mismatches here.",
    commands: [
      "tcptun config check --config server.json",
      "tcptun config check --config client.json",
    ],
  },
  {
    step: "05",
    title: "Start server, then client",
    body: "Bring the edge up first. Then start the client so the local mixed proxy can dial the tunnel.",
    commands: [
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
  },
  {
    step: "06",
    title: "Test the local proxy",
    body: "With the client running, apps should use the local mixed inbound (default 127.0.0.1:1080). Verify with a tool that supports SOCKS5 or HTTP depending on your mixed settings.",
    commands: [
      "curl -x socks5h://127.0.0.1:1080 https://example.com -I",
      "# or point your system / app proxy to 127.0.0.1:1080",
    ],
  },
] as const;

export const topologyExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": {}
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

/** Minimal native server: tunnel inbound + direct exit. */
export const nativeServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "mux": {}
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

/** Minimal native client: local mixed proxy → native outbound. */
export const nativeClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": {}
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

/** Native + REALITY QUIC pair produced by `tcptun config native --quic`. */
export const nativeQuicClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality-quic",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234"
      },
      "mux": {
        "mode": "quic",
        "udp_mode": "auto",
        "max_sessions": 4,
        "max_streams_per_session": 128,
        "warm_spares": 1
      }
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

export const nativeQuicServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality-quic",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "mux": {
        "mode": "quic",
        "max_streams_per_session": 128
      }
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const nativeReverseServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "edge",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp"],
      "users": [{ "id": "replace-with-a-long-random-token" }],
      "transport": { "type": "raw" },
      "mux": {},
      "publish": [
        { "service": "web", "address": ["0.0.0.0:8080"] }
      ]
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct", "network": ["tcp"] }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const nativeReverseClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp"]
    }
  ],
  "outbounds": [
    {
      "tag": "edge",
      "type": "native",
      "address": ["server.example.com:9443"],
      "token": "replace-with-a-long-random-token",
      "transport": { "type": "raw" },
      "mux": {},
      "expose": [
        { "service": "web", "target": "127.0.0.1:3000" }
      ]
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "edge", "rules": [] },
  "dns": {}
}`;

export const nativeConfigHighlights = [
  {
    title: "Auth",
    body: "Server users[].id and client token must match.",
  },
  {
    title: "Address",
    body: "address is a host:port array. Multiple addresses race as candidate entry points for the same service; they are not balance.",
  },
  {
    title: "v0.2.5 Reality auto",
    body: "native + raw + mux + security.type=reality + carrier.mode=auto prefers QUIC, falls back to TCP, and shares one camouflage identity on both carriers.",
  },
  {
    title: "Resumable TCP",
    body: "mux.resume=true on both Reality-auto peers can preserve an eligible TCP logical stream across carrier replacement (v0.2.5+).",
  },
  {
    title: "Throughput",
    body: "Prefer native + raw + mux. Forced TLS / REALITY / ws / h2 / h3 add flexibility but cost more.",
  },
  {
    title: "Reverse publish",
    body: "Server publish + client expose can hang NAT-side TCP/UDP services on edge listeners (requires mux).",
  },
] as const;

export const nativeFieldGroups = [
  {
    name: "Common fields",
    fields: [
      { key: "tag", side: "both", detail: "Unique identifier referenced by routes." },
      { key: "type", side: "both", detail: '"native".' },
      { key: "address", side: "both", detail: "host:port string array; outbounds may list multiple candidate entry points." },
      { key: "network", side: "both", detail: "tcp / udp, combinable." },
      { key: "transport", side: "both", detail: "Only type / path (raw / ws / h2 / h3)." },
      { key: "security", side: "both", detail: "tls, reality auto, forced reality-tcp, or forced reality-quic; all security parameters live here." },
      { key: "mux", side: "both", detail: "Presence enables mux; {} uses defaults. Pool parameters are mainly on the client." },
    ],
  },
  {
    name: "Server",
    fields: [
      { key: "address", side: "server", detail: "Listen address list, e.g. [\"0.0.0.0:9443\"]." },
      { key: "users[].id", side: "server", detail: "Auth credential matching the client token." },
      { key: "publish", side: "server", detail: "Reverse publish: service + address, optional network=tcp|udp." },
      { key: "security.cert/key", side: "server", detail: "Required for TLS inbounds; reality-quic uses REALITY key fields instead." },
    ],
  },
  {
    name: "Client",
    fields: [
      { key: "address", side: "client", detail: "Remote entry points; multiple candidate host:port values are allowed." },
      { key: "token", side: "client", detail: "Required; matches server users[].id." },
      { key: "security.server_name", side: "client", detail: "SNI for TLS/QUIC." },
      { key: "expose", side: "client", detail: "Reverse publish: service + target, optional network=tcp|udp." },
      { key: "mux.max_sessions", side: "client", detail: "Connection pool cap, 1–32, default 4." },
      { key: "mux.max_streams_per_session", side: "client", detail: "Per-connection stream cap, 1–4096." },
      { key: "mux.warm_spares", side: "client", detail: "Warm idle connections; must be less than max_sessions." },
      { key: "mux.udp_mode", side: "client", detail: "QUIC only: reliable / auto / datagram." },
      { key: "mux.resume", side: "both", detail: "v0.2.5: preserve eligible native TCP logical streams across Reality auto carrier replacement." },
      { key: "mux.resume_timeout", side: "both", detail: "Recovery window: default 15s; explicit 100ms–5m." },
      { key: "mux.resume_buffer_size", side: "both", detail: "Per-direction replay buffer: default 4 MiB; explicit 64 KiB–64 MiB." },
      { key: "mux.*_receive_window", side: "both", detail: "QUIC receive windows; stream max 16 MiB, connection max 64 MiB." },
    ],
  },
] as const;

export const nativeMuxNotes = [
  {
    title: "How to enable",
    body: "Any mux object enables mux (commonly \"mux\": {}). Do not use enabled; omit the mux field to disable it.",
  },
  {
    title: "TCP mux",
    body: "Reuses physical connections. Unreachable targets are not reported as success to the local proxy early.",
  },
  {
    title: "Reality auto carriers",
    body: "native + raw + group mux + reality prefers QUIC, falls back to Reality TCP with bounded backoff, then probes to restore QUIC preference.",
  },
  {
    title: "Resumable streams",
    body: "mux.resume keeps eligible native TCP logical streams alive while an automatic Reality carrier is replaced. Enable matching settings on both peers.",
  },
  {
    title: "QUIC",
    body: 'mux.mode: "quic" uses a UDP/QUIC connection pool and requires native + raw; security.type may be tls or reality-quic.',
  },
  {
    title: "UDP",
    body: "reliable uses streams; auto prefers DATAGRAM with fallback; datagram does not degrade. DATAGRAM supports fragmentation, recovery, and adaptive FEC.",
  },
] as const;

export const reversePublishNotes = [
  {
    title: "Protocol scope",
    body: "Only native + raw, and group mux or QUIC mux must be enabled. VLESS / VMess / Trojan are rejected during validation.",
  },
  {
    title: "Pairing rules",
    body: "Server publish and client expose service names must match, and network must match as well (default tcp).",
  },
  {
    title: "Security boundary",
    body: "The client local target is not sent to the server; the server can only open allowlisted services.",
  },
  {
    title: "QUIC requirements",
    body: "QUIC reverse publish needs matching TLS or reality-quic on both ends; TLS servers need cert/key.",
  },
] as const;

export const nativeWorkflowCommands = [
  {
    name: "generate",
    title: "Generate a pair",
    command: "tcptun config native --server proxy.example.com --port 9443",
    body: "Writes server.json and client.json.",
  },
  {
    name: "check",
    title: "Validate",
    command: "tcptun config check --config server.json",
    body: "Does not listen; useful after editing a config.",
  },
  {
    name: "quic",
    title: "Generate a QUIC pair",
    command: "tcptun config native --quic --server proxy.example.com --port 9443",
    body: "Writes matching reality-quic + QUIC mux configs.",
  },
  {
    name: "run",
    title: "Start",
    command: "tcptun --config server.json\ntcptun --config client.json",
    body: "Start the server first, then the client.",
  },
  {
    name: "uri",
    title: "Export URI",
    command: "tcptun uri export --config client.json --output client.uri",
    body: "Exports URIs from tunnel outbounds; multiple addresses become multiple URIs.",
  },
] as const;

export const configModelNotes = [
  {
    title: "Structure",
    body: "Top-level fields include log, resources, inbounds, outbounds, route, and dns. Unknown fields are rejected; resources.resumable_buffer_budget controls the shared replay-buffer budget.",
  },
  {
    title: "Address",
    body: "inbound.address and outbound.address are both host:port arrays. Multiple addresses race as candidate entry points; use balance for independent nodes.",
  },
  {
    title: "References",
    body: "Components link through tags; via chains and balance members are checked for missing refs and cycles.",
  },
  {
    title: "Startup",
    body: "Load → Validate → Compile → Start. Listening begins only after validation succeeds.",
  },
] as const;

/** VLESS + REALITY server example (keys are placeholders; use config generator in production). */
export const vlessRealityServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "vless",
      "address": ["0.0.0.0:443"],
      "network": ["tcp", "udp"],
      "users": [
        {
          "id": "00000000-0000-4000-8000-000000000000",
          "flow": "xtls-rprx-vision"
        }
      ],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["00"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      }
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const vlessRealityClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "vless",
      "address": ["proxy.example.com:443"],
      "uuid": "00000000-0000-4000-8000-000000000000",
      "flow": "xtls-rprx-vision",
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "00",
        "spider_x": "/"
      }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

/**
 * Native v0.2.5 automatic Reality carriers:
 * native + raw + mux + security.type=reality + carrier.mode=auto
 * (QUIC-first with TCP fallback on one address).
 */
export const nativeRealityServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "carrier": { "mode": "auto" },
      "mux": { "enabled": true }
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct", "network": ["tcp", "udp"] }
  ],
  "route": { "default_outbound": "direct", "rules": [] }
}`;

export const nativeRealityClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "carrier": { "mode": "auto" },
      "mux": {
        "enabled": true,
        "max_sessions": 4,
        "max_streams_per_session": 128,
        "warm_spares": 1
      }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

/** Native v0.2.5 automatic Reality carriers with resumable TCP logical streams. */
export const nativeResumableServerExample = `{
  "log": { "level": "info" },
  "resources": { "resumable_buffer_budget": 1073741824 },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "carrier": { "mode": "auto" },
      "mux": {
        "enabled": true,
        "resume": true,
        "resume_timeout": "15s",
        "resume_buffer_size": 4194304
      }
    }
  ],
  "outbounds": [{ "tag": "direct", "type": "direct" }],
  "route": { "default_outbound": "direct", "rules": [] }
}`;

export const nativeResumableClientExample = `{
  "log": { "level": "info" },
  "resources": { "resumable_buffer_budget": 1073741824 },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "carrier": { "mode": "auto" },
      "mux": {
        "enabled": true,
        "resume": true,
        "resume_timeout": "15s",
        "resume_buffer_size": 4194304
      }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

export const nativeUseCases = [
  {
    id: "basic",
    title: "Basic proxy (raw + mux)",
    summary: "Lowest-friction tcptun-to-tcptun tunnel. Good default for LAN, VPS-to-VPS, and private links.",
    when: "Both ends are trusted or already on a private path; you mainly need throughput and simple token auth.",
    steps: [
      "Generate or copy the minimal server / client pair below.",
      "Replace change-me with a long random token on both sides.",
      "Set client outbound address to the server’s public host:port.",
      "Run server, then client; use 127.0.0.1:1080 as the local proxy.",
    ],
    commands: [
      "tcptun config native --server proxy.example.com --port 9443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeServerExample,
    clientCode: nativeClientExample,
    serverHint: "server-native.json",
    clientHint: "client-native.json",
  },
  {
    id: "reality",
    title: "native + raw + reality (auto)",
    summary: "v0.2.5 automatic dual carriers: Reality QUIC first, Reality TCP fallback, shared keys on one address.",
    when: "Both ends run tcptun v0.2.5+ and you want QUIC when available without managing a second port or certs.",
    steps: [
      "Use type=native, transport raw, mux enabled, security.type=reality, and carrier.mode=auto on both ends.",
      "Generate with --server-name and --dest; dest should support HTTPS (TCP) and HTTP/3 (UDP).",
      "Pair private_key / public_key and keep short_id / server_name consistent.",
      "Open both TCP and UDP on the listen port; without mux, Reality stays TCP-only.",
    ],
    commands: [
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
      "tcptun config check --config server.json && tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeRealityServerExample,
    clientCode: nativeRealityClientExample,
    serverHint: "server-native-reality-auto.json",
    clientHint: "client-native-reality-auto.json",
  },
  {
    id: "resumable",
    title: "Resumable Reality auto",
    summary: "v0.2.5 keeps eligible TCP logical streams alive while the physical carrier switches between QUIC and Reality TCP.",
    when: "Long-lived TCP flows should tolerate a temporary UDP/TCP path change without redialing the target connection.",
    steps: [
      "Run v0.2.5 or newer on both ends before enabling resume.",
      "Use native + raw + security.type=reality + group mux on both endpoints.",
      "Set matching resume timeout and buffer size values.",
      "Keep the address pinned to one server process; cross-instance resume is unsupported.",
    ],
    commands: [
      "tcptun config check --config server-resumable.json",
      "tcptun --config server-resumable.json",
      "tcptun --config client-resumable.json",
    ],
    serverCode: nativeResumableServerExample,
    clientCode: nativeResumableClientExample,
    serverHint: "server-native-resumable.json",
    clientHint: "client-native-resumable.json",
  },
  {
    id: "quic",
    title: "Native QUIC (reality-quic + mux.mode=quic)",
    summary: "UDP/QUIC connection pool for streams and DATAGRAMs. Layer stack is fixed: native + raw + reality-quic + mux.mode=quic.",
    when: "You want QUIC multiplexing, DATAGRAM-friendly UDP, and REALITY-style keys without managing TLS certificates.",
    steps: [
      "Generate with --quic so both sides get reality-quic and mux.mode=quic.",
      "Open UDP on the server listen port end-to-end (not only TCP).",
      "Do not replace reality-quic with plain reality for this mode.",
      "Tune mux.max_sessions / warm_spares on the client if needed.",
    ],
    commands: [
      "tcptun config native --quic --server proxy.example.com --port 9443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeQuicServerExample,
    clientCode: nativeQuicClientExample,
    serverHint: "server-native-quic.json",
    clientHint: "client-native-quic.json",
  },
  {
    id: "reverse",
    title: "Reverse publish (NAT → edge)",
    summary: "Publish a service behind the client onto a port on the server edge. Server publish + client expose must use the same service name.",
    when: "A home or office machine has the real service; the public VPS should accept traffic and forward through the tunnel.",
    steps: [
      "Enable mux (group or QUIC) on both ends; reverse publish requires it with native + raw.",
      "On the server, set publish with service + public listen address.",
      "On the client, set expose with the same service and a local target host:port.",
      "Dial the server publish address externally; traffic reaches the client target.",
    ],
    commands: [
      "tcptun config check --config server-reverse.json",
      "tcptun --config server-reverse.json",
      "tcptun --config client-reverse.json",
      "# then connect to the server publish listen, e.g. server.example.com:8080",
    ],
    serverCode: nativeReverseServerExample,
    clientCode: nativeReverseClientExample,
    serverHint: "server-reverse.json",
    clientHint: "client-reverse.json",
  },
] as const;


export const realityRules = [
  {
    title: "raw only",
    body: "transport must be raw and cannot be combined with ws / h2 / h3.",
  },
  {
    title: "No stacked TLS",
    body: "Plain reality cannot stack with security.type=tls; choose exactly one security type.",
  },
  {
    title: "Supported endpoints",
    body: "Works with native / vless / vmess / trojan. mixed and socks5 are unsupported.",
  },
  {
    title: "Key pairing",
    body: "Server private_key pairs with client public_key; short_id must match on both ends.",
  },
  {
    title: "native auto (v0.2.5)",
    body: "On native + raw + mux + security.type=reality + carrier.mode=auto, dual carriers enable QUIC-first with TCP fallback. Without mux, Reality stays TCP-only.",
  },
  {
    title: "Forced modes",
    body: "carrier.mode=tcp forces Reality TCP only. carrier.mode=quic forces the dedicated QUIC pool (no TCP fallback).",
  },
] as const;

export const realityFieldGroups = [
  {
    name: "Server",
    fields: [
      { key: "type", detail: '"reality".' },
      { key: "private_key", detail: "X25519 private key (base64url)." },
      { key: "server_names", detail: "Allowed SNI list." },
      { key: "short_ids", detail: "Allowed short ids (hex)." },
      { key: "dest", detail: "Camouflage target, e.g. example.com:443." },
      { key: "max_time_diff", detail: "Optional clock skew, default 30s." },
    ],
  },
  {
    name: "Client",
    fields: [
      { key: "type", detail: '"reality".' },
      { key: "public_key", detail: "Server public key." },
      { key: "server_name", detail: "SNI; must be in server_names." },
      { key: "short_id", detail: "A single short id." },
      { key: "fingerprint", detail: "uTLS fingerprint, commonly chrome." },
      { key: "spider_x", detail: "Optional path, default /." },
    ],
  },
] as const;

export const realityCommands = [
  {
    title: "Generate a REALITY pair",
    command:
      "tcptun config vless --server proxy.example.com --port 443 --server-name example.com --dest example.com:443",
    body: "Writes paired server.json and client.json; run tcptun uri export if you need URIs.",
  },
  {
    title: "native + REALITY",
    command:
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
    body: "Generates matching REALITY configs for native on both ends.",
  },
  {
    title: "native + REALITY QUIC",
    command:
      "tcptun config native --quic --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
    body: "Generates matching reality-quic + QUIC mux configs for native on both ends.",
  },
  {
    title: "Validate and start",
    command: "tcptun config check --config server.json && tcptun --config server.json",
    body: "Validate keys and fields first, then start.",
  },
] as const;

export const protocolComparison = [
  {
    name: "native",
    credential: "token ↔ users[].id",
    interop: "tcptun only",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "Private mux, recommended",
    bestFor: "Throughput / reverse publish",
    generator: "tcptun config native --server … --port …",
  },
  {
    name: "vless",
    credential: "uuid ↔ users[].id",
    interop: "Xray VLESS",
    securityDefault: "raw + REALITY + Vision",
    vision: "xtls-rprx-vision",
    muxNote: "Optional",
    bestFor: "Xray interop / camouflage",
    generator: "tcptun config vless --server … --port …",
  },
  {
    name: "vmess",
    credential: "uuid ↔ users[].id",
    interop: "Xray VMess",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "Optional",
    bestFor: "VMess ecosystem",
    generator: "tcptun config vmess --server … --port …",
  },
  {
    name: "trojan",
    credential: "password ↔ users[].password",
    interop: "Xray Trojan",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "Optional",
    bestFor: "Password auth",
    generator: "tcptun config trojan --server … --port …",
  },
] as const;

export const protocolOutboundSnippets = {
  native: `{
  "tag": "proxy",
  "type": "native",
  "address": ["proxy.example.com:9443"],
  "token": "change-me",
  "transport": { "type": "raw" },
  "mux": {}
}`,
  vless: `{
  "tag": "proxy",
  "type": "vless",
  "address": ["proxy.example.com:443"],
  "uuid": "00000000-0000-4000-8000-000000000000",
  "flow": "xtls-rprx-vision",
  "transport": { "type": "raw" },
  "security": {
    "type": "reality",
    "server_name": "example.com",
    "fingerprint": "chrome",
    "public_key": "…",
    "short_id": "00"
  }
}`,
  vmess: `{
  "tag": "proxy",
  "type": "vmess",
  "address": ["proxy.example.com:443"],
  "uuid": "00000000-0000-4000-8000-000000000000",
  "transport": {
    "type": "ws",
    "path": "/vmess"
  },
  "security": {
    "type": "tls",
    "server_name": "proxy.example.com"
  },
  "mux": {}
}`,
  trojan: `{
  "tag": "proxy",
  "type": "trojan",
  "address": ["proxy.example.com:443"],
  "password": "change-me",
  "transport": { "type": "raw" },
  "security": {
    "type": "tls",
    "server_name": "proxy.example.com"
  },
  "mux": {}
}`,
} as const;


export const vmessTlsServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "vmess",
      "address": ["0.0.0.0:443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "00000000-0000-4000-8000-000000000000" }],
      "transport": { "type": "ws", "path": "/vmess" },
      "security": {
        "type": "tls",
        "cert": "/path/to/fullchain.pem",
        "key": "/path/to/privkey.pem"
      }
    }
  ],
  "outbounds": [{ "tag": "direct", "type": "direct" }],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const vmessTlsClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "vmess",
      "address": ["proxy.example.com:443"],
      "uuid": "00000000-0000-4000-8000-000000000000",
      "transport": { "type": "ws", "path": "/vmess" },
      "security": {
        "type": "tls",
        "server_name": "proxy.example.com"
      },
      "mux": {}
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

export const trojanTlsServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "trojan",
      "address": ["0.0.0.0:443"],
      "network": ["tcp", "udp"],
      "users": [{ "password": "change-me" }],
      "transport": { "type": "raw" },
      "security": {
        "type": "tls",
        "cert": "/path/to/fullchain.pem",
        "key": "/path/to/privkey.pem"
      }
    }
  ],
  "outbounds": [{ "tag": "direct", "type": "direct" }],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const trojanTlsClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "trojan",
      "address": ["proxy.example.com:443"],
      "password": "change-me",
      "transport": { "type": "raw" },
      "security": {
        "type": "tls",
        "server_name": "proxy.example.com"
      },
      "mux": {}
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;


export const nativeRealityTcpServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality-tcp",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "mux": { "mode": "group" }
    }
  ],
  "outbounds": [{ "tag": "direct", "type": "direct" }],
  "route": { "default_outbound": "direct", "rules": [] }
}`;

export const nativeRealityTcpClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality-tcp",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "mux": { "mode": "group" }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

export const nativeMultiAddressClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": [
        "edge-a.example.com:9443",
        "edge-b.example.com:9443",
        "203.0.113.10:9443"
      ],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "mux": { "mode": "group" }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

export const balanceFailoverExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "edge-a",
      "type": "native",
      "address": ["edge-a.example.com:9443"],
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "mode": "group" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      }
    },
    {
      "tag": "edge-b",
      "type": "native",
      "address": ["edge-b.example.com:9443"],
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "mode": "group" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      }
    },
    {
      "tag": "pool",
      "type": "balance",
      "members": [
        { "outbound": "edge-a", "weight": 2 },
        { "outbound": "edge-b", "weight": 1 }
      ],
      "affinity_ttl": "5m"
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": {
    "default_outbound": "pool",
    "rules": [
      {
        "domain": ["geosite:private"],
        "outbound": "direct"
      }
    ]
  }
}`;

export const routeSplitExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "mode": "group" },
      "security": {
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      }
    },
    { "tag": "direct", "type": "direct" },
    { "tag": "block", "type": "blackhole" }
  ],
  "route": {
    "default_outbound": "proxy",
    "rules": [
      { "domain": ["ads.example"], "outbound": "block" },
      { "ip": ["geoip:private"], "outbound": "direct" },
      { "domain": ["geosite:cn"], "outbound": "direct" }
    ]
  }
}`;


export const protocolUseCases = [
  {
    id: "native-basic",
    protocol: "native",
    title: "native · basic proxy",
    summary: "tcptun-to-tcptun tunnel with raw + mux for throughput.",
    when: "Both ends run tcptun and you want low overhead.",
    steps: [
      "Generate with tcptun config native.",
      "Match users[].id and token.",
      "Start server, then client; use 127.0.0.1:1080.",
    ],
    commands: [
      "tcptun config native --server proxy.example.com --port 9443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeServerExample,
    clientCode: nativeClientExample,
    serverHint: "server-native.json",
    clientHint: "client-native.json",
  },
  {
    id: "native-reality",
    protocol: "native",
    title: "native · raw + reality auto",
    summary: "v0.2.5 stack: native + raw + group mux + reality. QUIC-first with TCP fallback on one address.",
    when: "Both ends run tcptun v0.2.5+ and you want automatic dual carriers without certs or a second port.",
    steps: [
      "Generate with --server-name and --dest (HTTPS + HTTP/3 capable camouflage).",
      "Ensure mux.enabled and carrier.mode=auto so automatic carriers activate.",
      "Pair private_key / public_key and short ids; open TCP and UDP on the listen port.",
      "Optional: set mux.resume=true on both peers for resumable TCP streams.",
    ],
    commands: [
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeRealityServerExample,
    clientCode: nativeRealityClientExample,
    serverHint: "server-native-reality-auto.json",
    clientHint: "client-native-reality-auto.json",
  },
  {
    id: "native-quic",
    protocol: "native",
    title: "native · QUIC",
    summary: "native + raw + reality-quic + mux.mode=quic.",
    when: "You want QUIC streams/DATAGRAMs without managing TLS certs.",
    steps: [
      "Generate with --quic.",
      "Open UDP on the listen port.",
      "Do not use plain reality in place of reality-quic.",
    ],
    commands: [
      "tcptun config native --quic --server proxy.example.com --port 9443",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: nativeQuicServerExample,
    clientCode: nativeQuicClientExample,
    serverHint: "server-native-quic.json",
    clientHint: "client-native-quic.json",
  },
  {
    id: "native-resumable",
    protocol: "native",
    title: "native · resumable auto",
    summary: "v0.2.5 automatic QUIC/TCP Reality carriers with resumable TCP logical streams.",
    when: "Long-lived TCP flows should survive a physical carrier replacement on one server process.",
    steps: [
      "Use v0.2.5+ on both ends and keep one unique server address.",
      "Set native + raw + reality + group mux on both endpoints.",
      "Enable mux.resume with matching timeout and buffer size values.",
    ],
    commands: [
      "tcptun config check --config server-native-resumable.json",
      "tcptun --config server-native-resumable.json",
      "tcptun --config client-native-resumable.json",
    ],
    serverCode: nativeResumableServerExample,
    clientCode: nativeResumableClientExample,
    serverHint: "server-native-resumable.json",
    clientHint: "client-native-resumable.json",
  },
  {
    id: "native-reverse",
    protocol: "native",
    title: "native · reverse publish",
    summary: "Expose a NAT-side service on the edge with publish/expose.",
    when: "The real service sits behind the client; the VPS should accept public traffic.",
    steps: [
      "Enable mux on both ends.",
      "Match service names on publish and expose.",
      "Dial the server publish address externally.",
    ],
    commands: [
      "tcptun --config server-reverse.json",
      "tcptun --config client-reverse.json",
    ],
    serverCode: nativeReverseServerExample,
    clientCode: nativeReverseClientExample,
    serverHint: "server-reverse.json",
    clientHint: "client-reverse.json",
  },
  {
    id: "vless-reality",
    protocol: "vless",
    title: "vless · REALITY + Vision",
    summary: "Xray-compatible VLESS with Vision flow and REALITY.",
    when: "You need VLESS wire interop or default generated REALITY + Vision path.",
    steps: [
      "Generate with tcptun config vless.",
      "Match uuid / users[].id and REALITY keys.",
      "Keep transport raw for REALITY.",
    ],
    commands: [
      "tcptun config vless --server proxy.example.com --port 443 --server-name example.com --dest example.com:443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: vlessRealityServerExample,
    clientCode: vlessRealityClientExample,
    serverHint: "server-vless-reality.json",
    clientHint: "client-vless-reality.json",
  },
  {
    id: "vmess-tls-ws",
    protocol: "vmess",
    title: "vmess · TLS + WebSocket",
    summary: "VMess AEAD behind TLS and a WebSocket path.",
    when: "You need VMess interop or a path-based front behind an existing TLS site.",
    steps: [
      "Generate with tcptun config vmess or adapt the samples.",
      "Deploy cert/key on the server TLS inbound.",
      "Match uuid, path, and server_name on the client.",
    ],
    commands: [
      "tcptun config vmess --server proxy.example.com --port 443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: vmessTlsServerExample,
    clientCode: vmessTlsClientExample,
    serverHint: "server-vmess-tls-ws.json",
    clientHint: "client-vmess-tls-ws.json",
  },
  {
    id: "trojan-tls",
    protocol: "trojan",
    title: "trojan · TLS password auth",
    summary: "Password-authenticated Trojan tunnel over TLS.",
    when: "You want Trojan wire interop with a simple password credential.",
    steps: [
      "Generate with tcptun config trojan.",
      "Match password / users[].password and TLS SNI.",
      "Start server then client; use local mixed :1080.",
    ],
    commands: [
      "tcptun config trojan --server proxy.example.com --port 443",
      "tcptun config check --config server.json",
      "tcptun --config server.json",
      "tcptun --config client.json",
    ],
    serverCode: trojanTlsServerExample,
    clientCode: trojanTlsClientExample,
    serverHint: "server-trojan-tls.json",
    clientHint: "client-trojan-tls.json",
  },
  {
    id: "native-reality-tcp",
    protocol: "native",
    title: "native · reality-tcp forced",
    summary: "Force Reality over TCP only when UDP is intentionally unavailable.",
    when: "Corporate networks or paths that drop UDP/QUIC but still allow TCP Reality.",
    steps: [
      "Set security.type=reality-tcp on both ends with matching keys.",
      "Keep transport raw and group mux if you still want mux pooling.",
      "Do not expect QUIC fallback or automatic dual carriers.",
    ],
    commands: [
      "tcptun config check --config server-native-reality-tcp.json",
      "tcptun --config server-native-reality-tcp.json",
      "tcptun --config client-native-reality-tcp.json",
    ],
    serverCode: nativeRealityTcpServerExample,
    clientCode: nativeRealityTcpClientExample,
    serverHint: "server-native-reality-tcp.json",
    clientHint: "client-native-reality-tcp.json",
  },
  {
    id: "native-multi-address",
    protocol: "native",
    title: "native · multi-address race",
    summary: "One outbound with several host:port candidates racing handshakes for the same logical service.",
    when: "Anycast/DNS or dual-homed edges share credentials and should compete, not load-balance as separate nodes.",
    steps: [
      "List multiple addresses on one native outbound.",
      "Keep identical token, transport, and security for every candidate.",
      "Use balance members instead when nodes are independent services.",
    ],
    commands: [
      "tcptun config check --config client-native-multi-address.json",
      "tcptun --config client-native-multi-address.json",
    ],
    serverCode: nativeRealityServerExample,
    clientCode: nativeMultiAddressClientExample,
    serverHint: "server-native-reality-auto.json",
    clientHint: "client-native-multi-address.json",
  },
  {
    id: "balance-failover",
    protocol: "native",
    title: "balance · weighted edges",
    summary: "Independent native edges under a balance outbound with weights and affinity.",
    when: "You operate more than one complete proxy service and want weighted selection / failover.",
    steps: [
      "Declare each edge as its own native outbound.",
      "Group them under type=balance with weights and affinity_ttl.",
      "Route default_outbound to the balance tag.",
    ],
    commands: [
      "tcptun config check --config client-balance.json",
      "tcptun --config client-balance.json",
    ],
    serverCode: nativeRealityServerExample,
    clientCode: balanceFailoverExample,
    serverHint: "server-native-reality-auto.json",
    clientHint: "client-balance.json",
  },
  {
    id: "route-split",
    protocol: "native",
    title: "route · split + blackhole",
    summary: "Send private/geoip direct, block ads, default everything else through native Reality auto.",
    when: "You need domain/IP based routing without a second client process.",
    steps: [
      "Keep proxy and direct (and optional blackhole) outbounds.",
      "Order rules carefully; first match wins.",
      "Validate with config check before starting.",
    ],
    commands: [
      "tcptun config check --config client-route-split.json",
      "tcptun --config client-route-split.json",
      "curl -x socks5h://127.0.0.1:1080 https://example.com -I",
    ],
    serverCode: nativeRealityServerExample,
    clientCode: routeSplitExample,
    serverHint: "server-native-reality-auto.json",
    clientHint: "client-route-split.json",
  },
] as const;


function binary(
  filename: string,
  platform: string,
  platformLabel: string,
  arch: string,
  archLabel: string,
  size: number,
) {
  return {
    filename,
    platform,
    platformLabel,
    arch,
    archLabel,
    size,
    url: `${npmLinks.binaryBase}/${filename}`,
    source: "npm" as const,
  };
}
