import React, { useEffect, useState } from "react";
import { Modal, Card, Form, Row, Col, Button, Alert, Divider, Select, Input } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import initTranslations from "../../i18n";

interface ModalFormProps {
  isModalOpen: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  form: any;
  fieldsConfig: any[];
  accountData: any;
  errors: any;
  modalTitle: string;
  edit: boolean;
  locale: string;
}

export const ModalForm = ({
  isModalOpen,
  handleOk,
  handleCancel,
  form,
  fieldsConfig,
  accountData,
  errors,
  modalTitle,
  edit,
  locale,
}: ModalFormProps) => {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

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
                onChange={(value) => form.setFieldsValue({ [fieldName]: value })}
                showSearch
                allowClear
                options={fieldOptions}
                style={{ width: "100%" }}
                disabled={edit ? !editable : readOnly}
              />
            )}
            {(type === "text" || type === "number") && (
              <Input
                value={value}
                onChange={(e) => form.setFieldsValue({ [fieldName]: e.target.value })}
                type={type}
                disabled={edit ? !editable : readOnly}
              />
            )}
            {type === "text area" && (
              <Input.TextArea
                value={value}
                onChange={(e) => form.setFieldsValue({ [fieldName]: e.target.value })}
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
          onFinish={handleOk}>
          <Row>
            {fieldsConfig.map((field) =>
              createFormItem({
                ...field,
                value: accountData[field.fieldName],
                fieldOptions: field.options,
              })
            )}
          </Row>
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
