import Image from "next/image";
import ThemeToggle from "./theme-toggle";
import {
  binaryDownloads,
  inboundTypes,
  installCommand,
  npmLinks,
  outboundTypes,
  releaseVersion,
  topologyExample,
  tunnelProtocols,
} from "./site-data";

const displayVersion = `v${releaseVersion}`;
const linuxX64 = binaryDownloads.find((item) => item.platform === "linux" && item.arch === "amd64");

const capabilities = [
  {
    label: "Runtime",
    title: "多入口、多出口",
    body: "一个进程编译完整代理拓扑。每个 inbound 可以直接指定 outbound，也可以交给 route 选择出口。",
  },
  {
    label: "Config",
    title: "严格 JSON 模型",
    body: "配置拒绝未知字段，并在监听端口前校验 tag、引用、TCP/UDP capability、协议认证、TLS、REALITY 与 mux。",
  },
  {
    label: "Route",
    title: "出口图与规则路由",
    body: "支持 direct、direct-first、blackhole、SOCKS5、mixed 与 tunnel outbound，以及域名、IP、应用身份规则。",
  },
  {
    label: "Network",
    title: "TCP、UDP 与 mux",
    body: "隧道端点保留 TCP/UDP 与 mux；有界 PacketForwarder 支持 Direct 和 SOCKS5 UDP ASSOCIATE 出口。",
  },
  {
    label: "Discovery",
    title: "LAN 扫描与 mDNS",
    body: "无配置模式会扫描私有 IPv4 网络中的 SOCKS5，并发现其他 tcptun 节点发布的 mDNS 服务。",
  },
  {
    label: "Library",
    title: "可嵌入 Go 网络库",
    body: "pkg.tcptun.com/net 提供 flow、endpoint、route、outbound、discovery、transport 与 engine 等公共包。",
  },
];

const workflows = [
  {
    name: "run",
    title: "加载正式配置",
    body: "读取严格 JSON，完成 Load、Validate、Compile 后才准备并启动全部入口。",
    command: "tcptun --config config.json",
  },
  {
    name: "check",
    title: "启动前完整校验",
    body: "加载、校验并编译配置，但不绑定任何监听端口，适合部署前检查。",
    command: "tcptun config check --config config.json",
  },
  {
    name: "generate",
    title: "生成匹配的隧道对",
    body: "一次创建 server.json、client.json 与 client.uri，包括协议凭据和匹配的 REALITY 密钥。",
    command: "tcptun config vless --server proxy.example.com --port 9443",
  },
  {
    name: "uri",
    title: "从 URI 创建客户端",
    body: "导入 native、VLESS、VMess 或 Trojan URI，直接生成可运行的 mixed 客户端配置。",
    command: "tcptun uri import --input client.uri --client --output client.json",
  },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="tcptun-go 首页">
          <Image src="/tcptun-logo.png" alt="" width={40} height={40} priority />
          <span>tcptun-go</span>
        </a>
        <div className="topbar-actions">
          <nav className="nav" aria-label="主要导航">
            <a href="#architecture">架构</a>
            <a href="#protocols">协议</a>
            <a href="#download">下载</a>
            <a href="#start">使用</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="release-line">
            <span className="version-badge">{displayVersion}</span>
            <span>configuration-driven proxy runtime</span>
          </div>
          <h1>用一份拓扑，组织所有代理流量。</h1>
          <p className="lede">
            tcptun-go 是使用 Go 编写的多 inbound、多 outbound 代理运行时。它以严格 JSON 编译入口、出口图、
            路由、DNS 与发现配置，再统一启动 TCP/UDP 服务。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">下载 {displayVersion}</a>
            <a className="button secondary" href={npmLinks.package}>npm 安装</a>
            <a className="button ghost" href="#architecture">查看配置模型</a>
          </div>
          <div className="release-facts" aria-label="能力概览">
            <span><strong>{inboundTypes.length}</strong> 类 inbound</span>
            <span><strong>{outboundTypes.length}</strong> 类 outbound</span>
            <span><strong>{binaryDownloads.length}</strong> 个平台构建</span>
          </div>
        </div>

        <div className="terminal" aria-label="tcptun 命令预览">
          <div className="terminal-heading">
            <span>tcptun</span>
            <span>{displayVersion}</span>
          </div>
          <pre><code>{`$ ${installCommand}

# 或通过 npm 包装命令安装
$ npm install -g tcptun

# 加载统一拓扑配置
$ tcptun --config config.json

# 不监听端口，先完成全部校验
$ tcptun config check --config config.json

# 生成 Xray-compatible VLESS + REALITY 配置对
$ tcptun config vless \\
    --server proxy.example.com \\
    --port 9443`}</code></pre>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="eyebrow">运行时能力</p>
          <h2>配置描述拓扑，Runtime 负责验证和执行。</h2>
          <p>当前网站内容依据 tcptun-go `{displayVersion}` 源码、README、FileConfig 和仓库示例手写整理。</p>
        </div>
        <div className="capability-grid">
          {capabilities.map((item) => (
            <article key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture-section" id="architecture">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">统一拓扑</p>
            <h2>入口、路由与出口不再由 mode 隐式决定。</h2>
            <p>旧版 `mode`、`server_addr` 和 `tunnel_*` 顶层配置已经移除。每个组件都有 tag，引用关系在启动前编译。</p>
          </div>
          <div className="chip-row">
            <span>Load</span><span>Validate</span><span>Compile</span><span>Start</span>
          </div>
        </div>

        <div className="architecture-grid">
          <div className="topology-panel">
            <div className="topology-column">
              <p>Inbounds</p>
              {inboundTypes.map((type) => <span key={type}>{type}</span>)}
            </div>
            <div className="topology-router">
              <span>Route</span>
              <small>rules + default_outbound</small>
            </div>
            <div className="topology-column">
              <p>Outbounds</p>
              {outboundTypes.map((type) => <span key={type}>{type}</span>)}
            </div>
          </div>
          <div className="config-model">
            <div className="config-model-heading">
              <span>config.json</span>
              <span>strict schema</span>
            </div>
            <pre><code>{topologyExample}</code></pre>
          </div>
        </div>
      </section>

      <section className="section protocol-section" id="protocols">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">隧道协议</p>
            <h2>四种 wire protocol，共用同一套拓扑模型。</h2>
            <p>外部协议兼容指 wire protocol 互操作；tcptun JSON 不能直接作为 Xray 的配置文件。</p>
          </div>
          <div className="chip-row"><span>raw</span><span>ws</span><span>h2</span><span>h3</span></div>
        </div>

        <div className="protocol-grid">
          {tunnelProtocols.map((protocol, index) => (
            <article className="protocol-card" key={protocol.name}>
              <div className="protocol-card-heading">
                <div>
                  <span className="protocol-index">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{protocol.name}</h3>
                </div>
                <span className="security-badge">{protocol.credential}</span>
              </div>
              <p className="protocol-description">{protocol.description}</p>
              <dl>
                <div><dt>Interop</dt><dd>{protocol.interoperability}</dd></div>
                <div><dt>Generator</dt><dd>{protocol.generatedSecurity}</dd></div>
                <div className="wide"><dt>Mux</dt><dd>{protocol.mux}</dd></div>
              </dl>
              <pre className="protocol-command"><code>{protocol.command}</code></pre>
            </article>
          ))}
        </div>
      </section>

      <section className="section download-section" id="download">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">npm 二进制</p>
            <h2>无需安装 Go，下载后直接运行。</h2>
            <p>下面是 npm `tcptun@{releaseVersion}` 发布包内的原始二进制，通过 npm CDN 直接下载。</p>
          </div>
          <a className="button secondary" href={npmLinks.tarball}>下载完整 npm .tgz</a>
        </div>
        <div className="download-grid">
          {binaryDownloads.map((item) => (
            <article className="download-card" key={item.filename}>
              <div className={`platform-mark ${item.platform}`} aria-hidden="true">{platformInitial(item.platform)}</div>
              <div className="download-copy">
                <div className="download-title"><h3>{item.platformLabel}</h3><span>{item.archLabel}</span></div>
                <code>{item.filename}</code>
                <p>{formatBytes(item.size)} · npm CDN</p>
              </div>
              <a className="download-link" href={item.url} download={item.filename}>下载</a>
            </article>
          ))}
        </div>
        <div className="download-note">
          <div>
            <strong>一条命令自动选择平台并安装</strong>
            <code>{installCommand}</code>
            <span>默认安装 npm 最新版到 `/usr/local/bin`；可用 `TCPTUN_VERSION` 与 `TCPTUN_INSTALL_DIR` 覆盖。</span>
          </div>
          <a href="/install.sh">查看脚本 ↗</a>
        </div>
      </section>

      <section className="section quickstart-section" id="start">
        <div className="section-heading">
          <p className="eyebrow">CLI 工作流</p>
          <h2>运行、检查、生成、导入。</h2>
          <p>根命令只保留 `--config/-c`、`--verbose/-v` 和无配置自动发现使用的 `--retry`；其余能力全部写入 JSON。</p>
        </div>
        <div className="mode-grid">
          {workflows.map((item) => (
            <article key={item.name}>
              <span className="mode-name">{item.name}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <pre><code>{item.command}</code></pre>
            </article>
          ))}
        </div>
        <div className="next-step">
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div><p className="eyebrow">tcptun-go {displayVersion}</p><h2>从一份严格 JSON 开始。</h2></div>
          <a className="button primary" href={linuxX64?.url || npmLinks.package}>下载 Linux x64</a>
        </div>
      </section>

      <footer className="footer">
        <div><Image src="/tcptun-logo.png" alt="" width={34} height={34} /><span>tcptun-go {displayVersion}</span></div>
        <div><a href={npmLinks.package}>npm package</a><a href={npmLinks.tarball}>release tarball</a><a href="#top">返回顶部 ↑</a></div>
      </footer>
    </main>
  );
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function platformInitial(platform: string) {
  if (platform === "darwin") return "M";
  if (platform === "windows") return "W";
  return "L";
}
