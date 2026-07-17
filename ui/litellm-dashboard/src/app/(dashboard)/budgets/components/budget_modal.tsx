import React from "react";
import { TextInput, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { Button as Button2, Modal, Form, InputNumber, Select } from "antd";
import { useCreateBudget } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { useTranslation } from "react-i18next";

interface BudgetModalProps {
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
const BudgetModal: React.FC<BudgetModalProps> = ({ isModalVisible, setIsModalVisible }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const createBudget = useCreateBudget();

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreate = async (formValues: Record<string, unknown>) => {
    try {
      NotificationsManager.info(t("budgetManagement.notifications.creating"));
      await createBudget.mutateAsync(formValues);
      NotificationsManager.success(t("budgetManagement.notifications.created"));
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error creating the budget:", error);
      NotificationsManager.fromBackend(t("budgetManagement.notifications.createFailed", { error: String(error) }));
    }
  };

  return (
    <Modal
      title={t("budgetManagement.form.createTitle")}
      open={isModalVisible}
      width={800}
      footer={null}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <>
          <Form.Item
            label={t("budgetManagement.fields.budgetId")}
            name="budget_id"
            rules={[
              {
                required: true,
                message: t("budgetManagement.form.budgetIdRequired"),
              },
            ]}
            help={t("budgetManagement.form.budgetIdHelp")}
          >
            <TextInput placeholder="" />
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
          <Button2 htmlType="submit">{t("budgetManagement.form.create")}</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default BudgetModal;
