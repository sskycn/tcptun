export const locales = ["en", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export const htmlLang: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
};

export const siteOrigin = "https://tcptun.com";

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "zh";
}

export function localeFromPathname(pathname: string): Locale {
  const path = pathname || "/";
  if (path === "/zh" || path === "/zh/" || path.startsWith("/zh/")) return "zh";
  return "en";
}

export function stripLocalePrefix(pathname: string): string {
  const path = pathname || "/";
  if (path === "/zh") return "/";
  if (path === "/zh/") return "/";
  if (path.startsWith("/zh/")) {
    const rest = path.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function localizeHref(href: string, locale: Locale): string {
  if (!href) return locale === "zh" ? "/zh/" : "/";
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("#")) return href;

  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const stripped = stripLocalePrefix(pathPart || "/");
  const withSlash =
    stripped.endsWith("/") || stripped.includes(".") ? stripped : `${stripped}/`;

  if (locale === "zh") {
    const prefixed = withSlash === "/" ? "/zh/" : `/zh${withSlash}`;
    return `${prefixed}${hash}`;
  }
  return `${withSlash}${hash}`;
}

export function switchLocaleHref(pathname: string, nextLocale: Locale): string {
  return localizeHref(stripLocalePrefix(pathname), nextLocale);
}

export function absoluteUrl(pathname: string, locale: Locale = "en"): string {
  const path = localizeHref(pathname, locale);
  return `${siteOrigin}${path}`;
}

export function languageAlternates(pathname: string) {
  const stripped = stripLocalePrefix(pathname);
  return {
    canonical: undefined as string | undefined,
    languages: {
      en: absoluteUrl(stripped, "en"),
      "zh-CN": absoluteUrl(stripped, "zh"),
    },
  };
}
