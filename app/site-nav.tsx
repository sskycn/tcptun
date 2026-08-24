"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { androidAppLinks, githubLinks } from "./site-data";

/** Primary destinations — short, product-path oriented. */
const primaryLinks = [
  { href: "/guide/", label: "Get started" },
  { href: "/docs/", label: "Docs" },
  { href: "/embed/", label: "Embed" },
  { href: "/architecture/", label: "Architecture" },
  { href: "/download/", label: "Download" },
] as const;

/** Mobile / overflow groups for the rest of the site. */
const navGroups = [
  {
    title: "Product",
    links: [
      { href: "/guide/", label: "Get started" },
      { href: "/embed/", label: "Go SDK" },
      { href: "/use-cases/", label: "Use cases" },
      { href: "/download/", label: "Download" },
      { href: "/download/#android", label: "Android app" },
      { href: "/start/", label: "CLI" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { href: "/docs/", label: "Docs hub" },
      { href: "/architecture/", label: "Architecture" },
      { href: "/config/", label: "Configuration" },
      { href: "/protocols/", label: "Protocols" },
      { href: "/protocols/native/", label: "Native protocol" },
      { href: "/examples/", label: "Examples" },
      { href: "/security/", label: "Security & trust" },
      { href: "/faq/", label: "FAQ" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/generate/", label: "Config generator" },
      { href: "/uri/", label: "URI tools" },
      { href: "/convert/", label: "Xray convert" },
      { href: "/guide/", label: "Setup wizard" },
    ],
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

export default function SiteNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const menuId = useId();

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
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? "is-active" : undefined}
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
        <a
          href={githubLinks.runtime}
          target="_blank"
          rel="noreferrer"
          className="nav-external"
        >
          GitHub
        </a>
      </nav>

      <button
        type="button"
        className={`nav-toggle ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
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
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={isActive(pathname, link.href) ? "is-active" : undefined}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                >
                  <span>{link.label}</span>
                  <span className="nav-mobile-hash" aria-hidden="true">
                    {link.href}
                  </span>
                </Link>
              ))}
            </div>
          ))}
          <div className="nav-mobile-group">
            <p className="nav-mobile-label">Source</p>
            <a
              href={githubLinks.runtime}
              target="_blank"
              rel="noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
            >
              <span>GitHub · runtime</span>
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
              <span>Android · Google Play</span>
              <span className="nav-mobile-hash" aria-hidden="true">
                {androidAppLinks.packageId}
              </span>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
