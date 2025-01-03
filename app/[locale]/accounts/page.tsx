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
  getSettings,
} from "@/app/shared";
import {
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Dropdown,
  Form,
  Input,
  InputRef,
  Result,
  Select,
  Table,
  Tree,
} from "antd";
import { BsPlusLg } from "react-icons/bs";
import { FaPrint } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";
import { FiDownloadCloud, FiMoreVertical } from "react-icons/fi";
import * as XLSX from "xlsx";
import initTranslations from "../../i18n.js";
import { IoSync } from "react-icons/io5";
import Paragraph from "antd/es/typography/Paragraph.js";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts"; // Import the KeyboardShortcuts component
import { ExportData } from "../components/ExportData";
import { ExportDataMobile } from "../components/ExportDataMobile";
import { TableActions } from "../components/TableActions";
import { ModalForm } from "../components/ModalForm";
import { DetailsCard } from "../components/DetailsCard";

// --- Constants ---
const PageName = "Accounts";
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
        fieldName: "accountNumber",
        label: "Account Number",
        type: "number",
        rules: [{ required: false }],
        readOnly: true,
        showTable: true,
        showInput: false,
        showDetails: false,
        fieldWidth: "100%",
      },
      {
        fieldName: "accountName",
        label: "Account Name",
        rules: [{ required: true }],
        type: "text",
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "100%",
        editable: true,
      },
      {
        fieldName: "parentAccount",
        label: "Parent Account",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Main", label: t("Main") },
          ...allAccountsData.map((field: any) => ({
            value: field.accountName,
            label: field.accountName,
          })),
        ],
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "100%",
        editable: false,
      },
      {
        fieldName: "accountType",
        label: "Account Type",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Assets", label: t("Assets") },
          { value: "Liabilities", label: t("Liabilities") },
          { value: "Equity", label: t("Equity") },
          { value: "Revenue", label: t("Revenue") },
          { value: "Expenses", label: t("Expenses") },
        ],
        showTable: true,
        showInput: true,
        showDetails: true,
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
        showDetails: true,
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
        showDetails: true,
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

  // --- to access last accountData value from inside useEffect ---
  const accountDataRef = useRef(accountData);
  // Update the ref whenever accountData changes
  useEffect(() => {
    accountDataRef.current = accountData;
  }, [accountData]);

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
            onDelete={handleDelete}
            userPermissions={userPermissions}
            isMobile={isMobile}
            label={record.accountName}
            locale={locale}
          />
        ),
      },
    ],
    [fieldsConfig, remove, setAccountData, showModal]
  );

  // --- Filtered Data (useMemo) ---
  const filteredData = useMemo(() => {
    const searchTextLower = searchText.toLowerCase();
    return allAccountsData.filter((account: any) => {
      return fieldsConfig.some((field) =>
        String(account[field.fieldName]).toLowerCase().includes(searchTextLower)
      );
    });
  }, [allAccountsData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
  async function getData(refresh?: boolean) {
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

      if (refresh) {
        toast.remove();
        toast.success(t("Refreshed"), {
          position: "top-center",
        });
      }
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
      saveLog(t("Add") + " " + t(PageName.slice(0, -1)) + ": " + accountData.accountName);
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
      toast.error(t("No New Data!"), {
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
      toast.success(t(response.data.message), {
        position: "top-center",
      });
      saveLog(t("update") + " " + t("account") + ": " + accountData.accountName);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: t(response.data.message) });
      return false;
    }
  }

  // --- Remove Account Function ---
  async function remove(id: string) {
    Axios.delete(`${api}/accounts/${id}`)
      .then((res) => {
        saveLog(t("remove") + " " + t("account") + ": " + accountData.accountName);
        toast.success(t("Account") + " " + t("removed successfully."));
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
        setAccountData(""); //clear accountData
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
    setAccountData(""); //clear accountData
    form.resetFields(); //reset form fields
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
    if (isModalOpen) {
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
    }
  }, [accountData.parentAccount]);

  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      accountNumber: accountData.accountNumber,
    });
  }, [accountData.accountNumber]);

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

  // --- Modal Title (useMemo) ---
  const modalTitle = useMemo(
    () => (edit ? t("Edit") : t("Add")) + " " + t(PageName.slice(0, -1)),
    [edit, isModalOpen]
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
    showDetails?: boolean;
    fieldWidth?: string;
    editable?: boolean;
  }

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

  const handleDelete = (id: string) => {
    Axios.delete(`${api}/accounts/${id}`)
      .then((res) => {
        toast.success(t("Account removed successfully."));
        getData();
      })
      .catch((error) => {
        toast.error(t("An error occurred. Please try again."));
      });
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
              setAccountData={setAccountData} // Update account data
              form={form} // Ant Design form instance
              fieldsConfig={fieldsConfig} // Form fields configuration
              accountData={accountData} // Current form data
              errors={Errors} // Error messages (if any)
              modalTitle={(edit ? t("Edit") : t("Add")) + " " + t(PageName.slice(0, -1))} // Modal title
              edit={edit} // Edit mode flag
              locale={locale} // Current locale
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
                                icon: <FaPrint />,
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
                        icon={<FaPrint />}
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
                  <Card>
                    <Tree onSelect={handleSelect} treeData={treeData} />
                  </Card>
                  <Divider />
                  <Input.Search
                    placeholder={t("Search...")}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ paddingBottom: 5 }}
                    allowClear
                    value={searchText}
                    ref={searchRef}
                    //onKeyDown={handleSearchKeyDown}
                  />
                  <div ref={tableRef} style={{ overflowX: "auto" }}>
                    <Table
                      id='print-table'
                      size='small'
                      columns={columns.map((col: any) => ({
                        ...col,
                        ellipsis: true, // Ensure text doesn't overflow
                      }))}
                      dataSource={filteredData}
                      loading={Loading}
                      pagination={false}
                      rowKey={(record) => record._id}
                      scroll={{ x: "max-content" }}
                      rowClassName={(record) =>
                        record._id === accountData._id
                          ? settings.theme === "dark"
                            ? "selected-row-dark"
                            : "selected-row-light"
                          : ""
                      } // Add a class to the selected row
                      onRow={(record) => ({
                        onClick: () => {
                          setAccountData(record);
                        },
                        onDoubleClick: () => {
                          handleEdit(record);
                        },
                        style: { cursor: "pointer" },
                      })}
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

            {accountData._id && !isModalOpen && (
              <DetailsCard
                fieldsConfig={fieldsConfig}
                recordData={accountData}
                locale={locale}
              />
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
            const button = document.getElementById(accountDataRef.current._id);
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
