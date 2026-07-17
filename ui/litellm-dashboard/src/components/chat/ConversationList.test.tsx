import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import ConversationList from "./ConversationList";

describe("ConversationList", () => {
  it("renders the shared empty state in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = render(
      <ConversationList
        conversations={[]}
        activeConversationId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
      />,
    );

    expect(container).toHaveTextContent("暂无对话");
    expect(container).toHaveTextContent("请在上方新建对话");
  });
});
