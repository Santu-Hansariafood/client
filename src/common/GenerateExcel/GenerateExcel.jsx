import * as XLSX from "xlsx";

const generateExcel = (data, fileName = "data.xlsx") => {
  try {
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      console.warn("No data provided for Excel export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const finalFileName = fileName.endsWith(".xlsx")
      ? fileName
      : `${fileName}.xlsx`;

    XLSX.writeFile(workbook, finalFileName);
  } catch (error) {
    console.error("Error generating Excel file:", error);
  }
};

export default generateExcel;
