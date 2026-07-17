import React, { useState, useEffect } from "react";
import {
  Icon,
  Button as TremorButton,
  Col,
  Text,
  Grid,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@tremor/react";
import { RefreshIcon } from "@heroicons/react/outline";
import { vectorStoreListCall, vectorStoreDeleteCall, credentialListCall, CredentialItem } from "../networking";
import { VectorStore } from "./types";
import VectorStoreTable from "./VectorStoreTable";
import VectorStoreForm from "./VectorStoreForm";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import VectorStoreInfoView from "./vector_store_info";
import CreateVectorStore from "./CreateVectorStore";
import TestVectorStoreTab from "./TestVectorStoreTab";
import { isAdminRole } from "@/utils/roles";
import NotificationsManager from "../molecules/notifications_manager";
import { useTranslation } from "react-i18next";

interface VectorStoreProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
}

const VectorStoreManagement: React.FC<VectorStoreProps> = ({ accessToken, userID, userRole }) => {
  const { t, i18n } = useTranslation();
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vectorStoreToDelete, setVectorStoreToDelete] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [selectedVectorStoreId, setSelectedVectorStoreId] = useState<string | null>(null);
  const [editVectorStore, setEditVectorStore] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVectorStores = async () => {
    if (!accessToken) return;
    try {
      const response = await vectorStoreListCall(accessToken);
      setVectorStores(response.data || []);
    } catch (error) {
      console.error("Error fetching vector stores:", error);
      NotificationsManager.fromBackend(t("toolManagement.vectors.fetchFailed", { error: String(error) }));
    }
  };

  const fetchCredentials = async () => {
    if (!accessToken) return;
    try {
      const response = await credentialListCall(accessToken);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      NotificationsManager.fromBackend(t("toolManagement.vectors.credentialsFailed", { error: String(error) }));
    }
  };

  const handleRefreshClick = () => {
    fetchVectorStores();
    fetchCredentials();
    const currentDate = new Date();
    setLastRefreshed(currentDate.toLocaleString(i18n.language));
  };

  const handleDelete = async (vectorStoreId: string) => {
    setVectorStoreToDelete(vectorStoreId);
    setIsDeleteModalOpen(true);
  };

  const handleView = (vectorStoreId: string) => {
    setSelectedVectorStoreId(vectorStoreId);
    setEditVectorStore(false);
  };

  const handleEdit = (vectorStoreId: string) => {
    setSelectedVectorStoreId(vectorStoreId);
    setEditVectorStore(true);
  };

  const handleCloseInfo = () => {
    setSelectedVectorStoreId(null);
    setEditVectorStore(false);
    fetchVectorStores();
  };

  const confirmDelete = async () => {
    if (!accessToken || !vectorStoreToDelete) return;
    setIsDeleting(true);
    try {
      await vectorStoreDeleteCall(accessToken, vectorStoreToDelete);
      NotificationsManager.success(t("toolManagement.vectors.deleted"));
      fetchVectorStores();
    } catch (error) {
      console.error("Error deleting vector store:", error);
      NotificationsManager.fromBackend(t("toolManagement.vectors.deleteFailed", { error: String(error) }));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setVectorStoreToDelete(null);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false);
    fetchVectorStores();
  };

  const handleVectorStoreCreated = (vectorStoreId: string) => {
    fetchVectorStores();
    // Optionally switch to the manage tab
  };

  useEffect(() => {
    fetchVectorStores();
    fetchCredentials();
  }, [accessToken]);

  return selectedVectorStoreId ? (
    <div className="w-full h-full">
      <VectorStoreInfoView
        vectorStoreId={selectedVectorStoreId}
        onClose={handleCloseInfo}
        accessToken={accessToken}
        is_admin={isAdminRole(userRole || "")}
        editVectorStore={editVectorStore}
      />
    </div>
  ) : (
    <div className="w-full mx-4 h-[75vh]">
      <div className="gap-2 p-8 h-[75vh] w-full mt-2">
        <div className="flex justify-between mt-2 w-full items-center mb-4">
          <h1>{t("toolManagement.vectors.title")}</h1>
          <div className="flex items-center space-x-2">
            {lastRefreshed && <Text>{t("toolManagement.vectors.lastRefreshed", { time: lastRefreshed })}</Text>}
            <Icon
              icon={RefreshIcon}
              variant="shadow"
              size="xs"
              className="self-center cursor-pointer"
              onClick={handleRefreshClick}
              aria-label={t("toolManagement.vectors.refresh")}
            />
          </div>
        </div>

        <Text className="mb-4">
          <p>{t("toolManagement.vectors.description")}</p>
        </Text>

        <TabGroup>
          <TabList className="mb-6">
            <Tab>{t("toolManagement.vectors.createTab")}</Tab>
            <Tab>{t("toolManagement.vectors.manageTab")}</Tab>
            <Tab>{t("toolManagement.vectors.testTab")}</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Create Vector Store */}
            <TabPanel>
              <CreateVectorStore accessToken={accessToken} onSuccess={handleVectorStoreCreated} />
            </TabPanel>

            {/* Tab 2: Manage Vector Stores */}
            <TabPanel>
              <TremorButton className="mb-4" onClick={() => setIsCreateModalVisible(true)}>
                {t("toolManagement.vectors.add")}
              </TremorButton>

              <Grid numItems={1} className="gap-2 pt-2 pb-2 w-full mt-2">
                <Col numColSpan={1}>
                  <VectorStoreTable
                    data={vectorStores}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Col>
              </Grid>
            </TabPanel>

            {/* Tab 3: Test Vector Store */}
            <TabPanel>
              <TestVectorStoreTab accessToken={accessToken} vectorStores={vectorStores} />
            </TabPanel>
          </TabPanels>
        </TabGroup>

        {/* Create Vector Store Modal */}
        <VectorStoreForm
          isVisible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
          accessToken={accessToken}
          credentials={credentials}
        />

        {/* Delete Confirmation Modal */}
        <DeleteResourceModal
          isOpen={isDeleteModalOpen}
          title={t("toolManagement.vectors.deleteTitle")}
          message={t("toolManagement.vectors.deleteMessage")}
          resourceInformationTitle={t("toolManagement.vectors.info")}
          resourceInformation={[
            { label: t("toolManagement.vectors.vectorId"), value: vectorStoreToDelete, code: true },
          ]}
          onCancel={() => setIsDeleteModalOpen(false)}
          onOk={confirmDelete}
          confirmLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default VectorStoreManagement;
