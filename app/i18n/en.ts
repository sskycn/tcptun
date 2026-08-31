export const en = {
  meta: {
    siteTitle: "tcptun · Programmable Networking Runtime",
    titleTemplate: "%s · tcptun",
    description:
      "tcptun compiles routing, tunnels, transports, and platform networking into one strict, observable runtime. Run it as a CLI, embed it in Go, or integrate it into Android VPN clients.",
    tagline: "Programmable networking runtime for applications and devices",
    keywords: [
      "programmable networking runtime",
      "Go networking library",
      "TCP UDP tunnel runtime",
      "embedded VPN engine",
      "reverse TCP tunnel",
      "application aware VPN routing",
      "QUIC tunnel runtime",
      "tcptun",
    ],
  },
  common: {
    copy: "Copy",
    copied: "Copied",
    copyConfig: "Copy config",
    copyCommand: "Copy command",
    generating: "Generating…",
    server: "Server",
    client: "Client",
    backToTop: "Back to top",
    cookies: "Cookies",
    language: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  theme: {
    group: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  nav: {
    getStarted: "Get started",
    docs: "Docs",
    examples: "Examples",
    embed: "Embed",
    download: "Download",
    github: "GitHub",
    product: "Product",
    documentation: "Documentation",
    tools: "Tools",
    source: "Source",
    goSdk: "Go SDK",
    useCases: "Use cases",
    androidApp: "Android app",
    cli: "CLI",
    docsHub: "Docs hub",
    architecture: "Architecture",
    configuration: "Configuration",
    protocols: "Protocols",
    nativeProtocol: "Native protocol",
    examplesCatalog: "Examples catalog",
    realityAuto: "Reality auto",
    reversePublish: "Reverse publish",
    securityTrust: "Security & trust",
    faq: "FAQ",
    configGenerator: "Config generator",
    uriTools: "URI tools",
    setupWizard: "Setup wizard",
    legal: "Legal",
    privacy: "Privacy",
    githubRuntime: "GitHub · runtime",
  },
  footer: {
    latestRuntime: "Latest runtime {version}",
    lawful:
      "Lawful use only · You bear all consequences · No warranty.",
    disclaimer: "Disclaimer",
    runtimeBlurb: "programmable networking runtime",
    sourceRelease: "Source & release",
    installSh: "install.sh",
    npm: "npm · tcptun",
  },
  cookies: {
    aria: "Cookie notice",
    title: "We use cookies",
    lead:
      "This website may use cookies and similar technologies (including browser local storage) to operate the site and remember preferences. We also store your theme preference locally. See details or accept to continue.",
    details: "Details",
    hideDetails: "Hide details",
    accept: "Accept",
    points: [
      "Theme preference may be stored in your browser (for example localStorage key tcptun-theme) so light, dark, or system mode can be restored on later visits.",
      "Hosting, CDN, or security infrastructure that serves this site may set technical cookies or logs needed to deliver pages, assets, and basic reliability.",
      "Browser tools on this site (config generation and URI conversion) process data locally in your browser; those tools are not used by us to set advertising cookies.",
      "We do not use first-party advertising or marketing tracking cookies on this site. Third-party services outside our control may still process requests according to their own policies.",
      "You can clear cookies and site data in your browser settings at any time. Disabling storage may reset preferences such as theme.",
    ],
    acceptance:
      "By continuing to browse or use this website, you acknowledge and accept this cookies statement. If you do not agree, please stop using the site and clear this site’s cookies and stored data from your browser.",
  },
  home: {
    runtime: "networking runtime",
    h1a: "Programmable networking runtime",
    h1b: "for applications and devices",
    getStarted: "Get started",
    documentation: "Documentation",
    download: "Download",
    runModes:
      "Run as {cli}, {android}, {go}, or {engine}.",
    cli: "CLI runtime",
    android: "Android VPN client",
    go: "embedded Go library",
    engine: "platform networking engine",
    whatEyebrow: "What is tcptun?",
    whatTitle: "A compiled networking runtime — not a protocol catalog.",
    whatBody:
      "tcptun loads a strict JSON topology, compiles outbounds and routes, prepares every inbound, then serves them together. The same engine powers the CLI, Go embeddings, and Android integrations. Protocol count is secondary; the model is primary.",
    diffs: [
      "Programmable networking runtime — not a single-purpose proxy app",
      "Embeddable Go engine with net.Conn / PacketConn / Listener contracts",
      "Deterministic compile-before-serve routing model",
      "Native protocol architecture for controlled tcptun-to-tcptun deployments",
      "Platform integration surface for CLI, Android, and gateways",
    ],
    pathsEyebrow: "Choose your path",
    pathsTitle: "Run, embed, or integrate.",
    paths: [
      {
        href: "/guide/",
        label: "Run",
        title: "CLI runtime",
        body: "Install the binary, generate a strict JSON topology, validate, and serve inbounds together.",
      },
      {
        href: "/embed/",
        label: "Embed",
        title: "Go SDK",
        body: "Import pkg.tcptun.com/net and compose dialers, listeners, packet devices, and routing in process.",
      },
      {
        href: "/download/#android",
        label: "Integrate",
        title: "Android & platforms",
        body: "Play Store app v0.2.52 embeds tcptun v0.2.5. Pair that listing with a v0.2.5 server — not CLI v0.4.2.",
      },
    ],
    coreEyebrow: "Core capabilities",
    coreTitle: "What the runtime actually does.",
    coreLead:
      "Capability list after positioning — so new readers already know tcptun is an engine, not a single-purpose tunnel utility.",
    architecture: "Architecture",
    coreLabel: "Core",
    capabilities: [
      {
        title: "Compiled topology",
        body: "FileConfig is validated and compiled before any listener opens. Unknown fields fail closed.",
      },
      {
        title: "Multi-inbound / multi-outbound",
        body: "One process hosts mixed proxies, tunnels, reverse publish, balance groups, and rule routing.",
      },
      {
        title: "Native TCP/QUIC path",
        body: "tcptun-to-tcptun Native protocol with mux, carrier.mode selection, and optional resumable streams.",
      },
      {
        title: "Resource-bounded runtime",
        body: "Mux pools, resume buffers, and packet paths are budgeted so long-lived services stay predictable.",
      },
      {
        title: "Platform networking",
        body: "TUN, DNS interception / fake-IP, and Android bridge hooks for device-level integration.",
      },
      {
        title: "Local proxy authentication",
        body: "mixed and socks5 hops with users[] and SOCKS5 secure auth v2 (HKDF method 0x80). Tunnel endpoints are native only.",
      },
    ],
    archEyebrow: "Architecture",
    archTitle: "Validate → compile → serve.",
    archLead:
      "FileConfig is decoded with unknown-field rejection, compiled into RuntimeConfig, then bound. Fail closed before traffic is accepted.",
    fullArchitecture: "Full architecture",
    fileConfig: "Strict JSON topology",
    validate: "Tags, refs, auth, caps",
    runtimeConfig: "Compiled graph",
    serve: "TCP · UDP · TUN · routes",
    protoEyebrow: "Protocols",
    protoTitle: "Native tunnels. Local mixed hops.",
    protoLead:
      "v{version} tunnel endpoints are native only. mixed and socks5 remain for authenticated local/LAN proxy hops.",
    nativeGuide: "Native guide",
    nativeTitle: "tcptun Native protocol",
    nativeBody:
      "Optimized for TCP/QUIC carriers, mux, resumable streams, reverse publishing, resource control, and tcptun-to-tcptun deployments.",
    nativeCta: "Native guide →",
    localLabel: "Local proxy",
    localTitle: "mixed / SOCKS5",
    localBody:
      "Authenticated local listeners and LAN hops with users[] and SOCKS5 secure auth v2.",
    configCta: "Config reference →",
    releaseEyebrow: "Latest · {version}",
    releaseTitle: "What shipped in this runtime.",
    releaseLead:
      "Release notes stay technical: native-only tunnels, carrier.prefer, SOCKS5 secure auth v2, idle power-save probes, and mux stall recovery. Version lives here — not in the document title for SEO.",
    githubRelease: "GitHub release",
    trustEyebrow: "Security & trust",
    trustTitle: "Source, install, and fail-closed defaults.",
    trustLead:
      "Inspect installers, verify package provenance, and read how the runtime validates config before binding ports.",
    securityPage: "Security page",
    inspectInstall: "install.sh (inspect first)",
    binariesVerify: "Binaries + verify",
    nextStepTitle: "Download the runtime and start from a validated config.",
  },
  download: {
    title: "Download",
    heroTitle: "Multi-platform runtime binaries.",
    heroLead:
      "Latest published CLI: tcptun@{version}. Binaries are files inside the npm package (not opaque third-party mirrors). Prefer inspect-then-run install or npm.",
    securityTrust: "Security & trust",
    androidPlay: "Android on Google Play",
    cliQuickstart: "CLI quickstart",
    version: "Version",
    sourceTag: "Source tag",
    npmPackage: "npm package",
    googlePlay: "Google Play",
    tarball: "tarball",
    androidEyebrow: "Android",
    androidTitle: "VPN client on Google Play.",
    androidLead:
      "The Android app wraps the networking runtime for device-level TUN, DNS, and outbound switching. Install from Play Store package {packageId}.",
    androidWarn:
      "Play Store v{appVersion} embeds tcptun v{runtimeVersion}, not CLI v{cliVersion}. Pair that app with a v{runtimeVersion} server. Mixing it with this CLI release will fail or misbehave.",
    getPlay: "Get it on Google Play",
    androidPrivacy: "Android privacy",
    clientName: "tcptun client v{appVersion}",
    clientBody:
      "Application-aware VPN routing on Android. This Play listing ships tcptun v{runtimeVersion}. It is not the v{cliVersion} CLI runtime on this page — keep peers on the same core version.",
    openPlay: "Open Play Store",
    platformsEyebrow: "Platform builds",
    platformsTitle: "Linux, macOS, Windows.",
    platformsLead:
      "Each file is served from the published npm package layout under dist/. After install, run tcptun --version and match peers for mux/resume features.",
    verifyEyebrow: "Verify",
    verifyTitle: "Why this binary path is inspectable.",
    source: "Source",
    sourceBody: "Runtime repository:",
    release: "Release",
    package: "Package",
    packageBody:
      "npm publishes the same dist/ artifacts used by the installer and CDN links.",
    installer: "Installer",
    installerBody:
      "One-liner convenience: {command}. Safer: download, read, pin version, then run — or use npm.",
    inspectInstall: "inspect → install",
    fullSecurity: "Full security page",
    firstTunnel: "First tunnel wizard",
    recommended: "Recommended for you",
    downloadBinary: "Download {platform} {arch}",
    fallbackLinux: "Download Linux x64",
    viewScript: "View script",
    oneLine: "One-line install",
    installVersion: "Install version",
    latestNote:
      "Installs the latest release to /usr/local/bin. Override the directory with TCPTUN_INSTALL_DIR.",
    pinnedNote: "Installs v{version}. Override the directory with TCPTUN_INSTALL_DIR.",
    npmInstallNote: "Or install the published package with npm.",
  },
  docs: {
    title: "Documentation",
    heroTitle: "Find the path, then the reference.",
    heroLead:
      "Documentation is grouped for operators and embedders. Start with a first tunnel, learn the compile model, then open protocol and embedding references.",
    getStarted: "Get started",
    architecture: "Architecture",
    goSdk: "Go SDK",
    groups: [
      {
        title: "Getting started",
        links: [
          { href: "/guide/", label: "Setup wizard", body: "First tunnel with install, generate, check, run." },
          { href: "/start/", label: "CLI quickstart", body: "Commands for run, check, generate, import." },
          { href: "/download/", label: "Install & download", body: "npm package binaries and installer." },
        ],
      },
      {
        title: "Concepts",
        links: [
          { href: "/architecture/", label: "Architecture", body: "FileConfig → RuntimeConfig → serve." },
          { href: "/config/", label: "Configuration", body: "Topology fields, Reality auto, resume, reverse." },
          { href: "/faq/", label: "FAQ", body: "Common operational questions." },
        ],
      },
      {
        title: "Advanced",
        links: [
          { href: "/protocols/native/", label: "Native protocol", body: "Carriers, mux, resume, reverse." },
          { href: "/protocols/", label: "Protocols", body: "Native tunnels; mixed/socks5 local hops." },
          { href: "/examples/", label: "Examples", body: "Copy-ready topologies." },
          { href: "/config/#resumable", label: "Resumable streams", body: "mux.resume scope and bounds." },
          { href: "/config/#reverse", label: "Reverse publish", body: "NAT-side TCP/UDP exposure." },
        ],
      },
      {
        title: "Embedding",
        links: [
          { href: "/embed/", label: "Go SDK", body: "pkg.tcptun.com/net and net contracts." },
          { href: "/use-cases/#android", label: "Android integration", body: "VPN-oriented platform path." },
          { href: "https://github.com/gostartkit/tcptun-go", label: "Runtime source", body: "gostartkit/tcptun-go on GitHub.", external: true },
        ],
      },
      {
        title: "Tools",
        links: [
          { href: "/generate/", label: "Config generator", body: "Browser-local key generation." },
          { href: "/uri/", label: "URI / QR tools", body: "Import and export endpoints." },
          { href: "/guide/", label: "Setup wizard", body: "Guided first tunnel." },
        ],
      },
      {
        title: "Trust",
        links: [
          { href: "/security/", label: "Security & trust", body: "Supply chain and install safety." },
          { href: "/legal/", label: "Legal", body: "Disclaimer and lawful use." },
          { href: "/privacy/", label: "Privacy", body: "Cookies and local processing." },
        ],
      },
    ],
  },
  examples: {
    title: "Examples",
    heroTitle: "Configuration catalog, native first.",
    heroLead:
      "Browse every worked server/client pair for tcptun {version}: Reality carriers, reverse publish, and topology patterns. Keys and tokens are generated in your browser on each visit. Copy JSON, validate, start the server first.",
    realityAuto: "Reality auto",
    generatePair: "Generate pair",
    configRef: "Config reference",
    catalogEyebrow: "Catalog",
    catalogTitle: "Browse every worked config.",
    catalogLead:
      "Native stacks first. Pick a configuration from the menu, then copy the matching server / client JSON. Reality keys, short IDs, tokens, and UUIDs are generated in your browser for this page load — refresh to get a new set. Run tcptun config check, start the server, then the client.",
    freshCreds: "Fresh credentials for this visit:",
    filterNative: "native",
    filterAll: "All",
    recommended: "recommended",
    rec: "Rec",
    when: "When:",
    openGenerator: "Open generator",
    generatingKeys: "Generating Reality keys and credentials…",
    groups: {
      "native-carriers": {
        label: "Native · carriers",
        description: "Recommended tcptun-to-tcptun stacks and carrier.mode variants.",
      },
      "native-topology": {
        label: "Native · topology",
        description: "Reverse publish, multi-path, balance, routing, chain, and relay.",
      },
    },
  },
  useCases: {
    title: "Use cases",
    heroTitle: "What people build with a networking runtime.",
    heroLead:
      "tcptun is not marketed as a consumer VPN product. These paths show how operators and developers use the same compiled runtime for private links, reverse publish, platform VPN, and embedded engines.",
    getStarted: "Get started",
    architecture: "Architecture",
    androidApp: "Android app",
    label: "Use case",
    items: [
      {
        id: "private-proxy",
        title: "Private endpoint",
        body: "Run your own private networking endpoint with a compiled topology: mixed local inbound, Native tunnel outbound, and explicit routes.",
        cta: "Setup wizard",
      },
      {
        id: "reverse",
        title: "Reverse publishing",
        body: "Expose TCP/UDP services behind NAT through native mux tunnels. Server publish and client expose share service names across the mesh.",
        cta: "Reverse docs",
      },
      {
        id: "android",
        title: "Android VPN runtime",
        body: "Build application-aware VPN routing with TUN, DNS, and outbound switching. The current Play Store app v0.2.52 embeds tcptun v0.2.5 — pair it with a v0.2.5 server, not CLI v0.4.2. Embedders can ship a newer bridge separately.",
        cta: "Google Play",
      },
      {
        id: "embed",
        title: "Go embedded networking",
        body: "Embed routing and transport capabilities in-process using standard net contracts instead of managing external proxy processes.",
        cta: "Go SDK",
      },
      {
        id: "multi-site",
        title: "Multi-site networking",
        body: "Connect distributed services with balance groups, chains, and deterministic route rules across compiled outbounds.",
        cta: "Examples",
      },
      {
        id: "interop",
        title: "Local mixed / SOCKS5 hops",
        body: "Keep mixed and socks5 for authenticated local or LAN hops. Tunnel endpoints are native.",
        cta: "Protocols",
      },
    ],
  },
  generate: {
    title: "Generate config",
    heroTitle: "Paired configs in the browser.",
    heroLead:
      "Create server.json, client.json, and client.uri locally. Native defaults to v0.4.2 Reality auto carriers; optional resumable streams and forced QUIC.",
    browseExamples: "Browse examples",
    uriTools: "URI tools",
    eyebrow: "Generate",
    heading: "Generate paired configs in the browser.",
    lead:
      "Builds v0.4.2 native server/client pairs: auto mode uses raw + REALITY with carrier.mode=auto and mux, optional resumable TCP streams, or forced QUIC via carrier.mode=quic. Keys stay local.",
    protocol: "Protocol",
    autoReality: "v0.4.2 Reality auto — TCP+QUIC on one address (carrier.mode=auto)",
    resume: "Resume eligible TCP streams across carrier replacement",
    emptyTitle: "Fill in the form, then generate",
    emptyLead:
      "Creates server.json, client.json, and client.uri. JSON matches tcptun config native; URI matches tcptun uri export.",
    bullets: [
      "Generates an X25519 key pair and short id",
      "Creates a native token (v0.4.2 is native-only)",
      "Native defaults to v0.4.2 automatic TCP/QUIC Reality carriers (carrier.mode=auto)",
      "Resumable TCP streams add matching bounded settings to both peers",
      "Forced QUIC emits carrier.mode=quic with mux enabled",
    ],
  },
  convert: {
    title: "URI tools",
    heroTitle: "URI tools",
    heroLead: "Export and import native endpoints.",
  },
  uri: {
    title: "URI tools",
  },
  guide: {
    title: "Setup wizard",
  },
  start: {
    title: "CLI quickstart",
    heroTitle: "Run, check, generate, import.",
    heroLead: "Run, check, generate, and import tcptun configs from the command line.",
    workflows: [
      { name: "run", title: "Run a config", body: "Load and validate JSON, then start every inbound." },
      { name: "check", title: "Validate only", body: "Validate and compile without listening on ports." },
      { name: "generate", title: "Generate a pair", body: "Generate matching server / client configs with credentials and REALITY keys." },
      { name: "uri", title: "Import URI", body: "Build a client config from a native URI." },
    ],
  },
  architecture: {
    title: "Architecture",
    heroTitle: "Compile before serve.",
    heroLead:
      "How tcptun compiles FileConfig into a fail-closed networking runtime: validation, RuntimeConfig, TCP/UDP/TUN, and routing.",
    pipeline: [
      { title: "FileConfig", body: "Strict JSON topology with unknown-field rejection. Inbounds, outbounds, route, DNS, and resource budgets." },
      { title: "Validate", body: "Unique tags, reference integrity, auth material, transport/security combos, and capability checks before bind." },
      { title: "Compile", body: "Produce RuntimeConfig: compiled outbound graph, route table, and prepared listeners — not ad-hoc runtime parsing." },
      { title: "Serve", body: "One process serves TCP, UDP, TUN, reverse publish, and packet paths with shared routing and diagnostics." },
    ],
    properties: [
      { title: "Fail closed", body: "Invalid config never partially starts. DNS fake-IP and routing refuse unsafe fallbacks when validation fails." },
      { title: "Deterministic routing", body: "Rules and default_outbound are compiled; balance and chain hops are cycle-checked and finite." },
      { title: "Resource bounds", body: "Mux pools, resume buffers, and packet paths use explicit budgets so memory behavior stays predictable." },
      { title: "Observable runtime", body: "Log levels, bridge identity, and runtime statistics surface for operators and embedders." },
    ],
  },
  embed: {
    title: "Embed · Go networking library",
    heroTitle: "In-process networking runtime.",
    heroLead:
      "Embed tcptun as a Go networking runtime: net.Conn, PacketConn, Listener, endpoint.Dialer, routing engine, and packet devices.",
    surfaces: [
      { title: "net.Conn", body: "Stream tunnels and dialed sessions use the standard stream contract." },
      { title: "net.PacketConn", body: "Packet sessions adapt to connected or unconnected datagram APIs." },
      { title: "net.Listener", body: "Reusable transport sessions can be exposed as listeners." },
      { title: "endpoint.Dialer", body: "TCP and UDP dialing through compiled endpoint policies." },
      { title: "PacketDevice / TUN", body: "Platform packet devices enter the same compiled router." },
      { title: "Routing engine", body: "Application-aware route selection over the outbound graph." },
    ],
    audiences: [
      "Go developers building network agents",
      "VPN and gateway applications",
      "Embedded systems and CPE-style devices",
      "Control planes that need in-process tunnels",
    ],
  },
  protocols: {
    title: "Protocols",
    heroTitle: "Native tunnels in one topology.",
    heroLead:
      "Use native for tcptun-to-tcptun carriers, mux, and reverse publish. mixed / socks5 stay as authenticated local hops.",
    nativeGuide: "Native guide",
    allExamples: "All examples",
    configRef: "Config reference",
    nativeTitle: "How native works, and how to run it end to end.",
  },
  config: {
    title: "Configuration",
    heroTitle: "One JSON topology.",
    heroLead: "Unknown fields fail closed. Native carriers, mux, resume, reverse publish, and routing live in the same FileConfig.",
  },
  security: {
    title: "Security & trust",
    heroTitle: "Inspect, pin, fail closed.",
  },
  faq: {
    title: "FAQ",
    heroTitle: "Frequently asked questions",
    heroLead: "Operational answers for install, native carriers, routing, and the Android / CLI version split.",
    heading: "FAQ",
    sectionTitle: "Frequently asked questions",
    items: [
      {
        q: "Can I use Xray config files directly?",
        a: "No. tcptun uses its own JSON topology. Tunnel endpoints are native; mixed and socks5 are for local/LAN proxy hops.",
      },
      {
        q: "What is the native protocol?",
        a: "native is tcptun’s private tunnel protocol for tcptun-to-tcptun setups. A typical path is local mixed → native outbound → native inbound → direct, with matching users[].id and token. See the Native guide for a full tutorial and examples.",
      },
      {
        q: "How do I run my first native tunnel?",
        a: "Install tcptun, run tcptun config native --server <host> --port <port>, edit the generated server/client endpoints and token, validate with tcptun config check, start the server then the client, and point apps at 127.0.0.1:1080.",
      },
      {
        q: "Which tunnel protocol should I use?",
        a: "Use native for throughput, mux, QUIC, reverse publish, and Reality/TLS carriers. mixed and socks5 remain for local/LAN proxy hops.",
      },
      {
        q: "How do I validate a config?",
        a: "Run tcptun config check --config config.json. It validates and compiles without listening on ports.",
      },
      {
        q: "Where does one-line install put the binary, and how do I pin a version?",
        a: "It installs to /usr/local/bin by default. Use TCPTUN_INSTALL_DIR to change the directory and TCPTUN_VERSION to pin a version. The installer downloads platform binaries from the published npm package (cdn.jsdelivr.net/npm/tcptun).",
      },
      {
        q: "Which platforms are supported?",
        a: "macOS, Linux, and Windows on amd64 / arm64 (Linux also includes armv7). Prefer npm install -g tcptun or the one-line installer for CLI builds.",
      },
      {
        q: "How is the native token configured?",
        a: "Server users[].id and client token must match. Use tcptun config native to generate a paired config.",
      },
      {
        q: "What is native + raw + reality in v0.3.0?",
        a: "It is the automatic dual-carrier stack: type=native, transport raw, mux enabled, security.type=reality, and carrier.mode=auto. The server binds TCP and UDP on one address; the client prefers Reality QUIC, falls back to Reality TCP with backoff, and probes to restore QUIC. Camouflage keys/SNI/dest are shared by both carriers. Without mux, Reality stays TCP-only.",
      },
      {
        q: "How do I choose carrier.mode?",
        a: "carrier.mode=auto (default generators) binds TCP and UDP on one address with TLS or REALITY. Outbound carrier.prefer is adaptive (default), quic, or tcp — strict preferences use the healthy preferred carrier and fall back only while it is unavailable. mode=tcp or mode=quic is a single carrier. Mux must be enabled for auto and quic.",
      },
      {
        q: "When should I enable mux or QUIC?",
        a: "For many short connections, prefer mux.enabled. In v0.3.0, native + raw + mux + reality with carrier.mode=auto prefers QUIC and falls back to Reality TCP. Use carrier.mode=tcp to force TCP, or carrier.mode=quic to force QUIC without fallback.",
      },
      {
        q: "How do resumable streams work?",
        a: "Set mux.resume=true on both native endpoints using the Reality-auto stack (raw + mux + security.type=reality + carrier.mode=auto). A TCP logical stream can reattach after its physical QUIC/TCP carrier fails. It does not cover UDP, reverse publish, forced tcp/quic-only modes, or cross-process failover; keep it off during rolling upgrades until both peers run v0.3.0 or newer.",
      },
      {
        q: "What is TLS passthrough fallback?",
        a: "A native raw TCP inbound with security.type=none can set fallback.type=tls_passthrough to forward ordinary HTTPS probes (matching SNI) to a fixed dest while authenticating native mux traffic. It is inbound-only camouflage, not REALITY, and does not encrypt the native payload.",
      },
      {
        q: "What is Native ECH ClientHello protection?",
        a: "With security.type=none and client_hello.type=ech, the tunnel can hide only the SNI of a carried TLS 1.3 ClientHello (tcptun config native --ech). Later application bytes stay on the security-none path; this is not full application ECH to the destination site.",
      },
      {
        q: "Can REALITY be used together with TLS?",
        a: "No. REALITY works only with raw and cannot be combined with security.type=tls.",
      },
      {
        q: "How should the address field be written?",
        a: "Both inbound and outbound address values are host:port string arrays. Multiple addresses are candidate entry points for the same logical service and race on first handshake; they are not balance load balancing.",
      },
      {
        q: "What is reverse publish?",
        a: "native + raw + mux (group or QUIC) can publish NAT-side TCP/UDP services to the server: configure publish on the server and expose on the client, with matching service names.",
      },
      {
        q: "Is browser-based config generation safe?",
        a: "Keys and credentials are generated locally with Web Crypto and never uploaded. You can also use the CLI: tcptun config <protocol> --server ….",
      },
      {
        q: "How do I move from another proxy config?",
        a: "Rebuild the path as native (or keep mixed/socks5 for local hops). tcptun does not load Xray JSON or other vendors’ share links as tunnel endpoints.",
      },
      {
        q: "What happens when no config file is provided?",
        a: "tcptun never searches the current directory for server.json, client.json, or config.json. Without --config it reserves 127.0.0.1:1080, scans private IPv4 LAN peers for SOCKS5:1080, then starts a mixed proxy after the first successful handshake. --retry keeps the listener and retries discovery; it cannot be combined with --config.",
      },
      {
        q: "How do I load-balance and switch among outbounds?",
        a: "Use a balance outbound to group members with weights and affinity_ttl. Multiple addresses on one outbound only race as candidate entry points; they are not load balancing. The embeddable Runtime and Android bridge also support start/stop, probing, and atomic switches of declared outbounds.",
      },
      {
        q: "Does the Android app match CLI v0.4.2?",
        a: "No. The current Google Play listing (tcptun client v0.2.52) embeds tcptun v0.2.5. Pair that app with a v0.2.5 server. Do not mix it with CLI v0.4.2: the Play app is not Native-only v0.4.x, and the CLI is not the runtime inside v0.2.52.",
      },
    ],
  },
  legal: {
    title: "Legal",
    heroTitle: "Disclaimer and cookies.",
    heroLead:
      "Use this software only under lawful conditions. You assume all consequences. The author provides no warranty or promise.",
    eyebrow: "Legal",
    heading: "Disclaimer",
    lead: "Please read carefully. The following terms apply to every use of tcptun and this website.",
    summary: "Summary",
    summaryBody:
      "Lawful use only. You must use this software legally. Consequences are yours. You alone bear all outcomes of use. No warranty or promise. The author does not guarantee or promise anything about this software or this website. If you do not accept these terms, do not use tcptun.",
    items: [
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
    ],
  },
  privacy: {
    title: "Privacy",
    heroTitle: "What this site stores — and what it does not.",
    androidEyebrow: "Android client",
    androidTitle: "tcptun-kotlin privacy boundary",
    androidLead:
      "These additional disclosures apply to the tcptun-kotlin Android application (Google Play, package {packageId}, app v{appVersion}). That listing embeds tcptun v{runtimeVersion}, not the current CLI v{cliVersion}. The app is a client for endpoints you choose, not an operator-owned VPN service.",
  },
};

export type Dictionary = typeof en;
