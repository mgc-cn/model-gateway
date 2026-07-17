"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Modal, Typography } from "antd";
import type { MemoryRow } from "@/components/networking";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface MemoryEditModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: MemoryRow;
  onClose: () => void;
  onSave: (key: string, value: string, metadataText: string, isCreate: boolean) => Promise<boolean>;
}

export const MemoryEditModal: React.FC<MemoryEditModalProps> = ({ open, mode, initialRow, onClose, onSave }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRow) {
      form.setFieldsValue({
        key: initialRow.key,
        value: initialRow.value,
        metadata: initialRow.metadata != null ? JSON.stringify(initialRow.metadata, null, 2) : "",
      });
    } else {
      form.resetFields();
    }
  }, [open, mode, initialRow, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    const ok = await onSave(values.key.trim(), values.value ?? "", values.metadata ?? "", mode === "create");
    setSubmitting(false);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={
        mode === "create"
          ? t("memoryManagement.form.createTitle")
          : t("memoryManagement.form.editTitle", { key: initialRow?.key ?? "" })
      }
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={mode === "create" ? t("memoryManagement.form.create") : t("memoryManagement.form.save")}
      cancelText={t("common.cancel")}
      confirmLoading={submitting}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("memoryManagement.fields.key")}
          name="key"
          rules={[{ required: true, message: t("memoryManagement.form.keyRequired") }]}
          tooltip={t("memoryManagement.form.keyTooltip")}
        >
          <Input placeholder={t("memoryManagement.form.keyPlaceholder")} disabled={mode === "edit"} />
        </Form.Item>
        <Form.Item
          label={t("memoryManagement.fields.value")}
          name="value"
          rules={[{ required: true, message: t("memoryManagement.form.valueRequired") }]}
          tooltip={t("memoryManagement.form.valueTooltip")}
        >
          <Input.TextArea rows={8} placeholder={t("memoryManagement.form.valuePlaceholder")} />
        </Form.Item>
        <Form.Item
          label={
            <span>
              {t("memoryManagement.fields.metadata")}{" "}
              <Text type="secondary">{t("memoryManagement.form.optionalJson")}</Text>
            </span>
          }
          name="metadata"
          tooltip={t("memoryManagement.form.metadataTooltip")}
        >
          <Input.TextArea
            rows={4}
            placeholder='{"tags": ["example"]}'
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MemoryEditModal;
