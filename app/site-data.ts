export const releaseVersion = "0.2.2";

export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
};

/** Static assets hosted on GitHub Pages under /releases/<version>/ */
export const releaseBasePath = `/releases/${releaseVersion}`;

export const installCommand = "curl -fsSL https://tcptun.com/install.sh | sh";

export const pinnedInstallCommand = `curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=${releaseVersion} sh`;

export const faqItems = [
  {
    question: "Can I use Xray config files directly?",
    answer: "No. tcptun uses its own JSON topology. Xray compatibility covers wire protocols such as VLESS / VMess / Trojan, not the config format.",
  },
  {
    question: "How do I validate a config?",
    answer: "Run tcptun config check --config config.json. It validates and compiles without listening on ports.",
  },
  {
    question: "Where does one-line install put the binary, and how do I pin a version?",
    answer:
      "It installs to /usr/local/bin by default. Use TCPTUN_INSTALL_DIR to change the directory and TCPTUN_VERSION to pin a version (downloaded from tcptun.com/releases).",
  },
  {
    question: "Which platforms are supported?",
    answer: "macOS, Linux, and Windows on amd64 / arm64 (Linux also includes armv7).",
  },
  {
    question: "How is the native token configured?",
    answer: "Server users[].id and client token must match. Use tcptun config native to generate a paired config.",
  },
  {
    question: "When should I enable mux or QUIC?",
    answer:
      "With many short connections and matching versions on both ends, prefer mux: {}. Native QUIC requires native + raw + mux.mode=quic; the security layer can be TLS or reality-quic. The CLI can generate the latter with tcptun config native --quic.",
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
    question: "How do I choose among the four tunnel protocols?",
    answer: "Prefer native for tcptun-to-tcptun throughput. Use vless / vmess / trojan when interoperating with Xray.",
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
      "tcptun first reserves 127.0.0.1:1080, then scans private IPv4 LAN peers for an available SOCKS5:1080. After the first successful handshake it starts a mixed proxy. --retry keeps the listener while continuing to retry.",
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

export const binaryDownloads = [
  binary("tcptun-android-arm64-v0.2.2.apk", "android", "Android", "arm64", "ARM64", 51714794),
  binary("tcptun-android-armv7-v0.2.2.apk", "android", "Android", "armv7", "ARMv7", 48436568),
  binary("tcptun-android-x86_64-v0.2.2.apk", "android", "Android", "amd64", "x86_64", 54532843),
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 17646464),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 16417634),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 17113250),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 15794338),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 16122018),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 17600512),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 16049152),
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
    generatedSecurity: "raw + REALITY; QUIC uses reality-quic",
    mux: "Recommended when both ends match",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "Private low-overhead protocol. Prefer raw + mux for throughput; --quic uses raw + reality-quic + mux.mode=quic. Supports reverse publish/expose.",
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
    title: "Throughput",
    body: "Prefer native + raw + mux. TLS / REALITY / ws / h2 / h3 are more flexible but cost more.",
  },
  {
    title: "Reverse publish",
    body: "Server publish + client expose can hang NAT-side TCP/UDP services on edge listeners.",
  },
  {
    title: "Version",
    body: "mux is a private protocol and both ends must match; drop the mux field first during rolling upgrades.",
  },
  {
    title: "Generate",
    body: "tcptun config native generates paired server / client configs; export URIs separately with tcptun uri export.",
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
      { key: "security", side: "both", detail: "tls, reality, or reality-quic; all security parameters live here." },
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
    title: "Failure fallback",
    body: "Failed sessions are replaced and retried; persistent failure falls back to standalone tunnel connections.",
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
    body: "Top-level fields are only log, inbounds, outbounds, route, and dns. Unknown fields are rejected.",
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

/** Native + REALITY pair shape produced by config generator (mux off by default). */
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
      }
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
      }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

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
    title: "QUIC variant",
    body: "reality-quic is only for native + raw + QUIC mux, reuses REALITY key fields, and does not use spider_x.",
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
    url: `${releaseBasePath}/${filename}`,
  };
}
