import type { Metadata } from "next";
import LanShare from "../lan-share";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Direct chat · tcptun v${releaseVersion}`,
  description:
    "WeChat-style chat with optional STUN/TURN. Default is LAN-only; configure ICE servers for cross-network peers.",
};

export default function LanPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Direct chat"
        title="Contacts on the left. Chat on the right."
        description="Default is LAN-only (no STUN/TURN). Configure your own STUN and TURN servers for NAT traversal. Messages use secure Markdown over WebRTC DataChannels."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/guide/", label: "Setup wizard", variant: "ghost" },
        ]}
      />
      <LanShare />
    </SiteChrome>
  );
}
