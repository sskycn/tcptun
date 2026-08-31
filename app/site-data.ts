export const releaseVersion = "0.4.2";

/** Product positioning — keep language consistent across the site. */
export const productTagline = "Programmable networking runtime for applications and devices";

export const productDescription =
  "tcptun compiles routing, tunnels, transports, and platform networking into one strict, observable runtime. Run it as a CLI, embed it in Go, or integrate it into Android VPN clients.";

/** Source and release provenance. */
export const githubLinks = {
  org: "https://github.com/sskycn",
  site: "https://github.com/sskycn/tcptun",
  runtime: "https://github.com/gostartkit/tcptun-go",
  runtimeReleases: "https://github.com/gostartkit/tcptun-go/releases",
  runtimeReleaseTag: `https://github.com/gostartkit/tcptun-go/releases/tag/v${releaseVersion}`,
  issues: "https://github.com/gostartkit/tcptun-go/issues",
  goModule: "pkg.tcptun.com/net",
} as const;

/** Download and package links for the published npm package `tcptun`. */
export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  packageVersion: `https://www.npmjs.com/package/tcptun/v/${releaseVersion}`,
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
  /** Individual binaries from the npm package (served via jsDelivr). */
  binaryBase: `https://cdn.jsdelivr.net/npm/tcptun@${releaseVersion}/dist`,
  latestBinaryBase: "https://cdn.jsdelivr.net/npm/tcptun@latest/dist",
};

/** Android client distribution. */
export const androidAppLinks = {
  packageId: "com.tcptun.client",
  playStore: "https://play.google.com/store/apps/details?id=com.tcptun.client",
  /** Current Play Store listing. */
  appVersion: "0.2.52",
  /** Runtime embedded in that Play listing — not CLI v0.4.2. */
  runtimeVersion: "0.2.5",
} as const;

/** @deprecated Prefer npmLinks.binaryBase — binaries are no longer hosted on Pages. */
export const releaseBasePath = npmLinks.binaryBase;

export const installCommand = "curl -fsSL https://tcptun.com/install.sh | sh";

export const pinnedInstallCommand = `curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=${releaseVersion} sh`;

export const npmInstallCommand = `npm install -g tcptun@${releaseVersion}`;

export const releaseHighlights = [
  {
    label: "Native-only tunnels",
    title: "Native-only tunnel endpoints",
    body: "v0.4.x tunnel endpoints are native only. mixed and socks5 remain for local/LAN proxy hops.",
  },
  {
    label: "Carriers",
    title: "Auto TCP+QUIC with outbound preference",
    body: "native + raw + mux can set carrier.mode=auto with TLS or REALITY. Outbound carrier.prefer is adaptive (default), quic, or tcp: strict preferences use the healthy preferred carrier and fall back only while it is unavailable.",
  },
  {
    label: "Local proxy auth",
    title: "SOCKS5 secure auth v2 and mixed users",
    body: "Credentialed SOCKS5/mixed outbounds default to auth_mode=secure (HKDF method 0x80, no RFC1929 downgrade). Authenticated inbounds use a bounded users[] array across mixed, socks5, and native.",
  },
  {
    label: "Runtime health",
    title: "Idle power profile and mux stall recovery",
    body: "A low-wakeup power profile parks idle QUIC probes on platform inbounds. Mux retires silently stalled carriers, backpressures elephant streams, and bounds local accept recovery independently of outbound backoff.",
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
    body: "TCP streams, UDP relay, and reverse carriers follow the same automatic carrier policy when carrier.mode=auto.",
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
    body: "v0.4.2 generator path: Reality or TLS with carrier.mode=auto on one address; outbound carrier.prefer is adaptive by default.",
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
    answer:
      "No. tcptun uses its own JSON topology. Tunnel endpoints are native; mixed and socks5 are for local/LAN proxy hops.",
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
    question: "Which tunnel protocol should I use?",
    answer:
      "Use native for throughput, mux, QUIC, reverse publish, and Reality/TLS carriers. mixed and socks5 remain for local/LAN proxy hops.",
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
    question: "What is native + raw + reality in v0.3.0?",
    answer:
      "It is the automatic dual-carrier stack: type=native, transport raw, mux enabled, security.type=reality, and carrier.mode=auto. The server binds TCP and UDP on one address; the client prefers Reality QUIC, falls back to Reality TCP with backoff, and probes to restore QUIC. Camouflage keys/SNI/dest are shared by both carriers. Without mux, Reality stays TCP-only.",
  },
  {
    question: "How do I choose carrier.mode?",
    answer:
      "carrier.mode=auto (default generators) binds TCP and UDP on one address with TLS or REALITY. Outbound carrier.prefer is adaptive (default), quic, or tcp — strict preferences use the healthy preferred carrier and fall back only while it is unavailable. mode=tcp or mode=quic is a single carrier. Mux must be enabled for auto and quic.",
  },
  {
    question: "When should I enable mux or QUIC?",
    answer:
      "For many short connections, prefer mux.enabled. In v0.3.0, native + raw + mux + reality with carrier.mode=auto prefers QUIC and falls back to Reality TCP. Use carrier.mode=tcp to force TCP, or carrier.mode=quic to force QUIC without fallback.",
  },
  {
    question: "How do resumable streams work?",
    answer:
      "Set mux.resume=true on both native endpoints using raw + mux + security.type=reality + carrier.mode=auto. A TCP logical stream can reattach after its physical QUIC/TCP carrier fails. It does not cover UDP, reverse publish, forced tcp/quic-only modes, or cross-process failover; keep it off during rolling upgrades until both peers run v0.3.0 or newer.",
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
    question: "How do I move from another proxy config?",
    answer:
      "Rebuild the path as native (or keep mixed/socks5 for local hops). tcptun does not load Xray JSON or other vendors’ share links as tunnel endpoints.",
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
  {
    question: "Does the Android app match CLI v0.4.2?",
    answer:
      "No. The current Google Play listing (tcptun client v0.2.52) embeds tcptun v0.2.5. Pair that app with a v0.2.5 server. Do not mix it with CLI v0.4.2: the Play app is not Native-only v0.4.x, and the CLI is not the runtime inside v0.2.52.",
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
    "Browser tools on this site (config generation and URI conversion) process data locally in your browser; those tools are not used by us to set advertising cookies.",
    "We do not use first-party advertising or marketing tracking cookies on this site. Third-party services outside our control may still process requests according to their own policies.",
    "You can clear cookies and site data in your browser settings at any time. Disabling storage may reset preferences such as theme.",
  ],
  acceptance:
    "By continuing to browse or use this website, you acknowledge and accept this cookies statement. If you do not agree, please stop using the site and clear this site’s cookies and stored data from your browser.",
} as const;

/** CLI binaries published inside the npm package `tcptun` under dist/. */
export const binaryDownloads = [
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 16373712),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 15035906),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 15982754),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 14614690),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 15007906),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 16406016),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 14753792),
] as const;

export const inboundTypes = ["mixed", "socks5", "native"] as const;
export const outboundTypes = [
  "direct",
  "balance",
  "blackhole",
  "socks5",
  "mixed",
  "native",
] as const;

export const tunnelProtocols = [
  {
    name: "native",
    credential: "Token",
    interoperability: "tcptun ↔ tcptun",
    generatedSecurity: "REALITY or TLS, carrier.mode auto/tcp/quic",
    mux: "Required for auto and QUIC carriers",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description:
      "The only tunnel protocol in v0.4.2. raw + mux + reality or tls with carrier.mode=auto binds TCP and UDP on one address; outbound carrier.prefer selects adaptive, quic, or tcp. Resumable streams can preserve eligible TCP flows across carrier replacement.",
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
    title: "Security (v0.4.2)",
    body: "With native + raw + mux + security.type=reality or tls + carrier.mode=auto, the inbound binds TCP and UDP on one address. Outbound carrier.prefer selects adaptive/quic/tcp. carrier.mode=tcp|quic forces a single carrier. TLS still needs cert/key when not using REALITY. Browser TLS fingerprints are ignored.",
  },
  {
    title: "Mux & resume",
    body: "mux.enabled enables multiplexing and dual carriers. Optional mux.resume preserves eligible TCP streams. carrier.mode selects auto/tcp/quic independently of mux pooling knobs.",
  },
] as const;

/**
 * Interactive wizard for first-time setup with the recommended v0.4.2 stack:
 * native + raw + mux + security.type=reality (auto TCP/QUIC carriers).
 */
export const realityAutoWizardSteps = [
  {
    id: "goal",
    title: "What you will build",
    summary: "A private native tunnel with automatic Reality carriers.",
    body: "This wizard walks through the recommended v0.4.2 path: native + raw + mux + security.type=reality + carrier.mode=auto. One public address carries Reality TCP and QUIC; the client outbound can set carrier.prefer. Your laptop runs a local mixed proxy on 127.0.0.1:1080 and forwards through the tunnel.",
    bullets: [
      "Server: VPS or edge host with a public IP (or DNS name)",
      "Client: laptop / phone / second host that needs a local proxy",
      "Stack: type=native, transport raw, mux enabled, security reality, carrier.mode auto",
      "Outcome: apps use socks5h://127.0.0.1:1080 after both sides start",
    ],
    tips: [
      "Use the same tcptun version (v0.4.2) on both CLI ends for auto carriers and optional resume.",
      "The Play Store Android app v0.2.52 still embeds tcptun v0.2.5 — do not mix it with CLI v0.4.2.",
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
      "If you pin a version: TCPTUN_VERSION=0.4.2 sh -c \"$(curl -fsSL https://tcptun.com/install.sh)\"",
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
    summary: "Why native + raw + reality + mux + carrier.mode=auto.",
    body: "Automatic dual carriers need native + raw + mux + reality + carrier.mode=auto. Missing mux keeps Reality TCP-only. Forced modes use carrier.mode=tcp or carrier.mode=quic.",
    bullets: [
      "native — private tunnel protocol and token auth",
      "raw — required transport for carrier.mode=auto",
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
      "Browser path: open /generate/, choose native, keep carrier.mode=auto enabled.",
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
      "If only TCP works, UDP may be blocked and carrier.mode=auto fell back to TCP — that can still be success.",
      "Optional next step: set mux.resume=true on both ends for resumable TCP streams (v0.3.0+).",
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
    body: "Once the basic carrier.mode=auto tunnel works, you can enable resumable TCP streams, reverse publish services from behind NAT, or force a single carrier when the network requires it.",
    bullets: [
      "Resumable: mux.resume=true on both carrier.mode=auto peers",
      "Force TCP only: carrier.mode=tcp (security.type stays reality)",
      "Force QUIC only: carrier.mode=quic with mux.enabled (security.type stays reality or tls)",
      "Browse more copy-ready topologies on the Examples page",
    ],
    tips: [
      "Keep resume off during rolling upgrades until both peers run v0.3.0+.",
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
      "mux": { "enabled": true }
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
      "mux": { "enabled": true }
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

/** Native + Reality forced QUIC (`carrier.mode=quic`) from `tcptun config native --quic`. */
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
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "carrier": { "mode": "quic", "udp_mode": "auto" },
      "mux": {
        "enabled": true,
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
        "type": "reality",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "carrier": { "mode": "quic" },
      "mux": {
        "enabled": true,
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
      "mux": { "enabled": true },
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
      "mux": { "enabled": true },
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
    title: "v0.3.0 carrier.mode=auto",
    body: "native + raw + mux + security.type=reality + carrier.mode=auto prefers QUIC, falls back to TCP, and shares one camouflage identity on both carriers.",
  },
  {
    title: "Resumable TCP",
    body: "mux.resume=true on both carrier.mode=auto peers can preserve an eligible TCP logical stream across carrier replacement (v0.3.0+).",
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
      { key: "security", side: "both", detail: "tls or reality. Carrier path is carrier.mode=auto|tcp|quic; all security parameters live here." },
      { key: "mux", side: "both", detail: "Presence enables mux; {} uses defaults. Pool parameters are mainly on the client." },
    ],
  },
  {
    name: "Server",
    fields: [
      { key: "address", side: "server", detail: "Listen address list, e.g. [\"0.0.0.0:9443\"]." },
      { key: "users[].id", side: "server", detail: "Auth credential matching the client token." },
      { key: "publish", side: "server", detail: "Reverse publish: service + address, optional network=tcp|udp." },
      { key: "security.cert/key", side: "server", detail: "Required for TLS inbounds; REALITY uses key fields instead of cert/key." },
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
      { key: "mux.resume", side: "both", detail: "v0.3.0: preserve eligible native TCP logical streams across carrier replacement when carrier.mode=auto." },
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
    title: "Automatic carriers",
    body: "native + raw + mux + security.type=reality + carrier.mode=auto prefers QUIC, falls back to Reality TCP with bounded backoff, then probes to restore QUIC preference.",
  },
  {
    title: "Resumable streams",
    body: "mux.resume keeps eligible native TCP logical streams alive while an automatic Reality carrier is replaced. Enable matching settings on both peers.",
  },
  {
    title: "QUIC",
    body: 'carrier.mode=quic uses a UDP/QUIC connection pool and requires native + raw + mux.enabled; security.type may be tls or reality.',
  },
  {
    title: "UDP",
    body: "reliable uses streams; auto prefers DATAGRAM with fallback; datagram does not degrade. DATAGRAM supports fragmentation, recovery, and adaptive FEC.",
  },
] as const;

export const reversePublishNotes = [
  {
    title: "Protocol scope",
    body: "Only native + raw, and mux must be enabled.",
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
    body: "QUIC reverse publish needs matching TLS or REALITY plus carrier.mode=quic (or auto) on both ends; TLS servers need cert/key.",
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
    body: "Writes matching REALITY configs with carrier.mode=quic and mux enabled.",
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

/**
 * Native v0.3.0 automatic Reality carriers:
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

/** Native v0.3.0 automatic Reality carriers with resumable TCP logical streams. */
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
      "Confirm users[].id and token match (examples pages generate them for you).",
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
    summary: "v0.3.0 automatic dual carriers: Reality QUIC first, Reality TCP fallback, shared keys on one address.",
    when: "Both ends run tcptun v0.3.0+ and you want QUIC when available without managing a second port or certs.",
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
    title: "Resumable carrier.mode=auto",
    summary: "v0.3.0 keeps eligible TCP logical streams alive while the physical carrier switches between QUIC and Reality TCP.",
    when: "Long-lived TCP flows should tolerate a temporary UDP/TCP path change without redialing the target connection.",
    steps: [
      "Run v0.3.0 or newer on both ends before enabling resume.",
      "Use native + raw + security.type=reality + mux + carrier.mode=auto on both endpoints.",
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
    title: "Native QUIC (carrier.mode=quic)",
    summary: "UDP/QUIC connection pool for streams and DATAGRAMs. Layer stack is native + raw + security.type=reality + carrier.mode=quic + mux.enabled.",
    when: "You want QUIC multiplexing, DATAGRAM-friendly UDP, and REALITY-style keys without managing TLS certificates.",
    steps: [
      "Generate with --quic so both sides get carrier.mode=quic and mux.enabled.",
      "Open UDP on the server listen port end-to-end (not only TCP).",
      "Keep security.type=reality; do not revive legacy reality-quic aliases in new configs.",
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
    body: "Works with native tunnel endpoints. mixed and socks5 are unsupported for URI export.",
  },
  {
    title: "Key pairing",
    body: "Server private_key pairs with client public_key; short_id must match on both ends.",
  },
  {
    title: "native auto (v0.3.0)",
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
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
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
    body: "Generates matching REALITY configs with carrier.mode=quic and mux enabled.",
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
    muxNote: "Private mux, recommended",
    bestFor: "Throughput / reverse publish",
    generator: "tcptun config native --server … --port …",
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
} as const;


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
        "type": "reality",
        "private_key": "REPLACE_WITH_SERVER_PRIVATE_KEY",
        "server_names": ["example.com"],
        "short_ids": ["abcd1234"],
        "dest": "example.com:443",
        "max_time_diff": "30s"
      },
      "carrier": { "mode": "tcp" },
      "mux": { "enabled": true }
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
        "type": "reality",
        "server_name": "example.com",
        "fingerprint": "chrome",
        "public_key": "REPLACE_WITH_SERVER_PUBLIC_KEY",
        "short_id": "abcd1234",
        "spider_x": "/"
      },
      "carrier": { "mode": "tcp" },
      "mux": { "enabled": true }
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
      "carrier": { "mode": "auto" },
      "mux": { "enabled": true }
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
      "carrier": { "mode": "auto" },
      "mux": { "enabled": true },
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
      "carrier": { "mode": "auto" },
      "mux": { "enabled": true },
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
      "carrier": { "mode": "auto" },
      "mux": { "enabled": true },
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

export const nativeReverseUdpServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "edge",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["udp"],
      "users": [{ "id": "replace-with-a-long-random-token" }],
      "transport": { "type": "raw" },
      "mux": { "enabled": true },
      "publish": [
        { "service": "dns", "network": "udp", "address": ["0.0.0.0:5353"] }
      ]
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct", "network": ["udp"] }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": { "strategy": "prefer_ipv4" }
}`;

export const nativeReverseUdpClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "address": ["127.0.0.1:1080"],
      "network": ["udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "edge",
      "type": "native",
      "address": ["server.example.com:9443"],
      "token": "replace-with-a-long-random-token",
      "network": ["udp"],
      "transport": { "type": "raw" },
      "mux": { "enabled": true },
      "expose": [
        { "service": "dns", "network": "udp", "target": "127.0.0.1:53" }
      ]
    }
  ],
  "route": { "default_outbound": "edge", "rules": [] },
  "dns": { "strategy": "prefer_ipv4" }
}`;

export const nativeChainClientExample = `{
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
      "type": "socks5",
      "address": ["127.0.0.1:1081"],
      "network": ["tcp"]
    },
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "change-me",
      "via": "edge",
      "network": ["tcp"],
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;

export const nativeRelayExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "relay-in",
      "type": "native",
      "address": ["0.0.0.0:9443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "inbound-secret" }],
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    }
  ],
  "outbounds": [
    {
      "tag": "next",
      "type": "native",
      "address": ["next.example.com:9443"],
      "token": "outbound-secret",
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    }
  ],
  "route": { "default_outbound": "next", "rules": [] },
  "dns": {}
}`;

export const nativeTlsFallbackServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "address": ["0.0.0.0:443"],
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "security": { "type": "none" },
      "carrier": { "mode": "tcp" },
      "mux": { "enabled": true },
      "fallback": {
        "type": "tls_passthrough",
        "dest": "www.example.com:443",
        "server_names": ["www.example.com"],
        "handshake_timeout": "3s"
      }
    }
  ],
  "outbounds": [{ "tag": "direct", "type": "direct" }],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {}
}`;

export const nativeTlsFallbackClientExample = `{
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
      "address": ["proxy.example.com:443"],
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "carrier": { "mode": "tcp" },
      "mux": { "enabled": true }
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {}
}`;


/** Catalog groups for the /examples sidebar menu (native first). */
export const exampleCatalogGroups = [
  {
    id: "native-carriers",
    label: "Native · carriers",
    description: "Recommended tcptun-to-tcptun stacks and carrier.mode variants.",
  },
  {
    id: "native-topology",
    label: "Native · topology",
    description: "Reverse publish, multi-path, balance, routing, chain, and relay.",
  },
] as const;

export type ExampleCatalogGroupId = (typeof exampleCatalogGroups)[number]["id"];

/**
 * Full worked-example catalog for /examples.
 * Ordered native-first; each entry has server/client JSON ready to copy.
 */
export const protocolUseCases = [
  {
    id: "native-reality",
    protocol: "native",
    group: "native-carriers",
    recommended: true,
    title: "REALITY · carrier.mode=auto (recommended)",
    summary:
      "v0.4.2 default: native + raw + mux + security.type=reality + carrier.mode=auto. TCP and QUIC on one address; outbound carrier.prefer defaults to adaptive.",
    when: "Both ends run tcptun v0.4.2 and you want automatic dual carriers without certs or a second port.",
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
    id: "native-basic",
    protocol: "native",
    group: "native-carriers",
    recommended: false,
    title: "Basic raw + mux",
    summary: "Lowest-friction tcptun-to-tcptun tunnel. Token auth, no camouflage layer.",
    when: "Both ends are trusted or already on a private path; you mainly need throughput.",
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
    id: "native-reality-tcp",
    protocol: "native",
    group: "native-carriers",
    recommended: false,
    title: "Reality TCP only",
    summary: "security.type=reality + carrier.mode=tcp. No QUIC fallback.",
    when: "Paths that drop UDP/QUIC but still allow TCP Reality.",
    steps: [
      "Keep security.type=reality and set carrier.mode=tcp on both ends.",
      "Keep transport raw and mux.enabled if you want mux pooling.",
      "Do not expect QUIC preference or dual-carrier probing.",
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
    id: "native-quic",
    protocol: "native",
    group: "native-carriers",
    recommended: false,
    title: "Reality QUIC only",
    summary: "security.type=reality + carrier.mode=quic. Dedicated QUIC pool, no TCP fallback.",
    when: "You want forced QUIC streams/DATAGRAMs without managing TLS certificates.",
    steps: [
      "Generate with --quic (emits carrier.mode=quic + mux.enabled).",
      "Open UDP on the listen port end-to-end.",
      "Keep security.type=reality; do not revive legacy reality-quic aliases in new configs.",
    ],
    commands: [
      "tcptun config native --quic --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
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
    group: "native-carriers",
    recommended: false,
    title: "Resumable carrier.mode=auto",
    summary: "carrier.mode=auto plus mux.resume for eligible TCP logical streams.",
    when: "Long-lived TCP flows should survive a physical carrier replacement on one server process.",
    steps: [
      "Use v0.3.0+ on both ends and keep one unique server address.",
      "Start from carrier.mode=auto, then enable mux.resume with matching timeout/buffer.",
      "Keep resume off during rolling upgrades until both peers are upgraded.",
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
    id: "native-tls-fallback",
    protocol: "native",
    group: "native-carriers",
    recommended: false,
    title: "TLS passthrough fallback",
    summary: "Native TCP inbound with tls_passthrough fallback for unmatched handshakes on :443.",
    when: "You share a public 443 listener and want non-tcptun clients forwarded to a real TLS site.",
    steps: [
      "Set fallback.type=tls_passthrough with dest and server_names.",
      "Use carrier.mode=tcp on this pattern; replace the token before exposing :443.",
      "Validate with config check, then confirm fallback SNI reaches the real site.",
    ],
    commands: [
      "tcptun config check --config server-native-tls-fallback.json",
      "tcptun --config server-native-tls-fallback.json",
      "tcptun --config client-native-tls-fallback.json",
    ],
    serverCode: nativeTlsFallbackServerExample,
    clientCode: nativeTlsFallbackClientExample,
    serverHint: "server-native-tls-fallback.json",
    clientHint: "client-native-tls-fallback.json",
  },
  {
    id: "native-reverse",
    protocol: "native",
    group: "native-topology",
    recommended: false,
    title: "Reverse publish (TCP)",
    summary: "Expose a NAT-side TCP service on the edge with publish/expose.",
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
    id: "native-reverse-udp",
    protocol: "native",
    group: "native-topology",
    recommended: false,
    title: "Reverse publish (UDP)",
    summary: "Publish a UDP service (for example DNS) from behind NAT onto the edge.",
    when: "You need UDP reverse publish with matching service + network=udp.",
    steps: [
      "Set network=udp on tunnel, publish, and expose.",
      "Match service names; point expose.target at the private UDP listener.",
      "Dial the server publish UDP address externally.",
    ],
    commands: [
      "tcptun --config server-reverse-udp.json",
      "tcptun --config client-reverse-udp.json",
    ],
    serverCode: nativeReverseUdpServerExample,
    clientCode: nativeReverseUdpClientExample,
    serverHint: "server-reverse-udp.json",
    clientHint: "client-reverse-udp.json",
  },
  {
    id: "native-multi-address",
    protocol: "native",
    group: "native-topology",
    recommended: false,
    title: "Multi-address race",
    summary: "One outbound with several host:port candidates racing handshakes for the same logical service.",
    when: "Anycast/DNS or dual-homed edges share credentials and should compete, not load-balance as separate nodes.",
    steps: [
      "List multiple addresses on one native outbound.",
      "Keep identical token, transport, security, and carrier for every candidate.",
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
    group: "native-topology",
    recommended: false,
    title: "Balance · weighted edges",
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
    group: "native-topology",
    recommended: false,
    title: "Route split + blackhole",
    summary: "Send private/geoip direct, block ads, default everything else through native REALITY with carrier.mode=auto.",
    when: "You need domain/IP based routing without a second client process.",
    steps: [
      "Keep proxy, direct, and optional blackhole outbounds.",
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
  {
    id: "native-chain",
    protocol: "native",
    group: "native-topology",
    recommended: false,
    title: "Outbound via chain",
    summary: "Reach a native edge through a lower SOCKS5 hop using via.",
    when: "The path to the public edge must first exit through a local or LAN proxy.",
    steps: [
      "Declare the lower hop as its own outbound (socks5/http/…).",
      "Set via on the native outbound to that hop tag.",
      "URI export cannot represent chains — keep the full JSON.",
    ],
    commands: [
      "tcptun config check --config client-chain.json",
      "tcptun --config client-chain.json",
    ],
    serverCode: nativeServerExample,
    clientCode: nativeChainClientExample,
    serverHint: "server-native.json",
    clientHint: "client-chain.json",
  },
  {
    id: "native-relay",
    protocol: "native",
    group: "native-topology",
    recommended: false,
    title: "Native relay hop",
    summary: "Accept native on one side and forward through another native outbound.",
    when: "You need an intermediate relay that does not terminate the final exit itself.",
    steps: [
      "Use distinct inbound and outbound credentials.",
      "Route default_outbound to the next native hop.",
      "Start the far exit first, then the relay, then clients.",
    ],
    commands: [
      "tcptun config check --config relay.json",
      "tcptun --config relay.json",
    ],
    serverCode: nativeRelayExample,
    clientCode: nativeClientExample,
    serverHint: "relay.json",
    clientHint: "client-native.json",
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
