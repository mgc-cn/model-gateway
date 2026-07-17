import { useProjectDetails } from "@/app/(dashboard)/hooks/projects/useProjectDetails";
import { useTeam } from "@/app/(dashboard)/hooks/teams/useTeams";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Layout,
  Progress,
  Row,
  Spin,
  Tag,
  theme,
  Typography,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { BarChart } from "@tremor/react";
import { ArrowLeftIcon, DollarSignIcon, EditIcon, KeyIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { EditProjectModal } from "./ProjectModals/EditProjectModal";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { Content } = Layout;

interface TeamInfoShape {
  team_id: string;
  team_alias?: string;
  models?: string[];
  max_budget?: number | null;
  budget_duration?: string | null;
  spend?: number;
  members_with_roles?: { user_id: string; role: string }[];
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US";
  const { data: project, isLoading } = useProjectDetails(projectId);
  const { data: teamData } = useTeam(project?.team_id ?? undefined);
  // teamInfoCall returns { team_id, team_info: {...}, keys, team_memberships }
  const teamInfo: TeamInfoShape | undefined = ((teamData as unknown as { team_info?: TeamInfoShape })?.team_info ??
    teamData) as TeamInfoShape | undefined;
  const { token } = theme.useToken();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const spend = project?.spend ?? 0;
  const maxBudget = project?.litellm_budget_table?.max_budget ?? null;
  const hasLimit = maxBudget != null && maxBudget > 0;
  const spendPercent = hasLimit ? Math.min((spend / maxBudget) * 100, 100) : 0;
  const spendColor = spendPercent >= 90 ? "#f5222d" : spendPercent >= 70 ? "#faad14" : "#52c41a";

  const modelSpendData = useMemo(() => {
    const raw = (project?.model_spend ?? {}) as Record<string, number>;
    return Object.entries(raw)
      .map(([model, value]) => ({ model, spend: value }))
      .sort((a, b) => b.spend - a.spend);
  }, [project?.model_spend]);

  if (isLoading) {
    return (
      <Content
        style={{
          padding: token.paddingLG,
          paddingInline: token.paddingLG * 2,
        }}
      >
        <Flex justify="center" align="center" style={{ minHeight: 300 }}>
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
      </Content>
    );
  }

  if (!project) {
    return (
      <Content
        style={{
          padding: token.paddingLG,
          paddingInline: token.paddingLG * 2,
        }}
      >
        <Button icon={<ArrowLeftIcon size={16} />} onClick={onBack} type="text" style={{ marginBottom: 16 }} />
        <Empty description={t("projectManagement.detail.notFound")} />
      </Content>
    );
  }

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
          <Button icon={<ArrowLeftIcon size={16} />} onClick={onBack} type="text" />
          <div>
            <Flex align="center" gap={8}>
              <Title level={2} style={{ margin: 0 }}>
                {project.project_alias ?? project.project_id}
              </Title>
              <Tag color={project.blocked ? "red" : "green"}>
                {project.blocked ? t("projectManagement.status.blocked") : t("projectManagement.status.active")}
              </Tag>
            </Flex>
            <Text type="secondary">
              ID: <Text copyable>{project.project_id}</Text>
            </Text>
          </div>
        </div>
        <Button type="primary" icon={<EditIcon size={16} />} onClick={() => setIsEditModalVisible(true)}>
          {t("projectManagement.edit")}
        </Button>
      </div>

      {/* Project Details */}
      <Row style={{ marginBottom: 24 }}>
        <Card>
          <Descriptions title={t("projectManagement.detail.title")} column={1}>
            <Descriptions.Item label={t("projectManagement.fields.description")}>
              {project.description || "\u2014"}
            </Descriptions.Item>
            <Descriptions.Item label={t("projectManagement.columns.created")}>
              {new Date(project.created_at).toLocaleString(locale)}
              {project.created_by && (
                <Text>
                  &nbsp;{t("projectManagement.detail.by")}&nbsp;
                  <DefaultProxyAdminTag userId={project.created_by} />
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("projectManagement.detail.lastUpdated")}>
              {new Date(project.updated_at).toLocaleString(locale)}
              {project.updated_by && (
                <Text>
                  &nbsp;{t("projectManagement.detail.by")}&nbsp;
                  <DefaultProxyAdminTag userId={project.updated_by} />
                </Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Row>

      {/* Spend / Budget */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <DollarSignIcon size={16} />
                {t("projectManagement.detail.budget")}
              </Flex>
            }
            style={{ height: "100%" }}
          >
            <Flex vertical gap={16}>
              <div>
                <Text strong style={{ fontSize: 28, lineHeight: 1 }}>
                  ${spend.toFixed(2)}
                </Text>
                <br />
                <Text type="secondary">
                  {hasLimit
                    ? t("projectManagement.detail.ofBudget", { amount: maxBudget.toFixed(2) })
                    : t("projectManagement.detail.noBudgetLimit")}
                </Text>
              </div>
              {hasLimit && (
                <div>
                  <Progress percent={Math.round(spendPercent * 10) / 10} strokeColor={spendColor} showInfo={false} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t("projectManagement.detail.utilized", {
                      percent: (Math.round(spendPercent * 10) / 10).toFixed(1),
                    })}
                  </Text>
                </div>
              )}
            </Flex>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={t("projectManagement.detail.spendByModel")} style={{ height: "100%" }}>
            {modelSpendData.length > 0 ? (
              <BarChart
                data={modelSpendData}
                index="model"
                categories={["spend"]}
                colors={["cyan"]}
                layout="vertical"
                valueFormatter={(value) => `$${value.toFixed(4)}`}
                yAxisWidth={140}
                showLegend={false}
                style={{ height: Math.max(modelSpendData.length * 40, 120) }}
              />
            ) : (
              <Empty description={t("projectManagement.detail.noModelSpend")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Keys & Team */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <KeyIcon size={16} />
                {t("projectManagement.keys.title")}
              </Flex>
            }
            style={{ height: "100%" }}
          >
            <Empty description={t("projectManagement.detail.noKeys")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <UsersIcon size={16} />
                {t("projectManagement.columns.team")}
              </Flex>
            }
            style={{ height: "100%" }}
          >
            {teamInfo ? (
              (() => {
                const teamBudget = teamInfo.max_budget ?? null;
                const teamSpend = teamInfo.spend ?? 0;
                const teamHasLimit = teamBudget != null && teamBudget > 0;
                const teamPercent = teamHasLimit ? Math.min((teamSpend / teamBudget) * 100, 100) : 0;
                const teamColor = teamPercent >= 90 ? "#f5222d" : teamPercent >= 70 ? "#faad14" : "#52c41a";

                return (
                  <Flex vertical gap={12}>
                    {/* Team name + ID */}
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {teamInfo.team_alias || teamInfo.team_id}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ID:{" "}
                        <Text copyable style={{ fontSize: 12 }}>
                          {teamInfo.team_id}
                        </Text>
                      </Text>
                    </div>

                    {/* Models */}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                        {t("projectManagement.columns.models")}
                      </Text>
                      {(teamInfo.models?.length ?? 0) > 0 ? (
                        <Flex wrap="wrap" gap={4} style={{ maxHeight: 60, overflow: "hidden" }}>
                          {teamInfo.models?.map((m: string) => (
                            <Tag key={m} style={{ margin: 0 }}>
                              {m}
                            </Tag>
                          ))}
                        </Flex>
                      ) : (
                        <Text type="secondary">{t("projectManagement.detail.allModels")}</Text>
                      )}
                    </div>

                    {/* Budget + Spend compact */}
                    <div>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 2 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t("projectManagement.detail.spend")}
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                          ${teamSpend.toFixed(2)}
                          {teamHasLimit ? (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              / ${teamBudget.toFixed(2)}
                            </Text>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              ({t("projectManagement.detail.unlimited")})
                            </Text>
                          )}
                        </Text>
                      </Flex>
                      {teamHasLimit && (
                        <Progress
                          percent={Math.round(teamPercent * 10) / 10}
                          strokeColor={teamColor}
                          size="small"
                          showInfo={false}
                        />
                      )}
                    </div>

                    {/* Members */}
                    <Flex justify="space-between">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t("projectManagement.detail.members")}
                      </Text>
                      <Text style={{ fontSize: 12 }}>{teamInfo.members_with_roles?.length ?? 0}</Text>
                    </Flex>
                  </Flex>
                );
              })()
            ) : project.team_id ? (
              <Flex justify="center" align="center" style={{ padding: 16 }}>
                <Spin indicator={<LoadingOutlined spin />} size="small" />
              </Flex>
            ) : (
              <Empty description={t("projectManagement.detail.noTeam")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <EditProjectModal isOpen={isEditModalVisible} project={project} onClose={() => setIsEditModalVisible(false)} />
    </Content>
  );
}
