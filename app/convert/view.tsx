import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import XrayConverter from "../xray-converter";
import { getDictionary, interpolate, type Locale } from "../i18n";
import { releaseVersion } from "../site-data";

export function ConvertView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow="Convert"
        title={t.convert.heroTitle}
        description={interpolate(t.convert.heroLead, { version: releaseVersion })}
        actions={[
          { href: "/generate/", label: t.generate.browseExamples, variant: "secondary" },
          { href: "/examples/", label: t.nav.examples, variant: "ghost" },
        ]}
      />
      <XrayConverter />
    </SiteChrome>
  );
}

