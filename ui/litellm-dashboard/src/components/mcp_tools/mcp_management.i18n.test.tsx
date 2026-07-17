import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import MCPServerCard from "./MCPServerCard";
import MCPNetworkSettings from "./MCPNetworkSettings";
import MCPSemanticFilterSettings from "../Settings/AdminSettings/MCPSemanticFilterSettings/MCPSemanticFilterSettings";
import { MCPToolsetsTab } from "./MCPToolsetsTab";
import MCPConnect from "./mcp_connect";
import { MCPSubmissionsTab } from "./MCPSubmissionsTab";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../networking", () => ({
  getGeneralSettingsCall: vi.fn().mockResolvedValue([]),
  updateConfigFieldSetting: vi.fn().mockResolvedValue(undefined),
  deleteConfigFieldSetting: vi.fn().mockResolvedValue(undefined),
  fetchMCPClientIp: vi.fn().mockResolvedValue("203.0.113.45"),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
  createMCPToolset: vi.fn(),
  updateMCPToolset: vi.fn(),
  deleteMCPToolset: vi.fn(),
  listMCPTools: vi.fn().mockResolvedValue([]),
  fetchMCPSubmissions: vi.fn().mockResolvedValue({
    total: 0,
    pending_review: 0,
    active: 0,
    rejected: 0,
    items: [],
  }),
  approveMCPServer: vi.fn(),
  rejectMCPServer: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({
  useMCPToolsets: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [] }),
}));

vi.mock("../view_logs/table", () => ({
  DataTable: ({ columns, noDataMessage }: { columns: Array<{ header?: React.ReactNode }>; noDataMessage: string }) => (
    <div>
      {columns.map((column, index) => (
        <span key={index}>{column.header}</span>
      ))}
      <span>{noDataMessage}</span>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useMCPSemanticFilterSettings", () => ({
  useMCPSemanticFilterSettings: () => ({
    data: {
      values: { enabled: false, embedding_model: "text-embedding-3-small", top_k: 10, similarity_threshold: 0.3 },
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useUpdateMCPSemanticFilterSettings", () => ({
  useUpdateMCPSemanticFilterSettings: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("../Settings/AdminSettings/MCPSemanticFilterSettings/MCPSemanticFilterTestPanel", () => ({
  default: () => <div data-testid="semantic-filter-test-panel" />,
}));

describe("MCP management Chinese localization", () => {
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

  it("localizes server card states and actions", () => {
    render(
      <MCPServerCard
        server={{
          server_id: "server-1",
          server_name: "内部检索服务",
          transport: "http",
          auth_type: "none",
          status: "healthy",
          available_on_public_internet: false,
        }}
        missingUserFields={["API_KEY"]}
        onClick={vi.fn()}
        onOpenFillFields={vi.fn()}
        onRecheckHealth={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByText("内部检索服务").length).toBeGreaterThan(0);
    expect(screen.getByText("健康")).toBeInTheDocument();
    expect(screen.getAllByText("内部").length).toBeGreaterThan(0);
    expect(screen.getByText("缺少 1 个用户字段")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "填写" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "服务操作" })).toBeInTheDocument();
  });

  it("localizes network settings", async () => {
    render(<MCPNetworkSettings accessToken="token" />);

    expect(await screen.findByText("私有 IP 网段")).toBeInTheDocument();
    expect(screen.getByText(/当前 IP/)).toBeInTheDocument();
    expect(screen.getByText("私有网络网段")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存/ })).toBeInTheDocument();
  });

  it("localizes semantic filter settings", async () => {
    render(<MCPSemanticFilterSettings accessToken="token" />);

    await waitFor(() => expect(screen.getByText("工具语义筛选")).toBeInTheDocument());
    expect(screen.getByText("启用语义筛选")).toBeInTheDocument();
    expect(screen.getByText("嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("返回结果数")).toBeInTheDocument();
    expect(screen.getByText("相似度阈值")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存设置/ })).toBeInTheDocument();
  });

  it("localizes the toolsets page and empty table", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MCPToolsetsTab accessToken="token" userRole="Admin" />
      </QueryClientProvider>,
    );

    expect(screen.getByText("MCP 工具集")).toBeInTheDocument();
    expect(screen.getByText("工具集工作方式")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建工具集" })).toBeInTheDocument();
    expect(screen.getByText("工具集 ID")).toBeInTheDocument();
    expect(screen.getByText("尚无工具集。点击“新建工具集”进行创建。")).toBeInTheDocument();
  });

  it("localizes the MCP connection guide", () => {
    render(<MCPConnect />);

    expect(screen.getByText("连接 MCP 客户端")).toBeInTheDocument();
    expect(screen.getByText("OpenAI Responses API 集成")).toBeInTheDocument();
    expect(screen.getByText("API 密钥设置")).toBeInTheDocument();
    expect(screen.getAllByText("MCP 服务信息").length).toBeGreaterThan(0);
    expect(screen.getAllByText("实现示例").length).toBeGreaterThan(0);
  });

  it("localizes submission rules, status filters, and empty state", async () => {
    render(<MCPSubmissionsTab accessToken="token" />);

    expect(screen.getByText("提交规则")).toBeInTheDocument();
    expect(screen.getByText("未设置规则")).toBeInTheDocument();
    expect(screen.getByText("提交总数")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("all");
    expect(await screen.findByText("没有符合筛选条件的 MCP 服务提交记录。")).toBeInTheDocument();
  });
});
