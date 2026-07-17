import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import type { Plugin } from "./types";
import MakeSkillPublicForm from "./MakeSkillPublicForm";

vi.mock("../networking", () => ({
  enableClaudeCodePlugin: vi.fn().mockResolvedValue(undefined),
  disableClaudeCodePlugin: vi.fn().mockResolvedValue(undefined),
}));

const skills: Plugin[] = [
  {
    id: "skill-1",
    name: "review-code",
    description: "Reviews code changes",
    source: { source: "github", repo: "example/review-code" },
    enabled: false,
  },
];

describe("MakeSkillPublicForm", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  it("localizes both publication steps", async () => {
    const user = userEvent.setup();
    render(
      <MakeSkillPublicForm
        visible={true}
        onClose={vi.fn()}
        accessToken="test-token"
        skillsList={skills}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText("发布到技能中心")).toBeInTheDocument();
    expect(screen.getByText("选择要发布的技能")).toBeInTheDocument();
    expect(screen.queryByText("尚未注册技能。")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "全选（1）" }));
    await user.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByText("确认发布到技能中心")).toBeInTheDocument();
    expect(screen.getByText("即将发布的技能：")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布到技能中心" })).toBeInTheDocument();
  });
});
