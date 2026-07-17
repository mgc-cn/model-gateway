import { Form, Input, Select, Switch } from "antd";
import React from "react";
import { CacheField } from "./cacheSettingsFields";
import { useTranslation } from "react-i18next";

export interface EmbeddingModelOption {
  value: string;
  label: string;
}

interface CacheFormFieldProps {
  field: CacheField;
  embeddingModels: EmbeddingModelOption[];
}

const renderControl = (
  field: CacheField,
  embeddingModels: EmbeddingModelOption[],
  placeholder: string,
  helpText: string,
): React.ReactNode => {
  switch (field.type) {
    case "boolean":
      return <Switch />;
    case "password":
      return <Input.Password placeholder={helpText} autoComplete="new-password" />;
    case "integer":
    case "float":
      return <Input inputMode="decimal" placeholder={helpText} />;
    case "list":
      return <Input.TextArea rows={4} placeholder={helpText} />;
    case "model-select":
      return (
        <Select
          showSearch
          allowClear
          placeholder={placeholder}
          options={embeddingModels}
          optionFilterProp="label"
          style={{ width: "100%" }}
        />
      );
    default:
      return <Input placeholder={helpText} />;
  }
};

const CacheFormField: React.FC<CacheFormFieldProps> = ({ field, embeddingModels }) => {
  const { t } = useTranslation();
  const label = t(`caching.settings.fields.${field.name}.label`, { defaultValue: field.label });
  const helpText = t(`caching.settings.fields.${field.name}.help`, { defaultValue: field.helpText });

  return (
    <Form.Item
      name={field.name}
      label={label}
      extra={helpText}
      rules={field.rules}
      valuePropName={field.type === "boolean" ? "checked" : "value"}
    >
      {renderControl(field, embeddingModels, t("caching.settings.searchModel"), helpText)}
    </Form.Item>
  );
};

export default CacheFormField;
