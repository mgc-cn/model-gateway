"use client";

import { Button } from "antd";
import { useTranslation } from "react-i18next";
import LoadingScreen from "./LoadingScreen";

type RouteStatusKind = "loading" | "error" | "accessDenied" | "notFound";

interface RouteStatusProps {
  kind: RouteStatusKind;
  onRetry?: () => void;
}

const statusKeys = {
  error: ["common.routeStatus.errorTitle", "common.routeStatus.errorDescription"],
  accessDenied: ["common.routeStatus.accessDeniedTitle", "common.routeStatus.accessDeniedDescription"],
  notFound: ["common.routeStatus.notFoundTitle", "common.routeStatus.notFoundDescription"],
} as const;

export default function RouteStatus({ kind, onRetry }: RouteStatusProps) {
  const { t } = useTranslation();

  if (kind === "loading") return <LoadingScreen />;

  const [titleKey, descriptionKey] = statusKeys[kind];
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6" role="status">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-gray-900">{t(titleKey)}</h1>
        <p className="mt-2 text-sm text-gray-600">{t(descriptionKey)}</p>
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
