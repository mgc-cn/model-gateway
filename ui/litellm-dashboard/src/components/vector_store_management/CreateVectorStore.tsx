import React, { useState } from "react";
import { Card, Title, Text } from "@tremor/react";
import { Upload, Button, Select, Form, Alert, Tooltip, Input } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { InboxOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { ragIngestCall } from "../networking";
import { DocumentUpload, RAGIngestResponse } from "./types";
import DocumentsTable from "./DocumentsTable";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  VectorStoreFieldConfig,
} from "../vector_store_providers";
import { resolveLogoSrc } from "@/lib/assetPaths";
import NotificationsManager from "../molecules/notifications_manager";
import S3VectorsConfig from "./S3VectorsConfig";
import { useTranslation } from "react-i18next";

const { Dragger } = Upload;

interface CreateVectorStoreProps {
  accessToken: string | null;
  onSuccess?: (vectorStoreId: string) => void;
}

const CreateVectorStore: React.FC<CreateVectorStoreProps> = ({ accessToken, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("bedrock");
  const [vectorStoreName, setVectorStoreName] = useState<string>("");
  const [vectorStoreDescription, setVectorStoreDescription] = useState<string>("");
  const [ingestResults, setIngestResults] = useState<RAGIngestResponse[]>([]);
  const [providerParams, setProviderParams] = useState<Record<string, any>>({});

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    accept: ".pdf,.txt,.docx,.md,.doc",
    beforeUpload: (file) => {
      const isValidType = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/markdown",
      ].includes(file.type);

      if (!isValidType) {
        MessageManager.error(t("toolManagement.vectors.unsupportedFile", { name: file.name }));
        return Upload.LIST_IGNORE;
      }

      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        MessageManager.error(t("toolManagement.vectors.fileTooLarge", { name: file.name }));
        return Upload.LIST_IGNORE;
      }

      const newDoc: DocumentUpload = {
        uid: file.uid,
        name: file.name,
        status: "done",
        size: file.size,
        type: file.type,
        originFileObj: file,
      };

      setDocuments((prev) => [...prev, newDoc]);
      return false; // Prevent auto upload
    },
    onRemove: (file) => {
      setDocuments((prev) => prev.filter((doc) => doc.uid !== file.uid));
    },
    fileList: documents.map((doc) => ({
      uid: doc.uid,
      name: doc.name,
      status: doc.status,
      size: doc.size,
    })),
    showUploadList: false, // We'll use our custom table
  };

  const handleRemoveDocument = (uid: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.uid !== uid));
  };

  const handleCreateVectorStore = async () => {
    if (documents.length === 0) {
      MessageManager.warning(t("toolManagement.vectors.noDocuments"));
      return;
    }

    if (!selectedProvider) {
      MessageManager.warning(t("toolManagement.vectors.providerRequired"));
      return;
    }

    // Validate provider-specific required fields
    const requiredFields = getProviderSpecificFields(selectedProvider).filter((field) => field.required);
    for (const field of requiredFields) {
      if (!providerParams[field.name]) {
        MessageManager.warning(t("toolManagement.vectors.fieldRequired", { field: field.label }));
        return;
      }
    }

    // S3 Vectors specific validation
    if (selectedProvider === "s3_vectors") {
      if (providerParams.vector_bucket_name && providerParams.vector_bucket_name.length < 3) {
        MessageManager.warning(t("toolManagement.vectors.bucketNameLength"));
        return;
      }
      if (providerParams.index_name && providerParams.index_name.length > 0 && providerParams.index_name.length < 3) {
        MessageManager.warning(t("toolManagement.vectors.indexNameLength"));
        return;
      }
    }

    if (!accessToken) {
      MessageManager.error(t("toolManagement.vectors.noAccessToken"));
      return;
    }

    setIsCreating(true);
    const results: RAGIngestResponse[] = [];
    let vectorStoreId: string | undefined;

    try {
      // Ingest each document
      for (const doc of documents) {
        if (!doc.originFileObj) continue;

        // Update document status to uploading
        setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "uploading" as const } : d)));

        try {
          const result = await ragIngestCall(
            accessToken,
            doc.originFileObj,
            selectedProvider,
            vectorStoreId, // Use the same vector store ID for subsequent uploads
            vectorStoreName || undefined,
            vectorStoreDescription || undefined,
            providerParams,
          );

          // Store the vector store ID from the first successful ingest
          if (!vectorStoreId && result.vector_store_id) {
            vectorStoreId = result.vector_store_id;
          }

          results.push(result);

          // Update document status to done
          setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "done" as const } : d)));
        } catch (error) {
          console.error(`Error ingesting ${doc.name}:`, error);
          // Update document status to error
          setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "error" as const } : d)));
          throw error; // Stop processing on first error
        }
      }

      setIngestResults(results);
      NotificationsManager.success(
        t("toolManagement.vectors.createSuccess", { count: results.length, id: vectorStoreId }),
      );

      if (onSuccess && vectorStoreId) {
        onSuccess(vectorStoreId);
      }

      // Clear documents after successful creation
      setTimeout(() => {
        setDocuments([]);
        setIngestResults([]);
      }, 3000);
    } catch (error) {
      console.error("Error creating vector store:", error);
      NotificationsManager.fromBackend(t("toolManagement.vectors.createFailed", { error: String(error) }));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Title>{t("toolManagement.vectors.createTitle")}</Title>
        <Text className="text-gray-500">{t("toolManagement.vectors.createDescription")}</Text>
      </div>

      {/* Upload Area */}
      <Card>
        <div className="mb-4">
          <Text className="font-medium">{t("toolManagement.vectors.stepUpload")}</Text>
          <Text className="text-sm text-gray-500 block mt-1">{t("toolManagement.vectors.uploadDescription")}</Text>
        </div>
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
          </p>
          <p className="ant-upload-text">{t("toolManagement.vectors.upload")}</p>
          <p className="ant-upload-hint">{t("toolManagement.vectors.uploadHelp")}</p>
        </Dragger>
      </Card>

      {/* Documents Table */}
      {documents.length > 0 && (
        <Card>
          <div className="mb-4">
            <Text className="font-medium">
              {t("toolManagement.vectors.uploadedDocuments", { count: documents.length })}
            </Text>
          </div>
          <DocumentsTable documents={documents} onRemove={handleRemoveDocument} />
        </Card>
      )}

      {/* Provider Selection and Vector Store Details */}
      <Card>
        <div className="space-y-4">
          <div>
            <Text className="font-medium">{t("toolManagement.vectors.stepConfigure")}</Text>
            <Text className="text-sm text-gray-500 block mt-1">{t("toolManagement.vectors.configureDescription")}</Text>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              label={
                <span>
                  {t("toolManagement.vectors.name")}{" "}
                  <Tooltip title={t("toolManagement.vectors.nameHelp")}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
            >
              <Input
                value={vectorStoreName}
                onChange={(e) => setVectorStoreName(e.target.value)}
                placeholder={t("toolManagement.vectors.namePlaceholder")}
                size="large"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  {t("toolManagement.common.description")}{" "}
                  <Tooltip title={t("toolManagement.vectors.descriptionHelp")}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
            >
              <Input.TextArea
                value={vectorStoreDescription}
                onChange={(e) => setVectorStoreDescription(e.target.value)}
                placeholder={t("toolManagement.vectors.descriptionPlaceholder")}
                rows={2}
                size="large"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  {t("toolManagement.common.provider")}{" "}
                  <Tooltip title={t("toolManagement.vectors.providerHelp")}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              required
            >
              <Select
                value={selectedProvider}
                onChange={setSelectedProvider}
                placeholder={t("toolManagement.vectors.providerPlaceholder")}
                size="large"
                style={{ width: "100%" }}
              >
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

            {/* S3 Vectors Configuration */}
            {selectedProvider === "s3_vectors" && (
              <S3VectorsConfig
                accessToken={accessToken}
                providerParams={providerParams}
                onParamsChange={setProviderParams}
              />
            )}

            {/* Other Provider-specific fields */}
            {selectedProvider !== "s3_vectors" &&
              getProviderSpecificFields(selectedProvider).map((field: VectorStoreFieldConfig) => {
                if (field.type === "select") {
                  // For embedding model selection, we'd need to fetch available models
                  // For now, provide a text input as fallback
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
                      required={field.required}
                    >
                      <Input
                        value={providerParams[field.name] || ""}
                        onChange={(e) => setProviderParams((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        size="large"
                        className="rounded-md"
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
                    required={field.required}
                  >
                    <Input
                      type={field.type === "password" ? "password" : "text"}
                      value={providerParams[field.name] || ""}
                      onChange={(e) => setProviderParams((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                );
              })}
          </Form>

          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              onClick={handleCreateVectorStore}
              loading={isCreating}
              disabled={documents.length === 0 || !selectedProvider}
            >
              {isCreating ? t("toolManagement.vectors.creating") : t("toolManagement.vectors.create")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Success Message */}
      {ingestResults.length > 0 && (
        <Alert
          message={t("toolManagement.vectors.created")}
          description={
            <div>
              <p>
                <strong>{t("toolManagement.vectors.vectorId")}:</strong> {ingestResults[0]?.vector_store_id}
              </p>
              <p>
                <strong>{t("toolManagement.vectors.documents")}</strong> {ingestResults.length}
              </p>
            </div>
          }
          type="success"
          showIcon
          closable
        />
      )}
    </div>
  );
};

export default CreateVectorStore;
