import { useAccessGroupDetails } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroupDetails";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Layout,
  List,
  Row,
  Spin,
  Tabs,
  Tag,
  theme,
  Typography,
} from "antd";
import { ArrowLeftIcon, BotIcon, EditIcon, KeyIcon, LayersIcon, ServerIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { AccessGroupEditModal } from "./AccessGroupsModal/AccessGroupEditModal";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { Content } = Layout;

interface AccessGroupDetailProps {
  accessGroupId: string;
  onBack: () => void;
}

export function AccessGroupDetail({ accessGroupId, onBack }: AccessGroupDetailProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US";
  const { data: accessGroup, isLoading } = useAccessGroupDetails(accessGroupId);
  const { token } = theme.useToken();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showAllKeys, setShowAllKeys] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);

  const MAX_PREVIEW = 5;

  if (isLoading) {
    return (
      <Content
        style={{
          padding: token.paddingLG,
          paddingInline: token.paddingLG * 2,
        }}
      >
        <Flex justify="center" align="center" style={{ minHeight: 300 }}>
          <Spin size="large" />
        </Flex>
      </Content>
    );
  }

  if (!accessGroup) {
    return (
      <Content
        style={{
          padding: token.paddingLG,
          paddingInline: token.paddingLG * 2,
        }}
      >
        <Button
          icon={<ArrowLeftIcon size={16} />}
          onClick={onBack}
          type="text"
          style={{ marginBottom: 16 }}
          aria-label={t("accessGroupManagement.actions.back")}
        />
        <Empty description={t("accessGroupManagement.detail.notFound")} />
      </Content>
    );
  }

  const modelIds = accessGroup.access_model_names ?? [];
  const mcpServerIds = accessGroup.access_mcp_server_ids ?? [];
  const agentIds = accessGroup.access_agent_ids ?? [];
  const keyIds = accessGroup.assigned_key_ids ?? [];
  const teamIds = accessGroup.assigned_team_ids ?? [];

  const displayedKeys = showAllKeys ? keyIds : keyIds.slice(0, MAX_PREVIEW);
  const displayedTeams = showAllTeams ? teamIds : teamIds.slice(0, MAX_PREVIEW);

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const tabItems = [
    {
      key: "models",
      label: (
        <Flex align="center" gap={8}>
          <LayersIcon size={16} />
          {t("accessGroupManagement.tabs.models")}
          <Tag style={{ marginInlineEnd: 0 }}>{modelIds?.length}</Tag>
        </Flex>
      ),
      children:
        modelIds?.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={modelIds}
            renderItem={(id) => (
              <List.Item>
                <Card size="small">
                  <Text code>{id}</Text>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t("accessGroupManagement.detail.noModels")} />
        ),
    },
    {
      key: "mcp",
      label: (
        <Flex align="center" gap={8}>
          <ServerIcon size={16} />
          {t("accessGroupManagement.tabs.mcpServers")}
          <Tag>{mcpServerIds?.length}</Tag>
        </Flex>
      ),
      children:
        mcpServerIds?.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={mcpServerIds}
            renderItem={(id) => (
              <List.Item>
                <Card size="small">
                  <Text code>{id}</Text>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t("accessGroupManagement.detail.noMcpServers")} />
        ),
    },
    {
      key: "agents",
      label: (
        <Flex align="center" gap={8}>
          <BotIcon size={16} />
          {t("accessGroupManagement.tabs.agents")}
          <Tag>{agentIds?.length}</Tag>
        </Flex>
      ),
      children:
        agentIds?.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={agentIds}
            renderItem={(id) => (
              <List.Item>
                <Card size="small">
                  <Text code>{id}</Text>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t("accessGroupManagement.detail.noAgents")} />
        ),
    },
  ];

  return (
    <Content style={{ padding: token.paddingLG, paddingInline: token.paddingLG * 2 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftIcon size={16} />}
            onClick={onBack}
            type="text"
            aria-label={t("accessGroupManagement.actions.back")}
          />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {accessGroup.access_group_name}
            </Title>
            <Text type="secondary">
              {t("accessGroupManagement.detail.idLabel")} <Text copyable>{accessGroup.access_group_id}</Text>
            </Text>
          </div>
        </div>
        <Button type="primary" icon={<EditIcon size={16} />} onClick={handleEdit}>
          {t("accessGroupManagement.edit")}
        </Button>
      </div>

      {/* Group Details */}
      <Row style={{ marginBottom: 24 }}>
        <Card>
          <Descriptions title={t("accessGroupManagement.detail.groupDetails")} column={1}>
            <Descriptions.Item label={t("accessGroupManagement.fields.description")}>
              {accessGroup.description || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("accessGroupManagement.fields.created")}>
              {new Date(accessGroup.created_at).toLocaleString(locale)}
              {accessGroup.created_by && (
                <Text>
                  &nbsp;{t("accessGroupManagement.detail.by")}&nbsp;
                  <DefaultProxyAdminTag userId={accessGroup.created_by} />
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("accessGroupManagement.fields.lastUpdated")}>
              {new Date(accessGroup.updated_at).toLocaleString(locale)}
              {accessGroup.updated_by && (
                <Text>
                  &nbsp;{t("accessGroupManagement.detail.by")}&nbsp;
                  <DefaultProxyAdminTag userId={accessGroup.updated_by} />
                </Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Row>

      {/* Attached Keys & Teams */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <KeyIcon size={16} />
                {t("accessGroupManagement.detail.attachedKeys")}
                <Tag>{keyIds?.length}</Tag>
              </Flex>
            }
            extra={
              keyIds?.length > MAX_PREVIEW ? (
                <Button type="link" onClick={() => setShowAllKeys(!showAllKeys)}>
                  {showAllKeys
                    ? t("accessGroupManagement.actions.showLess")
                    : t("accessGroupManagement.actions.viewAll", { count: keyIds.length })}
                </Button>
              ) : null
            }
          >
            {keyIds?.length > 0 ? (
              <Flex wrap="wrap" gap={8}>
                {displayedKeys.map((id) => (
                  <Tag key={id}>
                    <Text code style={{ fontSize: 12 }}>
                      {id.length > 20 ? `${id.slice(0, 10)}...${id.slice(-6)}` : id}
                    </Text>
                  </Tag>
                ))}
              </Flex>
            ) : (
              <Empty description={t("accessGroupManagement.detail.noKeys")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <UsersIcon size={16} />
                {t("accessGroupManagement.detail.attachedTeams")}
                <Tag>{teamIds?.length}</Tag>
              </Flex>
            }
            extra={
              teamIds?.length > MAX_PREVIEW ? (
                <Button type="link" onClick={() => setShowAllTeams(!showAllTeams)}>
                  {showAllTeams
                    ? t("accessGroupManagement.actions.showLess")
                    : t("accessGroupManagement.actions.viewAll", { count: teamIds.length })}
                </Button>
              ) : null
            }
          >
            {teamIds?.length > 0 ? (
              <Flex wrap="wrap" gap={8}>
                {displayedTeams.map((id) => (
                  <Tag key={id}>
                    <Text code style={{ fontSize: 12 }}>
                      {id}
                    </Text>
                  </Tag>
                ))}
              </Flex>
            ) : (
              <Empty description={t("accessGroupManagement.detail.noTeams")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Resources Tabs */}
      <Card>
        <Tabs defaultActiveKey="models" items={tabItems} />
      </Card>

      {/* Edit Modal */}
      <AccessGroupEditModal
        visible={isEditModalVisible}
        accessGroup={accessGroup}
        onCancel={() => setIsEditModalVisible(false)}
      />
    </Content>
  );
}
