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
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  InputRef,
  Modal,
  Result,
  Row,
  Table,
  Tooltip,
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
import { ModalForm } from "../components/ModalForm";
import { DetailsCard } from "../components/DetailsCard";
import ReusableTable from "../components/ReusableTable";
import { TbPrinter } from "react-icons/tb";
import dayjs from "dayjs";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";

// --- Constants ---
const PageName = "Transactions";
const api = getApiUrl();

// --- Main Component ---
export default function TransactionsPage(props: any) {
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
  const [allTransactionsData, setAllTransactionsData] = useState<any>([]);
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
  const locale = settings.lang ? settings.lang : "en";
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
        fieldName: "date",
        label: "Date",
        type: "date",
        rules: [{ required: true }],
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "50%",
        editable: true,
        columnLength: 20,
      },
      {
        fieldName: "description",
        label: "Description",
        type: "text",
        rules: [{ required: false }],
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "50%",
        editable: true,
        columnLength: 20,
      },
      {
        fieldName: "entries",
        label: "Entries",
        type: "multi-fields",
        fields: [
          {
            fieldName: "account",
            label: "Account",
            type: "text",
            rules: [{ required: true }],
            fieldWidth: "50%",
          },
          {
            fieldName: "debit",
            label: "Debit",
            type: "number",
            rules: [{ required: true }],
            fieldWidth: "25%",
          },
          {
            fieldName: "credit",
            label: "Credit",
            type: "number",
            rules: [{ required: true }],
            fieldWidth: "25%",
          },
          {
            fieldName: "description",
            label: "Description",
            type: "text area",
            rules: [{ required: false }],
            fieldWidth: "100%",
          },
          {
            fieldName: "costCenter",
            label: "Cost Center",
            type: "text",
            rules: [{ required: false }],
            fieldWidth: "50%",
          },
        ],
        showTable: true,
        showInput: true,
        showDetails: true,
        fieldWidth: "100%",
        editable: true,
      },
      {
        fieldName: "user",
        label: "User",
        type: "text",
        rules: [{ required: true }],
        showTable: true,
        showInput: false,
        showDetails: true,
        fieldWidth: "100%",
        editable: false,
      },
    ],
    [t]
  );

  // --- Initial Cost Center Data State ---
  const [transactionData, setTransactionData] = useState(() => {
    const initialData: any = {};
    fieldsConfig.forEach((field) => {
      initialData[field.fieldName] = "";
    });
    return initialData;
  });

  // --- to access last transactionData value from inside useEffect ---
  const transactionDataRef = useRef(transactionData);

  // Update the ref whenever transactionData changes
  useEffect(() => {
    transactionDataRef.current = transactionData;
  }, [transactionData]);

  // --- (Fetch Data, Settings, Permissions) ---
  useEffect(() => {
    getSettings(userName).then((value) => {
      setSettings(value);
    });
    getRules(userName, PageName.replace(/\s+/g, "").toLowerCase()).then((value) => {
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
    [fieldsConfig, remove, setTransactionData, showModal]
  );

  // --- Filtered Data (useMemo) ---
  const filteredData = useMemo(() => {
    const searchTextLower = searchText.toLowerCase();
    return allTransactionsData.filter((transaction: any) => {
      return fieldsConfig.some((field) =>
        String(transaction[field.fieldName]).toLowerCase().includes(searchTextLower)
      );
    });
  }, [allTransactionsData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
  async function getData(refresh?: boolean) {
    setLoading(true);
    try {
      const response = await Axios.get(`${api}/transactions`);
      setAllTransactionsData(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching cost centers:", error);
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

  // --- Save Cost Center Function ---
  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const { _id, ...rest } = transactionData; //to  send data without _id

    const response = await Axios.post(`${api}/transactions`, {
      ...rest,
      user: userName,
    });

    if (response.data.message === "Saved!") {
      getData();
      saveLog(t("Add") + " " + t(PageName.slice(0, -1)) + ": " + transactionData.name);
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

  // --- Update Cost Center Function ---
  async function update() {
    setErrors({ ...Errors, saveErrors: "" });

    const updateData = fieldsConfig.reduce((acc: any, field) => {
      // Check if the field type is date
      if (field.type === "date" && form.getFieldValue(field.fieldName)) {
        const parsedDate = dayjs(form.getFieldValue(field.fieldName)).format(
          "YYYY-MM-DD"
        ); // Strict parsing
        acc[field.fieldName] = parsedDate;
      } else {
        acc[field.fieldName] = form.getFieldValue(field.fieldName);
      }
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

    const response = await Axios.put(`${api}/transactions`, {
      _id: transactionData._id,
      ...updateData,
    });

    if (response.data.message === "Updated!") {
      getData();
      toast.remove();
      toast.success(t(response.data.message), {
        position: "top-center",
      });
      saveLog(t("update") + " " + t("cost center") + ": " + transactionData.name);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: t(response.data.message) });
      return false;
    }
  }

  // --- Remove Cost Center Function ---
  async function remove(id: string) {
    Axios.delete(`${api}/transactions/${id}`)
      .then((res) => {
        saveLog(t("remove") + " " + t("cost center") + ": " + transactionData.name);
        toast.success(t("Cost Center") + " " + t("removed successfully."));
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
  }

  async function handleOk() {
    if (!edit) {
      if (await save()) {
        setIsModalOpen(false);
        setTransactionData(""); //clear transactionData
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
    setTransactionData(""); //clear transactionData
    form.resetFields(); //reset form fields
  }

  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      name: transactionData.name,
    });
  }, [transactionData.name]);

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
      setOldData(record);

      // Format date fields to "YYYY-MM-DD"
      const formattedFields = fieldsConfig.reduce((acc: any, field) => {
        const value = record[field.fieldName];

        // Check if the field type is date
        if (field.type === "date" && value) {
          const parsedDate = dayjs(value); // Strict parsing
          acc[field.fieldName] = parsedDate;
        } else {
          acc[field.fieldName] = value;
        }

        return acc;
      }, {});

      form.setFieldsValue(formattedFields);
      setEdit(true);
      showModal();
    }
  };

  const handleRowClick = (record: any) => {
    setTransactionData(record);
  };

  const handleRowDoubleClick = (record: any) => {
    handleEdit(record);
  };

  // --- Input Change Handler ---
  const handleInputChange = useCallback(
    (field: any) => (e: any) => {
      let value;

      if (field === "date") {
        value = dayjs(e).format("YYYY-MM-DD");
      } else {
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
      }

      setTransactionData((prevData: any) => ({
        ...prevData,
        [field]: value,
      }));
    },
    []
  );

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
              title={(edit ? t("Edit") : t("Add")) + " " + t(PageName.slice(0, -1))}
              open={isModalOpen}
              onCancel={handleCancel}
              width={700}
              maskClosable={false}
              footer={null} // Remove default footer
            >
              <Card>
                <Form
                  form={form}
                  layout='vertical'
                  style={{
                    maxWidth: 700,
                    textAlign: locale === "ar" ? "right" : "left",
                  }}
                  onFinish={handleOk}
                  validateMessages={validateMessages}>
                  <Row>
                    <Col key='date' xs={{ flex: "50%" }} style={{ padding: 5 }}>
                      <Form.Item
                        key='date'
                        label={t("Date")}
                        name='date'
                        rules={[{ required: true }]}>
                        <DatePicker
                          format='YYYY-MM-DD'
                          value={
                            transactionData.date
                              ? dayjs(transactionData.date, "YYYY-MM-DD", true)
                              : dayjs()
                          }
                          onChange={handleInputChange("date")}
                        />
                      </Form.Item>
                    </Col>
                    <Col key='description' xs={{ flex: "50%" }} style={{ padding: 5 }}>
                      <Form.Item
                        key='description'
                        label={t("description")}
                        name='description'
                        rules={[{ required: true }]}>
                        <Input
                          value={transactionData.description}
                          onChange={handleInputChange("description")}
                          type={"text"}
                        />
                      </Form.Item>
                    </Col>
                    <Col key='entries' xs={{ flex: "100%" }} style={{ padding: 5 }}>
                      <Divider>{t("Entries")}</Divider>
                      <Table columns={columns} dataSource={transactionData.entries} size='small' />
                      
                    </Col>
                  </Row>

                  {Errors.saveErrors && (
                    <Alert
                      closable
                      description={Errors.saveErrors}
                      type='error'
                      showIcon
                    />
                  )}
                  <Divider />
                  <div style={{ textAlign: "center", direction: "rtl" }}>
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
                      selectedId={transactionData._id}
                      theme={settings.theme ? settings.theme : "light"}
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

            {transactionData._id && !isModalOpen && (
              <div ref={detailsRef}>
                <DetailsCard
                  fieldsConfig={fieldsConfig}
                  recordData={transactionData}
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
            const button = document.getElementById(transactionDataRef.current._id);
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
