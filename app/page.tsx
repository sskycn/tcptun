import Image from "next/image";
import ConfigSection from "./config-section";
import CopyButton from "./copy-button";
import FaqSection from "./faq-section";
import InstallCommand from "./install-command";
import ProtocolIcon from "./protocol-icon";
import { DownloadSection, PlatformDownloadButton } from "./platform-download";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import {
  inboundTypes,
  installCommand,
  npmLinks,
  outboundTypes,
  releaseVersion,
  topologyExample,
  tunnelProtocols,
  binaryDownloads,
} from "./site-data";

const displayVersion = `v${releaseVersion}`;

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

const pipeline = ["Load", "Validate", "Compile", "Start"] as const;
const transports = ["raw", "ws", "h2", "h3"] as const;

const terminalSnippet = `$ ${installCommand}

# 或通过 npm 包装命令安装
$ npm install -g tcptun

# 加载统一拓扑配置
$ tcptun --config config.json

# 不监听端口，先完成全部校验
$ tcptun config check --config config.json

# 生成 Xray-compatible VLESS + REALITY 配置对
$ tcptun config vless \\
    --server proxy.example.com \\
    --port 9443`;

export default function Home() {
  return (
    <main>
      <div className="page-bg" aria-hidden="true">
        <div className="page-bg-grid" />
        <div className="page-bg-glow page-bg-glow-a" />
        <div className="page-bg-glow page-bg-glow-b" />
        <div className="page-bg-glow page-bg-glow-c" />
      </div>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="tcptun-go 首页">
          <Image src="/tcptun-logo.png" alt="" width={36} height={36} priority />
          <span>tcptun-go</span>
        </a>
        <div className="topbar-actions">
          <SiteNav />
          <ThemeToggle />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="release-line">
            <span className="version-badge">
              <span className="pulse-dot" aria-hidden="true" />
              {displayVersion}
            </span>
            <span className="release-tagline">configuration-driven proxy runtime</span>
          </div>
          <h1>
            用一份拓扑，
            <br />
            <span className="title-accent">组织所有代理流量。</span>
          </h1>
          <p className="lede">
            tcptun-go 是使用 Go 编写的多 inbound、多 outbound 代理运行时。它以严格 JSON 编译入口、出口图、
            路由、DNS 与发现配置，再统一启动 TCP/UDP 服务。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              下载 {displayVersion}
              <span className="button-arrow" aria-hidden="true">↓</span>
            </a>
            <a className="button secondary" href={npmLinks.package} target="_blank" rel="noreferrer">
              npm 安装
            </a>
            <a className="button ghost" href="#architecture">查看配置模型</a>
          </div>

          <InstallCommand variant="hero" />

          <div className="release-facts" aria-label="能力概览">
            <div className="fact">
              <strong>{inboundTypes.length}</strong>
              <span>类 inbound</span>
            </div>
            <div className="fact">
              <strong>{outboundTypes.length}</strong>
              <span>类 outbound</span>
            </div>
            <div className="fact">
              <strong>{binaryDownloads.length}</strong>
              <span>个平台构建</span>
            </div>
          </div>
        </div>

        <div className="terminal" aria-label="tcptun 命令预览">
          <div className="terminal-heading">
            <div className="terminal-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
            <span className="terminal-title">tcptun · {displayVersion}</span>
            <CopyButton value={terminalSnippet} label="复制" className="copy-button-ghost" />
          </div>
          <pre className="terminal-body"><code>{terminalSnippet}</code></pre>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="eyebrow">运行时能力</p>
          <h2>配置描述拓扑，Runtime 负责验证和执行。</h2>
          <p>当前网站内容依据 tcptun-go `{displayVersion}` 源码、README、FileConfig 和仓库示例手写整理。</p>
        </div>
        <div className="capability-grid">
          {capabilities.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">{item.label}</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
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
          <ol className="pipeline" aria-label="启动流水线">
            {pipeline.map((step, index) => (
              <li key={step}>
                <span className="pipeline-step">{step}</span>
                {index < pipeline.length - 1 ? <span className="pipeline-connector" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="architecture-grid">
          <div className="topology-panel">
            <div className="topology-column">
              <p>Inbounds</p>
              {inboundTypes.map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
            <div className="topology-router">
              <span className="topology-router-label">Route</span>
              <small>rules + default_outbound</small>
              <div className="topology-flow" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="topology-column">
              <p>Outbounds</p>
              {outboundTypes.map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
          </div>
          <div className="config-model">
            <div className="config-model-heading">
              <div className="terminal-dots" aria-hidden="true">
                <span /><span /><span />
              </div>
              <span>config.json</span>
              <div className="config-heading-actions">
                <span className="config-badge">strict schema</span>
                <CopyButton value={topologyExample} label="复制" className="copy-button-ghost" />
              </div>
            </div>
            <pre><code>{topologyExample}</code></pre>
          </div>
        </div>
      </section>

      <ConfigSection />

      <section className="section protocol-section" id="protocols">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">隧道协议</p>
            <h2>四种 wire protocol，共用同一套拓扑模型。</h2>
            <p>外部协议兼容指 wire protocol 互操作；tcptun JSON 不能直接作为 Xray 的配置文件。</p>
          </div>
          <div className="chip-row">
            {transports.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="protocol-grid">
          {tunnelProtocols.map((protocol, index) => (
            <article className="protocol-card" key={protocol.name}>
              <div className="protocol-card-heading">
                <div className="protocol-title-row">
                  <ProtocolIcon name={protocol.name} />
                  <div>
                    <span className="protocol-index">{String(index + 1).padStart(2, "0")}</span>
                    <h3>{protocol.name}</h3>
                  </div>
                </div>
                <span className="security-badge">{protocol.credential}</span>
              </div>
              <p className="protocol-description">{protocol.description}</p>
              <dl>
                <div>
                  <dt>Interop</dt>
                  <dd>{protocol.interoperability}</dd>
                </div>
                <div>
                  <dt>Generator</dt>
                  <dd>{protocol.generatedSecurity}</dd>
                </div>
                <div className="wide">
                  <dt>Mux</dt>
                  <dd>{protocol.mux}</dd>
                </div>
              </dl>
              <div className="protocol-command-row">
                <pre className="protocol-command"><code>{protocol.command}</code></pre>
                <CopyButton value={protocol.command} label="复制" className="copy-button-on-dark" />
              </div>
              <a
                className="protocol-doc-link"
                href={protocol.name === "native" ? "#config-native" : "#protocol-compare"}
              >
                {protocol.name === "native"
                  ? "查看 native 配置说明 →"
                  : "查看协议对照与 REALITY →"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section download-section" id="download">
        <DownloadSection releaseVersion={releaseVersion} />
      </section>

      <section className="section quickstart-section" id="start">
        <div className="section-heading">
          <p className="eyebrow">CLI 工作流</p>
          <h2>运行、检查、生成、导入。</h2>
          <p>根命令只保留 `--config/-c`、`--verbose/-v` 和无配置自动发现使用的 `--retry`；其余能力全部写入 JSON。</p>
        </div>
        <div className="mode-grid">
          {workflows.map((item, index) => (
            <article className="mode-card" key={item.name}>
              <div className="mode-meta">
                <span className="mode-name">{item.name}</span>
                <span className="mode-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="mode-command-row">
                <pre><code>{item.command}</code></pre>
                <CopyButton value={item.command} label="复制" className="copy-button-on-dark" />
              </div>
            </article>
          ))}
        </div>
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun-go {displayVersion}</p>
            <h2>从一份严格 JSON 开始。</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>

      <FaqSection />

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <div className="footer-brand">
              <Image src="/tcptun-logo.png" alt="" width={36} height={36} />
              <div>
                <strong>tcptun-go {displayVersion}</strong>
                <p>配置驱动的多入口、多出口代理运行时</p>
              </div>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h3>产品</h3>
              <a href="#architecture">架构模型</a>
              <a href="#config">配置说明</a>
              <a href="#reality">REALITY</a>
              <a href="#protocol-compare">协议对照</a>
              <a href="#protocols">隧道协议</a>
              <a href="#start">CLI 工作流</a>
              <a href="#faq">常见问题</a>
            </div>
            <div className="footer-column">
              <h3>获取</h3>
              <a href="#download">平台二进制</a>
              <a href={npmLinks.package} target="_blank" rel="noreferrer">npm package</a>
              <a href={npmLinks.tarball}>release tarball</a>
              <a href="/install.sh">install.sh</a>
            </div>
            <div className="footer-column">
              <h3>协议</h3>
              {tunnelProtocols.map((protocol) => (
                <a href="#protocols" key={protocol.name}>{protocol.name}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>内容依据 tcptun-go {displayVersion} 手写整理 · npm 仅作分发入口</span>
          <a href="#top">返回顶部 ↑</a>
        </div>
      </footer>
    </main>
  );
}
