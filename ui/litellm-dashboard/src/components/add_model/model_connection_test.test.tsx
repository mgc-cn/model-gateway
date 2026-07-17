/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { testConnectionRequest } from "../networking";
import { prepareModelAddRequest } from "./handle_add_model_submit";
import ModelConnectionTest from "./model_connection_test";

vi.mock("../networking", () => ({
  testConnectionRequest: vi.fn(),
}));

vi.mock("./handle_add_model_submit", () => ({
  prepareModelAddRequest: vi.fn(),
}));

describe("ModelConnectionTest", () => {
  beforeEach(() => {
    vi.mocked(prepareModelAddRequest).mockResolvedValue([
      {
        litellmParamsObj: { model: "openai/gpt-4.1-mini" },
        modelInfoObj: { mode: "chat" },
        modelName: "workspace-default",
      },
    ]);
    vi.mocked(testConnectionRequest).mockResolvedValue({ status: "success" });
  });

  it("localizes a successful connection test in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(
      <ModelConnectionTest formValues={{}} accessToken="test-token" testMode="chat" modelName="workspace-default" />,
    );

    expect(await screen.findByText("与 workspace-default 的连接成功！", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /查看文档$/ })).toBeInTheDocument();
  });
});
