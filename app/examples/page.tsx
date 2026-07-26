import type { Metadata } from "next";
import ExamplesBrowser from "../examples-browser";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Examples · tcptun v${releaseVersion}`,
  description:
    "Worked tcptun examples for native Reality auto, resumable streams, reverse publish, balance, route split, VLESS, VMess, and Trojan.",
};

export default function ExamplesPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Examples"
        title="Worked examples for every tunnel protocol."
        description="Complete server / client pairs for native Reality auto, resumable streams, reverse publish, balance, route split, VLESS, VMess, and Trojan. Copy, replace placeholders, validate, then start the server first."
        actions={[
          { href: "/generate/", label: "Generate pair", variant: "primary" },
          { href: "/protocols/native/", label: "Native guide", variant: "secondary" },
          { href: "/config/", label: "Config reference", variant: "ghost" },
        ]}
      />
      <ExamplesBrowser />
    </SiteChrome>
  );
}
