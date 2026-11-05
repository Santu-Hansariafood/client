import { useCallback } from "react";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../../utils/apiClient/apiClient";
import { downloadFile } from "../../../../utils/fileDownloader";
import generateExcel from "../../../../common/GenerateExcel/GenerateExcel";
import { calculateLineTotal } from "../utils/expenseCalculations";
import { extractUploadUrl } from "../../../../utils/saudaPdf/resolveUploadUrl";

const toTitleCase = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("en-IN")
    .replace(/(^|[\s([{/-])([a-z])/g, (_, boundary, letter) =>
      `${boundary}${letter.toLocaleUpperCase("en-IN")}`,
    );

const wordsBelowHundred = (number) => {
  const ones = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
    "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety",
  ];
  if (number < 20) return ones[number];
  return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`;
};

const wordsBelowThousand = (number) => {
  if (number < 100) return wordsBelowHundred(number);
  const remainder = number % 100;
  return `${wordsBelowHundred(Math.floor(number / 100))} Hundred${remainder ? ` ${wordsBelowHundred(remainder)}` : ""}`;
};

const numberToIndianWords = (number) => {
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error("Amount is too large to convert to words");
  }
  if (number < 1000) return wordsBelowThousand(number);

  const groups = [
    ["Thousand", 1000],
    ["Lakh", 100000],
    ["Crore", 10000000],
    ["Arab", 1000000000],
    ["Kharab", 100000000000],
  ];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const [label, divisor] = groups[index];
    if (number >= divisor) {
      const quotient = Math.floor(number / divisor);
      const remainder = number % divisor;
      return `${numberToIndianWords(quotient)} ${label}${remainder ? ` ${numberToIndianWords(remainder)}` : ""}`;
    }
  }
  return wordsBelowThousand(number);
};

const amountInWords = (amount) => {
  const totalPaise = Math.round((Number(amount) || 0) * 100);
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) {
    throw new Error("Amount is invalid for converting to words");
  }
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  return `Rupees ${numberToIndianWords(rupees)}${paise ? ` And ${numberToIndianWords(paise)} Paise` : ""} Only`;
};

const createExpenseVoucherPdf = async (request) => {
  const employee = request.employee || {};
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const status = toTitleCase(request.status || "Pending");
  const lineItems = Array.isArray(request.lineItems) ? request.lineItems : [];

  const tableStyles = {
    font: "helvetica",
    fontSize: 8,
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.15,
    cellPadding: 1.5,
    overflow: "linebreak",
  };
  const tableHeadStyles = {
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.15,
    fontStyle: "bold",
    fontSize: 7,
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("HANSARIA FOOD PRIVATE LIMITED", margin, 12);
  doc.setFontSize(10);
  doc.text("EXPENSE VOUCHER", pageWidth - margin, 12, { align: "right" });
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.line(margin, 15, pageWidth - margin, 15);

  autoTable(doc, {
    startY: 18,
    theme: "grid",
    head: [["Voucher Number", "Date", "Status"]],
    body: [[
      request.voucherNumber || "N/A",
      request.createdAt
        ? new Date(request.createdAt).toLocaleDateString()
        : "N/A",
      status,
    ]],
    margin: { left: margin, right: margin },
    styles: tableStyles,
    headStyles: tableHeadStyles,
    columnStyles: {
      0: { cellWidth: contentWidth * 0.42 },
      1: { cellWidth: contentWidth * 0.29 },
      2: { cellWidth: contentWidth * 0.29 },
    },
  });

  const seller =
    request.sellerName || request.seller?.sellerName || "N/A";
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 2,
    theme: "grid",
    head: [["Employee / Claimant", "Seller / Vendor", "Payment Details"]],
    body: [[
      `Employee: ${toTitleCase(employee.name || "N/A")}\nAdded By: ${toTitleCase(request.createdBy?.name || employee.name || "N/A")}`,
      `${toTitleCase(seller)}\nCompany: ${toTitleCase(request.sellerCompany || "N/A")}`,
      `Received From: ${toTitleCase(request.receivedFrom || "N/A")}`,
    ]],
    margin: { left: margin, right: margin },
    styles: { ...tableStyles, valign: "top" },
    headStyles: tableHeadStyles,
    columnStyles: {
      0: { cellWidth: contentWidth / 3 },
      1: { cellWidth: contentWidth / 3 },
      2: { cellWidth: contentWidth / 3 },
    },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    head: [["Particulars", "Description", "Qty", "Rate (Rs.)", "Amount (Rs.)"]],
    body: lineItems.length > 0
      ? lineItems.map((item) => [
            toTitleCase(item.category?.name || "Expense"),
            toTitleCase(item.description || "-"),
            Number(item.quantity ?? 1),
            Number(item.amount || 0).toFixed(2),
            calculateLineTotal(item),
          ])
      : [[
          toTitleCase(request.category?.name || "Expense"),
          "-",
          "1",
          Number(request.amount || 0).toFixed(2),
          Number(request.amount || 0).toFixed(2),
        ]],
    margin: { left: margin, right: margin, bottom: 20 },
    theme: "grid",
    styles: tableStyles,
    headStyles: tableHeadStyles,
    columnStyles: {
      0: { cellWidth: 39 },
      1: { cellWidth: 67 },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 27, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  const detailLabels = [
    ["rejectedLorryNo", "Reject Lorry No"],
    ["loading", "Loading"],
    ["unloading", "Unloading"],
    ["balance", "Balance"],
    ["netWeight", "Net Weight"],
    ["newLorryNo", "New Lorry No"],
    ["newWeight", "New Weight"],
    ["challanWeight", "Challan Weight"],
  ];
  const detailRows = detailLabels
    .map(([field, label]) => [
      label,
      toTitleCase(request.transportDetails?.[field] || ""),
    ])
    .filter(([, value]) => String(value).trim());
  if (detailRows.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      head: [["Additional Expense Details", "Value"]],
      body: detailRows,
      margin: { left: margin, right: margin, bottom: 20 },
      theme: "grid",
      styles: tableStyles,
      headStyles: tableHeadStyles,
      columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 70 },
      },
    });
  }

  const decidedBy =
    request.status === "approved"
      ? request.approvedBy?.name
      : request.status === "rejected"
        ? request.rejectedBy?.name
        : "";
  const notes = [];
  if (decidedBy) {
    notes.push(
      `${toTitleCase(request.status)} By: ${toTitleCase(decidedBy)}`,
    );
  }
  if (request.rejectionReason) {
    notes.push(`Rejection Reason: ${toTitleCase(request.rejectionReason)}`);
  }
  if (request.description) {
    notes.push(`Notes: ${toTitleCase(request.description)}`);
  }
  let footerStartY = doc.lastAutoTable.finalY + 4;
  if (notes.length) {
    const noteLines = doc.splitTextToSize(notes.join("\n"), contentWidth);
    let noteY = footerStartY;
    if (noteY + noteLines.length * 3.5 > pageHeight - 42) {
      doc.addPage();
      noteY = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0);
    doc.text(noteLines, margin, noteY);
    footerStartY = noteY + noteLines.length * 3.5 + 4;
  }

  if (footerStartY > pageHeight - 36) {
    doc.addPage();
    footerStartY = margin;
  }
  const total = Number(request.amount) || 0;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, footerStartY, pageWidth - margin, footerStartY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text("Grand Total", margin, footerStartY + 6);
  doc.text(
    `Rs. ${total.toFixed(2)}`,
    pageWidth - margin,
    footerStartY + 6,
    { align: "right" },
  );
  doc.setFontSize(7);
  doc.text("Amount In Words:", margin, footerStartY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const amountLines = doc.splitTextToSize(
    amountInWords(total),
    contentWidth - 30,
  );
  doc.text(amountLines, margin + 30, footerStartY + 12);

  const signatureY = footerStartY + 25;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margin, signatureY, margin + 42, signatureY);
  doc.line(pageWidth - margin - 42, signatureY, pageWidth - margin, signatureY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("Prepared By", margin + 21, signatureY + 3, { align: "center" });
  doc.text("Authorized Signatory", pageWidth - margin - 21, signatureY + 3, {
    align: "center",
  });

  for (let page = 1; page <= doc.internal.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(0);
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

const useExpenseDocuments = ({ canManageExpenses, filters, employees }) => {
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
    const shareText = `Expense voucher ${request.voucherNumber || ""} for ${employee.name || "employee"}.`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shareWindow = !isMobile ? window.open("about:blank", "_blank") : null;

    try {
      if (!whatsappNumber) {
        await downloadFile(await createExpenseVoucherPdf(request), fileName);
        toast.error(
          "Employee WhatsApp number is unavailable; the voucher PDF was downloaded.",
        );
        shareWindow?.close();
        return;
      }

      const doc = await createExpenseVoucherPdf(request);
      const voucherBlob = doc.output("blob");
      if (!voucherBlob.size) {
        throw new Error("Generated expense voucher PDF is empty");
      }
      const uploadFormData = new FormData();
      uploadFormData.append("file", voucherBlob, fileName);
      uploadFormData.append("saudaNo", `Expense-Voucher-${voucherNumber}`);

      const uploadResponse = await api.post(
        "/uploads/whatsapp",
        uploadFormData,
      );
      const fileUrl = extractUploadUrl(uploadResponse.data);
      if (!fileUrl || !/^https?:\/\//i.test(fileUrl)) {
        throw new Error("The uploaded voucher did not return a shareable PDF link");
      }

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${shareText}\n\nView / Download Expense Voucher PDF:\n${fileUrl}`)}`;
      if (isMobile) {
        window.location.assign(whatsappUrl);
        toast.success("WhatsApp opened with the expense voucher PDF link.");
      } else if (shareWindow) {
        shareWindow.location = whatsappUrl;
        toast.success("WhatsApp opened with the expense voucher PDF link.");
      } else {
        await downloadFile(doc, fileName);
        toast.error("WhatsApp could not open. The voucher PDF was downloaded.");
      }
    } catch (error) {
      shareWindow?.close();
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
      if (canManageExpenses && filters.employeeId) {
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
        startY: canManageExpenses && filters.employeeId ? 35 : 30,
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
  }, [canManageExpenses, employees, filters]);

  return {
    downloadExpenseVoucher,
    exportExcel,
    exportPdf,
    shareExpenseVoucher,
  };
};

export default useExpenseDocuments;
