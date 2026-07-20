import Image from "next/image";
import ConfigGenerator from "./config-generator";
import ConfigSection from "./config-section";
import CopyButton from "./copy-button";
import CookieBanner from "./cookie-banner";
import CookieSettingsLink from "./cookie-settings-link";
import DisclaimerSection from "./disclaimer-section";
import FaqSection from "./faq-section";
import InstallCommand from "./install-command";
import NativeGuide from "./native-guide";
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
    title: "Multi-inbound, multi-outbound",
    body: "One config describes the full topology. Inbounds can pin an outbound or let route decide.",
  },
  {
    label: "Config",
    title: "Strict JSON",
    body: "address uses host:port arrays; unknown fields are rejected; tags, refs, auth, TLS, REALITY, and mux are validated before start.",
  },
  {
    label: "Route",
    title: "Rule-based routing",
    body: "Supports direct, balance, tunnels, and blackhole, with domain, IP, and app-identity matching.",
  },
  {
    label: "Network",
    title: "TCP / UDP / mux / QUIC",
    body: "Native QUIC carries both streams and DATAGRAMs, with fragmentation recovery, adaptive FEC, and multi-connection pools.",
  },
  {
    label: "Reverse",
    title: "Reverse publish",
    body: "native mux / QUIC supports publish and expose to hang NAT-side TCP/UDP services on edge ports.",
  },
  {
    label: "Outbound",
    title: "Load balance and hot switch",
    body: "balance picks members by load, latency, and failures; multiple addresses on one outbound race as candidate entry points.",
  },
  {
    label: "Library",
    title: "Embeddable library",
    body: "Compose flow, endpoint, route, transport, and engine as a Go library, with standard net interfaces.",
  },
];

const workflows = [
  {
    name: "run",
    title: "Run a config",
    body: "Load and validate JSON, then start every inbound.",
    command: "tcptun --config config.json",
  },
  {
    name: "check",
    title: "Validate only",
    body: "Validate and compile without listening on ports.",
    command: "tcptun config check --config config.json",
  },
  {
    name: "generate",
    title: "Generate a pair",
    body: "Generate matching server / client configs with credentials and REALITY keys.",
    command: "tcptun config vless --server proxy.example.com --port 9443",
  },
  {
    name: "uri",
    title: "Import URI",
    body: "Build a client config from native / VLESS / VMess / Trojan URIs.",
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
        <a className="brand" href="#top" aria-label="tcptun home">
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
            One config,
            <br />
            <span className="title-accent">orchestrate all proxy traffic.</span>
          </h1>
          <p className="lede">
            tcptun is a config-driven multi-inbound, multi-outbound proxy runtime. Describe
            inbounds, outbounds, and routes in strict JSON, then start TCP/UDP services together.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              Download {displayVersion}
              <span className="button-arrow" aria-hidden="true">↓</span>
            </a>
            <a className="button secondary" href={npmLinks.package} target="_blank" rel="noreferrer">
              Install via npm
            </a>
            <a className="button ghost" href="#generate">Generate config</a>
          </div>

          <InstallCommand variant="hero" />

          <div className="release-facts" aria-label="Capability overview">
            <div className="fact">
              <strong>{inboundTypes.length}</strong>
              <span>inbound types</span>
            </div>
            <div className="fact">
              <strong>{outboundTypes.length}</strong>
              <span>outbound types</span>
            </div>
            <div className="fact">
              <strong>{binaryDownloads.length}</strong>
              <span>platform builds</span>
            </div>
          </div>
        </div>

        <div className="terminal" aria-label="tcptun command preview">
          <div className="terminal-heading">
            <div className="terminal-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
            <span className="terminal-title">tcptun · {displayVersion}</span>
            <CopyButton value={terminalSnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre className="terminal-body"><code>{terminalSnippet}</code></pre>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>Config defines the topology; the runtime validates and runs it.</h2>
          <p>
            From inbound to outbound, one model covers local proxies, tunnels, rule routing,
            load balancing, and outbound chains.
          </p>
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
            <p className="eyebrow">Architecture</p>
            <h2>Inbounds, routes, and outbounds are explicit.</h2>
            <p>Every component has a unique tag; references are compiled and checked before start.</p>
          </div>
          <ol className="pipeline" aria-label="Startup pipeline">
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
                <CopyButton value={topologyExample} label="Copy" className="copy-button-ghost" />
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
            <p className="eyebrow">Protocols</p>
            <h2>Four tunnel protocols, one topology.</h2>
            <p>Xray compatibility is for wire protocols, not config file format.</p>
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
                  <dt>Default security</dt>
                  <dd>{protocol.generatedSecurity}</dd>
                </div>
                <div className="wide">
                  <dt>Mux</dt>
                  <dd>{protocol.mux}</dd>
                </div>
              </dl>
              <div className="protocol-command-row">
                <pre className="protocol-command"><code>{protocol.command}</code></pre>
                <CopyButton value={protocol.command} label="Copy" className="copy-button-on-dark" />
              </div>
              <a
                className="protocol-doc-link"
                href={
                  protocol.name === "native"
                    ? "#native-guide"
                    : protocol.name === "vless"
                      ? "#protocol-examples"
                      : "#protocol-compare"
                }
              >
                {protocol.name === "native"
                  ? "Native guide →"
                  : protocol.name === "vless"
                    ? "Use cases →"
                    : "Protocol comparison →"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <NativeGuide />

      <section className="section download-section" id="download">
        <DownloadSection releaseVersion={releaseVersion} />
      </section>

      <section className="section quickstart-section" id="start">
        <div className="section-heading">
          <p className="eyebrow">CLI</p>
          <h2>Run, check, generate, import.</h2>
          <p>Most power lives in JSON; the CLI loads, validates, and generates configs.</p>
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
                <CopyButton value={item.command} label="Copy" className="copy-button-on-dark" />
              </div>
            </article>
          ))}
        </div>
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>Download and run.</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>

      <FaqSection />

      <DisclaimerSection />

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <div className="footer-brand">
              <Image src="/tcptun-logo.png" alt="" width={36} height={36} />
              <div>
                <strong>tcptun {displayVersion}</strong>
                <p>Config-driven proxy runtime</p>
              </div>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h3>Product</h3>
              <a href="#architecture">Architecture</a>
              <a href="#config">Config</a>
              <a href="#generate">Generate</a>
              <a href="#uri">URI</a>
              <a href="#convert">Convert</a>
              <a href="#protocols">Protocols</a>
              <a href="#start">CLI</a>
              <a href="#faq">FAQ</a>
              <a href="#disclaimer">Disclaimer</a>
              <CookieSettingsLink className="footer-text-button" />
            </div>
            <div className="footer-column">
              <h3>Download</h3>
              <a href="#download">Binaries</a>
              <a href={npmLinks.package} target="_blank" rel="noreferrer">npm</a>
              <a href={npmLinks.tarball}>tarball</a>
              <a href="/install.sh">install.sh</a>
            </div>
            <div className="footer-column">
              <h3>Protocols</h3>
              {tunnelProtocols.map((protocol) => (
                <a href="#protocols" key={protocol.name}>{protocol.name}</a>
              ))}
              <a href="#native-guide">Native guide</a>
              <a href="#protocol-examples">Use cases</a>
              <a href="#protocol-compare">Compare</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            tcptun {displayVersion} ·{" "}
            <strong>Lawful use only · You bear all consequences · No warranty or promise.</strong>{" "}
            <a href="#disclaimer">Disclaimer</a>
            {" · "}
            <CookieSettingsLink className="footer-text-button" />
          </span>
          <a href="#top">Back to top</a>
        </div>
      </footer>

      <CookieBanner />
    </main>
  );
}
