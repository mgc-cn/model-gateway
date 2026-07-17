"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { getConfigFieldSetting, updateConfigFieldSetting } from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useTranslation } from "react-i18next";

const { Title, Text, Paragraph } = Typography;

interface Plugin {
  name: string;
  display_name: string;
  url: string;
  plugin_key?: string;
}

export default function PluginSettings() {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm<Plugin>();

  useEffect(() => {
    if (!accessToken) return;
    getConfigFieldSetting(accessToken, "plugins")
      .then((data) => {
        const val = data?.field_value;
        setPlugins(Array.isArray(val) ? val : []);
      })
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const save = async (updated: Plugin[]) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateConfigFieldSetting(accessToken, "plugins", updated);
      setPlugins(updated);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    // plugin_key arrives redacted ("***"); start it blank so an untouched save
    // keeps the stored credential instead of overwriting it with the placeholder.
    form.setFieldsValue({ ...plugins[idx], plugin_key: "" });
    setModalOpen(true);
  };

  const handleDelete = (idx: number) => {
    const updated = plugins.filter((_, i) => i !== idx);
    save(updated);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const updated =
      editingIndex !== null ? plugins.map((p, i) => (i === editingIndex ? values : p)) : [...plugins, values];
    await save(updated);
    setModalOpen(false);
  };

  const columns = [
    {
      title: t("adminSettings.plugins.columns.name"),
      dataIndex: "name",
      key: "name",
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: t("adminSettings.plugins.columns.displayName"), dataIndex: "display_name", key: "display_name" },
    {
      title: t("adminSettings.plugins.columns.url"),
      dataIndex: "url",
      key: "url",
      render: (v: string) => (
        <a href={v} target="_blank" rel="noopener noreferrer">
          {v}
        </a>
      ),
    },
    {
      title: t("adminSettings.plugins.columns.key"),
      dataIndex: "plugin_key",
      key: "plugin_key",
      render: (v?: string) => (v ? <Text code>{"•".repeat(8)}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: t("adminSettings.plugins.columns.actions"),
      key: "actions",
      render: (_: unknown, __: Plugin, idx: number) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(idx)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(idx)} />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>{t("adminSettings.plugins.title")}</Title>
      <Paragraph>{t("adminSettings.plugins.description")}</Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        {t("adminSettings.plugins.manifestPrefix")} <Text code>GET /api/plugin-manifest</Text>{" "}
        {t("adminSettings.plugins.manifestSuffix")}
      </Paragraph>

      <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginBottom: 16 }}>
        {t("adminSettings.plugins.add")}
      </Button>

      <Table dataSource={plugins} columns={columns} rowKey="name" loading={loading} pagination={false} size="small" />

      <Modal
        title={editingIndex !== null ? t("adminSettings.plugins.edit") : t("adminSettings.plugins.add")}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={t("adminSettings.actions.save")}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={t("adminSettings.plugins.fields.name")}
            rules={[{ required: true, message: t("adminSettings.plugins.required") }]}
            extra={t("adminSettings.plugins.fields.nameHelp")}
          >
            <Input placeholder={t("adminSettings.plugins.fields.namePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="display_name"
            label={t("adminSettings.plugins.fields.displayName")}
            rules={[{ required: true, message: t("adminSettings.plugins.required") }]}
          >
            <Input placeholder={t("adminSettings.plugins.fields.displayNamePlaceholder")} />
          </Form.Item>
          <Form.Item
            name="url"
            label={t("adminSettings.plugins.fields.url")}
            rules={[
              { required: true, message: t("adminSettings.plugins.required") },
              { type: "url", message: t("adminSettings.plugins.validUrl") },
            ]}
            extra={t("adminSettings.plugins.fields.urlHelp")}
          >
            <Input placeholder={t("adminSettings.plugins.fields.urlPlaceholder")} />
          </Form.Item>
          <Form.Item
            name="plugin_key"
            label={t("adminSettings.plugins.fields.key")}
            extra={t("adminSettings.plugins.fields.keyHelp")}
          >
            <Input.Password
              placeholder={
                editingIndex !== null
                  ? t("adminSettings.plugins.fields.keepKey")
                  : t("adminSettings.plugins.fields.keyPlaceholder")
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
