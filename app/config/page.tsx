import type { Metadata } from "next";
import ConfigSection from "../config-section";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Config · tcptun v${releaseVersion}`,
  description:
    "tcptun JSON topology docs: native, REALITY auto carriers, resumable streams, reverse publish, and protocol comparison.",
};

export default function ConfigPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Config"
        title="JSON topology, native, and REALITY."
        description="Describe inbounds, outbounds, and security in one strict config. Focus on native + raw + reality automatic carriers, resumable streams, and field reference."
        actions={[
          { href: "/examples/", label: "Worked examples", variant: "primary" },
          { href: "/generate/", label: "Generate pair", variant: "secondary" },
          { href: "/protocols/native/", label: "Native guide", variant: "ghost" },
        ]}
      />
      <ConfigSection />
    </SiteChrome>
  );
}
