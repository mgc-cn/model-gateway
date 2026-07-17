import { Badge } from "antd";
import { useDisableShowNewBadge } from "@/app/(dashboard)/hooks/useDisableShowNewBadge";
import { useTranslation } from "react-i18next";

export default function NewBadge({ children, dot = false }: { children?: React.ReactNode; dot?: boolean }) {
  const { t } = useTranslation();
  const disableShowNewBadge = useDisableShowNewBadge();

  if (disableShowNewBadge) {
    return children ? <>{children}</> : null;
  }

  return children ? (
    <Badge color="blue" count={dot ? undefined : t("common.new")} dot={dot}>
      {children}
    </Badge>
  ) : (
    <Badge color="blue" count={dot ? undefined : t("common.new")} dot={dot} />
  );
}
