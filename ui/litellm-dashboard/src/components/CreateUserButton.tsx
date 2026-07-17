import { InfoCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { Accordion, AccordionBody, AccordionHeader, SelectItem, TextInput } from "@tremor/react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Select as Select2,
  Space,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedUserRole } from "@/utils/roles";
import BulkCreateUsers from "./bulk_create_users_button";
import TeamDropdown from "./common_components/team_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import NotificationsManager from "./molecules/notifications_manager";
import {
  getProxyBaseUrl,
  getProxyUISettings,
  invitationCreateCall,
  modelAvailableCall,
  userCreateCall,
} from "./networking";
import OnboardingModal, { InvitationLink } from "./onboarding_link";
const { Option } = Select;
const { Text, Link, Title } = Typography;
// Helper function to generate UUID compatible across all environments
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface CreateuserProps {
  userID: string;
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUserCreated?: (userId: string) => void;
  isEmbedded?: boolean;
}

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

export const CreateUserButton: React.FC<CreateuserProps> = ({
  userID,
  accessToken,
  teams,
  possibleUIRoles,
  onUserCreated,
  isEmbedded = false,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiuser, setApiuser] = useState<boolean>(false);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [isInvitationLinkModalVisible, setIsInvitationLinkModalVisible] = useState(false);
  const [invitationLinkData, setInvitationLinkData] = useState<InvitationLink | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const { data: organizations = [] } = useOrganizations();

  // Derive teams from the user's organizations, falling back to the teams prop
  const availableTeams = useMemo(() => {
    const orgTeams = organizations.flatMap((org) => org.teams || []);
    if (orgTeams.length > 0) return orgTeams;
    return teams || [];
  }, [organizations, teams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = "any";
        const modelDataResponse = await modelAvailableCall(accessToken, userID, userRole);
        const availableModels = [];
        for (let i = 0; i < modelDataResponse.data.length; i++) {
          const model = modelDataResponse.data[i];
          availableModels.push(model.id);
        }
        setUserModels(availableModels);
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching model data:", error);
      }
    };

    setBaseUrl(getProxyBaseUrl());
    fetchData();
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setApiuser(false);
    form.resetFields();
  };

  const handleCreate = async (formValues: {
    user_id: string;
    models?: string[];
    user_role: string;
    organization_ids?: string[];
    organizations?: string[];
    send_invite_email?: boolean;
  }) => {
    try {
      NotificationsManager.info(t("userManagement.notifications.creating"));
      if (!isEmbedded) {
        setIsModalVisible(true);
      }
      if ((!formValues.models || formValues.models.length === 0) && formValues.user_role !== "proxy_admin") {
        formValues.models = ["no-default-models"];
      }
      if (formValues.organization_ids) {
        formValues.organizations = formValues.organization_ids;
        delete formValues.organization_ids;
      }
      const response = await userCreateCall(accessToken, null, formValues);
      await queryClient.invalidateQueries({ queryKey: ["userList"] });
      setApiuser(true);
      const user_id = response.data?.user_id || response.user_id;

      if (onUserCreated && isEmbedded) {
        onUserCreated(user_id);
        form.resetFields();
        return;
      }

      if (!uiSettings?.SSO_ENABLED) {
        invitationCreateCall(accessToken, user_id).then((data) => {
          data.has_user_setup_sso = false;
          setInvitationLinkData(data);
          setIsInvitationLinkModalVisible(true);
        });
      } else {
        // create an InvitationLink Object for this user for the SSO flow
        // for SSO the invite link is the proxy base url since the User just needs to login
        const invitationLink: InvitationLink = {
          id: generateUUID(), // Generate a unique ID
          user_id: user_id,
          is_accepted: false,
          accepted_at: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set expiry to 7 days from now
          created_at: new Date(),
          created_by: userID, // Assuming userID is the current user creating the invitation
          updated_at: new Date(),
          updated_by: userID,
          has_user_setup_sso: true,
        };
        setInvitationLinkData(invitationLink);
        setIsInvitationLinkModalVisible(true);
      }

      NotificationsManager.success(t("userManagement.notifications.created"));
      form.resetFields();
      localStorage.removeItem("userData" + userID);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error?.message || t("userManagement.notifications.createFailed");
      NotificationsManager.fromBackend(errorMessage);
      console.error("Error creating the user:", error);
    }
  };

  // Modify the return statement to handle embedded mode
  if (isEmbedded) {
    return (
      <Form
        form={form}
        onFinish={handleCreate}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        initialValues={{ user_role: "internal_user_viewer", send_invite_email: true }}
      >
        <Alert
          message={t("userManagement.invite.emailInvitations")}
          description={
            <>
              {t("userManagement.invite.emailDescription")}{" "}
              <Link href="https://docs.litellm.ai/docs/proxy/email" target="_blank">
                {t("userManagement.invite.emailSetupLink")}
              </Link>
            </>
          }
          type="info"
          showIcon
          className="mb-4"
        />
        <Form.Item label={t("userManagement.form.userEmail")} name="user_email">
          <TextInput placeholder="" />
        </Form.Item>
        <Form.Item label={t("userManagement.form.userRole")} name="user_role">
          <Select2>
            {possibleUIRoles &&
              Object.keys(possibleUIRoles).map((role) => {
                const localizedRole = getLocalizedUserRole(role, possibleUIRoles, t);
                return (
                  <SelectItem key={role} value={role} title={localizedRole.label}>
                    <div className="flex">
                      {localizedRole.label}{" "}
                      <Text className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                        {localizedRole.description}
                      </Text>
                    </div>
                  </SelectItem>
                );
              })}
          </Select2>
        </Form.Item>
        <Form.Item label={t("userManagement.team.team")} name="team_id">
          <TeamDropdown />
        </Form.Item>

        <Form.Item label={t("userManagement.form.metadata")} name="metadata">
          <Input.TextArea rows={4} placeholder={t("userManagement.form.metadataPlaceholder")} />
        </Form.Item>

        <Form.Item label={t("userManagement.invite.sendEmail")} name="send_invite_email" valuePropName="checked">
          <Checkbox />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button htmlType="submit">{t("userManagement.invite.createUser")}</Button>
        </div>
      </Form>
    );
  }

  // Original return for standalone mode
  return (
    <div className="flex gap-2">
      <Button type="primary" className="mb-0" onClick={() => setIsModalVisible(true)}>
        + {t("userManagement.invite.inviteUser")}
      </Button>
      <BulkCreateUsers accessToken={accessToken} teams={teams} possibleUIRoles={possibleUIRoles} />
      <Modal
        title={t("userManagement.invite.inviteUser")}
        open={isModalVisible}
        width={800}
        footer={null}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Space direction="vertical" size="middle">
          <Text className="mb-1">{t("userManagement.invite.description")}</Text>
          <Alert
            message={t("userManagement.invite.emailInvitations")}
            description={
              <>
                {t("userManagement.invite.emailDescription")}{" "}
                <Link href="https://docs.litellm.ai/docs/proxy/email" target="_blank">
                  {t("userManagement.invite.emailSetupLink")}
                </Link>
              </>
            }
            type="info"
            showIcon
            className="mb-4"
          />
        </Space>
        <Form
          form={form}
          onFinish={handleCreate}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          initialValues={{ user_role: "internal_user_viewer", send_invite_email: true }}
        >
          <Form.Item label={t("userManagement.form.userEmail")} name="user_email">
            <Input />
          </Form.Item>
          <Form.Item
            label={
              <span>
                {t("userManagement.fields.globalRole")}{" "}
                <Tooltip title={t("userManagement.invite.globalRoleHelp")}>
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            name="user_role"
          >
            <Select2>
              {possibleUIRoles &&
                Object.keys(possibleUIRoles).map((role) => {
                  const localizedRole = getLocalizedUserRole(role, possibleUIRoles, t);
                  return (
                    <SelectItem key={role} value={role} title={localizedRole.label}>
                      <Text>{localizedRole.label}</Text>
                      <Text type="secondary">
                        {" - "}
                        {localizedRole.description}
                      </Text>
                    </SelectItem>
                  );
                })}
            </Select2>
          </Form.Item>

          <Form.Item
            label={t("userManagement.team.team")}
            className="gap-2"
            name="team_id"
            help={t("userManagement.invite.teamHelp")}
          >
            <TeamDropdown />
          </Form.Item>

          <Form.Item
            label={t("userManagement.invite.organization")}
            name="organization_ids"
            help={t("userManagement.invite.organizationHelp")}
          >
            <Select
              mode="multiple"
              placeholder={t("userManagement.invite.selectOrganization")}
              style={{ width: "100%" }}
            >
              {organizations.map((org) => (
                <Option key={org.organization_id} value={org.organization_id}>
                  {org.organization_alias} ({org.organization_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={t("userManagement.form.metadata")} name="metadata">
            <Input.TextArea rows={4} placeholder={t("userManagement.form.metadataPlaceholder")} />
          </Form.Item>
          <Form.Item label={t("userManagement.invite.sendEmail")} name="send_invite_email" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Accordion>
            <AccordionHeader>
              <Text strong>{t("userManagement.invite.personalKeyCreation")}</Text>
            </AccordionHeader>
            <AccordionBody>
              <Form.Item
                className="gap-2"
                label={
                  <span>
                    {t("userManagement.invite.models")}{" "}
                    <Tooltip title={t("userManagement.invite.modelsHelp")}>
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="models"
                help={t("userManagement.invite.modelsHelp")}
              >
                <Select2 mode="multiple" placeholder={t("userManagement.form.selectModels")} style={{ width: "100%" }}>
                  <Select2.Option key="all-proxy-models" value="all-proxy-models">
                    {t("userManagement.form.allProxyModels")}
                  </Select2.Option>
                  <Select2.Option key="no-default-models" value="no-default-models">
                    {t("userManagement.form.noDefaultModels")}
                  </Select2.Option>
                  {userModels.map((model) => (
                    <Select2.Option key={model} value={model}>
                      {getModelDisplayName(model)}
                    </Select2.Option>
                  ))}
                </Select2>
              </Form.Item>
            </AccordionBody>
          </Accordion>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button type="primary" icon={<UserAddOutlined />} htmlType="submit">
              {t("userManagement.invite.inviteUser")}
            </Button>
          </div>
        </Form>
      </Modal>
      {apiuser && (
        <OnboardingModal
          isInvitationLinkModalVisible={isInvitationLinkModalVisible}
          setIsInvitationLinkModalVisible={setIsInvitationLinkModalVisible}
          baseUrl={baseUrl || ""}
          invitationLinkData={invitationLinkData}
        />
      )}
    </div>
  );
};
