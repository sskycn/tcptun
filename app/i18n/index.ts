import type { Locale } from "./config";
import { en, type Dictionary } from "./en";
import { zh } from "./zh";

export type { Locale, Dictionary };
export {
  defaultLocale,
  htmlLang,
  localeFromPathname,
  localeLabels,
  locales,
  localizeHref,
  switchLocaleHref,
  stripLocalePrefix,
  absoluteUrl,
  languageAlternates,
  siteOrigin,
} from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? `{${key}}` : String(value);
  });
}
