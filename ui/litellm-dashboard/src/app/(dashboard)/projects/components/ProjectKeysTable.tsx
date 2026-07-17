import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { Empty, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SpinProps } from "antd";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { useTranslation } from "react-i18next";

interface ProjectKeysTableProps {
  keys: KeyResponse[];
  loading?: boolean | SpinProps;
}

export function ProjectKeysTable({ keys, loading }: ProjectKeysTableProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US";
  const columns: ColumnsType<KeyResponse> = [
    {
      title: t("projectManagement.keys.columns.name"),
      dataIndex: "key_alias",
      key: "key_alias",
      render: (alias: string | null) => alias || "—",
    },
    {
      title: t("projectManagement.keys.columns.owner"),
      key: "owner",
      render: (_: unknown, record: KeyResponse) => {
        const email = record.user?.user_email ?? record.user_id ?? null;
        if (!email) return "—";
        return (
          <Tooltip title={email}>
            <DefaultProxyAdminTag userId={email} />
          </Tooltip>
        );
      },
    },
    {
      title: t("projectManagement.keys.columns.created"),
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => (date ? new Date(date).toLocaleDateString(locale) : "—"),
    },
    {
      title: t("projectManagement.keys.columns.lastActive"),
      dataIndex: "last_active",
      key: "last_active",
      render: (date: string | null) =>
        date ? new Date(date).toLocaleDateString(locale) : t("projectManagement.keys.never"),
    },
  ];
  return (
    <Table
      columns={columns}
      dataSource={keys}
      rowKey="token"
      loading={loading}
      pagination={false}
      size="small"
      locale={{
        emptyText: <Empty description={t("projectManagement.keys.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
    />
  );
}
