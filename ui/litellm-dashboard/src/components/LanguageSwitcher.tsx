"use client";

import { changeLocale } from "@/i18n/I18nProvider";
import { normalizeLocale, type SupportedLocale } from "@/i18n/config";
import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "zh-CN";
  const labels: Record<SupportedLocale, string> = {
    "zh-CN": t("common.simplifiedChinese"),
    en: t("common.english"),
  };
  const items: MenuProps["items"] = (["zh-CN", "en"] as const).map((itemLocale) => ({
    key: itemLocale,
    label: labels[itemLocale],
  }));

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [locale],
        onClick: ({ key }) => void changeLocale(key as SupportedLocale),
      }}
      trigger={["click"]}
    >
      <Button
        type="text"
        icon={<Languages aria-hidden size={16} />}
        aria-label={t("common.language")}
        className="flex! h-9! items-center gap-1.5 px-2! text-gray-600!"
      >
        <span>{labels[locale]}</span>
        <DownOutlined className="text-[10px]" aria-hidden />
      </Button>
    </Dropdown>
  );
}
