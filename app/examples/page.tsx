import type { Metadata } from "next";
import ExamplesBrowser from "../examples-browser";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Catalog of worked tcptun configs: native Reality auto/tcp/quic, resumable streams, reverse publish, balance, routing, chain, relay, VLESS, VMess, and Trojan.",
};

export default function ExamplesPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Examples"
        title="Configuration catalog, native first."
        description={`Browse every worked server/client pair for tcptun ${releaseVersion}: Reality carriers, reverse publish, topology patterns, then wire-interop protocols. Copy JSON, replace placeholders, validate, start the server first.`}
        actions={[
          { href: "/examples/#native-reality", label: "Reality auto", variant: "primary" },
          { href: "/generate/", label: "Generate pair", variant: "secondary" },
          { href: "/config/", label: "Config reference", variant: "ghost" },
        ]}
      />
      <ExamplesBrowser />
    </SiteChrome>
  );
}
