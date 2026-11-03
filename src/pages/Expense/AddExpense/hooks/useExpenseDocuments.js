import { useCallback } from "react";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import api from "../../../../utils/apiClient/apiClient";
import { downloadFile } from "../../../../utils/fileDownloader";
import generateExcel from "../../../../common/GenerateExcel/GenerateExcel";
import { calculateLineTotal } from "../utils/expenseCalculations";

const loadCompanyLogo = async () => {
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
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
};

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

const createVoucherQrText = (request, lineItems, detailLabels) => {
  const employee = request.employee || {};
  const seller = request.sellerName || request.seller?.sellerName || "N/A";
  const lines = [
    "Hansaria Food Private Limited",
    "Expense Voucher",
    `Voucher No: ${request.voucherNumber || "N/A"}`,
    `Date: ${request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A"}`,
    `Status: ${toTitleCase(request.status || "Pending")}`,
    `Employee: ${toTitleCase(employee.name || "N/A")}`,
    `Added By: ${toTitleCase(request.createdBy?.name || employee.name || "N/A")}`,
    `Seller: ${toTitleCase(seller)}`,
    `Company: ${toTitleCase(request.sellerCompany || "N/A")}`,
    `Received From: ${toTitleCase(request.receivedFrom || "N/A")}`,
    `Expense Description: ${toTitleCase(request.description || "N/A")}`,
    "Expense Items:",
  ];
  if (lineItems.length) {
    lineItems.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${toTitleCase(item.category?.name || "Expense")}; Description: ${toTitleCase(item.description || "N/A")}; Quantity: ${Number(item.quantity ?? 1)}; Rate: Rs. ${Number(item.amount || 0).toFixed(2)}; Amount: Rs. ${calculateLineTotal(item)}`,
      );
    });
  } else {
    lines.push(
      `1. ${toTitleCase(request.category?.name || "Expense")}; Quantity: 1; Rate: Rs. ${Number(request.amount || 0).toFixed(2)}; Amount: Rs. ${Number(request.amount || 0).toFixed(2)}`,
    );
  }
  lines.push(
    `Total Amount: Rs. ${(Number(request.amount) || 0).toFixed(2)}`,
    `Amount In Words: ${amountInWords(request.amount)}`,
  );
  detailLabels.forEach(([field, label]) => {
    const value = request.transportDetails?.[field];
    if (String(value || "").trim()) {
      lines.push(`${label}: ${toTitleCase(value)}`);
    }
  });
  if (request.status === "approved" && request.approvedBy?.name) {
    lines.push(`Approved By: ${toTitleCase(request.approvedBy.name)}`);
  }
  if (request.status === "rejected" && request.rejectedBy?.name) {
    lines.push(`Rejected By: ${toTitleCase(request.rejectedBy.name)}`);
  }
  if (request.rejectionReason) {
    lines.push(`Rejection Reason: ${toTitleCase(request.rejectionReason)}`);
  }
  return lines.join("\n");
};

const createExpenseVoucherPdf = async (request) => {
  const employee = request.employee || {};
  const logo = await loadCompanyLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const status = toTitleCase(request.status || "Pending");
  const lineItems = Array.isArray(request.lineItems) ? request.lineItems : [];

  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 34, pageWidth, 1.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin - 1, 8, 52, 20, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Expense Voucher", pageWidth - margin, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Hansaria Food Private Limited", pageWidth - margin, 23, {
    align: "right",
  });
  doc.addImage(logo, "PNG", margin, 10, 48, 16);
  doc.setTextColor(20);
  doc.setDrawColor(20);
  doc.setLineWidth(0.6);
  doc.line(margin, 40, pageWidth - margin, 40);

  autoTable(doc, {
    startY: 44,
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
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [20, 20, 20],
      lineColor: [80, 80, 80],
      lineWidth: 0.2,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
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
    head: [["Employee / Claimant", "Seller / Vendor", "Payment Details"]],
    body: [[
      `Employee: ${toTitleCase(employee.name || "N/A")}\nAdded By: ${toTitleCase(request.createdBy?.name || employee.name || "N/A")}`,
      `${toTitleCase(seller)}\nCompany: ${toTitleCase(request.sellerCompany || "N/A")}`,
      `Received From: ${toTitleCase(request.receivedFrom || "N/A")}`,
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
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
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
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [239, 247, 244] },
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
  let qrCode;
  try {
    qrCode = await QRCode.toDataURL(
      createVoucherQrText(request, lineItems, detailLabels),
      {
        errorCorrectionLevel: "L",
        margin: 2,
        width: 512,
        color: { dark: "#000000", light: "#FFFFFF" },
      },
    );
  } catch (error) {
    throw new Error(
      `Could not create the voucher QR code. Shorten the expense descriptions and try again. ${error.message}`,
    );
  }
  if (detailRows.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 7,
      head: [["Additional Expense Details", "Value"]],
      body: detailRows,
      margin: { left: margin, right: margin, bottom: 20 },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: [25, 25, 25],
        lineColor: [90, 90, 90],
        lineWidth: 0.2,
        cellPadding: 2.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [6, 95, 70],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
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
  let footerStartY = doc.lastAutoTable.finalY + 8;
  if (notes.length) {
    const noteLines = doc.splitTextToSize(notes.join("\n"), contentWidth);
    let noteY = footerStartY;
    if (noteY + noteLines.length * 4 > pageHeight - 72) {
      doc.addPage();
      noteY = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(45);
    doc.text(noteLines, margin, noteY);
    footerStartY = noteY + noteLines.length * 4 + 8;
  }

  if (footerStartY > pageHeight - 65) {
    doc.addPage();
    footerStartY = margin;
  }
  const total = Number(request.amount) || 0;
  const qrSize = 38;
  doc.addImage(qrCode, "PNG", margin, footerStartY, qrSize, qrSize);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(70);
  doc.text("Scan For Full Voucher Details", margin + qrSize / 2, footerStartY + qrSize + 4, {
    align: "center",
  });

  const detailsX = margin + qrSize + 8;
  const detailsWidth = pageWidth - margin - detailsX;
  const totalBoxWidth = Math.min(82, detailsWidth);
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  doc.setDrawColor(6, 95, 70);
  doc.setLineWidth(0.5);
  doc.setFillColor(239, 247, 244);
  doc.roundedRect(totalBoxX, footerStartY, totalBoxWidth, 14, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20);
  doc.text("Grand Total", totalBoxX + 4, footerStartY + 9);
  doc.setFontSize(10);
  doc.text(
    `Rs. ${total.toFixed(2)}`,
    totalBoxX + totalBoxWidth - 4,
    footerStartY + 9,
    { align: "right" },
  );
  doc.setFontSize(7);
  doc.setTextColor(70);
  doc.text("Amount In Words", detailsX, footerStartY + 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(25);
  const amountLines = doc.splitTextToSize(
    amountInWords(total),
    detailsWidth,
  );
  doc.text(amountLines, detailsX, footerStartY + 27);

  const signatureY = footerStartY + 48;
  doc.setDrawColor(100);
  doc.setLineWidth(0.2);
  doc.line(margin, signatureY, margin + 52, signatureY);
  doc.line(pageWidth - margin - 52, signatureY, pageWidth - margin, signatureY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text("Prepared By", margin + 26, signatureY + 4, { align: "center" });
  doc.text("Authorized Signatory", pageWidth - margin - 26, signatureY + 4, {
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

const supportsPdfFileSharing = (fileName) => {
  if (
    !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    typeof File === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    return navigator.canShare({
      files: [new File([], fileName, { type: "application/pdf" })],
    });
  } catch (error) {
    console.warn("PDF file sharing is unavailable on this device:", error);
    return false;
  }
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
    const shareText = `Expense voucher ${request.voucherNumber || ""} for ${employee.name || "employee"}.`;
    const whatsappUrl = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${shareText} The voucher PDF has been downloaded; please attach it to this chat.`)}`
      : "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const canShareFiles =
      Boolean(whatsappUrl) && supportsPdfFileSharing(fileName);
    const shareWindow =
      whatsappUrl && !isMobile && !canShareFiles
        ? window.open("about:blank", "_blank")
        : null;

    try {
      const doc = await createExpenseVoucherPdf(request);
      if (canShareFiles) {
        const file = new File([doc.output("blob")], fileName, {
          type: "application/pdf",
        });
        try {
          await navigator.share({
            files: [file],
            title: "Expense voucher",
            text: shareText,
          });
          toast.success("Choose WhatsApp and the employee to share the voucher.");
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
          console.error("Native voucher sharing failed:", error);
        }
      }

      if (!whatsappNumber) {
        await downloadFile(doc, fileName);
        toast.error(
          "Employee WhatsApp number is unavailable; the voucher PDF was downloaded.",
        );
        return;
      }

      await downloadFile(doc, fileName);
      if (isMobile) {
        window.location.assign(whatsappUrl);
        toast.info(
          `Voucher downloaded. Attach the PDF in the WhatsApp chat for ${employee.name || "this employee"}.`,
        );
      } else if (shareWindow) {
        shareWindow.location = whatsappUrl;
        toast.info(
          `Voucher downloaded. Attach the PDF in the WhatsApp chat for ${employee.name || "this employee"}.`,
        );
      } else {
        toast.error(
          "WhatsApp could not open. Allow popups and try sharing the voucher again.",
        );
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
