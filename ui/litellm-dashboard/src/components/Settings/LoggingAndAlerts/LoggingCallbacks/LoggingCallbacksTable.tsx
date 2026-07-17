import { Button } from "@tremor/react";
import type { TableProps } from "antd";
import { Table } from "antd";
import Title from "antd/es/typography/Title";
import React from "react";
import TableIconActionButton from "../../../common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import { AlertingObject } from "./types";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/outline";

type LoggingCallbacksProps = {
  callbacks: AlertingObject[];
  availableCallbacks?: Record<
    string,
    {
      litellm_callback_name: string;
      litellm_callback_params: string[];
      ui_callback_name: string;
    }
  >;
  onTest?: (callback: AlertingObject) => void | Promise<void>;
  onEdit?: (callback: AlertingObject) => void;
  onDelete?: (callback: AlertingObject) => void;
  onAdd?: () => void;
};

type CallbackRow = AlertingObject & {
  id?: string;
  mode?: "success" | "failure" | "info" | string;
};

export const LoggingCallbacksTable: React.FC<LoggingCallbacksProps> = ({
  callbacks,
  availableCallbacks = {},
  onTest = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onAdd = () => {},
}) => {
  const { t } = useTranslation();
  const callbackModes = [
    { value: "success", label: t("loggingAndAlerts.modes.success") },
    { value: "failure", label: t("loggingAndAlerts.modes.failure") },
    { value: "success_and_failure", label: t("loggingAndAlerts.modes.both") },
  ];
  const columns: TableProps<CallbackRow>["columns"] = [
    {
      title: <span className="font-medium text-gray-700">{t("loggingAndAlerts.columns.callbackName")}</span>,
      dataIndex: "name",
      key: "name",
      render: (_: string, record: CallbackRow) => {
        const id = record.name;
        const displayName = availableCallbacks[id]?.ui_callback_name || id;
        return <div className="font-medium text-gray-800">{displayName}</div>;
      },
    },
    {
      title: <span className="font-medium text-gray-700">{t("loggingAndAlerts.columns.mode")}</span>,
      key: "mode",
      render: (_: unknown, record: CallbackRow) => {
        // Backend sends `type` (success | failure); legacy in-memory rows
        // from add-callback flow set `mode`. Read both so newly-added rows
        // and server-fetched rows both render correctly.
        const mode = record.type || record.mode || "success";
        const label = callbackModes.find((m) => m.value === mode)?.label || mode;
        const badgeClass =
          mode === "success"
            ? "bg-green-100 text-green-800"
            : mode === "failure"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800";
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {label}
          </span>
        );
      },
      width: 240,
    },
    {
      title: (
        <span className="font-medium text-gray-700 text-right w-full block">
          {t("loggingAndAlerts.columns.actions")}
        </span>
      ),
      key: "actions",
      align: "right",
      render: (_: unknown, record: CallbackRow) => (
        <div className="flex justify-end gap-2">
          <TableIconActionButton
            variant="Test"
            tooltipText={t("loggingAndAlerts.actions.test")}
            onClick={() => onTest(record)}
          />
          <TableIconActionButton
            variant="Edit"
            tooltipText={t("loggingAndAlerts.actions.edit")}
            onClick={() => onEdit(record)}
          />
          <TableIconActionButton
            variant="Delete"
            tooltipText={t("loggingAndAlerts.actions.delete")}
            onClick={() => onDelete(record)}
          />
        </div>
      ),
      width: 240,
    },
  ];
  return (
    <>
      <div className="w-full mt-4">
        <Button icon={PlusIcon} onClick={onAdd} className="mx-auto">
          {t("loggingAndAlerts.addCallback")}
        </Button>
        <div className="flex justify-between items-center my-2">
          <Title level={4}>{t("loggingAndAlerts.activeCallbacks")}</Title>
        </div>
        {/* Empty state */}
        {callbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">{t("loggingAndAlerts.empty.title")}</h3>
              <p className="text-gray-500">{t("loggingAndAlerts.empty.description")}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table
              columns={columns}
              dataSource={callbacks as CallbackRow[]}
              // `generic_api` can appear as both a success and a failure
              // callback simultaneously — keying by `name` alone produced
              // duplicate React keys. Compose with type to keep keys unique.
              rowKey={(record) => `${record.name}-${record.type || record.mode || "success"}`}
              pagination={false}
              rowClassName={() => "hover:bg-gray-50"}
            />
          </div>
        )}
      </div>
    </>
  );
};
