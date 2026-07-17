import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import CloudZeroEmptyPlaceholder from "./CloudZeroCostTracking/CloudZeroEmptyPlaceholder";
import DynamicForm from "./alerting/dynamic_form";
import EmailSettings from "./email_settings";
import EmailEventSettings from "./email_events/email_event_settings";

const networkingMocks = vi.hoisted(() => ({
  getEmailEventSettings: vi.fn(),
  updateEmailEventSettings: vi.fn(),
  resetEmailEventSettings: vi.fn(),
}));

vi.mock("./email_events", () => ({
  EmailEventSettings: () => <div data-testid="email-event-settings" />,
}));

vi.mock("./networking", () => ({
  ...networkingMocks,
  setCallbacksCall: vi.fn(),
  serviceHealthCheck: vi.fn(),
}));

describe("logging and alerts Chinese localization", () => {
  beforeEach(async () => {
    networkingMocks.getEmailEventSettings.mockResolvedValue({
      settings: [
        { event: "Virtual Key Created", enabled: true },
        { event: "New User Invitation", enabled: false },
      ],
    });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the CloudZero empty state", () => {
    render(<CloudZeroEmptyPlaceholder startCreation={vi.fn()} />);

    expect(screen.getByText("尚未配置 CloudZero 集成")).toBeInTheDocument();
    expect(screen.getByText("连接 CloudZero 账户，直接从 LiteLLM 跟踪和分析模型调用成本。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 CloudZero 集成" })).toBeInTheDocument();
  });

  it("localizes dynamic alerting metadata while preserving the config key", () => {
    render(
      <DynamicForm
        alertingSettings={[
          {
            field_name: "slack_alerting",
            field_description: "Backend-provided English description",
            field_type: "Boolean",
            field_value: true,
            stored_in_db: false,
            premium_field: false,
          },
        ]}
        handleInputChange={vi.fn()}
        handleResetField={vi.fn()}
        handleSubmit={vi.fn()}
        premiumUser
      />,
    );

    expect(screen.getByText("Slack 告警")).toBeInTheDocument();
    expect(screen.getByText("slack_alerting")).toBeInTheDocument();
    expect(screen.getByText("启用生产环境网关的 Slack 告警，包括模型中断、预算和消费追踪异常。")).toBeInTheDocument();
    expect(screen.queryByText("Backend-provided English description")).not.toBeInTheDocument();
    expect(screen.getByText("来自配置文件")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新设置" })).toBeInTheDocument();
  });

  it("localizes SMTP settings and keeps environment variable names visible", () => {
    render(
      <EmailSettings
        accessToken="test-token"
        premiumUser
        alerts={[
          {
            name: "email",
            variables: {
              SMTP_HOST: "smtp.example.com",
              EMAIL_LOGO_URL: "https://example.com/logo.png",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("邮件服务器设置")).toBeInTheDocument();
    expect(screen.getByText("SMTP 服务器地址")).toBeInTheDocument();
    expect(screen.getByText("SMTP_HOST")).toBeInTheDocument();
    expect(screen.getByText("输入 SMTP 服务器地址，例如 smtp.resend.com。")).toBeInTheDocument();
    expect(screen.getByText("邮件徽标 URL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试邮件告警" })).toBeInTheDocument();
  });

  it("localizes email event names and descriptions loaded from the API", async () => {
    render(<EmailEventSettings accessToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText("创建虚拟密钥")).toBeInTheDocument();
    });
    expect(screen.getByText("使用用户 ID 创建新虚拟密钥时，向该用户发送邮件。")).toBeInTheDocument();
    expect(screen.getByText("新用户邀请")).toBeInTheDocument();
    expect(screen.getByText("创建新用户时，向该用户的邮箱地址发送邀请邮件。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "恢复默认设置" })).toBeInTheDocument();
  });
});
