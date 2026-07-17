import { useEffect, useState } from "react";
import { TextInput, SelectItem } from "@tremor/react";

import { Button as Button2, Modal, Form, Select as Select2, InputNumber } from "antd";

import NumericalInput from "@/components/shared/numerical_input";
import { useTranslation } from "react-i18next";
import { getLocalizedUserRole } from "@/utils/roles";
import BudgetDurationDropdown from "@/components/common_components/budget_duration_dropdown";

interface EditUserModalProps {
  visible: boolean;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onCancel: () => void;
  user: any;
  onSubmit: (data: any) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ visible, possibleUIRoles, onCancel, user, onSubmit }) => {
  const { t } = useTranslation();
  const [editedUser, setEditedUser] = useState(user);
  const [form] = Form.useForm();

  useEffect(() => {
    form.resetFields();
  }, [user]);

  const handleCancel = async () => {
    form.resetFields();
    onCancel();
  };

  const handleEditSubmit = async (formValues: Record<string, any>) => {
    // Call API to update team with teamId and values
    onSubmit(formValues);
    form.resetFields();
    onCancel();
  };

  if (!user) {
    return null;
  }

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      title={t("userManagement.form.editUserTitle", { id: user.user_id })}
      width={1000}
    >
      <Form
        form={form}
        onFinish={handleEditSubmit}
        initialValues={user} // Pass initial values here
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
      >
        <>
          <Form.Item
            className="mt-8"
            label={t("userManagement.form.userEmail")}
            tooltip={t("userManagement.form.userEmailHelp")}
            name="user_email"
          >
            <TextInput />
          </Form.Item>

          <Form.Item label="user_id" name="user_id" hidden={true}>
            <TextInput />
          </Form.Item>

          <Form.Item label={t("userManagement.form.userRole")} name="user_role">
            <Select2>
              {possibleUIRoles &&
                Object.keys(possibleUIRoles).map((role) => {
                  const localizedRole = getLocalizedUserRole(role, possibleUIRoles, t);
                  return (
                    <SelectItem key={role} value={role} title={localizedRole.label}>
                      <div className="flex">
                        {localizedRole.label}{" "}
                        <p className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                          {localizedRole.description}
                        </p>
                      </div>
                    </SelectItem>
                  );
                })}
            </Select2>
          </Form.Item>

          <Form.Item
            label={t("userManagement.fields.spend")}
            name="spend"
            tooltip="(float) - Spend of all LLM calls completed by this user"
            help={t("userManagement.form.spendHelp")}
          >
            <InputNumber min={0} step={0.01} />
          </Form.Item>

          <Form.Item
            label={t("userManagement.form.userBudget")}
            name="max_budget"
            tooltip="(float) - Maximum budget of this user"
            help={t("userManagement.form.userBudgetHelp")}
          >
            <NumericalInput min={0} step={0.01} />
          </Form.Item>

          <Form.Item label={t("userManagement.form.resetBudget")} name="budget_duration">
            <BudgetDurationDropdown />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button2 htmlType="submit">{t("userManagement.actions.save")}</Button2>
          </div>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button2 htmlType="submit">{t("userManagement.actions.save")}</Button2>
          </div>
        </>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
