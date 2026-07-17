import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import { modelCreateCall } from "../networking";
import NotificationManager from "../molecules/notifications_manager";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";

vi.mock("../networking", () => ({
  modelCreateCall: vi.fn(),
}));

vi.mock("../molecules/notifications_manager", () => ({
  default: {
    fromBackend: vi.fn(),
    success: vi.fn(),
  },
}));

describe("handleAddAutoRouterSubmit", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(modelCreateCall).mockResolvedValue({} as never);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("preserves the complexity-router payload and localizes success", async () => {
    const form = { resetFields: vi.fn() };
    const callback = vi.fn();

    await handleAddAutoRouterSubmit(
      {
        model_type: "complexity_router",
        auto_router_name: "smart-router",
        auto_router_default_model: "gpt-4",
        complexity_router_config: { tiers: { SIMPLE: "gpt-4o-mini", MEDIUM: "gpt-4" } },
        model_access_group: ["internal"],
      },
      "test-token",
      form,
      callback,
    );

    expect(modelCreateCall).toHaveBeenCalledWith("test-token", {
      model_name: "smart-router",
      litellm_params: {
        model: "auto_router/complexity_router",
        complexity_router_config: { tiers: { SIMPLE: "gpt-4o-mini", MEDIUM: "gpt-4" } },
        complexity_router_default_model: "gpt-4",
      },
      model_info: { access_groups: ["internal"] },
    });
    expect(NotificationManager.success).toHaveBeenCalledWith("已成功创建复杂度路由：smart-router");
    expect(form.resetFields).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("preserves semantic-router fields and custom embedding models", async () => {
    const form = { resetFields: vi.fn() };
    const config = {
      routes: [{ name: "gpt-4", description: "complex requests", utterances: ["analyze this"] }],
    };

    await handleAddAutoRouterSubmit(
      {
        model_type: "semantic_router",
        auto_router_name: "semantic-router",
        auto_router_default_model: "gpt-4o-mini",
        auto_router_config: config,
        auto_router_embedding_model: "custom",
        custom_embedding_model: "custom/embed-model",
        team_id: "team-1",
      },
      "test-token",
      form,
    );

    expect(modelCreateCall).toHaveBeenCalledWith("test-token", {
      model_name: "semantic-router",
      litellm_params: {
        model: "auto_router/semantic-router",
        auto_router_config: JSON.stringify(config),
        auto_router_default_model: "gpt-4o-mini",
        auto_router_embedding_model: "custom/embed-model",
      },
      model_info: { team_id: "team-1" },
    });
    expect(NotificationManager.success).toHaveBeenCalledWith("已成功创建语义路由：semantic-router");
  });

  it("localizes backend errors", async () => {
    vi.mocked(modelCreateCall).mockRejectedValue(new Error("request failed"));

    await handleAddAutoRouterSubmit(
      {
        model_type: "complexity_router",
        auto_router_name: "broken-router",
        complexity_router_config: { tiers: {} },
      },
      "test-token",
      { resetFields: vi.fn() },
    );

    expect(NotificationManager.fromBackend).toHaveBeenCalledWith("自动路由添加失败：Error: request failed");
  });
});
