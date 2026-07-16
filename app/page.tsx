import Image from "next/image";
import ConfigGenerator from "./config-generator";
import ConfigSection from "./config-section";
import CopyButton from "./copy-button";
import FaqSection from "./faq-section";
import InstallCommand from "./install-command";
import ProtocolIcon from "./protocol-icon";
import { DownloadSection, PlatformDownloadButton } from "./platform-download";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import UriConverter from "./uri-converter";
import XrayConverter from "./xray-converter";
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
    body: "一份配置描述完整拓扑。入口可直连出口，也可交给 route 选择。",
  },
  {
    label: "Config",
    title: "严格 JSON",
    body: "拒绝未知字段；启动前校验 tag、引用、协议认证、TLS、REALITY 与 mux。",
  },
  {
    label: "Route",
    title: "规则路由",
    body: "支持 direct、direct-first、balance、隧道与 blackhole，可按域名、IP 和应用身份分流。",
  },
  {
    label: "Network",
    title: "TCP / UDP / mux / QUIC",
    body: "Native QUIC 同时承载 stream 与 DATAGRAM，并提供分片恢复、自适应 FEC 和多连接池。",
  },
  {
    label: "Outbound",
    title: "负载与热切换",
    body: "balance 按负载、延迟与失败选择成员；运行时可启停、探测并切换出口。",
  },
  {
    label: "Library",
    title: "可嵌入库",
    body: "以 Go 库组合 flow、endpoint、route、transport 与 engine，并适配标准 net 接口。",
  },
];

const workflows = [
  {
    name: "run",
    title: "运行配置",
    body: "加载并校验 JSON，通过后启动全部入口。",
    command: "tcptun --config config.json",
  },
  {
    name: "check",
    title: "仅校验",
    body: "完成校验与编译，不监听端口。",
    command: "tcptun config check --config config.json",
  },
  {
    name: "generate",
    title: "生成配置对",
    body: "生成 server / client 配置，含协议凭据与匹配的 REALITY 密钥。",
    command: "tcptun config vless --server proxy.example.com --port 9443",
  },
  {
    name: "uri",
    title: "导入 URI",
    body: "从 native / VLESS / VMess / Trojan URI 生成客户端配置。",
    command: "tcptun uri import --input client.uri --client --output client.json",
  },
];

const pipeline = ["Load", "Validate", "Compile", "Start"] as const;
const transports = ["raw", "ws", "h2", "h3"] as const;

const terminalSnippet = `$ ${installCommand}

$ npm install -g tcptun

$ tcptun --config config.json

$ tcptun config check --config config.json

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
        <a className="brand" href="#top" aria-label="tcptun 首页">
          <Image src="/tcptun-logo.png" alt="" width={36} height={36} priority />
          <span>tcptun</span>
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
            <span className="release-tagline">proxy runtime</span>
          </div>
          <h1>
            一份配置，
            <br />
            <span className="title-accent">编排全部代理流量。</span>
          </h1>
          <p className="lede">
            tcptun 是配置驱动的多入口、多出口代理运行时。用严格 JSON 描述入口、出口与路由，统一启动 TCP/UDP 服务。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              下载 {displayVersion}
              <span className="button-arrow" aria-hidden="true">↓</span>
            </a>
            <a className="button secondary" href={npmLinks.package} target="_blank" rel="noreferrer">
              npm 安装
            </a>
            <a className="button ghost" href="#generate">生成配置</a>
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
          <p className="eyebrow">能力</p>
          <h2>配置定义拓扑，运行时负责校验与执行。</h2>
          <p>从入口到出口，同一套模型覆盖本地代理、隧道、规则路由、负载均衡与出口链。</p>
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
            <p className="eyebrow">架构</p>
            <h2>入口、路由、出口显式编排。</h2>
            <p>每个组件有唯一 tag，引用关系在启动前完成编译与校验。</p>
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

      <ConfigGenerator />

      <UriConverter />

      <XrayConverter />

      <section className="section protocol-section" id="protocols">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">协议</p>
            <h2>四种隧道协议，同一套拓扑。</h2>
            <p>与 Xray 兼容的是线路协议，不是配置文件格式。</p>
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
                  <dt>互操作</dt>
                  <dd>{protocol.interoperability}</dd>
                </div>
                <div>
                  <dt>默认安全</dt>
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
                {protocol.name === "native" ? "配置说明 →" : "协议对照 →"}
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
          <p className="eyebrow">命令行</p>
          <h2>运行、校验、生成、导入。</h2>
          <p>常用能力都在 JSON 里；CLI 负责加载、校验与生成配置。</p>
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
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>下载后即可运行。</h2>
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
                <strong>tcptun {displayVersion}</strong>
                <p>配置驱动的代理运行时</p>
              </div>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h3>产品</h3>
              <a href="#architecture">架构</a>
              <a href="#config">配置</a>
              <a href="#generate">生成</a>
              <a href="#convert">转换</a>
              <a href="#protocols">协议</a>
              <a href="#start">命令行</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-column">
              <h3>下载</h3>
              <a href="#download">二进制</a>
              <a href={npmLinks.package} target="_blank" rel="noreferrer">npm</a>
              <a href={npmLinks.tarball}>tarball</a>
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
          <span>tcptun {displayVersion}</span>
          <a href="#top">返回顶部</a>
        </div>
      </footer>
    </main>
  );
}
