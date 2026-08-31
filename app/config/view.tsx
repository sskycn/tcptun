import ConfigSection from "../config-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function ConfigView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.config.title}
        title={t.config.heroTitle}
        description={t.config.heroLead}
        actions={[
          { href: "/examples/", label: t.nav.examples, variant: "primary" },
          { href: "/generate/", label: t.examples.generatePair, variant: "secondary" },
          { href: "/protocols/native/", label: t.nav.nativeProtocol, variant: "ghost" },
        ]}
      />
      <ConfigSection />
    </SiteChrome>
  );
}

