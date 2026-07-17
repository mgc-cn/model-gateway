import React, { useState, useEffect } from "react";
import { Modal, Form, Steps, Button, Checkbox } from "antd";
import { Text, Title, Badge } from "@tremor/react";
import { enableClaudeCodePlugin, disableClaudeCodePlugin } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import { Plugin } from "./types";
import { useTranslation } from "react-i18next";

const { Step } = Steps;

interface MakeSkillPublicFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  skillsList: Plugin[];
  onSuccess: () => void;
}

const MakeSkillPublicForm: React.FC<MakeSkillPublicFormProps> = ({
  visible,
  onClose,
  accessToken,
  skillsList,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedSkills(new Set());
    form.resetFields();
    onClose();
  };

  const handleNext = () => {
    if (selectedSkills.size === 0) {
      NotificationsManager.fromBackend(t("skills.publish.errors.selectionRequired"));
      return;
    }
    setCurrentStep(1);
  };

  const handleSkillSelection = (name: string, checked: boolean) => {
    const next = new Set(selectedSkills);
    if (checked) {
      next.add(name);
    } else {
      next.delete(name);
    }
    setSelectedSkills(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSkills(new Set(skillsList.map((s) => s.name)));
    } else {
      setSelectedSkills(new Set());
    }
  };

  // Pre-check already-published skills when modal opens
  useEffect(() => {
    if (visible && skillsList.length > 0) {
      setSelectedSkills(new Set(skillsList.filter((s) => s.enabled).map((s) => s.name)));
    }
  }, [visible, skillsList]);

  const handleSubmit = async () => {
    if (selectedSkills.size === 0) {
      NotificationsManager.fromBackend(t("skills.publish.errors.selectionRequired"));
      return;
    }

    setLoading(true);
    try {
      const selectedSet = selectedSkills;
      await Promise.all(
        skillsList.map((skill) => {
          const shouldBePublic = selectedSet.has(skill.name);
          if (shouldBePublic && !skill.enabled) {
            return enableClaudeCodePlugin(accessToken, skill.name);
          }
          if (!shouldBePublic && skill.enabled) {
            return disableClaudeCodePlugin(accessToken, skill.name);
          }
          return Promise.resolve();
        }),
      );

      NotificationsManager.success(t("skills.publish.notifications.updated", { count: selectedSkills.size }));
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error publishing skills:", error);
      NotificationsManager.fromBackend(t("skills.publish.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const allSelected = skillsList.length > 0 && skillsList.every((s) => selectedSkills.has(s.name));
  const isIndeterminate = selectedSkills.size > 0 && !allSelected;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title>{t("skills.publish.selectTitle")}</Title>
        <Checkbox
          checked={allSelected}
          indeterminate={isIndeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={skillsList.length === 0}
        >
          {t("skills.publish.selectAll", { count: skillsList.length })}
        </Checkbox>
      </div>

      <Text className="text-sm text-gray-600">{t("skills.publish.selectionDescription")}</Text>

      <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
        <div className="space-y-3">
          {skillsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Text>{t("skills.publish.empty")}</Text>
            </div>
          ) : (
            skillsList.map((skill) => (
              <div key={skill.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedSkills.has(skill.name)}
                  onChange={(e) => handleSkillSelection(skill.name, e.target.checked)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Text className="font-medium font-mono text-sm">{skill.name}</Text>
                    {skill.enabled && (
                      <Badge color="green" size="xs">
                        {t("skills.detail.public")}
                      </Badge>
                    )}
                  </div>
                  {skill.description && (
                    <Text className="text-xs text-gray-500 truncate max-w-sm">{skill.description}</Text>
                  )}
                </div>
                {skill.domain && (
                  <Badge color="blue" size="xs">
                    {skill.domain}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedSkills.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Text className="text-sm text-blue-800">
            {t("skills.publish.selectedCount", { count: selectedSkills.size })}
          </Text>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <Title>{t("skills.publish.confirmTitle")}</Title>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <Text className="text-sm text-yellow-800">
          <strong>{t("skills.publish.noteLabel")}</strong> {t("skills.publish.note")}
        </Text>
      </div>

      <div className="space-y-3">
        <Text className="font-medium">{t("skills.publish.skillsToPublish")}</Text>
        <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
          <div className="space-y-2">
            {Array.from(selectedSkills).map((name) => {
              const skill = skillsList.find((s) => s.name === name);
              return (
                <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded-sm">
                  <Text className="font-mono text-sm">{name}</Text>
                  {skill?.domain && (
                    <Badge color="blue" size="xs">
                      {skill.domain}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Text className="text-sm text-blue-800">{t("skills.publish.totalCount", { count: selectedSkills.size })}</Text>
      </div>
    </div>
  );

  return (
    <Modal
      title={t("skills.publish.title")}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        <Steps current={currentStep} className="mb-6">
          <Step title={t("skills.publish.steps.select")} />
          <Step title={t("skills.publish.steps.confirm")} />
        </Steps>

        {currentStep === 0 ? renderStep1() : renderStep2()}

        <div className="flex justify-between mt-6">
          <Button onClick={currentStep === 0 ? handleClose : () => setCurrentStep(0)}>
            {currentStep === 0 ? t("common.cancel") : t("skills.publish.previous")}
          </Button>
          <div className="flex space-x-2">
            {currentStep === 0 && (
              <Button onClick={handleNext} disabled={selectedSkills.size === 0}>
                {t("skills.publish.next")}
              </Button>
            )}
            {currentStep === 1 && (
              <Button onClick={handleSubmit} loading={loading}>
                {t("skills.publish.submit")}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default MakeSkillPublicForm;
