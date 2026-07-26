import type { Metadata } from "next";
import DisclaimerSection from "../disclaimer-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Legal · tcptun v${releaseVersion}`,
  description: "tcptun disclaimer: lawful use only, you bear all consequences, no warranty or promise.",
};

export default function LegalPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Legal"
        title="Disclaimer and cookies."
        description="Use this software only under lawful conditions. You assume all consequences. The author provides no warranty or promise."
      />
      <DisclaimerSection />
    </SiteChrome>
  );
}
