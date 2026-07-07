import Image from "next/image";
import ConfigTools from "./config-tools";
import ThemeToggle from "./theme-toggle";

const features = [
  {
    title: "Mixed 本地代理",
    body: "一个本地监听同时接收 SOCKS5、SOCKS5 UDP ASSOCIATE、HTTP proxy 和 HTTP CONNECT，SOCKS5 入口可设置用户名和密码。",
  },
  {
    title: "Client / Server 隧道",
    body: "通过 tcptun client 和 tcptun server 形成稳定转发链路，服务端只连接公网目标，客户端保留本地 mixed 代理体验。",
  },
  {
    title: "默认隧道多路复用",
    body: "client/server 默认复用一条 tunnel transport 连接，多条 TCP 连接和 UDP relay 通过逻辑 stream 共享上游链路。",
  },
  {
    title: "TCP 与 UDP relay",
    body: "所有隧道协议都支持 TCP 和 SOCKS5 UDP relay。native 使用内置 mux，VLESS/VMess 兼容 mux.cool，Trojan 可在 tcptun 两端启用私有 mux。",
  },
  {
    title: "Xray 兼容协议",
    body: "支持 native、VLESS、VMess AEAD 和 Trojan。VLESS/VMess 使用 UUID token，Trojan 使用 password，便于迁移常见 Xray 部署。",
  },
  {
    title: "多承载层与安全层",
    body: "隧道可运行在 raw TCP、WebSocket、HTTP/2 或 HTTP/3 上；raw 可叠加 TLS 或 REALITY，VLESS 可启用 xtls-rprx-vision。",
  },
  {
    title: "路由与学习",
    body: "私有网段、localhost、.local 默认直连；直连失败目标会写回 route.json，也可按域名、正则、后缀、IP、CIDR 或范围强制走上游。",
  },
  {
    title: "分享 URI 直接启动",
    body: "client、server、local 都能接收 URI 作为位置参数；client 支持 tcptun://、vless://、vmess:// 和 trojan:// 分享链接。",
  },
  {
    title: "Android bridge",
    body: "gomobile AAR 保持 Kotlin 反射路径兼容，并新增主动状态回调，能上报 starting、running、degraded、reconnecting、error 等状态。",
  },
  {
    title: "v0.1.3 热路径优化",
    body: "优化 mixed SOCKS5、直连探测和 native REALITY 热路径，减少 native REALITY 指纹处理开销，降低高频代理场景下的额外成本。",
  },
];

const modes = [
  {
    name: "local",
    title: "本地 mixed 转发",
    command:
      "tcptun local --listen 127.0.0.1:1080 --gateway-port 7890\n# alias: tcptun l",
    body: "自动发现网关代理，支持 SOCKS5 或 mixed 上游，也可给本地 SOCKS5 入口和上游 SOCKS5 配置认证。",
  },
  {
    name: "client",
    title: "本地隧道客户端",
    command:
      "tcptun client --config client.json\ntcptun client 'vless://...'",
    body: "打开本机 mixed 代理端口，把 TCP 和 SOCKS5 UDP relay 发送到远端 tcptun server 或兼容 Xray 入站。",
  },
  {
    name: "server",
    title: "公网隧道服务端",
    command: "tcptun server --config server.json\n# alias: tcptun s",
    body: "监听公网端口，接收 client 隧道请求，再根据目标地址发起出站连接；出站会拒绝私有、保留和 CGNAT 网段。",
  },
  {
    name: "config",
    title: "配置与分享",
    command:
      "tcptun config vless\ntcptun config uri client.json --name proxy.example.com",
    body: "交互式或非交互式生成 server.json、client.json、route.json，也能输出 tcptun、vless、vmess 或 trojan 分享 URI。",
  },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="tcptun 首页">
          <Image
            className="brand-logo"
            src="/tcptun-logo.png"
            alt=""
            width={38}
            height={38}
            aria-hidden="true"
            priority
          />
          <span>tcptun-go</span>
        </a>
        <div className="topbar-actions">
          <nav className="nav" aria-label="主要导航">
            <a href="#features">功能</a>
            <a href="#guide">教程</a>
            <a href="#tools">工具</a>
            <a href="#converter">转换</a>
            <a href="#install">安装</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="hero-lockup">
            <Image className="hero-logo" src="/tcptun-logo.png" alt="" width={72} height={72} priority />
            <p className="eyebrow">v0.1.3 · Go TCP tunnel and mixed proxy</p>
          </div>
          <h1>tcptun-go</h1>
          <p className="lede">
            面向现代代理部署的轻量 TCP 隧道与 mixed 代理。一个 Go 二进制即可提供本地 SOCKS5/HTTP
            入口、TCP/UDP client-server 隧道、默认多路复用、VLESS/VMess/Trojan 兼容模式，以及 REALITY/Vision
            配置能力。v0.1.3 重点优化 mixed SOCKS5、直连探测和 native REALITY 热路径。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#generator">
              生成配置
            </a>
            <a className="button secondary" href="#converter">
              转换 Xray 配置
            </a>
            <a className="button ghost" href="#install">
              安装 tcptun
            </a>
          </div>
        </div>
        <div className="terminal" aria-label="tcptun 命令预览">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
          </div>
          <pre>
            <code>{`$ pnpm add -g tcptun
# or: npm install -g tcptun

$ tcptun server \\
  --listen 0.0.0.0:9443 \\
  --tunnel-protocol native \\
  --transport raw \\
  --token change-me

$ tcptun client \\
  --listen 127.0.0.1:1080 \\
  --server-addr proxy.example.com:9443 \\
  --tunnel-protocol native \\
  --transport raw \\
  --token change-me`}</code>
          </pre>
        </div>
      </section>

      <section className="section feature-section" id="features">
        <div className="section-heading">
          <p className="eyebrow">核心能力</p>
          <h2>一个二进制覆盖本地代理、隧道转发和 Xray 兼容部署。</h2>
          <p>
            tcptun-go 的目标是把常见代理入口和 TCP 隧道收敛成简单可部署的组件，既能跑在笔记本上，也能放进 VPS、
            Android bridge、nginx 反向代理或 HTTP/CDN 基础设施后面。
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section" id="deploy">
        <div>
          <p className="eyebrow">部署路径</p>
          <h2>从配置文件开始，而不是从一长串命令开始。</h2>
          <p>
            先通过 npm 包安装 `tcptun`，再生成 `server.json`、`client.json` 和 `route.json`。
            把服务端配置放到 VPS，本地保留客户端配置；之后升级协议、承载层、mux、SOCKS5 认证或 REALITY 参数时，只需要改 JSON。
          </p>
        </div>
        <div className="code-panel">
          <pre>
            <code>{`pnpm add -g tcptun
# or: npm install -g tcptun

tcptun config --protocol native \\
  --transport raw \\
  --server-addr proxy.example.com:9443

tcptun server --config server.json
tcptun client --config client.json`}</code>
          </pre>
        </div>
      </section>

      <section className="section guide-section" id="guide">
        <div className="section-heading">
          <p className="eyebrow">使用教程</p>
          <h2>四个命令跑通从服务器到本地端口。</h2>
          <p>
            下面是最小闭环。需要 nginx/CDN 时，把承载层改成 `ws` 并设置 tunnel_path；需要 HTTP/2 或 HTTP/3
            时选择 `h2` 或 `h3`；需要 REALITY/Vision 时使用 raw。
          </p>
        </div>
        <div className="mode-grid">
          {modes.map((mode) => (
            <article key={mode.name}>
              <span>{mode.name}</span>
              <h3>{mode.title}</h3>
              <p>{mode.body}</p>
              <pre>
                <code>{mode.command}</code>
              </pre>
            </article>
          ))}
        </div>
        <div className="notes-grid">
          <article>
            <h3>VLESS REALITY / Vision</h3>
            <p>
              `tunnel_security` 设置为 `reality`，承载层保持 `raw`。兼容 Vision 时协议选 `vless`，并设置
              `tunnel_flow` 为 `xtls-rprx-vision`。服务端需要 private key、server names、dest；客户端需要
              public key、server name、fingerprint 和 short id。
            </p>
          </article>
          <article>
            <h3>URI 和多路复用</h3>
            <p>
              `tcptun client` 可直接读取分享 URI；`tcptun server` 和 `tcptun local` 也支持 `tcptun://` URI。
              client/server 默认启用 `tunnel_mux`，降低 WebSocket、HTTP/2、HTTP/3 部署中的重复握手开销。
            </p>
          </article>
          <article>
            <h3>放在 nginx 后面</h3>
            <p>
              使用 `ws` 承载层，把 tcptun server 监听在 `127.0.0.1:9443`，nginx 将 `/tcptun` 这类路径反代到本地端口。
              客户端连接公开域名和 443 端口，并启用 TLS server name。
            </p>
          </article>
          <article>
            <h3>HTTP/3 与转换边界</h3>
            <p>
              tcptun 的 `h3` 是基于 QUIC 的 HTTP/3，服务端需要 TLS 证书，客户端固定走 https。
              Xray/V2Ray 转换器不会把 Xray QUIC 直接映射为 tcptun HTTP/3。
            </p>
          </article>
        </div>
      </section>

      <ConfigTools />

      <section className="section download-section" id="install">
        <div>
          <p className="eyebrow">安装</p>
          <h2>通过 npm 包安装 tcptun v0.1.3。</h2>
          <p>推荐使用 pnpm 或 npm 全局安装命令行程序；npm 页面提供当前发布版本和包信息。</p>
          <pre className="install-code">
            <code>{`pnpm add -g tcptun
# or
npm install -g tcptun`}</code>
          </pre>
        </div>
        <div className="download-actions">
          <a className="button primary" href="https://www.npmjs.com/package/tcptun">
            打开 npm 包
          </a>
          <a className="button secondary" href="#generator">
            生成配置
          </a>
        </div>
      </section>

      <footer className="footer">
        <span>tcptun-go</span>
        <a href="https://www.npmjs.com/package/tcptun">npmjs.com/package/tcptun</a>
      </footer>
    </main>
  );
}
