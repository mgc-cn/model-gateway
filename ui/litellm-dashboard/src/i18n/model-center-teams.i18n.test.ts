import { describe, expect, it } from "vitest";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";

describe("model center and teams translations", () => {
  it("provides Chinese labels for the model center workflow", () => {
    expect(zhCN.modelCenter.title).toBe("AI 模型中心");
    expect(zhCN.modelCenter.filters.search).toBe("搜索模型：");
    expect(zhCN.modelCenter.columns.model).toBe("公共模型名称");
    expect(zhCN.modelCenter.publish.confirmTitle).toBe("确认公开模型");
    expect(zhCN.modelCenter.links.manage).toBe("管理已有链接");
  });

  it("provides Chinese labels for the teams workflow", () => {
    expect(zhCN.teams.title).toBe("团队");
    expect(zhCN.teams.tabs.defaults).toBe("默认团队设置");
    expect(zhCN.teams.emptyTitle).toBe("暂无团队");
    expect(zhCN.teams.form.mcpSettings).toBe("MCP 设置");
    expect(zhCN.teams.defaults.budgetSection).toBe("预算与速率限制");
  });

  it("keeps both resource namespaces aligned", () => {
    expect(Object.keys(zhCN.modelCenter)).toEqual(Object.keys(en.modelCenter));
    expect(Object.keys(zhCN.modelCenter.publish)).toEqual(Object.keys(en.modelCenter.publish));
    expect(Object.keys(zhCN.teams)).toEqual(Object.keys(en.teams));
    expect(Object.keys(zhCN.teams.form)).toEqual(Object.keys(en.teams.form));
  });
});
