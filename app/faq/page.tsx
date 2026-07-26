import type { Metadata } from "next";
import FaqSection from "../faq-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `FAQ · tcptun v${releaseVersion}`,
  description: "Frequently asked questions about tcptun configuration, native Reality auto carriers, and install.",
};

export default function FaqPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="FAQ"
        title="Answers for setup and day-two ops."
        description="Covering Xray interop, native + raw + reality auto mode, resumable streams, install paths, and routing."
        actions={[
          { href: "/examples/", label: "Examples", variant: "secondary" },
          { href: "/legal/", label: "Legal", variant: "ghost" },
        ]}
      />
      <FaqSection />
    </SiteChrome>
  );
}
