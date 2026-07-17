"use client";

import i18n from "./i18n";
import { defaultLocale, localeCookieName, normalizeLocale, type SupportedLocale } from "./config";
import { I18nextProvider } from "react-i18next";
import { useEffect, useState, type ReactNode } from "react";

const readLocaleCookie = (): SupportedLocale | null => {
  const entry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${localeCookieName}=`));
  return normalizeLocale(entry?.slice(localeCookieName.length + 1));
};

export const persistLocale = (locale: SupportedLocale): void => {
  document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
};

export const changeLocale = async (locale: SupportedLocale): Promise<void> => {
  persistLocale(locale);
  document.documentElement.lang = locale;
  await i18n.changeLanguage(locale);
};

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    const locale = readLocaleCookie() ?? defaultLocale;
    document.documentElement.lang = locale;
    const localeChange = i18n.resolvedLanguage === locale ? Promise.resolve() : i18n.changeLanguage(locale);
    void localeChange.finally(() => setLocaleReady(true));
  }, []);

  return <I18nextProvider i18n={i18n}>{localeReady ? children : null}</I18nextProvider>;
}
