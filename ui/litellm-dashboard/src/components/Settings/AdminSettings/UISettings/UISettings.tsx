"use client";

import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { useUpdateUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUpdateUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import NotificationManager from "@/components/molecules/notifications_manager";
import PageVisibilitySettings from "./PageVisibilitySettings";
import { Alert, Card, Divider, Skeleton, Space, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";

export default function UISettings() {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useUISettings();
  const { mutate: updateSettings, isPending: isUpdating, error: updateError } = useUpdateUISettings(accessToken);

  const schema = data?.field_schema;
  const enableProjectsUIProperty = schema?.properties?.enable_projects_ui;
  const values = data?.values ?? {};
  const isDisabledForInternalUsers = Boolean(values.disable_model_add_for_internal_users);
  const isDisabledTeamAdminDeleteTeamUser = Boolean(values.disable_team_admin_delete_team_user);
  const isAgentsDisabled = Boolean(values.disable_agents_for_internal_users);
  const isVectorStoresDisabled = Boolean(values.disable_vector_stores_for_internal_users);

  const handleToggle = (checked: boolean) => {
    updateSettings(
      { disable_model_add_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleTeamAdminDelete = (checked: boolean) => {
    updateSettings(
      { disable_team_admin_delete_team_user: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleUpdatePageVisibility = (settings: { enabled_ui_pages_internal_users: string[] | null }) => {
    updateSettings(settings, {
      onSuccess: () => {
        NotificationManager.success(t("adminSettings.ui.pageVisibilityUpdated"));
      },
      onError: (error) => {
        NotificationManager.fromBackend(error);
      },
    });
  };

  const handleToggleForwardClientHeaders = (checked: boolean) => {
    updateSettings(
      { forward_client_headers_to_llm_api: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleForwardLLMProviderAuthHeaders = (checked: boolean) => {
    updateSettings(
      { forward_llm_provider_auth_headers: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleEnableProjectsUI = (checked: boolean) => {
    updateSettings(
      { enable_projects_ui: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updatedRefreshing"));
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleEnableChatUI = (checked: boolean) => {
    updateSettings(
      { enable_chat_ui: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updatedRefreshing"));
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleRequireAuthForPublicAIHub = (checked: boolean) => {
    updateSettings(
      { require_auth_for_public_ai_hub: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableAgents = (checked: boolean) => {
    updateSettings(
      { disable_agents_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleAllowAgentsTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_agents_for_team_admins: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableVectorStores = (checked: boolean) => {
    updateSettings(
      { disable_vector_stores_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleAllowVectorStoresTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_vector_stores_for_team_admins: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleScopeUserSearch = (checked: boolean) => {
    updateSettings(
      { scope_user_search_to_org: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableCustomApiKeys = (checked: boolean) => {
    updateSettings(
      { disable_custom_api_keys: checked },
      {
        onSuccess: () => {
          NotificationManager.success(t("adminSettings.ui.updated"));
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  return (
    <Card title={t("adminSettings.ui.title")}>
      {isLoading ? (
        <Skeleton active />
      ) : isError ? (
        <Alert
          type="error"
          message={t("adminSettings.ui.loadFailed")}
          description={error instanceof Error ? error.message : undefined}
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>{t("adminSettings.ui.description")}</Typography.Paragraph>

          {updateError && (
            <Alert
              type="error"
              message={t("adminSettings.ui.updateFailed")}
              description={updateError instanceof Error ? updateError.message : undefined}
            />
          )}

          <Space align="start" size="middle">
            <Switch
              checked={isDisabledForInternalUsers}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggle}
              aria-label={t("adminSettings.ui.disableModelAdd.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.disableModelAdd.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.disableModelAdd.description")}</Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={isDisabledTeamAdminDeleteTeamUser}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleTeamAdminDelete}
              aria-label={t("adminSettings.ui.disableTeamDelete.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.disableTeamDelete.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.disableTeamDelete.description")}</Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={values.require_auth_for_public_ai_hub}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleRequireAuthForPublicAIHub}
              aria-label={t("adminSettings.ui.requireHubAuth.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.requireHubAuth.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.requireHubAuth.description")}</Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.forward_client_headers_to_llm_api)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleForwardClientHeaders}
              aria-label={t("adminSettings.ui.forwardClientHeaders.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.forwardClientHeaders.title")}</Typography.Text>
              <Typography.Text type="secondary">
                {t("adminSettings.ui.forwardClientHeaders.description")}
              </Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.forward_llm_provider_auth_headers)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleForwardLLMProviderAuthHeaders}
              aria-label={t("adminSettings.ui.forwardProviderHeaders.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.forwardProviderHeaders.title")}</Typography.Text>
              <Typography.Text type="secondary">
                {t("adminSettings.ui.forwardProviderHeaders.description")}
              </Typography.Text>
            </Space>
          </Space>

          {enableProjectsUIProperty && (
            <Space align="start" size="middle">
              <Switch
                checked={Boolean(values.enable_projects_ui)}
                disabled={isUpdating}
                loading={isUpdating}
                onChange={handleToggleEnableProjectsUI}
                aria-label={t("adminSettings.ui.enableProjects.title")}
              />
              <Space direction="vertical" size={4}>
                <Typography.Text strong>{t("adminSettings.ui.enableProjects.title")}</Typography.Text>
                <Typography.Text type="secondary">{t("adminSettings.ui.enableProjects.description")}</Typography.Text>
              </Space>
            </Space>
          )}

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.enable_chat_ui)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleEnableChatUI}
              aria-label={t("adminSettings.ui.enableChat.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.enableChat.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.enableChat.description")}</Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Agents access control */}
          <Space align="start" size="middle">
            <Switch
              checked={isAgentsDisabled}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableAgents}
              aria-label={t("adminSettings.ui.disableAgents.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.disableAgents.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.disableAgents.description")}</Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle" style={{ marginLeft: 32 }}>
            <Switch
              checked={Boolean(values.allow_agents_for_team_admins)}
              disabled={isUpdating || !isAgentsDisabled}
              loading={isUpdating}
              onChange={handleToggleAllowAgentsTeamAdmins}
              aria-label={t("adminSettings.ui.allowAgentsAdmins.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong type={!isAgentsDisabled ? "secondary" : undefined}>
                {t("adminSettings.ui.allowAgentsAdmins.title")}
              </Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.allowAgentsAdmins.description")}</Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Vector Stores access control */}
          <Space align="start" size="middle">
            <Switch
              checked={isVectorStoresDisabled}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableVectorStores}
              aria-label={t("adminSettings.ui.disableVectorStores.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.disableVectorStores.title")}</Typography.Text>
              <Typography.Text type="secondary">
                {t("adminSettings.ui.disableVectorStores.description")}
              </Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle" style={{ marginLeft: 32 }}>
            <Switch
              checked={Boolean(values.allow_vector_stores_for_team_admins)}
              disabled={isUpdating || !isVectorStoresDisabled}
              loading={isUpdating}
              onChange={handleToggleAllowVectorStoresTeamAdmins}
              aria-label={t("adminSettings.ui.allowVectorStoresAdmins.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong type={!isVectorStoresDisabled ? "secondary" : undefined}>
                {t("adminSettings.ui.allowVectorStoresAdmins.title")}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t("adminSettings.ui.allowVectorStoresAdmins.description")}
              </Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Scope user search to organization */}
          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.scope_user_search_to_org)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleScopeUserSearch}
              aria-label={t("adminSettings.ui.scopeUserSearch.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.scopeUserSearch.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.scopeUserSearch.description")}</Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Disable custom Virtual key values */}
          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.disable_custom_api_keys)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableCustomApiKeys}
              aria-label={t("adminSettings.ui.disableCustomKeys.title")}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{t("adminSettings.ui.disableCustomKeys.title")}</Typography.Text>
              <Typography.Text type="secondary">{t("adminSettings.ui.disableCustomKeys.description")}</Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Page Visibility for Internal Users */}
          <PageVisibilitySettings
            enabledPagesInternalUsers={values.enabled_ui_pages_internal_users}
            enabledPagesPropertyDescription={t("adminSettings.ui.pageVisibility.description")}
            isUpdating={isUpdating}
            onUpdate={handleUpdatePageVisibility}
          />
        </Space>
      )}
    </Card>
  );
}
