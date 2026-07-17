import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoadingScreen from "./LoadingScreen";
import i18n from "@/i18n/i18n";

describe("LoadingScreen", () => {
  it("should render", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the shared loading state in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<LoadingScreen />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });
});
