import type { Metadata } from "next";
import GuideWizard from "../guide-wizard";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Setup wizard · tcptun v${releaseVersion}`,
  description:
    "Step-by-step wizard to deploy tcptun with native + raw + reality automatic dual carriers.",
};

export default function GuidePage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Wizard"
        title="Set up native + raw + reality step by step."
        description="A guided path for first-time operators: install, generate a Reality-auto pair, validate, start server then client, and test the local proxy on 127.0.0.1:1080."
        actions={[
          { href: "/generate/", label: "Open generator", variant: "secondary" },
          { href: "/download/", label: "Download", variant: "ghost" },
        ]}
      />
      <GuideWizard />
    </SiteChrome>
  );
}
