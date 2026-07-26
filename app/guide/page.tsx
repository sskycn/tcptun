import type { Metadata } from "next";
import GuideWizard from "../guide-wizard";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Setup wizard · tcptun v${releaseVersion}`,
  description:
    "Interactive wizard supporting native, VLESS, VMess, and Trojan. native + raw + reality is recommended first; generates runnable server/client configs and a runbook.",
};

export default function GuidePage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Wizard"
        title="Choose a protocol. Fill the form. Get a runnable plan."
        description="All tunnel protocols are supported. native + raw + reality (QUIC-first auto carriers) is listed first and recommended. Generate server.json, client.json, and a complete install/check/run checklist."
        actions={[
          { href: "/download/", label: "Download binaries", variant: "secondary" },
          { href: "/examples/", label: "More examples", variant: "ghost" },
        ]}
      />
      <GuideWizard />
    </SiteChrome>
  );
}
