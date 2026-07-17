import { renderWithProviders, screen } from "../../../tests/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import ComplexityRouterConfig from "./ComplexityRouterConfig";
import i18n from "@/i18n/i18n";

const mockModelInfo = [
  { model_group: "gpt-4" },
  { model_group: "gpt-3.5-turbo" },
  { model_group: "claude-3-opus" },
] as any[];

const defaultTiers = {
  SIMPLE: "gpt-3.5-turbo",
  MEDIUM: "gpt-3.5-turbo",
  COMPLEX: "gpt-4",
  REASONING: "claude-3-opus",
};

describe("ComplexityRouterConfig", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("should render", () => {
    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);
    expect(screen.getByText("Complexity Tier Configuration")).toBeInTheDocument();
  });

  it("should display all four tier labels", () => {
    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);
    expect(screen.getByText("Simple Tier")).toBeInTheDocument();
    expect(screen.getByText("Medium Tier")).toBeInTheDocument();
    expect(screen.getByText("Complex Tier")).toBeInTheDocument();
    expect(screen.getByText("Reasoning Tier")).toBeInTheDocument();
  });

  it("should show example queries for each tier", () => {
    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);
    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
    expect(screen.getByText(/Explain how REST APIs work/)).toBeInTheDocument();
    expect(screen.getByText(/Design a microservices architecture/)).toBeInTheDocument();
    expect(screen.getByText(/Think step by step/)).toBeInTheDocument();
  });

  it("should display the how classification works section", () => {
    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);
    expect(screen.getByText("How Classification Works")).toBeInTheDocument();
  });

  it("should show score thresholds in the classification section", () => {
    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);
    expect(screen.getByText(/Score < 0.15/)).toBeInTheDocument();
    expect(screen.getByText(/Score 0.15 - 0.35/)).toBeInTheDocument();
    expect(screen.getByText(/Score 0.35 - 0.60/)).toBeInTheDocument();
    expect(screen.getByText(/Score > 0.60/)).toBeInTheDocument();
  });

  it("localizes the complete complexity configuration in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    renderWithProviders(<ComplexityRouterConfig modelInfo={mockModelInfo} value={defaultTiers} onChange={vi.fn()} />);

    expect(screen.getByText("复杂度分层配置")).toBeInTheDocument();
    expect(screen.getByText("简单 层级")).toBeInTheDocument();
    expect(screen.getByText("中等 层级")).toBeInTheDocument();
    expect(screen.getByText("复杂 层级")).toBeInTheDocument();
    expect(screen.getByText("推理 层级")).toBeInTheDocument();
    expect(screen.getByText("分类方式")).toBeInTheDocument();
    expect(screen.getByText(/Token 数/)).toBeInTheDocument();
    expect(screen.getByText(/评分 > 0.60/)).toBeInTheDocument();
  });
});
