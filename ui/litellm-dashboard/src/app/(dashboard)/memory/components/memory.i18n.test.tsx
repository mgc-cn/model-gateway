import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import i18n from "@/i18n/i18n";
import { MemoryEditModal } from "./MemoryEditModal";
import { MemoryView } from "./MemoryView";

vi.mock("@/components/networking", () => ({
  fetchMemoryList: vi.fn(),
  createMemory: vi.fn(),
  updateMemory: vi.fn(),
  deleteMemory: vi.fn(),
}));

const memory: networking.MemoryRow = {
  memory_id: "memory-001",
  key: "user:123:notes",
  value: "用户喜欢简洁的回答",
  metadata: { tags: ["preference"] },
  user_id: "user-123",
  team_id: "team-456",
  created_at: "2026-07-15T08:00:00Z",
  created_by: "creator@example.com",
  updated_at: "2026-07-15T09:00:00Z",
  updated_by: "editor@example.com",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("memory management Chinese localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.fetchMemoryList).mockResolvedValue({ memories: [], total: 0 });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the list controls, columns, pagination, and empty state", async () => {
    render(<MemoryView accessToken="test-token" userID="user-123" userRole="Admin" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("heading", { name: "记忆管理" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('按键名前缀筛选，例如 "user:"')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /搜\s*索/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /刷新/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /新建记忆/ })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("暂未存储记忆")).toBeInTheDocument());
    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("内容预览")).toBeInTheDocument();
    expect(screen.getByText("更新时间")).toBeInTheDocument();
  });

  it("localizes memory details and the delete confirmation", async () => {
    vi.mocked(networking.fetchMemoryList).mockResolvedValue({ memories: [memory], total: 1 });
    const user = userEvent.setup();

    render(<MemoryView accessToken="test-token" userID="user-123" userRole="Admin" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(screen.getByText("user:123:notes")).toBeInTheDocument());
    await user.click(screen.getByLabelText("查看记忆"));

    expect(screen.getByText("记忆内容")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.getByText(/由 creator@example.com 创建于/)).toBeInTheDocument();
    expect(screen.getByText(/由 editor@example.com 更新于/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "user:123:notes" })).not.toBeInTheDocument());
    await user.click(screen.getByLabelText("删除记忆"));
    expect(screen.getByText("删除记忆")).toBeInTheDocument();
    expect(screen.getByText("此操作无法撤销。")).toBeInTheDocument();
    expect(screen.getByText("记忆信息")).toBeInTheDocument();
  });

  it("localizes both create and edit forms", () => {
    const { rerender } = render(
      <MemoryEditModal open mode="create" onClose={vi.fn()} onSave={vi.fn().mockResolvedValue(true)} />,
    );

    expect(screen.getByRole("dialog", { name: "创建记忆" })).toBeInTheDocument();
    expect(screen.getByLabelText("键名")).toBeInTheDocument();
    expect(screen.getByLabelText("记忆内容")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.getByText("（可选 JSON）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /创\s*建/ })).toBeInTheDocument();

    rerender(
      <MemoryEditModal
        open
        mode="edit"
        initialRow={memory}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(true)}
      />,
    );

    expect(screen.getByRole("dialog", { name: "编辑 user:123:notes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保\s*存/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue("user:123:notes")).toBeDisabled();
  });
});
