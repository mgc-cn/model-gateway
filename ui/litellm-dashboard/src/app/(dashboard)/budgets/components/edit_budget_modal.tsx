import React, { useEffect } from "react";
import { TextInput, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { Button as Button2, Modal, Form, InputNumber, Select } from "antd";
import { useUpdateBudget } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import { budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { useTranslation } from "react-i18next";

interface EditBudgetModalProps {
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  existingBudget: budgetItem;
}
const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ isModalVisible, setIsModalVisible, existingBudget }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const updateBudget = useUpdateBudget();

  useEffect(() => {
    form.setFieldsValue(existingBudget);
  }, [existingBudget, form]);

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleUpdate = async (formValues: Record<string, unknown>) => {
    try {
      NotificationsManager.info(t("budgetManagement.notifications.updating"));
      await updateBudget.mutateAsync(formValues);
      NotificationsManager.success(t("budgetManagement.notifications.updated"));
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating the budget:", error);
      NotificationsManager.fromBackend(t("budgetManagement.notifications.updateFailed", { error: String(error) }));
    }
  };

  return (
    <Modal
      title={t("budgetManagement.form.editTitle")}
      open={isModalVisible}
      width={800}
      footer={null}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form
        form={form}
        onFinish={handleUpdate}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        initialValues={existingBudget}
      >
        <>
          <Form.Item
            label={t("budgetManagement.fields.budgetId")}
            name="budget_id"
            help={t("budgetManagement.form.budgetIdCannotChange")}
          >
            <TextInput placeholder="" disabled={true} />
          </Form.Item>
          <Form.Item
            label={t("budgetManagement.form.maxTokensPerMinute")}
            name="tpm_limit"
            help={t("budgetManagement.form.defaultModelLimit")}
          >
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>
          <Form.Item
            label={t("budgetManagement.form.maxRequestsPerMinute")}
            name="rpm_limit"
            help={t("budgetManagement.form.defaultModelLimit")}
          >
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>

          <Accordion className="mt-20 mb-8">
            <AccordionHeader>
              <b>{t("budgetManagement.form.optionalSettings")}</b>
            </AccordionHeader>
            <AccordionBody>
              <Form.Item label={t("budgetManagement.form.maxBudgetUsd")} name="max_budget">
                <InputNumber step={0.01} precision={2} width={200} />
              </Form.Item>
              <Form.Item className="mt-8" label={t("budgetManagement.form.resetBudget")} name="budget_duration">
                <Select placeholder="n/a">
                  <Select.Option value="24h">{t("budgetManagement.form.daily")}</Select.Option>
                  <Select.Option value="7d">{t("budgetManagement.form.weekly")}</Select.Option>
                  <Select.Option value="30d">{t("budgetManagement.form.monthly")}</Select.Option>
                </Select>
              </Form.Item>
            </AccordionBody>
          </Accordion>
        </>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button2 htmlType="submit">{t("budgetManagement.form.save")}</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default EditBudgetModal;
