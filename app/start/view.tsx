import Image from "next/image";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import { PlatformDownloadButton } from "../platform-download";
import SiteChrome from "../site-chrome";
import { getDictionary, type Locale } from "../i18n";
import { releaseVersion } from "../site-data";

const displayVersion = `v${releaseVersion}`;

const workflowCommands: Record<string, string> = {
  run: "tcptun --config config.json",
  check: "tcptun config check --config config.json",
  generate:
    "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
  uri: "tcptun uri import --input client.uri --client --output client.json",
  quic: "tcptun config native --quic --server proxy.example.com --port 9443",
  resume: `# on both server inbound and client outbound mux blocks
"mux": {
  "enabled": true,
  "resume": true,
  "resume_timeout": "15s",
  "resume_buffer_size": 4194304
}`,
};

export function StartView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.nav.cli}
        title={t.start.heroTitle}
        description={t.start.heroLead}
        actions={[
          { href: "/download/", label: t.nav.download, variant: "primary" },
          { href: "/examples/", label: t.nav.examples, variant: "secondary" },
        ]}
      />

      <section className="section quickstart-section">
        <div className="mode-grid">
          {t.start.workflows.map((item, index) => {
            const command = workflowCommands[item.name] ?? "";
            return (
            <article className="mode-card" key={item.name}>
              <div className="mode-meta">
                <span className="mode-name">{item.name}</span>
                <span className="mode-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="mode-command-row">
                <pre>
                  <code>{command}</code>
                </pre>
                <CopyButton value={command} label={t.common.copy} className="copy-button-on-dark" />
              </div>
            </article>
            );
          })}
        </div>
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>{t.start.downloadRun}</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>
    </SiteChrome>
  );
}

