"use client";

import { useState } from "react";
import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useDeleteHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import NotificationManager from "@/components/molecules/notifications_manager";
import { testHashicorpVaultConnection } from "@/app/(dashboard)/hooks/configOverrides/hashicorpVaultApi";
import { Alert, Button, Card, Descriptions, Flex, Skeleton, Space, Typography } from "antd";
import { Edit, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { SENSITIVE_FIELDS, FIELD_LABELS } from "./constants";
import EditHashicorpVaultModal from "./EditHashicorpVaultModal";
import HashicorpVaultEmptyPlaceholder from "./HashicorpVaultEmptyPlaceholder";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

function detectAuthMethod(values: Record<string, any>): string {
  if (values.approle_role_id || values.approle_secret_id) return "AppRole";
  if (values.client_cert && values.client_key) return "TLS Certificate";
  if (values.vault_token) return "Token";
  return "None";
}

const descriptionsConfig = {
  column: { xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 },
};

export default function HashicorpVault() {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useHashicorpVaultConfig();
  const { mutate: deleteConfig, isPending: isDeleting } = useDeleteHashicorpVaultConfig(accessToken);
  const { mutate: updateConfig, isPending: isClearingField } = useUpdateHashicorpVaultConfig(accessToken);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clearingField, setClearingField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const rawValues = data?.values ?? {};
  const isConfigured = Boolean(rawValues.vault_addr);

  const handleTestConnection = async () => {
    if (!accessToken) return;
    setIsTesting(true);
    try {
      await testHashicorpVaultConnection(accessToken);
      NotificationManager.success(t("adminSettings.vault.connectionSuccess"));
    } catch (err) {
      NotificationManager.fromBackend(err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    deleteConfig(undefined, {
      onSuccess: () => {
        NotificationManager.success(t("adminSettings.vault.deleted"));
        setIsDeleteModalOpen(false);
      },
      onError: (err) => {
        NotificationManager.fromBackend(err);
      },
    });
  };

  const handleClearField = () => {
    if (!clearingField) return;
    updateConfig(
      { [clearingField]: "" },
      {
        onSuccess: () => {
          NotificationManager.success(
            t("adminSettings.vault.fieldCleared", {
              field: t(`adminSettings.vault.fields.${clearingField}`, {
                defaultValue: FIELD_LABELS[clearingField] ?? clearingField,
              }),
            }),
          );
          setClearingField(null);
        },
        onError: (err) => {
          NotificationManager.fromBackend(err);
        },
      },
    );
  };

  const renderValue = (key: string) => {
    const value = rawValues[key];
    if (!value) {
      return <span className="text-gray-400 italic">{t("adminSettings.sso.notConfigured")}</span>;
    }
    if (SENSITIVE_FIELDS.has(key)) {
      return (
        <Flex justify="space-between" align="center">
          <Text className="font-mono text-gray-600">{value}</Text>
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setClearingField(key)}
          />
        </Flex>
      );
    }
    return <Text className="font-mono text-gray-600">{value}</Text>;
  };

  const renderSettings = () => {
    // Only show fields that have values, plus auth method
    const fieldsToShow = Object.entries(rawValues).filter(([_, value]) => value != null && value !== "");

    if (fieldsToShow.length === 0) return null;

    return (
      <Descriptions bordered {...descriptionsConfig}>
        <Descriptions.Item label={t("adminSettings.vault.authMethod")}>
          <Text>
            {t(`adminSettings.vault.authMethods.${detectAuthMethod(rawValues)}`, {
              defaultValue: detectAuthMethod(rawValues),
            })}
          </Text>
        </Descriptions.Item>
        {fieldsToShow.map(([key]) => (
          <Descriptions.Item
            key={key}
            label={t(`adminSettings.vault.fields.${key}`, { defaultValue: FIELD_LABELS[key] ?? key })}
          >
            {renderValue(key)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  return (
    <>
      {isLoading ? (
        <Card>
          <Skeleton active />
        </Card>
      ) : isError ? (
        <Card>
          <Alert
            type="error"
            message={t("adminSettings.vault.loadFailed")}
            description={error instanceof Error ? error.message : undefined}
          />
        </Card>
      ) : (
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            {/* Header */}
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={12}>
                <KeyRound className="w-6 h-6 text-gray-400" />
                <div>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    Hashicorp Vault
                  </Title>
                  <Text type="secondary">{t("adminSettings.vault.description")}</Text>
                </div>
              </Flex>

              <Space>
                {isConfigured && (
                  <>
                    <Button icon={<PlugZap className="w-4 h-4" />} loading={isTesting} onClick={handleTestConnection}>
                      {t("adminSettings.vault.testConnection")}
                    </Button>
                    <Button icon={<Edit className="w-4 h-4" />} onClick={() => setIsEditModalVisible(true)}>
                      {t("adminSettings.vault.editConfiguration")}
                    </Button>
                    <Button danger icon={<Trash2 className="w-4 h-4" />} onClick={() => setIsDeleteModalOpen(true)}>
                      {t("adminSettings.vault.deleteConfiguration")}
                    </Button>
                  </>
                )}
              </Space>
            </Flex>

            {isConfigured && (
              <Alert
                type="info"
                showIcon
                message={t("adminSettings.vault.secretFieldWarning")}
                description={
                  <>
                    <Text code>vault kv put secret/SECRET_NAME key=secret_value</Text>
                    <br />
                    <Typography.Link
                      href="https://docs.litellm.ai/docs/secret_managers/hashicorp_vault"
                      target="_blank"
                    >
                      {t("adminSettings.vault.viewDocs")}
                    </Typography.Link>
                  </>
                }
              />
            )}

            {isConfigured ? (
              renderSettings()
            ) : (
              <HashicorpVaultEmptyPlaceholder onAdd={() => setIsEditModalVisible(true)} />
            )}
          </Space>
        </Card>
      )}

      <EditHashicorpVaultModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => setIsEditModalVisible(false)}
      />

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t("adminSettings.vault.deleteTitle")}
        message={t("adminSettings.vault.deleteMessage")}
        resourceInformationTitle={t("adminSettings.vault.configuration")}
        resourceInformation={[{ label: t("adminSettings.vault.fields.vault_addr"), value: rawValues.vault_addr }]}
        onCancel={() => setIsDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={isDeleting}
      />

      <DeleteResourceModal
        isOpen={clearingField !== null}
        title={t("adminSettings.vault.clearTitle", {
          field: clearingField
            ? t(`adminSettings.vault.fields.${clearingField}`, {
                defaultValue: FIELD_LABELS[clearingField] ?? clearingField,
              })
            : "",
        })}
        message={t("adminSettings.vault.clearMessage")}
        resourceInformationTitle={t("adminSettings.vault.field")}
        resourceInformation={[
          {
            label: t("adminSettings.vault.field"),
            value: clearingField
              ? t(`adminSettings.vault.fields.${clearingField}`, {
                  defaultValue: FIELD_LABELS[clearingField] ?? clearingField,
                })
              : "",
          },
        ]}
        onCancel={() => setClearingField(null)}
        onOk={handleClearField}
        confirmLoading={isClearingField}
      />
    </>
  );
}
