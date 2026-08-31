"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, switchLocaleHref } from "./i18n";
import { useLocale, useMessages } from "./locale-context";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useMessages();
  const pathname = usePathname() || "/";

  return (
    <nav className="language-switcher" aria-label={t.common.language}>
      {locales.map((item) => (
        <Link
          key={item}
          href={switchLocaleHref(pathname, item)}
          className={item === locale ? "is-active" : undefined}
          hrefLang={item === "zh" ? "zh-CN" : "en"}
          lang={item === "zh" ? "zh-CN" : "en"}
          aria-current={item === locale ? "true" : undefined}
        >
          {localeLabels[item]}
        </Link>
      ))}
    </nav>
  );
}
