import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import AddAutoRouterTab from "./add_auto_router_tab";
import NotificationManager from "../molecules/notifications_manager";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";

vi.mock("../networking", () => ({
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [{ id: "shared-models" }] }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([
    { model_group: "gpt-4", mode: "chat" },
    { model_group: "text-embedding-3-small", mode: "embedding" },
  ]),
}));

vi.mock("./model_connection_test", () => ({
  default: () => <div>connection test</div>,
}));

vi.mock("./handle_add_auto_router_submit", () => ({
  handleAddAutoRouterSubmit: vi.fn(),
}));

vi.mock("../molecules/notifications_manager", () => ({
  default: {
    fromBackend: vi.fn(),
    success: vi.fn(),
  },
}));

const TestHarness = () => {
  const [form] = Form.useForm();
  return <AddAutoRouterTab form={form} handleOk={vi.fn()} accessToken="test-token" userRole="Admin" />;
};

describe("AddAutoRouterTab", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the default complexity-router workflow in Simplified Chinese", async () => {
    render(<TestHarness />);

    expect(screen.getByRole("heading", { name: "添加自动路由" })).toBeInTheDocument();
    expect(screen.getByText("路由类型")).toBeInTheDocument();
    expect(screen.getByText("复杂度路由")).toBeInTheDocument();
    expect(screen.getByText("推荐")).toBeInTheDocument();
    expect(screen.getByText("复杂度分层配置")).toBeInTheDocument();
    expect(screen.getByText("其他设置")).toBeInTheDocument();
    expect(screen.getByText("模型访问组")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加自动路由" })).toBeInTheDocument();

    await waitFor(() => expect(fetchAvailableModels).toHaveBeenCalledWith("test-token"));
  });

  it("localizes the complete semantic-router workflow", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("radio", { name: /语义路由/ }));

    expect(screen.getByText("路由配置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加路由/ })).toBeInTheDocument();
    expect(screen.getByText("默认模型")).toBeInTheDocument();
    expect(screen.getByText("嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("JSON 预览")).toBeInTheDocument();
  });

  it("shows a localized validation message when the router name is empty", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole("button", { name: "添加自动路由" }));

    expect(NotificationManager.fromBackend).toHaveBeenCalledWith("请输入自动路由名称");
  });
});
