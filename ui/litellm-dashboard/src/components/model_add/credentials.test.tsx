import { CredentialItem } from "@/components/networking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UploadProps } from "antd/es/upload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CredentialsPanel from "./credentials";
import i18n from "@/i18n/i18n";

const DEFAULT_UPLOAD_PROPS = {} as UploadProps;

const mockUseAuthorized = vi.fn();
const mockUseCredentials = vi.fn();

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => mockUseAuthorized(),
}));

vi.mock("@/app/(dashboard)/hooks/credentials/useCredentials", () => ({
  useCredentials: () => mockUseCredentials(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe("CredentialsPanel", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({
      data: { credentials: [] },
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /add credential/i })).toBeInTheDocument();
  });

  it("should display provided credentials", () => {
    const credentials: CredentialItem[] = [
      {
        credential_name: "openai-key",
        credential_values: {},
        credential_info: { custom_llm_provider: "openai" },
      },
    ];

    mockUseAuthorized.mockReturnValue({ accessToken: "test-token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({
      data: { credentials },
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("openai-key")).toBeInTheDocument();
  });

  it("should display empty state when no credentials are provided", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({
      data: { credentials: [] },
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("No credentials configured")).toBeInTheDocument();
  });

  it("should open add modal when add button is clicked", async () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({
      data: { credentials: [] },
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
      </QueryClientProvider>,
    );

    const addButton = screen.getByRole("button", { name: /add credential/i });

    act(() => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Add New Credential")).toBeInTheDocument();
    });
  });

  it("localizes the credential list and add workflow in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({
      data: { credentials: [] },
      refetch: vi.fn(),
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("配置不同 AI 提供商的凭证，并管理其 API 访问凭证。")).toBeInTheDocument();
    expect(screen.getByText("凭证名称")).toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("尚未配置凭证")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加凭证" }));

    expect(await screen.findByText("添加新凭证")).toBeInTheDocument();
    expect(screen.getByLabelText("凭证名称：")).toBeInTheDocument();
    expect(screen.getByLabelText("提供商：")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /取\s*消/ })).toBeInTheDocument();
  });

  describe("Admin Viewer write-action gating", () => {
    // Admin Viewer can VIEW credentials but must not be able to add / edit /
    // delete them. The page shows the credential list read-only.
    const credentials: CredentialItem[] = [
      {
        credential_name: "openai-key",
        credential_values: {},
        credential_info: { custom_llm_provider: "openai" },
      },
    ];

    it("hides the Add Credential button for Admin Viewer", () => {
      mockUseAuthorized.mockReturnValue({
        accessToken: "test-token",
        userRole: "Admin Viewer",
      });
      mockUseCredentials.mockReturnValue({
        data: { credentials },
        refetch: vi.fn(),
      });

      render(
        <QueryClientProvider client={createQueryClient()}>
          <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
        </QueryClientProvider>,
      );

      // Credential row still renders (read parity).
      expect(screen.getByText("openai-key")).toBeInTheDocument();
      // But no Add Credential button (write blocked).
      expect(screen.queryByRole("button", { name: /add credential/i })).not.toBeInTheDocument();
    });

    it("hides Edit / Delete buttons on existing credentials for Admin Viewer", () => {
      mockUseAuthorized.mockReturnValue({
        accessToken: "test-token",
        userRole: "Admin Viewer",
      });
      mockUseCredentials.mockReturnValue({
        data: { credentials },
        refetch: vi.fn(),
      });

      const { container } = render(
        <QueryClientProvider client={createQueryClient()}>
          <CredentialsPanel uploadProps={DEFAULT_UPLOAD_PROPS} />
        </QueryClientProvider>,
      );

      // The Actions cell should be empty (no edit/delete buttons rendered).
      // We rely on the row being visible but containing no `<button>`s in
      // the actions column — easier-to-read assertion: the entire panel
      // contains zero buttons in admin-viewer mode.
      expect(container.querySelectorAll("button").length).toBe(0);
    });
  });
});
