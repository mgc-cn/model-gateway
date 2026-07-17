import React, { useState, useEffect } from "react";
import { Form, Input, InputNumber, Select } from "antd";
import { TextInput } from "@tremor/react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { getOpenAPISchema } from "../networking";
import { formatLabel } from "@/utils/textUtils";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

interface SchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  anyOf?: Array<{ type: string }>;
  enum?: string[];
  format?: string;
}

interface OpenAPISchema {
  properties: {
    [key: string]: SchemaProperty;
  };
  required?: string[];
}

interface SchemaFormFieldsProps {
  schemaComponent: string;
  excludedFields?: string[];
  form: any;
  overrideLabels?: { [key: string]: string };
  overrideTooltips?: { [key: string]: string };
  customValidation?: {
    [key: string]: (rule: any, value: any) => Promise<void>;
  };
  defaultValues?: { [key: string]: any };
}

// Define which fields should be parsed as JSON
export const jsonFields = ["metadata", "config", "enforced_params", "aliases"];

// Helper function to determine if a field should be treated as JSON
const isJSONField = (key: string, property: SchemaProperty): boolean => {
  return jsonFields.includes(key) || property.format === "json";
};

// Helper function to validate JSON input
const validateJSON = (value: string): boolean => {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const getFieldHelp = (key: string, property: SchemaProperty, type: string, t: TFunction): string => {
  // Default help text based on type
  const defaultHelp =
    {
      string: t("virtualKeys.create.advancedFields.help.text"),
      number: t("virtualKeys.create.advancedFields.help.number"),
      integer: t("virtualKeys.create.advancedFields.help.integer"),
      boolean: t("virtualKeys.create.advancedFields.help.boolean"),
    }[type] || t("virtualKeys.create.advancedFields.help.text");

  // Specific field help text
  const specificHelp: { [key: string]: string } = {
    max_budget: t("virtualKeys.create.advancedFields.help.max_budget"),
    budget_duration: t("virtualKeys.create.advancedFields.help.budget_duration"),
    tpm_limit: t("virtualKeys.create.advancedFields.help.tpm_limit"),
    rpm_limit: t("virtualKeys.create.advancedFields.help.rpm_limit"),
    duration: t("virtualKeys.create.advancedFields.help.duration"),
    metadata: t("virtualKeys.create.advancedFields.help.metadata"),
    config: t("virtualKeys.create.advancedFields.help.config"),
    permissions: t("virtualKeys.create.advancedFields.help.permissions"),
    enforced_params: t("virtualKeys.create.advancedFields.help.enforced_params"),
    blocked: t("virtualKeys.create.advancedFields.help.blocked"),
    aliases: t("virtualKeys.create.advancedFields.help.aliases"),
    models: t("virtualKeys.create.advancedFields.help.models"),
    key_alias: t("virtualKeys.create.advancedFields.help.key_alias"),
    tags: t("virtualKeys.create.advancedFields.help.tags"),
  };

  // Get specific help text or use default based on type
  const helpText = specificHelp[key] || defaultHelp;

  // Add format requirements for special cases
  if (isJSONField(key, property)) {
    return `${helpText}\n${t("virtualKeys.create.advancedFields.help.validJson")}`;
  }

  if (property.enum) {
    return `${t("virtualKeys.create.advancedFields.help.selectOptions")}\n${t(
      "virtualKeys.create.advancedFields.help.allowedValues",
      { values: property.enum.join(", ") },
    )}`;
  }

  return helpText;
};

const SchemaFormFields: React.FC<SchemaFormFieldsProps> = ({
  schemaComponent,
  excludedFields = [],
  form,
  overrideLabels = {},
  overrideTooltips = {},
  customValidation = {},
  defaultValues = {},
}) => {
  const { t } = useTranslation();
  const [schemaProperties, setSchemaProperties] = useState<OpenAPISchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenAPISchema = async () => {
      try {
        const schema = await getOpenAPISchema();
        const componentSchema = schema.components.schemas[schemaComponent];

        if (!componentSchema) {
          throw new Error(`Schema component "${schemaComponent}" not found`);
        }

        setSchemaProperties(componentSchema);

        const defaultFormValues: { [key: string]: any } = {};
        Object.keys(componentSchema.properties)
          .filter((key) => !excludedFields.includes(key) && defaultValues[key] !== undefined)
          .forEach((key) => {
            defaultFormValues[key] = defaultValues[key];
          });

        form.setFieldsValue(defaultFormValues);
      } catch (error) {
        console.error("Schema fetch error:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch schema");
      }
    };

    fetchOpenAPISchema();
  }, [schemaComponent, form, excludedFields]);

  const getPropertyType = (property: SchemaProperty): string => {
    if (property.type) {
      return property.type;
    }
    if (property.anyOf) {
      const types = property.anyOf.map((t) => t.type);
      if (types.includes("number") || types.includes("integer")) return "number";
      if (types.includes("string")) return "string";
    }
    return "string";
  };

  const renderFormItem = (key: string, property: SchemaProperty) => {
    const type = getPropertyType(property);
    const isRequired = schemaProperties?.required?.includes(key);

    const label =
      overrideLabels[key] ||
      t(`virtualKeys.create.advancedFields.labels.${key}`, { defaultValue: property.title || formatLabel(key) });
    const tooltip =
      overrideTooltips[key] ||
      (property.description
        ? t(`virtualKeys.create.advancedFields.descriptions.${key}`, { defaultValue: property.description })
        : undefined);

    const rules = [];
    if (isRequired) {
      rules.push({ required: true, message: t("virtualKeys.create.advancedFields.required", { label }) });
    }
    if (customValidation[key]) {
      rules.push({ validator: customValidation[key] });
    }
    if (isJSONField(key, property)) {
      rules.push({
        validator: async (_: any, value: string) => {
          if (value && !validateJSON(value)) {
            throw new Error(t("virtualKeys.create.advancedFields.invalidJson"));
          }
        },
      });
    }

    const formLabel = tooltip ? (
      <span>
        {label}{" "}
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
        </Tooltip>
      </span>
    ) : (
      label
    );

    let inputComponent;
    if (isJSONField(key, property)) {
      inputComponent = (
        <Input.TextArea
          rows={4}
          placeholder={t("virtualKeys.create.advancedFields.jsonPlaceholder")}
          className="font-mono"
        />
      );
    } else if (property.enum) {
      inputComponent = (
        <Select>
          {property.enum.map((value) => (
            <Select.Option key={value} value={value}>
              {value}
            </Select.Option>
          ))}
        </Select>
      );
    } else if (type === "number" || type === "integer") {
      inputComponent = <InputNumber style={{ width: "100%" }} precision={type === "integer" ? 0 : undefined} />;
    } else if (key === "duration") {
      inputComponent = <TextInput placeholder={t("virtualKeys.create.advancedFields.durationPlaceholder")} />;
    } else {
      inputComponent = <TextInput placeholder="" />;
    }

    return (
      <Form.Item
        key={key}
        label={formLabel}
        name={key}
        className="mt-8"
        rules={rules}
        initialValue={defaultValues[key]}
        help={<div className="text-xs text-gray-500">{getFieldHelp(key, property, type, t)}</div>}
      >
        {inputComponent}
      </Form.Item>
    );
  };

  if (error) {
    return <div className="text-red-500">{t("virtualKeys.create.advancedFields.fetchError", { error })}</div>;
  }

  if (!schemaProperties?.properties) {
    return null;
  }

  return (
    <div>
      {Object.entries(schemaProperties.properties)
        .filter(([key]) => !excludedFields.includes(key))
        .map(([key, property]) => renderFormItem(key, property))}
    </div>
  );
};

export default SchemaFormFields;
