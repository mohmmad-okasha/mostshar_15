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
} from "@/app/shared";
import {
  Alert,
  Button,
  Card,
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

// --- Constants ---
const PageName = "Payments";
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
  const [allPaymentsData, setAllPaymentsData] = useState<any>([]);
  const [Loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
  });

  // --- Field Configuration (useMemo) ---
  const fieldsConfig = useMemo(
    () => [
      {
        fieldName: "paymentNumber",
        label: "Payment Number",
        type: "number",
        rules: [{ required: false }],
        readOnly: true,
      },
      {
        fieldName: "paymentName",
        label: "Payment Name",
        rules: [{ required: true }],
        type: "text",
      },
      {
        fieldName: "parentPayment",
        label: "Parent Payment",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Main", label: "Main" },
          ...allPaymentsData.map((field: any) => ({
            value: field.paymentName,
            label: field.paymentName,
          })),
        ],
      },
      {
        fieldName: "paymentType",
        label: "Payment Type",
        type: "select",
        rules: [{ required: true }],
        options: [
          { value: "Assets", label: "Assets" },
          { value: "Liabilities", label: "Liabilities" },
          { value: "Equity", label: "Equity" },
          { value: "Revenue", label: "Revenue" },
          { value: "Expenses", label: "Expenses" },
        ],
      },
      {
        fieldName: "balance",
        label: "Balance",
        type: "number",
        rules: [{ required: false }],
      },
      {
        fieldName: "notes",
        label: "Notes",
        type: "text area",
        rules: [{ required: false }],
      },
    ],
    [allPaymentsData]
  );

  // --- Initial Payment Data State ---
  const [paymentData, setPaymentData] = useState(() => {
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
  const columns: TableColumnsType<any> = useMemo(
    () => [
      ...fieldsConfig.map((field) => ({
        title: field.label,
        dataIndex: field.fieldName,
      })),
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
                  setPaymentData(record);
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
                setPaymentData(record);
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
          </>
        ),
      },
    ],
    [fieldsConfig, remove, setPaymentData, showModal]
  );

  // --- Filtered Data (useMemo) ---
  const filteredData = useMemo(() => {
    const searchTextLower = searchText.toLowerCase();
    return allPaymentsData.filter((payment: any) => {
      return (
        fieldsConfig.some((field) =>
          String(payment[field.fieldName]).toLowerCase().includes(searchTextLower)
        ) || payment.user.toLowerCase().includes(searchTextLower)
      );
    });
  }, [allPaymentsData, fieldsConfig, searchText]);

  // --- Data Fetching Function ---
  async function getData() {
    setLoading(true);
    try {
      const response = await Axios.get(`${api}/payments`);
      setAllPaymentsData(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
      setCookies("loading", false);
    }
  }

  // --- Save Payment Function ---
  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const { _id, ...rest } = paymentData;

    const response = await Axios.post(`${api}/payments`, {
      ...rest,
      user: userName,
    });

    if (response.data.message === "Saved!") {
      getData();
      saveLog(`save new ${PageName.slice(0, -1)}: ` + paymentData.paymentName);
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

  // --- Update Payment Function ---
  async function update() {
    setErrors({ ...Errors, saveErrors: "" });

    const updateData = fieldsConfig.reduce((acc: any, field) => {
      acc[field.fieldName] = form.getFieldValue(field.fieldName);
      return acc;
    }, {});

    const response = await Axios.put(`${api}/payments`, {
      _id: paymentData._id,
      ...updateData,
    });

    if (response.data.message === "Updated!") {
      getData();
      toast.remove();
      toast.success(response.data.message, {
        position: "top-center",
      });
      saveLog("update payment: " + paymentData.paymentName);
      setEdit(false);
      return true;
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false;
    }
  }

  // --- Remove Payment Function ---
  async function remove(id: string) {
    Axios.delete(`${api}/payments/${id}`)
      .then((res) => {
        saveLog("remove payment: " + paymentData.paymentName);
        toast.success("Payment removed successfully.");
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

      setPaymentData((prevData: any) => ({
        ...prevData,
        [field]: value,
      }));
    },
    []
  );


  // --- Set Form Field Value Effect Hook ---
  useEffect(() => {
    form.setFieldsValue({
      paymentNumber: paymentData.paymentNumber,
    });
  }, [paymentData.paymentNumber]);

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
  }

  const createFormItem = ({
    fieldName,
    value,
    rules,
    type = "text",
    label,
    fieldOptions = [],
    readOnly = false,
  }: CreateFormItemProps) => {
    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    return (
      <Col key={fieldName} xs={{ flex: "100%" }} style={{ padding: 5 }}>
        <Form.Item key={fieldName} label={displayedLabel} name={fieldName} rules={rules}>
          {type === "select" && (
            <Select
              value={value}
              onChange={handleInputChange(fieldName)}
              showSearch
              allowClear
              options={fieldOptions}
              style={{ width: "100%" }}
              disabled={readOnly}
            />
          )}
          {(type === "text" || type === "number") && (
            <Input
              value={value}
              onChange={handleInputChange(fieldName)}
              type={type}
              disabled={readOnly}
            />
          )}
          {type === "text area" && (
            <Input.TextArea
              value={value}
              onChange={handleInputChange(fieldName)}
              disabled={readOnly}
            />
          )}
        </Form.Item>
      </Col>
    );
  };

  // --- Build Tree Data Function ---
  function buildTreeData(data: any) {
    const sortedData = data.sort((a: any, b: any) =>
      a.paymentNumber.localeCompare(b.paymentNumber)
    );

    const map: any = {};
    const treeData: any[] = [];

    sortedData.forEach((item: any) => {
      map[item.paymentName] = {
        key: item._id,
        title: `${item.paymentNumber} - ${item.paymentName}`,
        children: [],
      };
    });

    sortedData.forEach((item: any) => {
      if (item.parentPayment === "Main") {
        treeData.push(map[item.paymentName]);
      } else if (map[item.parentPayment]) {
        map[item.parentPayment].children.push(map[item.paymentName]);
      }
    });

    return treeData;
  }

  // --- Handle Tree Select Function ---
  const handleSelect = (selectedKeys: any, { node }: { node: any }) => {
    setSearchText(`${node.title.split(" - ")[1]}`);
  };

  // --- Tree Data (useMemo) ---
  const treeData = useMemo(() => buildTreeData(allPaymentsData), [allPaymentsData]);

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
                      value: paymentData[field.fieldName],
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
                  <Button onClick={handleCancel} icon={<CloseOutlined />} />
                  <> </>
                  <Button type='primary' htmlType='submit' icon={<SaveOutlined />} />
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
