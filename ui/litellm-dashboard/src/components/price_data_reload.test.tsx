/* @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import PriceDataReload from "./price_data_reload";
import {
  cancelModelCostMapReload,
  getModelCostMapReloadStatus,
  getModelCostMapSource,
  reloadModelCostMap,
  scheduleModelCostMapReload,
} from "./networking";

vi.mock("./networking", () => ({
  cancelModelCostMapReload: vi.fn(),
  getModelCostMapReloadStatus: vi.fn(),
  getModelCostMapSource: vi.fn(),
  reloadModelCostMap: vi.fn(),
  scheduleModelCostMapReload: vi.fn(),
}));

describe("PriceDataReload", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(getModelCostMapReloadStatus).mockResolvedValue({
      scheduled: false,
      interval_hours: null,
      last_run: null,
      next_run: null,
    });
    vi.mocked(getModelCostMapSource).mockResolvedValue({
      source: "remote",
      url: "https://example.com/model_prices.json",
      is_env_forced: false,
      fallback_reason: null,
      model_count: 2963,
    });
    vi.mocked(reloadModelCostMap).mockResolvedValue({ status: "success", models_count: 2963 });
    vi.mocked(scheduleModelCostMapReload).mockResolvedValue({ status: "success" });
    vi.mocked(cancelModelCostMapReload).mockResolvedValue({ status: "success" });
  });

  it("renders the complete price data state in Simplified Chinese", async () => {
    render(<PriceDataReload accessToken="test-token" />);

    expect(await screen.findByText("价格数据来源")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重新加载价格数据$/ })).toBeInTheDocument();
    expect(screen.getByText("远程")).toBeInTheDocument();
    expect(screen.getByText("已加载模型数：")).toBeInTheDocument();
    expect(screen.getByText("未配置定时重载")).toBeInTheDocument();
    expect(screen.getByText("从未")).toBeInTheDocument();
  });

  it("localizes the periodic reload dialog", async () => {
    const user = userEvent.setup();
    render(<PriceDataReload accessToken="test-token" />);

    await screen.findByText("价格数据来源");
    await user.click(screen.getByRole("button", { name: /配置定时重载$/ }));

    expect(await screen.findByRole("dialog", { name: "配置定时重载" })).toBeInTheDocument();
    expect(screen.getByText("设置价格数据自动重载间隔：")).toBeInTheDocument();
    expect(screen.getByText("系统将每 6 小时自动从远程来源获取最新价格数据。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建计划" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
  });
});
