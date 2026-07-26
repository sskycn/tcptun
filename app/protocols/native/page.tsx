import type { Metadata } from "next";
import NativeGuide from "../../native-guide";
import PageHero from "../../page-hero";
import SiteChrome from "../../site-chrome";
import { releaseVersion } from "../../site-data";

export const metadata: Metadata = {
  title: `Native protocol · tcptun v${releaseVersion}`,
  description:
    "Native tunnel protocol guide: install, generate, Reality auto carriers, resumable streams, reverse publish, and worked examples.",
};

export default function NativeProtocolPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Native protocol"
        title="How native works end to end."
        description="Private, low-overhead tunneling for tcptun-to-tcptun setups with mux, QUIC-first REALITY auto carriers, resumable TCP, and reverse publish."
        actions={[
          { href: "/examples/", label: "More examples", variant: "secondary" },
          { href: "/config/#native-carriers", label: "Reality auto details", variant: "ghost" },
        ]}
      />
      <NativeGuide />
    </SiteChrome>
  );
}
