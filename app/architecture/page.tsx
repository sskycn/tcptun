import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { githubLinks } from "../site-data";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "How tcptun compiles FileConfig into a fail-closed networking runtime: validation, RuntimeConfig, TCP/UDP/TUN, and routing.",
};

const pipeline = [
  {
    title: "FileConfig",
    body: "Strict JSON topology with unknown-field rejection. Inbounds, outbounds, route, DNS, and resource budgets.",
  },
  {
    title: "Validate",
    body: "Unique tags, reference integrity, auth material, transport/security combos, and capability checks before bind.",
  },
  {
    title: "Compile",
    body: "Produce RuntimeConfig: compiled outbound graph, route table, and prepared listeners — not ad-hoc runtime parsing.",
  },
  {
    title: "Serve",
    body: "One process serves TCP, UDP, TUN, reverse publish, and packet paths with shared routing and diagnostics.",
  },
] as const;

const properties = [
  {
    title: "Fail closed",
    body: "Invalid config never partially starts. DNS fake-IP and routing refuse unsafe fallbacks when validation fails.",
  },
  {
    title: "Deterministic routing",
    body: "Rules and default_outbound are compiled; balance and chain hops are cycle-checked and finite.",
  },
  {
    title: "Resource bounds",
    body: "Mux pools, resume buffers, and packet paths use explicit budgets so memory behavior stays predictable.",
  },
  {
    title: "Observable runtime",
    body: "Log levels, bridge identity, and runtime statistics surface for operators and embedders.",
  },
] as const;

export default function ArchitecturePage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Architecture"
        title="Compile before serve."
        description="tcptun is a programmable networking runtime: configuration is validated and compiled into an explicit graph, then the process serves that graph. This page is the technical model behind the CLI, Go SDK, and Android integration."
        actions={[
          { href: "/embed/", label: "Go SDK", variant: "primary" },
          { href: "/config/", label: "Configuration", variant: "secondary" },
          { href: githubLinks.runtime, label: "Source", variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Pipeline</p>
          <h2>From FileConfig to networking runtime.</h2>
        </div>
        <pre className="arch-diagram" aria-label="Architecture diagram">
          <code>{`Configuration (JSON)
        |
        v
    FileConfig
        |
     validate
        |
     compile
        |
   RuntimeConfig
        |
        v
 Networking Runtime
   |      |      |      |
  TCP    UDP    TUN   Routing`}</code>
        </pre>
        <div className="capability-grid">
          {pipeline.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">Stage</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Properties</p>
          <h2>Why the model builds trust.</h2>
        </div>
        <div className="capability-grid">
          {properties.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={(index + 1) % 3}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">Surfaces</p>
            <h2>Same runtime, multiple hosts.</h2>
            <p>
              CLI loads FileConfig. Embedders construct the engine packages directly. Android bridge
              injects TUN and control plane hooks. The compiled model stays the same.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="button secondary" href="/embed/">
              Embed
            </Link>
            <Link className="button ghost" href="/use-cases/">
              Use cases
            </Link>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
