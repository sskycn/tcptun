"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDictionary, type Dictionary, type Locale } from "./i18n";

type LocaleContextValue = {
  locale: Locale;
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: getDictionary("en"),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: getDictionary(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useMessages(): Dictionary {
  return useContext(LocaleContext).t;
}
