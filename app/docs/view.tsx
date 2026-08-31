import PageHero from "../page-hero";
import LocalizedLink from "../localized-link";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function DocsView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.docs.title}
        title={t.docs.heroTitle}
        description={t.docs.heroLead}
        actions={[
          { href: "/guide/", label: t.docs.getStarted, variant: "primary" },
          { href: "/architecture/", label: t.docs.architecture, variant: "secondary" },
          { href: "/embed/", label: t.docs.goSdk, variant: "ghost" },
        ]}
      />
      <section className="section">
        {t.docs.groups.map((group) => (
          <div className="docs-group" key={group.title}>
            <h2>{group.title}</h2>
            <div className="home-link-grid">
              {group.links.map((link) =>
                "external" in link && link.external ? (
                  <a className="home-link-card" href={link.href} key={link.href} target="_blank" rel="noreferrer">
                    <span className="capability-label">External</span>
                    <h3>{link.label}</h3>
                    <p>{link.body}</p>
                  </a>
                ) : (
                  <LocalizedLink className="home-link-card" href={link.href} key={link.href}>
                    <span className="capability-label">Docs</span>
                    <h3>{link.label}</h3>
                    <p>{link.body}</p>
                  </LocalizedLink>
                ),
              )}
            </div>
          </div>
        ))}
      </section>
    </SiteChrome>
  );
}

