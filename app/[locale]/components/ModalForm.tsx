import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Card,
  Form,
  Row,
  Col,
  Button,
  Alert,
  Divider,
  Select,
  Input,
  DatePicker,
} from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import initTranslations from "../../i18n";
import moment from "moment";

interface ModalFormProps {
  isModalOpen: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  setPageData: any;
  form: any;
  fieldsConfig: any[];
  pageData: any;
  errors: any;
  modalTitle: string;
  edit: boolean;
  locale: string;
  element?: any;
}

export const ModalForm = ({
  isModalOpen,
  handleOk,
  handleCancel,
  setPageData,
  form,
  fieldsConfig,
  pageData,
  errors,
  modalTitle,
  edit,
  locale,
  element,
}: ModalFormProps) => {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

  // --- Input Change Handler ---
  const handleInputChange = useCallback(
    (field: any) => (e: any) => {
      let value;

      if (e && e.target) {
        if (e.target.type === "checkbox") {
          value = e.target.checked;
        } else {
          value = e.target.value;
        }
      } else if (typeof e === "object" && e?.hasOwnProperty("value")) {
        value = e.value;
      } else {
        value = e;
      }

      setPageData((prevData: any) => ({
        ...prevData,
        [field]: value,
      }));
    },
    []
  );

  // --- Validation Messages ---
  const validateMessages = {
    required: t("${label}") + " " + t("is required!"),
    types: {
      email: t("not valid email!"),
      number: t("not a valid number!"),
    },
    number: {
      range: "${label} must be between ${min} and ${max}",
    },
  };

  const createFormItem = ({
    fieldName,
    value,
    rules,
    type = "text",
    label,
    fieldOptions = [],
    readOnly,
    showInput,
    fieldWidth,
    editable,
  }: any) => {
    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);



    return (
      <Col key={fieldName} xs={{ flex: fieldWidth }} style={{ padding: 5 }}>
        {showInput && (
          <Form.Item
            key={fieldName}
            label={t(displayedLabel)}
            name={fieldName}
            rules={rules}>
            {type === "select" && (
              <Select
                value={value}
                onChange={handleInputChange(fieldName)}
                showSearch
                allowClear
                options={fieldOptions}
                style={{ width: "100%" }}
                disabled={edit ? !editable : readOnly}
              />
            )}
            {(type === "text" ||
              type === "number" ||
              type === "password" ||
              type === "email") && (
              <Input
                value={value}
                onChange={handleInputChange(fieldName)}
                type={type}
                disabled={edit ? !editable : readOnly}
              />
            )}
            {type === "text area" && (
              <Input.TextArea
                value={value}
                onChange={handleInputChange(fieldName)}
                disabled={edit ? !editable : readOnly}
              />
            )}
            {type === "date" && (

              <DatePicker
              format="YYYY-MM-DD"
              value={value ? moment(value, "YYYY-MM-DD", true) : moment()}
              onChange={(date, dateString) => handleInputChange(fieldName)(dateString)}
              disabled={edit ? !editable : readOnly}
            />
            )}
          </Form.Item>
        )}
      </Col>
    );
  };

  return (
    <Modal
      title={modalTitle}
      open={isModalOpen}
      onCancel={handleCancel}
      width={500}
      maskClosable={false}
      footer={null} // Remove default footer
    >
      <Card>
        <Form
          form={form}
          layout='vertical'
          style={{ maxWidth: 500, textAlign: "center" }}
          onFinish={handleOk}
          validateMessages={validateMessages}>
          <Row>
            {fieldsConfig.map((field) =>
              createFormItem({
                ...field,
                value: pageData[field.fieldName],
                fieldOptions: field.options,
              })
            )}
          </Row>

          {element}

          {errors.saveErrors && (
            <Alert closable description={errors.saveErrors} type='error' showIcon />
          )}
          <Divider />
          <div style={{ textAlign: "right", direction: "rtl" }}>
            <Button
              type='primary'
              shape='round'
              htmlType='submit'
              icon={<SaveOutlined />}>
              {t("Save")}
            </Button>
            <Button
              shape='round'
              icon={<CloseOutlined />}
              onClick={handleCancel}
              style={{ marginRight: 8 }}>
              {t("Cancel")}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};
