import * as XLSX from "xlsx";
import { downloadFile } from "../../utils/fileDownloader";

const generateExcel = async (data, fileName = "data.xlsx") => {
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

    // Instead of XLSX.writeFile (which uses blob URLs/anchor clicks),
    // we use XLSX.write to get a buffer/blob and pass it to our utility.
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    await downloadFile(blob, finalFileName);
  } catch (error) {
    console.error("Error generating Excel file:", error);
  }
};

export default generateExcel;
