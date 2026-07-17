import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { McpOAuthCallbackContent } from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => null,
}));

vi.mock("@/utils/secureStorage", () => ({
  getSecureItem: vi.fn(() => null),
  setSecureItem: vi.fn(),
}));

describe("MCP OAuth callback localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the completion state in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<McpOAuthCallbackContent />);

    expect(screen.getByRole("heading", { name: "LiteLLM MCP OAuth" })).toBeInTheDocument();
    expect(screen.getByText("授权已完成。您可以关闭此窗口并返回 LiteLLM 管理后台。")).toBeInTheDocument();
  });
});
