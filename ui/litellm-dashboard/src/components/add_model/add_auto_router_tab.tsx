import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Form, Button, Tooltip, Typography, Select as AntdSelect, Modal, Radio, Badge, Space } from "antd";
import type { FormInstance } from "antd";
import { Text, TextInput } from "@tremor/react";
import { modelAvailableCall } from "../networking";
import ConnectionErrorDisplay from "./model_connection_test";
import { all_admin_roles } from "@/utils/roles";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import RouterConfigBuilder from "./RouterConfigBuilder";
import ComplexityRouterConfig from "./ComplexityRouterConfig";
import NotificationManager from "../molecules/notifications_manager";
import { ThunderboltOutlined, BranchesOutlined } from "@ant-design/icons";

interface AddAutoRouterTabProps {
  form: FormInstance;
  handleOk: () => void;
  accessToken: string;
  userRole: string;
}

type RouterType = "complexity" | "semantic";

interface ComplexityTiers {
  SIMPLE: string;
  MEDIUM: string;
  COMPLEX: string;
  REASONING: string;
}

const { Title, Link } = Typography;

const AddAutoRouterTab: React.FC<AddAutoRouterTabProps> = ({ form, handleOk, accessToken, userRole }) => {
  const { t } = useTranslation();
  // State for connection testing
  const [isResultModalVisible, setIsResultModalVisible] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestId, setConnectionTestId] = useState<string>("");

  const [modelAccessGroups, setModelAccessGroups] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const [showCustomDefaultModel, setShowCustomDefaultModel] = useState<boolean>(false);
  const [showCustomEmbeddingModel, setShowCustomEmbeddingModel] = useState<boolean>(false);

  // Router type state - default to complexity router
  const [routerType, setRouterType] = useState<RouterType>("complexity");

  // Semantic router config (existing)
  const [routerConfig, setRouterConfig] = useState<any>(null);

  // Complexity router config (new)
  const [complexityTiers, setComplexityTiers] = useState<ComplexityTiers>({
    SIMPLE: "",
    MEDIUM: "",
    COMPLEX: "",
    REASONING: "",
  });

  useEffect(() => {
    const fetchModelAccessGroups = async () => {
      const response = await modelAvailableCall(accessToken, "", "", false, null, true, true);
      setModelAccessGroups(response["data"].map((model: any) => model["id"]));
    };
    fetchModelAccessGroups();
  }, [accessToken]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        setModelInfo(uniqueModels);
      } catch (error) {
        console.error("Error fetching model info for auto router:", error);
      }
    };
    loadModels();
  }, [accessToken]);

  const isAdmin = all_admin_roles.includes(userRole);

  // Test connection when button is clicked
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestId(`test-${Date.now()}`);
    setIsResultModalVisible(true);
  };

  // Auto router specific form submit handler
  const handleAutoRouterSubmit = () => {
    const currentFormValues = form.getFieldsValue();

    // Check basic required fields first
    if (!currentFormValues.auto_router_name) {
      NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.enterName"));
      return;
    }

    // Validation differs based on router type
    if (routerType === "complexity") {
      // Complexity Router validation
      const filledTiers = Object.values(complexityTiers).filter(Boolean);
      if (filledTiers.length === 0) {
        NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.selectComplexityModel"));
        return;
      }

      // For complexity router, use the first non-empty tier as default
      const defaultModel =
        complexityTiers.MEDIUM || complexityTiers.SIMPLE || complexityTiers.COMPLEX || complexityTiers.REASONING;

      // Set form values for complexity router
      form.setFieldsValue({
        custom_llm_provider: "auto_router",
        model: currentFormValues.auto_router_name,
        api_key: "not_required_for_auto_router",
        auto_router_default_model: defaultModel,
      });

      form
        .validateFields(["auto_router_name"])
        .then((values) => {
          // Build the complexity router config
          const submitValues = {
            ...values,
            auto_router_name: currentFormValues.auto_router_name,
            auto_router_default_model: defaultModel,
            // Use special model prefix for complexity router
            model_type: "complexity_router",
            complexity_router_config: {
              tiers: complexityTiers,
            },
            model_access_group: currentFormValues.model_access_group,
          };

          handleAddAutoRouterSubmit(submitValues, accessToken, form, handleOk);
        })
        .catch((error) => {
          console.error("Validation failed:", error);
          NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.requiredFields"));
        });
    } else {
      // Semantic Router validation (existing logic)
      if (!currentFormValues.auto_router_default_model) {
        NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.selectDefaultModel"));
        return;
      }

      form.setFieldsValue({
        custom_llm_provider: "auto_router",
        model: currentFormValues.auto_router_name,
        api_key: "not_required_for_auto_router",
      });

      // Custom validation for router config
      if (!routerConfig || !routerConfig.routes || routerConfig.routes.length === 0) {
        NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.configureRoute"));
        return;
      }

      // Check if all routes have required fields
      const invalidRoutes = routerConfig.routes.filter(
        (route: any) => !route.name || !route.description || route.utterances.length === 0,
      );

      if (invalidRoutes.length > 0) {
        NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.completeRoutes"));
        return;
      }

      form
        .validateFields()
        .then((values) => {
          const submitValues = {
            ...values,
            auto_router_config: routerConfig,
            model_type: "semantic_router",
          };
          handleAddAutoRouterSubmit(submitValues, accessToken, form, handleOk);
        })
        .catch((error) => {
          console.error("Validation failed:", error);
          const fieldErrors = error.errorFields || [];
          if (fieldErrors.length > 0) {
            const missingFields = fieldErrors.map((field: any) => {
              const fieldName = field.name[0];
              const friendlyNames: { [key: string]: string } = {
                auto_router_name: t("modelsAndEndpoints.addModel.autoRouter.name.label"),
                auto_router_default_model: t("modelsAndEndpoints.addModel.autoRouter.defaultModel.label"),
                auto_router_embedding_model: t("modelsAndEndpoints.addModel.autoRouter.embeddingModel.label"),
              };
              return friendlyNames[fieldName] || fieldName;
            });
            NotificationManager.fromBackend(
              t("modelsAndEndpoints.addModel.autoRouter.validation.requiredFieldsList", {
                fields: missingFields.join(", "),
              }),
            );
          } else {
            NotificationManager.fromBackend(t("modelsAndEndpoints.addModel.autoRouter.validation.requiredFields"));
          }
        });
    }
  };

  return (
    <>
      <Title level={2}>{t("modelsAndEndpoints.addModel.autoRouter.title")}</Title>
      <Text className="text-gray-600 mb-6">{t("modelsAndEndpoints.addModel.autoRouter.description")}</Text>

      <Card className="mb-4">
        <div className="mb-4">
          <Text className="text-sm font-medium mb-2 block">
            {t("modelsAndEndpoints.addModel.autoRouter.routerType")}
          </Text>
          <Radio.Group value={routerType} onChange={(e) => setRouterType(e.target.value)} className="w-full">
            <Space direction="vertical" className="w-full">
              <Radio value="complexity" className="w-full">
                <div className="flex items-center gap-2">
                  <ThunderboltOutlined className="text-yellow-500" />
                  <span className="font-medium">{t("modelsAndEndpoints.addModel.autoRouter.complexity.name")}</span>
                  <Badge
                    count={t("modelsAndEndpoints.addModel.autoRouter.complexity.recommended")}
                    style={{
                      backgroundColor: "#52c41a",
                      fontSize: "10px",
                      padding: "0 6px",
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 ml-6 mt-1">
                  {t("modelsAndEndpoints.addModel.autoRouter.complexity.description")}
                  <br />
                  <span className="text-green-600">
                    ✓ {t("modelsAndEndpoints.addModel.autoRouter.complexity.zeroApiCalls")}
                  </span>{" "}
                  ·{" "}
                  <span className="text-green-600">
                    ✓ {t("modelsAndEndpoints.addModel.autoRouter.complexity.latency")}
                  </span>{" "}
                  ·{" "}
                  <span className="text-green-600">
                    ✓ {t("modelsAndEndpoints.addModel.autoRouter.complexity.noCost")}
                  </span>
                </div>
              </Radio>
              <Radio value="semantic" className="w-full mt-2">
                <div className="flex items-center gap-2">
                  <BranchesOutlined className="text-blue-500" />
                  <span className="font-medium">{t("modelsAndEndpoints.addModel.autoRouter.semantic.name")}</span>
                </div>
                <div className="text-xs text-gray-500 ml-6 mt-1">
                  {t("modelsAndEndpoints.addModel.autoRouter.semantic.description")}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Card>

      <Card>
        <Form
          form={form}
          onFinish={handleAutoRouterSubmit}
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
        >
          {/* Auto Router Name */}
          <Form.Item
            rules={[{ required: true, message: t("modelsAndEndpoints.addModel.autoRouter.name.required") }]}
            label={t("modelsAndEndpoints.addModel.autoRouter.name.label")}
            name="auto_router_name"
            tooltip={t("modelsAndEndpoints.addModel.autoRouter.name.tooltip")}
            labelCol={{ span: 10 }}
            labelAlign="left"
          >
            <TextInput placeholder={t("modelsAndEndpoints.addModel.autoRouter.name.placeholder")} />
          </Form.Item>

          {/* Conditional rendering based on router type */}
          {routerType === "complexity" ? (
            /* Complexity Router Configuration */
            <div className="w-full mb-4">
              <ComplexityRouterConfig
                modelInfo={modelInfo}
                value={complexityTiers}
                onChange={(tiers) => {
                  setComplexityTiers(tiers);
                }}
              />
            </div>
          ) : (
            /* Semantic Router Configuration (existing) */
            <>
              {/* Router Configuration Builder */}
              <div className="w-full mb-4">
                <RouterConfigBuilder
                  modelInfo={modelInfo}
                  value={routerConfig}
                  onChange={(config) => {
                    setRouterConfig(config);
                    form.setFieldValue("auto_router_config", config);
                  }}
                />
              </div>

              {/* Auto Router Default Model */}
              <Form.Item
                rules={[
                  {
                    required: routerType === "semantic",
                    message: t("modelsAndEndpoints.addModel.autoRouter.defaultModel.required"),
                  },
                ]}
                label={t("modelsAndEndpoints.addModel.autoRouter.defaultModel.label")}
                name="auto_router_default_model"
                tooltip={t("modelsAndEndpoints.addModel.autoRouter.defaultModel.tooltip")}
                labelCol={{ span: 10 }}
                labelAlign="left"
              >
                <AntdSelect
                  placeholder={t("modelsAndEndpoints.addModel.autoRouter.defaultModel.placeholder")}
                  onChange={(value) => {
                    setShowCustomDefaultModel(value === "custom");
                  }}
                  options={[
                    ...Array.from(new Set(modelInfo.map((option) => option.model_group))).map((model_group) => ({
                      value: model_group,
                      label: model_group,
                    })),
                    { value: "custom", label: t("modelsAndEndpoints.addModel.autoRouter.customModel") },
                  ]}
                  style={{ width: "100%" }}
                  showSearch={true}
                />
              </Form.Item>

              {/* Auto Router Embedding Model */}
              <Form.Item
                label={t("modelsAndEndpoints.addModel.autoRouter.embeddingModel.label")}
                name="auto_router_embedding_model"
                tooltip={t("modelsAndEndpoints.addModel.autoRouter.embeddingModel.tooltip")}
                labelCol={{ span: 10 }}
                labelAlign="left"
              >
                <AntdSelect
                  value={form.getFieldValue("auto_router_embedding_model")}
                  placeholder={t("modelsAndEndpoints.addModel.autoRouter.embeddingModel.placeholder")}
                  onChange={(value) => {
                    setShowCustomEmbeddingModel(value === "custom");
                    form.setFieldValue("auto_router_embedding_model", value);
                  }}
                  options={[
                    ...Array.from(new Set(modelInfo.map((option) => option.model_group))).map((model_group) => ({
                      value: model_group,
                      label: model_group,
                    })),
                    { value: "custom", label: t("modelsAndEndpoints.addModel.autoRouter.customModel") },
                  ]}
                  style={{ width: "100%" }}
                  showSearch={true}
                  allowClear
                />
              </Form.Item>
            </>
          )}

          <div className="flex items-center my-4">
            <div className="grow border-t border-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">
              {t("modelsAndEndpoints.addModel.autoRouter.additionalSettings")}
            </span>
            <div className="grow border-t border-gray-200"></div>
          </div>

          {/* Model Access Groups - Admin only */}
          {isAdmin && (
            <Form.Item
              label={t("modelsAndEndpoints.addModel.autoRouter.accessGroup.label")}
              name="model_access_group"
              className="mb-4"
              tooltip={t("modelsAndEndpoints.addModel.autoRouter.accessGroup.tooltip")}
            >
              <AntdSelect
                mode="tags"
                showSearch
                placeholder={t("modelsAndEndpoints.addModel.autoRouter.accessGroup.placeholder")}
                optionFilterProp="children"
                tokenSeparators={[","]}
                options={modelAccessGroups.map((group) => ({
                  value: group,
                  label: group,
                }))}
                maxTagCount="responsive"
                allowClear
              />
            </Form.Item>
          )}

          <div className="flex justify-between items-center mb-4">
            <Tooltip title={t("modelsAndEndpoints.addModel.autoRouter.actions.helpTooltip")}>
              <Typography.Link href="https://github.com/BerriAI/litellm/issues">
                {t("modelsAndEndpoints.addModel.autoRouter.actions.help")}
              </Typography.Link>
            </Tooltip>
            <div className="space-x-2">
              <Button onClick={handleTestConnection} loading={isTestingConnection}>
                {t("modelsAndEndpoints.addModel.autoRouter.actions.testConnection")}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  handleAutoRouterSubmit();
                }}
              >
                {t("modelsAndEndpoints.addModel.autoRouter.actions.submit")}
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      {/* Test Connection Results Modal */}
      <Modal
        title={t("modelsAndEndpoints.addModel.connection.modalTitle")}
        open={isResultModalVisible}
        onCancel={() => {
          setIsResultModalVisible(false);
          setIsTestingConnection(false);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
          >
            {t("modelsAndEndpoints.addModel.connection.close")}
          </Button>,
        ]}
        width={700}
      >
        {/* Only render the ConnectionErrorDisplay when modal is visible and we have a test ID */}
        {isResultModalVisible && (
          <ConnectionErrorDisplay
            key={connectionTestId}
            formValues={form.getFieldsValue()}
            accessToken={accessToken}
            testMode="chat"
            modelName={form.getFieldValue("auto_router_name")}
            onClose={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
            onTestComplete={() => setIsTestingConnection(false)}
          />
        )}
      </Modal>
    </>
  );
};

export default AddAutoRouterTab;
