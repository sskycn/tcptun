import Image from "next/image";
import Link from "next/link";
import CopyButton from "./copy-button";
import InstallCommand from "./install-command";
import SiteChrome from "./site-chrome";
import { PlatformDownloadButton } from "./platform-download";
import {
  githubLinks,
  installCommand,
  productDescription,
  releaseHighlights,
  releaseVersion,
} from "./site-data";

const displayVersion = `v${releaseVersion}`;

const paths = [
  {
    href: "/guide/",
    label: "Run",
    title: "CLI runtime",
    body: "Install the binary, generate a strict JSON topology, validate, and serve inbounds together.",
  },
  {
    href: "/embed/",
    label: "Embed",
    title: "Go SDK",
    body: "Import pkg.tcptun.com/net and compose dialers, listeners, packet devices, and routing in process.",
  },
  {
    href: "/use-cases/#android",
    label: "Integrate",
    title: "Android & platforms",
    body: "Use the runtime as an application-aware VPN engine with TUN, DNS, and outbound switching.",
  },
] as const;

const coreCapabilities = [
  {
    title: "Compiled topology",
    body: "FileConfig is validated and compiled before any listener opens. Unknown fields fail closed.",
  },
  {
    title: "Multi-inbound / multi-outbound",
    body: "One process hosts mixed proxies, tunnels, reverse publish, balance groups, and rule routing.",
  },
  {
    title: "Native TCP/QUIC path",
    body: "tcptun-to-tcptun Native protocol with mux, carrier.mode selection, and optional resumable streams.",
  },
  {
    title: "Resource-bounded runtime",
    body: "Mux pools, resume buffers, and packet paths are budgeted so long-lived services stay predictable.",
  },
  {
    title: "Platform networking",
    body: "TUN, DNS interception / fake-IP, and Android bridge hooks for device-level integration.",
  },
  {
    title: "Wire interoperability",
    body: "VLESS, VMess, and Trojan for Xray-compatible wire paths — not Xray config compatibility.",
  },
] as const;

const differentiators = [
  "Programmable networking runtime — not a single-purpose proxy app",
  "Embeddable Go engine with net.Conn / PacketConn / Listener contracts",
  "Deterministic compile-before-serve routing model",
  "Native protocol architecture for controlled tcptun-to-tcptun deployments",
  "Platform integration surface for CLI, Android, and gateways",
] as const;

const terminalSnippet = `$ ${installCommand}

$ npm install -g tcptun

$ tcptun --config config.json

$ tcptun config check --config config.json

# Go module
import "pkg.tcptun.com/net"`;

export default function Home() {
  return (
    <SiteChrome>
      <section className="hero hero-runtime" id="top">
        <div className="hero-copy">
          <div className="release-line">
            <span className="version-badge">
              <span className="pulse-dot" aria-hidden="true" />
              {displayVersion}
            </span>
            <span className="release-tagline">networking runtime</span>
          </div>
          <h1>
            Programmable networking runtime
            <br />
            <span className="title-accent">for applications and devices</span>
          </h1>
          <p className="lede">{productDescription}</p>
          <div className="hero-actions">
            <Link className="button primary" href="/guide/">
              Get started
            </Link>
            <Link className="button secondary" href="/docs/">
              Documentation
            </Link>
            <a className="button ghost" href={githubLinks.runtime} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link className="button ghost" href="/download/">
              Download
            </Link>
          </div>
          <p className="hero-run-modes">
            Run as <strong>CLI runtime</strong>, <strong>Android VPN client</strong>,{" "}
            <strong>embedded Go library</strong>, or <strong>platform networking engine</strong>.
          </p>
        </div>

        <div className="terminal" aria-label="tcptun command preview">
          <div className="terminal-heading">
            <div className="terminal-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="terminal-title">tcptun · {displayVersion}</span>
            <CopyButton value={terminalSnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre className="terminal-body">
            <code>{terminalSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="section" id="what-is">
        <div className="section-heading">
          <p className="eyebrow">What is tcptun?</p>
          <h2>A compiled networking runtime — not a protocol catalog.</h2>
          <p>
            tcptun loads a strict JSON topology, compiles outbounds and routes, prepares every
            inbound, then serves them together. The same engine powers the CLI, Go embeddings, and
            Android integrations. Protocol count is secondary; the model is primary.
          </p>
        </div>
        <ul className="diff-list">
          {differentiators.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section" id="paths">
        <div className="section-heading">
          <p className="eyebrow">Choose your path</p>
          <h2>Run, embed, or integrate.</h2>
        </div>
        <div className="path-grid">
          {paths.map((path) => (
            <Link className="path-card" href={path.href} key={path.href}>
              <span className="capability-label">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="path-card-cta">Continue →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="capabilities">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Core capabilities</p>
            <h2>What the runtime actually does.</h2>
            <p>
              Capability list after positioning — so new readers already know tcptun is an engine,
              not a single-purpose tunnel utility.
            </p>
          </div>
          <Link className="button secondary" href="/architecture/">
            Architecture
          </Link>
        </div>
        <div className="capability-grid">
          {coreCapabilities.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">Core</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture-section" id="architecture-preview">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Architecture</p>
            <h2>Validate → compile → serve.</h2>
            <p>
              FileConfig is decoded with unknown-field rejection, compiled into RuntimeConfig, then
              bound. Fail closed before traffic is accepted.
            </p>
          </div>
          <Link className="button secondary" href="/architecture/">
            Full architecture
          </Link>
        </div>
        <div className="arch-flow" aria-label="Runtime compile pipeline">
          <div className="arch-flow-step">
            <span>01</span>
            <strong>FileConfig</strong>
            <p>Strict JSON topology</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>02</span>
            <strong>Validate</strong>
            <p>Tags, refs, auth, caps</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>03</span>
            <strong>RuntimeConfig</strong>
            <p>Compiled graph</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>04</span>
            <strong>Serve</strong>
            <p>TCP · UDP · TUN · routes</p>
          </div>
        </div>
      </section>

      <section className="section protocol-section" id="native-vs-compat">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Protocols</p>
            <h2>Native first. Compatibility second.</h2>
            <p>
              Compatibility means wire interoperability with VLESS / VMess / Trojan — not Xray{" "}
              <code>-c</code> config files.
            </p>
          </div>
          <Link className="button secondary" href="/protocols/">
            Protocol docs
          </Link>
        </div>
        <div className="split-panels">
          <article className="split-panel">
            <p className="capability-label">Native</p>
            <h3>tcptun Native protocol</h3>
            <p>
              Optimized for TCP/QUIC carriers, mux, resumable streams, reverse publishing, resource
              control, and tcptun-to-tcptun deployments.
            </p>
            <Link href="/protocols/native/">Native guide →</Link>
          </article>
          <article className="split-panel">
            <p className="capability-label">Compatibility</p>
            <h3>Wire interop layer</h3>
            <p>
              VLESS, VMess, and Trojan for mixed ecosystems. Same runtime topology; different wire
              credentials and security combinations.
            </p>
            <Link href="/protocols/">Compare protocols →</Link>
          </article>
        </div>
      </section>

      <section className="section" id="release">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Latest · {displayVersion}</p>
            <h2>What shipped in this runtime.</h2>
            <p>
              Release notes stay technical: cross-platform TUN, fail-closed DNS pinning, runtime
              snapshots and diagnostics, actionable error classes, and Android/QR integrations.
              Version lives here — not in the document title for SEO.
            </p>
          </div>
          <a className="button secondary" href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            GitHub release
          </a>
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

      <section className="section" id="trust">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Security & trust</p>
            <h2>Source, install, and fail-closed defaults.</h2>
            <p>
              Inspect installers, verify package provenance, and read how the runtime validates
              config before binding ports.
            </p>
          </div>
          <Link className="button secondary" href="/security/">
            Security page
          </Link>
        </div>
        <div className="trust-strip">
          <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
            Source · tcptun-go
          </a>
          <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            Release tag {displayVersion}
          </a>
          <a href="/install.sh">install.sh (inspect first)</a>
          <Link href="/download/">Binaries + verify</Link>
        </div>
        <InstallCommand variant="panel" />
      </section>

      <section className="section quickstart-section">
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>Download the runtime and start from a validated config.</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>
    </SiteChrome>
  );
}
