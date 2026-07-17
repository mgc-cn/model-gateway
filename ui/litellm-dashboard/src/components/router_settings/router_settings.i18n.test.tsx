import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import RouterSettingsForm from "./RouterSettingsForm";
import RoutingGroupModal from "../routing_groups/RoutingGroupModal";
import { FallbackGroupConfig } from "../Settings/RouterSettings/Fallbacks/FallbackGroupConfig";

describe("router settings Chinese localization", () => {
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

  it("localizes load balancing fields and backend metadata", () => {
    render(
      <RouterSettingsForm
        value={{
          routerSettings: {
            routing_strategy_args: { ttl: 3600, lowest_latency_buffer: 0 },
            num_retries: 3,
          },
          selectedStrategy: "latency-based-routing",
          enableTagFiltering: false,
        }}
        onChange={vi.fn()}
        routerFieldsMetadata={{
          routing_strategy: {
            ui_field_name: "Routing Strategy",
            field_description: "Routing strategy from backend",
          },
          enable_tag_filtering: {
            ui_field_name: "Enable Tag Filtering",
            field_description: "Tag filtering from backend",
          },
          num_retries: {
            ui_field_name: "Number of Retries",
            field_description: "Retries from backend",
          },
        }}
        availableRoutingStrategies={["simple-shuffle", "latency-based-routing"]}
        routingStrategyDescriptions={{
          "simple-shuffle": "Randomly picks a deployment",
          "latency-based-routing": "Routes to the lowest latency deployment",
        }}
      />,
    );

    expect(screen.getByText("路由设置")).toBeInTheDocument();
    expect(screen.getByText("路由策略")).toBeInTheDocument();
    expect(screen.getByText("启用标签过滤")).toBeInTheDocument();
    expect(screen.getByText("延迟路由配置")).toBeInTheDocument();
    expect(screen.getByText("统计窗口（ttl）")).toBeInTheDocument();
    expect(screen.getByText("可靠性与重试")).toBeInTheDocument();
    expect(screen.getByText("重试次数")).toBeInTheDocument();
    expect(screen.queryByText("Routing strategy from backend")).not.toBeInTheDocument();
  });

  it("localizes the routing group creation workflow", () => {
    render(
      <RoutingGroupModal
        open
        mode="create"
        initialValue={null}
        availableStrategies={["simple-shuffle"]}
        strategyDescriptions={{ "simple-shuffle": "Randomly picks a deployment" }}
        modelOptions={["gpt-4"]}
        existingGroupNames={[]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "创建路由组" })).toBeInTheDocument();
    expect(screen.getByLabelText("路由组名称")).toBeInTheDocument();
    expect(
      screen.getByText("API 调用时将此名称作为模型名，LiteLLM 会把请求路由到组内的某个模型。"),
    ).toBeInTheDocument();
    expect(screen.getByText("未加入任何路由组的模型将使用代理的顶层路由策略。")).toBeInTheDocument();
  });

  it("localizes fallback-chain configuration", () => {
    render(
      <FallbackGroupConfig
        group={{ id: "1", primaryModel: null, fallbackModels: [] }}
        onChange={vi.fn()}
        availableModels={["gpt-4", "claude-3"]}
        maxFallbacks={10}
      />,
    );

    expect(screen.getByText("主模型")).toBeInTheDocument();
    expect(screen.getByText("选择主模型后即可配置回退链")).toBeInTheDocument();
    expect(screen.getByText("失败后依次尝试")).toBeInTheDocument();
    expect(screen.getByText("回退链")).toBeInTheDocument();
    expect(screen.getByText("尚未选择回退模型")).toBeInTheDocument();
  });
});
