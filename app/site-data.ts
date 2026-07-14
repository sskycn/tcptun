export const releaseVersion = "0.1.9";

export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
};

export const installCommand = "curl -fsSL https://tcptun.com/install.sh | sh";

export const pinnedInstallCommand = `curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=${releaseVersion} sh`;

export const faqItems = [
  {
    question: "能直接使用 Xray 配置文件吗？",
    answer: "不能。tcptun 使用自己的 JSON 拓扑。与 Xray 兼容的是 VLESS / VMess / Trojan 等线路协议。",
  },
  {
    question: "如何校验配置？",
    answer: "运行 tcptun config check --config config.json。会完成校验与编译，但不监听端口。",
  },
  {
    question: "一键安装装到哪里？如何固定版本？",
    answer: "默认安装到 /usr/local/bin。用 TCPTUN_INSTALL_DIR 改目录，用 TCPTUN_VERSION 固定版本。",
  },
  {
    question: "支持哪些平台？",
    answer: "macOS、Linux、Windows 的 amd64 / arm64（Linux 另含 armv7）。",
  },
  {
    question: "native 的 token 如何配置？",
    answer: "服务端 users[].id 与客户端 token 必须相同。可用 tcptun config native 生成配对配置。",
  },
  {
    question: "何时开启 mux 或 QUIC？",
    answer: "短连接多、两端同版本时建议开 mux。QUIC 需要 raw + TLS，与 REALITY 互斥。",
  },
  {
    question: "REALITY 能和 TLS 一起用吗？",
    answer: "不能。REALITY 仅配合 raw，且不能开启 transport.tls。",
  },
  {
    question: "四种隧道协议怎么选？",
    answer: "两端都是 tcptun、偏吞吐用 native。对接 Xray 用 vless / vmess / trojan。",
  },
  {
    question: "网站上的配置生成安全吗？",
    answer:
      "密钥与凭据在浏览器本地用 Web Crypto 生成，不会上传。也可用 CLI：tcptun config <protocol> --server …。",
  },
  {
    question: "如何把 Xray 配置转成 tcptun？",
    answer:
      "在「转换」中粘贴 Xray JSON 或 vless/vmess/trojan 链接。支持 REALITY/TLS 与 raw/ws/h2；gRPC 等不支持的传输会提示警告。",
  },
] as const;

export const binaryDownloads = [
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 14_562_096),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 13_569_602),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 14_213_304),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 13_172_920),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 13_566_136),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 14_581_760),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 13_304_320),
] as const;

export const inboundTypes = ["mixed", "socks5", "native", "vless", "vmess", "trojan"] as const;
export const outboundTypes = [
  "direct",
  "direct-first",
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
    generatedSecurity: "raw + REALITY",
    mux: "推荐同版本开启",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "私有低开销协议。吞吐优先用 raw + mux；升级时保持两端版本一致。",
  },
  {
    name: "vless",
    credential: "UUID",
    interoperability: "Xray VLESS",
    generatedSecurity: "raw + REALITY + Vision",
    mux: "可选",
    command: "tcptun config vless --server proxy.example.com --port 9443",
    description: "支持 TCP/UDP。生成配置默认 Vision + REALITY，可与 Xray 互通。",
  },
  {
    name: "vmess",
    credential: "UUID",
    interoperability: "Xray VMess AEAD",
    generatedSecurity: "raw + REALITY",
    mux: "可选",
    command: "tcptun config vmess --server proxy.example.com --port 9443",
    description: "VMess AEAD，支持 TCP/UDP，可与 Xray 互通。",
  },
  {
    name: "trojan",
    credential: "Password",
    interoperability: "Xray Trojan",
    generatedSecurity: "raw + REALITY",
    mux: "可选",
    command: "tcptun config trojan --server proxy.example.com --port 9443",
    description: "密码认证的 Trojan 隧道，支持 TCP/UDP。",
  },
] as const;

export const topologyExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

/** Minimal native server: tunnel inbound + direct exit. */
export const nativeServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "listen": "0.0.0.0",
      "port": 9443,
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": { "type": "raw" },
      "mux": { "enabled": true },
      "outbound": "direct"
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

/** Minimal native client: local mixed proxy → native outbound. */
export const nativeClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    },
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

/** Native + QUIC mux mode (TLS 1.3 required on both ends). */
export const nativeQuicClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
      "token": "change-me",
      "network": ["tcp", "udp"],
      "transport": {
        "type": "raw",
        "tls": true,
        "server_name": "proxy.example.com"
      },
      "mux": {
        "enabled": true,
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
  "dns": {},
  "discovery": {}
}`;

export const nativeQuicServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "listen": "0.0.0.0",
      "port": 9443,
      "network": ["tcp", "udp"],
      "users": [{ "id": "change-me" }],
      "transport": {
        "type": "raw",
        "tls": true,
        "cert": "server.crt",
        "key": "server.key"
      },
      "mux": {
        "enabled": true,
        "mode": "quic",
        "max_streams_per_session": 128
      },
      "outbound": "direct"
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

export const nativeConfigHighlights = [
  {
    title: "认证",
    body: "服务端 users[].id 与客户端 token 必须一致。",
  },
  {
    title: "吞吐",
    body: "优先 native + raw + mux。TLS / REALITY / ws / h2 / h3 更灵活，但开销更高。",
  },
  {
    title: "版本",
    body: "mux 为私有协议，两端需同版本；滚动升级时可先关闭 mux。",
  },
  {
    title: "生成",
    body: "tcptun config native 一次生成配对的 server / client 配置与 URI。",
  },
] as const;

export const nativeFieldGroups = [
  {
    name: "公共字段",
    fields: [
      { key: "tag", side: "两端", detail: "唯一标识，供路由引用。" },
      { key: "type", side: "两端", detail: '"native"。' },
      { key: "network", side: "两端", detail: "tcp / udp，可组合。" },
      { key: "transport", side: "两端", detail: "raw / ws / h2 / h3，及 TLS 相关字段。" },
      { key: "security", side: "两端", detail: "可选 REALITY；仅 raw，且不能叠 TLS。" },
      { key: "mux", side: "两端", detail: "多路复用；连接池参数主要在客户端。" },
    ],
  },
  {
    name: "服务端",
    fields: [
      { key: "listen / port", side: "server", detail: "监听地址与端口。" },
      { key: "users[].id", side: "server", detail: "认证凭据，对应客户端 token。" },
      { key: "outbound", side: "server", detail: "默认出口 tag。" },
      { key: "transport.cert/key", side: "server", detail: "TLS 或 QUIC 模式时必填。" },
    ],
  },
  {
    name: "客户端",
    fields: [
      { key: "server / port", side: "client", detail: "远端地址与端口。" },
      { key: "token", side: "client", detail: "必填，对应服务端 users[].id。" },
      { key: "transport.server_name", side: "client", detail: "TLS/QUIC 的 SNI。" },
      { key: "mux.max_sessions", side: "client", detail: "连接池上限，1–32，默认 4。" },
      { key: "mux.max_streams_per_session", side: "client", detail: "单连接 stream 上限，1–4096。" },
      { key: "mux.warm_spares", side: "client", detail: "预热空闲连接数，须小于 max_sessions。" },
      { key: "mux.udp_mode", side: "client", detail: "quic 专用：reliable / auto / datagram。" },
    ],
  },
] as const;

export const nativeMuxNotes = [
  {
    title: "TCP mux",
    body: "开启后复用物理连接。目标不可达时不会提前向本地代理返回成功。",
  },
  {
    title: "失败回退",
    body: "session 失效会替换重试；持续失败则回退到独立隧道连接。",
  },
  {
    title: "QUIC",
    body: 'mux.mode: "quic" 使用 UDP/QUIC 连接池，要求 raw + TLS 1.3。',
  },
  {
    title: "UDP",
    body: "reliable 走可靠 stream；auto 优先 DATAGRAM；datagram 强制 DATAGRAM。",
  },
] as const;

export const nativeWorkflowCommands = [
  {
    name: "generate",
    title: "生成配置对",
    command: "tcptun config native --server proxy.example.com --port 9443",
    body: "输出 server.json、client.json、client.uri。",
  },
  {
    name: "check",
    title: "校验",
    command: "tcptun config check --config server.json",
    body: "不监听端口，适合改配置后自检。",
  },
  {
    name: "run",
    title: "启动",
    command: "tcptun --config server.json\ntcptun --config client.json",
    body: "先起服务端，再起客户端。",
  },
  {
    name: "uri",
    title: "导入 URI",
    command: "tcptun uri import --input client.uri --client --output client.json",
    body: "从 native:// URI 生成客户端配置。",
  },
] as const;

export const configModelNotes = [
  {
    title: "结构",
    body: "log、inbounds、outbounds、route、dns、discovery。未知字段会被拒绝。",
  },
  {
    title: "引用",
    body: "组件通过 tag 互相关联；入口与路由规则指向出口。",
  },
  {
    title: "启动",
    body: "Load → Validate → Compile → Start，校验通过后才监听。",
  },
] as const;

/** VLESS + REALITY server example (keys are placeholders; use config generator in production). */
export const vlessRealityServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "vless",
      "listen": "0.0.0.0",
      "port": 443,
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
      },
      "outbound": "direct"
    }
  ],
  "outbounds": [
    { "tag": "direct", "type": "direct" }
  ],
  "route": { "default_outbound": "direct", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

export const vlessRealityClientExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "vless",
      "server": "proxy.example.com",
      "port": 443,
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
  "dns": {},
  "discovery": {}
}`;

/** Native + REALITY pair shape produced by config generator (mux off by default). */
export const nativeRealityServerExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "server",
      "type": "native",
      "listen": "0.0.0.0",
      "port": 9443,
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
      "outbound": "direct"
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
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
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
    title: "仅 raw",
    body: "transport 必须是 raw，不能与 ws / h2 / h3 组合。",
  },
  {
    title: "不叠 TLS",
    body: "不能开启 transport.tls。需要证书 TLS 或 QUIC 时，不要使用 REALITY。",
  },
  {
    title: "适用端点",
    body: "可用于 native / vless / vmess / trojan。mixed、socks5 不支持。",
  },
  {
    title: "密钥成对",
    body: "服务端 private_key 与客户端 public_key 对应；short_id 两端一致。",
  },
] as const;

export const realityFieldGroups = [
  {
    name: "服务端",
    fields: [
      { key: "type", detail: '"reality"。' },
      { key: "private_key", detail: "X25519 私钥（base64url）。" },
      { key: "server_names", detail: "允许的 SNI 列表。" },
      { key: "short_ids", detail: "允许的 short id（hex）。" },
      { key: "dest", detail: "伪装目标，如 example.com:443。" },
      { key: "max_time_diff", detail: "可选时钟偏差，默认 30s。" },
    ],
  },
  {
    name: "客户端",
    fields: [
      { key: "type", detail: '"reality"。' },
      { key: "public_key", detail: "服务端公钥。" },
      { key: "server_name", detail: "SNI，需落在 server_names 中。" },
      { key: "short_id", detail: "单个 short id。" },
      { key: "fingerprint", detail: "uTLS 指纹，常用 chrome。" },
      { key: "spider_x", detail: "可选路径，默认 /。" },
    ],
  },
] as const;

export const realityCommands = [
  {
    title: "生成 REALITY 配置对",
    command:
      "tcptun config vless --server proxy.example.com --port 443 --server-name example.com --dest example.com:443",
    body: "输出配对的 server / client 配置与 URI。",
  },
  {
    title: "native + REALITY",
    command:
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
    body: "为 native 生成带 REALITY 的两端配置。",
  },
  {
    title: "校验并启动",
    command: "tcptun config check --config server.json && tcptun --config server.json",
    body: "先校验密钥与字段，再启动。",
  },
] as const;

export const protocolComparison = [
  {
    name: "native",
    credential: "token ↔ users[].id",
    interop: "仅 tcptun",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "私有 mux，推荐开启",
    bestFor: "吞吐优先",
    generator: "tcptun config native --server … --port …",
  },
  {
    name: "vless",
    credential: "uuid ↔ users[].id",
    interop: "Xray VLESS",
    securityDefault: "raw + REALITY + Vision",
    vision: "xtls-rprx-vision",
    muxNote: "可选",
    bestFor: "Xray 互通 / 伪装",
    generator: "tcptun config vless --server … --port …",
  },
  {
    name: "vmess",
    credential: "uuid ↔ users[].id",
    interop: "Xray VMess",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "可选",
    bestFor: "VMess 生态",
    generator: "tcptun config vmess --server … --port …",
  },
  {
    name: "trojan",
    credential: "password ↔ users[].password",
    interop: "Xray Trojan",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "可选",
    bestFor: "密码认证",
    generator: "tcptun config trojan --server … --port …",
  },
] as const;

export const protocolOutboundSnippets = {
  native: `{
  "tag": "proxy",
  "type": "native",
  "server": "proxy.example.com",
  "port": 9443,
  "token": "change-me",
  "transport": { "type": "raw" },
  "mux": { "enabled": true }
}`,
  vless: `{
  "tag": "proxy",
  "type": "vless",
  "server": "proxy.example.com",
  "port": 443,
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
  "server": "proxy.example.com",
  "port": 443,
  "uuid": "00000000-0000-4000-8000-000000000000",
  "transport": {
    "type": "ws",
    "path": "/vmess",
    "tls": true,
    "server_name": "proxy.example.com"
  },
  "mux": { "enabled": true }
}`,
  trojan: `{
  "tag": "proxy",
  "type": "trojan",
  "server": "proxy.example.com",
  "port": 443,
  "password": "change-me",
  "transport": {
    "type": "raw",
    "tls": true,
    "server_name": "proxy.example.com"
  },
  "mux": { "enabled": true }
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
    url: `https://unpkg.com/tcptun@${releaseVersion}/dist/${filename}`,
  };
}
