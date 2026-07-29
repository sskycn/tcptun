import type { Metadata } from "next";
import LanShare from "../lan-share";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Direct chat · tcptun v${releaseVersion}`,
  description:
    "Automatically discover online users and start private one-to-one chats or file transfers over WebRTC.",
};

export default function LanPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Direct chat"
        title="See who is online. Start a private chat."
        description="Your key is generated automatically and online users appear without a room name. Pick a user to chat, share configs, or transfer files directly over WebRTC DataChannels."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/guide/", label: "Setup wizard", variant: "ghost" },
        ]}
      />
      <LanShare />
    </SiteChrome>
  );
}
