import React from "react";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";

export function OnboardingErrorView() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert
        type="error"
        message={t("onboarding.error.title")}
        description={t("onboarding.error.description")}
        showIcon
      />
      <div className="mt-4">
        <Button href="/ui/login">{t("onboarding.error.backToLogin")}</Button>
      </div>
    </div>
  );
}
