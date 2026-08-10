import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import {
  githubLinks,
  installCommand,
  npmInstallCommand,
  npmLinks,
  pinnedInstallCommand,
  releaseVersion,
} from "../site-data";

export const metadata: Metadata = {
  title: "Security & trust",
  description:
    "Supply chain, install safety, and runtime security properties for the tcptun networking runtime.",
};

const displayVersion = `v${releaseVersion}`;

const properties = [
  {
    title: "Strict configuration validation",
    body: "Unknown fields are rejected. Tags, references, auth, transport, and security combinations are checked before listeners open.",
  },
  {
    title: "Fail closed",
    body: "Invalid topology does not partially start. DNS and routing refuse hidden unsafe fallbacks when validation fails.",
  },
  {
    title: "Bounded resources",
    body: "Mux pools, resume buffers, and packet paths use explicit budgets for predictable long-running services.",
  },
  {
    title: "No credential logging by default",
    body: "Operators control log level; browser tools generate keys locally and do not upload material to this site.",
  },
] as const;

const installSafe = `# 1) Download installer for inspection
curl -fsSL https://tcptun.com/install.sh -o install-tcptun.sh

# 2) Read it
less install-tcptun.sh

# 3) Run only if you accept the script
sh install-tcptun.sh

# Prefer pinning a version
TCPTUN_VERSION=${releaseVersion} sh install-tcptun.sh

# Or install from npm without curl|sh
npm install -g tcptun@${releaseVersion}`;

export default function SecurityPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Security & trust"
        title="Source, install, and fail-closed runtime defaults."
        description="tcptun is open for inspection: runtime source, release tags, npm package layout, and an installer you can read before executing. This page documents supply chain and security properties without marketing claims."
        actions={[
          { href: githubLinks.runtime, label: "Runtime source", variant: "primary" },
          { href: githubLinks.runtimeReleaseTag, label: `Release ${displayVersion}`, variant: "secondary" },
          { href: "/download/", label: "Download", variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Supply chain</p>
          <h2>Where binaries come from.</h2>
        </div>
        <div className="capability-grid">
          <article className="capability-card">
            <h3>Source repositories</h3>
            <p>
              Runtime:{" "}
              <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                github.com/sskycn/tcptun-go
              </a>
              . Website:{" "}
              <a href={githubLinks.site} target="_blank" rel="noreferrer">
                github.com/sskycn/tcptun
              </a>
              .
            </p>
          </article>
          <article className="capability-card">
            <h3>Release process</h3>
            <p>
              CLI binaries ship inside the public npm package{" "}
              <a href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
                tcptun@{releaseVersion}
              </a>
              . Tagged releases:{" "}
              <a href={githubLinks.runtimeReleases} target="_blank" rel="noreferrer">
                GitHub Releases
              </a>
              .
            </p>
          </article>
          <article className="capability-card">
            <h3>Build identity</h3>
            <p>
              Runtime builds expose version identity (for example CoreVersion / build metadata on
              supported bridges). Prefer matching versions on both tunnel ends for mux and resume.
            </p>
          </article>
          <article className="capability-card">
            <h3>Package layout</h3>
            <p>
              Individual files:{" "}
              <code>
                {npmLinks.binaryBase}/tcptun-&lt;platform&gt;-&lt;arch&gt;
              </code>
              . Tarball:{" "}
              <a href={npmLinks.tarball}>{npmLinks.tarball}</a>.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Installation safety</p>
          <h2>Do not pipe untrusted scripts blindly.</h2>
          <p>
            The one-liner is convenient: <code>{installCommand}</code>. Safer flow: download,
            inspect, then run. Or install via npm without shell piping.
          </p>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>recommended install flow</span>
            <CopyButton value={installSafe} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{installSafe}</code>
          </pre>
        </div>
        <ul className="diff-list">
          <li>
            Pinned: <code>{pinnedInstallCommand}</code>
          </li>
          <li>
            npm: <code>{npmInstallCommand}</code>
          </li>
          <li>
            Raw installer: <a href="/install.sh">https://tcptun.com/install.sh</a>
          </li>
        </ul>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Runtime properties</p>
          <h2>Security-relevant defaults.</h2>
        </div>
        <div className="capability-grid">
          {properties.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="hero-actions" style={{ marginTop: 24 }}>
          <Link className="button secondary" href="/legal/">
            Legal disclaimer
          </Link>
          <Link className="button ghost" href="/privacy/">
            Privacy
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
