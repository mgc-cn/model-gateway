import React from "react";
import { Form, Input, InputNumber, Button as Button2 } from "antd";
import { TrashIcon, CheckCircleIcon } from "@heroicons/react/outline";
import { Button, Badge, Icon, Text, TableRow, TableCell, Switch } from "@tremor/react";
import { useTranslation } from "react-i18next";
interface AlertingSetting {
  field_name: string;
  field_description: string;
  field_type: string;
  field_value: any;
  stored_in_db: boolean | null;
  premium_field: boolean;
}

interface DynamicFormProps {
  alertingSettings: AlertingSetting[];
  handleInputChange: (fieldName: string, newValue: any) => void;
  handleResetField: (fieldName: string, index: number) => void;
  handleSubmit: (formValues: Record<string, any>) => void;
  premiumUser: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  alertingSettings,
  handleInputChange,
  handleResetField,
  handleSubmit,
  premiumUser,
}) => {
  const { t, i18n } = useTranslation();
  const isChinese = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [form] = Form.useForm();

  const onFinish = () => {
    const formData = form.getFieldsValue();
    const isEmpty = Object.entries(formData).every(([key, value]) => {
      if (typeof value === "boolean") {
        return false; // Boolean values are never considered empty
      }
      return value === "" || value === null || value === undefined;
    });
    if (!isEmpty) {
      handleSubmit(formData);
    } else {
    }
  };

  return (
    <Form form={form} onFinish={onFinish} labelAlign="left">
      {alertingSettings.map((value, index) => (
        <TableRow key={index}>
          <TableCell align="center">
            <Text>
              {isChinese
                ? t(`loggingAndAlerts.alertSettings.fields.${value.field_name}.label`, {
                    defaultValue: value.field_name,
                  })
                : value.field_name}
            </Text>
            {isChinese && <code className="mt-1 block text-xs text-gray-500">{value.field_name}</code>}
            <p
              style={{
                fontSize: "0.65rem",
                color: "#808080",
                fontStyle: "italic",
              }}
              className="mt-1"
            >
              {isChinese
                ? t(`loggingAndAlerts.alertSettings.fields.${value.field_name}.description`, {
                    defaultValue: value.field_description,
                  })
                : value.field_description}
            </p>
          </TableCell>
          {value.premium_field ? (
            premiumUser ? (
              <Form.Item name={value.field_name}>
                <TableCell>
                  {value.field_type === "Integer" ? (
                    <InputNumber
                      step={1}
                      value={value.field_value}
                      onChange={(e) => handleInputChange(value.field_name, e)}
                    />
                  ) : value.field_type === "Boolean" ? (
                    <Switch
                      checked={value.field_value}
                      onChange={(checked) => handleInputChange(value.field_name, checked)}
                    />
                  ) : (
                    <Input value={value.field_value} onChange={(e) => handleInputChange(value.field_name, e)} />
                  )}
                </TableCell>
              </Form.Item>
            ) : (
              <TableCell>
                <Button className="flex items-center justify-center">
                  <a href="https://forms.gle/W3U4PZpJGFHWtHyA9" target="_blank">
                    ✨ {t("loggingAndAlerts.alertSettings.enterpriseFeature")}
                  </a>
                </Button>
              </TableCell>
            )
          ) : (
            <Form.Item
              name={value.field_name}
              className="mb-0"
              valuePropName={value.field_type === "Boolean" ? "checked" : "value"}
            >
              <TableCell>
                {value.field_type === "Integer" ? (
                  <InputNumber
                    step={1}
                    value={value.field_value}
                    onChange={(e) => handleInputChange(value.field_name, e)}
                    className="p-0"
                  />
                ) : value.field_type === "Boolean" ? (
                  <Switch
                    checked={value.field_value}
                    onChange={(checked) => {
                      handleInputChange(value.field_name, checked);
                      form.setFieldsValue({ [value.field_name]: checked });
                    }}
                  />
                ) : (
                  <Input value={value.field_value} onChange={(e) => handleInputChange(value.field_name, e)} />
                )}
              </TableCell>
            </Form.Item>
          )}
          <TableCell>
            {value.stored_in_db == true ? (
              <Badge icon={CheckCircleIcon} className="text-white">
                {t("loggingAndAlerts.alertSettings.status.inDatabase")}
              </Badge>
            ) : value.stored_in_db == false ? (
              <Badge className="text-gray bg-white outline-solid">
                {t("loggingAndAlerts.alertSettings.status.inConfig")}
              </Badge>
            ) : (
              <Badge className="text-gray bg-white outline-solid">
                {t("loggingAndAlerts.alertSettings.status.notSet")}
              </Badge>
            )}
          </TableCell>
          <TableCell>
            <Icon icon={TrashIcon} color="red" onClick={() => handleResetField(value.field_name, index)}>
              {t("loggingAndAlerts.alertSettings.reset")}
            </Icon>
          </TableCell>
        </TableRow>
      ))}
      <div>
        <Button2 htmlType="submit">{t("loggingAndAlerts.alertSettings.update")}</Button2>
      </div>
    </Form>
  );
};

export default DynamicForm;
