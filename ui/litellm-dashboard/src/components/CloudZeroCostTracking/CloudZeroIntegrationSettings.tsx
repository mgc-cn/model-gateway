import { useCloudZeroDryRun } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroDryRun";
import { useCloudZeroExport } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroExport";
import { useCloudZeroDeleteSettings } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { Alert, Button, Card, Descriptions, Divider, Popconfirm, Tag } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { CheckCircle, Edit, Play, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import CloudZeroUpdateModal from "./CloudZeroUpdateModal";
import { CloudZeroSettings } from "./types";
import { useTranslation } from "react-i18next";

interface CloudZeroIntegrationSettingsProps {
  settings: CloudZeroSettings;
  onSettingsUpdated: () => void;
}

export function CloudZeroIntegrationSettings({ settings, onSettingsUpdated }: CloudZeroIntegrationSettingsProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const dryRunMutation = useCloudZeroDryRun(accessToken || "");
  const exportMutation = useCloudZeroExport(accessToken || "");
  const deleteMutation = useCloudZeroDeleteSettings(accessToken || "");

  const handleDryRun = () => {
    if (!accessToken) return;

    dryRunMutation.mutate(
      { limit: 10 },
      {
        onSuccess: (data) => {
          MessageManager.success(t("loggingAndAlerts.cloudZero.notifications.dryRunComplete"));
        },
        onError: (error) => {
          MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.dryRunFailed"));
        },
      },
    );
  };

  const dryRunResult = dryRunMutation.data ? JSON.stringify(dryRunMutation.data, null, 2) : null;

  const handleExport = () => {
    if (!accessToken) return;

    exportMutation.mutate(
      { operation: "replace_hourly" },
      {
        onSuccess: () => {
          MessageManager.success(t("loggingAndAlerts.cloudZero.notifications.exported"));
        },
        onError: (error) => {
          MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.exportFailed"));
        },
      },
    );
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditModalOk = async () => {
    setIsEditModalOpen(false);
    onSettingsUpdated();
  };

  const handleEditModalCancel = () => {
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!accessToken) return;

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        MessageManager.success(t("loggingAndAlerts.cloudZero.notifications.deleted"));
        setIsDeleteModalOpen(false);
        onSettingsUpdated();
      },
      onError: (error) => {
        MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.deleteFailed"));
      },
    });
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6 w-full max-w-4xl mx-auto">
        <Card
          title={
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{t("loggingAndAlerts.cloudZero.configuration")}</span>
              <Tag color="success" className="ml-2 capitalize">
                {settings.status?.toLowerCase() === "active"
                  ? t("loggingAndAlerts.cloudZero.active")
                  : settings.status || t("loggingAndAlerts.cloudZero.active")}
              </Tag>
            </div>
          }
          extra={
            <div className="flex gap-2">
              <Button icon={<Edit size={16} />} onClick={handleEdit} className="flex items-center gap-2">
                {t("loggingAndAlerts.cloudZero.edit")}
              </Button>
              <Button
                danger
                icon={<Trash2 size={16} />}
                onClick={handleDeleteClick}
                className="flex items-center gap-2"
              >
                {t("loggingAndAlerts.cloudZero.delete")}
              </Button>
            </div>
          }
          className="shadow-xs"
        >
          <Descriptions
            bordered
            column={{
              xxl: 1,
              xl: 1,
              lg: 1,
              md: 1,
              sm: 1,
              xs: 1,
            }}
          >
            <Descriptions.Item label={t("loggingAndAlerts.cloudZero.apiKeyRedacted")}>
              <span className="font-mono text-gray-600">
                {settings.api_key_masked || (
                  <span className="text-gray-400 italic">{t("loggingAndAlerts.cloudZero.notConfigured")}</span>
                )}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("loggingAndAlerts.cloudZero.connectionId")}>
              <span className="font-mono text-gray-600">
                {settings.connection_id || (
                  <span className="text-gray-400 italic">{t("loggingAndAlerts.cloudZero.notConfigured")}</span>
                )}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("loggingAndAlerts.cloudZero.timezone")}>
              {settings.timezone || (
                <span className="text-gray-400 italic">{t("loggingAndAlerts.cloudZero.defaultUtc")}</span>
              )}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" className="text-gray-500">
            {t("loggingAndAlerts.cloudZero.actions")}
          </Divider>

          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={handleDryRun}
              loading={dryRunMutation.isPending}
              icon={<Play size={16} />}
              className="flex items-center gap-2"
            >
              {t("loggingAndAlerts.cloudZero.dryRun")}
            </Button>

            <Popconfirm
              title={t("loggingAndAlerts.cloudZero.exportTitle")}
              description={t("loggingAndAlerts.cloudZero.exportDescription")}
              onConfirm={handleExport}
              okText={t("loggingAndAlerts.cloudZero.export")}
              cancelText={t("loggingAndAlerts.cloudZero.cancel")}
            >
              <Button
                type="primary"
                loading={exportMutation.isPending}
                icon={<Upload size={16} />}
                className="flex items-center gap-2"
              >
                {t("loggingAndAlerts.cloudZero.exportNow")}
              </Button>
            </Popconfirm>
          </div>

          {dryRunResult && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <Alert
                message={t("loggingAndAlerts.cloudZero.dryRunResults")}
                description={
                  <div className="mt-2">
                    <p className="mb-2 text-gray-600">
                      {t("loggingAndAlerts.cloudZero.simulationOutput", {
                        connectionId: settings.connection_id,
                      })}
                    </p>
                    <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto text-xs font-mono text-gray-800">
                      {dryRunResult}
                    </pre>
                  </div>
                }
                type="info"
                showIcon
                icon={<CheckCircle className="text-blue-500" />}
              />
            </div>
          )}
        </Card>
      </div>

      <CloudZeroUpdateModal
        open={isEditModalOpen}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        settings={settings}
      />

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t("loggingAndAlerts.cloudZero.deleteTitle")}
        message={t("loggingAndAlerts.cloudZero.deleteMessage")}
        resourceInformationTitle={t("loggingAndAlerts.cloudZero.integrationDetails")}
        resourceInformation={[
          {
            label: t("loggingAndAlerts.cloudZero.connectionId"),
            value: settings.connection_id,
            code: true,
          },
          {
            label: t("loggingAndAlerts.cloudZero.timezone"),
            value: settings.timezone || t("loggingAndAlerts.cloudZero.defaultUtc"),
          },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={deleteMutation.isPending}
      />
    </>
  );
}
