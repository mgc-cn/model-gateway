import { ColumnDef } from "@tanstack/react-table";
import { Badge, Grid, Icon } from "@tremor/react";
import { Tooltip, Checkbox, Tag } from "antd";
import { UserInfo } from "@/components/networking";
import { PencilAltIcon, TrashIcon, InformationCircleIcon, RefreshIcon } from "@heroicons/react/outline";
import { CopyOutlined } from "@ant-design/icons";
import { formatNumberWithCommas, copyToClipboard } from "@/utils/dataUtils";
import i18n from "@/i18n/i18n";
import { getLocalizedUserRole } from "@/utils/roles";

interface SelectionOptions {
  selectedUsers: UserInfo[];
  onSelectUser: (user: UserInfo, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  isUserSelected: (user: UserInfo) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export const columns = (
  possibleUIRoles: Record<string, Record<string, string>>,
  handleEdit: (user: UserInfo) => void,
  handleDelete: (user: UserInfo) => void,
  handleResetPassword: (userId: string) => void,
  handleUserClick: (userId: string, openInEditMode?: boolean) => void,
  selectionOptions?: SelectionOptions,
): ColumnDef<UserInfo>[] => {
  const t = i18n.t.bind(i18n);
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US";
  // Backend sortable columns: user_id, user_email, created_at, spend, user_alias, user_role
  const baseColumns: ColumnDef<UserInfo>[] = [
    {
      header: t("userManagement.fields.userId"),
      accessorKey: "user_id",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Tooltip title={row.original.user_id}>
            <span className="text-xs">{row.original.user_id ? `${row.original.user_id.slice(0, 7)}...` : "-"}</span>
          </Tooltip>
          {row.original.user_id && (
            <Tooltip title={t("userManagement.actions.copyUserId")}>
              <CopyOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(row.original.user_id, t("userManagement.notifications.userIdCopied"));
                }}
                className="cursor-pointer text-gray-500 hover:text-blue-500 text-xs"
              />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      header: t("userManagement.fields.email"),
      accessorKey: "user_email",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs">{row.original.user_email || "-"}</span>,
    },
    {
      id: "status",
      header: t("userManagement.fields.status"),
      enableSorting: false,
      cell: ({ row }) => {
        const isScimInactive =
          (row.original.metadata as Record<string, unknown> | null | undefined)?.scim_active === false;
        if (isScimInactive) {
          return (
            <Tooltip title={t("userManagement.status.scimInactiveHelp")}>
              <Tag color="red" data-testid={`user-status-${row.original.user_id}`}>
                {t("userManagement.status.inactive")}
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color="green" data-testid={`user-status-${row.original.user_id}`}>
            {t("userManagement.status.active")}
          </Tag>
        );
      },
    },
    {
      header: t("userManagement.fields.globalRole"),
      accessorKey: "user_role",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.user_role ? getLocalizedUserRole(row.original.user_role, possibleUIRoles, t).label : "-"}
        </span>
      ),
    },
    {
      header: t("userManagement.fields.alias"),
      accessorKey: "user_alias",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.user_alias || "-"}</span>,
    },
    {
      header: t("userManagement.fields.spend"),
      accessorKey: "spend",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs">{row.original.spend ? formatNumberWithCommas(row.original.spend, 4) : "-"}</span>
      ),
    },
    {
      header: t("userManagement.fields.budget"),
      accessorKey: "max_budget",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.max_budget !== null ? row.original.max_budget : t("userManagement.unlimited")}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <span>{t("userManagement.fields.ssoId")}</span>
          <Tooltip title={t("userManagement.fields.ssoIdHelp")}>
            <InformationCircleIcon className="w-4 h-4" />
          </Tooltip>
        </div>
      ),
      accessorKey: "sso_user_id",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs">{row.original.sso_user_id !== null ? row.original.sso_user_id : "-"}</span>
      ),
    },
    {
      header: t("userManagement.fields.virtualKeys"),
      accessorKey: "key_count",
      enableSorting: false,
      cell: ({ row }) => (
        <Grid numItems={2}>
          {row.original.key_count > 0 ? (
            <Badge size="xs" color="indigo">
              {t("userManagement.keyCount", { count: row.original.key_count })}
            </Badge>
          ) : (
            <Badge size="xs" color="gray">
              {t("userManagement.noKeys")}
            </Badge>
          )}
        </Grid>
      ),
    },
    {
      header: t("userManagement.fields.createdAt"),
      accessorKey: "created_at",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString(locale) : "-"}
        </span>
      ),
    },
    {
      header: t("userManagement.fields.updatedAt"),
      accessorKey: "updated_at",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.updated_at ? new Date(row.original.updated_at).toLocaleDateString(locale) : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("userManagement.fields.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Tooltip title={t("userManagement.actions.edit")}>
            <Icon
              icon={PencilAltIcon}
              size="sm"
              onClick={() => handleUserClick(row.original.user_id, true)}
              className="cursor-pointer hover:text-blue-600"
            />
          </Tooltip>
          <Tooltip title={t("userManagement.actions.delete")}>
            <Icon
              icon={TrashIcon}
              size="sm"
              onClick={() => handleDelete(row.original)}
              className="cursor-pointer hover:text-red-600"
            />
          </Tooltip>
          <Tooltip title={t("userManagement.actions.resetPassword")}>
            <Icon
              icon={RefreshIcon}
              size="sm"
              onClick={() => handleResetPassword(row.original.user_id)}
              className="cursor-pointer hover:text-green-600"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Add selection column if selection is enabled
  if (selectionOptions) {
    const { onSelectUser, onSelectAll, isUserSelected, isAllSelected, isIndeterminate } = selectionOptions;

    return [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={isUserSelected(row.original)}
            onChange={(e) => onSelectUser(row.original, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      ...baseColumns,
    ];
  }

  return baseColumns;
};
