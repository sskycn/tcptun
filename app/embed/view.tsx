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

export function EmbedView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.nav.embed}
        title={t.embed.heroTitle}
        description={t.embed.heroLead}
        actions={[
          { href: githubLinks.runtime, label: t.embed.runtimeSource, variant: "primary" },
          { href: "/architecture/", label: t.nav.architecture, variant: "secondary" },
          { href: "/docs/", label: t.nav.docsHub, variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.embed.moduleEyebrow}</p>
          <h2>{t.embed.moduleTitle}</h2>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>{t.embed.modulePath}</span>
            <CopyButton value={goImport} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{goImport}</code>
          </pre>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>{t.embed.snippetLabel}</span>
            <CopyButton value={goSnippet} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{goSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.embed.contractsEyebrow}</p>
          <h2>{t.embed.contractsTitle}</h2>
          <p>{t.embed.contractsLead}</p>
        </div>
        <div className="capability-grid">
          {t.embed.surfaces.map((item, index) => (
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
          <p className="eyebrow">{t.embed.whoEyebrow}</p>
          <h2>{t.embed.whoTitle}</h2>
        </div>
        <ul className="diff-list">
          {t.embed.audiences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="hero-actions" style={{ marginTop: 20 }}>
          <a className="button primary" href={githubLinks.runtime} target="_blank" rel="noreferrer">
            {t.embed.browseSource}
          </a>
          <LocalizedLink className="button secondary" href="/use-cases/">
            {t.nav.useCases}
          </LocalizedLink>
        </div>
      </section>
    </SiteChrome>
  );
}

