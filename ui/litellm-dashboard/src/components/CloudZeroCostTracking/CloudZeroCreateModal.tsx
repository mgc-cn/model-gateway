import { Form, Modal, Input } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { useEffect } from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useCloudZeroCreate } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroCreate";
import { useTranslation } from "react-i18next";

interface CloudZeroCreationModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export default function CloudZeroCreationModal({ open, onOk, onCancel }: CloudZeroCreationModalProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [form] = Form.useForm();
  const createMutation = useCloudZeroCreate(accessToken || "");

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate(
        {
          connection_id: values.connection_id,
          timezone: values.timezone || "UTC",
          ...(values.api_key && { api_key: values.api_key }),
        },
        {
          onSuccess: () => {
            MessageManager.success(t("loggingAndAlerts.cloudZero.notifications.created"));
            form.resetFields();
            onOk();
          },
          onError: (error: any) => {
            if (error?.errorFields) {
              return;
            }
            MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.createFailed"));
          },
        },
      );
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      MessageManager.error(error?.message || t("loggingAndAlerts.cloudZero.notifications.createFailed"));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={t("loggingAndAlerts.cloudZero.createTitle")}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={createMutation.isPending}
      okText={
        createMutation.isPending ? t("loggingAndAlerts.cloudZero.creating") : t("loggingAndAlerts.cloudZero.create")
      }
      cancelText={t("loggingAndAlerts.cloudZero.cancel")}
      okButtonProps={{
        disabled: createMutation.isPending,
      }}
      cancelButtonProps={{
        disabled: createMutation.isPending,
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={t("loggingAndAlerts.cloudZero.apiKey")}
          name="api_key"
          rules={[{ required: true, message: t("loggingAndAlerts.cloudZero.apiKeyRequired") }]}
        >
          <Input.Password placeholder={t("loggingAndAlerts.cloudZero.apiKeyPlaceholder")} />
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
