import { Button, Popconfirm, Dropdown } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { FiMoreVertical } from "react-icons/fi";
import { useEffect, useState } from "react";
import initTranslations from "../../i18n";
import { FaPrint } from "react-icons/fa6";

interface TableActionsProps {
  record: any; // The current row data
  onEdit: (record: any) => void; // Function to handle edit action
  onDelete: (id: string) => void; // Function to handle delete action
  onPrint: () => void; // Function to handle print action
  userPermissions: any; // User permissions (e.g., canEdit, canDelete)
  isMobile: boolean; // Whether the screen is mobile
  label: string; // like record.accountName ....
  locale: any;
}

export const TableActions = ({
  record,
  onEdit,
  onDelete,
  onPrint,
  userPermissions,
  isMobile,
  label,
  locale,
}: TableActionsProps) => {
  const [t, setT] = useState(() => (key: string) => key);
  useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

  // Mobile: Use a dropdown for actions
  if (isMobile) {
    const menuItems = [
      ...(userPermissions.Print == 1
        ? [
            {
              key: "print",
              label: (
                <div onClick={() => onPrint}>
                  <FaPrint /> {t("Print") + " " + label}
                </div>
              ),
            },
          ]
        : []),
      ...(userPermissions.Edit == 1
        ? [
            {
              key: "edit",
              label: (
                <div onClick={() => onEdit(record)}>
                  <EditOutlined /> {t("Edit") + " " + label}
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
                  title={`${t("Delete")}`}
                  description={`${t("Are you sure to delete")} "${label}"`}
                  onConfirm={() => onDelete(record._id)}
                  okText={t("Yes, Remove")}
                  cancelText={t("No")}>
                  <div>
                    <DeleteOutlined /> {t("Remove") + " " + label}
                  </div>
                </Popconfirm>
              ),
            },
          ]
        : []),
    ];

    return (
      <Dropdown className='no_print' menu={{ items: menuItems }} trigger={["click"]}>
        <Button type='dashed' shape='circle' size='small' icon={<FiMoreVertical />} />
      </Dropdown>
    );
  }

  // Desktop: Show separate buttons
  return (
    <>
      {userPermissions.Remove == 1 && (
        <Popconfirm
          className='no_print'
          title={`${t("Delete")}`}
          description={`${t("Are you sure to delete")} "${label}"`}
          onConfirm={() => onDelete(record._id)}
          okText={t("Yes, Remove")}
          cancelText={t("No")}>
          <Button
            id={record._id}
            title={t("Remove") + " " + label}
            style={{ marginLeft: 5 }}
            type='primary'
            danger
            shape='circle'
            size='small'
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      )}
      {userPermissions.Edit == 1 && (
        <Button
          className='no_print'
          type='primary'
          shape='circle'
          size='small'
          style={{ marginLeft: 5 }}
          title={t("Edit") + " " + label}
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        />
      )} 
      {userPermissions.Print == 1 && (
        <Button
          className='no_print'
          type='default'
          shape='circle'
          size='small'
          style={{ marginLeft: 5 }}
          title={t("Print") + " " + label}
          icon={<FaPrint />}
          onClick={() => onPrint}
        />
      )}
    </>
  );
};
