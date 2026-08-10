import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { githubLinks } from "../site-data";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "tcptun documentation hub: getting started, architecture, configuration, protocols, embedding, and examples.",
};

const groups = [
  {
    title: "Getting started",
    links: [
      { href: "/guide/", label: "Setup wizard", body: "First tunnel with install, generate, check, run." },
      { href: "/start/", label: "CLI quickstart", body: "Commands for run, check, generate, import." },
      { href: "/download/", label: "Install & download", body: "npm package binaries and installer." },
    ],
  },
  {
    title: "Concepts",
    links: [
      { href: "/architecture/", label: "Architecture", body: "FileConfig → RuntimeConfig → serve." },
      { href: "/config/", label: "Configuration", body: "Topology fields, Reality auto, resume, reverse." },
      { href: "/faq/", label: "FAQ", body: "Common operational questions." },
    ],
  },
  {
    title: "Advanced",
    links: [
      { href: "/protocols/native/", label: "Native protocol", body: "Carriers, mux, resume, reverse." },
      { href: "/protocols/", label: "All protocols", body: "Native plus VLESS / VMess / Trojan." },
      { href: "/examples/", label: "Examples", body: "Copy-ready topologies." },
      { href: "/config/#resumable", label: "Resumable streams", body: "mux.resume scope and bounds." },
      { href: "/config/#reverse", label: "Reverse publish", body: "NAT-side TCP/UDP exposure." },
    ],
  },
  {
    title: "Embedding",
    links: [
      { href: "/embed/", label: "Go SDK", body: "pkg.tcptun.com/net and net contracts." },
      { href: "/use-cases/#android", label: "Android integration", body: "VPN-oriented platform path." },
      { href: githubLinks.runtime, label: "Runtime source", body: "sskycn/tcptun-go on GitHub.", external: true },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/generate/", label: "Config generator", body: "Browser-local key generation." },
      { href: "/uri/", label: "URI / QR tools", body: "Import and export endpoints." },
      { href: "/convert/", label: "Xray convert", body: "Wire configs → tcptun JSON (local)." },
      { href: "/guide/", label: "Setup wizard", body: "Guided first tunnel." },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/security/", label: "Security & trust", body: "Supply chain and install safety." },
      { href: "/legal/", label: "Legal", body: "Disclaimer and lawful use." },
      { href: "/privacy/", label: "Privacy", body: "Cookies and local processing." },
    ],
  },
] as const;

export default function DocsPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Documentation"
        title="Find the path, then the reference."
        description="Documentation is grouped for operators and embedders. Start with a first tunnel, learn the compile model, then open protocol and embedding references."
        actions={[
          { href: "/guide/", label: "Get started", variant: "primary" },
          { href: "/architecture/", label: "Architecture", variant: "secondary" },
          { href: "/embed/", label: "Go SDK", variant: "ghost" },
        ]}
      />

      <section className="section">
        {groups.map((group) => (
          <div className="docs-group" key={group.title}>
            <h2>{group.title}</h2>
            <div className="home-link-grid">
              {group.links.map((link) =>
                "external" in link && link.external ? (
                  <a className="home-link-card" href={link.href} key={link.href} target="_blank" rel="noreferrer">
                    <span className="capability-label">External</span>
                    <h3>{link.label}</h3>
                    <p>{link.body}</p>
                  </a>
                ) : (
                  <Link className="home-link-card" href={link.href} key={link.href}>
                    <span className="capability-label">Docs</span>
                    <h3>{link.label}</h3>
                    <p>{link.body}</p>
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </section>
    </SiteChrome>
  );
}
