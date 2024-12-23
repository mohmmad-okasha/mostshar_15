"use client";

// --- Imports ---
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Axios from "axios";
import { useCookies } from "react-cookie";
import {
  getRules,
  getApiUrl,
  saveLog,
  handlePrint,
  cardStyle,
  generateAccountNumber,
} from "@/app/shared";
import {
  Alert,
  Button,
  Card,
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
  Space,
  Table,
  TableColumnsType,
  Tree,
} from "antd";
import { BsPlusLg } from "react-icons/bs";
import {
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { FaFileExport, FaPrint } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";
import { FiDownloadCloud } from "react-icons/fi";
import * as XLSX from "xlsx";

// --- Constants ---
const PageName = "Accounts";
const api = getApiUrl();

// --- Main Component ---
export default function App() {
  // --- Refs and Hooks ---
  const tableRef = useRef<HTMLDivElement>(null);
  const [_, setCookies] = useCookies(["loading"]);
  const [form] = Form.useForm();
  const userName = window.localStorage.getItem("userName");

  // --- State Variables ---
  const [userPermissions, setUserPermissions] = useState<any>({
    View: 0,
    Add: 0,
    Remove: 0,
    Edit: 0,
    Print: 0,
    Export: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allAccountsData, setAllAccountsData] = useState<any>([]);
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
    const tableName = "accounts"; //table name

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

  // --- Field Configuration (useMemo) ---
  const fieldsConfig = useMemo(
    () => [
      {
        fieldName: "accountNumber",
        label: "Account Number",
        type: "number",
        rules: [{ required: false }],
        readOnly: true,
        showTable: true,
        showInput: false,
        fieldWidth: "100%",
      },
      {
        fieldName: "accountName",
        label: "Account Name",
        rules: [{ required: true }],
        type: "text",
        showTable: true,
        showInput: true,
        fieldWidth: "100%",
        editable: true,
      },
      {
        fieldName: "parentAccount",
        label: "Parent Account",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Main", label: "Main" },
          ...allAccountsData.map((field: any) => ({
            value: field.accountName,
            label: field.accountName,
          })),
        ],
        showTable: true,
        showInput: true,
        fieldWidth: "100%",
        editable: false,
      },
      {
        fieldName: "accountType",
        label: "Account Type",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Assets", label: "Assets" },
          { value: "Liabilities", label: "Liabilities" },
          { value: "Equity", label: "Equity" },
          { value: "Revenue", label: "Revenue" },
          { value: "Expenses", label: "Expenses" },
        ],
        showTable: true,
        showInput: true,
        fieldWidth: "50%",
        editable: true,
      },
      {
        fieldName: "balance",
        label: "Balance",
        type: "number",
        rules: [{ required: false }],
        showTable: true,
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
    [allAccountsData]
  );

  // --- Initial Account Data State ---
  const [accountData, setAccountData] = useState(() => {
    const initialData: any = {};
    fieldsConfig.forEach((field) => {
      initialData[field.fieldName] = "";
    });
    return initialData;
  });

  // --- Effects Hooks ---
  useEffect(() => {
    getRules(userName, PageName.toLowerCase()).then((value) => {
      setUserPermissions(value);
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
      userPermissions.Remove == 1 || userPermissions.Edit ==1 ? 
      {
        title: "Actions",
        dataIndex: "Actions",
        key: "Actions",
        align: "center",
        className: "no_print",
        fixed: "right",
        render: (_: any, record: any) => (
          <>
            {userPermissions.Remove == 1 && (
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
                    setAccountData(record);
                  }}
                  shape='circle'
                  size='small'
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
            {userPermissions.Edit == 1 && (
              <Button
                type='primary'
                shape='circle'
                size='small'
                icon={<EditOutlined />}
                onClick={() => {
                  setAccountData(record);
                  setOldData(record);
                  form.setFieldsValue(
                    fieldsConfig.reduce((acc: any, field) => {
                      acc[field.fieldName] = record[field.fieldName];
                      return acc;
                    }, {})
                  );
                  setEdit(true);
                  showModal();
                }}
              />
            )}
          </>
        ),
      } : {}
    ],
    [fieldsConfig, remove, setAccountData, showModal]
  );

  // --- Filtered Data (useMemo) ---
  const filteredData = useMemo(() => {
    const searchTextLower = searchText.toLowerCase();
    return allAccountsData.filter((account: any) => {
      return (
        fieldsConfig.some((field) =>
          String(account[field.fieldName]).toLowerCase().includes(searchTextLower)
        ) || account.user.toLowerCase().includes(searchTextLower)
      );
    });
  }, [allAccountsData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
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

  // --- Save Account Function ---
  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const { _id, ...rest } = accountData; //to  send data without _id

    const response = await Axios.post(`${api}/accounts`, {
      ...rest,
      user: userName,
    });

    if (response.data.message === "Saved!") {
      getData();
      saveLog(`save new ${PageName.slice(0, -1)}: ` + accountData.accountName);
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

  // --- Update Account Function ---
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

    const response = await Axios.put(`${api}/accounts`, {
      _id: accountData._id,
      ...updateData,
    });

    if (response.data.message === "Updated!") {
      getData();
      toast.remove();
      toast.success(response.data.message, {
        position: "top-center",
      });
      saveLog("update account: " + accountData.accountName);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false;
    }
  }

  // --- Remove Account Function ---
  async function remove(id: string) {
    Axios.delete(`${api}/accounts/${id}`)
      .then((res) => {
        saveLog("remove account: " + accountData.accountName);
        toast.success("Account removed successfully.");
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
      // clear last parentAccount to fix account Number generat
      setAccountData((prevData: any) => ({
        ...prevData,
        parentAccount: "",
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

      setAccountData((prevData: any) => ({
        ...prevData,
        [field]: value,
      }));
    },
    []
  );

  // --- Generate Account Number Effect Hook ---
  useEffect(() => {
    getData();
    const fetchAndGenerateAccountNumber = async () => {
      if (accountData.parentAccount != "") {
        const newAccountNumber = await generateAccountNumber(accountData.parentAccount);
        setAccountData((prevData: any) => ({
          ...prevData,
          accountNumber: newAccountNumber,
        }));
      }
    };

    fetchAndGenerateAccountNumber();
  }, [accountData.parentAccount]);

  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      accountNumber: accountData.accountNumber,
    });
  }, [accountData.accountNumber]);

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
            {(type === "text" || type === "number") && (
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

  // --- Build Tree Data Function ---
  function buildTreeData(data: any) {
    const sortedData = data.sort((a: any, b: any) =>
      a.accountNumber.localeCompare(b.accountNumber)
    );

    const map: any = {};
    const treeData: any[] = [];

    sortedData.forEach((item: any) => {
      map[item.accountName] = {
        key: item._id,
        title: `${item.accountNumber} - ${item.accountName}`,
        children: [],
      };
    });

    sortedData.forEach((item: any) => {
      if (item.parentAccount === "Main") {
        treeData.push(map[item.accountName]);
      } else if (map[item.parentAccount]) {
        map[item.parentAccount].children.push(map[item.accountName]);
      }
    });

    return treeData;
  }

  // --- Handle Tree Select Function ---
  const handleSelect = (selectedKeys: any, { node }: { node: any }) => {
    setSearchText(`${node.title.split(" - ")[1]}`);
  };

  // --- Tree Data (useMemo) ---
  const treeData = useMemo(() => buildTreeData(allAccountsData), [allAccountsData]);

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
      {userPermissions.View == 1 && (
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
                      value: accountData[field.fieldName],
                      fieldOptions: field.options,
                    })
                  )}
                </Row>
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
                {userPermissions.Export == 1 && (
                  <Dropdown
                    menu={{
                      items,
                      onClick: (e) => handleExport(e),
                    }}>
                    <Button
                      style={{ margin: 5 }}
                      title='Export Data'
                      icon={<FiDownloadCloud />}
                      shape='round'>
                      Export
                    </Button>
                  </Dropdown>
                )}
                {userPermissions.Print == 1 && (
                  <Button
                    shape='round'
                    icon={<FaPrint />}
                    onClick={() => handlePrint(tableRef, PageName, 12)}
                    style={{ margin: 5 }}>
                    Print
                  </Button>
                )}
                {userPermissions.Add == 1 && (
                  <Button
                    type='primary'
                    shape='round'
                    icon={<BsPlusLg />}
                    onClick={showModal}
                    style={{ margin: 5 }}>
                    New
                  </Button>
                )}
              </>
            }>
            {!Errors.connectionError && (
              <>
                <Card>
                  <Tree onSelect={handleSelect} treeData={treeData} />
                </Card>
                <Divider />
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
