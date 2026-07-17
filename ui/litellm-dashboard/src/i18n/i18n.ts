import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";
import { defaultLocale } from "./config";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
  },
  lng: defaultLocale,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
