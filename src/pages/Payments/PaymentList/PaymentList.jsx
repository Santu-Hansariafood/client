import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  FaMoneyCheckAlt,
  FaSearch,
  FaDownload,
  FaFilePdf,
  FaCheckCircle,
  FaClock,
  FaCheckDouble,
  FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadFile } from "../../../utils/fileDownloader";
import logoUrl from "../../../assets/Hans.png";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const DateSelector = lazy(() => import("../../../common/DateSelector/DateSelector"));
const DataDropdown = lazy(() => import("../../../common/DataDropdown/DataDropdown"));

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB");
};

const PaymentList = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial status from path
  const isReceivedPath = location.pathname.includes("/payments/received");
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(isReceivedPath ? "done" : "due"); // Default to due list
  const [exporting, setExporting] = useState(false);
  const [totals, setTotals] = useState({
    totalGross: 0,
    totalCd: 0,
    totalGst: 0,
    totalClaims: 0,
    totalBankCharges: 0,
    totalCredit: 0,
    totalDue: 0
  });
  
  // Company state
  const [allCompanies, setAllCompanies] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedBuyerCompany, setSelectedBuyerCompany] = useState(null);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);

  // Sync paymentStatus when location changes
  useEffect(() => {
    if (location.pathname.includes("/payments/received")) {
      setPaymentStatus("done");
    } else {
      setPaymentStatus("due");
    }
    setCurrentPage(1);
  }, [location.pathname]);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const [companiesRes, sellerCompaniesRes] = await Promise.all([
          api.get("/companies", { params: { limit: 0 } }),
          api.get("/seller-company", { params: { limit: 0 } })
        ]);
        setAllCompanies(companiesRes.data.data || companiesRes.data || []);
        setSellerCompanies(sellerCompaniesRes.data.data || sellerCompaniesRes.data || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/payments", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          paymentStatus,
          buyerCompany: selectedBuyerCompany?.label || selectedBuyerCompany?.companyName || undefined,
          sellerCompany: selectedSellerCompany?.label || selectedSellerCompany?.companyName || undefined,
        },
      });
      setData(response.data.data);
      setTotalItems(response.data.total);
      if (response.data.totals) {
        setTotals(response.data.totals);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, startDate, endDate, paymentStatus, selectedBuyerCompany, selectedSellerCompany]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPayments();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchPayments]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "done" : "pending";
    try {
      await api.patch(`/payments/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
      fetchPayments();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDownloadExcel = async () => {
    if (exporting) return;
    setExporting(true);
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const response = await api.get("/payments/export/excel", {
        params: {
          search: searchInput,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          paymentStatus,
        },
        responseType: "blob",
      });
      const fileName = `Payments_${paymentStatus}_${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadFile(new Blob([response.data]), fileName);
      toast.update(toastId, { render: "Excel downloaded successfully", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error("Excel Download Error:", error);
      toast.update(toastId, { render: "Failed to download Excel", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape");
    
    // Optimize: Set font once
    doc.setFont("helvetica");

    const tableColumn = [
      "No", "Date", "Sauda No", "Lorry No", "Bill No", "Buyer", "Seller", "Gross Amt", "GST", "Credit", "Claims", "CD", "Bank Chgs", "Balance", "Remarks"
    ];

    const tableRows = data.map((item) => [
      item.slNo,
      formatDate(item.unloadingDate),
      item.saudaNo,
      item.lorryNumber || "N/A",
      item.billNumber || "-",
      item.buyerCompany,
      item.supplierCompany,
      `Rs. ${Number(item.grossAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.totalQualityClaims || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.cdAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.bankCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      `Rs. ${Number(item.dueAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      item.generalRemarks || "-"
    ]);

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text(`PAYMENTS ${paymentStatus.toUpperCase()} REPORT`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      margin: { top: 35 },
      showHead: 'firstPage',
    });

    doc.save(`Payments_${paymentStatus}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleDownloadSaudaWisePDF = () => {
    const doc = new jsPDF("landscape");
    
    const grouped = data.reduce((acc, item) => {
      const key = item.saudaNo || "N/A";
      if (!acc[key]) {
        acc[key] = {
          saudaNo: key,
          buyer: item.buyerCompany,
          seller: item.supplierCompany,
          consignee: item.consignee,
          terms: item.paymentTerms,
          dueDate: item.dueDate,
          items: [],
          totalQty: 0,
          totalAmount: 0
        };
      }
      acc[key].items.push(item);
      acc[key].totalQty += item.unloadingWeight || 0;
      acc[key].totalAmount += item.amount || 0;
      return acc;
    }, {});

    const tableColumn = [
      "Sauda No", "Lorry No", "Date", "Buyer", "Seller Company", "Terms", "Due Date", "Qty (T)", "Amount (Rs)", "Status"
    ];

    const tableRows = [];
    Object.values(grouped).forEach(group => {
      group.items.forEach((item, index) => {
        tableRows.push([
          index === 0 ? group.saudaNo : "",
          item.lorryNumber || "N/A",
          formatDate(item.unloadingDate),
          index === 0 ? group.buyer : "",
          index === 0 ? group.seller : "",
          index === 0 ? `${group.terms} Days` : "",
          index === 0 ? formatDate(group.dueDate) : "",
          (item.unloadingWeight || 0).toFixed(2),
          (item.amount || 0).toLocaleString("en-IN"),
          item.paymentStatus.toUpperCase()
        ]);
      });
      tableRows.push([
        { content: `Total for ${group.saudaNo}`, colSpan: 7, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: group.totalQty.toFixed(2), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `Rs. ${group.totalAmount.toLocaleString("en-IN")}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: "", styles: { fillColor: [240, 240, 240] } }
      ]);
    });

    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text(`SAUDA-WISE PAYMENT REPORT`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1 || data.cell.raw?.content?.startsWith('Total for')) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`SaudaWise_Payments_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleDownloadMISPDF = async () => {
    try {
      setExporting(true);
      const toastId = toast.loading("Generating MIS report...");

      console.log("Starting MIS PDF download...");

      // Fetch all data without pagination for PDF
      const response = await api.get("/payments", {
        params: {
          page: 1,
          limit: 5000,
          search: searchInput,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          paymentStatus,
          buyerCompany: selectedBuyerCompany?.label || selectedBuyerCompany?.companyName || undefined,
          sellerCompany: selectedSellerCompany?.label || selectedSellerCompany?.companyName || undefined,
        },
      });

      console.log("API response received:", response);
      const allItems = response.data.data || [];
      const pdfTotals = response.data.totals || totals;
      console.log("All items:", allItems);
      console.log("PDF totals:", pdfTotals);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      console.log("Doc created, adding header...");
      // Add company header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(26, 58, 95);
      doc.text("HANSARIA FOOD PRIVATE LIMITED", pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(64, 64, 64);
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3",
        pageWidth / 2,
        27,
        { align: "center" },
      );
      doc.text("Bidhannagar, Kolkata, West Bengal - 700106", pageWidth / 2, 33, {
        align: "center",
      });

      doc.setLineWidth(0.5);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 38, pageWidth - margin, 38);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 58, 95);
      doc.text("DUE LIST REPORT", pageWidth / 2, 46, {
        align: "center",
      });

      doc.setLineWidth(0.5);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 51, pageWidth - margin, 51);

      // Add filter info
      let infoY = 55;
      const buyerName = selectedBuyerCompany?.label || "All";
      const sellerName = selectedSellerCompany?.label || "All";
      const startDateStr = startDate ? new Date(startDate).toLocaleDateString("en-GB") : "All";
      const endDateStr = endDate ? new Date(endDate).toLocaleDateString("en-GB") : "All";

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, infoY, pageWidth - margin * 2, 32, "FD");
      doc.setLineWidth(0.5);
      doc.rect(margin, infoY, pageWidth - margin * 2, 32);

      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("Buyer Company", margin + 7, infoY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${buyerName}`, margin + 40, infoY + 10);

      doc.setFont("helvetica", "bold");
      doc.text("Date Between", pageWidth / 2, infoY + 10, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(`: ${startDateStr} To ${endDateStr}`, pageWidth / 2 + 40, infoY + 10);

      doc.setFont("helvetica", "bold");
      doc.text("Seller Company", pageWidth - 88, infoY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${sellerName}`, pageWidth - 48, infoY + 10);

      doc.setFont("helvetica", "bold");
      doc.text("Seller Company", margin + 7, infoY + 22);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${sellerName}`, margin + 40, infoY + 22);

      doc.setFont("helvetica", "bold");
      doc.text("Buyer Company", pageWidth - 88, infoY + 22);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${buyerName}`, pageWidth - 48, infoY + 22);

      let currentY = infoY + 42;

      console.log("Grouping items by sauda...");
      // Group items by sauda
      const groupedBySauda = {};
      allItems.forEach((item) => {
        const saudaKey = item.saudaNo || "NO SAUDA";
        if (!groupedBySauda[saudaKey]) {
          groupedBySauda[saudaKey] = [];
        }
        groupedBySauda[saudaKey].push(item);
      });

      let rowIdx = 0;
      const tableData = [];

      console.log("Building table data...");
      Object.keys(groupedBySauda).forEach((saudaKey) => {
        const group = groupedBySauda[saudaKey];
        
        tableData.push([
          {
            content: `SAUDA NO: ${saudaKey}`,
            colSpan: 15,
            styles: {
              fillColor: [200, 200, 200],
              fontStyle: "bold",
              halign: "center",
            },
          },
        ]);

        group.forEach((item) => {
          rowIdx++;
          
          let grossAmount = item.grossAmount || 0;
          let gstAmount = item.gstAmount || 0;
          let claims = item.totalQualityClaims || 0;
          let cdAmount = item.cdAmount || 0;
          let bankCharges = Number(item.bankCharges) || 0;
          let balance = Number((grossAmount + gstAmount - claims - cdAmount - bankCharges).toFixed(2));

          tableData.push([
            rowIdx,
            item.unloadingDate ? new Date(item.unloadingDate).toLocaleDateString("en-GB") : "-",
            item.saudaNo,
            `${item.lorryNumber || "-"} (${(item.unloadingWeight || 0).toFixed(3)} T)`,
            item.billNumber || "-",
            (item.buyerCompany || "-").toUpperCase(),
            (item.supplierCompany || "-").toUpperCase(),
            grossAmount > 0 ? `Rs. ${Number(grossAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            gstAmount > 0 ? `Rs. ${Number(gstAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            "",
            claims > 0 ? `Rs. ${Number(claims.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            cdAmount > 0 ? `Rs. ${Number(cdAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            bankCharges > 0 ? `Rs. ${Number(bankCharges.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            balance !== 0 ? `Rs. ${Number(balance.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "",
            item.generalRemarks || "-",
          ]);
        });
      });

      if (tableData.length === 0) {
        tableData.push([
          {
            content: "No records found",
            colSpan: 15,
            styles: {
              halign: "center",
              fontStyle: "bold",
            },
          },
        ]);
      }

      console.log("Table data ready, adding table...");
      console.log("tableData length:", tableData.length);

      // Check if autoTable exists
      console.log("About to call autoTable, autoTable is:", typeof autoTable);
      
      if (typeof autoTable !== "function") {
        console.error("autoTable is not a function!");
        toast.error("Failed to generate PDF: autoTable not loaded");
        setExporting(false);
        return;
      }

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "NO",
            "DATE",
            "SAUDA NO",
            "LORRY NO",
            "BILL NO",
            "BUYER",
            "SELLER",
            "GROSS AMOUNT (Rs.)",
            "GST (Rs.)",
            "CREDIT (Rs.)",
            "CLAIMS (Rs.)",
            "CD (Rs.)",
            "BANK CHGS (Rs.)",
            "BALANCE (Rs.)",
            "REMARKS",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontSize: 6.5,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.2,
          lineColor: [100, 100, 100],
        },
        styles: {
          fontSize: 5.5,
          cellPadding: 1.5,
          valign: "middle",
          textColor: [0, 0, 0],
          lineColor: [100, 100, 100],
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 7 },
          1: { halign: "center", cellWidth: 16 },
          2: { halign: "center", cellWidth: 16 },
          3: { halign: "center", cellWidth: 30 },
          4: { halign: "center", cellWidth: 16 },
          5: { cellWidth: 22 },
          6: { cellWidth: 22 },
          7: { halign: "right", cellWidth: 18 },
          8: { halign: "right", cellWidth: 18 },
          9: { halign: "right", cellWidth: 18 },
          10: { halign: "right", cellWidth: 18 },
          11: { halign: "right", cellWidth: 18 },
          12: { halign: "right", cellWidth: 18 },
          13: { halign: "right", fontStyle: "bold", cellWidth: 20 },
          14: { cellWidth: 35 },
        },
        margin: { left: 7, right: 7, top: 7, bottom: 15 },
        tableWidth: "wrap",
      });

      console.log("Table added, adding totals...");

      // Add grand totals summary
      const finalY = doc.lastAutoTable?.finalY || 70;
      doc.addPage();
      let summaryY = 12;

      const boxHeight = 26;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, summaryY, pageWidth - 2 * margin, boxHeight, "F");

      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, summaryY, pageWidth - 2 * margin, boxHeight);
      doc.line(
        margin + (pageWidth - 2 * margin) / 7,
        summaryY,
        margin + (pageWidth - 2 * margin) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin + (2 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        margin + (2 * (pageWidth - 2 * margin)) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin + (3 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        margin + (3 * (pageWidth - 2 * margin)) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin + (4 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        margin + (4 * (pageWidth - 2 * margin)) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin + (5 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        margin + (5 * (pageWidth - 2 * margin)) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin + (6 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        margin + (6 * (pageWidth - 2 * margin)) / 7,
        summaryY + boxHeight,
      );
      doc.line(
        margin,
        summaryY + boxHeight / 2,
        pageWidth - margin,
        summaryY + boxHeight / 2,
      );

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);

      const formattedTotalGross = Number(pdfTotals.totalGross.toFixed(2));
      doc.text(
        "TOTAL GROSS",
        margin + (pageWidth - 2 * margin) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalGross.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (pageWidth - 2 * margin) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const formattedTotalCredit = Number(pdfTotals.totalCredit.toFixed(2));
      doc.text(
        "TOTAL CREDIT",
        margin + (3 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalCredit.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (3 * (pageWidth - 2 * margin)) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const formattedTotalCd = Number(pdfTotals.totalCd.toFixed(2));
      doc.text(
        "TOTAL CD",
        margin + (5 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalCd.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (5 * (pageWidth - 2 * margin)) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const formattedTotalGst = Number(pdfTotals.totalGst.toFixed(2));
      doc.text(
        "TOTAL GST",
        margin + (7 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalGst.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (7 * (pageWidth - 2 * margin)) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const formattedTotalClaims = Number(pdfTotals.totalClaims.toFixed(2));
      doc.text(
        "TOTAL CLAIMS",
        margin + (9 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalClaims.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (9 * (pageWidth - 2 * margin)) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const formattedTotalBankCharges = Number(pdfTotals.totalBankCharges.toFixed(2));
      doc.text(
        "TOTAL BANK CHGS",
        margin + (11 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.text(
        formattedTotalBankCharges.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        margin + (11 * (pageWidth - 2 * margin)) / 14,
        summaryY + 19,
        { align: "center" },
      );
      doc.setFont("helvetica", "bold");

      const totalLeftSide = pdfTotals.totalGross + pdfTotals.totalGst;
      const totalRightSide = pdfTotals.totalCd + pdfTotals.totalClaims + pdfTotals.totalBankCharges + pdfTotals.totalCredit;
      const difference = Number((totalLeftSide - totalRightSide).toFixed(2));
      const formattedDifference = Number(difference.toFixed(2));
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(26, 58, 95);
      doc.rect(
        margin + (6 * (pageWidth - 2 * margin)) / 7,
        summaryY,
        (pageWidth - 2 * margin) / 7,
        boxHeight,
        "F",
      );
      doc.text(
        "DIFFERENCE",
        margin + (13 * (pageWidth - 2 * margin)) / 14,
        summaryY + 8.5,
        { align: "center" },
      );

      const differenceText =
        formattedDifference > 0
          ? `${formattedDifference.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr`
          : formattedDifference < 0
            ? `${Math.abs(formattedDifference).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`
            : "NIL";
      doc.text(
        differenceText,
        margin + (13 * (pageWidth - 2 * margin)) / 14,
        summaryY + 18,
        { align: "center" },
      );

      doc.setTextColor(0, 0, 0);
      summaryY += boxHeight + 5;

      // Add total due
      let dueSummaryY = summaryY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text("TOTAL DUE AMOUNT:", margin + 10, dueSummaryY);
      doc.setFontSize(14);
      doc.text(`Rs. ${Number(pdfTotals.totalDue.toFixed(2)).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`, margin + 60, dueSummaryY);

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setLineWidth(0.2);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );
        doc.text("Confidential", pageWidth - margin, pageHeight - 8, {
          align: "right",
        });
      }

      console.log("Saving PDF...");
      doc.save(`Due_List_MIS_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.update(toastId, { render: "MIS report downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
      console.log("PDF saved!");
    } catch (error) {
      console.error("Error generating MIS PDF:", error);
      toast.error("Failed to generate MIS report: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const headers = [
    "No", "Date", "Sauda No", "Lorry No", "Bill No", "Buyer", "Seller", "Gross Amt", "GST", "Credit", "Claims", "CD", "Bank Chgs", "Balance", "Remarks"
  ];

  const rows = data.map((item) => [
    item.slNo,
    formatDate(item.unloadingDate),
    item.saudaNo,
    <span key={`lorry-${item._id}`} className="font-bold text-slate-600 uppercase">{item.lorryNumber || "N/A"}</span>,
    item.billNumber || "-",
    <span key={`buyer-${item._id}`} className="font-semibold text-slate-700">{item.buyerCompany}</span>,
    item.supplierCompany,
    <span key={`gross-${item._id}`} className="font-black text-slate-700">Rs. {Number(item.grossAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`gst-${item._id}`} className="font-black text-slate-700">Rs. {Number(item.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`credit-${item._id}`} className="font-black text-emerald-700">Rs. {Number(item.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`claims-${item._id}`} className="font-black text-slate-700">Rs. {Number(item.totalQualityClaims || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`cd-${item._id}`} className="font-black text-slate-700">Rs. {Number(item.cdAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`bank-${item._id}`} className="font-black text-slate-700">Rs. {Number(item.bankCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    <span key={`dueamt-${item._id}`} className={`font-bold ${item.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {Number(item.dueAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    item.generalRemarks || "-"
  ]);

  const tabs = [
    { id: "due", label: "Due List", icon: <FaClock className="text-rose-500" />, link: "/payments/list" },
    { id: "done", label: "Received List", icon: <FaCheckDouble />, link: "/payments/received/list" },
  ];

  return (
    <AdminPageShell noContentCard>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 space-y-8">
        {/* Sub-navbar / Tabs */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setPaymentStatus(tab.id);
                navigate(tab.link);
              }}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                paymentStatus === tab.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 transform transition-transform hover:rotate-12">
                <FaMoneyCheckAlt size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
                  Payment {paymentStatus === 'done' ? 'Received' : 'List'}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleDownloadExcel}
                disabled={exporting}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaDownload className="text-emerald-600" />
                {exporting ? "Exporting..." : "Excel"}
              </button>
              <button
                onClick={handleDownloadMISPDF}
                disabled={exporting}
                className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                <FaFilePdf />
                MIS PDF
              </button>
            </div>
          </div>

          {/* Filters Section - First Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="relative group/input">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Sauda No, Company, Lorry..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholderText="From Date"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="To Date"
                className="w-full"
              />
            </div>

            <div className="bg-slate-50 rounded-2xl flex items-center px-6 py-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-4">Status:</span>
              <span className={`text-sm font-black uppercase ${paymentStatus === 'done' ? 'text-emerald-600' : paymentStatus === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                {paymentStatus === 'all' ? 'All Records' : paymentStatus}
              </span>
            </div>
          </div>

          {/* Filters Section - Second Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <DataDropdown
              options={allCompanies.map(c => ({ value: c._id, label: c.companyName }))}
              selectedOptions={selectedBuyerCompany}
              onChange={(option) => {
                setSelectedBuyerCompany(option);
                setCurrentPage(1);
              }}
              placeholder="Buyer Company"
              isClearable
            />

            <DataDropdown
              options={sellerCompanies.map(c => ({ value: c._id, label: c.companyName }))}
              selectedOptions={selectedSellerCompany}
              onChange={(option) => {
                setSelectedSellerCompany(option);
                setCurrentPage(1);
              }}
              placeholder="Seller Company"
              isClearable
            />
          </div>

          {/* Totals Display - Always Visible with Better Design */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Gross</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalGross.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total CD</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalCd.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total GST</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalGst.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-300 shadow-md">
              <div className="text-sm font-bold text-rose-600 uppercase tracking-widest mb-2">Total Due</div>
              <div className="text-xs font-black text-rose-700">
                Rs. {Number(totals.totalDue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Additional Totals Row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Claims</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalClaims.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Bank Charges</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalBankCharges.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Credit</div>
              <div className="text-xs font-black text-slate-800">
                Rs. {Number(totals.totalCredit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} />
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default PaymentList;
