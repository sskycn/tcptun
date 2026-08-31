import LocalizedLink from "../localized-link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";
import { githubLinks } from "../site-data";

export function ArchitectureView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.architecture.title}
        title={t.architecture.heroTitle}
        description={t.architecture.heroLead}
        actions={[
          { href: "/embed/", label: t.nav.goSdk, variant: "primary" },
          { href: "/config/", label: t.nav.configuration, variant: "secondary" },
          { href: githubLinks.runtime, label: t.common.source, variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.architecture.pipelineEyebrow}</p>
          <h2>{t.architecture.pipelineTitle}</h2>
        </div>
        <pre className="arch-diagram" aria-label={t.architecture.pipelineTitle}>
          <code>{t.architecture.diagram}</code>
        </pre>
        <div className="capability-grid">
          {t.architecture.pipeline.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">{t.common.stage}</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.architecture.propertiesEyebrow}</p>
          <h2>{t.architecture.propertiesTitle}</h2>
        </div>
        <div className="capability-grid">
          {t.architecture.properties.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={(index + 1) % 3}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.architecture.surfacesEyebrow}</p>
            <h2>{t.architecture.surfacesTitle}</h2>
            <p>{t.architecture.surfacesBody}</p>
          </div>
          <div className="hero-actions">
            <LocalizedLink className="button secondary" href="/embed/">
              {t.nav.embed}
            </LocalizedLink>
            <LocalizedLink className="button ghost" href="/use-cases/">
              {t.nav.useCases}
            </LocalizedLink>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}

