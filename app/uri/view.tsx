import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import UriConverter from "../uri-converter";
import { getDictionary, type Locale } from "../i18n";

export function UriView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.uri.title}
        title={t.uri.title}
        description={t.generate.heroLead}
        actions={[
          { href: "/generate/", label: t.nav.configGenerator, variant: "secondary" },
          { href: "/examples/", label: t.nav.examples, variant: "ghost" },
        ]}
      />
      <UriConverter />
    </SiteChrome>
  );
}

