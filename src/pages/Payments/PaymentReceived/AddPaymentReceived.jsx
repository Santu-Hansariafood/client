import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Buttons from "../../../common/Buttons/Buttons";
import api from "../../../utils/apiClient/apiClient";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import {
  FaSave,
  FaArrowLeft,
  FaExchangeAlt,
  FaHistory,
  FaPrint,
  FaChartBar,
  FaRegCalendarAlt,
  FaCheckCircle,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

import TabButton from "./components/TabButton";
import StatDashboard from "./components/StatDashboard";
import AccountSelection from "./components/AccountSelection";
import AllocationLedger from "./components/AllocationLedger";
import PaymentHistory from "./components/PaymentHistory";
import AnalyticalSummary from "./components/AnalyticalSummary";

const AddPaymentReceived = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [opposingLedgers, setOpposingLedgers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedOpposingLedger, setSelectedOpposingLedger] = useState(null);
  const [fetchingLedgers, setFetchingLedgers] = useState(false);
  const [fetchingOpposingLedgers, setFetchingOpposingLedgers] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [entries, setEntries] = useState([]);
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesTotalPages, setEntriesTotalPages] = useState(1);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState([]);
  const [summaryType, setSummaryType] = useState("month");
  const [tableSearch, setTableSearch] = useState("");
  const [dateTotal, setDateTotal] = useState(0);
  const [ledgerBalance, setLedgerBalance] = useState({
    advanceBalance: 0,
    outstandingBalance: 0,
  });
  const [activeTab, setActiveTab] = useState("allocation"); // allocation, history, summary
  const [allocationSource, setAllocationSource] = useState("fresh"); // fresh, advance

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    ledgerType: "Buyer",
    ledgerId: "",
    companyId: "",
    opposingLedgerId: "",
    opposingCompanyId: "",
    amount: 0,
    paymentType: "Sauda-wise",
    paymentMode: "Bank",
    remarks: "",
    filterStartDate: "",
    filterEndDate: "",
  });

  const unallocatedBalance = useMemo(() => {
    if (allocationSource !== "fresh") return 0;
    const totalAllocated = entries.reduce((sum, entry) => {
      if (!entry.isSaved) {
        return sum + (parseFloat(entry.allocatedAmount) || 0);
      }
      return sum;
    }, 0);
    return Math.max(0, (formData.amount || 0) - totalAllocated);
  }, [formData.amount, entries, allocationSource]);

  const ledgerTypes = [
    { value: "Buyer", label: "Buyer" },
    { value: "Seller", label: "Seller" },
  ];

  const paymentModes = [
    { value: "Bank", label: "Bank Transfer" },
    { value: "By Cash", label: "Cash" },
    { value: "Cheque", label: "Cheque" },
    { value: "TDS", label: "TDS" },
    { value: "GST", label: "GST Adjustment" },
    { value: "Loan", label: "Loan" },
    { value: "Adjustment", label: "General Adjustment" },
    { value: "Claim", label: "Claim" },
    { value: "Discount", label: "Discount" },
  ];

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get("/companies", { params: { limit: 0 } });
        const data = response.data.data || response.data || [];
        setAllCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        setFetchingLedgers(true);
        const endpoint =
          formData.ledgerType === "Buyer" ? "/buyers" : "/sellers";
        const response = await api.get(endpoint, { params: { limit: 0 } });
        const data = response.data.data || response.data;
        setLedgers(
          data.map((item) => ({
            value: item._id,
            label:
              formData.ledgerType === "Buyer"
                ? `${item.name} ${item.mobile ? `(${item.mobile})` : ""} ${item.groupId?.groupName ? `- ${item.groupId.groupName}` : ""}`
                : `${item.sellerName} ${item.phoneNumbers?.[0]?.value ? `(${item.phoneNumbers[0].value})` : ""} ${item.city ? `- ${item.city}` : ""}`,
            companies: item.companyIds || item.companies || [],
          })),
        );
        setSelectedLedger(null);
        setFormData((prev) => ({
          ...prev,
          ledgerId: "",
          companyId: "",
          mappings: [],
        }));
      } catch (error) {
        toast.error("Error fetching ledgers");
      } finally {
        setFetchingLedgers(false);
      }
    };

    const fetchOpposingLedgers = async () => {
      try {
        setFetchingOpposingLedgers(true);
        const endpoint =
          formData.ledgerType === "Buyer" ? "/sellers" : "/buyers";
        const response = await api.get(endpoint, { params: { limit: 0 } });
        const data = response.data.data || response.data;
        setOpposingLedgers(
          data.map((item) => ({
            value: item._id,
            label:
              formData.ledgerType === "Buyer"
                ? `${item.sellerName} ${item.phoneNumbers?.[0]?.value ? `(${item.phoneNumbers[0].value})` : ""} ${item.city ? `- ${item.city}` : ""}`
                : `${item.name} ${item.mobile ? `(${item.mobile})` : ""} ${item.groupId?.groupName ? `- ${item.groupId.groupName}` : ""}`,
            companies: item.companyIds || item.companies || [],
          })),
        );
        setSelectedOpposingLedger(null);
        setFormData((prev) => ({
          ...prev,
          opposingLedgerId: "",
          opposingCompanyId: "",
        }));
      } catch (error) {
        console.error("Error fetching opposing ledgers:", error);
      } finally {
        setFetchingOpposingLedgers(false);
      }
    };

    fetchLedgers();
    fetchOpposingLedgers();
  }, [formData.ledgerType]);

  const fetchEntries = useCallback(
    async (page = 1) => {
      if (
        !formData.ledgerId ||
        !formData.companyId ||
        formData.paymentType !== "Sauda-wise"
      ) {
        setEntries([]);
        return;
      }

      try {
        setFetchingEntries(true);

        let companyName = "";
        if (formData.ledgerType === "Buyer") {
          const selectedCompany = allCompanies.find(
            (c) => c._id === formData.companyId,
          );
          companyName = selectedCompany?.companyName || "";
        } else {
          companyName = formData.companyId;
        }

        let opposingCompanyName = "";
        if (formData.ledgerType === "Seller") {
          const selectedOpposingCompany = allCompanies.find(
            (c) => c._id === formData.opposingCompanyId,
          );
          opposingCompanyName = selectedOpposingCompany?.companyName || "";
        } else {
          opposingCompanyName = formData.opposingCompanyId;
        }

        let params = {
          page: page,
          limit: 20,
          startDate: formData.filterStartDate,
          endDate: formData.filterEndDate,
          isUnloaded: true,
        };

        if (formData.companyId) {
          params.companyId = formData.companyId;
        }

        if (formData.ledgerType === "Seller") {
          params.supplier = formData.ledgerId;
          if (companyName) params.supplierCompany = companyName;

          if (formData.opposingLedgerId)
            params.buyerId = formData.opposingLedgerId;
          if (opposingCompanyName) params.buyerCompany = opposingCompanyName;
        } else {
          params.buyerId = formData.ledgerId;
          if (companyName) params.buyerCompany = companyName;

          if (formData.opposingLedgerId)
            params.supplier = formData.opposingLedgerId;
          if (opposingCompanyName) params.supplierCompany = opposingCompanyName;
        }

        const response = await api.get("/loading-entries", { params });
        const items = response.data.data || [];

        const sortedItems = [...items].sort((a, b) => {
          if (a.paymentStatus === "pending" && b.paymentStatus === "done")
            return -1;
          if (a.paymentStatus === "done" && b.paymentStatus === "pending")
            return 1;
          return new Date(b.loadingDate) - new Date(a.loadingDate);
        });

        setEntries(
          sortedItems.map((item, index) => ({
            ...item,
            uiKey: `${item._id}-${index}-${Date.now()}`,
            allocatedAmount:
              item.paymentStatus === "done" ? item.paidAmount : "",
            rowRemarks: "",
            isSaved: item.paymentStatus === "done",
          })),
        );
        setEntriesTotalPages(response.data.totalPages || 1);
        setEntriesPage(page);
      } catch (error) {
        toast.error("Error fetching entries");
      } finally {
        setFetchingEntries(false);
      }
    },
    [
      formData.ledgerId,
      formData.ledgerType,
      formData.paymentType,
      formData.filterStartDate,
      formData.filterEndDate,
      formData.companyId,
      formData.opposingLedgerId,
      formData.opposingCompanyId,
      allCompanies,
    ],
  );

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  const fetchHistory = useCallback(async () => {
    if (!formData.ledgerId) {
      setHistory([]);
      return;
    }

    try {
      setFetchingHistory(true);
      const params = {
        ledgerId: formData.ledgerId,
        startDate: formData.date,
        endDate: formData.date,
      };
      const response = await api.get("/payment-received", { params });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [formData.ledgerId, formData.date]);

  const fetchSummary = useCallback(async () => {
    if (!formData.ledgerId) return;
    try {
      const response = await api.get("/payment-received/summary", {
        params: { ledgerId: formData.ledgerId, type: summaryType },
      });
      setSummary(response.data || []);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [formData.ledgerId, summaryType]);

  const fetchLedgerBalance = useCallback(async () => {
    if (!formData.ledgerId) return;
    try {
      const response = await api.get(
        `/payment-received/balance/${formData.ledgerId}`,
      );
      setLedgerBalance(response.data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [formData.ledgerId]);

  useEffect(() => {
    fetchHistory();
    fetchSummary();
    fetchLedgerBalance();
  }, [fetchHistory, fetchSummary, fetchLedgerBalance]);

  const fetchDateTotal = useCallback(async () => {
    try {
      const selectedDate = formData.date;
      const params = {
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 1000,
      };

      if (formData.ledgerId) {
        params.ledgerId = formData.ledgerId;
      }

      const response = await api.get("/payment-received", { params });
      const payments = response.data.data || [];
      const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      setDateTotal(total);
    } catch (error) {
      console.error("Error fetching date total:", error);
    }
  }, [formData.date, formData.ledgerId]);

  useEffect(() => {
    fetchDateTotal();
  }, [fetchDateTotal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLedgerChange = (option) => {
    setSelectedLedger(option);
    setFormData((prev) => ({
      ...prev,
      ledgerId: option?.value || "",
      companyId: "",
    }));
  };

  const handleCompanyChange = (option) => {
    setFormData((prev) => ({ ...prev, companyId: option?.value || "" }));
  };

  const handleOpposingLedgerChange = (option) => {
    setSelectedOpposingLedger(option);
    setFormData((prev) => ({
      ...prev,
      opposingLedgerId: option?.value || "",
      opposingCompanyId: "",
    }));
  };

  const handleOpposingCompanyChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      opposingCompanyId: option?.value || "",
    }));
  };

  const handleAllocationChange = (uiKey, amount, netAmount, paidAmount) => {
    if (amount === "") {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.uiKey === uiKey ? { ...entry, allocatedAmount: "" } : entry,
        ),
      );
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    const dueAmount = netAmount - (paidAmount || 0);

    if (numAmount > dueAmount + 1) {
      toast.warning(
        `Allocation cannot exceed due amount (Rs. ${dueAmount.toFixed(2)})`,
      );
      return;
    }

    if (allocationSource === "fresh") {
      const currentEntry = entries.find((e) => e.uiKey === uiKey);
      const currentAllocatedForThisRow =
        parseFloat(currentEntry?.allocatedAmount) || 0;
      const otherAllocationsTotal =
        (formData.amount || 0) -
        unallocatedBalance -
        currentAllocatedForThisRow;

      if (numAmount + otherAllocationsTotal > (formData.amount || 0) + 1) {
        toast.error(
          `Total allocation cannot exceed Voucher Amount (Rs. ${formData.amount})`,
        );
        return;
      }
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.uiKey === uiKey ? { ...entry, allocatedAmount: amount } : entry,
      ),
    );
  };

  const handleRowRemarksChange = (uiKey, remarks) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.uiKey === uiKey ? { ...entry, rowRemarks: remarks } : entry,
      ),
    );
  };

  const handleAddRow = (entry, index) => {
    const newRow = {
      ...entry,
      uiKey: `${entry._id}-extra-${Date.now()}`,
      allocatedAmount: "",
      rowRemarks: "",
      isSaved: false,
    };
    const newEntries = [...entries];
    newEntries.splice(index + 1, 0, newRow);
    setEntries(newEntries);
  };

  const handleRemoveRow = (uiKey) => {
    setEntries((prev) => prev.filter((entry) => entry.uiKey !== uiKey));
  };

  const calculateTallyDetails = (entry) => {
    const weight =
      (entry.unloadingWeight || 0) > 0
        ? entry.unloadingWeight
        : entry.loadingWeight || 0;
    const rate = entry.actualRate || 0;
    const cdPercent = entry.cd || 0;
    const gstPercent = entry.gst || 0;

    const grossAmount = weight * rate;
    const cdAmount = grossAmount * (cdPercent / 100);
    const taxableAmount = grossAmount - cdAmount;
    const gstAmount = taxableAmount * (gstPercent / 100);
    const netAmount = taxableAmount + gstAmount;

    return {
      grossAmount,
      cdAmount,
      taxableAmount,
      gstAmount,
      netAmount,
      cdPercent,
      gstPercent,
      dueAmount: Math.max(0, netAmount - (entry.paidAmount || 0)),
    };
  };

  const handleSaveRow = async (entry) => {
    if (entry.allocatedAmount === "" && !entry.isSaved) {
      toast.error("Please enter an allocation amount");
      return;
    }

    const isAdmin = user?.role === "Admin";
    const isEditing = entry.isSaved && isAdmin;

    if (
      allocationSource === "advance" &&
      entry.allocatedAmount > ledgerBalance.advanceBalance
    ) {
      toast.error("Allocation exceeds available Advance Balance");
      return;
    }

    try {
      setLoading(true);
      const numAllocated = parseFloat(entry.allocatedAmount) || 0;

      if (isEditing) {
        await api.patch(`/payment-received/adjust-lorry/${entry._id}`, {
          paidAmount: numAllocated,
          paymentStatus:
            numAllocated >= calculateTallyDetails(entry).netAmount - 1
              ? "done"
              : "pending",
        });
        toast.success(`Payment adjusted for ${entry.lorryNumber}`);
      } else {
        const payload = {
          date: formData.date,
          ledgerType: formData.ledgerType,
          ledgerId: formData.ledgerId,
          companyId: formData.companyId,
          amount: allocationSource === "fresh" ? numAllocated : 0,
          paymentType:
            allocationSource === "fresh" ? "Sauda-wise" : "Adjustment",
          paymentMode:
            allocationSource === "fresh" ? formData.paymentMode : "Adjustment",
          mappings: [
            {
              saudaNo: entry.saudaNo,
              loadingEntryId: entry._id,
              allocatedAmount: numAllocated,
              remarks: entry.rowRemarks,
            },
          ],
          remarks: entry.rowRemarks,
        };

        await api.post("/payment-received", payload);
        toast.success(`Payment recorded for ${entry.lorryNumber}`);

        if (allocationSource === "fresh") {
          setFormData((prev) => ({
            ...prev,
            amount: Math.max(0, prev.amount - numAllocated),
          }));
        }
      }

      fetchEntries(entriesPage);
      fetchHistory();
      fetchDateTotal();
      fetchSummary();
      fetchLedgerBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving payment");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAdvance = async () => {
    if (formData.amount <= 0) {
      toast.error("Please enter an advance amount");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        companyId: formData.companyId,
        paymentType: "Advance",
        mappings: [],
      };

      await api.post("/payment-received", payload);
      toast.success("Advance payment recorded");
      setFormData((prev) => ({ ...prev, amount: 0, remarks: "" }));
      fetchHistory();
      fetchDateTotal();
      fetchLedgerBalance();
    } catch (error) {
      toast.error("Error recording advance");
    } finally {
      setLoading(false);
    }
  };

  const printVoucher = (payment) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Sector 4, Plot 12, IMT Manesar, Gurugram, Haryana",
      pageWidth / 2,
      20,
      { align: "center" },
    );

    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PAYMENT RECEIVED VOUCHER", margin, 32);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Date: ${new Date(payment.date).toLocaleDateString("en-GB")}`,
      pageWidth - margin,
      32,
      { align: "right" },
    );

    doc.line(margin, 35, pageWidth - margin, 35);

    doc.setFontSize(10);
    doc.text(
      `Receipt No: ${payment._id.substring(payment._id.length - 8).toUpperCase()}`,
      margin,
      42,
    );
    doc.text(
      `Account: ${(selectedLedger?.label || "N/A").toUpperCase()}`,
      margin,
      47,
    );
    doc.text(
      `Payment Mode: ${payment.paymentMode.toUpperCase()}`,
      pageWidth - margin,
      42,
      { align: "right" },
    );

    const tableData = (payment.mappings || []).map((m, i) => [
      i + 1,
      (m.saudaNo || "N/A").toUpperCase(),
      (m.loadingEntryId?.billNumber || "-").toUpperCase(),
      (m.loadingEntryId?.buyerCompany || "-").toUpperCase(),
      (m.loadingEntryId?.supplierCompany || "-").toUpperCase(),
      `Rs. ${Number(m.allocatedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["NO", "SAUDA NO", "BILL NO", "BUYER", "SELLER", "AMOUNT"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: "middle",
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 20 },
        5: { halign: "right", fontStyle: "bold", cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = doc.lastAutoTable?.finalY || 70;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL AMOUNT: Rs. ${Number(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      pageWidth - margin,
      finalY + 10,
      { align: "right" },
    );

    doc.setFont("helvetica", "normal");
    doc.text(
      `Amount in words: ${Number(payment.amount || 0).toLocaleString("en-IN")} Rupees Only`,
      margin,
      finalY + 10,
    );
    doc.text(
      `Remarks: ${(payment.remarks || "-").toUpperCase()}`,
      margin,
      finalY + 18,
    );

    doc.line(margin, finalY + 50, 65, finalY + 50);
    doc.text("Receiver Signature", margin, finalY + 55);

    doc.line(pageWidth - 65, finalY + 50, pageWidth - margin, finalY + 50);
    doc.text("Authorised Signatory", pageWidth - margin, finalY + 55, {
      align: "right",
    });

    doc.save(`Voucher_${payment._id.substring(payment._id.length - 8)}.pdf`);
  };

  const filteredEntries = useMemo(() => {
    if (!tableSearch) return entries;
    const search = tableSearch.toLowerCase();
    return entries.filter(
      (entry) =>
        (entry.saudaNo || "").toLowerCase().includes(search) ||
        (entry.lorryNumber || "").toLowerCase().includes(search) ||
        (entry.buyerCompany || "").toLowerCase().includes(search) ||
        (entry.supplierCompany || "").toLowerCase().includes(search) ||
        (entry.commodity || "").toLowerCase().includes(search),
    );
  }, [entries, tableSearch]);

  const entryStats = useMemo(() => {
    let totalDue = 0;
    let pendingCount = 0;

    entries.forEach((entry) => {
      const details = calculateTallyDetails(entry);
      totalDue += details.dueAmount;
      if (entry.paymentStatus === "pending") {
        pendingCount++;
      }
    });

    return { totalDue, pendingCount };
  }, [entries]);

  const historyColumns = [
    {
      header: "DATE",
      accessor: (row) => (
        <span className="text-[10px] font-black text-slate-900">
          {new Date(row.date).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      header: "TIME",
      accessor: (row) => (
        <span className="text-[10px] font-black text-slate-400">
          {new Date(row.createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "MODE",
      accessor: (row) => (
        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "PARTICULARS",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          {(row.mappings || []).length > 0 ? (
            row.mappings.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-600 uppercase">
                  {m.saudaNo}
                </span>
                {m.loadingEntryId?.billNumber && (
                  <span className="text-[8px] font-bold bg-amber-50 text-amber-600 px-1 rounded border border-amber-100 uppercase">
                    Bill: {m.loadingEntryId.billNumber}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-400 font-bold leading-none">
                    B: {m.loadingEntryId?.buyerCompany || "N/A"}
                  </span>
                  <span className="text-[7px] text-slate-400 font-bold leading-none">
                    S: {m.loadingEntryId?.supplierCompany || "N/A"}
                  </span>
                </div>
                <span className="text-[9px] font-black text-slate-400 italic ml-auto">
                  Rs. {m.allocatedAmount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic">
              Advance Payment
            </span>
          )}
        </div>
      ),
    },
    {
      header: "TOTAL AMOUNT",
      accessor: (row) => (
        <span className="font-black text-slate-900 text-sm italic">
          Rs. {row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "REMARKS",
      accessor: (row) => (
        <span className="text-[10px] text-slate-400 font-medium italic">
          {row.remarks || "-"}
        </span>
      ),
    },
    {
      header: "ACTION",
      accessor: (row) => (
        <Buttons
          label=""
          icon={<FaPrint size={12} />}
          variant="ghost"
          size="sm"
          onClick={() => printVoucher(row)}
          className="!p-2 hover:bg-slate-100"
        />
      ),
    },
  ];

  const columns = [
    {
      header: "DATE & SAUDA",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-slate-900 text-xs">
            {new Date(row.loadingDate).toLocaleDateString("en-GB")}
          </span>
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
            {row.saudaNo}
          </span>
        </div>
      ),
    },
    {
      header: "LORRY & ITEM",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-slate-900 uppercase tracking-tighter text-xs">
            {row.lorryNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
              {row.commodity}
            </span>
            {row.billNumber && (
              <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                Bill: {row.billNumber}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100 uppercase">
              Unloading: {row.unloadingWeight || 0} MT
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "PARTIES",
      accessor: (row) => (
        <div className="flex flex-col gap-1 max-w-[150px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-100 text-[8px] flex items-center justify-center text-blue-600 font-black">
              B
            </span>
            <span className="text-[9px] font-black uppercase text-slate-500 truncate">
              {row.buyerCompany || "N/A"}
            </span>
          </div>
          {formData.ledgerType === "Buyer" && (
            <div className="flex justify-center -my-1 ml-3">
              <div className="h-2 w-0.5 bg-slate-200 relative">
                <div className="absolute -bottom-1 -left-[3px] border-t-4 border-t-slate-200 border-x-[3px] border-x-transparent"></div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-100 text-[8px] flex items-center justify-center text-amber-600 font-black">
              S
            </span>
            <span className="text-[9px] font-black uppercase text-slate-500 truncate">
              {row.supplierCompany || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "BREAKDOWN",
      accessor: (row) => {
        const details = calculateTallyDetails(row);
        return (
          <div className="flex flex-col gap-1 text-[9px] font-black min-w-[140px] uppercase">
            <div className="flex justify-between text-slate-400">
              <span>Net Amt:</span>
              <span>Rs. {details.netAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Paid:</span>
              <span>Rs. {(row.paidAmount || 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 text-rose-600 text-[10px]">
              <span>Due:</span>
              <span className="bg-rose-50 px-1.5 rounded">
                Rs. {details.dueAmount.toFixed(0)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "ALLOCATION",
      accessor: (row) => {
        const details = calculateTallyDetails(row);
        const isLocked = row.isSaved && user?.role !== "Admin";
        const isExtraRow = row.uiKey.includes("-extra-");

        return (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="relative group">
              <input
                type="number"
                value={row.allocatedAmount}
                onChange={(e) =>
                  handleAllocationChange(
                    row.uiKey,
                    e.target.value,
                    details.netAmount,
                    row.paidAmount,
                  )
                }
                onWheel={(e) => e.target.blur()}
                disabled={isLocked}
                className={`w-full px-3 py-2 rounded-xl border-2 transition-all ${
                  isLocked
                    ? "bg-slate-50 text-slate-400 border-slate-100"
                    : "border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                } font-black text-slate-900 text-xs`}
                placeholder="0.00"
              />
              {!isLocked && (
                <button
                  onClick={() =>
                    handleAllocationChange(
                      row.uiKey,
                      details.dueAmount.toString(),
                      details.netAmount,
                      row.paidAmount,
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  Full
                </button>
              )}
            </div>
            <div className="flex gap-1">
              <textarea
                value={row.rowRemarks}
                onChange={(e) =>
                  handleRowRemarksChange(row.uiKey, e.target.value)
                }
                disabled={isLocked}
                rows={1}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-[10px] font-bold ${
                  isLocked
                    ? "bg-slate-50 text-slate-400 border-slate-100"
                    : "border-slate-200 bg-white focus:border-slate-900 focus:bg-yellow-50"
                } outline-none transition-all resize-none uppercase`}
                placeholder="Narration..."
              />
              {isExtraRow && !row.isSaved && (
                <button
                  onClick={() => handleRemoveRow(row.uiKey)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="Remove row"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "ACTION",
      accessor: (row, index) => {
        const isLocked = row.isSaved && user?.role !== "Admin";
        const isAdmin = user?.role === "Admin";

        return (
          <div className="flex flex-col gap-1 w-full min-w-[100px]">
            <div className="flex gap-1">
              <Buttons
                label={
                  isLocked && !isAdmin
                    ? "Locked"
                    : isAdmin && row.isSaved
                      ? "Adjust"
                      : "Save"
                }
                onClick={() => handleSaveRow(row)}
                disabled={(isLocked && !isAdmin) || loading}
                variant={
                  isLocked && !isAdmin
                    ? "ghost"
                    : isAdmin && row.isSaved
                      ? "outline"
                      : "primary"
                }
                size="sm"
                icon={
                  isLocked && !isAdmin ? (
                    <FaCheckCircle size={12} />
                  ) : isAdmin && row.isSaved ? (
                    <FaExchangeAlt size={12} />
                  ) : (
                    <FaSave size={12} />
                  )
                }
                className={`flex-1 !text-[10px] !py-2.5 ${
                  isAdmin && row.isSaved
                    ? "!border-amber-500 !text-amber-600 hover:!bg-amber-50"
                    : ""
                }`}
              />
              {!isLocked && (
                <button
                  onClick={() => handleAddRow(row, index)}
                  className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Add another allocation for this lorry"
                >
                  <FaPlus size={12} />
                </button>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <AdminPageShell
      title="Payment Received"
      subtitle="Record and allocate payments in Tally-style ledger format"
      icon={FaHistory}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Buttons
              label="Back"
              icon={<FaArrowLeft size={12} />}
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            />
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <TabButton
                active={activeTab === "allocation"}
                label="Allocation"
                icon={FaExchangeAlt}
                onClick={() => setActiveTab("allocation")}
              />
              <TabButton
                active={activeTab === "history"}
                label="History"
                icon={FaHistory}
                onClick={() => setActiveTab("history")}
              />
              <TabButton
                active={activeTab === "summary"}
                label="Summary"
                icon={FaChartBar}
                onClick={() => setActiveTab("summary")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
            <FaRegCalendarAlt className="text-emerald-500" />
            <span className="text-sm font-bold tracking-tight">
              {new Date(formData.date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <StatDashboard
          selectedLedger={selectedLedger}
          dateTotal={dateTotal}
          formData={formData}
          ledgerBalance={ledgerBalance}
          entryStats={entryStats}
        />

        <AccountSelection
          allocationSource={allocationSource}
          setAllocationSource={setAllocationSource}
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          ledgerTypes={ledgerTypes}
          ledgers={ledgers}
          opposingLedgers={opposingLedgers}
          selectedLedger={selectedLedger}
          selectedOpposingLedger={selectedOpposingLedger}
          handleLedgerChange={handleLedgerChange}
          handleOpposingLedgerChange={handleOpposingLedgerChange}
          fetchingLedgers={fetchingLedgers}
          fetchingOpposingLedgers={fetchingOpposingLedgers}
          allCompanies={allCompanies}
          handleCompanyChange={handleCompanyChange}
          handleOpposingCompanyChange={handleOpposingCompanyChange}
          paymentModes={paymentModes}
          loading={loading}
          handleRecordAdvance={handleRecordAdvance}
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === "allocation" && (
            <AllocationLedger
              allocationSource={allocationSource}
              formData={formData}
              unallocatedBalance={unallocatedBalance}
              setFormData={setFormData}
              tableSearch={tableSearch}
              setTableSearch={setTableSearch}
              entries={entries}
              fetchingEntries={fetchingEntries}
              filteredEntries={filteredEntries}
              columns={columns}
              entriesPage={entriesPage}
              fetchEntries={fetchEntries}
              entriesTotalPages={entriesTotalPages}
              entryStats={entryStats}
              dateTotal={dateTotal}
              ledgerBalance={ledgerBalance}
            />
          )}

          {activeTab === "history" && (
            <PaymentHistory
              fetchingHistory={fetchingHistory}
              formData={formData}
              history={history}
              historyColumns={historyColumns}
            />
          )}

          {activeTab === "summary" && (
            <AnalyticalSummary
              summaryType={summaryType}
              setSummaryType={setSummaryType}
              summary={summary}
            />
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AddPaymentReceived;
