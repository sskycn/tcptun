import Image from "next/image";
import ConfigTools from "./config-tools";
import ThemeToggle from "./theme-toggle";

const features = [
  {
    title: "Mixed 本地代理",
    body: "一个本地监听同时接收 SOCKS5、SOCKS5 UDP ASSOCIATE、HTTP proxy 和 HTTP CONNECT，适合浏览器、CLI 与桌面应用共用。",
  },
  {
    title: "Client / Server 隧道",
    body: "通过 tcptun client 和 tcptun server 形成稳定转发链路，服务端只连接公网目标，客户端保留本地代理体验。",
  },
  {
    title: "多协议兼容",
    body: "native 覆盖能力最完整；VLESS、VMess、Trojan 适合与 Xray 生态配置迁移或保持协议习惯。",
  },
  {
    title: "多承载层",
    body: "支持 raw TCP、WebSocket、HTTP/2、HTTP/3。WebSocket 便于放在 nginx 或 CDN 后，raw 更直接。",
  },
  {
    title: "REALITY / Vision",
    body: "VLESS over raw 可配置 REALITY 与 xtls-rprx-vision；native 也可以使用 REALITY 作为安全层。",
  },
  {
    title: "路由与学习",
    body: "默认私有网段、localhost、.local 直连；失败目标会被记忆，也可用 route.json 强制走上游。",
  },
];

const modes = [
  {
    name: "local",
    title: "本地 mixed 转发",
    command: "tcptun local --listen 127.0.0.1:1080 --gateway-port 7890",
    body: "自动发现网关代理，或者显式指定 gateway-ip、gateway-port 和 upstream-protocol。",
  },
  {
    name: "client",
    title: "本地隧道客户端",
    command:
      "tcptun client --config client.json\ncurl -x socks5h://127.0.0.1:1080 https://ifconfig.me",
    body: "打开本机 mixed 代理端口，把访问请求发送到远端 tcptun server 或兼容 Xray 入站。",
  },
  {
    name: "server",
    title: "公网隧道服务端",
    command: "tcptun server --config server.json",
    body: "监听公网端口，接收 client 隧道请求，再根据目标地址发起出站连接。",
  },
  {
    name: "config",
    title: "配置与分享",
    command: "tcptun config\ntcptun config uri client.json --name proxy.example.com",
    body: "交互式生成配置，也能从 client.json 输出 tcptun、vless、vmess 或 trojan 分享 URI。",
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
            <p className="eyebrow">Go TCP tunnel and mixed proxy</p>
          </div>
          <h1>tcptun-go</h1>
          <p className="lede">
            面向现代代理部署的轻量 TCP 隧道与 mixed 代理。一个 Go 二进制即可提供本地 SOCKS5/HTTP
            入口、client-server 隧道、VLESS/VMess/Trojan 兼容模式，以及 REALITY/Vision 配置能力。
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
            Android bridge 或反向代理后面。
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
            把服务端配置放到 VPS，本地保留客户端配置；之后升级协议、承载层或 REALITY 参数时，只需要改 JSON。
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
          <p>下面是最小闭环。需要 nginx/CDN 时，把承载层改成 `ws` 并设置 tunnel_path；需要 REALITY 时使用 raw。</p>
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
            <h3>放在 nginx 后面</h3>
            <p>
              使用 `ws` 承载层，把 tcptun server 监听在 `127.0.0.1:9443`，nginx 将 `/tcptun` 这类路径反代到本地端口。
              客户端连接公开域名和 443 端口，并启用 TLS server name。
            </p>
          </article>
        </div>
      </section>

      <ConfigTools />

      <section className="section download-section" id="install">
        <div>
          <p className="eyebrow">安装</p>
          <h2>通过 npm 包安装 tcptun。</h2>
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
