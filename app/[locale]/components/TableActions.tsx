import { Button, Popconfirm, Dropdown } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { FiMoreVertical } from "react-icons/fi";
import { useEffect, useState } from "react";
import initTranslations from "../../i18n";

interface TableActionsProps {
  record: any; // The current row data
  onEdit: (record: any) => void; // Function to handle edit action
  onDelete: (id: string) => void; // Function to handle delete action
  userPermissions: any; // User permissions (e.g., canEdit, canDelete)
  isMobile: boolean; // Whether the screen is mobile
  label: string; // like record.accountName ....
  locale: any;
}

export const TableActions = ({
  record,
  onEdit,
  onDelete,
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
                  okText={t("Yes, Remove") + " " + label}
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
      <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
        <Button type='dashed' shape='circle' size='small' icon={<FiMoreVertical />} />
      </Dropdown>
    );
  }

  // Desktop: Show separate buttons
  return (
    <>
      {userPermissions.Remove == 1 && (
        <Popconfirm
          title={`${t("Delete")}`}
          description={`${t("Are you sure to delete")} " ${label}"`}
          onConfirm={() => onDelete(record._id)}
          okText={t("Yes, Remove") + ' "' + label+'"'}
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
          type='primary'
          shape='circle'
          size='small'
          style={{ marginLeft: 5 }}
          title={t("Edit") + " " + label}
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        />
      )}
    </>
  );
};
