import GuideWizard from "../guide-wizard";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";

export function GuideView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.guide.title}
        title={t.generate.heroTitle}
        description={t.generate.heroLead}
        actions={[
          { href: "/download/", label: t.nav.download, variant: "secondary" },
          { href: "/examples/", label: t.nav.examples, variant: "ghost" },
        ]}
      />
      <GuideWizard />
    </SiteChrome>
  );
}

