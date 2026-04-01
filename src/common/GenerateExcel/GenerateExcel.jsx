const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const generateExcel = (data, fileName = "data.csv") => {
  try {
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      console.warn("No data provided for CSV export");
      return;
    }

    const headers = Object.keys(rows[0] || {});
    const csvLines = [];
    csvLines.push(headers.map(escapeCSV).join(","));
    for (const row of rows) {
      const line = headers.map((h) => escapeCSV(row[h]));
      csvLines.push(line.join(","));
    }
    const csvContent = "\uFEFF" + csvLines.join("\n"); // UTF-8 BOM for Excel

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating CSV file:", error);
  }
};

export default generateExcel;
