import React, { useState, useEffect } from "react";
import { Button } from "@tremor/react";
import { Modal } from "antd";
import { getClaudeCodePluginsList, deleteClaudeCodePlugin } from "./networking";
import AddPluginForm from "./claude_code_plugins/add_plugin_form";
import PluginTable from "./claude_code_plugins/plugin_table";
import SkillDetail from "./claude_code_plugins/skill_detail";
import { isAdminRole } from "@/utils/roles";
import NotificationsManager from "./molecules/notifications_manager";
import { Plugin, ListPluginsResponse } from "./claude_code_plugins/types";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/outline";

interface ClaudeCodePluginsPanelProps {
  accessToken: string | null;
  userRole?: string;
}

const ClaudeCodePluginsPanel: React.FC<ClaudeCodePluginsPanelProps> = ({ accessToken, userRole }) => {
  const { t } = useTranslation();
  const [pluginsList, setPluginsList] = useState<Plugin[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pluginToDelete, setPluginToDelete] = useState<{
    name: string;
    displayName: string;
  } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Plugin | null>(null);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchPlugins = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response: ListPluginsResponse = await getClaudeCodePluginsList(accessToken, false);
      setPluginsList(response.plugins);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, [accessToken]);

  const handleDeleteClick = (pluginName: string, displayName: string) => {
    setPluginToDelete({ name: pluginName, displayName });
  };

  const handleDeleteConfirm = async () => {
    if (!pluginToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteClaudeCodePlugin(accessToken, pluginToDelete.name);
      NotificationsManager.success(t("skills.notifications.deleted", { name: pluginToDelete.displayName }));
      fetchPlugins();
    } catch (error) {
      console.error("Error deleting skill:", error);
      NotificationsManager.error(t("skills.notifications.deleteFailed"));
    } finally {
      setIsDeleting(false);
      setPluginToDelete(null);
    }
  };

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      {selectedSkill ? (
        <SkillDetail
          skill={selectedSkill}
          onBack={() => setSelectedSkill(null)}
          isAdmin={isAdmin}
          accessToken={accessToken}
          onPublishClick={fetchPlugins}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-4">
            <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
            <p className="text-sm text-gray-600">
              {t("skills.description")}{" "}
              <code className="bg-gray-100 px-1 rounded-sm">/claude-code/marketplace.json</code>.
            </p>
            <div className="mt-2 flex gap-2">
              <Button icon={PlusIcon} onClick={() => setIsAddModalVisible(true)} disabled={!accessToken || !isAdmin}>
                {t("skills.add")}
              </Button>
            </div>
          </div>

          <PluginTable
            pluginsList={pluginsList}
            isLoading={isLoading}
            onDeleteClick={handleDeleteClick}
            accessToken={accessToken}
            isAdmin={isAdmin}
            onPluginClick={(id) => {
              const skill = pluginsList.find((p) => p.id === id);
              if (skill) setSelectedSkill(skill);
            }}
          />
        </>
      )}

      <AddPluginForm
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        accessToken={accessToken}
        onSuccess={fetchPlugins}
      />

      {pluginToDelete && (
        <Modal
          title={t("skills.delete.title")}
          open={pluginToDelete !== null}
          onOk={handleDeleteConfirm}
          onCancel={() => setPluginToDelete(null)}
          confirmLoading={isDeleting}
          okText={t("common.delete")}
          okButtonProps={{ danger: true }}
        >
          <p>
            {t("skills.delete.confirm")} <strong>{pluginToDelete.displayName}</strong>?
          </p>
          <p>{t("skills.delete.irreversible")}</p>
        </Modal>
      )}
    </div>
  );
};

export default ClaudeCodePluginsPanel;
