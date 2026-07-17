import React from "react";
import { Switch } from "antd";
import { useTranslation } from "react-i18next";

interface TagFilteringToggleProps {
  enabled: boolean;
  routerFieldsMetadata: { [key: string]: any };
  onToggle: (enabled: boolean) => void;
}

const TagFilteringToggle: React.FC<TagFilteringToggleProps> = ({ enabled, routerFieldsMetadata, onToggle }) => {
  const { t, i18n } = useTranslation();
  const isChinese = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const metadata = routerFieldsMetadata["enable_tag_filtering"];

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            {isChinese
              ? t("routerSettings.fields.enable_tag_filtering.label")
              : metadata?.ui_field_name || t("routerSettings.fields.enable_tag_filtering.label")}
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            {isChinese
              ? t("routerSettings.fields.enable_tag_filtering.description")
              : metadata?.field_description || t("routerSettings.fields.enable_tag_filtering.description")}
            {metadata?.link && (
              <>
                {" "}
                <a
                  href={metadata.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {t("routerSettings.learnMore")}
                </a>
              </>
            )}
          </p>
        </div>
        <Switch checked={enabled} onChange={onToggle} className="ml-4" />
      </div>
    </div>
  );
};

export default TagFilteringToggle;
