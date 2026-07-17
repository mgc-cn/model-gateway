import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import CacheDashboard from "./cache_dashboard";
import { CacheHealthTab } from "./cache_health";
import CacheSettings from "./cache_settings";

const networkingMocks = vi.hoisted(() => ({
  adminGlobalCacheActivity: vi.fn(),
  cachingHealthCheckCall: vi.fn(),
  getCacheSettingsCall: vi.fn(),
  testCacheConnectionCall: vi.fn(),
  updateCacheSettingsCall: vi.fn(),
}));

vi.mock("@/components/networking", () => networkingMocks);

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

describe("caching page Chinese localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    networkingMocks.adminGlobalCacheActivity.mockResolvedValue([
      {
        api_key: "key-1",
        model: "gpt-4.1",
        cache_hit_true_rows: 4,
        cached_completion_tokens: 120,
        total_rows: 10,
        generated_completion_tokens: 300,
        call_type: "acompletion",
      },
    ]);
    networkingMocks.getCacheSettingsCall.mockResolvedValue({ current_values: {} });
    networkingMocks.testCacheConnectionCall.mockResolvedValue({ status: "success" });
    networkingMocks.updateCacheSettingsCall.mockResolvedValue({ status: "success" });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes cache analytics tabs, filters, metrics, and charts", async () => {
    render(
      <CacheDashboard
        accessToken="test-token"
        token="test-token"
        userRole="Admin"
        userID="user-1"
        premiumUser={false}
      />,
    );

    expect(screen.getByText("缓存分析")).toBeInTheDocument();
    expect(screen.getByText("缓存健康检查")).toBeInTheDocument();
    expect(screen.getAllByText("缓存设置").length).toBeGreaterThan(0);
    expect(screen.getAllByText("选择虚拟密钥").length).toBeGreaterThan(0);
    expect(screen.getAllByText("选择模型").length).toBeGreaterThan(0);
    expect(screen.getByText("选择时间范围")).toBeInTheDocument();
    expect(screen.getByText("缓存命中率")).toBeInTheDocument();
    expect(screen.getByText("缓存命中次数")).toBeInTheDocument();
    expect(screen.getByText("缓存令牌数")).toBeInTheDocument();
    expect(screen.getByText("缓存命中与 API 请求对比")).toBeInTheDocument();
    expect(screen.getByText("缓存完成令牌与生成完成令牌对比")).toBeInTheDocument();
    expect(await screen.findByText(/上次刷新：/)).toBeInTheDocument();
  });

  it("switches between analytics, health, and settings panels", async () => {
    const user = userEvent.setup();
    render(
      <CacheDashboard
        accessToken="test-token"
        token="test-token"
        userRole="Admin"
        userID="user-1"
        premiumUser={false}
      />,
    );

    expect(screen.getByText("缓存命中率")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "缓存健康检查" }));
    expect(screen.getByRole("button", { name: "运行健康检查" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "缓存设置" }));
    expect(await screen.findByRole("button", { name: "测试连接" })).toBeVisible();
  });

  it("localizes cache health summary and Redis details", () => {
    render(
      <CacheHealthTab
        accessToken="test-token"
        runCachingHealthCheck={vi.fn()}
        healthCheckResponse={{
          status: "healthy",
          ping_response: true,
          set_cache_response: "OK",
          litellm_cache_params: JSON.stringify({ type: "redis" }),
          health_check_cache_params: JSON.stringify({ host: "redis", port: 6379, redis_version: "7.2" }),
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "运行健康检查" })).toBeInTheDocument();
    expect(screen.getByText("摘要")).toBeInTheDocument();
    expect(screen.getByText("原始响应")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "缓存状态：健康"),
    ).toBeInTheDocument();
    expect(screen.getByText("缓存详情")).toBeInTheDocument();
    expect(screen.getByText("缓存配置")).toBeInTheDocument();
    expect(screen.getByText("Redis 详情")).toBeInTheDocument();
    expect(screen.getByText("Redis 主机")).toBeInTheDocument();
  });

  it("localizes Redis settings fields, actions, and validation", async () => {
    const user = userEvent.setup();
    render(<CacheSettings accessToken="test-token" userRole="Admin" userID="user-1" />);

    expect(await screen.findByText("缓存设置")).toBeInTheDocument();
    expect(screen.getByText("配置 LiteLLM 使用的 Redis 缓存")).toBeInTheDocument();
    expect(screen.getByText("Redis 类型")).toBeInTheDocument();
    expect(screen.getByText("连接设置")).toBeInTheDocument();
    expect(screen.getByText("Redis URL")).toBeInTheDocument();
    expect(screen.getByText("主机")).toBeInTheDocument();
    expect(screen.getByText("数据库索引")).toBeInTheDocument();
    expect(screen.getByText("高级设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();

    const port = screen.getByLabelText("端口");
    await user.clear(port);
    await user.type(port, "99999");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("端口必须是 1 到 65535 之间的整数")).toBeInTheDocument();
    expect(networkingMocks.updateCacheSettingsCall).not.toHaveBeenCalled();
  });
});
