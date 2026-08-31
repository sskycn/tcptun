import type { Metadata } from "next";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import XrayConverter from "../xray-converter";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: "Xray convert",
  description: "Convert Xray JSON or vless/vmess/trojan share links into tcptun configs in the browser.",
};

export default function ConvertPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Convert"
        title="Xray config → tcptun."
        description={`Browser conversion still accepts Xray JSON and vless/vmess/trojan links, but tcptun v${releaseVersion} will not run those tunnel types. Rebuild as native before deploying.`}
        actions={[
          { href: "/generate/", label: "Generate fresh pair", variant: "secondary" },
          { href: "/examples/", label: "tcptun examples", variant: "ghost" },
        ]}
      />
      <XrayConverter />
    </SiteChrome>
  );
}
