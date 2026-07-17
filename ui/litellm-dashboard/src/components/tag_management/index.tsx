import React, { useState, useEffect } from "react";
import { Icon, Button, Col, Text, Grid } from "@tremor/react";
import { RefreshIcon } from "@heroicons/react/outline";
import TagInfoView from "./tag_info";
import { modelInfoCall } from "../networking";
import { tagCreateCall, tagListCall, tagDeleteCall } from "../networking";
import { Tag } from "./types";
import TagTable from "./TagTable";
import NotificationsManager from "../molecules/notifications_manager";
import CreateTagModal from "./components/CreateTagModal";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import { useTranslation } from "react-i18next";

interface ModelInfo {
  model_name: string;
  litellm_params: {
    model: string;
  };
  model_info: {
    id: string;
  };
}

interface TagProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
}

const TagManagement: React.FC<TagProps> = ({ accessToken, userID, userRole }) => {
  const { t, i18n } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [editTag, setEditTag] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  const fetchTags = async () => {
    if (!accessToken) return;
    try {
      const response = await tagListCall(accessToken);
      setTags(Object.values(response));
    } catch (error) {
      console.error("Error fetching tags:", error);
      NotificationsManager.fromBackend(t("tagManagement.notifications.fetchFailed", { error: String(error) }));
    }
  };

  const handleRefreshClick = () => {
    fetchTags();
    const currentDate = new Date();
    setLastRefreshed(currentDate.toLocaleString(i18n.resolvedLanguage?.startsWith("zh") ? "zh-CN" : "en-US"));
  };

  const handleCreate = async (formValues: any) => {
    if (!accessToken) return;
    try {
      await tagCreateCall(accessToken, {
        name: formValues.tag_name,
        description: formValues.description,
        models: formValues.allowed_llms,
        max_budget: formValues.max_budget,
        soft_budget: formValues.soft_budget,
        tpm_limit: formValues.tpm_limit,
        rpm_limit: formValues.rpm_limit,
        budget_duration: formValues.budget_duration,
      });
      NotificationsManager.success(t("tagManagement.notifications.created"));
      setIsCreateModalVisible(false);
      fetchTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      NotificationsManager.fromBackend(t("tagManagement.notifications.createFailed", { error: String(error) }));
    }
  };

  const handleDelete = (tagName: string) => {
    setTagToDelete(tagName);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accessToken || !tagToDelete) return;
    setIsDeleting(true);
    try {
      await tagDeleteCall(accessToken, tagToDelete);
      NotificationsManager.success(t("tagManagement.notifications.deleted"));
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      NotificationsManager.fromBackend(t("tagManagement.notifications.deleteFailed", { error: String(error) }));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      const fetchModels = async () => {
        try {
          const response = await modelInfoCall(accessToken, userID, userRole);
          if (response && response.data) {
            setAvailableModels(response.data);
          }
        } catch (error) {
          console.error("Error fetching models:", error);
          NotificationsManager.fromBackend(t("tagManagement.notifications.modelsFailed", { error: String(error) }));
        }
      };
      fetchModels();
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    fetchTags();
  }, [accessToken]);

  return (
    <div className="w-full mx-4 h-[75vh]">
      {selectedTagId ? (
        <TagInfoView
          tagId={selectedTagId}
          onClose={() => {
            setSelectedTagId(null);
            setEditTag(false);
          }}
          accessToken={accessToken}
          is_admin={userRole === "Admin"}
          editTag={editTag}
        />
      ) : (
        <div className="gap-2 p-8 h-[75vh] w-full mt-2">
          <div className="flex justify-between mt-2 w-full items-center mb-4">
            <h1>{t("tagManagement.title")}</h1>
            <div className="flex items-center space-x-2">
              {lastRefreshed && <Text>{t("tagManagement.lastRefreshed", { time: lastRefreshed })}</Text>}
              <Icon
                icon={RefreshIcon}
                variant="shadow"
                size="xs"
                className="self-center cursor-pointer"
                tooltip={t("tagManagement.refresh")}
                onClick={handleRefreshClick}
              />
            </div>
          </div>

          <Text className="mb-4">
            {t("tagManagement.description")}
            <p>
              {t("tagManagement.routingDescription")} {t("tagManagement.readMore")}{" "}
              <a href="https://docs.litellm.ai/docs/proxy/tag_routing" target="_blank" rel="noopener noreferrer">
                {t("tagManagement.here")}
              </a>
              .
            </p>
          </Text>

          <Button className="mb-4" onClick={() => setIsCreateModalVisible(true)}>
            + {t("tagManagement.create")}
          </Button>

          <Grid numItems={1} className="gap-2 pt-2 pb-2 h-[75vh] w-full mt-2">
            <Col numColSpan={1}>
              <TagTable
                data={tags}
                onEdit={(tag) => {
                  setSelectedTagId(tag.name);
                  setEditTag(true);
                }}
                onDelete={handleDelete}
                onSelectTag={setSelectedTagId}
              />
            </Col>
          </Grid>

          {/* Create Tag Modal */}
          <CreateTagModal
            visible={isCreateModalVisible}
            onCancel={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreate}
            availableModels={availableModels}
          />

          <DeleteResourceModal
            isOpen={isDeleteModalOpen}
            title={t("tagManagement.delete.title")}
            message={t("tagManagement.delete.message")}
            resourceInformationTitle={t("tagManagement.delete.information")}
            resourceInformation={[{ label: t("tagManagement.form.tagName"), value: tagToDelete, code: true }]}
            onCancel={() => {
              setIsDeleteModalOpen(false);
              setTagToDelete(null);
            }}
            onOk={confirmDelete}
            confirmLoading={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default TagManagement;
