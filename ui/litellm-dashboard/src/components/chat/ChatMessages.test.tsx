import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import i18n from "@/i18n/i18n";
import ChatMessages from "./ChatMessages";

describe("ChatMessages", () => {
  it("localizes shared assistant and tool states", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <ChatMessages
        isStreaming={false}
        messages={[
          { id: "assistant", role: "assistant", content: "answer[stopped]", timestamp: 0 },
          { id: "tool", role: "tool", content: "", toolArgs: { token: "secret" }, timestamp: 0 },
        ]}
      />,
    );

    expect(screen.getByText("[已停止]")).toBeInTheDocument();
    expect(screen.getByText("工具调用")).toBeInTheDocument();
  });
});
