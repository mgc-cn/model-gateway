import React from "react";
import { Card, Text, Grid, Button, TextInput, TableCell } from "@tremor/react";
import { Typography } from "antd";
import NotificationManager from "./molecules/notifications_manager";
import { serviceHealthCheck, setCallbacksCall } from "./networking";
import { EmailEventSettings } from "./email_events";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

interface EmailSettingsProps {
  accessToken: string | null;
  premiumUser: boolean;
  alerts: any[];
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ accessToken, premiumUser, alerts }) => {
  const { t, i18n } = useTranslation();
  const isChinese = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const requiredFields = new Set([
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_SENDER_EMAIL",
    "TEST_EMAIL_ADDRESS",
  ]);

  const handleSaveEmailSettings = async () => {
    if (!accessToken) {
      return;
    }

    let updatedVariables: Record<string, string> = {};

    alerts
      .filter((alert) => alert.name === "email")
      .forEach((alert) => {
        Object.entries(alert.variables ?? {}).forEach(([key, value]) => {
          const inputElement = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
          if (inputElement && inputElement.value) {
            updatedVariables[key] = inputElement?.value;
          }
        });
      });

    //filter out null / undefined values for updatedVariables

    const payload = {
      general_settings: {
        alerting: ["email"],
      },
      environment_variables: updatedVariables,
    };
    try {
      await setCallbacksCall(accessToken, payload);
      NotificationManager.success(t("loggingAndAlerts.email.notifications.settingsUpdated"));
    } catch (error) {
      NotificationManager.fromBackend(error);
    }
  };

  return (
    <>
      <div className="mt-6 mb-6">
        <EmailEventSettings accessToken={accessToken} />
      </div>
      <Card>
        <Title level={4}>{t("loggingAndAlerts.email.serverTitle")}</Title>
        <Text>
          <a href="https://docs.litellm.ai/docs/proxy/email" target="_blank" style={{ color: "blue" }}>
            {" "}
            {t("loggingAndAlerts.email.docs")}
          </a>{" "}
          <br />
        </Text>

        <div className="flex w-full">
          {alerts
            .filter((alert) => alert.name === "email")
            .map((alert, index) => (
              <TableCell key={index}>
                <ul>
                  <Grid numItems={2}>
                    {Object.entries(alert.variables ?? {}).map(([key, value]) => (
                      <li key={key} className="mx-2 my-2">
                        {premiumUser != true && (key === "EMAIL_LOGO_URL" || key === "EMAIL_SUPPORT_CONTACT") ? (
                          <div>
                            <a href="https://forms.gle/W3U4PZpJGFHWtHyA9" target="_blank">
                              <Text className="mt-2">
                                ✨{" "}
                                {isChinese
                                  ? t(`loggingAndAlerts.email.fields.${key}.label`, { defaultValue: key })
                                  : key}
                              </Text>
                            </a>
                            <TextInput
                              name={key}
                              defaultValue={value as string}
                              type="password"
                              disabled={true}
                              style={{ width: "400px" }}
                            />
                          </div>
                        ) : (
                          <div>
                            <Text className="mt-2">
                              {isChinese ? t(`loggingAndAlerts.email.fields.${key}.label`, { defaultValue: key }) : key}
                            </Text>
                            {isChinese && <code className="block text-xs text-gray-500">{key}</code>}
                            <TextInput
                              name={key}
                              defaultValue={value as string}
                              type="password"
                              style={{ width: "400px" }}
                            />
                          </div>
                        )}

                        <div style={{ fontSize: "small", fontStyle: "italic", color: "gray" }}>
                          {t(`loggingAndAlerts.email.fields.${key}.description`, { defaultValue: "" })}
                          {requiredFields.has(key) && (
                            <span style={{ color: "red" }}> {t("loggingAndAlerts.email.required")} </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </Grid>
                </ul>
              </TableCell>
            ))}
        </div>

        <Button className="mt-2" onClick={() => handleSaveEmailSettings()}>
          {t("loggingAndAlerts.email.saveChanges")}
        </Button>
        <Button
          onClick={async () => {
            if (!accessToken) return;
            try {
              await serviceHealthCheck(accessToken, "email");
              NotificationManager.success(t("loggingAndAlerts.email.notifications.testTriggered"));
            } catch (error) {
              NotificationManager.fromBackend(error);
            }
          }}
          className="mx-2"
        >
          {t("loggingAndAlerts.email.testAlerts")}
        </Button>
      </Card>
    </>
  );
};

export default EmailSettings;
