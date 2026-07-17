import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import RouteStatus from "./RouteStatus";

describe("RouteStatus", () => {
  it("renders a localized error and retry action", async () => {
    await i18n.changeLanguage("zh-CN");
    const onRetry = vi.fn();
    render(<RouteStatus kind="error" onRetry={onRetry} />);

    expect(screen.getByRole("heading", { name: "出现错误" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("reuses the shared localized loading state", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<RouteStatus kind="loading" />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });
});
