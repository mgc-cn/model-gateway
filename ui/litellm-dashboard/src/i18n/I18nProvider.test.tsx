import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "./i18n";
import I18nProvider from "./I18nProvider";

function ImperativeTranslation() {
  return <span>{i18n.t("onboarding.error.title")}</span>;
}

describe("I18nProvider", () => {
  afterEach(async () => {
    document.cookie = "litellm_locale=; Max-Age=0; Path=/";
    await i18n.changeLanguage("en");
  });

  it("restores the cookie locale before mounting the application tree", async () => {
    await i18n.changeLanguage("en");
    document.cookie = "litellm_locale=zh-CN; Path=/";

    render(
      <I18nProvider>
        <ImperativeTranslation />
      </I18nProvider>,
    );

    expect(await screen.findByText("邀请加载失败")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh-CN");
  });
});
