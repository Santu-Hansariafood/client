import { useCallback } from "react";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../../utils/apiClient/apiClient";
import { downloadFile } from "../../../../utils/fileDownloader";
import generateExcel from "../../../../common/GenerateExcel/GenerateExcel";
import { calculateLineTotal } from "../utils/expenseCalculations";

const createExpenseVoucherPdf = (request) => {
  const employee = request.employee || {};
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Expense Voucher", 14, 18);
  doc.setFontSize(10);
  doc.text(`Voucher No.: ${request.voucherNumber || "N/A"}`, 14, 27);
  doc.text(
    `Date: ${new Date(request.createdAt).toLocaleDateString()}`,
    14,
    33,
  );
  doc.text(`Employee: ${employee.name || "N/A"}`, 14, 39);
  doc.text(
    `Added By: ${request.createdBy?.name || employee.name || "N/A"}`,
    14,
    45,
  );
  doc.text(
    `Seller: ${request.sellerName || request.seller?.sellerName || "N/A"}`,
    14,
    51,
  );
  doc.text(`Company: ${request.sellerCompany || "N/A"}`, 14, 57);
  doc.text(`Received From: ${request.receivedFrom || "N/A"}`, 14, 63);
  autoTable(doc, {
    head: [["Category", "Description", "Quantity", "Rate (Rs.)", "Total (Rs.)"]],
    body:
      request.lineItems?.length > 0
        ? request.lineItems.map((item) => [
            item.category?.name || "Expense",
            item.description || "-",
            Number(item.quantity ?? 1),
            Number(item.amount || 0).toFixed(2),
            calculateLineTotal(item),
          ])
        : [
            [
              request.category?.name || "Expense",
              "-",
              "1",
              Number(request.amount || 0).toFixed(2),
              Number(request.amount || 0).toFixed(2),
            ],
          ],
    startY: 70,
  });
  const finalY = doc.lastAutoTable.finalY + 9;
  doc.setFontSize(12);
  doc.text(
    `Total Amount: Rs. ${Number(request.amount || 0).toFixed(2)}`,
    14,
    finalY,
  );
  doc.setFontSize(10);
  doc.text(`Status: ${request.status || "pending"}`, 14, finalY + 8);

  const decidedBy =
    request.status === "approved"
      ? request.approvedBy?.name
      : request.status === "rejected"
        ? request.rejectedBy?.name
        : "";
  if (decidedBy) {
    doc.text(
      `${request.status === "approved" ? "Approved" : "Rejected"} by: ${decidedBy}`,
      14,
      finalY + 16,
    );
  }
  if (request.rejectionReason) {
    doc.text(`Rejection reason: ${request.rejectionReason}`, 14, finalY + 24, {
      maxWidth: 180,
    });
  }
  if (request.description) {
    doc.text(
      `Description: ${request.description}`,
      14,
      finalY + (decidedBy || request.rejectionReason ? 32 : 16),
      { maxWidth: 180 },
    );
  }
  return doc;
};

const useExpenseDocuments = ({ isAdmin, filters, employees }) => {
  const downloadExpenseVoucher = useCallback(async (request) => {
    const voucherNumber = request.voucherNumber || request._id;
    try {
      await downloadFile(
        createExpenseVoucherPdf(request),
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
      const doc = createExpenseVoucherPdf(request);
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
