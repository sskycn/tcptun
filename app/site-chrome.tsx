import Image from "next/image";
import Link from "next/link";
import CookieBanner from "./cookie-banner";
import CookieSettingsLink from "./cookie-settings-link";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import { npmLinks, releaseVersion, tunnelProtocols } from "./site-data";

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
                <strong>tcptun {displayVersion}</strong>
                <p>Config-driven proxy runtime</p>
              </div>
            </div>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <h3>Product</h3>
              <Link href="/">Home</Link>
              <Link href="/guide/">Wizard</Link>
              <Link href="/lan/">Chat</Link>
              <Link href="/config/">Config</Link>
              <Link href="/generate/">Generate</Link>
              <Link href="/uri/">URI</Link>
              <Link href="/convert/">Convert</Link>
              <Link href="/protocols/">Protocols</Link>
              <Link href="/examples/">Examples</Link>
              <Link href="/start/">CLI</Link>
              <Link href="/faq/">FAQ</Link>
              <Link href="/legal/">Legal</Link>
              <Link href="/privacy/">Privacy</Link>
              <CookieSettingsLink className="footer-text-button" />
            </div>
            <div className="footer-column">
              <h3>Download</h3>
              <Link href="/download/">Binaries</Link>
              <a href={npmLinks.package} target="_blank" rel="noreferrer">
                npm
              </a>
              <a href={npmLinks.tarball}>tarball</a>
              <a href="/install.sh">install.sh</a>
            </div>
            <div className="footer-column">
              <h3>Protocols</h3>
              {tunnelProtocols.map((protocol) => (
                <Link href="/protocols/" key={protocol.name}>
                  {protocol.name}
                </Link>
              ))}
              <Link href="/protocols/native/">Native guide</Link>
              <Link href="/examples/">Use cases</Link>
              <Link href="/config/#protocol-compare">Compare</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            tcptun {displayVersion} ·{" "}
            <strong>Lawful use only · You bear all consequences · No warranty or promise.</strong>{" "}
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
