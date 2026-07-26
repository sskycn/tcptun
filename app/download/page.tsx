import type { Metadata } from "next";
import PageHero from "../page-hero";
import { DownloadSection } from "../platform-download";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Download tcptun v${releaseVersion}`,
  description: "Download multi-platform tcptun binaries for macOS, Linux, Windows, and Android.",
};

export default function DownloadPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Download"
        title="Multi-platform binaries, ready to run."
        description={`Hosted on this site's GitHub Pages under /releases/${releaseVersion}/. Pick a build or use one-line install.`}
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
