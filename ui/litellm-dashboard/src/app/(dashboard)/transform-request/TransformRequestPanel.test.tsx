import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import NotificationsManager from "@/components/molecules/notifications_manager";
import TransformRequestPanel from "./TransformRequestPanel";

vi.mock("@/components/networking", () => ({
  transformRequestCall: vi.fn(),
}));

vi.mock("@/components/molecules/notifications_manager", () => ({
  default: {
    fromBackend: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe("TransformRequestPanel", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the API playground in Simplified Chinese", () => {
    render(<TransformRequestPanel accessToken="test-token" />);

    expect(screen.getByText("API 调试")).toBeInTheDocument();
    expect(screen.getByText("查看 LiteLLM 如何根据指定提供商转换请求。")).toBeInTheDocument();
    expect(screen.getByText("原始请求")).toBeInTheDocument();
    expect(screen.getByText("转换后的请求")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "原始请求 JSON" })).toHaveAttribute(
      "placeholder",
      "按 Cmd/Ctrl + Enter 转换请求",
    );
    expect(screen.getByRole("button", { name: /转换请求/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制转换后的请求" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "在此提交 issue" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm/issues",
    );
  });

  it("localizes invalid JSON feedback", async () => {
    const user = userEvent.setup();
    render(<TransformRequestPanel accessToken="test-token" />);

    fireEvent.change(screen.getByRole("textbox", { name: "原始请求 JSON" }), {
      target: { value: "{" },
    });
    await user.click(screen.getByRole("button", { name: /转换请求/ }));

    expect(NotificationsManager.fromBackend).toHaveBeenCalledWith("请求体中的 JSON 格式无效");
  });
});
