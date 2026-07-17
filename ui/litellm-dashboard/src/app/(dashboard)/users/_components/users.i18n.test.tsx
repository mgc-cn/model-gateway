import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { CreateUserButton } from "@/components/CreateUserButton";
import BulkCreateUsersButton from "@/components/bulk_create_users_button";
import BulkEditUserModal from "./BulkEditUsers";
import DefaultUserSettings from "./DefaultUserSettings";

const mocks = vi.hoisted(() => ({
  getInternalUserSettings: vi.fn(),
  modelAvailableCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getInternalUserSettings: mocks.getInternalUserSettings,
  updateInternalUserSettings: vi.fn(),
  modelAvailableCall: mocks.modelAvailableCall,
  getProxyUISettings: vi.fn().mockResolvedValue({ SSO_ENABLED: false }),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
  invitationCreateCall: vi.fn(),
  userCreateCall: vi.fn(),
  userBulkUpdateUserCall: vi.fn(),
  teamBulkMemberAddCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: () => ({ data: [] }),
}));

vi.mock("@/components/common_components/team_dropdown", () => ({
  default: () => <div data-testid="team-dropdown" />,
}));

vi.mock("./user_edit_view", () => ({
  UserEditView: () => <div data-testid="user-edit-view" />,
}));

vi.mock("@/components/molecules/notifications_manager", () => ({
  default: { info: vi.fn(), success: vi.fn(), fromBackend: vi.fn() },
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const roles = {
  internal_user_admin: { ui_label: "Internal User Admin", description: "Full access" },
  internal_user_viewer: { ui_label: "Internal Viewer", description: "Read-only access" },
};

describe("user management Chinese localization", () => {
  beforeEach(async () => {
    mocks.modelAvailableCall.mockResolvedValue({ data: [{ id: "gpt-4.1" }] });
    mocks.getInternalUserSettings.mockResolvedValue({
      values: { user_role: "internal_user_admin", max_budget: 100, teams: [] },
      field_schema: {
        description: "Default user settings",
        properties: {
          user_role: { type: "string", description: "User role" },
          max_budget: { type: "number", description: "Maximum budget" },
          teams: { type: "array", description: "Teams" },
        },
      },
    });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the invite form and its supporting actions", async () => {
    const user = userEvent.setup();
    renderWithClient(<CreateUserButton userID="admin-user" accessToken="token" teams={[]} possibleUIRoles={roles} />);

    expect(screen.getByRole("button", { name: "+ 邀请用户" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 批量邀请用户" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ 邀请用户" }));
    const dialog = screen.getByRole("dialog", { name: "邀请用户" });
    expect(within(dialog).getByText("创建可拥有密钥的用户")).toBeInTheDocument();
    expect(within(dialog).getByText("邮件邀请")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("用户邮箱")).toBeInTheDocument();
    expect(within(dialog).getByText("个人密钥创建设置")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("combobox", { name: /全局网关角色/ }));
    expect(screen.getByText("内部用户管理员")).toBeInTheDocument();
  });

  it("localizes the complete bulk CSV entry screen", async () => {
    const user = userEvent.setup();
    renderWithClient(<BulkCreateUsersButton accessToken="token" teams={[]} possibleUIRoles={roles} />);

    await user.click(screen.getByRole("button", { name: /批量邀请用户/ }));
    const dialog = screen.getByRole("dialog", { name: "批量邀请用户" });
    expect(within(dialog).getByText("下载并填写模板")).toBeInTheDocument();
    expect(within(dialog).getByText("上传填写完成的 CSV")).toBeInTheDocument();
    expect(within(dialog).getByText("模板列名")).toBeInTheDocument();
    expect(within(dialog).getByText("user_email")).toBeInTheDocument();
    expect(within(dialog).getByText("将 CSV 文件拖放到此处")).toBeInTheDocument();
  });

  it("localizes bulk editing and team management", () => {
    renderWithClient(
      <BulkEditUserModal
        open
        onCancel={vi.fn()}
        selectedUsers={[
          { user_id: "user-1", user_email: "user@example.com", user_role: "internal_user_admin", max_budget: null },
        ]}
        possibleUIRoles={roles}
        accessToken="token"
        onSuccess={vi.fn()}
        teams={[{ team_id: "team-1", team_alias: "平台团队" }]}
        userRole="Admin"
        userModels={["gpt-4.1"]}
        allowAllUsers
      />,
    );

    expect(screen.getByText("批量编辑 1 名用户")).toBeInTheDocument();
    expect(screen.getByText("已选用户（1）：")).toBeInTheDocument();
    expect(screen.getByText("操作说明：")).toBeInTheDocument();
    expect(screen.getByText("团队管理")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "将选中用户添加到团队" })).toBeInTheDocument();
  });

  it("localizes default settings and dynamic schema fields", async () => {
    renderWithClient(
      <DefaultUserSettings accessToken="token" userID="admin-user" userRole="Admin" possibleUIRoles={roles} />,
    );

    await waitFor(() => expect(screen.getByText("默认用户设置")).toBeInTheDocument());
    expect(screen.getByText("应用于新建内部用户的默认设置。")).toBeInTheDocument();
    expect(screen.getByText("用户角色")).toBeInTheDocument();
    expect(screen.getByText("新用户默认分配的角色。")).toBeInTheDocument();
    expect(screen.getByText("最大预算")).toBeInTheDocument();
    expect(screen.getByText("未分配团队")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
  });
});
