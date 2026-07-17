import { describe, expect, it } from "vitest";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";

describe("virtual key creation translations", () => {
  it("provides Chinese labels for the main creation workflow", () => {
    expect(zhCN.virtualKeys.create.sections.ownership).toBe("密钥所有权");
    expect(zhCN.virtualKeys.create.ownedBy).toBe("所有者");
    expect(zhCN.virtualKeys.create.sections.details).toBe("密钥详情");
    expect(zhCN.virtualKeys.create.sections.optional).toBe("可选设置");
    expect(zhCN.virtualKeys.create.createKey).toBe("创建密钥");
  });

  it("provides Chinese labels for advanced key settings", () => {
    expect(zhCN.virtualKeys.create.budgetWindows).toBe("预算窗口");
    expect(zhCN.virtualKeys.create.rateLimitType.guaranteed).toBe("保障吞吐量");
    expect(zhCN.virtualKeys.create.mcpSettings).toBe("MCP 设置");
    expect(zhCN.virtualKeys.create.lifecycle.rotationSettings).toBe("自动轮换设置");
    expect(zhCN.virtualKeys.create.budgetFallback.primary).toBe("主模型");
    expect(zhCN.virtualKeys.create.aliasManager.addTitle).toBe("新增模型别名");
    expect(zhCN.virtualKeys.create.advancedFields.labels.max_parallel_requests).toBe("最大并行请求数");
    expect(zhCN.virtualKeys.create.advancedFields.help.number).toBe("数值输入");
  });

  it("keeps the English and Chinese resource shapes aligned", () => {
    expect(Object.keys(zhCN.virtualKeys.create)).toEqual(Object.keys(en.virtualKeys.create));
    expect(Object.keys(zhCN.virtualKeys.create.keyTypes)).toEqual(Object.keys(en.virtualKeys.create.keyTypes));
    expect(Object.keys(zhCN.virtualKeys.create.lifecycle)).toEqual(Object.keys(en.virtualKeys.create.lifecycle));
    expect(Object.keys(zhCN.virtualKeys.create.budgetFallback)).toEqual(
      Object.keys(en.virtualKeys.create.budgetFallback),
    );
    expect(Object.keys(zhCN.virtualKeys.create.aliasManager)).toEqual(Object.keys(en.virtualKeys.create.aliasManager));
    expect(Object.keys(zhCN.virtualKeys.create.advancedFields.labels)).toEqual(
      Object.keys(en.virtualKeys.create.advancedFields.labels),
    );
  });
});
