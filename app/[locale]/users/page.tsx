"use client";

// --- Imports ---
import React, { useState, useEffect, useRef, useCallback, useMemo, use } from "react";
import Axios from "axios";
import { useCookies } from "react-cookie";
import {
  getRules,
  getApiUrl,
  saveLog,
  handlePrint,
  cardStyle,
  capitalize,
  getSettings,
} from "@/app/shared";
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
import { FiDownloadCloud, FiMoreVertical } from "react-icons/fi";
import * as XLSX from "xlsx";
import Search from "antd/es/input/Search";
import initTranslations from "../../i18n.js";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsersData, setAllUsersData] = useState<any>([]);
  const [treeData, setTreeData] = useState<any>([]);
  const [oldData, setOldData] = useState<any>([]);
  const [Loading, setLoading] = useState(true);
  const [LangLoading, setLangloading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
  });
  const [userPermissions, setUserPermissions] = useState<any>({
    View: 0,
    Add: 0,
    Remove: 0,
    Edit: 0,
    Print: 0,
    Export: 0,
  });
  let [settings, setSettings] = useState({
    lang: "",
    theme: "",
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768); // Mobile screen width threshold
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [window.innerWidth]);
  File;

  const locale = settings.lang;
  const [t, setT] = useState(() => (key: any) => key);
  useEffect(() => {
    setLangloading(true);
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
      setLangloading(false);
    }
    loadTranslations();
  }, [locale]);

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
    // to get user settings
    getSettings(userName).then((value) => {
      setSettings(value);
    });
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
                title: t(field.label),
                dataIndex: field.fieldName,
              }
            : null
        )
        .filter(Boolean),
      {
        title: t("User"),
        dataIndex: "user",
      },
      userPermissions.Remove == 1 || userPermissions.Edit == 1
        ? {
            title: isMobile ? " " : t("Actions"),
            dataIndex: "Actions",
            key: "Actions",
            align: "center",
            className: "no_print",
            fixed: "right",
            render: (_: any, record: any) => {
              if (isMobile) {
                // Mobile: Use a single dropdown with actions
                const menuItems = [
                  ...(userPermissions.Edit == 1
                    ? [
                        {
                          key: "edit",
                          label: (
                            <div
                            onClick={() => {
                              setUserData(record);
                              setOldData(record);
                              form.setFieldsValue(
                                fieldsConfig.reduce((acc: any, field) => {
                                  acc[field.fieldName] = record[field.fieldName];
                                  return acc;
                                }, {})
                              );
                              form.setFieldValue("password", "");
                              form.setFieldValue("password2", "");
        
                              setEdit(true);
        
                              // تجهيز checkedKeys بناءً على صلاحيات المستخدم
                              const initialCheckedKeys: any[] = [];
                              Object.keys(record.rules).forEach((table) => {
                                const actions = record.rules[table];
                                Object.keys(actions).forEach((action: any) => {
                                  if (actions[action] === 1) {
                                    initialCheckedKeys.push(`${table}_${action}`);
                                  }
                                });
                              });
        
                              setCheckedKeys(initialCheckedKeys);
                              showModal();
                            }}>
                              <EditOutlined /> {t("Edit")}
                            </div>
                          ),
                        },
                      ]
                    : []),
                  ...(userPermissions.Remove == 1
                    ? [
                        {
                          key: "remove",
                          label: (
                            <Popconfirm
                              title={`${t("Delete the")} ${t(PageName.slice(0, -1))}`}
                              description={`${t("Are you sure to delete")} ${
                                record.name
                              }`}
                              onConfirm={() => {
                                remove(record._id);
                              }}
                              okText={t("Yes, Remove")}
                              cancelText={t("No")}>
                              <div>
                                <DeleteOutlined /> {t("Remove")}
                              </div>
                            </Popconfirm>
                          ),
                        },
                      ]
                    : []),
                ];

                return (
                  <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                    <Button
                      type='dashed'
                      shape='circle'
                      size='small'
                      icon={<FiMoreVertical />}
                    />
                  </Dropdown>
                );
              }

              // Desktop: Show separate buttons
              return (
                <>
                  {userPermissions.Remove == 1 && (
                    <Popconfirm
                      title={`${t("Delete the")} ${t(PageName.slice(0, -1))}`}
                      description={`${t("Are you sure to delete")} ${record.name}`}
                      onConfirm={() => {
                        remove(record._id);
                      }}
                      okText={t("Yes, Remove")}
                      cancelText={t("No")}>
                      <Button
                        style={{ marginLeft: 5 }}
                        type='primary'
                        danger
                        shape='circle'
                        size='small'
                        onClick={() => {
                          setUserData(record);
                        }}
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                  {userPermissions.Edit == 1 && (
                    <Button
                      type='primary'
                      shape='circle'
                      size='small'
                      style={{ marginLeft: 5 }}
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
                        form.setFieldValue("password", "");
                        form.setFieldValue("password2", "");

                        setEdit(true);

                        // تجهيز checkedKeys بناءً على صلاحيات المستخدم
                        const initialCheckedKeys: any[] = [];
                        Object.keys(record.rules).forEach((table) => {
                          const actions = record.rules[table];
                          Object.keys(actions).forEach((action: any) => {
                            if (actions[action] === 1) {
                              initialCheckedKeys.push(`${table}_${action}`);
                            }
                          });
                        });

                        setCheckedKeys(initialCheckedKeys);
                        showModal();
                      }}
                    />
                  )}
                </>
              );
            },
          }
        : {},


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

    // save rules
    const formattedPermissions: any = {};
    checkedKeys.forEach((key: any) => {
      const [table, action] = key.split("_");
      if (action) {
        if (!formattedPermissions[table]) {
          formattedPermissions[table] = {};
        }
        formattedPermissions[table][action] = 1;
      }
    }); /////////

    const response = await Axios.post(`${api}/users`, {
      ...rest,
      rules: formattedPermissions,
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

    // save rules
    const formattedPermissions: any = {};
    checkedKeys.forEach((key: any) => {
      const [table, action] = key.split("_");
      if (action) {
        if (!formattedPermissions[table]) {
          formattedPermissions[table] = {};
        }
        formattedPermissions[table][action] = 1;
      }
    }); /////////

    const response = await Axios.put(`${api}/users`, {
      _id: userData._id,
      rules: formattedPermissions,
      user: userName,
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
      //setCheckedKeys([])
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

  const [checkedKeys, setCheckedKeys] = useState<any>([]); //الصلاحيات المحددة على الشجرة
  const [rolsFilteredData, setRolsFilteredData] = useState<any>([]); //للبحث في الصلاحيات

  // جلب أسماء الجداول من API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await Axios.get(`${api}/tables`); // يعيد أسماء الجداول
        const tables = res.data;

        // تجهيز بيانات الـ TreeView
        const formattedData = Object.keys(tables).map((table) => ({
          title: t(table),
          key: table,
          children: Object.keys(tables[table]).map((action) => ({
            title: t(action),
            key: `${table}_${action}`,
          })),
        }));

        setTreeData(formattedData);
        setRolsFilteredData(formattedData);
      } catch (error) {
        console.log("Failed to fetch table data");
      }
    };

    fetchTables();
  }, []);

  // عند تحديد أو إلغاء تحديد أي عنصر
  const onCheck = (checkedKeys: any) => {
    setCheckedKeys(checkedKeys);
  };

  //test
  useEffect(() => {
    const formattedPermissions: any = {};
    checkedKeys.forEach((key: any) => {
      const [table, action] = key.split("_");
      if (!formattedPermissions[table]) {
        formattedPermissions[table] = {};
      }
      formattedPermissions[table][action] = 1;
    });
    console.log(formattedPermissions);
  }, [checkedKeys]);

  // البحث في الصلاحيات
  const onSearch = (value: any) => {
    if (!value) {
      // إذا كان البحث فارغًا، إعادة البيانات الأصلية
      setRolsFilteredData(treeData);
    } else {
      // تصفية البيانات بناءً على النص المدخل في أسماء الجداول فقط
      const filtered = treeData
        .map((node: any) => {
          // تصفية الجداول بناءً على اسم الجدول فقط
          if (node.title.toLowerCase().includes(value.toLowerCase())) {
            // إذا كانت الجداول تحتوي على النص المدخل في اسمها، نقوم بإظهارها مع الأحداث
            return {
              ...node,
              children: node.children, // نعرض جميع الأحداث كما هي
            };
          }
          return null;
        })
        .filter((node: any) => node !== null); // تصفية القيم الفارغة

      setRolsFilteredData(filtered);
    }
  };

  // --- Render ---
  return (
    <div className='responsive-card-wrapper'>
      <Card style={{ border: 0 }} loading={LangLoading}>
        <div>
          <Toaster />
        </div>
        {userPermissions.View == 1 && (
          <>
            <Modal
              title={t(modalTitle)}
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

                  <Card title={t("Permissions")}>
                    <Search
                      placeholder={t("Search")}
                      allowClear
                      onSearch={onSearch}
                      onChange={(e) => onSearch(e.target.value)}
                      style={{ marginBottom: "16px" }}
                    />
                    <Tree
                      checkable
                      //defaultExpandAll
                      onCheck={onCheck}
                      checkedKeys={checkedKeys}
                      treeData={rolsFilteredData}
                      style={{ direction: "ltr" }}
                    />
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
                  <Form.Item
                    style={{ marginBottom: -40, textAlign: "right", direction: "ltr" }}>
                    <Button
                      shape='round'
                      icon={<CloseOutlined />}
                      onClick={handleCancel}
                      style={{ margin: 5 }}>
                      {t("Cancel")}
                    </Button>

                    <Button
                      type='primary'
                      shape='round'
                      htmlType='submit'
                      icon={<SaveOutlined />}
                      style={{ margin: 5 }}>
                      {t("Save")}
                    </Button>
                  </Form.Item>
                </Form>
                <br />
              </Card>
            </Modal>
            <Card
              title={t(PageName)}
              style={cardStyle}
              className='responsive-card'
              extra={
                isMobile ? (
                  // Mobile: Single dropdown with all actions
                  <Dropdown
                    menu={{
                      items: [
                        ...(userPermissions.Add == 1
                          ? [
                              {
                                key: "new",
                                label: <div onClick={showModal}>{t("New")}</div>,
                                icon: <BsPlusLg />,
                              },
                            ]
                          : []),
                        ...(userPermissions.Print == 1
                          ? [
                              {
                                key: "print",
                                label: (
                                  <div
                                    onClick={() =>
                                      handlePrint(tableRef, t(PageName), 12, locale)
                                    }>
                                    {t("Print")}
                                  </div>
                                ),
                                icon: <FaPrint />,
                              },
                            ]
                          : []),
                        ...(userPermissions.Export == 1
                          ? [
                              {
                                key: "export",
                                label: t("Export"),
                                children: items.map((item) => ({
                                  key: item.key,
                                  label: (
                                    <div onClick={() => handleExport(item)}>
                                      {t(item.label)}
                                    </div>
                                  ),
                                })),
                              },
                            ]
                          : []),
                      ],
                    }}>
                    <Button
                      shape='circle'
                      icon={<FiMoreVertical />}
                      style={{ margin: 5 }}
                    />
                  </Dropdown>
                ) : (
                  // Desktop: Separate buttons
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
                          {t("Export")}
                        </Button>
                      </Dropdown>
                    )}
                    {userPermissions.Print == 1 && (
                      <Button
                        shape='round'
                        icon={<FaPrint />}
                        onClick={() => handlePrint(tableRef, t(PageName), 12, locale)}
                        style={{ margin: 5 }}>
                        {t("Print")}
                      </Button>
                    )}
                    {userPermissions.Add == 1 && (
                      <Button
                        type='primary'
                        shape='round'
                        icon={<BsPlusLg />}
                        onClick={showModal}
                        style={{ margin: 5 }}>
                        {t("New")}
                      </Button>
                    )}
                  </>
                )
              }>
              {!Errors.connectionError && (
                <>
                  <Input.Search
                    placeholder={t("Search...")}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ paddingBottom: 5 }}
                    allowClear
                    value={searchText}
                  />
                  <div ref={tableRef} style={{ overflowX: "auto" }}>
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
      </Card>
    </div>
  );
}
