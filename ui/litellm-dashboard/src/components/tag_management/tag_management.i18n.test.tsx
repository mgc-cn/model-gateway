import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import TagTable from "./TagTable";
import CreateTagModal from "./components/CreateTagModal";
import type { Tag } from "./types";

const dynamicSpendTag: Tag = {
  name: "request-spend-tag",
  description: "This is just a spend tag that was passed dynamically in a request. It does not control any LLM models.",
  models: [],
  created_at: "2026-07-15T00:00:00Z",
  updated_at: "2026-07-15T00:00:00Z",
};

describe("tag management Chinese localization", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the table and dynamic spend tag restrictions", () => {
    render(<TagTable data={[dynamicSpendTag]} onEdit={vi.fn()} onDelete={vi.fn()} onSelectTag={vi.fn()} />);

    expect(screen.getByText("标签名称")).toBeInTheDocument();
    expect(screen.getByText("允许的模型")).toBeInTheDocument();
    expect(screen.getByText("这是请求中动态传入的消费统计标签，不控制任何模型的访问权限。")).toBeInTheDocument();
    expect(screen.getByText("全部模型")).toBeInTheDocument();
    expect(screen.getByLabelText("编辑标签（不可用）")).toBeInTheDocument();
    expect(screen.getByLabelText("删除标签（不可用）")).toBeInTheDocument();
  });

  it("localizes the complete tag creation form", () => {
    render(<CreateTagModal visible onCancel={vi.fn()} onSubmit={vi.fn()} availableModels={[]} />);

    expect(screen.getByRole("dialog", { name: "创建新标签" })).toBeInTheDocument();
    expect(screen.getByLabelText("标签名称")).toBeInTheDocument();
    expect(screen.getByLabelText("描述")).toBeInTheDocument();
    expect(screen.getByText("允许的模型")).toBeInTheDocument();
    expect(screen.getByText("预算与速率限制（可选）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建标签" })).toBeInTheDocument();
  });
});
