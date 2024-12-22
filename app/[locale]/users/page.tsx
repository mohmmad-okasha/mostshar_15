"use client";

// --- Imports ---
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Axios from "axios";
import { useCookies } from "react-cookie";
import { getRules, getApiUrl, saveLog, handlePrint, cardStyle,capitalize } from "@/app/shared";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  Popconfirm,
  Result,
  Row,
  Select,
  Table,
  Tree,
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
import { FiDownloadCloud } from "react-icons/fi";
import * as XLSX from "xlsx";

// --- Constants ---
const PageName = "Users";
const api = getApiUrl();

// --- Main Component ---
export default function App() {
  // --- Refs and Hooks ---
  const tableRef = useRef<HTMLDivElement>(null);
  const [_, setCookies] = useCookies(["loading"]);
  const [form] = Form.useForm();
  const userName = window.localStorage.getItem("userName");

  // --- State Variables ---
  const [rulesMatch, setRulesMatch] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsersData, setAllUsersData] = useState<any>([]);
  const [oldData, setOldData] = useState<any>([]);
  const [Loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
  });

  // --- Export Data ---
  const exportToJson = (data: any) => {
    const json = JSON.stringify(data, null, 2); // تحويل البيانات إلى JSON
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = PageName + ".json"; // اسم الملف
    link.click();
  };

  const exportToExcel = (data: any) => {
    const ws = XLSX.utils.json_to_sheet(data); // Convert JSON data to sheet
    const wb = XLSX.utils.book_new(); // Create a new workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); // Append the sheet to the workbook

    // Write the workbook to Excel file and trigger download
    XLSX.writeFile(wb, PageName + ".xlsx");
  };

  const exportToSQL = () => {
    const tableName = "users"; //table name

    // Filter out columns that you don't want to include
    const filteredColumns = columns.filter(
      (col: any) => !["Actions"].includes(col.dataIndex)
    ); // Example: Exclude 'age'

    // Generate the column names part of the SQL
    const columnNames = filteredColumns.map((col: any) => col.dataIndex).join(", ");

    // Generate SQL values for each row
    const values = filteredData
      .map((row: any) => {
        // Generate SQL-friendly values, escaping single quotes
        const rowValues = filteredColumns
          .map((col: any) => `'${String(row[col.dataIndex]).replace(/'/g, "''")}'`)
          .join(", ");

        return `(${rowValues})`;
      })
      .join(",\n");

    // Combine the final SQL insert statement
    const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES\n${values};`;

    // Create a Blob object containing the SQL statement
    const blob = new Blob([sql], { type: "text/plain" });

    // Create a link element to trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = PageName + ".sql"; // The name of the downloaded file
    link.click(); // Trigger the download
  };

  const [userRules, setUserRules] = useState<{ [key: string]: number }>({
    //users rules
    Users: 0,
    Logs: 0,
    Accounts: 0,
    //"Two Words": 0,
  });

  // --- Field Configuration (useMemo) ---
  const fieldsConfig = useMemo(
    () => [
      {
        fieldName: "name",
        label: "Name",
        type: "text",
        rules: [{ required: true }],
        readOnly: false,
        showTable: true,
        showInput: true,
        fieldWidth: "100%",
      },
      {
        fieldName: "email",
        label: "Email",
        rules: [{ required: true }],
        type: "email",
        showTable: true,
        showInput: true,
        fieldWidth: "100%",
        editable: true,
      },
      {
        fieldName: "password",
        label: "Password",
        type: "password",
        rules: [{ required: true }],
        showTable: false,
        showInput: true,
        fieldWidth: "50%",
        editable: true,
      },
      {
        fieldName: "password2",
        label: "Confirm Password",
        type: "password",
        rules: [{ required: true }],
        showTable: false,
        showInput: true,
        fieldWidth: "50%",
        editable: true,
      },
      {
        fieldName: "notes",
        label: "Notes",
        type: "text area",
        rules: [{ required: false }],
        showTable: true,
        showInput: true,
        fieldWidth: "100%",
        editable: true,
      },
    ],
    [allUsersData]
  );

  // --- Initial User Data State ---
  const [userData, setUserData] = useState(() => {
    const initialData: any = {};
    fieldsConfig.forEach((field) => {
      initialData[field.fieldName] = "";
    });
    return initialData;
  });

  // --- Effects Hooks ---
  useEffect(() => {
    getRules(userName, PageName).then((value) => {
      setRulesMatch(value);
    });
  }, [userName, PageName]);

  useEffect(() => {
    getData();
  }, []);

  // --- Table Columns (useMemo) ---
  const columns: any = useMemo(
    () => [
      ...fieldsConfig
        .map((field) =>
          field.showTable
            ? {
                title: field.label,
                dataIndex: field.fieldName,
              }
            : null
        )
        .filter(Boolean),
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
        render: (_: any, record: any) => (
          <>
            <Popconfirm
              title={"Delete the " + PageName.slice(0, -1)}
              description={"Are you sure to delete  " + record.name + "?"}
              onConfirm={() => {
                remove(record._id);
              }}
              okText='Yes, Remove'
              cancelText='No'>
              <Button
                type='primary'
                danger
                onClick={() => {
                  setUserData(record);
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
                setUserData(record);
                setOldData(record);
                form.setFieldsValue(
                  fieldsConfig.reduce((acc: any, field) => {
                    acc[field.fieldName] = record[field.fieldName];
                    return acc;
                  }, {})
                );
                setEdit(true);
                setUserRules(record.rules);
                showModal();
              }}
            />
          </>
        ),
      },
    ],
    [fieldsConfig, remove, setUserData, showModal]
  );

  // --- Filtered Data (useMemo) ---
  const filteredData = useMemo(() => {
    const searchTextLower = searchText.toLowerCase();
    return allUsersData.filter((user: any) => {
      return (
        fieldsConfig.some((field) =>
          String(user[field.fieldName]).toLowerCase().includes(searchTextLower)
        ) || user.user.toLowerCase().includes(searchTextLower)
      );
    });
  }, [allUsersData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
  async function getData() {
    setLoading(true);
    try {
      const response = await Axios.get(`${api}/users`);
      setAllUsersData(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setCookies("loading", false);
    }
  }

  // --- Save User Function ---
  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const { _id, ...rest } = userData; //to  send data without _id

    const response = await Axios.post(`${api}/users`, {
      ...rest,
      user: userName,
    });

    if (response.data.message === "Saved!") {
      getData();
      saveLog(`save new ${PageName.slice(0, -1)}: ` + userData.userName);
      toast.remove();
      toast.success(response.data.message, {
        position: "top-center",
      });
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false;
    }
  }

  // --- Update User Function ---
  async function update() {
    setErrors({ ...Errors, saveErrors: "" });

    const updateData = fieldsConfig.reduce((acc: any, field) => {
      acc[field.fieldName] = form.getFieldValue(field.fieldName);
      return acc;
    }, {});

    //if no data changed
    const noChanges = Object.keys(updateData).every(
      (key) => updateData[key] === oldData[key]
    );

    if (noChanges) {
      toast.remove();
      toast.error("No New Data!", {
        position: "top-center",
      });
      return;
    }
    //

    const response = await Axios.put(`${api}/users`, {
      _id: userData._id,
      ...updateData,
    });

    if (response.data.message === "Updated!") {
      getData();
      toast.remove();
      toast.success(response.data.message, {
        position: "top-center",
      });
      saveLog("update user: " + userData.userName);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false;
    }
  }

  // --- Remove User Function ---
  async function remove(id: string) {
    Axios.delete(`${api}/users/${id}`)
      .then((res) => {
        saveLog("remove user: " + userData.userName);
        toast.success("User removed successfully.");
        getData();
      })
      .catch((error) => {
        console.log(error);
        if (error.response) {
          toast.error(`${error.response.data.message}`);
        } else {
          toast.error("An error occurred. Please try again.");
        }
      });
  }

  // --- Modal Handling Functions ---
  async function showModal() {
    setErrors({ ...Errors, saveErrors: "" });
    setErrors("");
    setIsModalOpen(true);

    if (!edit) {
      // clear last parentUser to fix user Number generat
      setUserData((prevData: any) => ({
        ...prevData,
        parentUser: "",
      }));
    }
  }

  async function handleOk() {
    if (!edit) {
      if (await save()) {
        setIsModalOpen(false);
        form.resetFields();
      }
    } else {
      if (await update()) {
        setIsModalOpen(false);
        form.resetFields();
      }
    }
  }

  function handleCancel() {
    setIsModalOpen(false);
    setEdit(false);
    form.resetFields();
  }

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

      setUserData((prevData: any) => ({
        ...prevData,
        [field]: value,
      }));
    },
    []
  );

  function handleCheckboxChange(key: string) {
    //on check/unchek rule box change userRules values
    setUserRules((prevState) => ({
      ...prevState,
      [key]: prevState[key] === 0 ? 1 : 0,
    }));
  }

  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      userNumber: userData.userNumber,
    });
  }, [userData.userNumber]);

  // --- Validation Messages ---
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

  // --- Modal Title (useMemo) ---
  const modalTitle = useMemo(
    () => (edit ? "Edit " : "Add ") + PageName.slice(0, -1),
    [edit]
  );

  // --- Create Form Item Function ---
  interface CreateFormItemProps {
    fieldName: string;
    value?: any;
    rules?: any[];
    type?: string;
    label?: string;
    fieldOptions?: { label: string; value: any }[];
    readOnly?: boolean;
    showInput?: boolean;
    fieldWidth?: string;
    editable?: boolean;
  }

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
  }: CreateFormItemProps) => {
    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    return (
      <Col key={fieldName} xs={{ flex: fieldWidth }} style={{ padding: 5 }}>
        {showInput && (
          <Form.Item
            key={fieldName}
            label={displayedLabel}
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
            {(type === "text" || type === "password" || type === "email") && (
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
          </Form.Item>
        )}
      </Col>
    );
  };

  // --- Export to
  function handleExport(e: any) {
    console.log("Selected:", e.key);
    if (e.key == 1) {
      exportToJson(filteredData);
    } else if (e.key == 2) {
      exportToExcel(filteredData);
    } else if (e.key == 3) {
      exportToSQL();
    }
  }

  // Define menu items
  const items = [
    {
      key: "1",
      label: "JSON",
    },
    {
      key: "2",
      label: "EXCEL",
    },
    {
      key: "3",
      label: "SQL",
    },
  ];

  // --- Render ---
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
            width={500}
            maskClosable={false}
            footer={[]}>
            <Card>
              <Form
                form={form}
                layout='vertical'
                style={{ maxWidth: 500, textAlign: "center" }}
                validateMessages={validateMessages}
                onFinish={handleOk}>
                <Row>
                  {fieldsConfig.map((field) =>
                    createFormItem({
                      ...field,
                      value: userData[field.fieldName],
                    })
                  )}
                </Row>
                <Card title='Rules'>
                  {Object.keys(userRules).map((key) => (
                    <div style={{ padding: 3 }} key={key}>
                      <Checkbox
                        checked={userRules[key] === 1}
                        onChange={() => handleCheckboxChange(key)}>
                        {" " + capitalize(key)}
                      </Checkbox>
                    </div>
                  ))}
                </Card>
                {Errors.saveErrors && (
                  <>
                    <Form.Item />
                    <Alert
                      closable
                      description={Errors.saveErrors}
                      type='error'
                      showIcon
                    />
                  </>
                )}
                <Divider />
                <Form.Item style={{ marginBottom: -40, textAlign: "right" }}>
                  <Button
                    shape='round'
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    style={{ margin: 5 }}>
                    Cancel
                  </Button>

                  <Button
                    type='primary'
                    shape='round'
                    htmlType='submit'
                    icon={<SaveOutlined />}
                    style={{ margin: 5 }}>
                    Save
                  </Button>
                </Form.Item>
              </Form>
              <br />
            </Card>
          </Modal>
          <Card
            title={PageName}
            style={cardStyle}
            extra={
              <>
                <Dropdown
                  menu={{
                    items,
                    onClick: (e) => handleExport(e),
                  }}>
                  <Button title='Export Data' icon={<FiDownloadCloud />} shape='round'>
                    Export
                  </Button>
                </Dropdown>

                <Button
                  shape='round'
                  icon={<FaPrint />}
                  onClick={() => handlePrint(tableRef, PageName, 12)}
                  style={{ margin: 5 }}>
                  Print
                </Button>

                <Button
                  type='primary'
                  shape='round'
                  icon={<BsPlusLg />}
                  onClick={showModal}
                  style={{ margin: 5 }}>
                  New
                </Button>
              </>
            }>
            {!Errors.connectionError && (
              <>
                <Input.Search
                  placeholder='Search...'
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ paddingBottom: 5 }}
                  allowClear
                  value={searchText}
                />
                <div ref={tableRef}>
                  <Table
                    id='print-table'
                    size='small'
                    columns={columns}
                    dataSource={filteredData}
                    loading={Loading}
                    pagination={false}
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
