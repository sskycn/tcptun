export const releaseVersion = "0.2.1";

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
    question: "能直接使用 Xray 配置文件吗？",
    answer: "不能。tcptun 使用自己的 JSON 拓扑。与 Xray 兼容的是 VLESS / VMess / Trojan 等线路协议。",
  },
  {
    question: "如何校验配置？",
    answer: "运行 tcptun config check --config config.json。会完成校验与编译，但不监听端口。",
  },
  {
    question: "一键安装装到哪里？如何固定版本？",
    answer:
      "默认安装到 /usr/local/bin。用 TCPTUN_INSTALL_DIR 改目录，用 TCPTUN_VERSION 固定版本（从 tcptun.com/releases 下载）。",
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
    answer:
      "短连接多、两端同版本时建议配置 mux: {}。原生 QUIC 仅支持 native + raw + security.type=tls；UDP 可选可靠 stream 或 DATAGRAM，支持分片、选择性恢复与自适应 FEC。",
  },
  {
    question: "REALITY 能和 TLS 一起用吗？",
    answer: "不能。REALITY 仅配合 raw，且不能与 security.type=tls 并用。",
  },
  {
    question: "address 字段怎么写？",
    answer:
      "inbound / outbound 的 address 都是 host:port 字符串数组。多地址表示同一逻辑服务的候选入口，首次连接会错峰竞争握手，不是 balance 负载均衡。",
  },
  {
    question: "什么是反向发布？",
    answer:
      "native + raw + mux（group 或 QUIC）支持把 NAT 后的 TCP/UDP 服务发布到服务端：服务端配置 publish，客户端配置 expose，两端 service 名一致。",
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
      "在「转换」中粘贴 Xray JSON 或 vless/vmess/trojan 链接。支持 REALITY/TLS 与 raw/ws/h2/h3；gRPC 等不支持的传输会提示警告。",
  },
  {
    question: "无配置文件时会怎样启动？",
    answer:
      "tcptun 会先预留 127.0.0.1:1080，再扫描私有 IPv4 局域网中可用的 SOCKS5:1080；首次握手成功后启动 mixed 代理。--retry 可在保留监听的同时持续重试。",
  },
  {
    question: "如何在多个出口间负载与切换？",
    answer:
      "使用 balance outbound 组合成员并设置权重与 affinity_ttl。同一 outbound 的多 address 只是候选入口竞速，不是负载均衡。嵌入式 Runtime 和 Android bridge 还支持启停、探测及原子切换已声明的 outbound。",
  },
] as const;

export const binaryDownloads = [
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 15061776),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 13940850),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 14672034),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 13500578),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 13893794),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 15101952),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 13692416),
] as const;

export const inboundTypes = ["mixed", "socks5", "native", "vless", "vmess", "trojan"] as const;
export const outboundTypes = [
  "direct",
  "direct-first",
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
    generatedSecurity: "raw + REALITY",
    mux: "推荐同版本开启",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "私有低开销协议。吞吐优先用 raw + mux；需要 UDP/QUIC 连接池时显式选择 quic mode。支持反向 publish/expose。",
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

/** Native + QUIC mux mode (TLS 1.3 required on both ends). */
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
        "type": "tls",
        "server_name": "proxy.example.com"
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
        "type": "tls",
        "cert": "server.crt",
        "key": "server.key"
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
    title: "认证",
    body: "服务端 users[].id 与客户端 token 必须一致。",
  },
  {
    title: "地址",
    body: "address 为 host:port 数组。多地址是同一服务的候选入口竞速，不是 balance。",
  },
  {
    title: "吞吐",
    body: "优先 native + raw + mux。TLS / REALITY / ws / h2 / h3 更灵活，但开销更高。",
  },
  {
    title: "反向发布",
    body: "服务端 publish + 客户端 expose，可把 NAT 后的 TCP/UDP 服务挂到边缘监听端口。",
  },
  {
    title: "版本",
    body: "mux 为私有协议，两端需同版本；滚动升级时可先去掉 mux 字段。",
  },
  {
    title: "生成",
    body: "tcptun config native 生成配对的 server / client 配置；URI 由 tcptun uri export 单独导出。",
  },
] as const;

export const nativeFieldGroups = [
  {
    name: "公共字段",
    fields: [
      { key: "tag", side: "两端", detail: "唯一标识，供路由引用。" },
      { key: "type", side: "两端", detail: '"native"。' },
      { key: "address", side: "两端", detail: "host:port 字符串数组；outbound 可配置多候选入口。" },
      { key: "network", side: "两端", detail: "tcp / udp，可组合。" },
      { key: "transport", side: "两端", detail: "仅 type / path（raw / ws / h2 / h3）。" },
      { key: "security", side: "两端", detail: "tls 或 reality；证书、SNI、insecure 都写在这里。" },
      { key: "mux", side: "两端", detail: "出现即开启；{} 表示默认参数。连接池参数主要在客户端。" },
    ],
  },
  {
    name: "服务端",
    fields: [
      { key: "address", side: "server", detail: "监听地址列表，如 [\"0.0.0.0:9443\"]。" },
      { key: "users[].id", side: "server", detail: "认证凭据，对应客户端 token。" },
      { key: "publish", side: "server", detail: "反向发布：service + address，可选 network=tcp|udp。" },
      { key: "security.cert/key", side: "server", detail: "TLS 或 QUIC 模式时必填。" },
    ],
  },
  {
    name: "客户端",
    fields: [
      { key: "address", side: "client", detail: "远端入口，可写多个候选 host:port。" },
      { key: "token", side: "client", detail: "必填，对应服务端 users[].id。" },
      { key: "security.server_name", side: "client", detail: "TLS/QUIC 的 SNI。" },
      { key: "expose", side: "client", detail: "反向发布：service + target，可选 network=tcp|udp。" },
      { key: "mux.max_sessions", side: "client", detail: "连接池上限，1–32，默认 4。" },
      { key: "mux.max_streams_per_session", side: "client", detail: "单连接 stream 上限，1–4096。" },
      { key: "mux.warm_spares", side: "client", detail: "预热空闲连接数，须小于 max_sessions。" },
      { key: "mux.udp_mode", side: "client", detail: "quic 专用：reliable / auto / datagram。" },
      { key: "mux.*_receive_window", side: "两端", detail: "QUIC 接收窗口；stream 最大 16 MiB，connection 最大 64 MiB。" },
    ],
  },
] as const;

export const nativeMuxNotes = [
  {
    title: "开启方式",
    body: "配置 mux 对象即开启（常用 \"mux\": {}）。不要再写 enabled；省略 mux 字段即关闭。",
  },
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
    body: 'mux.mode: "quic" 使用带健康评分与路径探测的 UDP/QUIC 连接池，要求 native + raw + security.type=tls。',
  },
  {
    title: "UDP",
    body: "reliable 走 stream；auto 优先 DATAGRAM 并可回退；datagram 不降级。DATAGRAM 支持分片、恢复与自适应 FEC。",
  },
] as const;

export const reversePublishNotes = [
  {
    title: "协议范围",
    body: "仅 native + raw，且必须开启 group mux 或 QUIC mux。VLESS / VMess / Trojan 会在校验阶段被拒绝。",
  },
  {
    title: "配对规则",
    body: "服务端 publish 与客户端 expose 的 service 名必须一致，network 也必须匹配（默认 tcp）。",
  },
  {
    title: "安全边界",
    body: "客户端本地 target 不下发到服务端；服务端只能打通白名单内的 service。",
  },
  {
    title: "QUIC 要求",
    body: "QUIC 反向发布两端都要 security.type=tls；服务端还需 cert/key。",
  },
] as const;

export const nativeWorkflowCommands = [
  {
    name: "generate",
    title: "生成配置对",
    command: "tcptun config native --server proxy.example.com --port 9443",
    body: "输出 server.json 与 client.json。",
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
    title: "导出 URI",
    command: "tcptun uri export --config client.json --output client.uri",
    body: "从 tunnel outbound 导出 URI；多 address 会导出多条。",
  },
] as const;

export const configModelNotes = [
  {
    title: "结构",
    body: "顶层仅含 log、inbounds、outbounds、route、dns。未知字段会被拒绝。",
  },
  {
    title: "地址",
    body: "inbound.address 与 outbound.address 均为 host:port 数组。多地址是候选入口竞速，独立节点请用 balance。",
  },
  {
    title: "引用",
    body: "组件通过 tag 关联；via、direct-first 与 balance 的依赖会检查缺失和循环。",
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
    title: "仅 raw",
    body: "transport 必须是 raw，不能与 ws / h2 / h3 组合。",
  },
  {
    title: "不叠 TLS",
    body: "不能设置 security.type=tls。需要证书 TLS 或 QUIC 时，不要使用 REALITY。",
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
    body: "输出配对的 server.json 与 client.json；需要 URI 时再执行 tcptun uri export。",
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
    bestFor: "吞吐 / 反向发布",
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
