import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import type { Plugin } from "@/components/claude_code_plugins/types";
import SkillHubDashboard from "./SkillHubDashboard";

vi.mock("@/components/model_dashboard/table", () => ({
  ModelDataTable: ({ columns }: { columns: Array<{ header?: unknown }> }) => (
    <div>
      {columns.map((column) =>
        typeof column.header === "string" ? <span key={column.header}>{column.header}</span> : null,
      )}
    </div>
  ),
}));

vi.mock("@/components/claude_code_plugins/skill_detail", () => ({ default: () => <div>skill detail</div> }));

const skill: Plugin = {
  id: "skill-1",
  name: "fixture-skill",
  description: "fixture",
  source: { source: "github", repo: "org/repo" },
  category: "testing",
  domain: "quality",
  namespace: "mg-b1",
  enabled: true,
};

describe("SkillHubDashboard i18n", () => {
  it("renders the public hub summary, controls and columns in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<SkillHubDashboard skills={[skill]} isLoading={false} publicPage />);

    expect(screen.getByText("技能总数")).toBeInTheDocument();
    expect(screen.getByText("命名空间")).toBeInTheDocument();
    expect(screen.getAllByText("领域")).not.toHaveLength(0);
    expect(screen.getByText("全部公开技能")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、命名空间或标签搜索...")).toBeInTheDocument();
    expect(screen.getByText("技能名称")).toBeInTheDocument();
    expect(screen.getByText("显示 1 个技能，共 1 个")).toBeInTheDocument();
  });
});
