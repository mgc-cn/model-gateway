import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdvancedSettings from "./advanced_settings";
import i18n from "@/i18n/i18n";

vi.mock("../vector_store_management/VectorStoreSelector", () => ({
  default: ({ placeholder }: { placeholder: string }) => <input placeholder={placeholder} readOnly />,
}));

describe("AdvancedSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should render", () => {
    render(
      <AdvancedSettings
        showAdvancedSettings={true}
        setShowAdvancedSettings={() => {}}
        guardrailsList={[]}
        tagsList={{}}
        accessToken="test-token"
      />,
    );
  });

  it("localizes advanced settings in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { getByText } = render(
      <AdvancedSettings
        showAdvancedSettings={true}
        setShowAdvancedSettings={() => {}}
        guardrailsList={[]}
        tagsList={{}}
        accessToken="test-token"
      />,
    );

    fireEvent.click(getByText("高级设置"));

    await waitFor(() => {
      expect(getByText("自定义价格")).toBeInTheDocument();
      expect(getByText("关联知识库（RAG）")).toBeInTheDocument();
      expect(getByText("安全护栏")).toBeInTheDocument();
      expect(getByText("LiteLLM 参数")).toBeInTheDocument();
      expect(getByText("模型信息")).toBeInTheDocument();
    });
  });

  it("should render tags list", async () => {
    const { getByText } = render(
      <AdvancedSettings
        showAdvancedSettings={true}
        setShowAdvancedSettings={() => {}}
        guardrailsList={[]}
        tagsList={{}}
        accessToken="test-token"
      />,
    );
    fireEvent.click(getByText("Advanced Settings"));
    await waitFor(() => {
      expect(getByText("Tags")).toBeInTheDocument();
    });
  });

  it("should render the litellm params", async () => {
    const { getByText } = render(
      <AdvancedSettings
        showAdvancedSettings={true}
        setShowAdvancedSettings={() => {}}
        guardrailsList={[]}
        tagsList={{}}
        accessToken="test-token"
      />,
    );
    act(() => {
      fireEvent.click(getByText("Advanced Settings"));
    });
    await waitFor(() => {
      expect(getByText("LiteLLM Params")).toBeInTheDocument();
    });
  });
});
