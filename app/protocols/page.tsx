import type { Metadata } from "next";
import Link from "next/link";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import ProtocolIcon from "../protocol-icon";
import SiteChrome from "../site-chrome";
import { releaseVersion, tunnelProtocols } from "../site-data";

export const metadata: Metadata = {
  title: `Protocols · tcptun v${releaseVersion}`,
  description: "native, VLESS, VMess, and Trojan tunnel protocols in one tcptun topology model.",
};

const transports = ["raw", "ws", "h2", "h3"] as const;

export default function ProtocolsPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Protocols"
        title="Four tunnel protocols, one topology."
        description="Xray compatibility is for wire protocols, not config file format. Prefer native for tcptun-to-tcptun; use vless / vmess / trojan for interop."
        actions={[
          { href: "/protocols/native/", label: "Native guide", variant: "primary" },
          { href: "/examples/", label: "All examples", variant: "secondary" },
          { href: "/config/#protocol-compare", label: "Compare table", variant: "ghost" },
        ]}
      />

      <section className="section protocol-section">
        <div className="chip-row protocol-page-chips">
          {transports.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="protocol-grid">
          {tunnelProtocols.map((protocol, index) => (
            <article className="protocol-card" key={protocol.name}>
              <div className="protocol-card-heading">
                <div className="protocol-title-row">
                  <ProtocolIcon name={protocol.name} />
                  <div>
                    <span className="protocol-index">{String(index + 1).padStart(2, "0")}</span>
                    <h3>{protocol.name}</h3>
                  </div>
                </div>
                <span className="security-badge">{protocol.credential}</span>
              </div>
              <p className="protocol-description">{protocol.description}</p>
              <dl>
                <div>
                  <dt>Interop</dt>
                  <dd>{protocol.interoperability}</dd>
                </div>
                <div>
                  <dt>Default security</dt>
                  <dd>{protocol.generatedSecurity}</dd>
                </div>
                <div className="wide">
                  <dt>Mux</dt>
                  <dd>{protocol.mux}</dd>
                </div>
              </dl>
              <div className="protocol-command-row">
                <pre className="protocol-command">
                  <code>{protocol.command}</code>
                </pre>
                <CopyButton value={protocol.command} label="Copy" className="copy-button-on-dark" />
              </div>
              <Link
                className="protocol-doc-link"
                href={protocol.name === "native" ? "/protocols/native/" : "/examples/"}
              >
                {protocol.name === "native" ? "Native guide →" : "Use cases →"}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}
