import type { Metadata } from "next";
import LanShare from "../lan-share";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `LAN share · tcptun v${releaseVersion}`,
  description:
    "Automatically discover peers in a shared room and chat or send files over WebRTC. Share tcptun configs without cables or accounts.",
};

export default function LanPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="LAN share"
        title="Auto-discover room peers. Chat and send files."
        description="Join a room name (default tcptun-lan). Peers who open this page with the same room appear automatically. Chat, share configs, and transfer files over WebRTC DataChannels."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/guide/", label: "Setup wizard", variant: "ghost" },
        ]}
      />
      <LanShare />
    </SiteChrome>
  );
}
