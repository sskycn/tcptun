import ConfigGenerator from "../config-generator";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function GenerateView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.generate.eyebrow}
        title={t.generate.heroTitle}
        description={t.generate.heroLead}
        actions={[
          { href: "/examples/", label: t.generate.browseExamples, variant: "secondary" },
          { href: "/uri/", label: t.generate.uriTools, variant: "ghost" },
        ]}
      />
      <ConfigGenerator />
    </SiteChrome>
  );
}

