import Image from "next/image";
import Link from "next/link";
import CopyButton from "./copy-button";
import InstallCommand from "./install-command";
import ProtocolIcon from "./protocol-icon";
import SiteChrome from "./site-chrome";
import { PlatformDownloadButton } from "./platform-download";
import {
  binaryDownloads,
  inboundTypes,
  installCommand,
  npmLinks,
  outboundTypes,
  releaseHighlights,
  releaseVersion,
  topologyExample,
  tunnelProtocols,
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
    label: "Network",
    title: "Adaptive carriers and resumable TCP",
    body: "Reality auto prefers QUIC and falls back to TCP; opt-in logical streams can resume across carrier replacement.",
  },
  {
    label: "Reverse",
    title: "Reverse publish",
    body: "native mux / QUIC supports publish and expose to hang NAT-side TCP/UDP services on edge ports.",
  },
];

const featureLinks = [
  {
    href: "/guide/",
    label: "Wizard",
    title: "Guided first tunnel",
    body: "Step-by-step setup for native + raw + reality: install, generate, validate, run, and test.",
  },
  {
    href: "/examples/",
    label: "Examples",
    title: "Copy-ready topologies",
    body: "Worked server/client pairs for native auto Reality, resumable streams, reverse publish, VLESS, VMess, and Trojan.",
  },
  {
    href: "/protocols/native/",
    label: "Native guide",
    title: "Deep native tutorial",
    body: "Concepts, fields, and long-form notes for the private tunnel protocol.",
  },
  {
    href: "/generate/",
    label: "Generate",
    title: "Browser config pairs",
    body: "Create matching server/client JSON and URIs locally with Web Crypto keys.",
  },
];

const pipeline = ["Load", "Validate", "Compile", "Start"] as const;

const terminalSnippet = `$ ${installCommand}

$ npm install -g tcptun

$ tcptun --config config.json

$ tcptun config check --config config.json

$ tcptun config native \\
    --server proxy.example.com \\
    --port 9443`;

export default function Home() {
  return (
    <SiteChrome>
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
            <Link className="button primary" href="/guide/">
              Start wizard
            </Link>
            <Link className="button secondary" href="/download/">
              Download {displayVersion}
            </Link>
            <Link className="button ghost" href="/generate/">
              Generate config
            </Link>
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
              <span />
              <span />
              <span />
            </div>
            <span className="terminal-title">
              tcptun · {displayVersion}
            </span>
            <CopyButton value={terminalSnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre className="terminal-body">
            <code>{terminalSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="section" id="release">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">What&apos;s new · {displayVersion}</p>
            <h2>Carrier continuity, bounded recovery, quieter Android.</h2>
            <p>
              v0.2.3 centers on <code>native + raw + reality</code> automatic dual carriers
              (QUIC-first, TCP fallback), optional resumable TCP streams, and tighter lifecycle
              across the runtime and Android app.
            </p>
          </div>
          <Link className="button secondary" href="/config/#native-carriers">
            Explore native + raw + reality
          </Link>
        </div>
        <div className="capability-grid">
          {releaseHighlights.map((item, index) => (
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
                {index < pipeline.length - 1 ? (
                  <span className="pipeline-connector" aria-hidden="true" />
                ) : null}
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
                <span />
                <span />
                <span />
              </div>
              <span>config.json</span>
              <div className="config-heading-actions">
                <span className="config-badge">strict schema</span>
                <CopyButton value={topologyExample} label="Copy" className="copy-button-ghost" />
              </div>
            </div>
            <pre>
              <code>{topologyExample}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="section protocol-section">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Protocols</p>
            <h2>Four tunnel protocols, one topology.</h2>
            <p>Xray compatibility is for wire protocols, not config file format.</p>
          </div>
          <Link className="button secondary" href="/protocols/">
            All protocols
          </Link>
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
              <div className="protocol-command-row">
                <pre className="protocol-command">
                  <code>{protocol.command}</code>
                </pre>
                <CopyButton value={protocol.command} label="Copy" className="copy-button-on-dark" />
              </div>
              <Link
                className="protocol-doc-link"
                href={protocol.name === "native" ? "/protocols/native/" : "/examples/"}
              >
                {protocol.name === "native" ? "Native guide →" : "Use cases →"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Explore</p>
          <h2>Jump into tools and docs.</h2>
        </div>
        <div className="home-link-grid">
          {featureLinks.map((item, index) => (
            <Link className="home-link-card" href={item.href} key={item.href}>
              <span className="capability-label">{item.label}</span>
              <span className="home-link-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section quickstart-section">
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
    </SiteChrome>
  );
}
