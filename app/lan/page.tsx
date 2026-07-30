import type { Metadata } from "next";
import LanShare from "../lan-share";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Chat · tcptun v${releaseVersion}`,
  description: "Discover nearby users and chat privately. Optional STUN/TURN for connections beyond the local network.",
};

export default function LanPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Chat"
        title="Nearby users. Private conversations."
        description="Users on the same network appear automatically. Messages, configs, and files are end-to-end encrypted between peers. Add STUN/TURN only if you need to reach people outside the local network."
        actions={[
          { href: "/generate/", label: "Generate config", variant: "secondary" },
          { href: "/guide/", label: "Setup wizard", variant: "ghost" },
        ]}
      />
      <LanShare />
    </SiteChrome>
  );
}
