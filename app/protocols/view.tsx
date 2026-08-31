import Link from "next/link";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import ProtocolIcon from "../protocol-icon";
import SiteChrome from "../site-chrome";
import { getDictionary, interpolate, type Locale } from "../i18n";
import { releaseVersion, tunnelProtocols } from "../site-data";

const transports = ["raw", "ws", "h2", "h3"] as const;

export function ProtocolsView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.protocols.title}
        title={t.protocols.heroTitle}
        description={interpolate(t.protocols.heroLead, { version: releaseVersion })}
        actions={[
          { href: "/protocols/native/", label: t.protocols.nativeGuide, variant: "primary" },
          { href: "/examples/", label: t.protocols.allExamples, variant: "secondary" },
          { href: "/config/", label: t.protocols.configRef, variant: "ghost" },
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
                <span className="security-badge">{t.protocols.nativeCredential}</span>
              </div>
              <p className="protocol-description">{t.protocols.nativeDescription}</p>
              <dl>
                <div>
                  <dt>{t.protocols.interop}</dt>
                  <dd>{t.protocols.nativeInterop}</dd>
                </div>
                <div>
                  <dt>{t.protocols.defaultSecurity}</dt>
                  <dd>{t.protocols.nativeSecurity}</dd>
                </div>
                <div className="wide">
                  <dt>{t.protocols.mux}</dt>
                  <dd>{t.protocols.nativeMux}</dd>
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
                {protocol.name === "native" ? t.protocols.nativeGuideCta : t.protocols.useCasesCta}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}

