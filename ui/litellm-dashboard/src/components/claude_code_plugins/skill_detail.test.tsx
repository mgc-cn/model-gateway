import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import type { Plugin } from "./types";
import SkillDetail from "./skill_detail";

const skill: Plugin = {
  id: "skill-1",
  name: "review-code",
  version: "1.0.0",
  description: "Reviews code changes",
  source: { source: "github", repo: "example/review-code" },
  author: { name: "Example" },
  keywords: ["review"],
  category: "Development",
  enabled: true,
  created_at: "2026-07-15T00:00:00Z",
};

describe("SkillDetail", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  it("localizes the overview and usage workflow", async () => {
    const user = userEvent.setup();
    render(<SkillDetail skill={skill} onBack={vi.fn()} />);

    expect(screen.getByText("技能详情")).toBeInTheDocument();
    expect(screen.getByText("此技能注册的元数据")).toBeInTheDocument();
    expect(screen.getByText("已公开")).toBeInTheDocument();
    expect(screen.getByText("技能 ID")).toBeInTheDocument();

    await user.click(screen.getByText("使用方法"));

    expect(screen.getByText("使用此技能")).toBeInTheDocument();
    expect(screen.getByText("在 Claude Code 中运行")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
  });
});
