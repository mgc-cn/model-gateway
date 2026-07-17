import React, { useState, useEffect } from "react";
import { TextInput, Button as TremorButton } from "@tremor/react";
import { Modal, Form, Select, Tooltip, Input, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { CredentialItem, vectorStoreCreateCall } from "../networking";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  VectorStoreFieldConfig,
} from "../vector_store_providers";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import NotificationsManager from "../molecules/notifications_manager";
import { useTranslation } from "react-i18next";

interface VectorStoreFormProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  credentials: CredentialItem[];
}

const VectorStoreForm: React.FC<VectorStoreFormProps> = ({
  isVisible,
  onCancel,
  onSuccess,
  accessToken,
  credentials,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [metadataJson, setMetadataJson] = useState("{}");
  const [selectedProvider, setSelectedProvider] = useState("bedrock");
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const vertexEngineId = Form.useWatch("vertex_engine_id", form);

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        if (uniqueModels.length > 0) {
          setModelInfo(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching model info:", error);
      }
    };

    loadModels();
  }, [accessToken]);

  const handleCreate = async (formValues: any) => {
    if (!accessToken) return;
    try {
      // Parse metadata JSON
      let metadata = {};
      try {
        metadata = metadataJson.trim() ? JSON.parse(metadataJson) : {};
      } catch (e) {
        NotificationsManager.fromBackend(t("toolManagement.vectors.invalidMetadata"));
        return;
      }

      // Prepare the payload with provider-specific fields
      const payload: any = {
        vector_store_id: formValues.vector_store_id,
        custom_llm_provider: formValues.custom_llm_provider,
        vector_store_name: formValues.vector_store_name,
        vector_store_description: formValues.vector_store_description,
        vector_store_metadata: metadata,
        litellm_credential_name: formValues.litellm_credential_name,
      };

      // pass all provider fields as litellm params dict
      const providerFields = getProviderSpecificFields(formValues.custom_llm_provider);
      const litellmParams = providerFields.reduce(
        (acc, field) => {
          // Special handling for Milvus: rename embedding_model to litellm_embedding_model
          if (formValues.custom_llm_provider === "milvus" && field.name === "embedding_model") {
            acc["litellm_embedding_model"] = formValues[field.name];
          } else {
            acc[field.name] = formValues[field.name];
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      payload["litellm_params"] = litellmParams;

      await vectorStoreCreateCall(accessToken, payload);
      NotificationsManager.success(t("toolManagement.vectors.form.created"));
      form.resetFields();
      setMetadataJson("{}");
      onSuccess();
    } catch (error) {
      console.error("Error creating vector store:", error);
      NotificationsManager.fromBackend(t("toolManagement.vectors.form.createFailed", { error: String(error) }));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setMetadataJson("{}");
    setSelectedProvider("bedrock");
    onCancel();
  };

  return (
    <Modal
      title={t("toolManagement.vectors.form.addTitle")}
      open={isVisible}
      width={1000}
      footer={null}
      onCancel={handleCancel}
    >
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item
          label={
            <span>
              {t("toolManagement.common.provider")}{" "}
              <Tooltip title={t("toolManagement.vectors.form.providerHelp")}>
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="custom_llm_provider"
          rules={[{ required: true, message: t("toolManagement.vectors.providerRequired") }]}
          initialValue="bedrock"
        >
          <Select onChange={(value) => setSelectedProvider(value)}>
            {Object.entries(VectorStoreProviders).map(([providerEnum, providerDisplayName]) => {
              return (
                <Select.Option key={providerEnum} value={vectorStoreProviderMap[providerEnum]}>
                  <div className="flex items-center space-x-2">
                    <img
                      src={resolveLogoSrc(vectorStoreProviderLogoMap[providerDisplayName])}
                      alt={`${providerEnum} logo`}
                      className="w-5 h-5"
                      onError={(e) => {
                        // Create a div with provider initial as fallback
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          const fallbackDiv = document.createElement("div");
                          fallbackDiv.className =
                            "w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs";
                          fallbackDiv.textContent = providerDisplayName.charAt(0);
                          parent.replaceChild(fallbackDiv, target);
                        }
                      }}
                    />
                    <span>{providerDisplayName}</span>
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* PG Vector Setup Instructions */}
        {selectedProvider === "pg_vector" && (
          <Alert
            message={t("toolManagement.vectors.form.pgTitle")}
            description={
              <div>
                <p>{t("toolManagement.vectors.form.pgDescription")}</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    {t("toolManagement.vectors.form.pgDeploy")}{" "}
                    <a href="https://github.com/BerriAI/litellm-pgvector" target="_blank" rel="noopener noreferrer">
                      https://github.com/BerriAI/litellm-pgvector
                    </a>
                  </li>
                  <li>{t("toolManagement.vectors.form.pgDatabase")}</li>
                  <li>{t("toolManagement.vectors.form.pgServer")}</li>
                  <li>{t("toolManagement.vectors.form.pgFields")}</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Vertex RAG Engine Setup Instructions */}
        {selectedProvider === "vertex_rag_engine" && (
          <Alert
            message={t("toolManagement.vectors.form.ragTitle")}
            description={
              <div>
                <p>{t("toolManagement.vectors.form.ragDescription")}</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    {t("toolManagement.vectors.form.ragGuide")}{" "}
                    <a
                      href="https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("toolManagement.vectors.form.ragDocs")}
                    </a>
                  </li>
                  <li>{t("toolManagement.vectors.form.ragCorpus")}</li>
                  <li>{t("toolManagement.vectors.form.ragId")}</li>
                  <li>{t("toolManagement.vectors.form.ragField")}</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Vertex AI Search Setup Instructions */}
        {selectedProvider === "vertex_ai/search_api" && (
          <Alert
            message={t("toolManagement.vectors.form.searchTitle")}
            description={
              <div>
                <p>{t("toolManagement.vectors.form.searchDescription")}</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    {t("toolManagement.vectors.form.searchEnable")}{" "}
                    <a
                      href="https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      {t("toolManagement.vectors.form.searchDocs")}
                    </a>
                  </li>
                  <li>{t("toolManagement.vectors.form.searchLocation")}</li>
                  <li>{t("toolManagement.vectors.form.searchDataStore")}</li>
                  <li>{t("toolManagement.vectors.form.searchEngine")}</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        <Form.Item
          label={
            <span>
              {t("toolManagement.vectors.vectorId")}{" "}
              <Tooltip title={t("toolManagement.vectors.form.idHelp")}>
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="vector_store_id"
          rules={[{ required: true, message: t("toolManagement.vectors.form.idProviderRequired") }]}
        >
          <TextInput
            placeholder={
              selectedProvider === "vertex_rag_engine"
                ? "6917529027641081856 (Get corpus ID from Vertex AI console)"
                : selectedProvider === "vertex_ai/search_api"
                  ? vertexEngineId
                    ? t("toolManagement.vectors.form.localIdPlaceholder")
                    : "my-datastore_1234567890 (Get data store ID from Vertex AI Search console)"
                  : t("toolManagement.vectors.form.idPlaceholder")
            }
          />
        </Form.Item>

        {/* Provider-specific fields */}
        {getProviderSpecificFields(selectedProvider).map((field: VectorStoreFieldConfig) => {
          if (field.type === "select") {
            const selectOptions =
              field.options ??
              modelInfo
                .filter((option: ModelGroup) => option.mode === "embedding" || option.mode === null)
                .map((option: ModelGroup) => ({
                  value: option.model_group,
                  label: option.model_group,
                }));

            return (
              <Form.Item
                key={field.name}
                label={
                  <span>
                    {field.label}{" "}
                    <Tooltip title={field.tooltip}>
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name={field.name}
                initialValue={field.initialValue}
                rules={
                  field.required
                    ? [
                        {
                          required: true,
                          message: t("toolManagement.vectors.form.selectFieldRequired", { field: field.label }),
                        },
                      ]
                    : []
                }
              >
                <Select
                  placeholder={field.placeholder}
                  showSearch={true}
                  filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  options={selectOptions}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            );
          }

          return (
            <Form.Item
              key={field.name}
              label={
                <span>
                  {field.label}{" "}
                  <Tooltip title={field.tooltip}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name={field.name}
              rules={
                field.required
                  ? [
                      {
                        required: true,
                        message: t("toolManagement.vectors.form.inputFieldRequired", { field: field.label }),
                      },
                    ]
                  : []
              }
            >
              <TextInput type={field.type || "text"} placeholder={field.placeholder} />
            </Form.Item>
          );
        })}

        <Form.Item
          label={
            <span>
              {t("toolManagement.vectors.name")}{" "}
              <Tooltip title={t("toolManagement.vectors.form.nameHelp")}>
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="vector_store_name"
        >
          <TextInput />
        </Form.Item>

        <Form.Item label={t("toolManagement.common.description")} name="vector_store_description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label={
            <span>
              {t("toolManagement.vectors.existingCredentials")}{" "}
              <Tooltip title={t("toolManagement.vectors.form.credentialsHelp")}>
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="litellm_credential_name"
        >
          <Select
            showSearch
            placeholder={t("toolManagement.vectors.credentialsPlaceholder")}
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            options={[
              { value: null, label: t("toolManagement.vectors.none") },
              ...credentials.map((credential) => ({
                value: credential.credential_name,
                label: credential.credential_name,
              })),
            ]}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              {t("toolManagement.vectors.metadata")}{" "}
              <Tooltip title={t("toolManagement.vectors.form.metadataHelp")}>
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
        >
          <Input.TextArea
            rows={4}
            value={metadataJson}
            onChange={(e) => setMetadataJson(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </Form.Item>

        <div className="flex justify-end space-x-3">
          <TremorButton onClick={handleCancel} variant="secondary">
            {t("common.cancel")}
          </TremorButton>
          <TremorButton variant="primary" type="submit">
            {t("toolManagement.vectors.form.create")}
          </TremorButton>
        </div>
      </Form>
    </Modal>
  );
};

export default VectorStoreForm;
