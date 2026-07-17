import React from "react";
import { Form, Input, Switch, Collapse, Select, Space, Tooltip } from "antd";
import { Button as AntButton } from "antd";
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { AGENT_FORM_CONFIG, SKILL_FIELD_CONFIG } from "./agent_config";

import CostConfigFields from "./cost_config_fields";
import { useTranslation } from "react-i18next";

const { Panel } = Collapse;

interface AgentFormFieldsProps {
  showAgentName?: boolean;
  visiblePanels?: string[];
}

/**
 * Reusable form fields component for agent forms
 * Uses shared configuration from agent_config.ts
 */
const AgentFormFields: React.FC<AgentFormFieldsProps> = ({ showAgentName = true, visiblePanels }) => {
  const { t } = useTranslation();
  const shouldShow = (key: string) => !visiblePanels || visiblePanels.includes(key);
  const sectionTitle = (key: string, fallback: string) =>
    t(`agentManagement.form.sections.${key}`, { defaultValue: fallback });
  const fieldLabel = (name: string, fallback: string) =>
    t(`agentManagement.form.fields.${name}.label`, { defaultValue: fallback });
  const fieldPlaceholder = (name: string, fallback?: string) =>
    t(`agentManagement.form.fields.${name}.placeholder`, { defaultValue: fallback || "" });
  const fieldTooltip = (name: string, fallback?: string) =>
    t(`agentManagement.form.fields.${name}.tooltip`, { defaultValue: fallback || "" });
  const fieldHelpText = (name: string, fallback?: string) =>
    t(`agentManagement.form.fields.${name}.helpText`, { defaultValue: fallback || "" });

  return (
    <>
      {showAgentName && (
        <Form.Item
          label={t("agentManagement.form.agentName")}
          name="agent_name"
          rules={[{ required: true, message: t("agentManagement.form.agentNameRequired") }]}
          tooltip={t("agentManagement.form.agentNameTooltip")}
        >
          <Input placeholder={t("agentManagement.form.agentNamePlaceholder")} />
        </Form.Item>
      )}

      <Collapse defaultActiveKey={["basic"]} style={{ marginBottom: 16 }}>
        {/* Basic Information */}
        {shouldShow(AGENT_FORM_CONFIG.basic.key) && (
          <Panel
            header={`${sectionTitle(AGENT_FORM_CONFIG.basic.key, AGENT_FORM_CONFIG.basic.title)} (${t(
              "agentManagement.form.required",
            )})`}
            key={AGENT_FORM_CONFIG.basic.key}
          >
            {AGENT_FORM_CONFIG.basic.fields.map((field) => (
              <Form.Item
                key={field.name}
                label={fieldLabel(field.name, field.label)}
                name={field.name}
                rules={
                  field.required
                    ? [
                        {
                          required: true,
                          message: t("agentManagement.form.requiredField", {
                            label: fieldLabel(field.name, field.label).toLowerCase(),
                          }),
                        },
                      ]
                    : undefined
                }
                tooltip={fieldTooltip(field.name, field.tooltip)}
                extra={fieldHelpText(field.name, field.helpText)}
              >
                {field.type === "textarea" ? (
                  <Input.TextArea rows={field.rows} placeholder={fieldPlaceholder(field.name, field.placeholder)} />
                ) : field.type === "select" ? (
                  <Select placeholder={fieldPlaceholder(field.name, field.placeholder)}>
                    {(field.options ?? []).map((opt) => (
                      <Select.Option key={opt} value={opt}>
                        {opt}
                      </Select.Option>
                    ))}
                  </Select>
                ) : (
                  <Input placeholder={fieldPlaceholder(field.name, field.placeholder)} />
                )}
              </Form.Item>
            ))}
          </Panel>
        )}

        {/* Skills */}
        {shouldShow(AGENT_FORM_CONFIG.skills.key) && (
          <Panel
            header={sectionTitle(AGENT_FORM_CONFIG.skills.key, AGENT_FORM_CONFIG.skills.title)}
            key={AGENT_FORM_CONFIG.skills.key}
          >
            <Form.List name="skills">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      style={{ marginBottom: 16, padding: 16, border: "1px solid #d9d9d9", borderRadius: 4 }}
                    >
                      <Form.Item
                        {...field}
                        label={t("agentManagement.form.skills.id")}
                        name={[field.name, "id"]}
                        rules={[
                          {
                            required: SKILL_FIELD_CONFIG.id.required,
                            message: t("agentManagement.form.skills.required"),
                          },
                        ]}
                      >
                        <Input placeholder={t("agentManagement.form.skills.idPlaceholder")} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t("agentManagement.form.skills.name")}
                        name={[field.name, "name"]}
                        rules={[
                          {
                            required: SKILL_FIELD_CONFIG.name.required,
                            message: t("agentManagement.form.skills.required"),
                          },
                        ]}
                      >
                        <Input placeholder={t("agentManagement.form.skills.namePlaceholder")} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t("agentManagement.form.skills.description")}
                        name={[field.name, "description"]}
                        rules={[
                          {
                            required: SKILL_FIELD_CONFIG.description.required,
                            message: t("agentManagement.form.skills.required"),
                          },
                        ]}
                      >
                        <Input.TextArea
                          rows={SKILL_FIELD_CONFIG.description.rows}
                          placeholder={t("agentManagement.form.skills.descriptionPlaceholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t("agentManagement.form.skills.tags")}
                        name={[field.name, "tags"]}
                        rules={[
                          {
                            required: SKILL_FIELD_CONFIG.tags.required,
                            message: t("agentManagement.form.skills.required"),
                          },
                        ]}
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          tokenSeparators={[","]}
                          placeholder={t("agentManagement.form.skills.tagsPlaceholder")}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t("agentManagement.form.skills.examples")}
                        name={[field.name, "examples"]}
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          tokenSeparators={[","]}
                          placeholder={t("agentManagement.form.skills.examplesPlaceholder")}
                        />
                      </Form.Item>

                      <AntButton type="link" danger onClick={() => remove(field.name)} icon={<MinusCircleOutlined />}>
                        {t("agentManagement.form.skills.remove")}
                      </AntButton>
                    </div>
                  ))}
                  <AntButton type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: "100%" }}>
                    {t("agentManagement.form.skills.add")}
                  </AntButton>
                </>
              )}
            </Form.List>
          </Panel>
        )}

        {/* Capabilities */}
        {shouldShow(AGENT_FORM_CONFIG.capabilities.key) && (
          <Panel
            header={sectionTitle(AGENT_FORM_CONFIG.capabilities.key, AGENT_FORM_CONFIG.capabilities.title)}
            key={AGENT_FORM_CONFIG.capabilities.key}
          >
            {AGENT_FORM_CONFIG.capabilities.fields.map((field) => (
              <Form.Item
                key={field.name}
                label={fieldLabel(field.name, field.label)}
                name={field.name}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            ))}
          </Panel>
        )}

        {/* Optional Settings */}
        {shouldShow(AGENT_FORM_CONFIG.optional.key) && (
          <Panel
            header={sectionTitle(AGENT_FORM_CONFIG.optional.key, AGENT_FORM_CONFIG.optional.title)}
            key={AGENT_FORM_CONFIG.optional.key}
          >
            {AGENT_FORM_CONFIG.optional.fields.map((field) => (
              <Form.Item
                key={field.name}
                label={fieldLabel(field.name, field.label)}
                name={field.name}
                valuePropName={field.type === "switch" ? "checked" : undefined}
              >
                {field.type === "switch" ? (
                  <Switch />
                ) : (
                  <Input placeholder={fieldPlaceholder(field.name, field.placeholder)} />
                )}
              </Form.Item>
            ))}
          </Panel>
        )}

        {/* Cost Configuration */}
        {shouldShow(AGENT_FORM_CONFIG.cost.key) && (
          <Panel
            header={sectionTitle(AGENT_FORM_CONFIG.cost.key, AGENT_FORM_CONFIG.cost.title)}
            key={AGENT_FORM_CONFIG.cost.key}
          >
            <CostConfigFields />
          </Panel>
        )}

        {/* LiteLLM Parameters */}
        {shouldShow(AGENT_FORM_CONFIG.litellm.key) && (
          <Panel
            header={sectionTitle(AGENT_FORM_CONFIG.litellm.key, AGENT_FORM_CONFIG.litellm.title)}
            key={AGENT_FORM_CONFIG.litellm.key}
          >
            {AGENT_FORM_CONFIG.litellm.fields.map((field) => (
              <Form.Item
                key={field.name}
                label={fieldLabel(field.name, field.label)}
                name={field.name}
                valuePropName={field.type === "switch" ? "checked" : undefined}
              >
                {field.type === "switch" ? (
                  <Switch />
                ) : (
                  <Input placeholder={fieldPlaceholder(field.name, field.placeholder)} />
                )}
              </Form.Item>
            ))}
          </Panel>
        )}

        {/* Authentication Headers */}
        {shouldShow("auth_headers") && (
          <Panel header={t("agentManagement.form.sections.authHeaders")} key="auth_headers">
            {/* Static Headers */}
            <Form.Item
              label={
                <span>
                  {t("agentManagement.form.headers.staticHeaders")}{" "}
                  <Tooltip title={t("agentManagement.form.headers.staticHeadersTooltip")}>
                    <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                  </Tooltip>
                </span>
              }
            >
              <Form.List name="static_headers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, "header"]}
                          rules={[{ required: true, message: t("agentManagement.form.headers.headerRequired") }]}
                        >
                          <Input
                            placeholder={t("agentManagement.form.headers.headerPlaceholder")}
                            style={{ width: 220 }}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "value"]}
                          rules={[{ required: true, message: t("agentManagement.form.headers.valueRequired") }]}
                        >
                          <Input
                            placeholder={t("agentManagement.form.headers.valuePlaceholder")}
                            style={{ width: 260 }}
                          />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "#ff4d4f" }} />
                      </Space>
                    ))}
                    <AntButton type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: "100%" }}>
                      {t("agentManagement.form.headers.addStaticHeader")}
                    </AntButton>
                  </>
                )}
              </Form.List>
            </Form.Item>

            {/* Extra Headers (dynamic forwarding) */}
            <Form.Item
              label={
                <span>
                  {t("agentManagement.form.headers.forwardClientHeaders")}{" "}
                  <Tooltip title={t("agentManagement.form.headers.forwardClientHeadersTooltip")}>
                    <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                  </Tooltip>
                </span>
              }
              name="extra_headers"
            >
              <Select
                mode="tags"
                style={{ width: "100%" }}
                placeholder={t("agentManagement.form.headers.extraHeadersPlaceholder")}
                tokenSeparators={[","]}
              />
            </Form.Item>
          </Panel>
        )}
      </Collapse>
    </>
  );
};

export default AgentFormFields;
