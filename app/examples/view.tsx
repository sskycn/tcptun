import ExamplesBrowser from "../examples-browser";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, interpolate, type Locale } from "../i18n";
import { releaseVersion } from "../site-data";

export function ExamplesView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.examples.title}
        title={t.examples.heroTitle}
        description={interpolate(t.examples.heroLead, { version: releaseVersion })}
        actions={[
          { href: "/examples/#native-reality", label: t.examples.realityAuto, variant: "primary" },
          { href: "/generate/", label: t.examples.generatePair, variant: "secondary" },
          { href: "/config/", label: t.examples.configRef, variant: "ghost" },
        ]}
      />
      <ExamplesBrowser />
    </SiteChrome>
  );
}

