import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import PolicyTemplates from "./policy_templates";
import PolicyTable from "./policy_table";
import AttachmentTable from "./attachment_table";
import PolicyTestPanel from "./policy_test_panel";
import AddPolicyForm from "./add_policy_form";
import AddAttachmentForm from "./add_attachment_form";

const mocks = vi.hoisted(() => ({
  getPolicyTemplates: vi.fn(),
}));

vi.mock("../networking", () => ({
  getPolicyTemplates: mocks.getPolicyTemplates,
  teamListCall: vi.fn().mockResolvedValue([]),
  keyListCall: vi.fn().mockResolvedValue({ keys: [] }),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  getResolvedGuardrails: vi.fn().mockResolvedValue({ resolved_guardrails: [] }),
  estimateAttachmentImpactCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ userId: "admin-user", userRole: "Admin" }),
}));

const officialTemplate = {
  id: "advanced-au-pii-protection",
  title: "Advanced PII Protection (Australia)",
  description: "Protects Australian-specific identifiers.",
  icon: "ShieldCheckIcon",
  iconColor: "text-purple-500",
  iconBg: "bg-purple-50",
  guardrails: ["au-pii-tax-identifiers"],
  tags: ["PII Protection", "Australia"],
  complexity: "High",
};

describe("policy management Chinese localization", () => {
  beforeEach(async () => {
    mocks.getPolicyTemplates.mockResolvedValue([officialTemplate]);
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the template page and official backend template data", async () => {
    render(<PolicyTemplates onUseTemplate={vi.fn()} onOpenAiSuggestion={vi.fn()} accessToken="token" />);

    expect(await screen.findByText("策略模板")).toBeInTheDocument();
    expect(screen.getByText("使用 AI 查找模板")).toBeInTheDocument();
    expect(screen.getByText("高级个人信息保护（澳大利亚）")).toBeInTheDocument();
    expect(screen.getByText(/保护澳大利亚特有标识符/)).toBeInTheDocument();
    expect(screen.getAllByText("个人信息保护").length).toBeGreaterThan(0);
    expect(screen.getByText("高复杂度")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用模板" })).toBeInTheDocument();
  });

  it("localizes policy and attachment tables including empty states", () => {
    const { rerender } = render(
      <PolicyTable
        policies={[]}
        isLoading={false}
        onDeleteClick={vi.fn()}
        onEditClick={vi.fn()}
        onViewClick={vi.fn()}
        isAdmin
      />,
    );

    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("添加的护栏")).toBeInTheDocument();
    expect(screen.getByText("模型条件")).toBeInTheDocument();
    expect(screen.getByText("暂无策略")).toBeInTheDocument();

    rerender(
      <AttachmentTable attachments={[]} isLoading={false} onDeleteClick={vi.fn()} isAdmin accessToken="token" />,
    );
    expect(screen.getByText("Attachment ID")).toBeInTheDocument();
    expect(screen.getByText("范围")).toBeInTheDocument();
    expect(screen.getByText("暂无关联范围")).toBeInTheDocument();
  });

  it("localizes the policy simulator", async () => {
    render(<PolicyTestPanel accessToken="token" />);

    expect(screen.getByText("策略模拟器")).toBeInTheDocument();
    expect(screen.getByLabelText("团队别名")).toBeInTheDocument();
    expect(screen.getByText("选择或输入密钥别名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "模拟" })).toBeInTheDocument();
    expect(screen.getByText("尚未运行模拟")).toBeInTheDocument();
  });

  it("localizes policy creation modes and the simple form", async () => {
    const user = userEvent.setup();
    render(
      <AddPolicyForm
        visible
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onOpenFlowBuilder={vi.fn()}
        accessToken="token"
        existingPolicies={[]}
        availableGuardrails={[]}
        createPolicy={vi.fn()}
        updatePolicy={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "新建策略" })).toBeInTheDocument();
    expect(screen.getByText("简单模式")).toBeInTheDocument();
    expect(screen.getByText("流程构建器")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "创建策略" }));
    expect(screen.getByLabelText("策略名称")).toBeInTheDocument();
    expect(screen.getByText("继承")).toBeInTheDocument();
    expect(screen.getByText("条件（可选）")).toBeInTheDocument();
  });

  it("localizes the attachment form", async () => {
    render(
      <AddAttachmentForm
        visible
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        accessToken="token"
        policies={[{ policy_id: "policy-1", policy_name: "baseline" }] as any}
        createAttachment={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "创建策略关联范围" })).toBeInTheDocument();
    expect(screen.getByText("范围类型")).toBeInTheDocument();
    expect(screen.getByText("全局（应用于所有请求）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建关联范围" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("策略")).toBeInTheDocument());
  });
});
