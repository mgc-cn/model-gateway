import React, { useState, useEffect, useCallback } from "react";
import { Card, Badge, Button } from "@tremor/react";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/outline";
import { Descriptions, Tag, Spin, Divider, Typography, Alert } from "antd";
import { Policy } from "./types";
import { PipelineInfoDisplay } from "./pipeline_flow_builder";
import { getResolvedGuardrails } from "../networking";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface PolicyInfoViewProps {
  policyId: string;
  onClose: () => void;
  onEdit: (policy: Policy) => void;
  accessToken: string | null;
  isAdmin: boolean;
  getPolicy: (accessToken: string, policyId: string) => Promise<any>;
}

const PolicyInfoView: React.FC<PolicyInfoViewProps> = ({
  policyId,
  onClose,
  onEdit,
  accessToken,
  isAdmin,
  getPolicy,
}) => {
  const { t, i18n } = useTranslation();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedGuardrails, setResolvedGuardrails] = useState<string[]>([]);
  const [isLoadingResolved, setIsLoadingResolved] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!accessToken || !policyId) return;

    setIsLoading(true);
    try {
      const data = await getPolicy(accessToken, policyId);
      setPolicy(data);

      // Also fetch resolved guardrails
      setIsLoadingResolved(true);
      try {
        const resolvedData = await getResolvedGuardrails(accessToken, policyId);
        setResolvedGuardrails(resolvedData.resolved_guardrails || []);
      } catch (error) {
        console.error("Error fetching resolved guardrails:", error);
      } finally {
        setIsLoadingResolved(false);
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
    } finally {
      setIsLoading(false);
    }
  }, [policyId, accessToken, getPolicy]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!policy) {
    return (
      <Card>
        <Text type="danger">{t("policyManagement.detail.notFound")}</Text>
        <br />
        <Button onClick={onClose} className="mt-4">
          {t("policyManagement.actions.back")}
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="secondary" icon={ArrowLeftIcon} onClick={onClose}>
            {t("policyManagement.actions.backToPolicies")}
          </Button>
          {isAdmin && (
            <Button icon={PencilIcon} onClick={() => onEdit(policy)}>
              {t("policyManagement.actions.editPolicy")}
            </Button>
          )}
        </div>

        <Title level={4}>{policy.policy_name}</Title>

        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("policyManagement.fields.policyId")}>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded-sm">{policy.policy_id}</code>
          </Descriptions.Item>
          <Descriptions.Item label={t("policyManagement.fields.description")}>
            {policy.description || <Text type="secondary">{t("policyManagement.noDescription")}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t("policyManagement.fields.inheritsFrom")}>
            {policy.inherit ? (
              <Badge color="blue" size="sm">
                {policy.inherit}
              </Badge>
            ) : (
              <Text type="secondary">{t("policyManagement.none")}</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t("policyManagement.fields.createdAt")}>
            {policy.created_at
              ? new Date(policy.created_at).toLocaleString(i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("policyManagement.fields.updatedAt")}>
            {policy.updated_at
              ? new Date(policy.updated_at).toLocaleString(i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US")
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        {policy.pipeline && (
          <>
            <Divider orientation="left">
              <Text strong>{t("policyManagement.detail.pipelineFlow")}</Text>
            </Divider>
            <Alert
              message={t("policyManagement.detail.pipelineSummary", {
                mode: policy.pipeline.mode,
                count: policy.pipeline.steps.length,
              })}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <PipelineInfoDisplay pipeline={policy.pipeline} />
          </>
        )}

        <Divider orientation="left">
          <Text strong>{t("policyManagement.detail.guardrailsConfiguration")}</Text>
        </Divider>

        {resolvedGuardrails.length > 0 && (
          <Alert
            message={t("policyManagement.detail.resolvedGuardrails")}
            description={
              <div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  {t("policyManagement.detail.resolvedGuardrailsHelp")}
                </Text>
                <div className="flex flex-wrap gap-1">
                  {resolvedGuardrails.map((g) => (
                    <Tag key={g} color="blue">
                      {g}
                    </Tag>
                  ))}
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("policyManagement.fields.guardrailsAdd")}>
            <div className="flex flex-wrap gap-1">
              {policy.guardrails_add && policy.guardrails_add.length > 0 ? (
                policy.guardrails_add.map((g) => (
                  <Tag key={g} color="green">
                    {g}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">{t("policyManagement.none")}</Text>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label={t("policyManagement.fields.guardrailsRemove")}>
            <div className="flex flex-wrap gap-1">
              {policy.guardrails_remove && policy.guardrails_remove.length > 0 ? (
                policy.guardrails_remove.map((g) => (
                  <Tag key={g} color="red">
                    {g}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">{t("policyManagement.none")}</Text>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <Text strong>{t("policyManagement.detail.conditions")}</Text>
        </Divider>

        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("policyManagement.fields.modelCondition")}>
            {policy.condition?.model ? (
              <Tag color="purple">
                {typeof policy.condition.model === "string"
                  ? policy.condition.model
                  : JSON.stringify(policy.condition.model)}
              </Tag>
            ) : (
              <Text type="secondary">{t("policyManagement.detail.noModelCondition")}</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Card>
  );
};

export default PolicyInfoView;
