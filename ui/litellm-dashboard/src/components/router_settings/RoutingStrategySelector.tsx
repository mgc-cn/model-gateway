import React from "react";
import { Select } from "antd";
import { useTranslation } from "react-i18next";
import { getStrategyDescription, getStrategyLabel } from "./i18n";

interface RoutingStrategySelectorProps {
  selectedStrategy: string | null;
  availableStrategies: string[];
  routingStrategyDescriptions: { [key: string]: string };
  routerFieldsMetadata: { [key: string]: any };
  onStrategyChange: (strategy: string) => void;
}

const RoutingStrategySelector: React.FC<RoutingStrategySelectorProps> = ({
  selectedStrategy,
  availableStrategies,
  routingStrategyDescriptions,
  routerFieldsMetadata,
  onStrategyChange,
}) => {
  const { t, i18n } = useTranslation();
  const isChinese = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const metadata = routerFieldsMetadata["routing_strategy"];

  return (
    <div className="space-y-2 max-w-3xl">
      <div>
        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          {isChinese
            ? t("routerSettings.fields.routing_strategy.label")
            : metadata?.ui_field_name || t("routerSettings.fields.routing_strategy.label")}
        </label>
        <p className="text-xs text-gray-500 mt-0.5 mb-2">
          {isChinese
            ? t("routerSettings.fields.routing_strategy.description")
            : metadata?.field_description || t("routerSettings.fields.routing_strategy.description")}
        </p>
      </div>
      <div className="routing-strategy-select max-w-3xl">
        <Select value={selectedStrategy} onChange={onStrategyChange} style={{ width: "100%" }} size="large">
          {availableStrategies.map((strategy) => (
            <Select.Option key={strategy} value={strategy} label={strategy}>
              <div className="flex flex-col gap-0.5 py-1">
                <span className={isChinese ? "text-sm font-medium" : "font-mono text-sm font-medium"}>
                  {isChinese ? getStrategyLabel(t, strategy) : strategy}
                </span>
                {(isChinese || routingStrategyDescriptions[strategy]) && (
                  <span className="text-xs text-gray-500 font-normal">
                    {isChinese
                      ? getStrategyDescription(t, strategy, routingStrategyDescriptions[strategy])
                      : routingStrategyDescriptions[strategy]}
                  </span>
                )}
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default RoutingStrategySelector;
