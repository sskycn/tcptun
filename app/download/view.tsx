import CopyButton from "../copy-button";
import LocalizedLink from "../localized-link";
import PageHero from "../page-hero";
import { DownloadSection } from "../platform-download";
import SiteChrome from "../site-chrome";
import { getDictionary, interpolate, type Locale } from "../i18n";
import {
  androidAppLinks,
  githubLinks,
  installCommand,
  npmInstallCommand,
  npmLinks,
  releaseVersion,
} from "../site-data";

const displayVersion = `v${releaseVersion}`;

const verifySnippet = `# Inspect installer before running
curl -fsSL https://tcptun.com/install.sh -o install-tcptun.sh
less install-tcptun.sh
TCPTUN_VERSION=${releaseVersion} sh install-tcptun.sh

# Or install the published package
${npmInstallCommand}

# Binary CDN layout (jsDelivr → npm package files)
# ${npmLinks.binaryBase}/tcptun-<os>-<arch>

# Tarball
# ${npmLinks.tarball}`;

export function DownloadView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const vars = {
    version: releaseVersion,
    packageId: androidAppLinks.packageId,
    appVersion: androidAppLinks.appVersion,
    runtimeVersion: androidAppLinks.runtimeVersion,
    cliVersion: releaseVersion,
    command: installCommand,
  };

  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.download.title}
        title={t.download.heroTitle}
        description={interpolate(t.download.heroLead, vars)}
        actions={[
          { href: "/security/", label: t.download.securityTrust, variant: "primary" },
          { href: androidAppLinks.playStore, label: t.download.androidPlay, variant: "secondary" },
          { href: "/start/", label: t.download.cliQuickstart, variant: "ghost" },
        ]}
      />

      <section className="section">
        <div className="trust-strip">
          <span>
            {t.download.version} <strong>{displayVersion}</strong>
          </span>
          <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            {t.download.sourceTag}
          </a>
          <a href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
            {t.download.npmPackage}
          </a>
          <a href={androidAppLinks.playStore} target="_blank" rel="noreferrer">
            {t.download.googlePlay}
          </a>
          <a href={npmLinks.tarball}>{t.download.tarball}</a>
          <a href="/install.sh">install.sh</a>
        </div>
      </section>

      <section className="section download-section" id="android">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.download.androidEyebrow}</p>
            <h2>{t.download.androidTitle}</h2>
            <p>
              {interpolate(t.download.androidLead, vars).split(androidAppLinks.packageId)[0]}
              <code>{androidAppLinks.packageId}</code>
              {interpolate(t.download.androidLead, vars).split(androidAppLinks.packageId)[1]}
            </p>
            <p>
              <strong>{interpolate(t.download.androidWarn, vars)}</strong>
            </p>
          </div>
          <div className="download-heading-actions">
            <a
              className="button primary"
              href={androidAppLinks.playStore}
              target="_blank"
              rel="noreferrer"
            >
              {t.download.getPlay}
            </a>
            <LocalizedLink className="button ghost" href="/privacy/#android-client">
              {t.download.androidPrivacy}
            </LocalizedLink>
          </div>
        </div>
        <div className="platform-recommend">
          <div className="platform-recommend-copy">
            <span className="platform-recommend-badge">Android</span>
            <div>
              <strong>{interpolate(t.download.clientName, vars)}</strong>
              <p>{interpolate(t.download.clientBody, vars)}</p>
            </div>
          </div>
          <a
            className="button secondary"
            href={androidAppLinks.playStore}
            target="_blank"
            rel="noreferrer"
          >
            {t.download.openPlay}
          </a>
        </div>
      </section>

      <section className="section download-section">
        <div className="section-heading">
          <p className="eyebrow">{t.download.platformsEyebrow}</p>
          <h2>{t.download.platformsTitle}</h2>
          <p>
            {t.download.platformsLead}
          </p>
        </div>
        <DownloadSection releaseVersion={releaseVersion} />
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">{t.download.verifyEyebrow}</p>
          <h2>{t.download.verifyTitle}</h2>
        </div>
        <div className="capability-grid">
          <article className="capability-card">
            <h3>{t.download.source}</h3>
            <p>
              {t.download.sourceBody}{" "}
              <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                sskycn/tcptun-go
              </a>
              .
            </p>
          </article>
          <article className="capability-card">
            <h3>{t.download.release}</h3>
            <p>
              <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
                {displayVersion}
              </a>
            </p>
          </article>
          <article className="capability-card">
            <h3>{t.download.package}</h3>
            <p>{t.download.packageBody}</p>
          </article>
          <article className="capability-card">
            <h3>{t.download.installer}</h3>
            <p>{interpolate(t.download.installerBody, vars)}</p>
          </article>
        </div>
        <div className="code-panel">
          <div className="code-panel-heading">
            <span>{t.download.inspectInstall}</span>
            <CopyButton value={verifySnippet} className="copy-button-ghost" />
          </div>
          <pre>
            <code>{verifySnippet}</code>
          </pre>
        </div>
        <div className="hero-actions" style={{ marginTop: 20 }}>
          <LocalizedLink className="button secondary" href="/security/">
            {t.download.fullSecurity}
          </LocalizedLink>
          <LocalizedLink className="button ghost" href="/guide/">
            {t.download.firstTunnel}
          </LocalizedLink>
        </div>
      </section>
    </SiteChrome>
  );
}

