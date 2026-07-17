/**
 * The parent pane, showing list of budgets
 *
 */

import {
  Button,
  Card,
  Tab,
  TabGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  TabPanel,
  TabPanels,
  Text,
} from "@tremor/react";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import TableIconActionButton from "@/components/common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { useBudgets, useDeleteBudget, budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import BudgetModal from "./budget_modal";
import EditBudgetModal from "./edit_budget_modal";
import { CREATE_END_USER_CURL_COMMAND, CHAT_COMPLETIONS_CURL_COMMAND, OPENAI_SDK_PYTHON_CODE } from "./constants";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { isProxyAdminRole } from "@/utils/roles";
import { useTranslation } from "react-i18next";

interface BudgetSettingsPageProps {
  accessToken: string | null;
}

const BudgetPanel: React.FC<BudgetSettingsPageProps> = ({ accessToken }) => {
  const { t } = useTranslation();
  const [isCreateModelVisible, setIsCreateModelVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<budgetItem | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { userRole } = useAuthorized();
  // Admin Viewer follows the read-parity rule: see budgets, no writes.
  const canModify = isProxyAdminRole(userRole ?? "");

  const { data: budgetList = [] } = useBudgets();
  const deleteBudget = useDeleteBudget();

  const handleEditCall = async (budget: budgetItem) => {
    if (accessToken == null) {
      return;
    }
    setSelectedBudget(budget);
    setIsEditModalVisible(true);
  };

  const handleDeleteClick = (budget: budgetItem) => {
    setSelectedBudget(budget);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBudget || accessToken == null) {
      return;
    }
    try {
      await deleteBudget.mutateAsync(selectedBudget.budget_id);
      NotificationsManager.success(t("budgetManagement.notifications.deleted"));
    } catch (error) {
      console.error("Error deleting budget:", error);
      if (typeof NotificationsManager.fromBackend === "function") {
        NotificationsManager.fromBackend(t("budgetManagement.notifications.deleteFailed"));
      } else {
        NotificationsManager.info(t("budgetManagement.notifications.deleteFailed"));
      }
    } finally {
      setIsDeleteModalVisible(false);
      setSelectedBudget(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      {canModify && (
        <Button size="sm" variant="primary" className="mb-2" onClick={() => setIsCreateModelVisible(true)}>
          {t("budgetManagement.createButton")}
        </Button>
      )}
      <TabGroup>
        <TabList>
          <Tab>{t("budgetManagement.tabs.budgets")}</Tab>
          <Tab>{t("budgetManagement.tabs.examples")}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="mt-6">
              {isCreateModelVisible && <BudgetModal isModalVisible setIsModalVisible={setIsCreateModelVisible} />}
              {selectedBudget && isEditModalVisible && (
                <EditBudgetModal
                  isModalVisible
                  setIsModalVisible={setIsEditModalVisible}
                  existingBudget={selectedBudget}
                />
              )}
              <Card>
                <Text>{t("budgetManagement.description")}</Text>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t("budgetManagement.fields.budgetId")}</TableHeaderCell>
                      <TableHeaderCell>{t("budgetManagement.fields.maxBudget")}</TableHeaderCell>
                      <TableHeaderCell>TPM</TableHeaderCell>
                      <TableHeaderCell>RPM</TableHeaderCell>
                      {canModify && <TableHeaderCell>{t("budgetManagement.fields.actions")}</TableHeaderCell>}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {budgetList
                      .slice()
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .map((value: budgetItem) => (
                        <TableRow key={value.budget_id}>
                          <TableCell>{value.budget_id}</TableCell>
                          <TableCell>{value.max_budget ? value.max_budget : "n/a"}</TableCell>
                          <TableCell>{value.tpm_limit ? value.tpm_limit : "n/a"}</TableCell>
                          <TableCell>{value.rpm_limit ? value.rpm_limit : "n/a"}</TableCell>
                          {canModify && (
                            <TableCell>
                              <TableIconActionButton
                                variant="Edit"
                                tooltipText={t("budgetManagement.actions.edit")}
                                onClick={() => handleEditCall(value)}
                                dataTestId="edit-budget-button"
                              />
                              <TableIconActionButton
                                variant="Delete"
                                tooltipText={t("budgetManagement.actions.delete")}
                                onClick={() => handleDeleteClick(value)}
                                dataTestId="delete-budget-button"
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
              <DeleteResourceModal
                isOpen={isDeleteModalVisible}
                title={t("budgetManagement.delete.title")}
                message={t("budgetManagement.delete.message")}
                resourceInformationTitle={t("budgetManagement.delete.resourceTitle")}
                resourceInformation={[
                  { label: t("budgetManagement.fields.budgetId"), value: selectedBudget?.budget_id, code: true },
                  { label: t("budgetManagement.fields.maxBudget"), value: selectedBudget?.max_budget },
                  { label: "TPM", value: selectedBudget?.tpm_limit },
                  { label: "RPM", value: selectedBudget?.rpm_limit },
                ]}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteConfirm}
                confirmLoading={deleteBudget.isPending}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              <Text className="text-base">{t("budgetManagement.examples.title")}</Text>
              <TabGroup>
                <TabList>
                  <Tab>{t("budgetManagement.examples.assignCustomer")}</Tab>
                  <Tab>{t("budgetManagement.examples.testCurl")}</Tab>
                  <Tab>{t("budgetManagement.examples.testOpenAiSdk")}</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <SyntaxHighlighter language="bash">{CREATE_END_USER_CURL_COMMAND}</SyntaxHighlighter>
                  </TabPanel>
                  <TabPanel>
                    <SyntaxHighlighter language="bash">{CHAT_COMPLETIONS_CURL_COMMAND}</SyntaxHighlighter>
                  </TabPanel>
                  <TabPanel>
                    <SyntaxHighlighter language="python">{OPENAI_SDK_PYTHON_CODE}</SyntaxHighlighter>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default BudgetPanel;
