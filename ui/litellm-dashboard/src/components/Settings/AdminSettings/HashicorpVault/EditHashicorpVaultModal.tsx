"use client";

import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import NotificationManager from "@/components/molecules/notifications_manager";
import { Button, Divider, Form, Input, Modal, Space, Typography } from "antd";
import React, { useEffect } from "react";
import { SENSITIVE_FIELDS, FIELD_LABELS } from "./constants";
import { useTranslation } from "react-i18next";

interface FieldGroup {
  key: string;
  fields: string[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    key: "connection",
    fields: ["vault_addr", "vault_namespace", "vault_mount_name", "vault_path_prefix"],
  },
  {
    key: "token",
    fields: ["vault_token"],
  },
  {
    key: "approle",
    fields: ["approle_role_id", "approle_secret_id", "approle_mount_path"],
  },
  {
    key: "tls",
    fields: ["client_cert", "client_key", "vault_cert_role"],
  },
];

interface EditHashicorpVaultModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditHashicorpVaultModal: React.FC<EditHashicorpVaultModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { accessToken } = useAuthorized();
  const { data } = useHashicorpVaultConfig();
  const { mutate, isPending } = useUpdateHashicorpVaultConfig(accessToken);

  const schema = data?.field_schema;
  const properties = schema?.properties ?? {};
  const rawValues = data?.values ?? {};

  useEffect(() => {
    if (isVisible && data) {
      form.resetFields();
      // Only set non-sensitive fields — sensitive ones show as placeholders
      const formValues: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawValues)) {
        if (!SENSITIVE_FIELDS.has(key)) {
          formValues[key] = value;
        }
      }
      form.setFieldsValue(formValues);
    }
  }, [isVisible, data, form]);

  const handleSubmit = (formValues: Record<string, any>) => {
    const config: Record<string, any> = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (value !== undefined && value !== null && value !== "") {
        // Non-empty value → update
        config[key] = value;
      } else if (!SENSITIVE_FIELDS.has(key)) {
        // Non-sensitive field cleared → send "" to clear it on the backend
        config[key] = "";
      }
      // Sensitive field left blank → omit from payload (keep existing)
    }

    mutate(config, {
      onSuccess: () => {
        NotificationManager.success(t("adminSettings.vault.updated"));
        onSuccess();
      },
      onError: (err) => {
        NotificationManager.fromBackend(err);
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const renderField = (fieldName: string) => {
    const fieldSchema = properties[fieldName];
    if (!fieldSchema) return null;

    const rules =
      fieldName === "vault_addr"
        ? [{ pattern: /^https?:\/\/.+/, message: t("adminSettings.vault.urlProtocol") }]
        : undefined;

    const isSensitive = SENSITIVE_FIELDS.has(fieldName);
    const existingValue = rawValues[fieldName];
    const hasExistingValue = isSensitive && existingValue != null && existingValue !== "";
    const placeholder = hasExistingValue
      ? t("adminSettings.vault.keepExisting", { value: existingValue })
      : t(`adminSettings.vault.fieldHelp.${fieldName}`, { defaultValue: fieldSchema?.description });

    return (
      <Form.Item
        key={fieldName}
        name={fieldName}
        label={t(`adminSettings.vault.fields.${fieldName}`, { defaultValue: FIELD_LABELS[fieldName] ?? fieldName })}
        rules={rules}
      >
        {isSensitive ? <Input.Password placeholder={placeholder} /> : <Input placeholder={fieldSchema?.description} />}
      </Form.Item>
    );
  };

  return (
    <Modal
      title={t("adminSettings.vault.editTitle")}
      open={isVisible}
      width={700}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={isPending}>
            {t("adminSettings.actions.cancel")}
          </Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>
            {isPending ? t("adminSettings.actions.saving") : t("adminSettings.actions.save")}
          </Button>
        </Space>
      }
      onCancel={handleCancel}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {FIELD_GROUPS.map((group, index) => (
          <div key={group.key}>
            {index > 0 && <Divider />}
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              {t(`adminSettings.vault.groups.${group.key}.title`)}
            </Typography.Title>
            {group.key !== "connection" && (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {t(`adminSettings.vault.groups.${group.key}.description`)}
              </Typography.Paragraph>
            )}
            {group.fields.map(renderField)}
          </div>
        ))}
      </Form>
    </Modal>
  );
};

export default EditHashicorpVaultModal;
