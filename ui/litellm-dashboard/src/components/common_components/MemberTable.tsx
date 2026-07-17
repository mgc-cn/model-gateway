import { Member } from "@/components/networking";
import { CrownOutlined, InfoCircleOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import React from "react";
import TableIconActionButton from "./IconActionButton/TableIconActionButtons/TableIconActionButton";

const { Text } = Typography;

export interface MemberTableProps {
  members: Member[];
  canEdit: boolean;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onAddMember?: () => void;
  roleColumnTitle?: string;
  roleTooltip?: string;
  extraColumns?: ColumnsType<Member>;
  showDeleteForMember?: (member: Member) => boolean;
  emptyText?: string;
  userEmailColumnTitle?: React.ReactNode;
  userIdColumnTitle?: React.ReactNode;
  defaultProxyAdminLabel?: React.ReactNode;
  actionsColumnTitle?: React.ReactNode;
  editMemberTooltip?: string;
  deleteMemberTooltip?: string;
  memberCountLabel?: (count: number) => React.ReactNode;
  addMemberLabel?: React.ReactNode;
  renderRole?: (role: string) => React.ReactNode;
}

export default function MemberTable({
  members,
  canEdit,
  onEdit,
  onDelete,
  onAddMember,
  roleColumnTitle = "Role",
  roleTooltip,
  extraColumns = [],
  showDeleteForMember,
  emptyText,
  userEmailColumnTitle = "User Email",
  userIdColumnTitle = "User ID",
  defaultProxyAdminLabel = "Default Proxy Admin",
  actionsColumnTitle = "Actions",
  editMemberTooltip = "Edit member",
  deleteMemberTooltip = "Delete member",
  memberCountLabel = (count) => `${count} Member${count !== 1 ? "s" : ""}`,
  addMemberLabel = "Add Member",
  renderRole,
}: MemberTableProps) {
  const baseColumns: ColumnsType<Member> = [
    {
      title: userEmailColumnTitle,
      dataIndex: "user_email",
      key: "user_email",
      render: (email: string | null) => <Text>{email || "-"}</Text>,
    },
    {
      title: userIdColumnTitle,
      dataIndex: "user_id",
      key: "user_id",
      render: (userId: string | null) =>
        userId === "default_user_id" ? <Tag color="blue">{defaultProxyAdminLabel}</Tag> : <Text>{userId || "-"}</Text>,
    },
    {
      title: roleTooltip ? (
        <Space direction="horizontal">
          {roleColumnTitle}
          <Tooltip title={roleTooltip}>
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ) : (
        roleColumnTitle
      ),
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Space>
          {role?.toLowerCase() === "admin" || role?.toLowerCase() === "org_admin" ? (
            <CrownOutlined />
          ) : (
            <UserOutlined />
          )}
          <Text style={{ textTransform: renderRole ? undefined : "capitalize" }}>
            {role ? renderRole?.(role) ?? role : "-"}
          </Text>
        </Space>
      ),
    },
    ...extraColumns,
    {
      title: actionsColumnTitle,
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, record: Member) =>
        canEdit ? (
          <Space>
            <TableIconActionButton
              variant="Edit"
              tooltipText={editMemberTooltip}
              dataTestId="edit-member"
              onClick={() => onEdit(record)}
            />
            {(!showDeleteForMember || showDeleteForMember(record)) && (
              <TableIconActionButton
                variant="Delete"
                tooltipText={deleteMemberTooltip}
                dataTestId="delete-member"
                onClick={() => onDelete(record)}
              />
            )}
          </Space>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <span className="inline-flex text-sm text-gray-700">{memberCountLabel(members.length)}</span>
      <Table
        columns={baseColumns}
        dataSource={members}
        rowKey={(record) => record.user_id ?? record.user_email ?? JSON.stringify(record)}
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
        locale={emptyText ? { emptyText } : undefined}
      />
      {onAddMember && canEdit && (
        <Button icon={<UserAddOutlined />} type="primary" onClick={onAddMember}>
          {addMemberLabel}
        </Button>
      )}
    </Space>
  );
}
