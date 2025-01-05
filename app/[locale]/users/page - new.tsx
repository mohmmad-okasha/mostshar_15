"use client";

// --- Imports ---
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Tree,
} from "antd";
import Search from "antd/es/input/Search";
import { BsPlusLg } from "react-icons/bs";
import toast, { Toaster } from "react-hot-toast";
import { FiDownloadCloud, FiMoreVertical } from "react-icons/fi";
import initTranslations from "../../i18n.js";
import { IoSync } from "react-icons/io5";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts"; // Import the KeyboardShortcuts component
import { ExportData } from "../components/ExportData";
import { ExportDataMobile } from "../components/ExportDataMobile";
import { TableActions } from "../components/TableActions";
import { ModalForm } from "../components/ModalForm";
import { DetailsCard } from "../components/DetailsCard";
import ReusableTable from "../components/ReusableTable";
import { TbPrinter } from "react-icons/tb";

// --- Constants ---
const PageName = "Users";
const api = getApiUrl();

// --- Main Component ---
export default function App(props: any) {
  let [settings, setSettings] = useState({
    lang: "",
    theme: "",
  });
  // --- Refs and Hooks ---
  const searchRef = useRef<InputRef>(null);
  const printRef = useRef<any>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
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
  }, [window.innerWidth]);

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
      {
        fixed: "right",
        dataIndex: "actions",
        key: "actions",
        align: "center",
        render: (_: any, record: any) => (
          <TableActions
            record={record}
            onEdit={() => handleEdit(record)}
            onDelete={remove}
            userPermissions={userPermissions}
            isMobile={isMobile}
            label={record.name}
            locale={locale}
          />
        ),
      },
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

    const response = await Axios.post(`${api}/users`, {
      ...rest,
      user: userName,
    });

    if (response.data.message === "Saved!") {
      getData();
      saveLog(t("Add") + " " + t(PageName.slice(0, -1)) + ": " + userData.name);
      toast.remove();
      toast.success(t(response.data.message), {
        position: "top-center",
      });
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: t(response.data.message) });
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
      toast.error(t("No New Data!"), {
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
      toast.success(t(response.data.message), {
        position: "top-center",
      });
      saveLog(t("update") + " " + t("user") + ": " + userData.name);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: t(response.data.message) });
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
    setOldData(record);
    form.setFieldsValue(
      fieldsConfig.reduce((acc: any, field) => {
        acc[field.fieldName] = record[field.fieldName];
        return acc;
      }, {})
    );
    setEdit(true);
    showModal();
  };

  const handleRowClick = (record: any) => {
    setUserData(record);
  };

  const handleRowDoubleClick = (record: any) => {
    handleEdit(record);
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
            <ModalForm
              isModalOpen={isModalOpen} // Control modal visibility
              handleOk={handleOk} // Handle form submission
              handleCancel={handleCancel} // Handle modal close
              setPageData={setUserData} // Update user data
              form={form} // Ant Design form instance
              fieldsConfig={fieldsConfig} // Form fields configuration
              pageData={userData} // Current form data
              errors={Errors} // Error messages (if any)
              modalTitle={(edit ? t("Edit") : t("Add")) + " " + t(PageName.slice(0, -1))} // Modal title
              edit={edit} // Edit mode flag
              locale={locale} // Current locale
              element={
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
              }
            />
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
                />
              </div>
            )}
          </>
        )}
      </Card>

      <KeyboardShortcuts
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
