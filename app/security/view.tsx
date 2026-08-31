import Link from "next/link";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import {
  githubLinks,
  installCommand,
  npmInstallCommand,
  npmLinks,
  pinnedInstallCommand,
  releaseVersion,
} from "../site-data";
import { getDictionary, interpolate, type Locale } from "../i18n";

const displayVersion = `v${releaseVersion}`;

const installSafe = `# 1) Download installer for inspection
curl -fsSL https://tcptun.com/install.sh -o install-tcptun.sh

# 2) Read it
less install-tcptun.sh

# 3) Run only if you accept the script
sh install-tcptun.sh

# Prefer pinning a version
TCPTUN_VERSION=${releaseVersion} sh install-tcptun.sh

# Or install from npm without curl|sh
npm install -g tcptun@${releaseVersion}`;

export function SecurityView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.security.title}
        title={t.security.heroTitle}
        description={t.security.heroLead}
        actions={[
          { href: githubLinks.runtime, label: t.security.runtimeSource, variant: "primary" },
          { href: githubLinks.runtimeReleaseTag, label: interpolate(t.security.release, { version: displayVersion }), variant: "secondary" },
          { href: "/download/", label: t.nav.download, variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.security.supplyEyebrow}</p>
          <h2>{t.security.supplyTitle}</h2>
        </div>
        <div className="capability-grid">
          <article className="capability-card">
            <h3>{t.security.reposTitle}</h3>
            <p>
              {interpolate(t.security.reposBody, {
                runtime: "github.com/gostartkit/tcptun-go",
                site: "github.com/sskycn/tcptun",
              })}
            </p>
            <p>
              <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                gostartkit/tcptun-go
              </a>
              {" · "}
              <a href={githubLinks.site} target="_blank" rel="noreferrer">
                sskycn/tcptun
              </a>
            </p>
          </article>
          <article className="capability-card">
            <h3>{t.security.processTitle}</h3>
            <p>{interpolate(t.security.processBody, { version: releaseVersion })}</p>
            <p>
              <a href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
                tcptun@{releaseVersion}
              </a>
              {" · "}
              <a href={githubLinks.runtimeReleases} target="_blank" rel="noreferrer">
                GitHub Releases
              </a>
            </p>
          </article>
          <article className="capability-card">
            <h3>{t.security.identityTitle}</h3>
            <p>{t.security.identityBody}</p>
          </article>
          <article className="capability-card">
            <h3>{t.security.layoutTitle}</h3>
            <p>
              Individual files:{" "}
              <code>
                {npmLinks.binaryBase}/tcptun-&lt;platform&gt;-&lt;arch&gt;
              </code>
              . Tarball:{" "}
              <a href={npmLinks.tarball}>{npmLinks.tarball}</a>.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.security.installEyebrow}</p>
          <h2>{t.security.installTitle}</h2>
          <p>
            {t.security.installLead} <code>{installCommand}</code>
          </p>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>{t.security.flowLabel}</span>
            <CopyButton value={installSafe} label="Copy" className="copy-button-ghost" />
          </div>
          <pre>
            <code>{installSafe}</code>
          </pre>
        </div>
        <ul className="diff-list">
          <li>
            Pinned: <code>{pinnedInstallCommand}</code>
          </li>
          <li>
            npm: <code>{npmInstallCommand}</code>
          </li>
          <li>
            {t.security.rawInstaller}{" "}
            <a href="/install.sh">https://tcptun.com/install.sh</a>
          </li>
        </ul>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.security.runtimeEyebrow}</p>
          <h2>{t.security.runtimeTitle}</h2>
        </div>
        <div className="capability-grid">
          {t.security.properties.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="hero-actions" style={{ marginTop: 24 }}>
          <Link className="button secondary" href="/legal/">
            {t.nav.legal}
          </Link>
          <Link className="button ghost" href="/privacy/">
            {t.nav.privacy}
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}

