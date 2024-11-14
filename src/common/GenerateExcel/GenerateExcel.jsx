import * as XLSX from "xlsx";

const generateExcel = (data, fileName = "data.xlsx", sheetName = "Sheet1") => {
  try {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, fileName);
    console.log(`Excel file generated successfully: ${fileName}`);
  } catch (error) {
    console.error("Error generating Excel file:", error);
  }
};

export default generateExcel;
