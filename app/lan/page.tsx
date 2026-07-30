import type { Metadata } from "next";
import LanShare from "../lan-share";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Direct chat · tcptun v${releaseVersion}`,
  description:
    "WeChat-style LAN chat: contacts on the left, secure Markdown conversation on the right, over WebRTC.",
};

export default function LanPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Direct chat"
        title="Contacts on the left. Chat on the right."
        description="Discover online users automatically. Open a private peer-to-peer conversation with secure Markdown rendering, config sharing, and file transfer over WebRTC DataChannels."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/guide/", label: "Setup wizard", variant: "ghost" },
        ]}
      />
      <LanShare />
    </SiteChrome>
  );
}
