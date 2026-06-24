import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import api from "../../../utils/apiClient/apiClient";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilePdf,
} from "react-icons/fa";
import SaudaMISSection from "./components/SaudaMISSection";
import MisStatCard from "./components/MisStatCard";
import MisFilterPanel from "./components/MisFilterPanel";
import MisVoucherLedger from "./components/MisVoucherLedger";
import MisLorryLedger from "./components/MisLorryLedger";
import MisPageHeader from "./components/MisPageHeader";
import { buildTallyVoucherRows } from "./utils/paymentLedgerUtils";

const ListPaymentReceived = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [payments, setPayments] = useState([]);
  const [listEntries, setListEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("vouchers"); // vouchers, sauda
  const [ledgers, setLedgers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [fetchingLedgers, setFetchingLedgers] = useState(false);

  const [opposingLedgers, setOpposingLedgers] = useState([]);
  const [saudas, setSaudas] = useState([]);
  const [selectedSauda, setSelectedSauda] = useState(null);
  const [selectedOpposingCompany, setSelectedOpposingCompany] = useState(null);
  const [lorryWiseData, setLorryWiseData] = useState([]);
  const [fetchingLorryWise, setFetchingLorryWise] = useState(false);

  const [filters, setFilters] = useState({
    ledgerType: "",
    ledgerId: "",
    companyId: "",
    startDate: "",
    endDate: "",
    saudaNo: "",
    supplierCompany: "",
    buyerCompany: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const companiesRes = await api.get("/companies", {
          params: { limit: 0 },
        });
        setAllCompanies(companiesRes.data.data || companiesRes.data || []);
        
        const sellerCompaniesRes = await api.get("/seller-company", {
          params: { limit: 0 },
        });
        setSellerCompanies(sellerCompaniesRes.data.data || sellerCompaniesRes.data || []);
        
        const buyerCompaniesRes = await api.get("/buyers", {
          params: { limit: 0 },
        });
        setBuyerCompanies(buyerCompaniesRes.data.data || buyerCompaniesRes.data || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchOpposingLedgers = async () => {
      if (!filters.ledgerType) {
        setOpposingLedgers([]);
        return;
      }
      try {
        const endpoint =
          filters.ledgerType === "Buyer" ? "/sellers" : "/buyers";
        const response = await api.get(endpoint, { params: { limit: 0 } });
        const data = response.data.data || response.data || [];
        setOpposingLedgers(
          data.map((item) => ({
            companies: item.companyIds || item.companies || [],
          })),
        );
      } catch (error) {
        console.error("Error fetching opposing companies:", error);
      }
    };
    fetchOpposingLedgers();
  }, [filters.ledgerType]);

  const primaryCompanyOptions = useMemo(() => {
    if (!filters.ledgerType) {
      return allCompanies.map((c) => ({
        value: c._id,
        label: c.companyName,
      }));
    }
    if (filters.ledgerType === "Buyer") {
      return allCompanies.map((c) => ({
        value: c._id,
        label: c.companyName,
      }));
    }
    const names = new Set();
    ledgers.forEach((l) => {
      (l.companies || []).forEach((c) => {
        const name = typeof c === "string" ? c : c?.companyName || c?.label;
        if (name) names.add(name);
      });
    });
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [filters.ledgerType, allCompanies, ledgers]);

  const opposingCompanyOptions = useMemo(() => {
    if (!filters.ledgerType) return [];
    if (filters.ledgerType === "Buyer") {
      const names = new Set();
      opposingLedgers.forEach((l) => {
        (l.companies || []).forEach((c) => {
          const name = typeof c === "string" ? c : c?.companyName || c?.label;
          if (name) names.add(name);
        });
      });
      return Array.from(names)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name }));
    }
    return allCompanies.map((c) => ({
      value: c._id,
      label: c.companyName,
    }));
  }, [filters.ledgerType, opposingLedgers, allCompanies]);

  const resolveLedgerForCompany = useCallback(
    (companyId, ledgerType, ledgerList) => {
      if (!companyId) return null;
      if (ledgerType === "Buyer") {
        return (
          ledgerList.find((ledger) =>
            (ledger.companies || []).some((c) => {
              const id = typeof c === "string" ? c : c._id || c.value || c.id;
              return id === companyId;
            }),
          ) || null
        );
      }
      return (
        ledgerList.find((ledger) =>
          (ledger.companies || []).some((c) => {
            const name = typeof c === "string" ? c : c?.companyName || c?.label;
            return name === companyId;
          }),
        ) || null
      );
    },
    [],
  );

  useEffect(() => {
    const fetchSaudas = async () => {
      const buyerCompany =
        filters.ledgerType === "Buyer"
          ? selectedCompany?.label || ""
          : selectedOpposingCompany?.label || "";
      const sellerCompany =
        filters.ledgerType === "Buyer"
          ? selectedOpposingCompany?.label || ""
          : selectedCompany?.label || "";

      if (!buyerCompany && !sellerCompany) {
        setSaudas([]);
        setSelectedSauda(null);
        return;
      }

      try {
        const params = {};
        if (buyerCompany) params.buyerCompany = buyerCompany;
        if (sellerCompany) params.sellerCompany = sellerCompany;

        const response = await api.get("/loading-entries/saudas", { params });
        const saudaList = response.data.data || response.data || [];
        setSaudas(
          saudaList.map((s) => ({ value: s.saudaNo, label: s.saudaNo })),
        );
      } catch (error) {
        console.error("Error fetching saudas:", error);
        setSaudas([]);
      }
    };
    fetchSaudas();
  }, [
    filters.ledgerType,
    selectedCompany,
    selectedOpposingCompany,
  ]);

  useEffect(() => {
    const fetchLorryWise = async () => {
      if (selectedSauda) {
        try {
          setFetchingLorryWise(true);
          const response = await api.get(
            `/self-orders/details/${selectedSauda.value}`,
          );
          const { entries, payments } = response.data;

          const processedEntries = entries.map((entry) => {
            const adjustments = payments
              .filter(
                (p) =>
                  p.mappings &&
                  p.mappings.some((m) => m.loadingEntryId === entry._id),
              )
              .map((p) => {
                const mapping = p.mappings.find(
                  (m) => m.loadingEntryId === entry._id,
                );
                return {
                  paymentDate: p.date,
                  voucherNo: p.voucherNo,
                  amount: mapping.allocatedAmount,
                  paymentMode: p.paymentMode,
                };
              });

            const totalAdjusted = adjustments.reduce(
              (sum, adj) => sum + adj.amount,
              0,
            );
            return {
              ...entry,
              adjustments,
              totalAdjusted,
              balance: (entry.totalFreight || 0) - totalAdjusted,
            };
          });

          setLorryWiseData(processedEntries);
        } catch (error) {
          console.error("Error fetching lorry wise data:", error);
        } finally {
          setFetchingLorryWise(false);
        }
      } else {
        setLorryWiseData([]);
      }
    };
    fetchLorryWise();
  }, [selectedSauda]);

  const fetchLedgers = useCallback(async () => {
    if (!filters.ledgerType) {
      setLedgers([]);
      return;
    }
    try {
      setFetchingLedgers(true);
      const endpoint = filters.ledgerType === "Buyer" ? "/buyers" : "/sellers";
      const response = await api.get(endpoint, { params: { limit: 0 } });
      const data = response.data.data || response.data;
      setLedgers(
        data.map((item) => ({
          value: item._id,
          label:
            filters.ledgerType === "Buyer"
              ? `${item.name} ${item.mobile ? `(${item.mobile})` : ""} ${item.groupId?.groupName ? `- ${item.groupId.groupName}` : ""}`
              : `${item.sellerName} ${item.phoneNumbers?.[0]?.value ? `(${item.phoneNumbers[0].value})` : ""} ${item.city ? `- ${item.city}` : ""}`,
          companies: item.companyIds || item.companies || [],
        })),
      );
    } catch (error) {
      toast.error("Error fetching ledgers");
    } finally {
      setFetchingLedgers(false);
    }
  }, [filters.ledgerType]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Payments
      const response = await api.get("/payment-received", {
        params: {
          ...filters,
          page,
          limit,
        },
      });
      setPayments(response.data.data || []);
      setTotal(response.data.total || 0);
      setTotalAmount(response.data.totalAmount || 0);
      setOpeningBalance(response.data.openingBalance || 0);

      // 2. Fetch Loading Entries (Bills) for the same period and company
      if (filters.ledgerType && (filters.buyerCompany || filters.supplierCompany)) {
        const entryParams = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 1000,
        };
        if (filters.buyerCompany) entryParams.buyerCompany = filters.buyerCompany;
        if (filters.supplierCompany) entryParams.supplierCompany = filters.supplierCompany;

        const entriesRes = await api.get("/loading-entries", { params: entryParams });
        setListEntries(entriesRes.data.data || []);
      } else {
        setListEntries([]);
      }
    } catch (error) {
      toast.error("Error fetching ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  const tallyListRows = useMemo(
    () => buildTallyVoucherRows(payments, openingBalance, listEntries),
    [payments, openingBalance, listEntries],
  );

  const stats = useMemo(() => {
    const totalDr = tallyListRows.reduce((s, r) => s + (r.debit || 0), 0);
    const totalCr = tallyListRows.reduce((s, r) => s + (r.credit || 0), 0);
    const closing = openingBalance + totalDr - totalCr;

    return {
      openingBalance,
      totalReceived: totalCr,
      totalBilled: totalDr,
      closingBalance: closing,
      count: tallyListRows.filter((r) => !r.isOpening).length,
    };
  }, [openingBalance, tallyListRows]);

  const listCompanyPair = useMemo(
    () => ({
      buyerCompany:
        filters.ledgerType === "Buyer"
          ? selectedCompany?.label || ""
          : selectedOpposingCompany?.label || "",
      supplierCompany:
        filters.ledgerType === "Buyer"
          ? selectedOpposingCompany?.label || ""
          : selectedCompany?.label || "",
    }),
    [filters.ledgerType, selectedCompany, selectedOpposingCompany],
  );

  const periodCredit = useMemo(
    () => tallyListRows.reduce((s, r) => s + (r.credit || 0), 0),
    [tallyListRows],
  );

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      ledgerType: "",
      ledgerId: "",
      companyId: "",
      startDate: "",
      endDate: "",
      saudaNo: "",
      supplierCompany: "",
      buyerCompany: "",
    });
    setSelectedLedger(null);
    setSelectedCompany(null);
    setSelectedOpposingCompany(null);
    setSelectedSauda(null);
    setLorryWiseData([]);
  };

  const handleFilterField = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanySelect = (opt) => {
    const companyId = opt?.value || "";
    const ledger = resolveLedgerForCompany(
      companyId,
      filters.ledgerType,
      ledgers,
    );
    setSelectedCompany(opt);
    setSelectedLedger(ledger);
    setSelectedOpposingCompany(null);
    setSelectedSauda(null);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      companyId,
      ledgerId: ledger?.value || "",
      supplierCompany: "",
      buyerCompany: "",
      ...(filters.ledgerType === "Buyer"
        ? { buyerCompany: opt?.label || "" }
        : {}),
      ...(filters.ledgerType === "Seller"
        ? { supplierCompany: opt?.label || "" }
        : {}),
      ...(!filters.ledgerType && opt?.label
        ? { buyerCompany: opt.label, supplierCompany: "" }
        : {}),
    }));
  };

  const handleOpposingSelect = (opt) => {
    setSelectedOpposingCompany(opt);
    setSelectedSauda(null);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      supplierCompany:
        filters.ledgerType === "Buyer" ? opt?.value || "" : prev.supplierCompany,
      buyerCompany:
        filters.ledgerType === "Seller" ? opt?.label || "" : prev.buyerCompany,
    }));
  };

  const handlePrintReport = async () => {
    try {
      setPrinting(true);

      const params = {
        ...filters,
        limit: 5000,
      };

      const response = await api.get("/payment-received", {
        params,
      });

      // 2. Fetch Loading Entries (Bills) if needed for the report
      let allEntries = [];
      if (filters.ledgerType && (filters.buyerCompany || filters.supplierCompany)) {
        const entryParams = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 1000,
        };
        if (filters.buyerCompany) entryParams.buyerCompany = filters.buyerCompany;
        if (filters.supplierCompany) entryParams.supplierCompany = filters.supplierCompany;

        const entriesRes = await api.get("/loading-entries", { params: entryParams });
        allEntries = entriesRes.data.data || [];
      }

      const reportRows = buildTallyVoucherRows(response.data.data || [], openingBalance, allEntries);

      if (reportRows.length === 0) {
        toast.warning("No records found");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106",
        pageWidth / 2,
        20,
        { align: "center" },
      );

      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth - margin, 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PAYMENT RECEIVED MIS REPORT", margin, 32);

      if (selectedCompany) {
        doc.setFontSize(10);
        doc.text(`COMPANY: ${selectedCompany.label.toUpperCase()}`, margin, 38);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateRange =
        filters.startDate && filters.endDate
          ? `Period: ${new Date(filters.startDate).toLocaleDateString("en-GB")} to ${new Date(filters.endDate).toLocaleDateString("en-GB")}`
          : "Period: Consolidated (All Time)";
      doc.text(dateRange, pageWidth - margin, 32, { align: "right" });

      doc.line(
        margin,
        selectedCompany ? 41 : 35,
        pageWidth - margin,
        selectedCompany ? 41 : 35,
      );

      let currentY = selectedCompany ? 45 : 40;

      if (filters.ledgerId) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Opening Balance:", margin, currentY + 5);
        doc.text(
          `Rs. ${openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          pageWidth - margin,
          currentY + 5,
          { align: "right" },
        );
        currentY += 10;
      }

      // Helper to calculate tally details for a loading entry
      const calculateTallyDetails = (e) => {
        if (!e) return { netAmount: 0, dueAmount: 0 };
        const weight = (e.unloadingWeight || 0) > 0 ? e.unloadingWeight : e.loadingWeight || 0;
        const rate = e.actualRate || 0;
        const cdPercent = e.cd || 0;
        const gstPercent = e.gst || 0;
        const grossAmount = weight * rate;
        const cdAmount = grossAmount * (cdPercent / 100);
        const taxableAmount = grossAmount - cdAmount;
        const gstAmount = taxableAmount * (gstPercent / 100);
        const netAmount = taxableAmount + gstAmount;
        return { netAmount, dueAmount: Math.max(0, netAmount - (e.paidAmount || 0)) };
      };

      // Helper to extract fields from a row
      const extractRowData = (row) => {
        let saudaNo = "-";
        let lorryNo = "-";
        let billNo = "-";
        let billAmount = 0;
        let paidAmount = 0;
        let payableAmount = 0;
        let remarks = "-";
        let qualityClaims = [];

        if (row.isOpening) {
          return {
            saudaNo,
            lorryNo,
            billNo,
            billAmount,
            paidAmount,
            payableAmount,
            remarks,
            qualityClaims,
          };
        }

        const raw = row.raw;
        if (raw?.uiType === "entry") {
          // It's a LoadingEntry
          const details = calculateTallyDetails(raw);
          saudaNo = raw.saudaNo || "-";
          lorryNo = raw.lorryNumber || "-";
          billNo = raw.billNumber || "-";
          billAmount = details.netAmount;
          paidAmount = raw.paidAmount || 0;
          payableAmount = details.dueAmount;
          remarks = raw.generalRemarks || "-";
          qualityClaims = raw.qualityClaims || [];
        } else if (raw?.mappings?.length > 0) {
          // It's a PaymentReceived with mappings
          const firstMapping = raw.mappings[0];
          const loadingEntry = firstMapping?.loadingEntryId;
          const details = calculateTallyDetails(loadingEntry);
          saudaNo = firstMapping?.saudaNo || loadingEntry?.saudaNo || "-";
          lorryNo = loadingEntry?.lorryNumber || "-";
          billNo = loadingEntry?.billNumber || "-";
          billAmount = details.netAmount;
          paidAmount = Number(firstMapping?.allocatedAmount || 0);
          payableAmount = details.dueAmount;
          remarks = firstMapping?.remarks || raw.remarks || "-";
          qualityClaims = loadingEntry?.qualityClaims || [];
        } else {
          // It's a PaymentReceived without mappings
          remarks = row.particulars;
        }

        return {
          saudaNo,
          lorryNo,
          billNo,
          billAmount,
          paidAmount,
          payableAmount,
          remarks,
          qualityClaims,
        };
      };

      // Build table data
      const tableData = [];
      reportRows.forEach((row, idx) => {
        const rowData = extractRowData(row);

        tableData.push([
          idx + 1,
          row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-",
          rowData.saudaNo,
          rowData.lorryNo,
          rowData.billNo,
          (row.buyerCompany || "-").toUpperCase(),
          (row.supplierCompany || "-").toUpperCase(),
          rowData.billAmount > 0 ? `Rs. ${Number(rowData.billAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
          rowData.paidAmount > 0 ? `Rs. ${Number(rowData.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
          rowData.payableAmount > 0 ? `Rs. ${Number(rowData.payableAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "",
          rowData.remarks,
        ]);

        // Add claim rows if any
        const validClaims = rowData.qualityClaims.filter(c => Number(c.claimAmount) > 0);
        if (validClaims.length > 0) {
          validClaims.forEach((claim) => {
            tableData.push([
              "",
              "",
              "",
              "",
              "",
              "",
              `CLAIM: ${(claim.parameterName || "UNNAMED").toUpperCase()}`,
              "",
              "",
              `Rs. ${Number(claim.claimAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              "",
            ]);
          });
        }
      });

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
            "BILL AMOUNT",
            "PAID AMOUNT",
            "PAYABLE AMOUNT",
            "REMARKS",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [30, 58, 95],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        styles: {
          fontSize: 6,
          cellPadding: 1.5,
          valign: "middle",
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { halign: "center", cellWidth: 18 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "center", cellWidth: 18 },
          4: { halign: "center", cellWidth: 18 },
          5: { cellWidth: 28 },
          6: { cellWidth: 28 },
          7: { halign: "right", cellWidth: 22 },
          8: { halign: "right", cellWidth: 22 },
          9: { halign: "right", fontStyle: "bold", cellWidth: 25 },
          10: { cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: "right" },
          );
          doc.text(
            `Printed on: ${new Date().toLocaleString()}`,
            margin,
            pageHeight - 10,
          );
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 70;
      const summaryY = finalY + 10;

      // Calculate totals
      let totalBillAmount = 0;
      let totalPaidAmount = 0;
      let totalPayableAmount = 0;
      reportRows.forEach((row) => {
        if (!row.isOpening) {
          const rowData = extractRowData(row);
          totalBillAmount += Number(rowData.billAmount);
          totalPaidAmount += Number(rowData.paidAmount);
          totalPayableAmount += Number(rowData.payableAmount);
        }
      });

      // Print total bill value on left and payable value on right
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Bill Amount: Rs. ${totalBillAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        margin,
        summaryY,
      );
      doc.text(
        `Total Payable Amount: Rs. ${totalPayableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        pageWidth - margin,
        summaryY,
        { align: "right" },
      );

      // Signatory
      doc.setFontSize(9);
      doc.text("Authorised Signatory", pageWidth - margin, summaryY + 15, {
        align: "right",
      });
      doc.line(
        pageWidth - 60,
        summaryY + 12,
        pageWidth - margin,
        summaryY + 12,
      );

      doc.save(
        `MIS_PaymentReceived_${filters.startDate || "All"}_to_${filters.endDate || "All"}.pdf`,
      );

      toast.success("MIS Report generated successfully");
    } catch (error) {
      console.error("Print Error:", error);
      toast.error("Failed to generate MIS Report");
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPaymentAdvice = async () => {
    try {
      setPrinting(true);

      const params = {
        ...filters,
        limit: 5000,
      };

      const response = await api.get("/payment-received", {
        params,
      });

      // Fetch Loading Entries with quality claims
      let allEntries = [];
      if (filters.ledgerType && (filters.buyerCompany || filters.supplierCompany)) {
        const entryParams = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 1000,
        };
        if (filters.buyerCompany) entryParams.buyerCompany = filters.buyerCompany;
        if (filters.supplierCompany) entryParams.supplierCompany = filters.supplierCompany;

        const entriesRes = await api.get("/loading-entries", { params: entryParams });
        allEntries = entriesRes.data.data || [];
      }

      const reportRows = buildTallyVoucherRows(response.data.data || [], openingBalance, allEntries);

      if (reportRows.length === 0) {
        toast.warning("No records found");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106",
        pageWidth / 2,
        20,
        { align: "center" },
      );

      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth - margin, 25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PAYMENT ADVICE", margin, 32);

      if (selectedCompany) {
        doc.setFontSize(10);
        doc.text(`COMPANY: ${selectedCompany.label.toUpperCase()}`, margin, 38);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateRange =
        filters.startDate && filters.endDate
          ? `Period: ${new Date(filters.startDate).toLocaleDateString("en-GB")} to ${new Date(filters.endDate).toLocaleDateString("en-GB")}`
          : "Period: Consolidated (All Time)";
      doc.text(dateRange, pageWidth - margin, 32, { align: "right" });

      doc.line(
        margin,
        selectedCompany ? 41 : 35,
        pageWidth - margin,
        selectedCompany ? 41 : 35,
      );

      let currentY = selectedCompany ? 45 : 40;

      // First, process all payments and entries
      const payments = response.data.data || [];

      // Payment Table
      const paymentTableData = payments.map((p, idx) => [
        idx + 1,
        p.date ? new Date(p.date).toLocaleDateString("en-GB") : "—",
        p.voucherNo || "N/A",
        (p.paymentMode || "").toUpperCase(),
        `Rs. ${Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      ]);

      if (payments.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("PAYMENTS MADE/RECEIVED", margin, currentY);
        currentY += 8;

        autoTable(doc, {
          startY: currentY,
          head: [
            ["NO", "DATE", "VOUCHER NO", "MODE", "AMOUNT"],
          ],
          body: paymentTableData,
          theme: "grid",
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 7,
            fontStyle: "bold",
            halign: "center",
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
          },
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
            valign: "middle",
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
          },
          margin: { left: margin, right: margin },
        });

        currentY = doc.lastAutoTable?.finalY + 10 || currentY + 20;
      }

      // Quality Claims Table
      const entriesWithClaims = allEntries.filter(e => 
        e.qualityClaims && e.qualityClaims.length > 0 && 
        e.qualityClaims.some(c => Number(c.claimAmount) > 0)
      );

      if (entriesWithClaims.length > 0) {
        const claimTableData = [];
        let claimIdx = 1;
        entriesWithClaims.forEach(entry => {
          const validClaims = entry.qualityClaims.filter(c => Number(c.claimAmount) > 0);
          validClaims.forEach(claim => {
            claimTableData.push([
              claimIdx++,
              entry.saudaNo || "N/A",
              entry.lorryNumber || "N/A",
              entry.billNumber || "N/A",
              claim.parameterName || "Unnamed",
              `Rs. ${Number(claim.claimAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            ]);
          });
        });

        if (claimTableData.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("QUALITY CLAIMS REPORT", margin, currentY);
          currentY += 8;

          autoTable(doc, {
            startY: currentY,
            head: [
              ["NO", "SAUDA NO", "LORRY NO", "BILL NO", "PARAMETER", "CLAIM AMOUNT"],
            ],
            body: claimTableData,
            theme: "grid",
            headStyles: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              fontSize: 7,
              fontStyle: "bold",
              halign: "center",
              lineWidth: 0.1,
              lineColor: [0, 0, 0],
            },
            styles: {
              fontSize: 6,
              cellPadding: 1.5,
              valign: "middle",
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
            },
            margin: { left: margin, right: margin },
          });
        }
      }

      const finalY = doc.lastAutoTable?.finalY || 70;

      // Footer
      doc.setFontSize(9);
      doc.text("Authorised Signatory", pageWidth - margin, finalY + 20, {
        align: "right",
      });
      doc.line(
        pageWidth - 60,
        finalY + 17,
        pageWidth - margin,
        finalY + 17,
      );

      doc.save(
        `Payment_Advice_${filters.startDate || "All"}_to_${filters.endDate || "All"}.pdf`,
      );

      toast.success("Payment Advice generated successfully");
    } catch (error) {
      console.error("Payment Advice Error:", error);
      toast.error("Failed to generate Payment Advice");
    } finally {
      setPrinting(false);
    }
  };

  const handleLedgerTypeChange = (value) => {
    setPage(1);
    setSelectedLedger(null);
    setSelectedCompany(null);
    setSelectedOpposingCompany(null);
    setSelectedSauda(null);
    setLorryWiseData([]);
    setFilters((prev) => ({
      ...prev,
      ledgerType: value,
      ledgerId: "",
      companyId: "",
      supplierCompany: "",
      buyerCompany: "",
    }));
  };

  return (
    <AdminPageShell
      title="Payment Ledger MIS"
      subtitle="Tally-style company ledger, voucher register & sauda drill-down"
      icon={FaMoneyBillWave}
      noContentCard
    >
      <div className="relative -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_#f0f9ff_0%,_#f8fafc_45%,_#f1f5f9_100%)]" />

        <div className="max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          <MisPageHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === "vouchers" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
                <MisStatCard
                  icon={<FaChartLine size={18} />}
                  label="Opening balance"
                  value={`₹ ${stats.openingBalance.toLocaleString("en-IN")}`}
                  subValue="Before period"
                  accent="navy"
                />
                <MisStatCard
                  icon={<FaMoneyBillWave size={18} />}
                  label="Period Bills (Dr.)"
                  value={`₹ ${stats.totalBilled.toLocaleString("en-IN")}`}
                  subValue="Debit total"
                  accent="rose"
                />
                <MisStatCard
                  icon={<FaMoneyBillWave size={18} />}
                  label="Period receipts (Cr.)"
                  value={`₹ ${stats.totalReceived.toLocaleString("en-IN")}`}
                  subValue="Credit total"
                  accent="emerald"
                />
                <MisStatCard
                  icon={<FaCheckCircle size={18} />}
                  label="Closing balance"
                  value={`₹ ${stats.closingBalance.toLocaleString("en-IN")}`}
                  subValue="After period"
                  accent="blue"
                />
                <MisStatCard
                  icon={<FaExclamationCircle size={18} />}
                  label="Vouchers"
                  value={stats.count.toString()}
                  subValue="In view"
                  accent="amber"
                />
              </div>

              <MisFilterPanel
                filters={filters}
                onFilterChange={(key, value) => {
                  if (key === "ledgerType") handleLedgerTypeChange(value);
                  else handleFilterField(key, value);
                }}
                onReset={handleResetFilters}
                primaryCompanyOptions={primaryCompanyOptions}
                opposingCompanyOptions={opposingCompanyOptions}
                saudaOptions={saudas}
                selectedCompany={selectedCompany}
                selectedOpposingCompany={selectedOpposingCompany}
                selectedSauda={selectedSauda}
                onCompanySelect={handleCompanySelect}
                onOpposingCompanySelect={handleOpposingSelect}
                onSaudaChange={setSelectedSauda}
                onPrint={handlePrintReport}
                onDownloadPaymentAdvice={handleDownloadPaymentAdvice}
                onRecordPayment={() => navigate("/payments/received/add")}
                printing={printing}
                printDisabled={loading || printing || payments.length === 0}
                ledgerTypeDisabled={false}
              />

              {fetchingLorryWise ? (
                <div className="rounded-3xl border border-slate-200 bg-white py-24 flex flex-col items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Loading lorry ledger…
                  </p>
                </div>
              ) : selectedSauda ? (
                lorryWiseData.length > 0 ? (
                  <MisLorryLedger
                    saudaLabel={selectedSauda.label}
                    lorryWiseData={lorryWiseData}
                    onBack={() => setSelectedSauda(null)}
                    buyerCompany={listCompanyPair.buyerCompany}
                    supplierCompany={listCompanyPair.supplierCompany}
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center px-6">
                    <p className="font-bold text-slate-800">No lorries for this sauda</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Sauda {selectedSauda.label} has no loading entries in the system.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedSauda(null)}
                      className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] hover:underline"
                    >
                      Back to register
                    </button>
                  </div>
                )
              ) : (
                <MisVoucherLedger
                  loading={loading}
                  tallyRows={tallyListRows}
                  listCompanyPair={listCompanyPair}
                  ledgerType={filters.ledgerType}
                  showCompanyBanner={Boolean(
                    selectedCompany || listCompanyPair.buyerCompany,
                  )}
                  totalCredit={periodCredit}
                  closingBalance={stats.closingBalance}
                  openingBalance={stats.openingBalance}
                  voucherCount={payments.length}
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                  emptyMessage={
                    filters.ledgerType && !selectedCompany
                      ? "Select a company to view the Tally voucher register."
                      : "No vouchers match your filters and date range."
                  }
                  sellerCompanies={sellerCompanies}
                  buyerCompanies={buyerCompanies}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden p-4 sm:p-6">
              <SaudaMISSection />
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default ListPaymentReceived;
