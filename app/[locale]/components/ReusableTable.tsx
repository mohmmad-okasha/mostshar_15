import React, { forwardRef } from "react";
import { Table } from "antd";

interface ReusableTableProps {
  columns: any[];
  data: any[];
  loading: boolean;
  selectedId: string | null;
  theme: string;
  onRowClick: (record: any) => void;
  onRowDoubleClick: (record: any) => void;
}

const ReusableTable = forwardRef<HTMLDivElement, ReusableTableProps>(
  ({ columns, data, loading, selectedId, theme, onRowClick, onRowDoubleClick }, ref) => {
    return (
      <div ref={ref} style={{ overflowX: "auto" }}>
        <Table
          id="print-table"
          size="small"
          columns={columns.map((col) => ({
            ...col,
            ellipsis: true, // Ensure text doesn't overflow
          }))}
          dataSource={data}
          loading={loading}
          pagination={false}
          rowKey={(record) => record._id}
          scroll={{ x: "max-content" }}
          rowClassName={(record) =>
            record._id === selectedId
              ? theme === "dark"
                ? "selected-row-dark"
                : "selected-row-light"
              : ""
          } // Add a class to the selected row
          onRow={(record) => ({
            onClick: () => onRowClick(record),
            onDoubleClick: () => onRowDoubleClick(record),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    );
  }
);

ReusableTable.displayName = "ReusableTable";

export default ReusableTable;
