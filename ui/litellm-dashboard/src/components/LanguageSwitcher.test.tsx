import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import i18n from "@/i18n/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  it("switches the interface language and persists the selection", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "Language" }));
    await user.click(await screen.findByText("Simplified Chinese"));

    await waitFor(() => expect(i18n.resolvedLanguage).toBe("zh-CN"));
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.cookie).toContain("litellm_locale=zh-CN");
    expect(screen.getByRole("button", { name: "语言" })).toHaveTextContent("简体中文");
  });
});
