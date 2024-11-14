import PDFDocument from "pdfkit";
import fs from "fs";

const generatePdf = (data, fileName = "data.pdf", title = "Data Report") => {
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const writeStream = fs.createWriteStream(fileName);
    doc.pipe(writeStream);
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();
    const headers = Object.keys(data[0]);
    doc.fontSize(12).font("Helvetica-Bold");
    headers.forEach((header) => {
      doc.text(header, { continued: true, width: 100, align: "left" });
    });
    doc.moveDown();
    doc.font("Helvetica").fontSize(10);
    data.forEach((row) => {
      headers.forEach((header) => {
        doc.text(row[header].toString(), {
          continued: true,
          width: 100,
          align: "left",
        });
      });
      doc.moveDown();
    });
    doc.end();
    writeStream.on("finish", () => {
      console.log(`PDF file generated successfully: ${fileName}`);
    });
  } catch (error) {
    console.error("Error generating PDF file:", error);
  }
};

export default generatePdf;
