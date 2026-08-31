import type { Locale } from "./config";

export type ExampleCopy = {
  title: string;
  summary: string;
  when: string;
  steps: string[];
};

const en: Record<string, ExampleCopy> = {
  "native-reality": {
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
  },
  "native-basic": {
    title: "Basic raw + mux",
    summary: "Lowest-friction tcptun-to-tcptun tunnel. Token auth, no camouflage layer.",
    when: "Both ends are trusted or already on a private path; you mainly need throughput.",
    steps: [
      "Generate with tcptun config native.",
      "Match users[].id and token.",
      "Start server, then client; use 127.0.0.1:1080.",
    ],
  },
  "native-reality-tcp": {
    title: "Reality TCP only",
    summary: "security.type=reality + carrier.mode=tcp. No QUIC fallback.",
    when: "Paths that drop UDP/QUIC but still allow TCP Reality.",
    steps: [
      "Keep security.type=reality and set carrier.mode=tcp on both ends.",
      "Keep transport raw and mux.enabled if you want mux pooling.",
      "Do not expect QUIC preference or dual-carrier probing.",
    ],
  },
  "native-quic": {
    title: "Reality QUIC only",
    summary: "security.type=reality + carrier.mode=quic. Dedicated QUIC pool, no TCP fallback.",
    when: "You want forced QUIC streams/DATAGRAMs without managing TLS certificates.",
    steps: [
      "Generate with --quic (emits carrier.mode=quic + mux.enabled).",
      "Open UDP on the listen port end-to-end.",
      "Keep security.type=reality; do not revive legacy reality-quic aliases in new configs.",
    ],
  },
  "native-resumable": {
    title: "Resumable carrier.mode=auto",
    summary: "carrier.mode=auto plus mux.resume for eligible TCP logical streams.",
    when: "Long-lived TCP flows should survive a physical carrier replacement on one server process.",
    steps: [
      "Use v0.3.0+ on both ends and keep one unique server address.",
      "Start from carrier.mode=auto, then enable mux.resume with matching timeout/buffer.",
      "Keep resume off during rolling upgrades until both peers are upgraded.",
    ],
  },
  "native-tls-fallback": {
    title: "TLS passthrough fallback",
    summary: "Native TCP inbound with tls_passthrough fallback for unmatched handshakes on :443.",
    when: "You share a public 443 listener and want non-tcptun clients forwarded to a real TLS site.",
    steps: [
      "Set fallback.type=tls_passthrough with dest and server_names.",
      "Use carrier.mode=tcp on this pattern; replace the token before exposing :443.",
      "Validate with config check, then confirm fallback SNI reaches the real site.",
    ],
  },
  "native-reverse": {
    title: "Reverse publish (TCP)",
    summary: "Expose a NAT-side TCP service on the edge with publish/expose.",
    when: "The real service sits behind the client; the VPS should accept public traffic.",
    steps: [
      "Enable mux on both ends.",
      "Match service names on publish and expose.",
      "Dial the server publish address externally.",
    ],
  },
  "native-reverse-udp": {
    title: "Reverse publish (UDP)",
    summary: "Publish a UDP service (for example DNS) from behind NAT onto the edge.",
    when: "You need UDP reverse publish with matching service + network=udp.",
    steps: [
      "Set network=udp on tunnel, publish, and expose.",
      "Match service names; point expose.target at the private UDP listener.",
      "Dial the server publish UDP address externally.",
    ],
  },
  "native-multi-address": {
    title: "Multi-address race",
    summary: "One outbound with several host:port candidates racing handshakes for the same logical service.",
    when: "Anycast/DNS or dual-homed edges share credentials and should compete, not load-balance as separate nodes.",
    steps: [
      "List multiple addresses on one native outbound.",
      "Keep identical token, transport, security, and carrier for every candidate.",
      "Use balance members instead when nodes are independent services.",
    ],
  },
  "balance-failover": {
    title: "Balance · weighted edges",
    summary: "Independent native edges under a balance outbound with weights and affinity.",
    when: "You operate more than one complete proxy service and want weighted selection / failover.",
    steps: [
      "Declare each edge as its own native outbound.",
      "Group them under type=balance with weights and affinity_ttl.",
      "Route default_outbound to the balance tag.",
    ],
  },
  "route-split": {
    title: "Route split + blackhole",
    summary: "Block ad suffixes, send RFC1918 prefixes direct, default everything else through native REALITY with carrier.mode=auto.",
    when: "You need domain/IP based routing without a second client process.",
    steps: [
      "Keep proxy, direct, and optional blackhole outbounds.",
      "Order rules carefully; first match wins.",
      "Validate with config check before starting.",
    ],
  },
  "native-chain": {
    title: "Outbound via chain",
    summary: "Reach a native edge through a lower SOCKS5 hop using via.",
    when: "The path to the public edge must first exit through a local or LAN proxy.",
    steps: [
      "Declare the lower hop as its own outbound (socks5/http/…).",
      "Set via on the native outbound to that hop tag.",
      "URI export cannot represent chains — keep the full JSON.",
    ],
  },
  "native-relay": {
    title: "Native relay hop",
    summary: "Accept native on one side and forward through another native outbound.",
    when: "You need an intermediate relay that does not terminate the final exit itself.",
    steps: [
      "Use distinct inbound and outbound credentials.",
      "Route default_outbound to the next native hop.",
      "Start the far exit first, then the relay, then clients.",
    ],
  },
};

const zh: Record<string, ExampleCopy> = {
  "native-reality": {
    title: "REALITY · carrier.mode=auto（推荐）",
    summary:
      "v0.4.2 默认：native + raw + mux + security.type=reality + carrier.mode=auto。同一地址上的 TCP 与 QUIC；出站 carrier.prefer 默认为 adaptive。",
    when: "两端都运行 tcptun v0.4.2，希望自动双载体，且不想管证书或第二个端口。",
    steps: [
      "生成时指定 --server-name 和 --dest（伪装站点需支持 HTTPS 与 HTTP/3）。",
      "确保 mux.enabled 与 carrier.mode=auto，以启用自动载体。",
      "配对 private_key / public_key 与 short id；在监听端口同时放行 TCP 和 UDP。",
      "可选：两端设置 mux.resume=true，以恢复符合条件的 TCP 流。",
    ],
  },
  "native-basic": {
    title: "基础 raw + mux",
    summary: "最简 tcptun 互连隧道。token 认证，无伪装层。",
    when: "两端可信，或已在私有路径上，主要需要吞吐。",
    steps: [
      "用 tcptun config native 生成。",
      "匹配 users[].id 与 token。",
      "先启动服务端再启动客户端；应用使用 127.0.0.1:1080。",
    ],
  },
  "native-reality-tcp": {
    title: "仅 Reality TCP",
    summary: "security.type=reality + carrier.mode=tcp。无 QUIC 回退。",
    when: "路径会丢掉 UDP/QUIC，但仍允许 TCP Reality。",
    steps: [
      "两端保持 security.type=reality，并设置 carrier.mode=tcp。",
      "需要 mux 池时保持 transport raw 并启用 mux.enabled。",
      "不要期望 QUIC 偏好或双载体探测。",
    ],
  },
  "native-quic": {
    title: "仅 Reality QUIC",
    summary: "security.type=reality + carrier.mode=quic。专用 QUIC 池，无 TCP 回退。",
    when: "希望强制 QUIC 流/DATAGRAM，且不想管理 TLS 证书。",
    steps: [
      "用 --quic 生成（写出 carrier.mode=quic + mux.enabled）。",
      "端到端打通监听端口的 UDP。",
      "保持 security.type=reality；新配置不要再写旧的 reality-quic 别名。",
    ],
  },
  "native-resumable": {
    title: "可恢复 carrier.mode=auto",
    summary: "carrier.mode=auto 加上 mux.resume，用于符合条件的 TCP 逻辑流。",
    when: "长生命周期 TCP 流需要在同一服务进程上扛住物理载体替换。",
    steps: [
      "两端使用 v0.3.0+，并保持唯一的服务端地址。",
      "从 carrier.mode=auto 起步，再启用匹配超时/缓冲的 mux.resume。",
      "滚动升级期间先关闭 resume，直到两端都升级完成。",
    ],
  },
  "native-tls-fallback": {
    title: "TLS 透传 fallback",
    summary: "native TCP 入站对未匹配握手使用 tls_passthrough fallback，适合 :443。",
    when: "与真实 TLS 站点共用公网 443，希望把非 tcptun 客户端转走。",
    steps: [
      "设置 fallback.type=tls_passthrough，并填写 dest 与 server_names。",
      "此模式用 carrier.mode=tcp；对外暴露 :443 前请替换 token。",
      "先 config check，再确认 fallback SNI 能到达真实站点。",
    ],
  },
  "native-reverse": {
    title: "反向发布（TCP）",
    summary: "用 publish/expose 把 NAT 侧 TCP 服务暴露到边缘。",
    when: "真实服务在客户端后面，VPS 需要接受公网流量。",
    steps: [
      "两端启用 mux。",
      "publish 与 expose 使用相同服务名。",
      "从外部拨打服务端 publish 地址。",
    ],
  },
  "native-reverse-udp": {
    title: "反向发布（UDP）",
    summary: "把 NAT 后的 UDP 服务（例如 DNS）发布到边缘。",
    when: "需要 UDP 反向发布，且 service 与 network=udp 匹配。",
    steps: [
      "在隧道、publish、expose 上都设置 network=udp。",
      "服务名必须一致；expose.target 指向私有 UDP 监听。",
      "从外部拨打服务端 publish 的 UDP 地址。",
    ],
  },
  "native-multi-address": {
    title: "多地址竞速",
    summary: "一个出站上多个 host:port 候选，为同一逻辑服务竞速握手。",
    when: "Anycast/DNS 或双归属边缘共享凭证，应当竞速而不是当成独立节点做负载均衡。",
    steps: [
      "在同一个 native 出站上列出多个地址。",
      "每个候选保持相同的 token、传输、安全与载体。",
      "节点是独立服务时，改用 balance 成员。",
    ],
  },
  "balance-failover": {
    title: "Balance · 加权边缘",
    summary: "多个独立 native 边缘放进带权重和亲和性的 balance 出站。",
    when: "你运营不止一套完整代理服务，需要加权选择 / 故障切换。",
    steps: [
      "把每个边缘写成独立 native 出站。",
      "用 type=balance 组合，并设置 weights 与 affinity_ttl。",
      "把 default_outbound 指到 balance 标签。",
    ],
  },
  "route-split": {
    title: "路由分流 + blackhole",
    summary: "广告后缀走 blackhole，RFC1918 前缀走 direct，其余默认走 native REALITY 且 carrier.mode=auto。",
    when: "需要按域名/IP 分流，但不想再跑第二个客户端进程。",
    steps: [
      "保留 proxy、direct，以及可选的 blackhole 出站。",
      "仔细排列规则顺序；先匹配先生效。",
      "启动前先 config check。",
    ],
  },
  "native-chain": {
    title: "出站 via chain",
    summary: "通过下层 SOCKS5 跳（via）到达 native 边缘。",
    when: "到公网边缘的路径必须先经过本地或局域网代理。",
    steps: [
      "把下层跳写成独立出站（socks5/http/…）。",
      "在 native 出站上设置 via 指向该跳的标签。",
      "URI 导出无法表示 chain — 请保留完整 JSON。",
    ],
  },
  "native-relay": {
    title: "native 中继跳",
    summary: "一侧接受 native，再转发到另一个 native 出站。",
    when: "需要中间中继，但不由它终结最终出口。",
    steps: [
      "入站与出站使用不同凭证。",
      "把 default_outbound 指到下一跳 native。",
      "先启动远端出口，再启动中继，最后启动客户端。",
    ],
  },
};

const copies: Record<Locale, Record<string, ExampleCopy>> = { en, zh };

export function exampleCopy(locale: Locale, id: string): ExampleCopy | undefined {
  return copies[locale]?.[id] ?? copies.en[id];
}
