import React from "react";
import { Form, Input } from "antd";
import { AGENT_FORM_CONFIG } from "./agent_config";
import { useTranslation } from "react-i18next";

const CostConfigFields: React.FC = () => {
  const { t } = useTranslation();
  const label = (name: string, fallback: string) =>
    t(`agentManagement.form.fields.${name}.label`, { defaultValue: fallback });
  const tooltip = (name: string, fallback?: string) =>
    t(`agentManagement.form.fields.${name}.tooltip`, { defaultValue: fallback || "" });
  const placeholder = (name: string, fallback?: string) =>
    t(`agentManagement.form.fields.${name}.placeholder`, { defaultValue: fallback || "" });

  return (
    <>
      {AGENT_FORM_CONFIG.cost.fields.map((field) => (
        <Form.Item
          key={field.name}
          label={label(field.name, field.label)}
          name={field.name}
          tooltip={tooltip(field.name, field.tooltip)}
        >
          <Input placeholder={placeholder(field.name, field.placeholder)} type="number" step="0.000001" />
        </Form.Item>
      ))}
    </>
  );
};

export default CostConfigFields;
