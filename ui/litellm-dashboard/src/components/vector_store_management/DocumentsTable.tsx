import React from "react";
import { Table, Badge, Tooltip } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { EyeOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import { DocumentUpload } from "./types";
import { useTranslation } from "react-i18next";

interface DocumentsTableProps {
  documents: DocumentUpload[];
  onRemove: (uid: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onRemove }) => {
  const { t } = useTranslation();
  const handleCopyId = (uid: string) => {
    navigator.clipboard.writeText(uid);
    MessageManager.success(t("toolManagement.vectors.documentTable.copied"));
  };

  const getStatusBadge = (status: DocumentUpload["status"]) => {
    const statusConfig = {
      uploading: { color: "blue", text: t("toolManagement.vectors.documentTable.uploading") },
      done: { color: "green", text: t("toolManagement.vectors.documentTable.ready") },
      error: { color: "red", text: t("toolManagement.vectors.documentTable.error") },
      removed: { color: "default", text: t("toolManagement.vectors.documentTable.removed") },
    };

    const config = statusConfig[status];
    return <Badge color={config.color} text={config.text} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const columns = [
    {
      title: t("toolManagement.vectors.documentTable.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, record: DocumentUpload) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm">{name}</span>
          {record.size && <span className="text-xs text-gray-400">({formatFileSize(record.size)})</span>}
        </div>
      ),
    },
    {
      title: t("toolManagement.vectors.documentTable.status"),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: DocumentUpload["status"]) => getStatusBadge(status),
    },
    {
      title: t("toolManagement.vectors.documentTable.actions"),
      key: "actions",
      width: 120,
      render: (_: any, record: DocumentUpload) => (
        <div className="flex items-center space-x-2">
          <Tooltip title={t("toolManagement.vectors.documentTable.view")}>
            <EyeOutlined className="cursor-pointer text-gray-600 hover:text-blue-500" onClick={() => {}} />
          </Tooltip>
          <Tooltip title={t("toolManagement.vectors.documentTable.copyId")}>
            <CopyOutlined
              className="cursor-pointer text-gray-600 hover:text-blue-500"
              onClick={() => handleCopyId(record.uid)}
            />
          </Tooltip>
          <Tooltip title={t("toolManagement.vectors.documentTable.remove")}>
            <DeleteOutlined
              className="cursor-pointer text-gray-600 hover:text-red-500"
              onClick={() => onRemove(record.uid)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={documents}
      columns={columns}
      rowKey="uid"
      pagination={false}
      locale={{
        emptyText: t("toolManagement.vectors.documentTable.empty"),
      }}
      size="small"
    />
  );
};

export default DocumentsTable;
