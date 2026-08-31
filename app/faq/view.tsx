import FaqSection from "../faq-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function FaqView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.faq.heading}
        title={t.faq.heroTitle}
        description={t.faq.heroLead}
        actions={[
          { href: "/examples/", label: t.nav.examples, variant: "secondary" },
          { href: "/legal/", label: t.nav.legal, variant: "ghost" },
        ]}
      />
      <FaqSection />
    </SiteChrome>
  );
}

