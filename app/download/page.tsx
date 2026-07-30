import type { Metadata } from "next";
import PageHero from "../page-hero";
import { DownloadSection } from "../platform-download";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Download tcptun v${releaseVersion}`,
  description:
    "Download multi-platform tcptun CLI binaries from the npm package for macOS, Linux, and Windows.",
};

export default function DownloadPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Download"
        title="Multi-platform binaries, ready to run."
        description={`CLI binaries are published on npm as tcptun@${releaseVersion}. Pick a platform build, install with npm, or use the one-line installer.`}
        actions={[
          { href: "/start/", label: "CLI quickstart", variant: "secondary" },
          { href: "/generate/", label: "Generate config", variant: "ghost" },
        ]}
      />
      <section className="section download-section">
        <DownloadSection releaseVersion={releaseVersion} />
      </section>
    </SiteChrome>
  );
}
