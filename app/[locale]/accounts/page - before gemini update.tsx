// "use client";
// const PageName = "Accounts";

// const api = getApiUrl();
// import { useRef } from "react";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import Axios from "axios";
// import { useCookies } from "react-cookie";
// import {
//   getRules,
//   getApiUrl,
//   saveLog,
//   capitalize,
//   handlePrint,
//   cardStyle,
//   generateAccountNumber,
// } from "@/app/shared";

// //Styling
// import {
//   Alert,
//   Button,
//   Card,
//   Checkbox,
//   Col,
//   Divider,
//   Form,
//   Input,
//   Modal,
//   Popconfirm,
//   Result,
//   Row,
//   Select,
//   Table,
//   TableColumnsType,
//   Tree,
//   message,
// } from "antd";
// import { BsPlusLg } from "react-icons/bs";
// import {
//   DeleteOutlined,
//   EditOutlined,
//   SaveOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { FaPrint } from "react-icons/fa6";
// import toast, { Toaster } from "react-hot-toast";

// export default function App() {
//   const tableRef = useRef<HTMLDivElement>(null);
//   const [_, setCookies] = useCookies(["loading"]); //for loading page
//   const [form] = Form.useForm(); // to reset form after save or close
//   const userName = window.localStorage.getItem("userName");
//   const [rulesMatch, setRulesMatch] = useState(0);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [allAccountsData, setAllAccountsData] = useState<any>([]);
//   const [accountsList, setAccountsList] = useState();
//   const [Loading, setLoading] = useState(true); // to show loading before get data form db
//   const [edit, setEdit] = useState(false); // if true update else save new
//   const [searchText, setSearchText] = useState(""); // to search on table
//   const [Errors, setErrors] = useState<any>({
//     connectionError: "",
//     saveErrors: "",
//     confirmPasswordError: "",
//   });
//   const [accountData, setAccountData] = useState({
//     _id: "",
//     accountNumber: "",
//     accountName: "",
//     accountType: "",
//     balance: "",
//     parentAccount: "",
//     notes: "",
//   });

//   const accountTypeOptions = [
//     { value: "Assets", label: "Assets" },
//     { value: "Liabilities", label: "Liabilities" },
//     { value: "Equity", label: "Equity" },
//     { value: "Revenue", label: "Revenue" },
//     { value: "Expenses", label: "Expenses" },
//   ];

//   const AccounsOptions = [
//     { value: "Main", lable: "Main" },
//     ...allAccountsData.map((field: any) => ({
//       value: field.accountName,
//       label: field.accountName,
//     })),
//   ];

//   useEffect(() => {
//     //to get user rule for this page
//     getRules(userName, PageName).then((value) => {
//       setRulesMatch(value);
//     });
//   }, [userName, PageName]);

//   useEffect(() => {
//     getData();
//   }, []);

//   const columns: TableColumnsType<any> = [
//     {
//       title: "Account Number",
//       dataIndex: "accountNumber",
//     },
//     {
//       title: "Account Name",
//       dataIndex: "accountName",
//     },
//     {
//       title: "Parent Account",
//       dataIndex: "parentAccount",
//     },
//     {
//       title: "Account Type",
//       dataIndex: "accountType",
//     },
//     {
//       title: "Balance",
//       dataIndex: "balance",
//     },
//     {
//       title: "Notes",
//       dataIndex: "notes",
//     },
//     {
//       title: "User",
//       dataIndex: "user",
//     },
//     {
//       title: "Actions",
//       dataIndex: "Actions",
//       key: "Actions",
//       align: "center",
//       className: "no_print",
//       fixed: "right",
//       render: (_, record) => (
//         <>
//           <Popconfirm
//             title={"Delete the " + PageName.slice(0, -1)}
//             description={"Are you sure to delete  " + record.name + "?"}
//             onConfirm={() => {
//               remove(record._id);
//             }}
//             okText='Yes, Remove'
//             cancelText='No'>
//             <Button
//               type='primary'
//               danger
//               onClick={() => {
//                 setAccountData(record);
//               }}
//               shape='circle'
//               size='small'
//               icon={<DeleteOutlined />}
//             />
//           </Popconfirm>{" "}
//           <Button
//             type='primary'
//             shape='circle'
//             size='small'
//             icon={<EditOutlined />}
//             onClick={() => {
//               setAccountData(record);
//               form.setFieldsValue({
//                 accountName: record.accountName,
//                 accountNumber: record.accountNumber,
//                 parentAccount: record.parentAccount,
//                 accountType: record.accountType,
//                 balance: record.balance,
//                 notes: record.notes,
//               });
//               setEdit(true);
//               showModal();
//             }}
//           />
//         </>
//       ),
//     },
//   ];

//   const filteredData = allAccountsData.filter((account: any) => {
//     // Implement your search logic here
//     const searchTextLower = searchText.toLowerCase(); // Case-insensitive search
//     return (
//       // Search relevant fields
//       account.accountNumber.toLowerCase().includes(searchTextLower) ||
//       account.accountName.toLowerCase().includes(searchTextLower) ||
//       account.accountName.toLowerCase().includes(searchTextLower) ||
//       account.parentAccount.toLowerCase().includes(searchTextLower) ||
//       account.accountType.toLowerCase().includes(searchTextLower) ||
//       account.notes.toLowerCase().includes(searchTextLower) ||
//       account.user.toLowerCase().includes(searchTextLower)
//       // Add more fields as needed based on your data structure
//     );
//   });

//   async function getData() {
//     setLoading(true);
//     try {
//       const response = await Axios.get(`${api}/accounts`);
//       setAllAccountsData(response.data);
//     } catch (error) {
//       setErrors({ ...Errors, connectionError: error });
//       console.error("Error fetching accounts:", error);
//     } finally {
//       setLoading(false);
//       setCookies("loading", false);
//     }
//   }

//   async function save() {
//     setErrors({ ...Errors, saveErrors: "" });
//     const response = await Axios.post(`${api}/accounts`, {
//       accountNumber: accountData.accountNumber,
//       accountName: accountData.accountName,
//       accountType: accountData.accountType,
//       balance: accountData.balance,
//       parentAccount: accountData.parentAccount,
//       notes: accountData.notes,
//       user: userName,
//     });
//     if (response.data.message === "Saved!") {
//       getData();
//       saveLog("save new account: " + accountData.accountName);
//       toast.remove(); // remove any message on screen
//       toast.success(response.data.message, {
//         position: "top-center",
//       });
//       return true; // to close modal form
//     } else {
//       setErrors({ ...Errors, saveErrors: response.data.message });
//       return false; // to keep modal form open
//     }
//   }

//   async function update() {
//     setErrors({ ...Errors, saveErrors: "" });
//     const response = await Axios.put(`${api}/accounts`, {
//       _id: accountData._id,
//       accountName: form.getFieldValue("accountName"),
//       //accountNumber: form.getFieldValue("accountNumber"),
//       parentAccount: form.getFieldValue("parentAccount"),
//       accountType: form.getFieldValue("accountType"),
//       balance: form.getFieldValue("balance"),
//       notes: form.getFieldValue("notes"),
//     });
//     if (response.data.message === "Updated!") {
//       getData();
//       toast.remove();
//       toast.success(response.data.message, {
//         position: "top-center",
//       });
//       saveLog("update account: " + accountData.accountName);
//       setEdit(false);
//       return true; // to close modal form
//     } else {
//       setErrors({ ...Errors, saveErrors: response.data.message });
//       return false; // to keep modal form open
//     }
//   }

//   async function remove(id: string) {
//     Axios.delete(`${api}/accounts/${id}`)
//     .then((res) => {
//       // إذا تم الحذف بنجاح
//       saveLog("remove account: " + accountData.accountName);
//       toast.success("Account removed successfully.");
//       getData();
//     })
//     .catch((error) => {
//       // إذا حدث خطأ
//       console.log(error);  // لتسجيل الخطأ ومعرفة ما هو السبب
//       if (error.response) {
//         // إذا كانت هناك استجابة من الخادم تحتوي على رسالة
//         toast.error(`${error.response.data.message}`);
//       } else {
//         // في حال عدم وجود استجابة من الخادم
//         toast.error("An error occurred. Please try again.");
//       }
//     });
//   }
  
//   async function showModal() {
//     setErrors({ ...Errors, saveErrors: "" });
//     setErrors({ ...Errors, confirmPasswordError: "" });
//     setIsModalOpen(true);
//   }

//   async function handleOk() {
//     if (!edit) {
//       if (await save()) {
//         setIsModalOpen(false);
//         form.resetFields();
//       }
//     } else {
//       if (await update()) {
//         setIsModalOpen(false);
//         form.resetFields();
//       }
//     }
//   }

//   function handleCancel() {
//     setIsModalOpen(false);
//     setEdit(false);
//     form.resetFields();
//   }

//   const handleInputChange = useCallback(
//     (field: any) => (e: any) => {
//       let value;

//       if (e && e.target) {
//         // Handle checkbox separately as it has 'checked' property instead of 'value'
//         if (e.target.type === "checkbox") {
//           value = e.target.checked;
//         } else {
//           value = e.target.value;
//         }
//       } else if (typeof e === "object" && e?.hasOwnProperty("value")) {
//         // Handle Select or other similar components with a value property
//         value = e.value;
//       } else {
//         value = e;
//       }

//       setAccountData((prevData) => ({
//         ...prevData,
//         [field]: value,
//       }));

//       console.log(field);
//     },
//     []
//   );

//   useEffect(() => {
//     //console.log(generateAccountNumber(accountData.parentAccount))
//   }, [accountData]);

//   useEffect(() => {
//     getData()
//     const fetchAndGenerateAccountNumber = async () => {
//       const newAccountNumber = await generateAccountNumber(accountData.parentAccount);
//       setAccountData((prevData) => ({
//         ...prevData,
//         accountNumber: newAccountNumber,
//       }));
//     };

//     fetchAndGenerateAccountNumber();
//   }, [accountData.parentAccount]);

//   useEffect(() => {
//     form.setFieldsValue({
//       accountNumber: accountData.accountNumber,
//     });
//   }, [accountData.accountNumber]);

//   const validateMessages = {
//     required: "${label} is required!",
//     types: {
//       email: "not valid email!",
//       number: "not a valid number!",
//     },
//     number: {
//       range: "${label} must be between ${min} and ${max}",
//     },
//   };

//   const modalTitle = useMemo(
//     () => (edit ? "Edit " : "Add ") + PageName.slice(0, -1),
//     [edit]
//   );

//   interface CreateFormItemProps {
//     fieldName: string;
//     value?: any;
//     rules: any[];
//     type?: "text" | "select" | "number" | "text area";
//     label?: string;
//     fieldOptions?: { label: string; value: any }[];
//     readOnly?: boolean;
//   }

//   const createFormItem = ({
//     fieldName,
//     value,
//     rules,
//     type = "text",
//     label,
//     fieldOptions = [],
//     readOnly = false,
//   }: CreateFormItemProps) => {
//     const displayedLabel =
//       label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

//     return (
//       <Col
//         key={fieldName}
//         xs={{ flex: "100%" }}
//         // sm={{ flex: "50%" }}
//         // md={{ flex: "50%" }}
//         // lg={{ flex: "50%" }}
//         style={{ padding: 5 }}>
//         <Form.Item key={fieldName} label={displayedLabel} name={fieldName} rules={rules}>
//           {type === "select" && (
//             <Select
//               value={value}
//               onChange={handleInputChange(fieldName)}
//               showSearch
//               allowClear
//               options={fieldOptions}
//               style={{ width: "100%" }}
//               disabled={readOnly}
//             />
//           )}

//           {(type === "text" || type === "number") && (
//             <Input
//               value={value}
//               onChange={handleInputChange(fieldName)}
//               type={type}
//               disabled={readOnly}
//             />
//           )}

//           {type === "text area" && (
//             <Input.TextArea
//               value={value}
//               onChange={handleInputChange(fieldName)}
//               disabled={readOnly}
//             />
//           )}
//         </Form.Item>
//       </Col>
//     );
//   };

//   function buildTreeData(data: any) {
//     // ترتيب البيانات حسب accountNumber
//     const sortedData = data.sort((a: any, b: any) =>
//       a.accountNumber.localeCompare(b.accountNumber)
//     );

//     // تحويل البيانات إلى هيكل شجري
//     const map:any = {};
//     const treeData: any[] = [];

//     sortedData.forEach((item: any) => {
//       map[item.accountName] = {
//         key: item._id,
//         title: `${item.accountNumber} - ${item.accountName}`,
//         children: [],
//       };
//     });

//     sortedData.forEach((item: any) => {
//       if (item.parentAccount === "Main") {
//         treeData.push(map[item.accountName]);
//       } else if (map[item.parentAccount]) {
//         map[item.parentAccount].children.push(map[item.accountName]);
//       }
//     });

//     return treeData;
//   }

//   const handleSelect = (selectedKeys: any, { node }: { node: any }) => {
//     setSearchText(`${node.title.split(" - ")[1]}`);
//   };

//   const treeData = buildTreeData(allAccountsData);

//   return (
//     <>
//       <div>
//         <Toaster />
//       </div>
//       {rulesMatch == 1 && (
//         <>
//           <Modal
//             title={modalTitle}
//             open={isModalOpen}
//             onCancel={handleCancel}
//             width={500}
//             maskClosable={false} //not close by click out of modal
//             footer={[]}>
//             <Card>
//               <Form
//                 form={form}
//                 layout='vertical'
//                 style={{ maxWidth: 500, textAlign: "center" }}
//                 validateMessages={validateMessages}
//                 onFinish={handleOk}>
//                 <Row>

//                   {createFormItem({
//                     fieldName: "accountName",
//                     rules: [{ required: true }],
//                     label: "Account Name",
//                   })}

//                   {createFormItem({
//                     fieldName: "accountType",
//                     rules: [{ required: true }],
//                     type: "select",
//                     label: "Account Type",
//                     fieldOptions: accountTypeOptions,
//                   })}

//                   {createFormItem({
//                     fieldName: "parentAccount",
//                     rules: [{ required: true }],
//                     type: "select",
//                     label: "Parent Account",
//                     fieldOptions: AccounsOptions,
//                   })}

//                   {createFormItem({
//                     fieldName: "accountNumber",
//                     rules: [{ required: false }],
//                     type: "number",
//                     readOnly: true,
//                     fieldOptions: accountTypeOptions,
//                   })}

//                   {createFormItem({
//                     fieldName: "balance",
//                     rules: [{ required: false }],
//                     type: "number",
//                     fieldOptions: accountTypeOptions,
//                   })}

//                   {createFormItem({
//                     fieldName: "notes",
//                     type: "text area",
//                     rules: [{ required: false }],
//                   })}
//                 </Row>
//                 {Errors.saveErrors && (
//                   <>
//                     <Form.Item />
//                     <Alert
//                       closable
//                       description={Errors.saveErrors}
//                       type='error'
//                       showIcon
//                     />
//                   </>
//                 )}
//                 <Divider />
//                 <Form.Item style={{ marginBottom: -40, textAlign: "right" }}>
//                   <Button onClick={handleCancel} icon={<CloseOutlined />} />
//                   <> </>
//                   <Button type='primary' htmlType='submit' icon={<SaveOutlined />} />
//                 </Form.Item>{" "}
//               </Form>

//               <br />
//             </Card>
//           </Modal>
//           <Card
//             title={PageName}
//             style={cardStyle}
//             extra={
//               <>
//                 <Button
//                   type='text'
//                   title='Print'
//                   onClick={() => {
//                     handlePrint(tableRef, PageName, 12);
//                   }}
//                   icon={<FaPrint size={"1em"} />}></Button>
//                 <Button
//                   type='text'
//                   title='Add'
//                   onClick={showModal}
//                   icon={<BsPlusLg size={"1em"} />}></Button>
//               </>
//             }>
//             {!Errors.connectionError && (
//               <>
//                 <Card>
//                   <Tree onSelect={handleSelect} treeData={treeData} />
//                 </Card>
//                 <Divider />

//                 <Input.Search
//                   placeholder='Search...'
//                   onChange={(e) => setSearchText(e.target.value)}
//                   style={{ paddingBottom: 5 }}
//                   allowClear
//                 />

//                 <div ref={tableRef}>
//                   <Table
//                     id='print-table'
//                     size='small'
//                     columns={columns}
//                     dataSource={filteredData}
//                     loading={Loading}
//                     pagination={false}
//                     //pagination={{ hideOnSinglePage: true, pageSize: 5 }}
//                     //scroll={{ x: "calc(300px + 50%)", y: 500 }}
//                     rowKey={(record) => record._id}
//                   />
//                 </div>
//               </>
//             )}
//             {Errors.connectionError && (
//               <Result
//                 status='warning'
//                 title={"Can't Load Data :" + Errors.connectionError}
//               />
//             )}
//           </Card>
//         </>
//       )}
//     </>
//   );
// }
