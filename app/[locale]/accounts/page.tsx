"use client";
const PageName = "Accounts";

const api = getApiUrl();
import { useRef } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Axios from "axios";
import { useCookies } from "react-cookie";
import {
  getRules,
  getApiUrl,
  saveLog,
  capitalize,
  handlePrint,
  cardStyle,
  generateAccountNumber,
} from "@/app/shared";

//Styling
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Result,
  Row,
  Select,
  Table,
  TableColumnsType,
  message,
} from "antd";
import { BsPlusLg } from "react-icons/bs";
import {
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { FaPrint } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";

export default function App() {
  const tableRef = useRef<HTMLDivElement>(null);
  const [_, setCookies] = useCookies(["loading"]); //for loading page
  const [form] = Form.useForm(); // to reset form after save or close
  const userName = window.localStorage.getItem("userName");
  const [rulesMatch, setRulesMatch] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allAccountsData, setAllAccountsData] = useState<any>([]);
  const [accountsList, setAccountsList] = useState();
  const [Loading, setLoading] = useState(true); // to show loading before get data form db
  const [edit, setEdit] = useState(false); // if true update else save new
  const [searchText, setSearchText] = useState(""); // to search on table
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
    confirmPasswordError: "",
  });
  const [accountData, setAccountData] = useState({
    _id: "",
    accountNumber: "",
    accountName: "",
    accountType: "",
    balance: "",
    parentAccount: "",
    notes: "",
  });

  const accountTypeOptions = [
    { value: "Assets", label: "Assets" },
    { value: "Liabilities", label: "Liabilities" },
    { value: "Equity", label: "Equity" },
    { value: "Revenue", label: "Revenue" },
    { value: "Expenses", label: "Expenses" },
  ];

  const AccounsOptions = allAccountsData.map((field: any) => ({
    value: field.accountNumber,
    label: field.accountName,
  }));
  
  useEffect(() => {
    //to get user rule for this page
    getRules(userName, PageName).then((value) => {
      setRulesMatch(value);
    });
  }, [userName, PageName]);

  useEffect(() => {
    getData();
  }, []);

  type Field = {
    label: string;
    name: string;
    type?: string; // Optional type for Input (e.g., "text", "email", "password")
    rules?: any[]; // Optional validation rules for Form.Item
    options?: any[];
  };

  const fields: Field[] = [
    {
      label: "Parent Account",
      name: "parentAccount",
      type: "select",
      rules: [{ required: true }],
      options: AccounsOptions,
      //options: accountsList,
    },
    {
      label: "Account Number",
      name: "accountNumber",
      type: "text",
      rules: [{ required: true }],
    },
    {
      label: "Account Name",
      name: "accountName",
      type: "text",
      rules: [{ required: true }],
    },
    {
      label: "Account Type",
      name: "accountType",
      type: "select",
      options: accountTypeOptions,
      rules: [{ required: true }],
    },
    {
      label: "Balance",
      name: "balance",
      type: "number",
      rules: [{ required: false }],
    },
    {
      label: "Notes",
      name: "notes",
      type: "text",
      rules: [{ required: false }],
    },
    { label: "User", name: "user", type: "text", rules: [{ required: true }] },
  ];

  // const formFields = fields.filter(
  //   (field) => field.name !== "user" && field.name !== "accountNumber"
  // );

  //const filteredFields = fields.filter((field) => field.name !== "accountNumber");

  const columns: TableColumnsType<any> = [
    {
      title: "Parent Account",
      dataIndex: "parentAccount",
    },
    {
      title: "Account Name",
      dataIndex: "accountName",
    },
    {
      title: "Account Number",
      dataIndex: "accountNumber",
    },
    {
      title: "Account Type",
      dataIndex: "accountType",
    },
    {
      title: "Balance",
      dataIndex: "balance",
    },
    {
      title: "Notes",
      dataIndex: "notes",
    },
    {
      title: "User",
      dataIndex: "user",
    },

    {
      title: "Actions",
      dataIndex: "Actions",
      key: "Actions",
      align: "center",
      className: "no_print",
      fixed: "right",
      render: (_, record) => (
        <>
          <Popconfirm
            title={"Delete the " + PageName.slice(0, -1)}
            description={"Are you sure to delete  " + record.name + "?"}
            onConfirm={() => {
              remove(record._id);
            }}
            okText='Yes, Remove'
            cancelText='No'>
            <Button
              type='primary'
              danger
              onClick={() => {
                setAccountData(record);
              }}
              shape='circle'
              size='small'
              icon={<DeleteOutlined />}
            />
          </Popconfirm>{" "}
          <Button
            type='primary'
            shape='circle'
            size='small'
            icon={<EditOutlined />}
            onClick={() => {
              setAccountData(record);
              form.setFieldsValue({
                name: record.name,
                email: record.email,
                rules: record.rules,
              });
              setEdit(true);
              showModal();
            }}
          />
        </>
      ),
    },
  ];

  const filteredData = allAccountsData.filter((account: any) => {
    // Implement your search logic here
    const searchTextLower = searchText.toLowerCase(); // Case-insensitive search
    return (
      // Search relevant fields
      account.accountNumber.toLowerCase().includes(searchTextLower) ||
      account.accountName.toLowerCase().includes(searchTextLower) ||
      account.accountName.toLowerCase().includes(searchTextLower) ||
      account.parentAccount.toLowerCase().includes(searchTextLower) ||
      account.accountType.toLowerCase().includes(searchTextLower) ||
      account.notes.toLowerCase().includes(searchTextLower) ||
      account.user.toLowerCase().includes(searchTextLower)
      // Add more fields as needed based on your data structure
    );
  });

  async function getData() {
    setLoading(true);
    try {
      const response = await Axios.get(`${api}/accounts`);
      setAllAccountsData(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
      setCookies("loading", false);
    }
  }

  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const response = await Axios.post(`${api}/accounts`, {
      accountNumber: accountData.accountNumber,
      accountName: accountData.accountName,
      accountType: accountData.accountType,
      balance: accountData.balance,
      parentAccount: accountData.parentAccount,
      notes: accountData.notes,
      user: userName,
    });
    if (response.data.message === "Saved!") {
      getData();
      saveLog("save new account: " + accountData.accountName);
      toast.remove(); // remove any message on screen
      toast.success(response.data.message, {
        position: "top-center",
      });
      return true; // to close modal form
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false; // to keep modal form open
    }
  }

  async function update() {
    // setErrors({ ...Errors, saveErrors: "" });
    // const response = await Axios.put(`${api}/accounts`, {
    //   _id: accountData._id,
    //   name: form.getFieldValue("name"),
    //   email: form.getFieldValue("email"),
    //   password: form.getFieldValue("password"),
    // });
    // if (response.data.message === "Updated!") {
    //   getData();
    //   toast.remove();
    //   toast.success(response.data.message, {
    //     position: "top-center",
    //   });
    //   saveLog("update account: " + accountData.name);
    //   setEdit(false);
    //   return true; // to close modal form
    // } else {
    //   setErrors({ ...Errors, saveErrors: response.data.message });
    //   return false; // to keep modal form open
    // }
  }

  async function remove(id: string) {
    Axios.delete(`${api}/accounts/${id}`).then((res) => {
      saveLog("remove account: " + accountData.accountName);
      getData();
      message.success("Removed");
    });
  }

  async function showModal() {
    setErrors({ ...Errors, saveErrors: "" });
    setErrors({ ...Errors, confirmPasswordError: "" });
    setIsModalOpen(true);
  }

  async function handleOk() {
    if (await save()) {
      setIsModalOpen(false);
      form.resetFields();
    }
    if (!edit) {
    } //else {
    //   if (await update()) {
    //     setIsModalOpen(false);
    //     form.resetFields();
    //   }
    // }
  }

  function handleCancel() {
    setIsModalOpen(false);
    setEdit(false);
    form.resetFields();
  }

  const handleInputChange = useCallback(
    (field: any) => (e: any) => {
      let value;

      if (e && e.target) {
        // Handle checkbox separately as it has 'checked' property instead of 'value'
        if (e.target.type === "checkbox") {
          value = e.target.checked;
        } else {
          value = e.target.value;
        }
      } else if (typeof e === "object" && e?.hasOwnProperty("value")) {
        // Handle Select or other similar components with a value property
        value = e.value;
      } else {
        value = e;
      }

      setAccountData((prevData) => ({
        ...prevData,
        [field]: value,
      }));

      console.log(field);
    },
    []
  );

  useEffect(() => {
    //console.log(accountData);
    console.log(accountData.parentAccount);

    //generateAccountNumber(accountData.parentAccount || 1)
  }, [accountData]);

  const validateMessages = {
    required: "${label} is required!",
    types: {
      email: "not valid email!",
      number: "not a valid number!",
    },
    number: {
      range: "${label} must be between ${min} and ${max}",
    },
  };

  const modalTitle = useMemo(
    () => (edit ? "Edit " : "Add ") + PageName.slice(0, -1),
    [edit]
  );

  interface CreateFormItemProps {
    fieldName: string;
    rules: any[];
    type?: "text" | "select" | "number";
    label?: string;
    fieldOptions?: { label: string; value: any }[];
  }

  const createFormItem = ({
    fieldName,
    rules,
    type = "text",
    label,
    fieldOptions = [],
  }: CreateFormItemProps) => {
    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    return (
      <Col
        key={fieldName}
        xs={{ flex: "100%" }}
        sm={{ flex: "50%" }}
        md={{ flex: "50%" }}
        lg={{ flex: "50%" }}
        style={{ padding: 5 }}>
        <Form.Item key={fieldName} label={displayedLabel} name={fieldName} rules={rules}>
          {type === "select" ? (
            <Select
              onChange={handleInputChange(fieldName)}
              showSearch
              allowClear
              options={fieldOptions}
              style={{ width: "100%" }}
            />
          ) : (
            <Input onChange={handleInputChange(fieldName)} type={type} />
          )}
        </Form.Item>
      </Col>
    );
  };

  return (
    <>
      <div>
        <Toaster />
      </div>
      {rulesMatch == 1 && (
        <>
          <Modal
            title={modalTitle}
            open={isModalOpen}
            onCancel={handleCancel}
            width={600}
            maskClosable={false} //not close by click out of modal
            footer={[]}>
            <Card>
              <Form
                form={form}
                layout='vertical'
                style={{ maxWidth: 600, textAlign: "center" }}
                validateMessages={validateMessages}
                onFinish={handleOk}>
                <Row>
                  {/* {formFields.map((field) => (
                    <Col
                      key={field.name}
                      xs={{ flex: "100%" }}
                      sm={{ flex: "50%" }}
                      md={{ flex: "50%" }}
                      lg={{ flex: "50%" }}
                      style={{ padding: 5 }}>
                      <Form.Item
                        name={field.name}
                        key={field.name}
                        label={field.label}
                        rules={field.rules}>
                        {field.type ? (
                          field.type === "select" ? (
                            <Select
                              onChange={handleInputChange(field.name)}
                              showSearch
                              allowClear
                              options={field.options}
                              style={{ width: "100%" }}
                            />
                          ) : (
                            <Input
                              onChange={handleInputChange(field.name)}
                              type={field.type}
                            />
                          )
                        ) : (
                          <Input onChange={handleInputChange(field.name)} />
                        )}
                      </Form.Item>
                    </Col>
                  ))} */}
                  {createFormItem({
                    fieldName: "parentAccount",
                    rules: [{ required: true }],
                    type: "select",
                    label: "Parent Account",
                    fieldOptions: AccounsOptions,
                  })}
                  {createFormItem({
                    fieldName: "accountName",
                    rules: [{ required: true }],
                    label: "Account Name",
                  })}
                  {createFormItem({
                    fieldName: "accountType",
                    rules: [{ required: true }],
                    type: "select",
                    label: "Account Type",
                    fieldOptions: accountTypeOptions,
                  })}
                  {createFormItem({
                    fieldName: "balance",
                    rules: [{ required: false }],
                    type: "number",
                    fieldOptions: accountTypeOptions,
                  })}
                  {createFormItem({ fieldName: "notes", rules: [{ required: false }] })}
                </Row>
                <br />
                <Divider />
                <Form.Item style={{ marginBottom: -40, textAlign: "right" }}>
                  <Button onClick={handleCancel} icon={<CloseOutlined />} />
                  <> </>
                  <Button type='primary' htmlType='submit' icon={<SaveOutlined />} />
                </Form.Item>{" "}
              </Form>

              <br />
              {Errors.saveErrors && (
                <Alert description={Errors.saveErrors} type='error' showIcon />
              )}
            </Card>
          </Modal>
          <Card
            title={PageName}
            style={cardStyle}
            extra={
              <>
                <Button
                  type='text'
                  title='Print'
                  onClick={() => {
                    handlePrint(tableRef, PageName, 12);
                  }}
                  icon={<FaPrint size={"1em"} />}></Button>
                <Button
                  type='text'
                  title='Add'
                  onClick={showModal}
                  icon={<BsPlusLg size={"1em"} />}></Button>
              </>
            }>
            {!Errors.connectionError && (
              <>
                <Input.Search
                  placeholder='Search...'
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ paddingBottom: 5 }}
                  allowClear
                />
                <div ref={tableRef}>
                  <Table
                    id='print-table'
                    size='small'
                    columns={columns}
                    dataSource={filteredData}
                    loading={Loading}
                    pagination={false}
                    //pagination={{ hideOnSinglePage: true, pageSize: 5 }}
                    //scroll={{ x: "calc(300px + 50%)", y: 500 }}
                    rowKey={(record) => record._id}
                  />
                </div>
              </>
            )}
            {Errors.connectionError && (
              <Result
                status='warning'
                title={"Can't Load Data :" + Errors.connectionError}
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}
