import React from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useTranslation } from "react-i18next";

type OnboardingFormBodyProps = {
  variant: "signup" | "reset_password";
  userEmail: string;
  isPending: boolean;
  claimError: string | null;
  onSubmit: (values: { password: string }) => void;
};

export function OnboardingFormBody({ variant, userEmail, isPending, claimError, onSubmit }: OnboardingFormBodyProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (userEmail) form.setFieldValue("user_email", userEmail);
  }, [userEmail, form]);

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Card>
        <Typography.Title level={5} className="text-center mb-5">
          🚅 LiteLLM
        </Typography.Title>
        <Typography.Title level={3}>
          {t(variant === "reset_password" ? "onboarding.reset.title" : "onboarding.signup.title")}
        </Typography.Title>
        <Typography.Text>
          {t(variant === "reset_password" ? "onboarding.reset.description" : "onboarding.signup.description")}
        </Typography.Text>

        {variant === "signup" && (
          <Alert
            className="mt-4"
            type="info"
            message="SSO"
            description={
              <div className="flex justify-between items-center">
                <span>{t("onboarding.sso.enterprise")}</span>
                <Button type="primary" size="small" href="https://forms.gle/W3U4PZpJGFHWtHyA9" target="_blank">
                  {t("onboarding.sso.trial")}
                </Button>
              </div>
            }
            showIcon
          />
        )}

        <Form
          className="mt-10 mb-5"
          layout="vertical"
          form={form}
          onFinish={(values) => onSubmit({ password: values.password })}
        >
          <Form.Item label={t("onboarding.email")} name="user_email">
            <Input type="email" disabled />
          </Form.Item>

          <Form.Item
            label={t("onboarding.password")}
            name="password"
            rules={[{ required: true, message: t("onboarding.passwordRequired") }]}
            help={t(variant === "reset_password" ? "onboarding.reset.passwordHelp" : "onboarding.signup.passwordHelp")}
          >
            <Input.Password />
          </Form.Item>

          {claimError && <Alert type="error" message={claimError} showIcon className="mb-4" />}

          <div className="mt-10">
            <Button htmlType="submit" loading={isPending}>
              {t(variant === "reset_password" ? "onboarding.reset.submit" : "onboarding.signup.submit")}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
