import LocalizedLink from "../localized-link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { androidAppLinks } from "../site-data";
import { getDictionary, type Locale } from "../i18n";

const hrefs: Record<string, string> = {
  "private-proxy": "/guide/",
  reverse: "/config/#reverse",
  android: androidAppLinks.playStore,
  embed: "/embed/",
  "multi-site": "/examples/",
  interop: "/protocols/",
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function UseCasesView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.useCases.title}
        title={t.useCases.heroTitle}
        description={t.useCases.heroLead}
        actions={[
          { href: "/guide/", label: t.useCases.getStarted, variant: "primary" },
          { href: "/architecture/", label: t.useCases.architecture, variant: "secondary" },
          { href: androidAppLinks.playStore, label: t.useCases.androidApp, variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="capability-grid">
          {t.useCases.items.map((item, index) => {
            const href = hrefs[item.id] || "/";
            return (
              <article className="capability-card" key={item.id} id={item.id} data-tone={index % 3}>
                <div className="capability-meta">
                  <span className="capability-label">{t.useCases.label}</span>
                  <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {isExternalHref(href) ? (
                  <a className="protocol-doc-link" href={href} target="_blank" rel="noreferrer">
                    {item.cta} →
                  </a>
                ) : (
                  <LocalizedLink className="protocol-doc-link" href={href}>
                    {item.cta} →
                  </LocalizedLink>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </SiteChrome>
  );
}

