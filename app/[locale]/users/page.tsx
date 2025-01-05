"use client";

// --- Imports ---
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Axios from "axios";
import { useCookies } from "react-cookie";
import {
  getRules,
  getApiUrl,
  saveLog,
  handlePrint,
  cardStyle,
  getSettings,
} from "@/app/shared";
import {
  Button,
  Card,
  Divider,
  Dropdown,
  Form,
  Input,
  InputRef,
  Result,
  Tooltip,
  Modal,
  Row,
  Col,
  Alert,
  Select,
  Tree,
  Popconfirm,
} from "antd";
import { BsPlusLg } from "react-icons/bs";
import toast, { Toaster } from "react-hot-toast";
import { FiDownloadCloud, FiMoreVertical } from "react-icons/fi";
import initTranslations from "../../i18n.js";
import { IoSync } from "react-icons/io5";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { ExportData } from "../components/ExportData";
import { ExportDataMobile } from "../components/ExportDataMobile";
import { TableActions } from "../components/TableActions";
import { DetailsCard } from "../components/DetailsCard";
import ReusableTable from "../components/ReusableTable";
import { TbPrinter } from "react-icons/tb";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Search from "antd/es/input/Search.js";

// --- Constants ---
const PageName = "Users";
const api = getApiUrl();

// --- Main Component ---
export default function App() {
  // --- Refs and Hooks ---
  const searchRef = useRef<InputRef>(null);
  const printRef = useRef<any>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [_, setCookies] = useCookies(["loading"]);
  const [form] = Form.useForm();
  const userName = window.localStorage.getItem("userName");

  // --- State Variables ---
  const [settings, setSettings] = useState({ lang: "", theme: "" }); // Added settings state
  const [userPermissions, setUserPermissions] = useState<any>({
    View: 0,
    Add: 0,
    Remove: 0,
    Edit: 0,
    Print: 0,
    Export: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsersData, setAllUsersData] = useState<any>([]);
  const [oldData, setOldData] = useState<any>([]);
  const [LangLoading, setLangloading] = useState(true);
  const [Loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
  });
  const [isMobile, setIsMobile] = useState(false);

  // --- set isMobile screen ---
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
  }, []);

  // --- set Language ---
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
        showDetails: true,
        fieldWidth: "100%",
        columnLength: 20,
      },
      {
        fieldName: "email",
        label: "Email",
        rules: [{ required: true }],
        type: "email",
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "100%",
        editable: true,
        columnLength: 20,
      },
      {
        fieldName: "password",
        label: "Password",
        type: "password",
        rules: [{ required: true }],
        showTable: false,
        showInput: true,
        showDetails: false,
        fieldWidth: "50%",
        editable: true,
        columnLength: 20,
      },
      {
        fieldName: "password2",
        label: "Confirm Password",
        type: "password",
        rules: [{ required: true }],
        showTable: false,
        showInput: true,
        showDetails: false,
        fieldWidth: "50%",
        editable: true,
        columnLength: 20,
      },
      {
        fieldName: "notes",
        label: "Notes",
        type: "text area",
        rules: [{ required: false }],
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "100%",
        editable: true,
        columnLength: 20,
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

  // --- to access last userData value from inside useEffect ---
  const userDataRef = useRef(userData);

  // Update the ref whenever userData changes
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // --- (Fetch Data, Settings, Permissions) ---
  useEffect(() => {
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
                render: (text: any) => {
                  const maxLength = field.columnLength || 20; // Use field-specific maxLength or default to 20
                  const truncatedText =
                    text && text.length > maxLength
                      ? `${text.substring(0, maxLength)} ...`
                      : text;

                  return (
                    <Tooltip title={text?.length > 20 ? text : ""} placement='topLeft'>
                      <span>{truncatedText}</span>
                    </Tooltip>
                  );
                },
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
                                handleEdit(record);
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
                        id={record._id}
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
                        handleEdit(record);
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
      return fieldsConfig.some((field) =>
        String(user[field.fieldName]).toLowerCase().includes(searchTextLower)
      );
    });
  }, [allUsersData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
  async function getData(refresh?: boolean) {
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

      if (refresh) {
        toast.remove();
        toast.success(t("Refreshed"), {
          position: "top-center",
        });
      }
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
        saveLog(t("remove") + " " + t("user") + ": " + userData.name);
        toast.success(t("User") + " " + t("removed successfully."));
        getData();
      })
      .catch((error) => {
        console.log(error);
        if (error.response) {
          toast.error(t(`${error.response.data.message}`));
        } else {
          toast.error(t("An error occurred. Please try again."));
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
        setUserData(""); //clear userData
        form.resetFields(); //reset form fields
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
    setUserData(""); //clear userData
    form.resetFields(); //reset form fields
  }

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

  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      userNumber: userData.userNumber,
    });
  }, [userData.userNumber]);

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

  const handleEdit = (record: any) => {
    if (userPermissions.Edit === 1) {
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
    }
  };

  const handleRowClick = (record: any) => {
    setUserData(record);
  };

  const handleRowDoubleClick = (record: any) => {
    handleEdit(record);
  };

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

  // --- Modal Title (useMemo) ---
  const modalTitle = useMemo(
    () => (edit ? "Edit " : "Add ") + PageName.slice(0, -1),
    [edit]
  );

  // عند تحديد أو إلغاء تحديد أي عنصر
  const onCheck = (checkedKeys: any) => {
    setCheckedKeys(checkedKeys);
  };

  const [checkedKeys, setCheckedKeys] = useState<any>([]); //الصلاحيات المحددة على الشجرة
  const [rolsFilteredData, setRolsFilteredData] = useState<any>([]); //للبحث في الصلاحيات
  const [treeData, setTreeData] = useState<any>([]);

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
              style={{
                ...cardStyle,
              }}
              className='responsive-card'
              extra={
                isMobile ? (
                  // Mobile: Single dropdown with all actions
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "refresh",
                          label: (
                            <div onClick={() => getData(true)}> {t("Refresh Data")}</div>
                          ),
                          icon: <IoSync />,
                        },
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
                                    onClick={async () => {
                                      handlePrint(tableRef, t(PageName), 12, locale);
                                    }}>
                                    {t("Print")}
                                  </div>
                                ),
                                icon: <TbPrinter />,
                              },
                            ]
                          : []),
                        ...(userPermissions.Export == 1
                          ? [
                              {
                                key: "export",
                                label: t("Export"),
                                icon: <FiDownloadCloud />,
                                children: ExportDataMobile({
                                  title: t("Export Data"),
                                  data: filteredData,
                                  pageName: t(PageName),
                                }),
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
                    <Button
                      type='default'
                      shape='circle'
                      title={t("Refresh") + " " + t(PageName) + " 'F5'"}
                      icon={<IoSync />}
                      onClick={() => getData(true)}
                      style={{ margin: 5 }}
                    />
                    {userPermissions.Export == 1 && (
                      <ExportData
                        title={t("Export")}
                        data={filteredData}
                        pageName={t(PageName)}
                      />
                    )}
                    {userPermissions.Print == 1 && (
                      <Button
                        ref={printRef}
                        shape='round'
                        icon={<TbPrinter />}
                        onClick={() => handlePrint(tableRef, t(PageName), 12, locale)}
                        style={{ margin: 5 }}
                        title={t("Print") + " " + t(PageName) + " 'Ctrl+P'"}>
                        {t("Print")}
                      </Button>
                    )}
                    {userPermissions.Add == 1 && (
                      <Button
                        type='primary'
                        shape='round'
                        icon={<BsPlusLg />}
                        onClick={showModal}
                        title={t("New") + " " + t(PageName.slice(0, -1)) + " 'F1'"}
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
                    ref={searchRef}
                  />
                  <div ref={tableRef} style={{ overflowX: "auto" }}>
                    <ReusableTable
                      ref={tableRef}
                      columns={columns}
                      data={filteredData}
                      loading={Loading}
                      selectedId={userData._id}
                      theme={settings.theme}
                      onRowClick={handleRowClick}
                      onRowDoubleClick={handleRowDoubleClick}
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

            <br />

            {userData._id && !isModalOpen && (
              <div ref={detailsRef}>
                <DetailsCard
                  fieldsConfig={fieldsConfig}
                  recordData={userData}
                  locale={locale}
                  pageName={t(PageName)}
                  userPermissions={userPermissions}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <KeyboardShortcuts
        userPermissions={userPermissions}
        onPrint={() => handlePrint(tableRef, t(PageName), 12, locale)}
        onSearch={() => searchRef.current?.focus()}
        onRefresh={() => getData(true)}
        onNew={showModal}
        onDelete={() => {
          if (userPermissions.Remove == 1) {
            const button = document.getElementById(userDataRef.current._id);
            if (button) {
              button.click();
            }
          }
        }}
        locale={locale}
      />
    </div>
  );
}
