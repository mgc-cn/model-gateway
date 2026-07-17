import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import PassThroughSettings from "./pass_through_settings";
import { getPassThroughEndpointsCall } from "./networking";

vi.mock("./networking", () => ({
  getPassThroughEndpointsCall: vi.fn(),
  deletePassThroughEndpointsCall: vi.fn(),
  createPassThroughEndpoint: vi.fn(),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

vi.mock("./guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

describe("PassThroughSettings", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(getPassThroughEndpointsCall).mockResolvedValue({ endpoints: [] });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("localizes the endpoint list and empty state in Simplified Chinese", async () => {
    render(
      <PassThroughSettings
        accessToken="test-token"
        userRole="Admin"
        userID="user-1"
        modelData={{ data: [] }}
        premiumUser={true}
      />,
    );

    expect(screen.getByText("透传端点")).toBeInTheDocument();
    expect(screen.getByText("配置并管理透传端点")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加透传端点/ })).toBeInTheDocument();
    expect(await screen.findByText("尚未配置透传端点")).toBeInTheDocument();
  });

  it("localizes the complete add-endpoint form", async () => {
    const user = userEvent.setup();
    render(
      <PassThroughSettings
        accessToken="test-token"
        userRole="Admin"
        userID="user-1"
        modelData={{ data: [] }}
        premiumUser={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: /添加透传端点/ }));

    expect(await screen.findByText("添加透传端点", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText("什么是透传端点？")).toBeInTheDocument();
    expect(screen.getByText("路由配置")).toBeInTheDocument();
    expect(screen.getAllByText("请求头").length).toBeGreaterThan(0);
    expect(screen.getByText("默认查询参数")).toBeInTheDocument();
    expect(screen.getByText("安全设置")).toBeInTheDocument();
    expect(screen.getByText("安全护栏")).toBeInTheDocument();
    expect(screen.getByText("性能设置")).toBeInTheDocument();
    expect(screen.getByText("计费设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
  });
});
