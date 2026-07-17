import React from "react";
import { Form, Button, Tooltip, Typography, Modal } from "antd";
import { TextInput } from "@tremor/react";
import { CredentialItem } from "../networking";
import { useTranslation } from "react-i18next";
const { Title, Link } = Typography;

interface ReuseCredentialsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onAddCredential: (values: any) => void;
  existingCredential: CredentialItem | null;
  setIsCredentialModalOpen: (isVisible: boolean) => void;
}

const ReuseCredentialsModal: React.FC<ReuseCredentialsModalProps> = ({
  isVisible,
  onCancel,
  onAddCredential,
  existingCredential,
  setIsCredentialModalOpen,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onAddCredential(values);
    form.resetFields();
    setIsCredentialModalOpen(false);
  };

  return (
    <Modal
      title={t("modelsAndEndpoints.reuseCredentials.title")}
      open={isVisible}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={null}
      width={600}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {/* Credential Name */}
        <Form.Item
          label={t("modelsAndEndpoints.credentials.nameLabel")}
          name="credential_name"
          rules={[{ required: true, message: t("modelsAndEndpoints.credentials.nameRequired") }]}
          initialValue={existingCredential?.credential_name}
        >
          <TextInput placeholder={t("modelsAndEndpoints.credentials.namePlaceholder")} />
        </Form.Item>

        {/* Display Credential Values of existingCredential, don't allow user to edit. Credential values is a dictionary */}
        {Object.entries(existingCredential?.credential_values || {}).map(([key, value]) => (
          <Form.Item key={key} label={key} name={key} initialValue={value}>
            <TextInput
              placeholder={t("modelsAndEndpoints.reuseCredentials.valuePlaceholder", { field: key })}
              disabled={true}
            />
          </Form.Item>
        ))}

        {/* Modal Footer */}
        <div className="flex justify-between items-center">
          <Tooltip title={t("modelsAndEndpoints.credentials.helpTooltip")}>
            <Link href="https://github.com/BerriAI/litellm/issues">{t("modelsAndEndpoints.credentials.help")}</Link>
          </Tooltip>

          <div>
            <Button
              onClick={() => {
                onCancel();
                form.resetFields();
              }}
              style={{ marginRight: 10 }}
            >
              {t("common.cancel")}
            </Button>
            <Button htmlType="submit">{t("modelsAndEndpoints.reuseCredentials.submit")}</Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default ReuseCredentialsModal;
