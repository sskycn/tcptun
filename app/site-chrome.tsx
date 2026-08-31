import Image from "next/image";
import CookieBanner from "./cookie-banner";
import CookieSettingsLink from "./cookie-settings-link";
import LanguageSwitcher from "./language-switcher";
import LocalizedLink from "./localized-link";
import { LocaleProvider } from "./locale-context";
import SiteNav from "./site-nav";
import ThemeToggle from "./theme-toggle";
import { getDictionary, htmlLang, interpolate, type Locale } from "./i18n";
import { androidAppLinks, githubLinks, npmLinks, releaseVersion } from "./site-data";

const displayVersion = `v${releaseVersion}`;

export default function SiteChrome({
  locale = "en",
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const t = getDictionary(locale);

  return (
    <LocaleProvider locale={locale}>
      <main className="site-shell" lang={htmlLang[locale]}>
        <div className="page-bg" aria-hidden="true">
          <div className="page-bg-grid" />
          <div className="page-bg-glow page-bg-glow-a" />
          <div className="page-bg-glow page-bg-glow-b" />
          <div className="page-bg-glow page-bg-glow-c" />
        </div>

        <header className="topbar">
          <LocalizedLink className="brand" href="/" aria-label="tcptun home">
            <Image src="/tcptun-logo.png" alt="" width={36} height={36} priority />
            <span>tcptun</span>
          </LocalizedLink>
          <div className="topbar-actions">
            <SiteNav />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <div className="site-content">{children}</div>

        <footer className="footer">
          <div className="footer-main">
            <div className="footer-brand-block">
              <div className="footer-brand">
                <Image src="/tcptun-logo.png" alt="" width={36} height={36} />
                <div>
                  <strong>tcptun</strong>
                  <p>{t.meta.tagline}</p>
                  <p className="footer-version">
                    {interpolate(t.footer.latestRuntime, { version: displayVersion })}
                  </p>
                </div>
              </div>
            </div>

            <div className="footer-columns">
              <div className="footer-column">
                <h3>{t.nav.product}</h3>
                <LocalizedLink href="/guide/">{t.nav.getStarted}</LocalizedLink>
                <LocalizedLink href="/embed/">{t.nav.goSdk}</LocalizedLink>
                <LocalizedLink href="/use-cases/">{t.nav.useCases}</LocalizedLink>
                <LocalizedLink href="/download/">{t.nav.download}</LocalizedLink>
                <a href={androidAppLinks.playStore} target="_blank" rel="noreferrer">
                  Android v{androidAppLinks.appVersion} · runtime {androidAppLinks.runtimeVersion}
                </a>
                <LocalizedLink href="/start/">{t.nav.cli}</LocalizedLink>
              </div>
              <div className="footer-column">
                <h3>{t.nav.documentation}</h3>
                <LocalizedLink href="/docs/">{t.nav.docsHub}</LocalizedLink>
                <LocalizedLink href="/architecture/">{t.nav.architecture}</LocalizedLink>
                <LocalizedLink href="/config/">{t.nav.configuration}</LocalizedLink>
                <LocalizedLink href="/protocols/">{t.nav.protocols}</LocalizedLink>
                <LocalizedLink href="/protocols/native/">{t.nav.nativeProtocol}</LocalizedLink>
                <LocalizedLink href="/examples/">{t.nav.examplesCatalog}</LocalizedLink>
                <LocalizedLink href="/examples/#native-reality">{t.nav.realityAuto}</LocalizedLink>
                <LocalizedLink href="/security/">{t.nav.securityTrust}</LocalizedLink>
                <LocalizedLink href="/faq/">{t.nav.faq}</LocalizedLink>
              </div>
              <div className="footer-column">
                <h3>{t.nav.tools}</h3>
                <LocalizedLink href="/generate/">{t.nav.configGenerator}</LocalizedLink>
                <LocalizedLink href="/uri/">{t.nav.uriTools}</LocalizedLink>
                <LocalizedLink href="/convert/">{t.nav.xrayConvert}</LocalizedLink>
                <LocalizedLink href="/guide/">{t.nav.setupWizard}</LocalizedLink>
              </div>
              <div className="footer-column">
                <h3>{t.footer.sourceRelease}</h3>
                <a href={githubLinks.runtime} target="_blank" rel="noreferrer">
                  {t.nav.githubRuntime}
                </a>
                <a href={githubLinks.runtimeReleaseTag} target="_blank" rel="noreferrer">
                  Release {displayVersion}
                </a>
                <a href={npmLinks.package} target="_blank" rel="noreferrer">
                  {t.footer.npm}
                </a>
                <a href="/install.sh">{t.footer.installSh}</a>
                <LocalizedLink href="/legal/">{t.nav.legal}</LocalizedLink>
                <LocalizedLink href="/privacy/">{t.nav.privacy}</LocalizedLink>
                <CookieSettingsLink className="footer-text-button">{t.common.cookies}</CookieSettingsLink>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              tcptun {displayVersion} · {t.footer.runtimeBlurb} ·{" "}
              <strong>{t.footer.lawful}</strong>{" "}
              <LocalizedLink href="/legal/">{t.footer.disclaimer}</LocalizedLink>
              {" · "}
              <CookieSettingsLink className="footer-text-button">{t.common.cookies}</CookieSettingsLink>
            </span>
            <LocalizedLink href="#top">{t.common.backToTop}</LocalizedLink>
          </div>
        </footer>

        <CookieBanner />
      </main>
    </LocaleProvider>
  );
}
