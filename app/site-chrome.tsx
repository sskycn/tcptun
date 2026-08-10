import Image from "next/image";
import Link from "next/link";
import CookieBanner from "./cookie-banner";
import CookieSettingsLink from "./cookie-settings-link";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import { githubLinks, npmLinks, productTagline, releaseVersion } from "./site-data";

const displayVersion = `v${releaseVersion}`;

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <div className="page-bg" aria-hidden="true">
        <div className="page-bg-grid" />
        <div className="page-bg-glow page-bg-glow-a" />
        <div className="page-bg-glow page-bg-glow-b" />
        <div className="page-bg-glow page-bg-glow-c" />
      </div>

      <header className="topbar">
        <Link className="brand" href="/" aria-label="tcptun home">
          <Image src="/tcptun-logo.png" alt="" width={36} height={36} priority />
          <span>tcptun</span>
        </Link>
        <div className="topbar-actions">
          <SiteNav />
          <ThemeToggle />
        </div>
      </header>

      <div className="site-content">{children}</div>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <div className="footer-brand">
              <Image src="/tcptun-logo.png" alt="" width={36} height={36} />
              <div>
                <strong>tcptun</strong>
                <p>{productTagline}</p>
                <p className="footer-version">Latest runtime {displayVersion}</p>
              </div>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h3>Product</h3>
              <Link href="/guide/">Get started</Link>
              <Link href="/embed/">Go SDK</Link>
              <Link href="/use-cases/">Use cases</Link>
              <Link href="/download/">Download</Link>
              <Link href="/start/">CLI</Link>
            </div>
            <div className="footer-column">
              <h3>Documentation</h3>
              <Link href="/docs/">Docs hub</Link>
              <Link href="/architecture/">Architecture</Link>
              <Link href="/config/">Configuration</Link>
              <Link href="/protocols/">Protocols</Link>
              <Link href="/protocols/native/">Native protocol</Link>
              <Link href="/examples/">Examples</Link>
              <Link href="/security/">Security & trust</Link>
              <Link href="/faq/">FAQ</Link>
            </div>
            <div className="footer-column">
              <h3>Tools</h3>
              <Link href="/generate/">Config generator</Link>
              <Link href="/uri/">URI tools</Link>
              <Link href="/convert/">Xray convert</Link>
              <Link href="/guide/">Setup wizard</Link>
            </div>
            <div className="footer-column">
              <h3>Source & release</h3>
              <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                GitHub · runtime
              </a>
              <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
                Release {displayVersion}
              </a>
              <a href={npmLinks.package} target="_blank" rel="noreferrer">
                npm · tcptun
              </a>
              <a href="/install.sh">install.sh</a>
              <Link href="/legal/">Legal</Link>
              <Link href="/privacy/">Privacy</Link>
              <CookieSettingsLink className="footer-text-button" />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            tcptun {displayVersion} · programmable networking runtime ·{" "}
            <strong>Lawful use only · You bear all consequences · No warranty.</strong>{" "}
            <Link href="/legal/">Disclaimer</Link>
            {" · "}
            <CookieSettingsLink className="footer-text-button" />
          </span>
          <Link href="#top">Back to top</Link>
        </div>
      </footer>

      <CookieBanner />
    </main>
  );
}
