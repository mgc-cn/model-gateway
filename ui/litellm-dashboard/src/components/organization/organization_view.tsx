import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { organizationKeys, useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import { formatNumberWithCommas, copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { Badge, Card, Grid, Text, TextInput, Title, Button as TremorButton } from "@tremor/react";
import { Button, Form, Input, Select, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckIcon, CopyIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import MemberTable from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import { ModelSelect } from "../ModelSelect/ModelSelect";
import NotificationsManager from "../molecules/notifications_manager";
import {
  Member,
  Organization,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
  organizationUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import NumericalInput from "../shared/numerical_input";
import MemberModal from "../team/EditMembership";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editOrg: boolean;
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
  editOrg,
}) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US";
  const queryClient = useQueryClient();
  const { data: orgData, isLoading: loading } = useOrganization(organizationId);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isOrgSaving, setIsOrgSaving] = useState(false);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      const response = await organizationMemberAddCall(accessToken, organizationId, member);

      NotificationsManager.success(i18n.t("organizationManagement.notifications.memberAdded"));
      setIsAddMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend(i18n.t("organizationManagement.notifications.memberAddFailed"));
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      const response = await organizationMemberUpdateCall(accessToken, organizationId, member);
      NotificationsManager.success(i18n.t("organizationManagement.notifications.memberUpdated"));
      setIsEditMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend(i18n.t("organizationManagement.notifications.memberUpdateFailed"));
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      NotificationsManager.success(i18n.t("organizationManagement.notifications.memberDeleted"));
      setIsEditMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend(i18n.t("organizationManagement.notifications.memberDeleteFailed"));
      console.error("Error deleting organization member:", error);
    }
  };

  const handleOrgUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsOrgSaving(true);

      const updateData: any = {
        organization_id: organizationId,
        organization_alias: values.organization_alias,
        models: values.models,
        litellm_budget_table: {
          tpm_limit: values.tpm_limit,
          rpm_limit: values.rpm_limit,
          max_budget: values.max_budget,
          budget_duration: values.budget_duration,
        },
        metadata: values.metadata ? JSON.parse(values.metadata) : null,
      };

      // Handle object_permission updates
      if (values.vector_stores !== undefined || values.mcp_servers_and_groups !== undefined) {
        updateData.object_permission = {
          ...orgData?.object_permission,
          vector_stores: values.vector_stores || [],
        };

        if (values.mcp_servers_and_groups !== undefined) {
          const { servers, accessGroups } = values.mcp_servers_and_groups || {
            servers: [],
            accessGroups: [],
          };
          if (servers && servers.length > 0) {
            updateData.object_permission.mcp_servers = servers;
          }
          if (accessGroups && accessGroups.length > 0) {
            updateData.object_permission.mcp_access_groups = accessGroups;
          }
        }
      }

      const response = await organizationUpdateCall(accessToken, updateData);

      NotificationsManager.success(i18n.t("organizationManagement.notifications.updated"));
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend(i18n.t("organizationManagement.notifications.updateFailed"));
      console.error("Error updating organization:", error);
    } finally {
      setIsOrgSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">{t("organizationManagement.loading")}</div>;
  }

  if (!orgData) {
    return <div className="p-4">{t("organizationManagement.notFound")}</div>;
  }

  const copyToClipboard = async (text: string | null | undefined, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const orgExtraColumns: ColumnsType<Member> = [
    {
      title: t("organizationManagement.fields.spend"),
      key: "spend",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null ? (orgData.members || []).find((m) => m.user_id === record.user_id) : undefined;
        return <Typography.Text>${formatNumberWithCommas(orgMember?.spend ?? 0, 4)}</Typography.Text>;
      },
    },
    {
      title: t("organizationManagement.fields.created"),
      key: "created_at",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null ? (orgData.members || []).find((m) => m.user_id === record.user_id) : undefined;
        return (
          <Typography.Text>
            {orgMember?.created_at ? new Date(orgMember.created_at).toLocaleString(locale) : "-"}
          </Typography.Text>
        );
      },
    },
  ];

  return (
    <div className="w-full h-screen p-4 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <TremorButton icon={ArrowLeftIcon} onClick={onClose} variant="light" className="mb-4">
            {t("organizationManagement.actions.back")}
          </TremorButton>
          <Title>{orgData.organization_alias}</Title>
          <div className="flex items-center cursor-pointer">
            <Text className="text-gray-500 font-mono">{orgData.organization_id}</Text>
            <Button
              type="text"
              size="small"
              icon={copiedStates["org-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              onClick={() => copyToClipboard(orgData.organization_id, "org-id")}
              aria-label={t("organizationManagement.actions.copyId")}
              className={`left-2 z-10 transition-all duration-200 ${
                copiedStates["org-id"]
                  ? "text-green-600 bg-green-50 border-green-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey={editOrg ? "settings" : "overview"}
        className="mb-4"
        items={[
          {
            key: "overview",
            label: t("organizationManagement.tabs.overview"),
            children: (
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                <Card>
                  <Text>{t("organizationManagement.detail.organizationDetails")}</Text>
                  <div className="mt-2">
                    <Text>
                      {t("organizationManagement.detail.createdAt", {
                        date: new Date(orgData.created_at).toLocaleDateString(locale),
                      })}
                    </Text>
                    <Text>
                      {t("organizationManagement.detail.updatedAt", {
                        date: new Date(orgData.updated_at).toLocaleDateString(locale),
                      })}
                    </Text>
                    <Text>{t("organizationManagement.detail.createdBy", { user: orgData.created_by })}</Text>
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationManagement.detail.budgetStatus")}</Text>
                  <div className="mt-2">
                    <Title>${formatNumberWithCommas(orgData.spend, 4)}</Title>
                    <Text>
                      {t("organizationManagement.detail.of", {
                        amount:
                          orgData.litellm_budget_table.max_budget === null
                            ? t("organizationManagement.unlimited")
                            : `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`,
                      })}
                    </Text>
                    {orgData.litellm_budget_table.budget_duration && (
                      <Text className="text-gray-500">
                        {t("organizationManagement.detail.reset", {
                          value: orgData.litellm_budget_table.budget_duration,
                        })}
                      </Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationManagement.detail.rateLimits")}</Text>
                  <div className="mt-2">
                    <Text>TPM: {orgData.litellm_budget_table.tpm_limit || t("organizationManagement.unlimited")}</Text>
                    <Text>RPM: {orgData.litellm_budget_table.rpm_limit || t("organizationManagement.unlimited")}</Text>
                    {orgData.litellm_budget_table.max_parallel_requests && (
                      <Text>
                        {t("organizationManagement.detail.maxParallel", {
                          count: orgData.litellm_budget_table.max_parallel_requests,
                        })}
                      </Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationManagement.fields.models")}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.models.length === 0 ? (
                      <Badge color="red">{t("organizationManagement.allProxyModels")}</Badge>
                    ) : (
                      orgData.models.map((model, index) => (
                        <Badge key={index} color="red">
                          {model}
                        </Badge>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <Text>{t("organizationManagement.detail.teams")}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.teams?.map((team, index) => (
                      <Badge key={index} color="red">
                        {teamAliasMap[team.team_id] || team.team_id}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <ObjectPermissionsView
                  objectPermission={orgData.object_permission}
                  variant="card"
                  accessToken={accessToken}
                />
              </Grid>
            ),
          },
          {
            key: "members",
            label: t("organizationManagement.tabs.members"),
            children: (
              <div className="space-y-4">
                <MemberTable
                  members={(orgData.members || []).map((m) => ({
                    role: m.user_role || "",
                    user_id: m.user_id,
                    user_email: m.user_email,
                  }))}
                  canEdit={canEditOrg}
                  onEdit={(member) => {
                    setSelectedEditMember(member);
                    setIsEditMemberModalVisible(true);
                  }}
                  onDelete={(member) => handleMemberDelete(member)}
                  onAddMember={() => setIsAddMemberModalVisible(true)}
                  roleColumnTitle={t("organizationManagement.detail.organizationRole")}
                  extraColumns={orgExtraColumns}
                  emptyText={t("organizationManagement.detail.noMembers")}
                  userEmailColumnTitle={t("organizationManagement.members.userEmail")}
                  userIdColumnTitle={t("organizationManagement.members.userId")}
                  defaultProxyAdminLabel={t("organizationManagement.members.defaultProxyAdmin")}
                  actionsColumnTitle={t("organizationManagement.fields.actions")}
                  editMemberTooltip={t("organizationManagement.members.editAction")}
                  deleteMemberTooltip={t("organizationManagement.members.deleteAction")}
                  memberCountLabel={(count) => t("organizationManagement.memberCount", { count })}
                  addMemberLabel={t("organizationManagement.members.addAction")}
                  renderRole={(role) => {
                    const labels: Record<string, string> = {
                      org_admin: t("organizationManagement.members.orgAdmin"),
                      internal_user: t("organizationManagement.members.internalUser"),
                      internal_user_viewer: t("organizationManagement.members.internalViewer"),
                    };
                    return labels[role] || role;
                  }}
                />
              </div>
            ),
          },
          {
            key: "settings",
            label: t("organizationManagement.tabs.settings"),
            children: (
              <Card className="overflow-y-auto max-h-[65vh]">
                <div className="flex justify-between items-center mb-4">
                  <Title>{t("organizationManagement.detail.settingsTitle")}</Title>
                  {canEditOrg && !isEditing && (
                    <TremorButton onClick={() => setIsEditing(true)}>
                      {t("organizationManagement.actions.editSettings")}
                    </TremorButton>
                  )}
                </div>

                {isEditing ? (
                  <Form
                    form={form}
                    onFinish={handleOrgUpdate}
                    initialValues={{
                      organization_alias: orgData.organization_alias,
                      models: orgData.models,
                      tpm_limit: orgData.litellm_budget_table.tpm_limit,
                      rpm_limit: orgData.litellm_budget_table.rpm_limit,
                      max_budget: orgData.litellm_budget_table.max_budget,
                      budget_duration: orgData.litellm_budget_table.budget_duration,
                      metadata: orgData.metadata ? JSON.stringify(orgData.metadata, null, 2) : "",
                      vector_stores: orgData.object_permission?.vector_stores || [],
                      mcp_servers_and_groups: {
                        servers: orgData.object_permission?.mcp_servers || [],
                        accessGroups: orgData.object_permission?.mcp_access_groups || [],
                      },
                    }}
                    layout="vertical"
                  >
                    <Form.Item
                      label={t("organizationManagement.fields.name")}
                      name="organization_alias"
                      rules={[
                        {
                          required: true,
                          message: t("organizationManagement.validation.nameRequired"),
                        },
                      ]}
                    >
                      <TextInput />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.fields.models")} name="models">
                      <ModelSelect
                        value={form.getFieldValue("models")}
                        onChange={(values) => form.setFieldValue("models", values)}
                        context="organization"
                        options={{
                          includeSpecialOptions: true,
                          showAllProxyModelsOverride: true,
                        }}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.maxBudget")} name="max_budget">
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.resetBudget")} name="budget_duration">
                      <Select placeholder="n/a">
                        <Select.Option value="24h">{t("organizationManagement.form.daily")}</Select.Option>
                        <Select.Option value="7d">{t("organizationManagement.form.weekly")}</Select.Option>
                        <Select.Option value="30d">{t("organizationManagement.form.monthly")}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.tpmLimit")} name="tpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.rpmLimit")} name="rpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.vectorStores")} name="vector_stores">
                      <VectorStoreSelector
                        onChange={(values) => form.setFieldValue("vector_stores", values)}
                        value={form.getFieldValue("vector_stores")}
                        accessToken={accessToken || ""}
                        placeholder={t("organizationManagement.form.vectorStoresPlaceholderEdit")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.mcpServersGroups")} name="mcp_servers_and_groups">
                      <MCPServerSelector
                        onChange={(values) => form.setFieldValue("mcp_servers_and_groups", values)}
                        value={form.getFieldValue("mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder={t("organizationManagement.form.mcpPlaceholderEdit")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationManagement.form.metadata")} name="metadata">
                      <Input.TextArea rows={4} />
                    </Form.Item>

                    <div className="sticky z-10 bg-white p-4 border-t border-gray-200 -bottom-6 -inset-x-6">
                      <div className="flex justify-end items-center gap-2">
                        <TremorButton variant="secondary" onClick={() => setIsEditing(false)} disabled={isOrgSaving}>
                          {t("common.cancel")}
                        </TremorButton>
                        <TremorButton type="submit" loading={isOrgSaving}>
                          {t("organizationManagement.actions.saveChanges")}
                        </TremorButton>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Text className="font-medium">{t("organizationManagement.fields.name")}</Text>
                      <div>{orgData.organization_alias}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationManagement.fields.id")}</Text>
                      <div className="font-mono">{orgData.organization_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationManagement.fields.created")}</Text>
                      <div>{new Date(orgData.created_at).toLocaleString(locale)}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationManagement.fields.models")}</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {orgData.models.map((model, index) => (
                          <Badge key={index} color="red">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationManagement.detail.rateLimits")}</Text>
                      <div>TPM: {orgData.litellm_budget_table.tpm_limit || t("organizationManagement.unlimited")}</div>
                      <div>RPM: {orgData.litellm_budget_table.rpm_limit || t("organizationManagement.unlimited")}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationManagement.fields.budget")}</Text>
                      <div>
                        {t("organizationManagement.detail.maximum", {
                          amount:
                            orgData.litellm_budget_table.max_budget !== null
                              ? `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`
                              : t("organizationManagement.noLimit"),
                        })}
                      </div>
                      <div>
                        {t("organizationManagement.detail.reset", {
                          value: orgData.litellm_budget_table.budget_duration || t("organizationManagement.never"),
                        })}
                      </div>
                    </div>

                    <ObjectPermissionsView
                      objectPermission={orgData.object_permission}
                      variant="inline"
                      className="pt-4 border-t border-gray-200"
                      accessToken={accessToken}
                    />
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title={t("organizationManagement.members.addTitle")}
        roles={[
          {
            label: t("organizationManagement.members.orgAdmin"),
            value: "org_admin",
            description: t("organizationManagement.members.orgAdminDescription"),
          },
          {
            label: t("organizationManagement.members.internalUser"),
            value: "internal_user",
            description: t("organizationManagement.members.userDescription"),
          },
          {
            label: t("organizationManagement.members.internalViewer"),
            value: "internal_user_viewer",
            description: t("organizationManagement.members.viewerDescription"),
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: t("organizationManagement.members.editTitle"),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: t("organizationManagement.members.orgAdmin"), value: "org_admin" },
            { label: t("organizationManagement.members.internalUser"), value: "internal_user" },
            { label: t("organizationManagement.members.internalViewer"), value: "internal_user_viewer" },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
