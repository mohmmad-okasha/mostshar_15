"use client";
const PageName = "Receipts";

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
  Tree,
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
  const [allReceiptsData, setAllReceiptsData] = useState<any>([]);
  const [Loading, setLoading] = useState(true); // to show loading before get data form db
  const [edit, setEdit] = useState(false); // if true update else save new
  const [searchText, setSearchText] = useState(""); // to search on table
  const [Errors, setErrors] = useState<any>({
    connectionError: "",
    saveErrors: "",
    confirmPasswordError: "",
  });
  const [receiptData, setReceiptData] = useState({
    _id: "",
    receiptNumber: "",
    receiptName: "",
    receiptType: "",
    balance: "",
    parentReceipt: "",
    notes: "",
  });

  const payOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Visa", label: "Visa" },
    { value: "Master", label: "Master" }
  ];



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
    // {
    //   label: "Parent Receipt",
    //   name: "parentReceipt",
    //   type: "select",
    //   rules: [{ required: true }],
    //   options: AccounsOptions,
    // },
    {
      label: "Receipt Number",
      name: "receiptNumber",
      type: "text",
      rules: [{ required: true }],
    },
    {
      label: "Receipt Name",
      name: "receiptName",
      type: "text",
      rules: [{ required: true }],
    },
    {
      label: "Receipt Type",
      name: "receiptType",
      type: "select",
      options: payOptions,
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
  //   (field) => field.name !== "user" && field.name !== "receiptNumber"
  // );

  //const filteredFields = fields.filter((field) => field.name !== "receiptNumber");

  const columns: TableColumnsType<any> = [
    {
      title: "Receipt Number",
      dataIndex: "receiptNumber",
    },
    {
      title: "Receipt Name",
      dataIndex: "receiptName",
    },
    {
      title: "Parent Receipt",
      dataIndex: "parentReceipt",
    },
    {
      title: "Receipt Type",
      dataIndex: "receiptType",
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
                setReceiptData(record);
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
              setReceiptData(record);
              form.setFieldsValue({
                receiptName: record.receiptName,
                receiptNumber: record.receiptNumber,
                parentReceipt: record.parentReceipt,
                receiptType: record.receiptType,
                balance: record.balance,
                notes: record.notes,
              });
              setEdit(true);
              showModal();
            }}
          />
        </>
      ),
    },
  ];

  const filteredData = allReceiptsData.filter((receipt: any) => {
    // Implement your search logic here
    const searchTextLower = searchText.toLowerCase(); // Case-insensitive search
    return (
      // Search relevant fields
      receipt.receiptNumber.toLowerCase().includes(searchTextLower) ||
      receipt.receiptName.toLowerCase().includes(searchTextLower) ||
      receipt.receiptName.toLowerCase().includes(searchTextLower) ||
      receipt.parentReceipt.toLowerCase().includes(searchTextLower) ||
      receipt.receiptType.toLowerCase().includes(searchTextLower) ||
      receipt.notes.toLowerCase().includes(searchTextLower) ||
      receipt.user.toLowerCase().includes(searchTextLower)
      // Add more fields as needed based on your data structure
    );
  });

  async function getData() {
    setLoading(true);
    try {
      const response = await Axios.get(`${api}/receipts`);
      setAllReceiptsData(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
      setCookies("loading", false);
    }
  }

  async function save() {
    setErrors({ ...Errors, saveErrors: "" });
    const response = await Axios.post(`${api}/receipts`, {
      receiptNumber: receiptData.receiptNumber,
      receiptName: receiptData.receiptName,
      receiptType: receiptData.receiptType,
      balance: receiptData.balance,
      parentReceipt: receiptData.parentReceipt,
      notes: receiptData.notes,
      user: userName,
    });
    if (response.data.message === "Saved!") {
      getData();
      saveLog("save new receipt: " + receiptData.receiptName);
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
    setErrors({ ...Errors, saveErrors: "" });
    const response = await Axios.put(`${api}/receipts`, {
      _id: receiptData._id,
      receiptName: form.getFieldValue("receiptName"),
      //receiptNumber: form.getFieldValue("receiptNumber"),
      parentReceipt: form.getFieldValue("parentReceipt"),
      receiptType: form.getFieldValue("receiptType"),
      balance: form.getFieldValue("balance"),
      notes: form.getFieldValue("notes"),
    });
    if (response.data.message === "Updated!") {
      getData();
      toast.remove();
      toast.success(response.data.message, {
        position: "top-center",
      });
      saveLog("update receipt: " + receiptData.receiptName);
      setEdit(false);
      return true; // to close modal form
    } else {
      setErrors({ ...Errors, saveErrors: response.data.message });
      return false; // to keep modal form open
    }
  }

  async function remove(id: string) {
    Axios.delete(`${api}/receipts/${id}`)
    .then((res) => {
      // إذا تم الحذف بنجاح
      saveLog("remove receipt: " + receiptData.receiptName);
      toast.success("Receipt removed successfully.");
      getData();
    })
    .catch((error) => {
      // إذا حدث خطأ
      console.log(error);  // لتسجيل الخطأ ومعرفة ما هو السبب
      if (error.response) {
        // إذا كانت هناك استجابة من الخادم تحتوي على رسالة
        toast.error(`${error.response.data.message}`);
      } else {
        // في حال عدم وجود استجابة من الخادم
        toast.error("An error occurred. Please try again.");
      }
    });
  }
  
  async function showModal() {
    setErrors({ ...Errors, saveErrors: "" });
    setErrors({ ...Errors, confirmPasswordError: "" });
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

      setReceiptData((prevData) => ({
        ...prevData,
        [field]: value,
      }));

      console.log(field);
    },
    []
  );

  useEffect(() => {
    //console.log(generateReceiptNumber(receiptData.parentReceipt))
  }, [receiptData]);

  useEffect(() => {
    getData()
    const fetchAndGenerateReceiptNumber = async () => {
      const newReceiptNumber = await generateReceiptNumber(receiptData.parentReceipt);
      setReceiptData((prevData) => ({
        ...prevData,
        receiptNumber: newReceiptNumber,
      }));
    };

    fetchAndGenerateReceiptNumber();
  }, [receiptData.parentReceipt]);

  useEffect(() => {
    form.setFieldsValue({
      receiptNumber: receiptData.receiptNumber,
    });
  }, [receiptData.receiptNumber]);

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
    value?: any;
    rules: any[];
    type?: "text" | "select" | "number" | "text area";
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
      <Col
        key={fieldName}
        xs={{ flex: "100%" }}
        sm={{ flex: "50%" }}
        md={{ flex: "50%" }}
        lg={{ flex: "50%" }}
        style={{ padding: 5 }}>
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

  function buildTreeData(data: any) {
    // ترتيب البيانات حسب receiptNumber
    const sortedData = data.sort((a: any, b: any) =>
      a.receiptNumber.localeCompare(b.receiptNumber)
    );

    // تحويل البيانات إلى هيكل شجري
    const map:any = {};
    const treeData: any[] = [];

    sortedData.forEach((item: any) => {
      map[item.receiptName] = {
        key: item._id,
        title: `${item.receiptNumber} - ${item.receiptName}`,
        children: [],
      };
    });

    sortedData.forEach((item: any) => {
      if (item.parentReceipt === "Main") {
        treeData.push(map[item.receiptName]);
      } else if (map[item.parentReceipt]) {
        map[item.parentReceipt].children.push(map[item.receiptName]);
      }
    });

    return treeData;
  }

  const handleSelect = (selectedKeys: any, { node }: { node: any }) => {
    setSearchText(`${node.title.split(" - ")[1]}`);
  };

  const treeData = buildTreeData(allReceiptsData);

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

                  {/* <Col
                    key={receiptData.receiptNumber}
                    xs={{ flex: "100%" }}
                    style={{ padding: 5 }}>
                    Receipt Number: {receiptData.receiptNumber}
                  </Col> */}

                  {createFormItem({
                    fieldName: "receiptName",
                    rules: [{ required: true }],
                    label: "Receipt Name",
                  })}

                  {createFormItem({
                    fieldName: "receiptType",
                    rules: [{ required: true }],
                    type: "select",
                    label: "Receipt Type",
                    fieldOptions: payOptions,
                  })}

                  {/* {createFormItem({
                    fieldName: "parentReceipt",
                    rules: [{ required: true }],
                    type: "select",
                    label: "Parent Receipt",
                    fieldOptions: AccounsOptions,
                  })} */}

                  {createFormItem({
                    fieldName: "receiptNumber",
                    rules: [{ required: false }],
                    type: "number",
                    readOnly: true,
                    fieldOptions: payOptions,
                  })}

                  {createFormItem({
                    fieldName: "balance",
                    rules: [{ required: false }],
                    type: "number",
                    fieldOptions: payOptions,
                  })}

                  {createFormItem({
                    fieldName: "notes",
                    type: "text area",
                    rules: [{ required: false }],
                  })}
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
                </Form.Item>{" "}
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
