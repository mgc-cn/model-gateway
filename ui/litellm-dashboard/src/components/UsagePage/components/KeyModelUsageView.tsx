import { formatNumberWithCommas } from "@/utils/dataUtils";
import { BarChart, Card, Title } from "@tremor/react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import { TopModelData } from "../types";
import { useTranslation } from "react-i18next";

interface KeyModelUsageViewProps {
  topModels: TopModelData[];
}

const VISIBLE_ROWS = 5;
// antd Table with size="small" has a row height of ~39px
const ANTD_SMALL_TABLE_ROW_HEIGHT = 39;

const KeyModelUsageView: React.FC<KeyModelUsageViewProps> = ({ topModels }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"chart" | "table">("table");
  const columns: ColumnsType<TopModelData> = [
    { title: t("observability.usage.model"), dataIndex: "model", key: "model", render: (value) => value || "-" },
    {
      title: t("observability.usage.spendUsd"),
      dataIndex: "spend",
      key: "spend",
      render: (value) => `$${formatNumberWithCommas(value, 2)}`,
    },
    {
      title: t("observability.usage.successful"),
      dataIndex: "successful_requests",
      key: "successful_requests",
      render: (value) => <span className="text-green-600">{value?.toLocaleString() || 0}</span>,
    },
    {
      title: t("observability.usage.failed"),
      dataIndex: "failed_requests",
      key: "failed_requests",
      render: (value) => <span className="text-red-600">{value?.toLocaleString() || 0}</span>,
    },
    {
      title: t("observability.usage.tokens"),
      dataIndex: "tokens",
      key: "tokens",
      render: (value) => value?.toLocaleString() || 0,
    },
  ];

  if (topModels.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <Title>{t("observability.usage.modelUsage")}</Title>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === "table" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
          >
            {t("observability.usage.table")}
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === "chart" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
          >
            {t("observability.usage.chart")}
          </button>
        </div>
      </div>
      {viewMode === "chart" ? (
        <div className="max-h-[234px] overflow-y-auto">
          <BarChart
            style={{ height: topModels.length * 40 }}
            data={topModels.map((m) => ({ key: m.model, spend: m.spend }))}
            index="key"
            categories={["spend"]}
            colors={["cyan"]}
            valueFormatter={(value) => `$${formatNumberWithCommas(value, 2)}`}
            layout="vertical"
            yAxisWidth={180}
            tickGap={5}
            showLegend={false}
          />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={topModels}
          rowKey="model"
          size="small"
          pagination={false}
          scroll={topModels.length > VISIBLE_ROWS ? { y: VISIBLE_ROWS * ANTD_SMALL_TABLE_ROW_HEIGHT } : undefined}
        />
      )}
    </Card>
  );
};

export default KeyModelUsageView;
