"use client";

import { useEffect, useId, useState } from "react";

const links = [
  { href: "#architecture", id: "architecture", label: "架构" },
  { href: "#config", id: "config", label: "配置" },
  { href: "#generate", id: "generate", label: "生成" },
  { href: "#uri", id: "uri", label: "URI" },
  { href: "#convert", id: "convert", label: "转换" },
  { href: "#protocols", id: "protocols", label: "协议" },
  { href: "#download", id: "download", label: "下载" },
  { href: "#start", id: "start", label: "命令" },
  { href: "#faq", id: "faq", label: "FAQ" },
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
      <nav className="nav nav-desktop" aria-label="主要导航">
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
        aria-label={open ? "关闭菜单" : "打开菜单"}
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
        aria-label="移动导航"
        aria-hidden={!open}
      >
        <div className="nav-mobile-panel">
          <p className="nav-mobile-label">导航</p>
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
