"use client";

import { TextInput } from "@tremor/react";
import { Checkbox, Form, Input, Select } from "antd";
import React from "react";
import { ssoProviderLogoMap, ssoProviderDisplayNames } from "../constants";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import type { TFunction } from "i18next";

export interface BaseSSOSettingsFormProps {
  form: any; // Replace with proper Form type if available
  onFormSubmit: (formValues: Record<string, any>) => Promise<void>;
}

// Define the SSO provider configuration type
export interface SSOProviderConfig {
  envVarMap: Record<string, string>;
  fields: Array<{
    label: string;
    name: string;
    placeholder?: string;
  }>;
}

// Define configurations for each SSO provider
export const ssoProviderConfigs: Record<string, SSOProviderConfig> = {
  google: {
    envVarMap: {
      google_client_id: "GOOGLE_CLIENT_ID",
      google_client_secret: "GOOGLE_CLIENT_SECRET",
    },
    fields: [
      { label: "Google Client ID", name: "google_client_id" },
      { label: "Google Client Secret", name: "google_client_secret" },
    ],
  },
  microsoft: {
    envVarMap: {
      microsoft_client_id: "MICROSOFT_CLIENT_ID",
      microsoft_client_secret: "MICROSOFT_CLIENT_SECRET",
      microsoft_tenant: "MICROSOFT_TENANT",
    },
    fields: [
      { label: "Microsoft Client ID", name: "microsoft_client_id" },
      { label: "Microsoft Client Secret", name: "microsoft_client_secret" },
      { label: "Microsoft Tenant", name: "microsoft_tenant" },
    ],
  },
  okta: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
    },
    fields: [
      { label: "Generic Client ID", name: "generic_client_id" },
      { label: "Generic Client Secret", name: "generic_client_secret" },
      {
        label: "Authorization Endpoint",
        name: "generic_authorization_endpoint",
        placeholder: "https://your-domain/authorize",
      },
      { label: "Token Endpoint", name: "generic_token_endpoint", placeholder: "https://your-domain/token" },
      {
        label: "Userinfo Endpoint",
        name: "generic_userinfo_endpoint",
        placeholder: "https://your-domain/userinfo",
      },
    ],
  },
  generic: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
    },
    fields: [
      { label: "Generic Client ID", name: "generic_client_id" },
      { label: "Generic Client Secret", name: "generic_client_secret" },
      { label: "Authorization Endpoint", name: "generic_authorization_endpoint" },
      { label: "Token Endpoint", name: "generic_token_endpoint" },
      { label: "Userinfo Endpoint", name: "generic_userinfo_endpoint" },
    ],
  },
};

// Helper function to render provider fields
export const renderProviderFields = (provider: string, t: TFunction = i18n.t) => {
  const config = ssoProviderConfigs[provider];
  if (!config) return null;

  return config.fields.map((field) => {
    const label = t(`adminSettings.sso.form.fields.${field.name}`, { defaultValue: field.label });
    return (
      <Form.Item
        key={field.name}
        label={label}
        name={field.name}
        rules={[{ required: true, message: t("adminSettings.sso.form.fieldRequired", { field: label }) }]}
      >
        {field.name.includes("client") ? <Input.Password /> : <TextInput placeholder={field.placeholder} />}
      </Form.Item>
    );
  });
};

const BaseSSOSettingsForm: React.FC<BaseSSOSettingsFormProps> = ({ form, onFormSubmit }) => {
  const { t } = useTranslation();
  return (
    <div>
      <Form form={form} onFinish={onFormSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item
          label={t("adminSettings.sso.form.provider")}
          name="sso_provider"
          rules={[{ required: true, message: t("adminSettings.sso.form.providerRequired") }]}
        >
          <Select>
            {Object.entries(ssoProviderLogoMap).map(([value, logo]) => (
              <Select.Option key={value} value={value}>
                <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                  {logo && (
                    <img
                      src={logo}
                      alt={value}
                      style={{ height: 24, width: 24, marginRight: 12, objectFit: "contain" }}
                    />
                  )}
                  <span>
                    {ssoProviderDisplayNames[value] || value.charAt(0).toUpperCase() + value.slice(1) + " SSO"}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider ? renderProviderFields(provider, t) : null;
          }}
        </Form.Item>

        <Form.Item
          label={t("adminSettings.sso.form.adminEmail")}
          name="user_email"
          rules={[{ required: true, message: t("adminSettings.sso.form.adminEmailRequired") }]}
        >
          <TextInput />
        </Form.Item>
        <Form.Item
          label={t("adminSettings.sso.fields.proxyBaseUrl")}
          name="proxy_base_url"
          normalize={(value) => value?.trim()}
          rules={[
            { required: true, message: t("adminSettings.sso.form.proxyUrlRequired") },
            {
              pattern: /^https?:\/\/.+/,
              message: t("adminSettings.sso.form.proxyUrlProtocol"),
            },
            {
              validator: (_, value) => {
                // Only check for trailing slash if the URL starts with http:// or https://
                if (value && /^https?:\/\/.+/.test(value) && value.endsWith("/")) {
                  return Promise.reject(t("adminSettings.sso.form.proxyUrlTrailingSlash"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TextInput placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider === "okta" || provider === "generic" ? (
              <Form.Item
                label={t("adminSettings.sso.form.useRoleMappings")}
                name="use_role_mappings"
                valuePropName="checked"
              >
                <Checkbox />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_role_mappings !== currentValues.use_role_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useRoleMappings = getFieldValue("use_role_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsRoleMappings = provider === "okta" || provider === "generic";
            return useRoleMappings && supportsRoleMappings ? (
              <Form.Item
                label={t("adminSettings.sso.groupClaim")}
                name="group_claim"
                rules={[{ required: true, message: t("adminSettings.sso.form.groupClaimRequired") }]}
              >
                <TextInput />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_role_mappings !== currentValues.use_role_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useRoleMappings = getFieldValue("use_role_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsRoleMappings = provider === "okta" || provider === "generic";
            return useRoleMappings && supportsRoleMappings ? (
              <>
                <Form.Item label={t("adminSettings.sso.defaultRole")} name="default_role" initialValue="Internal User">
                  <Select>
                    <Select.Option value="internal_user_viewer">
                      {t("adminSettings.sso.roles.internalViewer")}
                    </Select.Option>
                    <Select.Option value="internal_user">{t("adminSettings.sso.roles.internalUser")}</Select.Option>
                    <Select.Option value="proxy_admin_viewer">{t("adminSettings.sso.roles.adminViewer")}</Select.Option>
                    <Select.Option value="proxy_admin">{t("adminSettings.sso.roles.proxyAdmin")}</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label={t("adminSettings.sso.form.proxyAdminTeams")} name="proxy_admin_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label={t("adminSettings.sso.form.adminViewerTeams")} name="admin_viewer_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label={t("adminSettings.sso.form.internalUserTeams")} name="internal_user_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label={t("adminSettings.sso.form.internalViewerTeams")} name="internal_viewer_teams">
                  <TextInput />
                </Form.Item>
              </>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider === "okta" || provider === "generic" ? (
              <Form.Item
                label={t("adminSettings.sso.form.useTeamMappings")}
                name="use_team_mappings"
                valuePropName="checked"
              >
                <Checkbox />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_team_mappings !== currentValues.use_team_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useTeamMappings = getFieldValue("use_team_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsTeamMappings = provider === "okta" || provider === "generic";
            return useTeamMappings && supportsTeamMappings ? (
              <Form.Item
                label={t("adminSettings.sso.fields.teamIdsJwtField")}
                name="team_ids_jwt_field"
                rules={[{ required: true, message: t("adminSettings.sso.form.teamIdsRequired") }]}
              >
                <TextInput />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>
      </Form>
    </div>
  );
};

export default BaseSSOSettingsForm;
