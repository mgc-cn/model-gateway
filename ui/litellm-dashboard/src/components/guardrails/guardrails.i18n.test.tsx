import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { en } from "@/i18n/resources/en";
import { zhCN } from "@/i18n/resources/zh-CN";
import GuardrailsPanel from "../guardrails";
import GuardrailGarden from "./guardrail_garden";
import GuardrailTestPlayground from "./GuardrailTestPlayground";
import AddGuardrailForm from "./add_guardrail_form";
import { TeamGuardrailsTab } from "./TeamGuardrailsTab";
import CustomCodeModal from "./custom_code/CustomCodeModal";

vi.mock("../networking", () => ({
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
  deleteGuardrailCall: vi.fn(),
  applyGuardrail: vi.fn(),
  createGuardrailCall: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn().mockResolvedValue({}),
  getGuardrailUISettings: vi.fn().mockResolvedValue({}),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  listGuardrailSubmissions: vi.fn().mockResolvedValue({
    submissions: [],
    summary: { total: 0, pending_review: 0, active: 0, rejected: 0 },
  }),
  approveGuardrailSubmission: vi.fn(),
  rejectGuardrailSubmission: vi.fn(),
  updateGuardrailCall: vi.fn(),
  testCustomCodeGuardrail: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/guardrails/useRegisterGuardrail", () => ({
  useRegisterGuardrail: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("guardrail management Chinese localization", () => {
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

  it("keeps custom code guardrail resources aligned", () => {
    const english = en.guardrailManagement.customCode;
    const chinese = zhCN.guardrailManagement.customCode;

    expect(Object.keys(chinese)).toEqual(Object.keys(english));
    expect(Object.keys(chinese.templates)).toEqual(Object.keys(english.templates));
    expect(Object.keys(chinese.modes)).toEqual(Object.keys(english.modes));
    expect(Object.keys(chinese.test.fields)).toEqual(Object.keys(english.test.fields));
    expect(Object.keys(chinese.primitives.categories)).toEqual(Object.keys(english.primitives.categories));
    expect(Object.keys(chinese.primitives.descriptions)).toEqual(Object.keys(english.primitives.descriptions));
    expect(Object.keys(chinese.notifications)).toEqual(Object.keys(english.notifications));
  });

  it("localizes the main tabs, guardrail actions, and empty table", async () => {
    render(<GuardrailsPanel accessToken="token" userRole="Admin" />);

    expect(screen.getByText("护栏花园")).toBeInTheDocument();
    expect(screen.getByText("安全护栏")).toBeInTheDocument();
    expect(screen.getByText("测试调试")).toBeInTheDocument();
    expect(screen.getByText("已提交护栏")).toBeInTheDocument();
    expect(screen.getByText("+ 新增安全护栏")).toBeInTheDocument();
    expect(await screen.findByText("未找到安全护栏")).toBeInTheDocument();
  });

  it("localizes the guardrail garden", () => {
    render(<GuardrailGarden accessToken="token" onGuardrailCreated={vi.fn()} />);

    expect(screen.getByPlaceholderText("搜索安全护栏")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 内容过滤")).toBeInTheDocument();
    expect(screen.getByText("合作伙伴护栏")).toBeInTheDocument();
  });

  it("localizes the testing playground empty state", () => {
    render(<GuardrailTestPlayground guardrailsList={[]} isLoading={false} accessToken="token" onClose={vi.fn()} />);

    expect(screen.getByText("安全护栏测试调试")).toBeInTheDocument();
    expect(screen.getByText("选择要测试的护栏")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索安全护栏...")).toBeInTheDocument();
  });

  it("localizes the create guardrail wizard", () => {
    render(<AddGuardrailForm visible onClose={vi.fn()} accessToken={null} onSuccess={vi.fn()} />);

    expect(screen.getByText("创建安全护栏")).toBeInTheDocument();
    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.getByText("护栏名称")).toBeInTheDocument();
    expect(screen.getByText("护栏供应商")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
  });

  it("localizes the custom code guardrail modal", () => {
    render(<CustomCodeModal visible onClose={vi.fn()} accessToken="token" onSuccess={vi.fn()} />);

    expect(screen.getByText("创建自定义安全护栏")).toBeInTheDocument();
    expect(screen.getByText("使用类 Python 语法定义自定义逻辑")).toBeInTheDocument();
    expect(screen.getByText("护栏名称")).toBeInTheDocument();
    expect(screen.getByText("空白模板")).toBeInTheDocument();
    expect(screen.getByText("测试安全护栏")).toBeInTheDocument();
    expect(screen.getByText("可用基础函数")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存安全护栏" })).toBeInTheDocument();
  });

  it("localizes submitted guardrail filters and empty state", async () => {
    render(<TeamGuardrailsTab accessToken="token" />);

    expect(screen.getByText("提交总数")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索安全护栏...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增安全护栏" })).toBeInTheDocument();
    expect(await screen.findByText("没有符合筛选条件的安全护栏。")).toBeInTheDocument();
  });
});
