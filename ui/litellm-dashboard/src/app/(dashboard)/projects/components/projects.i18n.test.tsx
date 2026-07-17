import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { ProjectsPage } from "./ProjectsPage";
import { ProjectDetail } from "./ProjectDetailsPage";
import { ProjectKeysTable } from "./ProjectKeysTable";

const project = {
  project_id: "proj-1",
  project_alias: "内部模型平台",
  description: "统一管理模型调用",
  team_id: "team-1",
  budget_id: null,
  metadata: null,
  models: ["gpt-4.1"],
  spend: 12.5,
  model_spend: null,
  model_rpm_limit: null,
  model_tpm_limit: null,
  blocked: false,
  object_permission_id: null,
  created_at: "2026-07-15T08:00:00Z",
  created_by: "user-1",
  updated_at: "2026-07-15T09:00:00Z",
  updated_by: "user-2",
  litellm_budget_table: null,
};

vi.mock("@/app/(dashboard)/hooks/projects/useProjects", () => ({
  useProjects: () => ({ data: [project], isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/projects/useProjectDetails", () => ({
  useProjectDetails: () => ({ data: project, isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [{ team_id: "team-1", team_alias: "平台团队", models: ["gpt-4.1"] }], isLoading: false }),
  useTeam: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/projects/useCreateProject", () => ({
  useCreateProject: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/projects/useUpdateProject", () => ({
  useUpdateProject: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/networking", () => ({
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
}));

vi.mock("@/components/organisms/create_key_button", () => ({
  fetchTeamModels: vi.fn().mockResolvedValue(["gpt-4.1"]),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("project management Chinese localization", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the project list and complete creation form", async () => {
    const user = userEvent.setup();
    renderWithClient(<ProjectsPage />);

    expect(screen.getByRole("heading", { name: "项目" })).toBeInTheDocument();
    expect(screen.getByText("管理团队内的项目")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、ID、描述或团队搜索项目...")).toBeInTheDocument();
    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.getByText("正常")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /创建项目/ }));
    expect(screen.getByRole("dialog", { name: "创建新项目" })).toBeInTheDocument();
    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    expect(screen.getByText("允许的模型（限定为所选团队的模型）")).toBeInTheDocument();
    expect(screen.getByText("高级设置")).toBeInTheDocument();
  });

  it("localizes project details, budget, model spend, keys, and team states", () => {
    renderWithClient(<ProjectDetail projectId="proj-1" onBack={vi.fn()} />);

    expect(screen.getByText("项目详情")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByText("最后更新")).toBeInTheDocument();
    expect(screen.getByText("预算")).toBeInTheDocument();
    expect(screen.getByText("无预算限制")).toBeInTheDocument();
    expect(screen.getByText("按模型统计消费")).toBeInTheDocument();
    expect(screen.getByText("暂无模型消费记录")).toBeInTheDocument();
    expect(screen.getByText("没有可显示的密钥")).toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /编辑项目/ })).toBeInTheDocument();
  });

  it("localizes the project key table and empty state", () => {
    renderWithClient(<ProjectKeysTable keys={[]} />);

    expect(screen.getByText("密钥名称")).toBeInTheDocument();
    expect(screen.getByText("所有者")).toBeInTheDocument();
    expect(screen.getByText("最后活动时间")).toBeInTheDocument();
    expect(screen.getByText("未找到密钥")).toBeInTheDocument();
  });
});
