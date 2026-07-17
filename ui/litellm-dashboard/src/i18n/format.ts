import type { SupportedLocale } from "./config";

const localeTag = (locale: SupportedLocale | string | undefined): SupportedLocale =>
  locale?.toLowerCase().startsWith("zh") ? "zh-CN" : "en";

export const formatDate = (
  value: Date | number | string,
  locale: SupportedLocale | string | undefined,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string => new Intl.DateTimeFormat(localeTag(locale), options).format(new Date(value));

export const formatNumber = (
  value: number,
  locale: SupportedLocale | string | undefined,
  options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(localeTag(locale), options).format(value);

export const formatCurrency = (value: number, currency: string, locale: SupportedLocale | string | undefined): string =>
  formatNumber(value, locale, { style: "currency", currency });
