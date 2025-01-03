import * as XLSX from "xlsx";
import { Menu } from "antd";

interface ExportDataProps {
  title: string;
  data: any[];
  pageName: string;
}

export const ExportDataMobile = ({ data, pageName }: ExportDataProps) => {
  const exportToJson = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${pageName}.json`;
    link.click();
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${pageName}.xlsx`);
  };

  const exportToSQL = () => {
    const tableName = pageName.toLowerCase();
    const columns = Object.keys(data[0]).filter((col) => col !== "Actions");
    const columnNames = columns.join(", ");
    const values = data
      .map((row) => {
        const rowValues = columns
          .map((col) => `'${String(row[col]).replace(/'/g, "''")}'`)
          .join(", ");
        return `(${rowValues})`;
      })
      .join(",\n");
    const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES\n${values};`;
    const blob = new Blob([sql], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${pageName}.sql`;
    link.click();
  };

  const items = [
    { key: "1", label: "JSON", onClick: exportToJson },
    { key: "2", label: "EXCEL", onClick: exportToExcel },
    { key: "3", label: "SQL", onClick: exportToSQL },
  ];

  // Return menu items for mobile

  return items.map((item) => ({
    key: item.key,
    label: (
      <div onClick={item.onClick} style={{ padding: "5px 10px" }}>
        {item.label}
      </div>
    ),
  }));

  return items;
};
