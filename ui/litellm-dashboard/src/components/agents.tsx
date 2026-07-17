import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Badge,
  Text,
} from "@tremor/react";
import { Modal, Alert, Tooltip, Skeleton, Switch } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { getAgentsList, deleteAgentCall } from "./networking";
import AddAgentForm from "./agents/add_agent_form";
import { isAdminRole } from "@/utils/roles";
import AgentInfoView from "./agents/agent_info";
import NotificationsManager from "./molecules/notifications_manager";
import { Agent } from "./agents/types";
import { Team } from "./key_team_helpers/key_list";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import TableIconActionButton from "./common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import { useTranslation } from "react-i18next";

interface AgentsPanelProps {
  accessToken: string | null;
  userRole?: string;
  teams?: Team[] | null;
}

interface AgentsResponse {
  agents: Agent[];
}

const AgentsPanel: React.FC<AgentsPanelProps> = ({ accessToken, userRole, teams }) => {
  const { t, i18n } = useTranslation();
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [healthCheckEnabled, setHealthCheckEnabled] = useState(false);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchAgents = async (healthCheck?: boolean) => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: AgentsResponse = await getAgentsList(accessToken, healthCheck ?? healthCheckEnabled);
      setAgentsList(response.agents || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [accessToken]);

  const handleHealthCheckToggle = (checked: boolean) => {
    setHealthCheckEnabled(checked);
    fetchAgents(checked);
  };

  const handleAddAgent = () => {
    if (selectedAgentId) {
      setSelectedAgentId(null);
    }
    setIsAddModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleSuccess = () => {
    fetchAgents();
  };

  const handleDeleteClick = (agentId: string, agentName: string) => {
    setAgentToDelete({ id: agentId, name: agentName });
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteAgentCall(accessToken, agentToDelete.id);
      NotificationsManager.success(t("agentManagement.notifications.deleted", { name: agentToDelete.name }));
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      NotificationsManager.fromBackend(t("agentManagement.notifications.deleteFailed"));
    } finally {
      setIsDeleting(false);
      setAgentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setAgentToDelete(null);
  };

  const sortedAgents = [...agentsList].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const columnCount = isAdmin ? 7 : 6;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-bold">{t("agentManagement.title")}</h1>
        <p className="text-sm text-gray-600">{t("agentManagement.description")}</p>
        <Alert
          message={t("agentManagement.whyKeysTitle")}
          description={t("agentManagement.whyKeysDescription")}
          type="info"
          showIcon
          className="mb-3"
        />
        <div className="mt-2 flex items-center gap-4">
          {isAdmin && (
            <Button onClick={handleAddAgent} disabled={!accessToken}>
              {t("agentManagement.addNew")}
            </Button>
          )}
          <Tooltip title={t("agentManagement.healthCheckTooltip")}>
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className={healthCheckEnabled ? "text-green-500" : "text-gray-400"} />
              <span className="text-sm text-gray-600">{t("agentManagement.healthCheck")}</span>
              <Switch
                size="small"
                checked={healthCheckEnabled}
                onChange={handleHealthCheckToggle}
                loading={isLoading && healthCheckEnabled}
              />
            </div>
          </Tooltip>
        </div>
      </div>

      {selectedAgentId ? (
        <AgentInfoView
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
          accessToken={accessToken}
          isAdmin={isAdmin}
        />
      ) : (
        <Card>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("agentManagement.columns.agentName")}</TableHeaderCell>
                  <TableHeaderCell>{t("agentManagement.columns.agentId")}</TableHeaderCell>
                  <TableHeaderCell>{t("agentManagement.columns.spend")}</TableHeaderCell>
                  <TableHeaderCell>{t("agentManagement.columns.model")}</TableHeaderCell>
                  <TableHeaderCell>{t("agentManagement.columns.created")}</TableHeaderCell>
                  <TableHeaderCell>{t("agentManagement.columns.status")}</TableHeaderCell>
                  {isAdmin && <TableHeaderCell>{t("agentManagement.columns.actions")}</TableHeaderCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount}>
                      <Text className="text-center">{t("agentManagement.empty")}</Text>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAgents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell>
                        <Text>{agent.agent_name}</Text>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={agent.agent_id}>
                          <Button
                            size="xs"
                            variant="light"
                            className="font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left overflow-hidden truncate max-w-[200px]"
                            onClick={() => setSelectedAgentId(agent.agent_id)}
                          >
                            {agent.agent_id.slice(0, 7)}...
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Text>{formatNumberWithCommas(agent.spend, 4)}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge size="xs" color="blue">
                          {agent.litellm_params?.model || t("agentManagement.notAvailable")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Text>
                          {agent.created_at
                            ? new Date(agent.created_at).toLocaleDateString(i18n.language)
                            : t("agentManagement.notAvailable")}
                        </Text>
                      </TableCell>
                      <TableCell>
                        {(agent.keys?.length ?? 0) > 0 ? (
                          <Badge color="green">{t("agentManagement.status.active")}</Badge>
                        ) : (
                          <Badge color="yellow">{t("agentManagement.status.needsSetup")}</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <TableIconActionButton
                            variant="Delete"
                            onClick={() => handleDeleteClick(agent.agent_id, agent.agent_name)}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      <AddAgentForm
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        accessToken={accessToken}
        onSuccess={handleSuccess}
        teams={teams}
      />

      {agentToDelete && (
        <Modal
          title={t("agentManagement.delete.title")}
          open={agentToDelete !== null}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmLoading={isDeleting}
          okText={t("common.delete")}
          okButtonProps={{ danger: true }}
        >
          <p>{t("agentManagement.delete.confirm", { name: agentToDelete.name })}</p>
          <p>{t("agentManagement.delete.irreversible")}</p>
        </Modal>
      )}
    </div>
  );
};

export default AgentsPanel;
