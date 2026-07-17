import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Radio, Divider, Typography } from "antd";
import { Button } from "@tremor/react";
import { Policy } from "./types";
import { teamListCall, keyListCall, modelAvailableCall, estimateAttachmentImpactCall } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { buildAttachmentData } from "./build_attachment_data";
import { getInvalidTeamEntries } from "./scope_validation";
import ImpactPreviewAlert from "./impact_preview_alert";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface AddAttachmentFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  policies: Policy[];
  createAttachment: (accessToken: string, attachmentData: any) => Promise<any>;
}

const AddAttachmentForm: React.FC<AddAttachmentFormProps> = ({
  visible,
  onClose,
  onSuccess,
  accessToken,
  policies,
  createAttachment,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeType, setScopeType] = useState<"global" | "specific">("global");
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [impactResult, setImpactResult] = useState<any>(null);
  const { userId, userRole } = useAuthorized();

  useEffect(() => {
    if (visible && accessToken) {
      loadTeamsKeysAndModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, accessToken]);

  const loadTeamsKeysAndModels = async () => {
    if (!accessToken) return;

    // Load teams — teamListCall returns a plain array of team objects
    setIsLoadingTeams(true);
    setTeamsLoaded(false);
    try {
      const teamsResponse = await teamListCall(accessToken, null, userId);
      const teamsArray = Array.isArray(teamsResponse) ? teamsResponse : teamsResponse?.data || [];
      const teamAliases = teamsArray.map((t: any) => t.team_alias).filter(Boolean);
      setAvailableTeams(teamAliases);
      setTeamsLoaded(true);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setIsLoadingTeams(false);
    }

    // Load keys — keyListCall returns {keys: [...], total_count, ...}
    setIsLoadingKeys(true);
    try {
      const keysResponse = await keyListCall(accessToken, null, null, null, null, null, 1, 100);
      const keysArray = keysResponse?.keys || keysResponse?.data || [];
      const keyAliases = keysArray.map((k: any) => k.key_alias).filter(Boolean);
      setAvailableKeys(keyAliases);
    } catch (error) {
      console.error("Failed to load keys:", error);
    } finally {
      setIsLoadingKeys(false);
    }

    // Load models
    setIsLoadingModels(true);
    try {
      const modelsResponse = await modelAvailableCall(accessToken, userId || "", userRole || "");
      const modelsArray = modelsResponse?.data || (Array.isArray(modelsResponse) ? modelsResponse : []);
      const modelIds = modelsArray.map((m: any) => m.id || m.model_name).filter(Boolean);
      setAvailableModels(modelIds);
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setScopeType("global");
    setImpactResult(null);
  };

  const handlePreviewImpact = async () => {
    if (!accessToken) return;
    try {
      await form.validateFields(["policy_names"]);
    } catch {
      return;
    }
    setIsEstimating(true);
    try {
      const { policy_names = [] } = form.getFieldsValue(true);
      const firstPolicy = policy_names?.[0];
      if (!firstPolicy) return;
      const data = buildAttachmentData(
        {
          ...form.getFieldsValue(true),
          policy_name: firstPolicy,
        },
        scopeType,
      );
      const result = await estimateAttachmentImpactCall(accessToken, data);
      setImpactResult(result);
    } catch (error) {
      console.error("Failed to estimate impact:", error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await form.validateFields();

      if (!accessToken) {
        throw new Error(t("policyManagement.notifications.accessTokenMissing"));
      }

      const values = form.getFieldsValue(true);
      const selectedPolicyNames: string[] = values.policy_names || [];

      const results = await Promise.allSettled(
        selectedPolicyNames.map((policyName) => {
          const data = buildAttachmentData(
            {
              ...values,
              policy_name: policyName,
            },
            scopeType,
          );
          return createAttachment(accessToken, data);
        }),
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

      if (successCount > 0 && failed.length === 0) {
        NotificationsManager.success(t("policyManagement.attachmentForm.created", { count: successCount }));
      } else if (successCount > 0 && failed.length > 0) {
        NotificationsManager.fromBackend(
          t("policyManagement.attachmentForm.partial", { success: successCount, failed: failed.length }),
        );
      } else {
        throw new Error(
          failed[0]?.reason instanceof Error
            ? failed[0].reason.message
            : t("policyManagement.attachmentForm.createFailed"),
        );
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create attachment:", error);
      NotificationsManager.fromBackend(
        t("policyManagement.attachmentForm.createError", {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const policyOptions = policies.map((p) => ({
    label: p.policy_name,
    value: p.policy_name,
  }));

  return (
    <Modal
      title={t("policyManagement.attachmentForm.title")}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          scope_type: "global",
        }}
      >
        <Form.Item
          name="policy_names"
          label={t("policyManagement.tabs.policies")}
          rules={[{ required: true, message: t("policyManagement.attachmentForm.policyRequired") }]}
        >
          <Select
            mode="multiple"
            placeholder={t("policyManagement.attachmentForm.selectPolicies")}
            options={policyOptions}
            showSearch
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Divider orientation="left">
          <Text strong>{t("policyManagement.fields.scope")}</Text>
        </Divider>

        <Form.Item label={t("policyManagement.attachmentForm.scopeType")}>
          <Radio.Group value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
            <Radio value="specific">{t("policyManagement.attachmentForm.specific")}</Radio>
            <Radio value="global">{t("policyManagement.attachmentForm.global")}</Radio>
          </Radio.Group>
        </Form.Item>

        {scopeType === "specific" && (
          <>
            <Form.Item
              name="teams"
              label={t("policyManagement.fields.teams")}
              tooltip={t("policyManagement.attachmentForm.teamsHelp")}
              rules={[
                {
                  validator: async (_rule, value?: string[]) => {
                    if (!teamsLoaded) return;
                    const invalid = getInvalidTeamEntries(value ?? [], availableTeams);
                    if (invalid.length > 0) {
                      throw new Error(t("policyManagement.attachmentForm.invalidTeams", { teams: invalid.join(", ") }));
                    }
                  },
                },
              ]}
            >
              <Select
                mode="tags"
                placeholder={
                  isLoadingTeams
                    ? t("policyManagement.attachmentForm.loadingTeams")
                    : t("policyManagement.attachmentForm.selectTeams")
                }
                loading={isLoadingTeams}
                options={availableTeams.map((team) => ({
                  label: team,
                  value: team,
                }))}
                tokenSeparators={[","]}
                showSearch
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="keys"
              label={t("policyManagement.fields.keys")}
              tooltip={t("policyManagement.attachmentForm.keysHelp")}
            >
              <Select
                mode="tags"
                placeholder={
                  isLoadingKeys
                    ? t("policyManagement.attachmentForm.loadingKeys")
                    : t("policyManagement.attachmentForm.selectKeys")
                }
                loading={isLoadingKeys}
                options={availableKeys.map((key) => ({
                  label: key,
                  value: key,
                }))}
                tokenSeparators={[","]}
                showSearch
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="models"
              label={t("policyManagement.fields.models")}
              tooltip={t("policyManagement.attachmentForm.modelsHelp")}
            >
              <Select
                mode="tags"
                placeholder={
                  isLoadingModels
                    ? t("policyManagement.attachmentForm.loadingModels")
                    : t("policyManagement.attachmentForm.selectModels")
                }
                loading={isLoadingModels}
                options={availableModels.map((model) => ({
                  label: model,
                  value: model,
                }))}
                tokenSeparators={[","]}
                showSearch
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="tags"
              label={t("policyManagement.fields.tags")}
              tooltip={t("policyManagement.attachmentForm.tagsHelp")}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("policyManagement.attachmentForm.tagsExtra")}
                </Text>
              }
            >
              <Select
                mode="tags"
                placeholder={t("policyManagement.attachmentForm.tagsPlaceholder")}
                tokenSeparators={[",", " "]}
                notFoundContent={null}
                suffixIcon={null}
                open={false}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </>
        )}

        {impactResult && <ImpactPreviewAlert impactResult={impactResult} />}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          {scopeType === "specific" && (
            <Button variant="secondary" onClick={handlePreviewImpact} loading={isEstimating}>
              {t("policyManagement.attachmentForm.estimateImpact")}
            </Button>
          )}
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {t("policyManagement.attachmentForm.create")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddAttachmentForm;
