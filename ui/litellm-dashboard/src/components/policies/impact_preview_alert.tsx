import React from "react";
import { Alert, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface ImpactResult {
  affected_keys_count: number;
  affected_teams_count: number;
  sample_keys: string[];
  sample_teams: string[];
}

interface ImpactPreviewAlertProps {
  impactResult: ImpactResult;
}

const ImpactPreviewAlert: React.FC<ImpactPreviewAlertProps> = ({ impactResult }) => {
  const { t } = useTranslation();
  return (
    <Alert
      type={impactResult.affected_keys_count === -1 ? "warning" : "info"}
      showIcon
      className="mb-4"
      message={t("policyManagement.impact.preview")}
      description={
        impactResult.affected_keys_count === -1 ? (
          <Text>
            {t("policyManagement.impact.globalPrefix")} <strong>{t("policyManagement.impact.allKeysTeams")}</strong>.
          </Text>
        ) : (
          <div>
            <Text>
              {t("policyManagement.impact.affectsPrefix")}{" "}
              <strong>{t("policyManagement.impact.keyCount", { count: impactResult.affected_keys_count })}</strong>{" "}
              {t("policyManagement.impact.and")}{" "}
              <strong>{t("policyManagement.impact.teamCount", { count: impactResult.affected_teams_count })}</strong>.
            </Text>
            {impactResult.sample_keys.length > 0 && (
              <div className="mt-1">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("policyManagement.fields.keys")}:{" "}
                </Text>
                {impactResult.sample_keys.slice(0, 5).map((k: string) => (
                  <Tag key={k} style={{ fontSize: 11 }}>
                    {k}
                  </Tag>
                ))}
                {impactResult.affected_keys_count > 5 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t("policyManagement.impact.more", { count: impactResult.affected_keys_count - 5 })}
                  </Text>
                )}
              </div>
            )}
            {impactResult.sample_teams.length > 0 && (
              <div className="mt-1">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("policyManagement.fields.teams")}:{" "}
                </Text>
                {impactResult.sample_teams.slice(0, 5).map((t: string) => (
                  <Tag key={t} style={{ fontSize: 11 }}>
                    {t}
                  </Tag>
                ))}
                {impactResult.affected_teams_count > 5 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t("policyManagement.impact.more", { count: impactResult.affected_teams_count - 5 })}
                  </Text>
                )}
              </div>
            )}
          </div>
        )
      }
    />
  );
};

export default ImpactPreviewAlert;
