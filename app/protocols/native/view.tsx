import NativeGuide from "../../native-guide";
import PageHero from "../../page-hero";
import SiteChrome from "../../site-chrome";
import { getDictionary, interpolate, type Locale } from "../../i18n";
import { releaseVersion } from "../../site-data";

export function NativeProtocolView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.nav.nativeProtocol}
        title={t.protocols.nativeTitle}
        description={interpolate(t.protocols.heroLead, { version: releaseVersion })}
        actions={[
          { href: "/examples/", label: t.nav.examples, variant: "secondary" },
          { href: "/config/", label: t.nav.configuration, variant: "ghost" },
        ]}
      />
      <NativeGuide />
    </SiteChrome>
  );
}

