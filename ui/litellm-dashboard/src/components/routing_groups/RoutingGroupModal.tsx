"use client";

import React, { useMemo } from "react";
import { Form, Input, Modal, Select, Space, Typography } from "antd";
import type { RoutingGroup, RoutingStrategy } from "./types";
import { useTranslation } from "react-i18next";
import { getStrategyDescription, getStrategyLabel } from "../router_settings/i18n";

const { Text, Paragraph } = Typography;

interface RoutingGroupModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValue: RoutingGroup | null;
  availableStrategies: string[];
  strategyDescriptions: Record<string, string>;
  modelOptions: string[];
  existingGroupNames: string[];
  onClose: () => void;
  onSubmit: (group: RoutingGroup) => Promise<void> | void;
  saving?: boolean;
}

interface FormValues {
  group_name: string;
  models: string[];
  routing_strategy: RoutingStrategy | string;
  routing_strategy_args?: string;
}

const STRATEGIES_WITH_ARGS = new Set<string>(["latency-based-routing", "usage-based-routing"]);

const GROUP_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const GROUP_NAME_MAX_LENGTH = 64;

const RoutingGroupModal: React.FC<RoutingGroupModalProps> = ({
  open,
  mode,
  initialValue,
  availableStrategies,
  strategyDescriptions,
  modelOptions,
  existingGroupNames,
  onClose,
  onSubmit,
  saving,
}) => {
  const { t, i18n } = useTranslation();
  const isChinese = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [form] = Form.useForm<FormValues>();
  const selectedStrategy = Form.useWatch("routing_strategy", form);

  const initialValues: FormValues = {
    group_name: initialValue?.group_name ?? "",
    models: initialValue?.models ?? [],
    routing_strategy: initialValue?.routing_strategy ?? availableStrategies[0] ?? "simple-shuffle",
    routing_strategy_args: initialValue?.routing_strategy_args
      ? JSON.stringify(initialValue.routing_strategy_args, null, 2)
      : "",
  };

  const reservedNames = useMemo(() => {
    const others = existingGroupNames.filter((n) => n !== initialValue?.group_name);
    return new Set(others.map((n) => n.toLowerCase()));
  }, [existingGroupNames, initialValue]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const strategySupportsArgs = STRATEGIES_WITH_ARGS.has(String(values.routing_strategy));
    let parsedArgs: Record<string, unknown> | null = null;
    if (strategySupportsArgs && values.routing_strategy_args && values.routing_strategy_args.trim()) {
      try {
        parsedArgs = JSON.parse(values.routing_strategy_args);
      } catch {
        form.setFields([
          {
            name: "routing_strategy_args",
            errors: [t("routerSettings.routingGroups.invalidJson")],
          },
        ]);
        return;
      }
    }

    await onSubmit({
      group_name: values.group_name.trim(),
      models: values.models,
      routing_strategy: values.routing_strategy,
      routing_strategy_args: parsedArgs,
    });
  };

  return (
    <Modal
      title={
        mode === "create"
          ? t("routerSettings.routingGroups.createTitle")
          : t("routerSettings.routingGroups.editTitle", { name: initialValue?.group_name ?? "" })
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={mode === "create" ? t("routerSettings.routingGroups.create") : t("routerSettings.routingGroups.save")}
      cancelText={t("routerSettings.actions.cancel")}
      confirmLoading={saving}
      destroyOnClose
      width={560}
    >
      <Form<FormValues>
        key={mode === "edit" ? `edit-${initialValue?.group_name ?? ""}` : "create"}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={initialValues}
      >
        <Form.Item
          label={t("routerSettings.routingGroups.groupName")}
          name="group_name"
          rules={[
            { required: true, message: t("routerSettings.routingGroups.groupNameRequired") },
            {
              max: GROUP_NAME_MAX_LENGTH,
              message: t("routerSettings.routingGroups.groupNameMax", { max: GROUP_NAME_MAX_LENGTH }),
            },
            {
              pattern: GROUP_NAME_PATTERN,
              message: t("routerSettings.routingGroups.groupNamePattern"),
            },
            {
              validator: (_, value: string) => {
                if (!value) return Promise.resolve();
                if (reservedNames.has(value.trim().toLowerCase())) {
                  return Promise.reject(new Error(t("routerSettings.routingGroups.groupNameExists")));
                }
                return Promise.resolve();
              },
            },
          ]}
          extra={t("routerSettings.routingGroups.groupNameHelp")}
        >
          <Input placeholder="fast-chat" disabled={mode === "edit"} />
        </Form.Item>

        <Form.Item
          label={t("routerSettings.routingGroups.models")}
          name="models"
          rules={[{ required: true, message: t("routerSettings.routingGroups.modelsRequired") }]}
          extra={t("routerSettings.routingGroups.modelsHelp")}
        >
          <Select
            mode="multiple"
            allowClear
            placeholder={t("routerSettings.routingGroups.selectModels")}
            options={modelOptions.map((m) => ({ label: m, value: m }))}
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label={t("routerSettings.routingGroups.strategy")}
          name="routing_strategy"
          rules={[{ required: true, message: t("routerSettings.routingGroups.strategyRequired") }]}
        >
          <Select
            options={availableStrategies.map((s) => ({ label: isChinese ? getStrategyLabel(t, s) : s, value: s }))}
            placeholder={t("routerSettings.routingGroups.selectStrategy")}
          />
        </Form.Item>

        {selectedStrategy && strategyDescriptions[selectedStrategy] && (
          <Paragraph className="text-xs text-gray-500 -mt-2 mb-4">
            {isChinese
              ? getStrategyDescription(t, selectedStrategy, strategyDescriptions[selectedStrategy])
              : strategyDescriptions[selectedStrategy]}
          </Paragraph>
        )}

        {STRATEGIES_WITH_ARGS.has(String(selectedStrategy)) && (
          <Form.Item
            label={t("routerSettings.routingGroups.strategyArgs")}
            name="routing_strategy_args"
            extra={
              selectedStrategy === "latency-based-routing"
                ? t("routerSettings.routingGroups.latencyExample")
                : t("routerSettings.routingGroups.usageExample")
            }
          >
            <Input.TextArea rows={4} placeholder='{ "ttl": 3600 }' className="font-mono text-xs" />
          </Form.Item>
        )}

        <Space direction="vertical" className="w-full mt-2">
          <Text type="secondary" className="text-xs">
            {t("routerSettings.routingGroups.unclaimedModels")}
          </Text>
        </Space>
      </Form>
    </Modal>
  );
};

export default RoutingGroupModal;
