import type { Metadata } from "next";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import UriConverter from "../uri-converter";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `URI tools · tcptun v${releaseVersion}`,
  description: "Convert tcptun configs, share URIs, and QR codes for native, VLESS, VMess, and Trojan.",
};

export default function UriPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="URI"
        title="Config, share URIs, and QR codes."
        description="Export and import native / VLESS / VMess / Trojan endpoints. QR codes use compact T3 profiles; import still accepts T2 and plain URIs."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/convert/", label: "Xray convert", variant: "ghost" },
        ]}
      />
      <UriConverter />
    </SiteChrome>
  );
}
