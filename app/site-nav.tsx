"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { androidAppLinks, githubLinks } from "./site-data";
import { localizeHref, stripLocalePrefix } from "./i18n";
import LocalizedLink from "./localized-link";
import { useLocale, useMessages } from "./locale-context";

function isActive(pathname: string, href: string) {
  const path = stripLocalePrefix(pathname);
  const target = stripLocalePrefix(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(target);
}

export default function SiteNav() {
  const pathname = usePathname() || "/";
  const locale = useLocale();
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const primaryLinks = [
    { href: "/guide/", label: t.nav.getStarted },
    { href: "/docs/", label: t.nav.docs },
    { href: "/examples/", label: t.nav.examples },
    { href: "/embed/", label: t.nav.embed },
    { href: "/download/", label: t.nav.download },
  ] as const;

  const navGroups = [
    {
      title: t.nav.product,
      links: [
        { href: "/guide/", label: t.nav.getStarted },
        { href: "/embed/", label: t.nav.goSdk },
        { href: "/use-cases/", label: t.nav.useCases },
        { href: "/download/", label: t.nav.download },
        { href: "/download/#android", label: t.nav.androidApp },
        { href: "/start/", label: t.nav.cli },
      ],
    },
    {
      title: t.nav.documentation,
      links: [
        { href: "/docs/", label: t.nav.docsHub },
        { href: "/architecture/", label: t.nav.architecture },
        { href: "/config/", label: t.nav.configuration },
        { href: "/protocols/", label: t.nav.protocols },
        { href: "/protocols/native/", label: t.nav.nativeProtocol },
        { href: "/examples/", label: t.nav.examplesCatalog },
        { href: "/examples/#native-reality", label: t.nav.realityAuto },
        { href: "/examples/#native-reverse", label: t.nav.reversePublish },
        { href: "/security/", label: t.nav.securityTrust },
        { href: "/faq/", label: t.nav.faq },
      ],
    },
    {
      title: t.nav.tools,
      links: [
        { href: "/generate/", label: t.nav.configGenerator },
        { href: "/uri/", label: t.nav.uriTools },
        { href: "/convert/", label: t.nav.xrayConvert },
        { href: "/guide/", label: t.nav.setupWizard },
      ],
    },
  ] as const;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onResize() {
      if (window.matchMedia("(min-width: 981px)").matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="site-nav">
      <nav className="nav nav-desktop" aria-label="Primary navigation">
        {primaryLinks.map((link) => (
          <LocalizedLink
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? "is-active" : undefined}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
          >
            {link.label}
          </LocalizedLink>
        ))}
        <a href={githubLinks.runtime} target="_blank" rel="noreferrer" className="nav-external">
          {t.nav.github}
        </a>
      </nav>

      <button
        type="button"
        className={`nav-toggle ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? t.common.closeMenu : t.common.openMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="nav-toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        className={`nav-backdrop ${open ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <nav
        id={menuId}
        className={`nav-mobile ${open ? "is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <div className="nav-mobile-panel">
          {navGroups.map((group) => (
            <div className="nav-mobile-group" key={group.title}>
              <p className="nav-mobile-label">{group.title}</p>
              {group.links.map((link) => (
                <LocalizedLink
                  key={link.href + link.label}
                  href={link.href}
                  className={isActive(pathname, link.href) ? "is-active" : undefined}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                >
                  <span>{link.label}</span>
                  <span className="nav-mobile-hash" aria-hidden="true">
                    {localizeHref(link.href, locale)}
                  </span>
                </LocalizedLink>
              ))}
            </div>
          ))}
          <div className="nav-mobile-group">
            <p className="nav-mobile-label">{t.nav.source}</p>
            <a
              href={githubLinks.runtime}
              target="_blank"
              rel="noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              <span>{t.nav.githubRuntime}</span>
              <span className="nav-mobile-hash" aria-hidden="true">
                sskycn/tcptun-go
              </span>
            </a>
            <a
              href={androidAppLinks.playStore}
              target="_blank"
              rel="noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              <span>
                Android v{androidAppLinks.appVersion}
              </span>
              <span className="nav-mobile-hash" aria-hidden="true">
                runtime {androidAppLinks.runtimeVersion}
              </span>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
