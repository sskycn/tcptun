import CopyButton from "../copy-button";
import LocalizedLink from "../localized-link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";
import { githubLinks } from "../site-data";

const goImport = `import "pkg.tcptun.com/net"`;

const goSnippet = `// High-level idea — compose focused packages rather than shelling out to the CLI.
// See docs on the runtime repository for package layout.

import (
    "pkg.tcptun.com/net/endpoint"
    "pkg.tcptun.com/net/engine"
    "pkg.tcptun.com/net/route"
)

// Stream connections use net.Conn.
// Packet sessions adapt to net.Conn or net.PacketConn.
// Reusable transport sessions can surface as net.Listener.
// engine.PacketForwarder routes UDP through Direct or SOCKS5 UDP ASSOCIATE.`;

const surfaces = [
  { title: "net.Conn", body: "Stream tunnels and dialed sessions use the standard stream contract." },
  { title: "net.PacketConn", body: "Packet sessions adapt to connected or unconnected datagram APIs." },
  { title: "net.Listener", body: "Reusable transport sessions can be exposed as listeners." },
  { title: "endpoint.Dialer", body: "TCP and UDP dialing through compiled endpoint policies." },
  { title: "PacketDevice / TUN", body: "Platform packet devices enter the same compiled router." },
  { title: "Routing engine", body: "Application-aware route selection over the outbound graph." },
] as const;

const audiences = [
  "Go developers building network agents",
  "VPN and gateway applications",
  "Embedded systems and CPE-style devices",
  "Control planes that need in-process tunnels",
] as const;

export function EmbedView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.nav.embed}
        title={t.embed.heroTitle}
        description={t.embed.heroLead}
        actions={[
          { href: githubLinks.runtime, label: "Runtime source", variant: "primary" },
          { href: "/architecture/", label: "Architecture", variant: "secondary" },
          { href: "/docs/", label: "Docs hub", variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Module</p>
          <h2>Import the runtime.</h2>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>go.mod module path</span>
            <CopyButton value={goImport} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{goImport}</code>
          </pre>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>embedding surface (illustrative)</span>
            <CopyButton value={goSnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{goSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Contracts</p>
          <h2>Standard Go networking shapes.</h2>
          <p>
            Prefer composing focused packages. New integrations should not shell out to the binary
            when they can embed the engine.
          </p>
        </div>
        <div className="capability-grid">
          {surfaces.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <h3>
                <code>{item.title}</code>
              </h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Who embeds</p>
          <h2>Target embedders.</h2>
        </div>
        <ul className="diff-list">
          {audiences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="hero-actions" style={{ marginTop: 20 }}>
          <a className="button primary" href={githubLinks.runtime} target="_blank" rel="noreferrer">
            Browse tcptun-go
          </a>
          <LocalizedLink className="button secondary" href="/use-cases/">
            {t.nav.useCases}
          </LocalizedLink>
        </div>
      </section>
    </SiteChrome>
  );
}

