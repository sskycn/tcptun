"use client";

import { useEffect, useId, useState } from "react";

const links = [
  { href: "#architecture", id: "architecture", label: "Architecture" },
  { href: "#config", id: "config", label: "Config" },
  { href: "#generate", id: "generate", label: "Generate" },
  { href: "#uri", id: "uri", label: "URI" },
  { href: "#convert", id: "convert", label: "Convert" },
  { href: "#protocols", id: "protocols", label: "Protocols" },
  { href: "#download", id: "download", label: "Download" },
  { href: "#start", id: "start", label: "CLI" },
  { href: "#faq", id: "faq", label: "FAQ" },
  { href: "#disclaimer", id: "disclaimer", label: "Legal" },
] as const;

export default function SiteNav() {
  const [activeId, setActiveId] = useState("");
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
          return;
        }

        if (window.scrollY < 200) setActiveId("");
      },
      {
        rootMargin: "-28% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

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

  function handleNavigate() {
    setOpen(false);
  }

  return (
    <div className="site-nav">
      <nav className="nav nav-desktop" aria-label="Primary navigation">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className={activeId === link.id ? "is-active" : undefined}
            aria-current={activeId === link.id ? "location" : undefined}
          >
            {link.label}
          </a>
        ))}
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
          <p className="nav-mobile-label">Navigation</p>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={activeId === link.id ? "is-active" : undefined}
              aria-current={activeId === link.id ? "location" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={handleNavigate}
            >
              <span>{link.label}</span>
              <span className="nav-mobile-hash" aria-hidden="true">
                {link.href}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
