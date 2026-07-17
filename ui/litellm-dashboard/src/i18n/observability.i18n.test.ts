import { describe, expect, it } from "vitest";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";

describe("observability translations", () => {
  it("provides Chinese labels for the usage workflow", () => {
    expect(zhCN.observability.usage.viewTitle).toBe("用量视图");
    expect(zhCN.observability.usage.metrics).toBe("用量指标");
    expect(zhCN.observability.usage.tabs.mcp).toBe("MCP 服务活动");
    expect(zhCN.observability.usage.exportData).toBe("导出数据");
    expect(zhCN.observability.usage.activity.overallUsage).toBe("总体用量");
    expect(zhCN.observability.usage.activity.totalTokensOverTime).toBe("Token 总数趋势");
    expect(zhCN.observability.usage.activity.chart.successful_requests).toBe("成功请求");
    expect(zhCN.observability.usage.activity.chart.cache_read_input_tokens).toBe("缓存读取 Token");
  });

  it("provides Chinese labels for logs and log details", () => {
    expect(zhCN.observability.logs.tabs.requests).toBe("请求日志");
    expect(zhCN.observability.logs.columns.requestId).toBe("请求 ID");
    expect(zhCN.observability.logs.audit.changedBy).toBe("操作人");
    expect(zhCN.observability.logs.detail.requestResponse).toBe("请求与响应");
  });

  it("provides Chinese labels for guardrail monitoring", () => {
    expect(zhCN.observability.guardrailsMonitor.title).toBe("护栏监控");
    expect(zhCN.observability.guardrailsMonitor.performance).toBe("护栏性能");
    expect(zhCN.observability.guardrailsMonitor.logViewer.flagged).toBe("已标记");
    expect(zhCN.observability.guardrailsMonitor.evaluation.run).toBe("运行评估");
  });

  it("keeps the English resource shape aligned", () => {
    expect(Object.keys(zhCN.observability)).toEqual(Object.keys(en.observability));
    expect(Object.keys(zhCN.observability.logs.detail)).toEqual(Object.keys(en.observability.logs.detail));
    expect(Object.keys(zhCN.observability.usage.activity)).toEqual(Object.keys(en.observability.usage.activity));
    expect(Object.keys(zhCN.observability.usage.activity.chart)).toEqual(
      Object.keys(en.observability.usage.activity.chart),
    );
  });
});
