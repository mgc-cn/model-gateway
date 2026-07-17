import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import AgentsPanel from "../agents";
import AddAgentForm from "./add_agent_form";
import AgentCardDiscovery from "./agent_card_discovery";

const mocks = vi.hoisted(() => ({
  getAgentsList: vi.fn(),
  getAgentCreateMetadata: vi.fn(),
  discoverAgentCardCall: vi.fn(),
}));

vi.mock("../networking", () => ({
  getAgentsList: mocks.getAgentsList,
  deleteAgentCall: vi.fn(),
  getAgentCreateMetadata: mocks.getAgentCreateMetadata,
  createAgentCall: vi.fn(),
  keyCreateForAgentCall: vi.fn(),
  keyListCall: vi.fn().mockResolvedValue({ keys: [] }),
  keyUpdateCall: vi.fn(),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  discoverAgentCardCall: mocks.discoverAgentCardCall,
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ userId: "admin-user", userRole: "Admin" }),
}));

vi.mock("../common_components/team_dropdown", () => ({
  default: () => <div data-testid="team-dropdown" />,
}));

vi.mock("../mcp_server_management/MCPServerSelector", () => ({
  default: () => <div data-testid="mcp-server-selector" />,
}));

vi.mock("../mcp_server_management/MCPToolPermissions", () => ({
  default: () => <div data-testid="mcp-tool-permissions" />,
}));

vi.mock("../guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const agentMetadata = [
  {
    agent_type: "a2a",
    agent_type_display_name: "A2A Standard",
    description: "A2A standard agent",
    logo_url: "",
    credential_fields: [],
    use_a2a_form_fields: true,
  },
];

describe("agent management Chinese localization", () => {
  beforeEach(async () => {
    mocks.getAgentsList.mockResolvedValue({
      agents: [
        {
          agent_id: "agent-123456789",
          agent_name: "内部助手",
          spend: 12.3456,
          created_at: "2026-07-16T08:00:00Z",
          litellm_params: { model: "gpt-4o" },
          keys: [{ token: "hash-key", key_alias: "primary" }],
        },
      ],
    });
    mocks.getAgentCreateMetadata.mockResolvedValue(agentMetadata);
    mocks.discoverAgentCardCall.mockReset();
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the agents list, key guidance, table headers, and statuses", async () => {
    render(<AgentsPanel accessToken="token" userRole="Admin" />);

    expect(screen.getByRole("heading", { name: "智能体" })).toBeInTheDocument();
    expect(screen.getByText("为什么智能体需要密钥？")).toBeInTheDocument();
    expect(screen.getByText("+ 新增智能体")).toBeInTheDocument();
    expect(screen.getByText("健康检查")).toBeInTheDocument();

    expect(await screen.findByText("内部助手")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "智能体名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByText("已启用")).toBeInTheDocument();
  });

  it("localizes the add-agent wizard configure step and A2A form labels", async () => {
    render(<AddAgentForm visible onClose={vi.fn()} accessToken="token" onSuccess={vi.fn()} />);

    expect(await screen.findByText("新增智能体")).toBeInTheDocument();
    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("授权范围")).toBeInTheDocument();
    expect(screen.getByText("治理")).toBeInTheDocument();
    expect(screen.getByText("智能体管理")).toBeInTheDocument();
    expect(screen.getByText("完成")).toBeInTheDocument();
    expect(screen.getByText("智能体类型")).toBeInTheDocument();
    expect(screen.getByText("基本信息 (必填)")).toBeInTheDocument();
    expect(screen.getByText("显示名称")).toBeInTheDocument();
    expect(screen.getByText("从智能体 URL 发现")).toBeInTheDocument();
  });

  it("localizes the agent-card discovery widget and validation error", async () => {
    const user = userEvent.setup();
    render(<AgentCardDiscovery accessToken="token" onApply={vi.fn()} />);

    expect(screen.getByText("从智能体 URL 发现")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://upstream-agent.example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /发现/ }));

    await waitFor(() => {
      expect(screen.getByText("请先输入智能体基础 URL")).toBeInTheDocument();
    });
    expect(mocks.discoverAgentCardCall).not.toHaveBeenCalled();
  });
});
