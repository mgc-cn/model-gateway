import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import PassThroughInfoView from "./pass_through_info";

vi.mock("./networking", () => ({
  updatePassThroughEndpoint: vi.fn(),
  deletePassThroughEndpointsCall: vi.fn(),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

vi.mock("./guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

describe("PassThroughInfoView", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("localizes endpoint overview, settings, and edit workflow in Simplified Chinese", async () => {
    const user = userEvent.setup();
    render(
      <PassThroughInfoView
        endpointData={{
          id: "endpoint-1",
          path: "/internal-api",
          target: "https://api.example.com",
          headers: {},
          include_subpath: true,
          auth: true,
          methods: ["GET", "POST"],
          cost_per_request: 0.01,
          timeout: 600,
        }}
        onClose={vi.fn()}
        accessToken="test-token"
        isAdmin={true}
        premiumUser={true}
      />,
    );

    expect(screen.getByText("透传端点：/internal-api")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getAllByText("包含子路径").length).toBeGreaterThan(0);
    expect(screen.getAllByText("需要身份验证").length).toBeGreaterThan(0);
    expect(screen.getByText("路由预览")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(screen.getByText("透传端点设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除端点" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑设置" }));

    expect(screen.getByLabelText("目标地址")).toBeInTheDocument();
    expect(screen.getByText("HTTP 请求方法（可选）")).toBeInTheDocument();
    expect(screen.getByText("安全设置")).toBeInTheDocument();
    expect(screen.getByText("安全护栏")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
  });
});
