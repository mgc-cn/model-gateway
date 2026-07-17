import { InfoCircleOutlined } from "@ant-design/icons";
import { Select as AntdSelect, Card, Divider, Space, Tooltip, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { ModelGroup } from "@/components/llm_calls/fetch_models";

const { Text } = Typography;

interface ComplexityTiers {
  SIMPLE: string;
  MEDIUM: string;
  COMPLEX: string;
  REASONING: string;
}

interface ComplexityRouterConfigProps {
  modelInfo: ModelGroup[];
  value: ComplexityTiers;
  onChange: (tiers: ComplexityTiers) => void;
}

const ComplexityRouterConfig: React.FC<ComplexityRouterConfigProps> = ({ modelInfo, value, onChange }) => {
  const { t } = useTranslation();
  const tierDescriptions: Record<keyof ComplexityTiers, { label: string; description: string; examples: string }> = {
    SIMPLE: {
      label: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.simple.label"),
      description: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.simple.description"),
      examples: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.simple.examples"),
    },
    MEDIUM: {
      label: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.medium.label"),
      description: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.medium.description"),
      examples: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.medium.examples"),
    },
    COMPLEX: {
      label: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.complex.label"),
      description: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.complex.description"),
      examples: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.complex.examples"),
    },
    REASONING: {
      label: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.reasoning.label"),
      description: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.reasoning.description"),
      examples: t("modelsAndEndpoints.addModel.autoRouter.complexity.tiers.reasoning.examples"),
    },
  };
  // Prepare model options for dropdowns
  const modelOptions = modelInfo.map((model) => ({
    value: model.model_group,
    label: model.model_group,
  }));

  const handleTierChange = (tier: keyof ComplexityTiers, model: string) => {
    onChange({
      ...value,
      [tier]: model,
    });
  };

  return (
    <div className="w-full max-w-none">
      <Space align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t("modelsAndEndpoints.addModel.autoRouter.complexity.configTitle")}
        </Typography.Title>
        <Tooltip title={t("modelsAndEndpoints.addModel.autoRouter.complexity.configTooltip")}>
          <InfoCircleOutlined className="text-gray-400" />
        </Tooltip>
      </Space>

      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        {t("modelsAndEndpoints.addModel.autoRouter.complexity.configDescription")}
      </Text>

      <Card>
        {(Object.keys(tierDescriptions) as Array<keyof ComplexityTiers>).map((tier, index) => {
          const tierInfo = tierDescriptions[tier];
          return (
            <div key={tier}>
              {index > 0 && <Divider style={{ margin: "16px 0" }} />}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Text strong style={{ fontSize: 16 }}>
                    {tierInfo.label} {t("modelsAndEndpoints.addModel.autoRouter.complexity.tierSuffix")}
                  </Text>
                  <Tooltip title={tierInfo.description}>
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
                  {t("modelsAndEndpoints.addModel.autoRouter.complexity.examples", {
                    examples: tierInfo.examples,
                  })}
                </Text>
                <AntdSelect
                  value={value[tier]}
                  onChange={(model) => handleTierChange(tier, model)}
                  placeholder={t("modelsAndEndpoints.addModel.autoRouter.complexity.selectModel", {
                    tier: tierInfo.label,
                  })}
                  showSearch
                  style={{ width: "100%" }}
                  options={modelOptions}
                />
              </div>
            </div>
          );
        })}
      </Card>

      <Divider />

      <Card className="bg-gray-50">
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t("modelsAndEndpoints.addModel.autoRouter.complexity.classificationTitle")}
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t("modelsAndEndpoints.addModel.autoRouter.complexity.classificationDescription")}
        </Text>
        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, fontSize: 13, color: "rgba(0, 0, 0, 0.45)" }}>
          <li>
            <strong>SIMPLE</strong>: {t("modelsAndEndpoints.addModel.autoRouter.complexity.simpleScore")}
          </li>
          <li>
            <strong>MEDIUM</strong>: {t("modelsAndEndpoints.addModel.autoRouter.complexity.mediumScore")}
          </li>
          <li>
            <strong>COMPLEX</strong>: {t("modelsAndEndpoints.addModel.autoRouter.complexity.complexScore")}
          </li>
          <li>
            <strong>REASONING</strong>: {t("modelsAndEndpoints.addModel.autoRouter.complexity.reasoningScore")}
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default ComplexityRouterConfig;
