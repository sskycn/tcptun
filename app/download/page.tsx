import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import { DownloadSection } from "../platform-download";
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
  title: "Download",
  description:
    "Download the tcptun networking runtime CLI for macOS, Linux, and Windows. Binaries ship from the public npm package with source on GitHub.",
};

const displayVersion = `v${releaseVersion}`;

const verifySnippet = `# Inspect installer before running
curl -fsSL https://tcptun.com/install.sh -o install-tcptun.sh
less install-tcptun.sh
TCPTUN_VERSION=${releaseVersion} sh install-tcptun.sh

# Or install the published package
${npmInstallCommand}

# Binary CDN layout (jsDelivr → npm package files)
# ${npmLinks.binaryBase}/tcptun-<os>-<arch>

# Tarball
# ${npmLinks.tarball}`;

export default function DownloadPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Download"
        title="Multi-platform runtime binaries."
        description={`Latest published CLI: tcptun@${releaseVersion}. Binaries are files inside the npm package (not opaque third-party mirrors). Prefer inspect-then-run install or npm.`}
        actions={[
          { href: "/security/", label: "Security & trust", variant: "primary" },
          { href: "/start/", label: "CLI quickstart", variant: "secondary" },
          { href: githubLinks.runtimeReleaseTag, label: "GitHub release", variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="trust-strip">
          <span>
            Version <strong>{displayVersion}</strong>
          </span>
          <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            Source tag
          </a>
          <a href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
            npm package
          </a>
          <a href={npmLinks.tarball}>tarball</a>
          <a href="/install.sh">install.sh</a>
        </div>
      </section>

      <section className="section download-section">
        <div className="section-heading">
          <p className="eyebrow">Platform builds</p>
          <h2>Linux, macOS, Windows.</h2>
          <p>
            Each file is served from the published npm package layout under{" "}
            <code>dist/</code>. After install, run <code>tcptun --version</code> and match peers
            for mux/resume features.
          </p>
        </div>
        <DownloadSection releaseVersion={releaseVersion} />
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Verify</p>
          <h2>Why this binary path is inspectable.</h2>
        </div>
        <div className="capability-grid">
          <article className="capability-card">
            <h3>Source</h3>
            <p>
              Runtime repository:{" "}
              <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                sskycn/tcptun-go
              </a>
              .
            </p>
          </article>
          <article className="capability-card">
            <h3>Release</h3>
            <p>
              Tagged release and notes:{" "}
              <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
                {displayVersion}
              </a>
              .
            </p>
          </article>
          <article className="capability-card">
            <h3>Package</h3>
            <p>
              npm publishes the same <code>dist/</code> artifacts used by the installer and CDN
              links.
            </p>
          </article>
          <article className="capability-card">
            <h3>Installer</h3>
            <p>
              One-liner convenience: <code>{installCommand}</code>. Safer: download, read, pin
              version, then run — or use npm.
            </p>
          </article>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>inspect → install</span>
            <CopyButton value={verifySnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{verifySnippet}</code>
          </pre>
        </div>
        <div className="hero-actions" style={{ marginTop: 20 }}>
          <Link className="button secondary" href="/security/">
            Full security page
          </Link>
          <Link className="button ghost" href="/guide/">
            First tunnel wizard
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
