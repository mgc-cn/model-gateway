import React from "react";
import { Select, SelectItem } from "@tremor/react";
import { useTranslation } from "react-i18next";

interface RedisTypeSelectorProps {
  redisType: string;
  redisTypeDescriptions: Readonly<Record<string, string>>;
  onTypeChange: (type: string) => void;
}

const RedisTypeSelector: React.FC<RedisTypeSelectorProps> = ({ redisType, redisTypeDescriptions, onTypeChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{t("caching.settings.redisType")}</label>
      <Select value={redisType} onValueChange={onTypeChange}>
        <SelectItem value="node">{t("caching.settings.redisTypes.node.label")}</SelectItem>
        <SelectItem value="cluster">{t("caching.settings.redisTypes.cluster.label")}</SelectItem>
        <SelectItem value="sentinel">{t("caching.settings.redisTypes.sentinel.label")}</SelectItem>
        <SelectItem value="semantic">{t("caching.settings.redisTypes.semantic.label")}</SelectItem>
      </Select>
      <p className="text-xs text-gray-500">
        {t(`caching.settings.redisTypes.${redisType}.description`, {
          defaultValue: redisTypeDescriptions[redisType] || t("caching.settings.selectRedisType"),
        })}
      </p>
    </div>
  );
};

export default RedisTypeSelector;
