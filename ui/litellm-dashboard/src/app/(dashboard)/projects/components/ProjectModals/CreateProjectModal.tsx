import { Modal, Form, Button, Typography } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import MessageManager from "@/components/molecules/message_manager";
import { useCreateProject, ProjectCreateParams } from "@/app/(dashboard)/hooks/projects/useCreateProject";
import { ProjectBaseForm, ProjectFormValues } from "./ProjectBaseForm";
import { buildProjectApiParams } from "./projectFormUtils";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProjectFormValues>();
  const createMutation = useCreateProject();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const params: ProjectCreateParams = {
        ...buildProjectApiParams(values),
        team_id: values.team_id,
      };

      createMutation.mutate(params, {
        onSuccess: () => {
          MessageManager.success(i18n.t("projectManagement.notifications.created"));
          form.resetFields();
          onClose();
        },
        onError: (error) => {
          MessageManager.error(error.message || i18n.t("projectManagement.notifications.createFailed"));
        },
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Typography.Text strong style={{ fontSize: 18 }}>
          {t("projectManagement.form.createTitle")}
        </Typography.Text>
      }
      open={isOpen}
      onCancel={handleCancel}
      width={720}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t("common.cancel")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<FolderAddOutlined />}
          loading={createMutation.isPending}
          onClick={handleSubmit}
        >
          {t("projectManagement.create")}
        </Button>,
      ]}
    >
      <ProjectBaseForm form={form} />
    </Modal>
  );
}
