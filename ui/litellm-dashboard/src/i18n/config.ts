export const supportedLocales = ["zh-CN", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const localeCookieName = "litellm_locale";

export const normalizeLocale = (value: string | null | undefined): SupportedLocale | null => {
  if (!value) return null;
  if (value.toLowerCase().startsWith("zh")) return "zh-CN";
  if (value.toLowerCase().startsWith("en")) return "en";
  return null;
};

const configuredDefaultLocale = normalizeLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
export const defaultLocale: SupportedLocale = configuredDefaultLocale ?? "zh-CN";
