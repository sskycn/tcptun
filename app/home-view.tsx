import Image from "next/image";
import CopyButton from "./copy-button";
import InstallCommand from "./install-command";
import LocalizedLink from "./localized-link";
import { PlatformDownloadButton } from "./platform-download";
import SiteChrome from "./site-chrome";
import { getDictionary, interpolate, type Locale } from "./i18n";
import { githubLinks, installCommand, releaseVersion } from "./site-data";

const displayVersion = `v${releaseVersion}`;

const terminalSnippet = `$ ${installCommand}

$ npm install -g tcptun

$ tcptun --config config.json

$ tcptun config check --config config.json

# Go module
import "pkg.tcptun.com/net"`;

export default function HomeView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);

  return (
    <SiteChrome locale={locale}>
      <section className="hero hero-runtime" id="top">
        <div className="hero-copy">
          <div className="release-line">
            <span className="version-badge">
              <span className="pulse-dot" aria-hidden="true" />
              {displayVersion}
            </span>
            <span className="release-tagline">{t.home.runtime}</span>
          </div>
          <h1>
            {t.home.h1a}
            <br />
            <span className="title-accent">{t.home.h1b}</span>
          </h1>
          <p className="lede">{t.meta.description}</p>
          <div className="hero-actions">
            <LocalizedLink className="button primary" href="/guide/">
              {t.home.getStarted}
            </LocalizedLink>
            <LocalizedLink className="button secondary" href="/docs/">
              {t.home.documentation}
            </LocalizedLink>
            <a className="button ghost" href={githubLinks.runtime} target="_blank" rel="noreferrer">
              {t.nav.github}
            </a>
            <LocalizedLink className="button ghost" href="/download/">
              {t.home.download}
            </LocalizedLink>
          </div>
          <p className="hero-run-modes">
            {locale === "zh" ? (
              <>
                可作为 <strong>{t.home.cli}</strong>、<strong>{t.home.android}</strong>、
                <strong>{t.home.go}</strong> 或 <strong>{t.home.engine}</strong> 运行。
              </>
            ) : (
              <>
                Run as <strong>{t.home.cli}</strong>, <strong>{t.home.android}</strong>,{" "}
                <strong>{t.home.go}</strong>, or <strong>{t.home.engine}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="terminal" aria-label="tcptun command preview">
          <div className="terminal-heading">
            <div className="terminal-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="terminal-title">tcptun · {displayVersion}</span>
            <CopyButton value={terminalSnippet} className="copy-button-ghost" />
          </div>
          <pre className="terminal-body">
            <code>{terminalSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="section" id="what-is">
        <div className="section-heading">
          <p className="eyebrow">{t.home.whatEyebrow}</p>
          <h2>{t.home.whatTitle}</h2>
          <p>{t.home.whatBody}</p>
        </div>
        <ul className="diff-list">
          {t.home.diffs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section" id="paths">
        <div className="section-heading">
          <p className="eyebrow">{t.home.pathsEyebrow}</p>
          <h2>{t.home.pathsTitle}</h2>
        </div>
        <div className="path-grid">
          {t.home.paths.map((path) => (
            <LocalizedLink className="path-card" href={path.href} key={path.href}>
              <span className="capability-label">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="path-card-cta">{t.home.continue}</span>
            </LocalizedLink>
          ))}
        </div>
      </section>

      <section className="section" id="capabilities">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.home.coreEyebrow}</p>
            <h2>{t.home.coreTitle}</h2>
            <p>{t.home.coreLead}</p>
          </div>
          <LocalizedLink className="button secondary" href="/architecture/">
            {t.home.architecture}
          </LocalizedLink>
        </div>
        <div className="capability-grid">
          {t.home.capabilities.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">{t.home.coreLabel}</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture-section" id="architecture-preview">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.home.archEyebrow}</p>
            <h2>{t.home.archTitle}</h2>
            <p>{t.home.archLead}</p>
          </div>
          <LocalizedLink className="button secondary" href="/architecture/">
            {t.home.fullArchitecture}
          </LocalizedLink>
        </div>
        <div className="arch-flow" aria-label="Runtime compile pipeline">
          <div className="arch-flow-step">
            <span>01</span>
            <strong>FileConfig</strong>
            <p>{t.home.fileConfig}</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>02</span>
            <strong>Validate</strong>
            <p>{t.home.validate}</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>03</span>
            <strong>RuntimeConfig</strong>
            <p>{t.home.runtimeConfig}</p>
          </div>
          <div className="arch-flow-arrow" aria-hidden="true">
            →
          </div>
          <div className="arch-flow-step">
            <span>04</span>
            <strong>Serve</strong>
            <p>{t.home.serve}</p>
          </div>
        </div>
      </section>

      <section className="section protocol-section" id="native-vs-compat">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.home.protoEyebrow}</p>
            <h2>{t.home.protoTitle}</h2>
            <p>{interpolate(t.home.protoLead, { version: releaseVersion })}</p>
          </div>
          <LocalizedLink className="button secondary" href="/protocols/native/">
            {t.home.nativeGuide}
          </LocalizedLink>
        </div>
        <div className="split-panels">
          <article className="split-panel">
            <p className="capability-label">Native</p>
            <h3>{t.home.nativeTitle}</h3>
            <p>{t.home.nativeBody}</p>
            <LocalizedLink href="/protocols/native/">{t.home.nativeCta}</LocalizedLink>
          </article>
          <article className="split-panel">
            <p className="capability-label">{t.home.localLabel}</p>
            <h3>{t.home.localTitle}</h3>
            <p>{t.home.localBody}</p>
            <LocalizedLink href="/config/">{t.home.configCta}</LocalizedLink>
          </article>
        </div>
      </section>

      <section className="section" id="release">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{interpolate(t.home.releaseEyebrow, { version: displayVersion })}</p>
            <h2>{t.home.releaseTitle}</h2>
            <p>{t.home.releaseLead}</p>
          </div>
          <a className="button secondary" href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            {t.home.githubRelease}
          </a>
        </div>
        <div className="capability-grid">
          {t.home.releases.map((item, index) => (
            <article className="capability-card" key={item.title} data-tone={index % 3}>
              <div className="capability-meta">
                <span className="capability-label">{item.label}</span>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="trust">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.home.trustEyebrow}</p>
            <h2>{t.home.trustTitle}</h2>
            <p>{t.home.trustLead}</p>
          </div>
          <LocalizedLink className="button secondary" href="/security/">
            {t.home.securityPage}
          </LocalizedLink>
        </div>
        <div className="trust-strip">
          <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
            {t.home.sourceRuntime}
          </a>
          <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
            {interpolate(t.home.releaseTag, { version: displayVersion })}
          </a>
          <a href="/install.sh">{t.home.inspectInstall}</a>
          <LocalizedLink href="/download/">{t.home.binariesVerify}</LocalizedLink>
        </div>
        <InstallCommand variant="panel" />
      </section>

      <section className="section quickstart-section">
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>{t.home.nextStepTitle}</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>
    </SiteChrome>
  );
}
