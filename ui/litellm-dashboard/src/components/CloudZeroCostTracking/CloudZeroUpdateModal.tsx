import { useCloudZeroUpdateSettings } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Form, Input, Modal } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { useEffect } from "react";
import { CloudZeroSettings } from "./types";
import { useTranslation } from "react-i18next";

interface CloudZeroUpdateModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  settings: CloudZeroSettings;
}

export default function CloudZeroUpdateModal({ open, onOk, onCancel, settings }: CloudZeroUpdateModalProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [form] = Form.useForm();
  const updateMutation = useCloudZeroUpdateSettings(accessToken || "");

  useEffect(() => {
    if (open && settings) {
      form.setFieldsValue({
        connection_id: settings.connection_id,
        timezone: settings.timezone || "UTC",
        api_key: "",
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, settings, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      updateMutation.mutate(
        {
          connection_id: values.connection_id,
          timezone: values.timezone || "UTC",
          ...(values.api_key && { api_key: values.api_key }),
        },
        {
          onSuccess: () => {
            MessageManager.success(t("loggingAndAlerts.cloudZero.notifications.updated"));
            form.resetFields();
            onOk();
          },
          onError: (error: any) => {
            if (error?.errorFields) {
              return;
            }
            MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.updateFailed"));
          },
        },
      );
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.updateFailed"));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={t("loggingAndAlerts.cloudZero.editTitle")}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={updateMutation.isPending}
      okText={
        updateMutation.isPending ? t("loggingAndAlerts.cloudZero.updating") : t("loggingAndAlerts.cloudZero.update")
      }
      cancelText={t("loggingAndAlerts.cloudZero.cancel")}
      okButtonProps={{
        disabled: updateMutation.isPending,
      }}
      cancelButtonProps={{
        disabled: updateMutation.isPending,
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={t("loggingAndAlerts.cloudZero.apiKey")}
          name="api_key"
          rules={[{ required: false, message: t("loggingAndAlerts.cloudZero.apiKeyRequired") }]}
          tooltip={t("loggingAndAlerts.cloudZero.apiKeyKeepHelp")}
        >
          <Input.Password placeholder={t("loggingAndAlerts.cloudZero.apiKeyKeepPlaceholder")} />
        </Form.Item>
        <Form.Item
          label={t("loggingAndAlerts.cloudZero.connectionId")}
          name="connection_id"
          rules={[{ required: true, message: t("loggingAndAlerts.cloudZero.connectionIdRequired") }]}
        >
          <Input placeholder={t("loggingAndAlerts.cloudZero.connectionIdPlaceholder")} />
        </Form.Item>
        <Form.Item
          label={t("loggingAndAlerts.cloudZero.timezone")}
          name="timezone"
          tooltip={t("loggingAndAlerts.cloudZero.timezoneHelp")}
        >
          <Input placeholder="UTC" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
