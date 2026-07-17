import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { AccessGroupsPage } from "./AccessGroupsPage";
import { AccessGroupDetail } from "./AccessGroupsDetailsPage";

const hookMocks = vi.hoisted(() => ({
  useAccessGroups: vi.fn(),
  useAccessGroupDetails: vi.fn(),
  deleteMutate: vi.fn(),
  createMutate: vi.fn(),
  editMutate: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ userRole: "Admin", accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: hookMocks.useAccessGroups,
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroupDetails", () => ({
  useAccessGroupDetails: hookMocks.useAccessGroupDetails,
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useDeleteAccessGroup", () => ({
  useDeleteAccessGroup: () => ({ mutate: hookMocks.deleteMutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useCreateAccessGroup", () => ({
  useCreateAccessGroup: () => ({ mutate: hookMocks.createMutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useEditAccessGroup", () => ({
  useEditAccessGroup: () => ({ mutate: hookMocks.editMutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/agents/useAgents", () => ({
  useAgents: () => ({ data: { agents: [{ agent_id: "agent-1", agent_name: "内部助手" }] } }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [{ server_id: "mcp-1", server_name: "内部 MCP" }] }),
}));

vi.mock("@/components/ModelSelect/ModelSelect", () => ({
  ModelSelect: () => <div data-testid="model-select" />,
}));

vi.mock("@/components/molecules/message_manager", () => ({
  default: { success: vi.fn() },
}));

const accessGroup = {
  access_group_id: "ag-platform",
  access_group_name: "平台研发组",
  description: "负责内部模型平台",
  access_model_names: ["gpt-4.1"],
  access_mcp_server_ids: ["mcp-1"],
  access_agent_ids: ["agent-1"],
  assigned_team_ids: ["team-platform"],
  assigned_key_ids: ["key-platform"],
  created_at: "2026-07-15T08:00:00Z",
  created_by: null,
  updated_at: "2026-07-15T09:00:00Z",
  updated_by: null,
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("access group Chinese localization", () => {
  beforeEach(async () => {
    hookMocks.useAccessGroups.mockReturnValue({ data: [accessGroup], isLoading: false });
    hookMocks.useAccessGroupDetails.mockReturnValue({ data: accessGroup, isLoading: false });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the list, deletion confirmation, and creation form", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccessGroupsPage />);

    expect(screen.getByRole("heading", { name: "访问组" })).toBeInTheDocument();
    expect(screen.getByText("管理组织内的资源访问权限")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、ID 或描述搜索访问组...")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "资源" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByText("共 1 个访问组")).toBeInTheDocument();
    expect(screen.getByText("平台研发组")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /创建访问组/ }));
    const createDialog = screen.getByRole("dialog", { name: "创建访问组" });

    expect(within(createDialog).getByRole("tab", { name: /基本信息/ })).toBeInTheDocument();
    expect(within(createDialog).getByText("访问组名称")).toBeInTheDocument();
    expect(within(createDialog).getByPlaceholderText("例如 工程团队")).toBeInTheDocument();
    expect(within(createDialog).getByText("描述")).toBeInTheDocument();
    expect(within(createDialog).getByPlaceholderText("描述此访问组的用途...")).toBeInTheDocument();

    await user.click(within(createDialog).getByRole("tab", { name: /MCP 服务/ }));
    expect(within(createDialog).getByText("允许的 MCP 服务")).toBeInTheDocument();
    expect(within(createDialog).getByText("选择 MCP 服务")).toBeInTheDocument();

    await user.click(within(createDialog).getByRole("button", { name: /取\s*消/ }));
    await user.click(screen.getByTestId("delete-access-group"));

    const deleteDialog = screen.getByRole("dialog", { name: "删除访问组" });
    expect(within(deleteDialog).getByText("确定要删除此访问组吗？此操作无法撤销。")).toBeInTheDocument();
    expect(within(deleteDialog).getByText("访问组信息")).toBeInTheDocument();
    expect(within(deleteDialog).getByText("名称")).toBeInTheDocument();
    expect(within(deleteDialog).getByText("描述")).toBeInTheDocument();
  });

  it("localizes details, resources, empty states, and the edit form", async () => {
    const user = userEvent.setup();
    renderWithClient(<AccessGroupDetail accessGroupId="ag-platform" onBack={vi.fn()} />);

    expect(screen.getByText("访问组详情")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("最后更新时间")).toBeInTheDocument();
    expect(screen.getByText("关联密钥")).toBeInTheDocument();
    expect(screen.getByText("关联团队")).toBeInTheDocument();
    expect(screen.getByText("key-platform")).toBeInTheDocument();
    expect(screen.getByText("team-platform")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /模型/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /MCP 服务/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /智能体/ })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /MCP 服务/ }));
    expect(screen.getByText("mcp-1")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /智能体/ }));
    expect(screen.getByText("agent-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /编辑访问组/ }));
    const editDialog = screen.getByRole("dialog", { name: "编辑访问组" });
    expect(within(editDialog).getByText("基本信息")).toBeInTheDocument();
    expect(within(editDialog).getByText("访问组名称")).toBeInTheDocument();
    expect(within(editDialog).getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(within(editDialog).getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
  });
});
