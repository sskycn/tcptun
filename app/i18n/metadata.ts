import type { Metadata } from "next";
import { getDictionary, languageAlternates, localizeHref, type Locale } from "./index";

export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const alternates = languageAlternates(path);
  const canonical = localizeHref(path, locale);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: alternates.languages,
    },
  };
}

export function rootMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    title: {
      default: t.meta.siteTitle,
      template: t.meta.titleTemplate,
    },
    description: t.meta.description,
    keywords: [...t.meta.keywords],
    openGraph: {
      title: t.meta.siteTitle,
      description: t.meta.tagline,
      type: "website",
      url: locale === "zh" ? "https://tcptun.com/zh/" : "https://tcptun.com",
    },
  };
}
