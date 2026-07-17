import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import OrganizationsTable from "./organizations";
import OrganizationInfoView from "./organization/organization_view";

const organizationHooks = vi.hoisted(() => ({
  useOrganizations: vi.fn(),
  useOrganization: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: organizationHooks.useOrganizations,
  useOrganization: organizationHooks.useOrganization,
  organizationKeys: {
    all: ["organizations"],
    lists: () => ["organizations", "list"],
    detail: (id: string) => ["organizations", "detail", id],
  },
}));

vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useUserModels: () => ({ data: [] }),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [{ team_id: "team-1", team_alias: "平台团队" }] }),
}));

vi.mock("./networking", () => ({
  organizationCreateCall: vi.fn(),
  organizationDeleteCall: vi.fn(),
  organizationListCall: vi.fn(),
  organizationMemberAddCall: vi.fn(),
  organizationMemberDeleteCall: vi.fn(),
  organizationMemberUpdateCall: vi.fn(),
  organizationUpdateCall: vi.fn(),
}));

vi.mock("./ModelSelect/ModelSelect", () => ({ ModelSelect: () => null }));
vi.mock("./vector_store_management/VectorStoreSelector", () => ({ default: () => null }));
vi.mock("./mcp_server_management/MCPServerSelector", () => ({ default: () => null }));
vi.mock("./object_permissions_view", () => ({ default: () => <div data-testid="object-permissions" /> }));
vi.mock("./molecules/notifications_manager", () => ({
  default: { success: vi.fn(), fromBackend: vi.fn() },
}));

const organization = {
  organization_alias: "模型平台组织",
  organization_id: "org-platform",
  created_at: "2026-07-15T08:00:00Z",
  updated_at: "2026-07-15T09:00:00Z",
  created_by: "admin@example.com",
  spend: 125.5,
  models: ["gpt-4.1"],
  litellm_budget_table: {
    tpm_limit: 1000,
    rpm_limit: 100,
    max_budget: 1000,
    budget_duration: "30d",
    max_parallel_requests: 10,
  },
  object_permission: {},
  members: [
    {
      user_id: "user-1",
      user_email: "member@example.com",
      user_role: "org_admin",
      spend: 12,
      created_at: "2026-07-15T08:30:00Z",
    },
  ],
  teams: [{ team_id: "team-1" }],
  metadata: null,
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("organization management Chinese localization", () => {
  beforeEach(async () => {
    organizationHooks.useOrganizations.mockReturnValue({ data: [organization] });
    organizationHooks.useOrganization.mockReturnValue({ data: organization, isLoading: false });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the organization list, filters, and creation form", async () => {
    const user = userEvent.setup();
    renderWithClient(<OrganizationsTable userRole="Admin" accessToken="test-token" premiumUser lastRefreshed="刚刚" />);

    expect(screen.getByText("我的组织")).toBeInTheDocument();
    expect(screen.getByText("上次刷新：刚刚")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按组织名称搜索")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置筛选" })).toBeInTheDocument();
    expect(screen.getByText("模型平台组织")).toBeInTheDocument();
    expect(screen.getByText("消费（USD）")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ 创建新组织" }));

    expect(screen.getByRole("dialog", { name: "创建组织" })).toBeInTheDocument();
    expect(screen.getByText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.getByText("预算重置周期")).toBeInTheDocument();
    expect(screen.getByText("允许的向量存储")).toBeInTheDocument();
    expect(screen.getByText("允许的 MCP 服务")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
  });

  it("localizes organization overview, members, roles, and settings", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <OrganizationInfoView
        organizationId="org-platform"
        onClose={vi.fn()}
        accessToken="test-token"
        is_org_admin
        is_proxy_admin
        userModels={[]}
        editOrg={false}
      />,
    );

    expect(screen.getByText("组织详情")).toBeInTheDocument();
    expect(screen.getByText("预算状态")).toBeInTheDocument();
    expect(screen.getByText("速率限制")).toBeInTheDocument();
    expect(screen.getByText("平台团队")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制 Organization ID" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "成员" }));

    expect(screen.getAllByText("用户邮箱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("用户 ID").length).toBeGreaterThan(0);
    expect(screen.getByText("组织管理员")).toBeInTheDocument();
    expect(screen.getByText("1 名成员")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加成员/ })).toBeInTheDocument();
    expect(screen.queryByText("Add Member")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(screen.getByText("组织设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.getByText("最高：$1,000.0000")).toBeInTheDocument();
    expect(screen.getAllByText("重置周期：30d").length).toBeGreaterThan(0);
  });

  it("localizes the add-member and edit-member dialogs", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <OrganizationInfoView
        organizationId="org-platform"
        onClose={vi.fn()}
        accessToken="test-token"
        is_org_admin
        is_proxy_admin
        userModels={[]}
        editOrg={false}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(screen.getByRole("button", { name: /添加成员/ }));

    expect(screen.getByRole("dialog", { name: "添加组织成员" })).toBeInTheDocument();
    expect(screen.getByText("成员角色")).toBeInTheDocument();
    expect(screen.getByText("按邮箱搜索")).toBeInTheDocument();
    expect(screen.getByText("按用户 ID 搜索")).toBeInTheDocument();
    await user.click(screen.getByLabelText("成员角色"));
    expect(screen.getAllByText("组织管理员").length).toBeGreaterThan(0);
    expect(screen.getAllByText("内部用户").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "添加组织成员" })).not.toBeInTheDocument();
    });
    await user.click(screen.getByTestId("edit-member"));

    expect(screen.getByText("编辑成员")).toBeInTheDocument();
    expect(screen.getAllByText("邮箱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("用户 ID").length).toBeGreaterThan(0);
    expect(screen.getAllByText("角色").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
  });
});
