import { useCallback } from "react";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../../utils/apiClient/apiClient";
import { downloadFile } from "../../../../utils/fileDownloader";
import generateExcel from "../../../../common/GenerateExcel/GenerateExcel";
import { calculateLineTotal } from "../utils/expenseCalculations";

const loadMonochromeLogo = async () => {
  const image = new Image();
  image.src = `${import.meta.env.BASE_URL}logo/logo.png`;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare the company logo for the voucher");
  }
  context.filter = "grayscale(100%) contrast(140%)";
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
};

const createExpenseVoucherPdf = async (request) => {
  const employee = request.employee || {};
  const logo = await loadMonochromeLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const status = String(request.status || "pending").toUpperCase();
  const lineItems = Array.isArray(request.lineItems) ? request.lineItems : [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.addImage(logo, "PNG", margin, 10, 48, 16);
  doc.text("EXPENSE VOUCHER", pageWidth - margin, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text("HANSARIA FOOD PRIVATE LIMITED", pageWidth - margin, 23, {
    align: "right",
  });
  doc.setDrawColor(20);
  doc.setLineWidth(0.6);
  doc.line(margin, 31, pageWidth - margin, 31);

  autoTable(doc, {
    startY: 35,
    theme: "grid",
    head: [["VOUCHER NUMBER", "DATE", "STATUS"]],
    body: [[
      request.voucherNumber || "N/A",
      request.createdAt
        ? new Date(request.createdAt).toLocaleDateString()
        : "N/A",
      status,
    ]],
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [20, 20, 20],
      lineColor: [80, 80, 80],
      lineWidth: 0.2,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [35, 35, 35],
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.42 },
      1: { cellWidth: contentWidth * 0.29 },
      2: { cellWidth: contentWidth * 0.29 },
    },
  });

  const seller =
    request.sellerName || request.seller?.sellerName || "N/A";
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: "grid",
    head: [["EMPLOYEE / CLAIMANT", "SELLER / VENDOR", "PAYMENT DETAILS"]],
    body: [[
      `Employee: ${employee.name || "N/A"}\nAdded by: ${request.createdBy?.name || employee.name || "N/A"}`,
      `${seller}\nCompany: ${request.sellerCompany || "N/A"}`,
      `Received from: ${request.receivedFrom || "N/A"}`,
    ]],
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [25, 25, 25],
      lineColor: [80, 80, 80],
      lineWidth: 0.2,
      cellPadding: 3,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [35, 35, 35],
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 3 },
      1: { cellWidth: contentWidth / 3 },
      2: { cellWidth: contentWidth / 3 },
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["PARTICULARS", "DESCRIPTION", "QTY", "RATE (Rs.)", "AMOUNT (Rs.)"]],
    body: lineItems.length > 0
      ? lineItems.map((item) => [
            item.category?.name || "Expense",
            item.description || "-",
            Number(item.quantity ?? 1),
            Number(item.amount || 0).toFixed(2),
            calculateLineTotal(item),
          ])
      : [[
          request.category?.name || "Expense",
          "-",
          "1",
          Number(request.amount || 0).toFixed(2),
          Number(request.amount || 0).toFixed(2),
        ]],
    margin: { left: margin, right: margin, bottom: 20 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [25, 25, 25],
      lineColor: [90, 90, 90],
      lineWidth: 0.2,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [246, 246, 246] },
    columnStyles: {
      0: { cellWidth: 39 },
      1: { cellWidth: 67 },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 27, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  let finalY = doc.lastAutoTable.finalY + 8;
  if (finalY > pageHeight - 60) {
    doc.addPage();
    finalY = margin;
  }
  const total = Number(request.amount) || 0;
  doc.setDrawColor(30);
  doc.setLineWidth(0.4);
  doc.rect(pageWidth - margin - 72, finalY, 72, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20);
  doc.text("GRAND TOTAL", pageWidth - margin - 68, finalY + 9);
  doc.setFontSize(11);
  doc.text(
    `Rs. ${total.toFixed(2)}`,
    pageWidth - margin - 4,
    finalY + 9,
    { align: "right" },
  );

  const decidedBy =
    request.status === "approved"
      ? request.approvedBy?.name
      : request.status === "rejected"
        ? request.rejectedBy?.name
        : "";
  const notes = [];
  if (decidedBy) {
    notes.push(
      `${request.status === "approved" ? "Approved" : "Rejected"} by: ${decidedBy}`,
    );
  }
  if (request.rejectionReason) {
    notes.push(`Rejection reason: ${request.rejectionReason}`);
  }
  if (request.description) {
    notes.push(`Notes: ${request.description}`);
  }
  let contentEndY = finalY + 14;
  if (notes.length) {
    const noteLines = doc.splitTextToSize(notes.join("\n"), contentWidth);
    let noteY = finalY + 23;
    if (noteY + noteLines.length * 4 > pageHeight - 38) {
      doc.addPage();
      noteY = margin + 6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(45);
    doc.text(noteLines, margin, noteY);
    contentEndY = noteY + noteLines.length * 4;
  }

  let signatureY = contentEndY + 16;
  if (signatureY > pageHeight - 20) {
    doc.addPage();
    signatureY = pageHeight - 25;
  }
  doc.setDrawColor(100);
  doc.setLineWidth(0.2);
  doc.line(margin, signatureY, margin + 52, signatureY);
  doc.line(pageWidth - margin - 52, signatureY, pageWidth - margin, signatureY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text("Prepared by", margin + 26, signatureY + 4, { align: "center" });
  doc.text("Authorized signatory", pageWidth - margin - 26, signatureY + 4, {
    align: "center",
  });

  for (let page = 1; page <= doc.internal.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      "Hansaria Food Private Limited | Expense Voucher",
      margin,
      pageHeight - 8,
    );
    doc.text(`Page ${page}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  }

  return doc;
};

const useExpenseDocuments = ({ isAdmin, filters, employees }) => {
  const downloadExpenseVoucher = useCallback(async (request) => {
    const voucherNumber = request.voucherNumber || request._id;
    try {
      await downloadFile(
        await createExpenseVoucherPdf(request),
        `Expense-Voucher-${voucherNumber}.pdf`,
      );
    } catch (error) {
      toast.error(error.message || "Failed to download the expense voucher");
    }
  }, []);

  const shareExpenseVoucher = useCallback(async (request) => {
    const employee = request.employee || {};
    const phone = String(employee.mobile || employee.phone || "").replace(
      /\D/g,
      "",
    );
    const whatsappNumber =
      phone.length === 10 ? `91${phone}` : phone.length === 12 ? phone : "";
    const voucherNumber = request.voucherNumber || request._id;
    const fileName = `Expense-Voucher-${voucherNumber}.pdf`;

    try {
      const doc = await createExpenseVoucherPdf(request);
      const shareText = `Expense voucher ${request.voucherNumber || ""} for ${employee.name || "employee"}.`;
      if (!whatsappNumber) {
        await downloadFile(doc, fileName);
        toast.error(
          "Employee WhatsApp number is unavailable; the voucher PDF was downloaded.",
        );
        return;
      }

      const message = `${shareText} The voucher PDF has been downloaded; please attach it to this chat.`;
      const shareWindow = window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
      await downloadFile(doc, fileName);
      toast.info(
        shareWindow
          ? `Voucher downloaded. Attach the PDF in the WhatsApp chat for ${employee.name || "this employee"}.`
          : "Voucher downloaded, but the WhatsApp chat could not open. Check popup settings and try again.",
      );
    } catch (error) {
      toast.error(
        error.message || "Failed to prepare the expense voucher for WhatsApp",
      );
    }
  }, []);

  const exportExcel = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 10000,
      }).toString();
      const response = await api.get(`/expense-requests?${queryParams}`);
      const data = response.data.requests.map((request) => ({
        Date: new Date(request.createdAt).toLocaleDateString(),
        Voucher: request.voucherNumber || "—",
        Employee: request.employee?.name || "N/A",
        Seller: request.sellerName || request.seller?.sellerName || "—",
        Company: request.sellerCompany || "—",
        "Received From": request.receivedFrom || "—",
        Items:
          (request.lineItems || [])
            .map(
              (item) =>
                `${item.category?.name || "N/A"}: ${Number(item.quantity ?? 1)} x ${Number(item.amount || 0).toFixed(2)} = ${calculateLineTotal(item)}`,
            )
            .join("; ") ||
          request.category?.name ||
          "N/A",
        Amount: request.amount,
        Description: request.description || "",
        Status: request.status,
      }));
      generateExcel(data, `Expenses_${new Date().toLocaleDateString()}.xlsx`);
    } catch {
      toast.error("Failed to export Excel");
    }
  }, [filters]);

  const exportPdf = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 10000,
      }).toString();
      const response = await api.get(`/expense-requests?${queryParams}`);
      const allRequests = response.data.requests;
      const doc = new jsPDF({ orientation: "landscape" });
      doc.text("Expense Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      if (isAdmin && filters.employeeId) {
        const employeeName = employees.find(
          (employee) => employee._id === filters.employeeId,
        )?.name;
        if (employeeName) doc.text(`Employee: ${employeeName}`, 14, 28);
      }

      const tableColumns = [
        "Date",
        "Voucher",
        "Employee",
        "Seller / Company",
        "Received From",
        "Items",
        "Amount",
        "Description",
        "Status",
      ];
      const tableRows = allRequests.map((request) => [
        new Date(request.createdAt).toLocaleDateString(),
        request.voucherNumber || "-",
        request.employee?.name || "N/A",
        [request.sellerName || request.seller?.sellerName, request.sellerCompany]
          .filter(Boolean)
          .join(" / ") || "-",
        request.receivedFrom || "-",
        (request.lineItems || [])
          .map(
            (item) =>
              `${item.category?.name || "N/A"} (${Number(item.quantity ?? 1)} x ${Number(item.amount || 0).toFixed(2)} = ${calculateLineTotal(item)})`,
          )
          .join(", ") ||
          request.category?.name ||
          "N/A",
        `Rs. ${Number(request.amount) || 0}`,
        request.description || "-",
        request.status,
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: isAdmin && filters.employeeId ? 35 : 30,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fontSize: 7 },
        margin: { left: 10, right: 10 },
      });

      const totalAmount = allRequests.reduce(
        (sum, request) => sum + (Number(request.amount) || 0),
        0,
      );
      let totalY = doc.lastAutoTable.finalY + 10;
      if (totalY > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        totalY = 20;
      }
      doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, totalY);
      await downloadFile(doc, `Expense_Report_${Date.now()}.pdf`);
    } catch {
      toast.error("Failed to generate PDF");
    }
  }, [employees, filters, isAdmin]);

  return {
    downloadExpenseVoucher,
    exportExcel,
    exportPdf,
    shareExpenseVoucher,
  };
};

export default useExpenseDocuments;
