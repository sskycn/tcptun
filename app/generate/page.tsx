import type { Metadata } from "next";
import ConfigGenerator from "../config-generator";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Generate config · tcptun v${releaseVersion}`,
  description: "Generate matching tcptun server/client configs and URIs in the browser with local Web Crypto keys.",
};

export default function GeneratePage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Generate"
        title="Paired configs in the browser."
        description="Create server.json, client.json, and client.uri locally. Native defaults to v0.2.5 Reality auto carriers; optional resumable streams and forced QUIC."
        actions={[
          { href: "/examples/", label: "Browse examples", variant: "secondary" },
          { href: "/uri/", label: "URI tools", variant: "ghost" },
        ]}
      />
      <ConfigGenerator />
    </SiteChrome>
  );
}
