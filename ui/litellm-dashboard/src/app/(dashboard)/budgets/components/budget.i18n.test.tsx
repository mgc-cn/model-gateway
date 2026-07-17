import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import BudgetPanel from "./budget_panel";
import BudgetModal from "./budget_modal";
import EditBudgetModal from "./edit_budget_modal";
import * as budgetHooks from "@/app/(dashboard)/hooks/budgets/useBudgets";

vi.mock("@/app/(dashboard)/hooks/budgets/useBudgets", () => ({
  useBudgets: vi.fn(),
  useDeleteBudget: vi.fn(),
  useCreateBudget: vi.fn(),
  useUpdateBudget: vi.fn(),
}));

const budget: budgetHooks.budgetItem = {
  budget_id: "customer-production",
  max_budget: 100,
  rpm_limit: 20,
  tpm_limit: 2000,
  updated_at: "2026-07-15T00:00:00Z",
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

describe("budget management Chinese localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(budgetHooks.useBudgets).mockReturnValue({ data: [budget], isLoading: false } as never);
    vi.mocked(budgetHooks.useDeleteBudget).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.mocked(budgetHooks.useCreateBudget).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.mocked(budgetHooks.useUpdateBudget).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the budget list, actions, examples, and delete confirmation", async () => {
    const user = userEvent.setup();
    render(<BudgetPanel accessToken="test-token" />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: "+ 创建预算" })).toBeInTheDocument();
    expect(screen.getByText("预算")).toBeInTheDocument();
    expect(screen.getByText("使用示例")).toBeInTheDocument();
    expect(screen.getByText("创建预算并分配给客户。")).toBeInTheDocument();
    expect(screen.getByText("Budget ID")).toBeInTheDocument();
    expect(screen.getByText("最大预算")).toBeInTheDocument();

    await user.click(screen.getByText("使用示例"));
    expect(await screen.findByText("如何使用 Budget ID")).toBeInTheDocument();
    expect(screen.getByText("为客户分配预算")).toBeInTheDocument();
    expect(screen.getByText("使用 Curl 测试")).toBeInTheDocument();
    expect(screen.getByText("使用 OpenAI SDK 测试")).toBeInTheDocument();

    await user.click(screen.getByText("预算"));
    await user.click(screen.getByTestId("delete-budget-button"));
    expect(await screen.findByText("删除预算？")).toBeInTheDocument();
    expect(screen.getByText("确定要删除此预算吗？此操作无法撤销。")).toBeInTheDocument();
    expect(screen.getByText("预算信息")).toBeInTheDocument();
  });

  it("localizes the complete budget creation form", () => {
    render(<BudgetModal isModalVisible setIsModalVisible={vi.fn()} />, { wrapper: createWrapper() });

    const dialog = screen.getByRole("dialog", { name: "创建预算" });
    expect(within(dialog).getByText("Budget ID")).toBeInTheDocument();
    expect(within(dialog).getByText("每分钟最大令牌数")).toBeInTheDocument();
    expect(within(dialog).getByText("每分钟最大请求数")).toBeInTheDocument();
    expect(within(dialog).getByText("可选设置")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /创\s*建\s*预\s*算/ })).toBeInTheDocument();
  });

  it("localizes the budget edit form and preserves technical values", async () => {
    const user = userEvent.setup();
    render(<EditBudgetModal isModalVisible setIsModalVisible={vi.fn()} existingBudget={budget} />, {
      wrapper: createWrapper(),
    });

    const dialog = screen.getByRole("dialog", { name: "编辑预算" });
    expect(within(dialog).getByText("Budget ID 创建后无法修改")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /保\s*存/ })).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByDisplayValue("customer-production")).toBeDisabled());

    await user.click(within(dialog).getByText("可选设置"));
    expect(await within(dialog).findByText("最大预算（USD）")).toBeInTheDocument();
    expect(within(dialog).getByText("预算重置周期")).toBeInTheDocument();
  });
});
