export const releaseVersion = "0.1.9";

export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
};

export const installCommand = "curl -fsSL https://tcptun.com/install.sh | sh";

export const pinnedInstallCommand = `curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=${releaseVersion} sh`;

export const faqItems = [
  {
    question: "tcptun 和 Xray 配置能直接互换吗？",
    answer:
      "不能。tcptun 使用自己的严格 JSON 拓扑模型。与 Xray 的兼容是 wire protocol 级互操作（VLESS / VMess / Trojan + REALITY 等），不是配置文件格式兼容。",
  },
  {
    question: "旧版 mode / server_addr 配置还能用吗？",
    answer:
      "不能。顶层 mode、server_addr、tunnel_* 已移除。请用 inbounds、outbounds、route 显式描述拓扑；每个组件需要 tag，引用关系在启动前编译校验。",
  },
  {
    question: "如何在启动前检查配置是否正确？",
    answer:
      "使用 tcptun config check --config config.json。它会完成 Load、Validate、Compile，但不会绑定监听端口，适合 CI 与部署前检查。",
  },
  {
    question: "一键安装会装到哪里？如何固定版本？",
    answer:
      "默认安装到 /usr/local/bin。可用 TCPTUN_INSTALL_DIR 改目录，用 TCPTUN_VERSION 固定版本（例如 0.1.9）。也可直接从 npm CDN 下载对应平台二进制。",
  },
  {
    question: "支持哪些平台与协议？",
    answer:
      "提供 macOS / Linux / Windows 多架构二进制。入口支持 mixed、socks5、native、vless、vmess、trojan；出口还包含 direct、direct-first、blackhole 等。隧道传输可用 raw、ws、h2、h3。",
  },
  {
    question: "没有配置文件时会发生什么？",
    answer:
      "无配置模式下会尝试局域网发现：扫描私有 IPv4 中的 SOCKS5，并通过 mDNS 发现其他 tcptun 节点。生产环境仍建议使用明确的 JSON 拓扑配置。",
  },
  {
    question: "native 的 token 和 users[].id 怎么对应？",
    answer:
      "服务端 native inbound 配置 users[].id，客户端 native outbound 配置 token，两者必须是同一字符串。可用 tcptun config native 生成已配对的两端配置。",
  },
  {
    question: "native 什么时候开 mux？QUIC 模式要注意什么？",
    answer:
      "同版本两端、短连接较多时推荐 mux.enabled。mux.mode=quic 需要 raw transport + TLS，服务端提供 cert/key，客户端配置 server_name；UDP 用 udp_mode 的 reliable/auto/datagram。",
  },
  {
    question: "REALITY 能和 TLS 或 QUIC mux 一起用吗？",
    answer:
      "不能。REALITY 要求 raw transport，且不能与 transport.tls 组合；mux.mode=quic 依赖 TLS，因此也不能与 REALITY 同开。需要伪装时用 REALITY，需要 QUIC 承载时用证书 TLS。",
  },
  {
    question: "四种隧道协议怎么选？",
    answer:
      "两端都是 tcptun、偏吞吐：native。要与 Xray 互通：vless（常配 Vision+REALITY）、vmess 或 trojan。生成器对四种协议都会默认 raw+REALITY 配对密钥；VLESS 额外启用 xtls-rprx-vision。",
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
    mux: "同版本两端推荐开启",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "私有低开销协议。吞吐优先部署推荐 raw + mux；大帧 wire 格式升级时需要两端版本一致。",
  },
  {
    name: "vless",
    credential: "UUID",
    interoperability: "Xray wire protocol",
    generatedSecurity: "raw + REALITY + Vision",
    mux: "生成器默认关闭",
    command: "tcptun config vless --server proxy.example.com --port 9443",
    description: "支持 TCP/UDP；生成配置使用 xtls-rprx-vision，并由双向 Xray REALITY 互操作测试覆盖。",
  },
  {
    name: "vmess",
    credential: "UUID",
    interoperability: "Xray VMess AEAD",
    generatedSecurity: "raw + REALITY",
    mux: "生成器默认关闭",
    command: "tcptun config vmess --server proxy.example.com --port 9443",
    description: "使用 VMess AEAD 与 security: none wire mode，支持 TCP/UDP 与 Xray 双向互操作测试。",
  },
  {
    name: "trojan",
    credential: "Password",
    interoperability: "Xray Trojan wire protocol",
    generatedSecurity: "raw + REALITY",
    mux: "生成器默认关闭",
    command: "tcptun config trojan --server proxy.example.com --port 9443",
    description: "标准 Trojan 认证与请求封装，支持 TCP/UDP；生成器创建相互匹配的 REALITY 配置。",
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
    title: "认证方式",
    body: "服务端 inbound 用 users[].id，客户端 outbound 用 token；两端字符串必须完全一致。",
  },
  {
    title: "吞吐优先",
    body: "生产吞吐优先推荐 native + raw + mux。TLS / REALITY / ws / h2 / h3 增加安全与部署灵活性，也带来额外开销。",
  },
  {
    title: "版本对齐",
    body: "Native mux 是私有 wire protocol，不兼容 Xray mux。大帧格式升级后两端需同版本；滚动升级时可先关 mux。",
  },
  {
    title: "生成配置对",
    body: "tcptun config native --server proxy.example.com --port 9443 一次生成匹配的 server.json、client.json 与 client.uri。",
  },
] as const;

export const nativeFieldGroups = [
  {
    name: "端点公共字段",
    fields: [
      { key: "tag", side: "两端", detail: "组件唯一标识，被 route / outbound 引用。" },
      { key: "type", side: "两端", detail: '固定为 "native"。' },
      { key: "network", side: "两端", detail: '可选 ["tcp"]、["udp"] 或 ["tcp","udp"]；默认按协议能力开启。' },
      { key: "transport", side: "两端", detail: "承载层：raw / ws / h2 / h3，以及 TLS 证书相关字段。" },
      { key: "security", side: "两端", detail: "可选 REALITY（仅 raw transport）；与 transport.tls 互斥。" },
      { key: "mux", side: "两端", detail: "内置多路复用与可选 quic 模式；池参数主要在客户端 outbound。" },
    ],
  },
  {
    name: "服务端 inbound",
    fields: [
      { key: "listen / port", side: "server", detail: "监听地址与端口，例如 0.0.0.0:9443。" },
      { key: "users[].id", side: "server", detail: "认证凭据；与客户端 token 对应。" },
      { key: "outbound", side: "server", detail: "该入口默认出口 tag，通常指向 direct 或下一跳。" },
      { key: "transport.cert/key", side: "server", detail: "开启 transport.tls 或 mux.mode=quic 时必需。" },
    ],
  },
  {
    name: "客户端 outbound",
    fields: [
      { key: "server / port", side: "client", detail: "远端 native 服务地址与端口。" },
      { key: "token", side: "client", detail: "必填；必须与服务端 users[].id 一致。" },
      { key: "transport.server_name", side: "client", detail: "TLS/QUIC 时用于 SNI 与证书校验。" },
      { key: "mux.max_sessions", side: "client", detail: "物理连接池上限，1–32；默认 4。仅 outbound。" },
      { key: "mux.max_streams_per_session", side: "client", detail: "每条物理连接 stream 软上限，1–4096；TCP mux 默认 16，QUIC 常用 128。" },
      { key: "mux.warm_spares", side: "client", detail: "后台预热空闲连接数，默认 0，且须 < max_sessions。" },
      { key: "mux.udp_mode", side: "client", detail: "仅 quic：reliable（默认）/ auto / datagram。" },
    ],
  },
] as const;

export const nativeMuxNotes = [
  {
    title: "默认 TCP mux",
    body: "mux.enabled 后，同一客户端 source 的 TCP 复用物理隧道连接池；OPEN 帧携带目标地址，目标不可达时不会提前向本地代理报告成功。",
  },
  {
    title: "失败与回退",
    body: "打开 stream 时若 session 失效会替换并重试；mux 持续不可用则回退到独立 native 隧道连接。拨号失败按 source 指数退避，避免重连风暴。",
  },
  {
    title: "QUIC 模式",
    body: 'mux.mode: "quic" 使用独立 UDP/QUIC 连接池，每条逻辑 TCP flow 对应一条 QUIC 双向 stream。要求 raw transport + TLS 1.3，ALPN 为 tcptun-native-quic/1。',
  },
  {
    title: "UDP over QUIC",
    body: "reliable：每 association 一条可靠 stream。auto：优先 DATAGRAM，未协商则回退。datagram：强制 DATAGRAM，不静默降级。",
  },
] as const;

export const nativeWorkflowCommands = [
  {
    name: "generate",
    title: "生成匹配配置对",
    command: "tcptun config native --server proxy.example.com --port 9443",
    body: "生成 server.json、client.json、client.uri；默认 raw，可再按需加 TLS/REALITY。",
  },
  {
    name: "check",
    title: "启动前校验",
    command: "tcptun config check --config server.json",
    body: "Load → Validate → Compile，不监听端口。改完 token / mux / transport 后先 check。",
  },
  {
    name: "run",
    title: "分别启动两端",
    command: "tcptun --config server.json\ntcptun --config client.json",
    body: "服务端先起 native inbound；客户端起 mixed 本地入口并连到 native outbound。",
  },
  {
    name: "uri",
    title: "从 URI 导入客户端",
    command: "tcptun uri import --input client.uri --client --output client.json",
    body: "支持 native://… URI，快速生成可运行的 mixed 客户端拓扑。",
  },
] as const;

export const configModelNotes = [
  {
    title: "顶层结构",
    body: "FileConfig = log + inbounds + outbounds + route + dns + discovery。未知字段会被严格拒绝。",
  },
  {
    title: "引用关系",
    body: "每个 inbound/outbound 有 tag。inbound.outbound 或 route.rules[].outbound / default_outbound 引用出口 tag。",
  },
  {
    title: "启动流水线",
    body: "Load → Validate → Compile → Start。校验涵盖协议认证、TCP/UDP capability、TLS/REALITY、mux 约束。",
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
    title: "仅 raw transport",
    body: "security.type 为 reality 时，transport.type 必须是 raw（可省略，默认 raw）。不能与 ws / h2 / h3 组合。",
  },
  {
    title: "不能叠 transport.tls",
    body: "REALITY 与 transport.tls 互斥。需要 TLS 1.3 证书场景请用普通 TLS；QUIC mux 也要求 TLS，因此不能与 REALITY 同开。",
  },
  {
    title: "适用协议",
    body: "native / vless / vmess / trojan 隧道端点可用。mixed、socks5 本地入口不支持 REALITY。",
  },
  {
    title: "密钥成对",
    body: "服务端 private_key 与客户端 public_key 必须是同一对 X25519 密钥。short_id(s) 两端一致；生成器会自动配对。",
  },
] as const;

export const realityFieldGroups = [
  {
    name: "服务端 security",
    fields: [
      { key: "type", detail: '固定 "reality"。' },
      { key: "private_key", detail: "X25519 私钥，base64url（无 padding）。生成器自动写入。" },
      { key: "server_names", detail: "允许的 SNI 列表，至少一项；需与伪装站点一致。" },
      { key: "short_ids", detail: "允许的 short id 列表（hex）。客户端 short_id 必须命中其一。" },
      { key: "dest", detail: "回落/伪装目标，host:port，例如 example.com:443。" },
      { key: "max_time_diff", detail: "可选时钟偏差上限，生成器默认 30s。" },
    ],
  },
  {
    name: "客户端 security",
    fields: [
      { key: "type", detail: '固定 "reality"。' },
      { key: "public_key", detail: "对应服务端私钥的公钥。" },
      { key: "server_name", detail: "SNI / 握手用名称，通常落在服务端 server_names 中。" },
      { key: "short_id", detail: "单个 short id，必须存在于服务端 short_ids。" },
      { key: "fingerprint", detail: "uTLS 指纹，生成器默认 chrome。" },
      { key: "spider_x", detail: "可选路径，生成器默认 /。" },
    ],
  },
] as const;

export const realityCommands = [
  {
    title: "生成匹配 REALITY 配置对",
    command:
      "tcptun config vless --server proxy.example.com --port 443 --server-name example.com --dest example.com:443",
    body: "四种隧道协议都支持该子命令形态。默认输出 server.json、client.json、client.uri，含新密钥与凭据。",
  },
  {
    title: "native + REALITY",
    command:
      "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
    body: "私有协议同样可挂 REALITY。生成器默认关闭 mux，便于与安全层组合；需要吞吐时两端同版本再开 mux。",
  },
  {
    title: "校验后再启动",
    command: "tcptun config check --config server.json && tcptun --config server.json",
    body: "REALITY 字段、密钥格式、dest、short id 都在 Validate 阶段检查，避免监听后再失败。",
  },
] as const;

export const protocolComparison = [
  {
    name: "native",
    credential: "token ↔ users[].id",
    interop: "仅 tcptun ↔ tcptun",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "私有 mux；同版本推荐。生成器配 REALITY 时默认关",
    bestFor: "吞吐优先、两端都是 tcptun",
    generator: "tcptun config native --server … --port …",
  },
  {
    name: "vless",
    credential: "uuid ↔ users[].id",
    interop: "Xray VLESS wire",
    securityDefault: "raw + REALITY + Vision",
    vision: "flow: xtls-rprx-vision（要求 raw + REALITY）",
    muxNote: "Xray 兼容 mux；生成器默认关",
    bestFor: "与 Xray 生态互操作，伪装站点场景",
    generator: "tcptun config vless --server … --port …",
  },
  {
    name: "vmess",
    credential: "uuid ↔ users[].id",
    interop: "Xray VMess AEAD",
    securityDefault: "raw + REALITY",
    vision: "—（AEAD + security: none wire）",
    muxNote: "Xray 兼容 mux；生成器默认关",
    bestFor: "既有 VMess 客户端/服务端对接",
    generator: "tcptun config vmess --server … --port …",
  },
  {
    name: "trojan",
    credential: "password ↔ users[].password",
    interop: "Xray Trojan wire",
    securityDefault: "raw + REALITY",
    vision: "—",
    muxNote: "可开 mux；生成器默认关",
    bestFor: "密码认证、Trojan 生态",
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
