import DisclaimerSection from "../disclaimer-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function LegalView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.legal.eyebrow}
        title={t.legal.heroTitle}
        description={t.legal.heroLead}
      />
      <DisclaimerSection />
    </SiteChrome>
  );
}

