import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { androidAppLinks } from "../site-data";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "Practical uses for the tcptun networking runtime: private endpoints, reverse publish, Android VPN routing, Go embedding, and multi-site networking.",
};

const cases = [
  {
    id: "private-proxy",
    title: "Private endpoint",
    body: "Run your own private networking endpoint with a compiled topology: mixed local inbound, Native or interoperable tunnel outbound, and explicit routes.",
    href: "/guide/",
    cta: "Setup wizard",
  },
  {
    id: "reverse",
    title: "Reverse publishing",
    body: "Expose TCP/UDP services behind NAT through native mux tunnels. Server publish and client expose share service names across the mesh.",
    href: "/config/#reverse",
    cta: "Reverse docs",
  },
  {
    id: "android",
    title: "Android VPN runtime",
    body: "Build application-aware VPN routing with TUN, DNS, and outbound switching. The current Play Store app v0.2.52 embeds tcptun v0.2.5 — pair it with a v0.2.5 server, not CLI v0.4.2. Embedders can ship a newer bridge separately.",
    href: androidAppLinks.playStore,
    cta: "Google Play",
  },
  {
    id: "embed",
    title: "Go embedded networking",
    body: "Embed routing and transport capabilities in-process using standard net contracts instead of managing external proxy processes.",
    href: "/embed/",
    cta: "Go SDK",
  },
  {
    id: "multi-site",
    title: "Multi-site networking",
    body: "Connect distributed services with balance groups, chains, and deterministic route rules across compiled outbounds.",
    href: "/examples/",
    cta: "Examples",
  },
  {
    id: "interop",
    title: "Interop edge",
    body: "When ecosystems require VLESS, VMess, or Trojan on the wire, keep tcptun’s topology model and treat Xray compatibility as wire-level only.",
    href: "/protocols/",
    cta: "Protocols",
  },
] as const;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function UseCasesPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Use cases"
        title="What people build with a networking runtime."
        description="tcptun is not marketed as a consumer VPN product. These paths show how operators and developers use the same compiled runtime for private links, reverse publish, platform VPN, and embedded engines."
        actions={[
          { href: "/guide/", label: "Get started", variant: "primary" },
          { href: "/architecture/", label: "Architecture", variant: "secondary" },
          { href: androidAppLinks.playStore, label: "Android app", variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="capability-grid">
          {cases.map((item, index) => (
            <article className="capability-card" key={item.id} id={item.id} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">Use case</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {isExternalHref(item.href) ? (
                <a className="protocol-doc-link" href={item.href} target="_blank" rel="noreferrer">
                  {item.cta} →
                </a>
              ) : (
                <Link className="protocol-doc-link" href={item.href}>
                  {item.cta} →
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}
