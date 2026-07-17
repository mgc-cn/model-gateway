import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "./i18n";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";
import SSOSettingsEmptyPlaceholder from "@/components/Settings/AdminSettings/SSOSettings/SSOSettingsEmptyPlaceholder";
import PricingCalculator from "@/app/(dashboard)/cost-tracking/components/pricing_calculator";
import SCIMConfig from "@/components/SCIM";
import HashicorpVaultEmptyPlaceholder from "@/components/Settings/AdminSettings/HashicorpVault/HashicorpVaultEmptyPlaceholder";

const resourceKeys = (value: object, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null ? resourceKeys(child, path) : [path];
  });

describe("admin and cost tracking Chinese localization", () => {
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

  it("keeps the localized resource trees aligned", () => {
    expect(resourceKeys(zhCN.adminSettings)).toEqual(resourceKeys(en.adminSettings));
    expect(resourceKeys(zhCN.costTracking)).toEqual(resourceKeys(en.costTracking));
  });

  it("localizes the SSO empty state", () => {
    render(<SSOSettingsEmptyPlaceholder onAdd={() => undefined} />);

    expect(screen.getByText("尚未配置 SSO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "配置 SSO" })).toBeInTheDocument();
  });

  it("localizes SCIM configuration", () => {
    render(<SCIMConfig accessToken={null} userID={null} proxySettings={{ PROXY_BASE_URL: "http://localhost:4000" }} />);

    expect(screen.getByText("SCIM 配置")).toBeInTheDocument();
    expect(screen.getByText("SCIM 租户地址")).toBeInTheDocument();
    expect(screen.getByText("身份验证令牌")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /创建 SCIM 令牌/ })).toBeInTheDocument();
  });

  it("localizes the Vault empty state", () => {
    render(<HashicorpVaultEmptyPlaceholder onAdd={() => undefined} />);

    expect(screen.getByText("尚未配置 Vault")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "配置 Vault" })).toBeInTheDocument();
  });

  it("localizes the pricing calculator", () => {
    render(<PricingCalculator accessToken="token" models={[]} />);

    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.getByText("输入令牌数")).toBeInTheDocument();
    expect(screen.getByText("每月请求数")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加另一个模型/ })).toBeInTheDocument();
    expect(screen.getByText("请在上方选择模型以查看成本估算")).toBeInTheDocument();
  });
});
