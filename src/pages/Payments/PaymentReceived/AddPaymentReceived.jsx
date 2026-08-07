import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Buttons from "../../../common/Buttons/Buttons";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import { useAuth } from "../../../context/AuthContext/AuthContext";
import {
  FaSave,
  FaArrowLeft,
  FaExchangeAlt,
  FaHistory,
  FaChartBar,
  FaRegCalendarAlt,
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaMoneyBillWave
} from "react-icons/fa";

import TabButton from "./components/TabButton";
import StatDashboard from "./components/StatDashboard";
import AccountSelection from "./components/AccountSelection";
import PaymentRecordingPanel from "./components/PaymentRecordingPanel";
import CreditBalancePanel from "./components/CreditBalancePanel";
import AllocationLedger from "./components/AllocationLedger";
import PaymentHistory from "./components/PaymentHistory";
import AnalyticalSummary from "./components/AnalyticalSummary";
import SimplePaymentList from "./components/SimplePaymentList";
import {
  resolveCompanyPair,
  buildTallyVoucherRows,
  hasFullCompanyMapping,
  hasAllocationTableScope,
  filterEntriesForCompanyScope,
  calculateEntryDueAmount,
  matchCompanyName,
  computeBuyerSellerLedgerSummary,
} from "./utils/paymentLedgerUtils";

const ENTRIES_PAGE_SIZE = 20;

const AddPaymentReceived = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ledgers, setLedgers] = useState([]);
  const [opposingLedgers, setOpposingLedgers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [fetchingLedgers, setFetchingLedgers] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [entries, setEntries] = useState([]);
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [summaryType, setSummaryType] = useState("month");
  const [tableSearch, setTableSearch] = useState("");
  const [buyerSellerOptions, setBuyerSellerOptions] = useState([]);
  const [loadingSellerOptions, setLoadingSellerOptions] = useState(false);
  const [dateTotal, setDateTotal] = useState(0);
  const [dayTotal, setDayTotal] = useState(0);
  const [ledgerBalance, setLedgerBalance] = useState({
    advanceBalance: 0,
    totalAdvanceBalance: 0,
    creditByPair: [],
    advanceTotalDr: 0,
    totalAdvanceTotalDr: 0,
    creditToSeller: 0,
    totalCreditToSeller: 0,
    outstandingBalance: 0,
  });
  const [activeTab, setActiveTab] = useState("payment_list");
  const [allocationSource, setAllocationSource] = useState("fresh");

  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [fetchingEditingPayment, setFetchingEditingPayment] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    allocationDate: new Date().toISOString().split("T")[0],
    ledgerType: "Buyer",
    ledgerId: "",
    companyId: "",
    opposingCompanyId: "",
    amount: 0,
    claim: 0,
    tds: 0,
    paymentType: "Sauda-wise",
    paymentMode: "Bank",
    remarks: "",
    filterStartDate: "",
    filterEndDate: "",
  });

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setEditingPaymentId(id);
      const fetchPaymentForEdit = async () => {
        try {
          setFetchingEditingPayment(true);
          const listRes = await api.get("/payment-received", { params: { limit: 0 } });
          const match = (listRes.data.data || []).find((p) => p._id === id);
          if (match) {
            setEditingPayment(match);
          } else {
            toast.error("Payment not found for editing");
          }
        } catch (err) {
          console.error("Error loading payment for edit:", err);
          toast.error("Could not load payment for editing");
        } finally {
          setFetchingEditingPayment(false);
        }
      };
      fetchPaymentForEdit();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!editingPayment) return;

    const p = editingPayment;
    setFormData({
      date: p.date ? new Date(p.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      allocationDate: p.date ? new Date(p.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      ledgerType: p.ledgerType || "Buyer",
      ledgerId: p.ledgerId?._id || p.ledgerId || "",
      companyId: p.companyId || "",
      opposingCompanyId: p.supplierCompany || p.buyerCompany || "",
      amount: Number(p.amount) || 0,
      claim: Number(p.claim) || 0,
      tds: Number(p.tds) || 0,
      paymentType: p.paymentType || "Sauda-wise",
      paymentMode: p.paymentMode || "Bank",
      remarks: p.remarks || "",
      filterStartDate: "",
      filterEndDate: "",
    });

    if (p.paymentType === "Advance") {
      setAllocationSource("fresh");
    } else if (p.paymentType === "Adjustment") {
      setAllocationSource("advance");
    } else {
      setAllocationSource("fresh");
    }

    setActiveTab("allocation");
  }, [editingPayment]);

  const getCompanyIdFromRef = (companyRef) => {
    if (!companyRef) return "";
    if (typeof companyRef === "string") return companyRef;
    return companyRef._id || companyRef.value || companyRef.id || "";
  };

  const getCompanyNameFromRef = (companyRef) => {
    if (!companyRef) return "";
    if (typeof companyRef === "string") return companyRef;
    return companyRef.companyName || companyRef.label || "";
  };

  const calculateTallyDetails = (entry) => {
    if (entry?.isRejected) {
      return {
        grossAmount: 0,
        cdAmount: 0,
        cdPercent: 0,
        bankCharges: 0,
        amountAfterCd: 0,
        amountAfterBankCharges: 0,
        taxableAmount: 0,
        gstAmount: 0,
        gstPercent: 0,
        netAmount: 0,
        dueAmount: 0,
      };
    }
    const weight =
      (entry.unloadingWeight || 0) > 0
        ? entry.unloadingWeight
        : entry.loadingWeight || 0;
    const rate = entry.actualRate || 0;
    const cdPercent = entry.cd || 0;
    const gstPercent = entry.gst || 0;
    const bankCharges = Number(entry.bankCharges) || 0; // New field for bank charges

    const grossAmount = weight * rate;
    const cdAmount = grossAmount * (cdPercent / 100);
    const amountAfterCd = grossAmount - cdAmount;
    const amountAfterBankCharges = amountAfterCd - bankCharges;
    const taxableAmount = amountAfterBankCharges; // Taxable after CD and bank charges
    const gstAmount = taxableAmount * (gstPercent / 100);
    const netAmount = taxableAmount + gstAmount;

    return {
      grossAmount,
      cdAmount,
      cdPercent,
      bankCharges,
      amountAfterCd,
      amountAfterBankCharges,
      taxableAmount,
      gstAmount,
      gstPercent,
      netAmount,
      dueAmount: Math.max(0, netAmount - (entry.paidAmount || 0)),
    };
  };

  const resolveLedgerForCompany = useCallback(
    (companyId, ledgerType, buyerLedgerList, sellerLedgerList) => {
      if (!companyId) return null;

      const findBuyer = () =>
        buyerLedgerList.find((ledger) =>
          (ledger.companies || []).some(
            (c) => getCompanyIdFromRef(c) === companyId,
          ),
        ) || null;

      const findSeller = () =>
        sellerLedgerList.find((ledger) =>
          (ledger.companies || []).some(
            (c) => getCompanyNameFromRef(c) === companyId,
          ),
        ) || null;

      if (ledgerType === "Buyer") return findBuyer();
      if (ledgerType === "Seller") return findSeller();
      return findBuyer() || findSeller();
    },
    [],
  );

  const collectUniqueCompanyNames = (ledgerList) => {
    const names = new Set();
    ledgerList.forEach((ledger) => {
      (ledger.companies || []).forEach((c) => {
        const name = getCompanyNameFromRef(c);
        if (name) names.add(name);
      });
    });
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  };

  const primaryCompanyOptions = useMemo(() => {
    if (formData.ledgerType === "Seller") {
      return collectUniqueCompanyNames(opposingLedgers);
    }
    return allCompanies.map((c) => ({
      value: c._id,
      label: c.companyName,
    }));
  }, [formData.ledgerType, allCompanies, opposingLedgers]);

  const selectedCompanyOption = useMemo(() => {
    if (!formData.companyId) return null;
    if (formData.ledgerType !== "Seller") {
      const company = allCompanies.find((c) => c._id === formData.companyId);
      if (company) {
        return { value: company._id, label: company.companyName };
      }
    }
    return { value: formData.companyId, label: formData.companyId };
  }, [formData.companyId, formData.ledgerType, allCompanies]);

  const selectedOpposingCompanyOption = useMemo(() => {
    if (!formData.opposingCompanyId) return null;
    const company = allCompanies.find(
      (c) => c._id === formData.opposingCompanyId,
    );
    if (company) {
      return { value: company._id, label: company.companyName };
    }
    return {
      value: formData.opposingCompanyId,
      label: formData.opposingCompanyId,
    };
  }, [formData.opposingCompanyId, allCompanies]);

  const paymentModes = [
    { value: "Bank", label: "Bank Transfer" },
    { value: "By Cash", label: "Cash" },
    { value: "Cheque", label: "Cheque" },
    { value: "TDS", label: "TDS" },
    { value: "Claim", label: "Claim" },
    { value: "GST", label: "GST Adjustment" },
    { value: "Adjustment", label: "General Adjustment" },
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
    const mapBuyers = (data) =>
      data.map((item) => ({
        value: item._id,
        label: `${item.name} ${item.mobile ? `(${item.mobile})` : ""} ${item.groupId?.groupName ? `- ${item.groupId.groupName}` : ""}`,
        companies: item.companyIds || item.companies || [],
        ledgerType: "Buyer",
      }));

    const mapSellers = (data) =>
      data.map((item) => ({
        value: item._id,
        label: `${item.sellerName} ${item.phoneNumbers?.[0]?.value ? `(${item.phoneNumbers[0].value})` : ""} ${item.city ? `- ${item.city}` : ""}`,
        companies: item.companyIds || item.companies || [],
        ledgerType: "Seller",
      }));

    const loadLedgers = async () => {
      try {
        setFetchingLedgers(true);
        const [buyersRes, sellersRes] = await Promise.all([
          api.get("/buyers", { params: { limit: 0 } }),
          api.get("/sellers", { params: { limit: 0 } }),
        ]);
        const buyers = buyersRes.data.data || buyersRes.data || [];
        const sellers = sellersRes.data.data || sellersRes.data || [];
        setLedgers(mapBuyers(buyers));
        setOpposingLedgers(mapSellers(sellers));
      } catch (error) {
        toast.error("Error fetching ledgers");
      } finally {
        setFetchingLedgers(false);
      }
    };

    loadLedgers();
  }, []);

  const companyPair = useMemo(
    () =>
      resolveCompanyPair(
        formData,
        selectedCompanyOption,
        selectedOpposingCompanyOption,
        allCompanies,
      ),
    [
      formData,
      selectedCompanyOption,
      selectedOpposingCompanyOption,
      allCompanies,
    ],
  );

  const fullCompanyMapping = useMemo(
    () => hasFullCompanyMapping(companyPair),
    [companyPair],
  );

  const hasCompanyTableScope = useMemo(
    () => hasAllocationTableScope(formData.ledgerType, companyPair),
    [formData.ledgerType, companyPair],
  );

  const hasBuyerCompany = Boolean(companyPair.buyerCompany);
  const buyerOnlyMapping =
    hasBuyerCompany && !companyPair.supplierCompany;

  const pairCreditFromList = useMemo(() => {
    if (!fullCompanyMapping || !ledgerBalance.creditByPair?.length) return 0;
    const row = ledgerBalance.creditByPair.find(
      (p) =>
        matchCompanyName(p.buyerCompany, companyPair.buyerCompany) &&
        matchCompanyName(p.supplierCompany, companyPair.supplierCompany),
    );
    return Number(row?.amount) || 0;
  }, [
    fullCompanyMapping,
    ledgerBalance.creditByPair,
    companyPair.buyerCompany,
    companyPair.supplierCompany,
  ]);

  const availableAllocationPool = useMemo(() => {
    if (allocationSource === "advance") {
      if (fullCompanyMapping) {
        return (
          Number(ledgerBalance.advanceBalance) ||
          pairCreditFromList ||
          0
        );
      }
      return Number(ledgerBalance.totalAdvanceBalance) || 0;
    }
    return Number(formData.amount) || 0;
  }, [
    allocationSource,
    formData.amount,
    fullCompanyMapping,
    ledgerBalance.advanceBalance,
    ledgerBalance.totalAdvanceBalance,
    pairCreditFromList,
  ]);

  const creditPendingInForm = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        if (!entry.isSaved) {
          return sum + (parseFloat(entry.allocatedAmount) || 0);
        }
        return sum;
      }, 0),
    [entries],
  );

  const creditTableTotal = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => sum + (parseFloat(entry.allocatedAmount) || 0),
        0,
      ),
    [entries],
  );

  const unallocatedBalance = useMemo(
    () => Math.max(0, availableAllocationPool - creditPendingInForm),
    [availableAllocationPool, creditPendingInForm],
  );

  const entryStats = useMemo(() => {
    let totalDue = 0;
    let pendingCount = 0;

    entries.forEach((entry) => {
      const details = calculateTallyDetails(entry);
      if (details.dueAmount <= 0.01) return;
      // User request: Due Amount (Dr.) total = Lorry Bill (Dr.)
      // So we sum the netAmount (total bill) instead of the remaining dueAmount
      totalDue += details.netAmount;
      if (entry.paymentStatus !== "done") {
        pendingCount++;
      }
    });

    return { totalDue, pendingCount };
  }, [entries]);

  const ledgerTopSummary = useMemo(
    () =>
      computeBuyerSellerLedgerSummary({
        allocationSource,
        formAmount: formData.amount,
        ledgerBalance,
        fullCompanyMapping,
        creditPendingInForm,
        creditTableTotal,
        totalDueFromTable: entryStats.totalDue,
      }),
    [
      allocationSource,
      formData.amount,
      ledgerBalance,
      fullCompanyMapping,
      creditPendingInForm,
      creditTableTotal,
      entryStats.totalDue,
    ],
  );

  const liveUnadjustedAmount = useMemo(() => {
    const amt = Number(formData.amount) || 0;
    const cl = Number(formData.claim) || 0;
    const td = Number(formData.tds) || 0;
    const totalPaymentValue = amt + cl + td;
    const totalMapped = entries.reduce(
      (s, e) => s + (parseFloat(e.allocatedAmount) || 0),
      0,
    );
    const pType = formData.paymentType || (editingPayment?.paymentType);
    if (pType === "Adjustment") return 0;
    return Math.max(0, totalPaymentValue - totalMapped);
  }, [formData.amount, formData.claim, formData.tds, formData.paymentType, entries, editingPayment]);

  const opposingCompanyOptions = useMemo(() => {
    const sellerNames = collectUniqueCompanyNames(opposingLedgers);
    const buyerOptions = allCompanies.map((c) => ({
      value: c._id,
      label: c.companyName,
    }));

    if (
      companyPair.buyerCompany &&
      formData.ledgerType !== "Seller" &&
      buyerSellerOptions.length > 0
    ) {
      return buyerSellerOptions;
    }

    if (formData.ledgerType === "Seller") {
      return buyerOptions;
    }
    if (formData.ledgerType === "Buyer") {
      return sellerNames;
    }
    const seen = new Set();
    return [...sellerNames, ...buyerOptions].filter((opt) => {
      if (seen.has(opt.label)) return false;
      seen.add(opt.label);
      return true;
    });
  }, [
    formData.ledgerType,
    opposingLedgers,
    allCompanies,
    companyPair.buyerCompany,
    buyerSellerOptions,
  ]);

  useEffect(() => {
    const buyerName = companyPair.buyerCompany;
    if (!buyerName || formData.ledgerType === "Seller") {
      setBuyerSellerOptions([]);
      return;
    }

    const loadSellersForBuyer = async () => {
      try {
        setLoadingSellerOptions(true);
        const response = await api.get("/loading-entries", {
          params: {
            buyerCompany: buyerName,
            paymentStatus: "pending",
            limit: 500,
          },
        });
        const names = new Set();
        (response.data.data || []).forEach((entry) => {
          if (entry.supplierCompany) names.add(entry.supplierCompany.trim());
        });
        setBuyerSellerOptions(
          Array.from(names)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ value: name, label: name })),
        );
      } catch (error) {
        console.error("Error loading sellers for buyer:", error);
        setBuyerSellerOptions([]);
      } finally {
        setLoadingSellerOptions(false);
      }
    };

    loadSellersForBuyer();
  }, [companyPair.buyerCompany, formData.ledgerType]);

  const fetchEntries = useCallback(
    async (page = 1) => {
      if (formData.paymentType !== "Sauda-wise") {
        setEntries([]);
        setEntriesTotal(0);
        return;
      }

      if (!hasCompanyTableScope) {
        setEntries([]);
        setEntriesTotal(0);
        return;
      }

      try {
        setFetchingEntries(true);

        const useWideFetch =
          fullCompanyMapping || Boolean(companyPair.buyerCompany);

        const params = {
          page: useWideFetch ? 1 : page,
          limit: useWideFetch ? 500 : ENTRIES_PAGE_SIZE,
        };

        if (tableSearch.trim()) {
          params.search = tableSearch.trim();
        }

        if (formData.filterStartDate || formData.filterEndDate) {
          params.startDate = formData.filterStartDate;
          params.endDate = formData.filterEndDate;
        }

        if (companyPair.buyerCompany) {
          params.buyerCompany = companyPair.buyerCompany;
        }
        if (companyPair.supplierCompany) {
          params.supplierCompany = companyPair.supplierCompany;
        }
        if (formData.companyId && formData.ledgerType !== "Seller") {
          params.companyId = formData.companyId;
        }

        if (formData.ledgerType === "Seller" && formData.ledgerId) {
          params.supplier = formData.ledgerId;
        }

        const response = await api.get("/loading-entries", { params });
        let items = response.data.data || [];

        items = filterEntriesForCompanyScope(
          items,
          companyPair,
          { excludeFullyPaid: true },
          calculateEntryDueAmount,
        );

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
            debitNote: "Due against lorry",
            creditNote: "Allocation posted",
            rowRemarks: "",
            isSaved: item.paymentStatus === "done",
            bankCharges: Number(item.bankCharges) || 0, // Initialize bank charges
          })),
        );
        setEntriesTotal(
          useWideFetch ? sortedItems.length : (response.data.total ?? sortedItems.length),
        );
        setEntriesPage(useWideFetch ? 1 : page);
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
      formData.opposingCompanyId,
      companyPair.buyerCompany,
      companyPair.supplierCompany,
      fullCompanyMapping,
      hasCompanyTableScope,
      tableSearch,
    ],
  );

  useEffect(() => {
    fetchEntries(1);
  }, [fetchEntries]);

  const buildCompanyPayload = useCallback(
    (entry = null) => ({
      buyerCompany:
        companyPair.buyerCompany ||
        entry?.buyerCompany ||
        entry?.consignee ||
        "",
      supplierCompany:
        companyPair.supplierCompany || entry?.supplierCompany || "",
    }),
    [companyPair],
  );

  const resolveCompanyIdForSave = useCallback(
    (entry = null) => {
      if (formData.companyId) return formData.companyId;
      const name =
        companyPair.buyerCompany ||
        entry?.buyerCompany ||
        entry?.consignee ||
        "";
      if (!name) return "";
      const co = allCompanies.find(
        (c) =>
          String(c.companyName || "").trim().toLowerCase() ===
          String(name).trim().toLowerCase(),
      );
      return co?._id || "";
    },
    [formData.companyId, companyPair.buyerCompany, allCompanies],
  );

  const resolveLedgerIdForSave = useCallback(() => {
    if (formData.ledgerId) return formData.ledgerId;

    const companyId = formData.companyId;
    if (companyId) {
      const ledger = resolveLedgerForCompany(
        companyId,
        formData.ledgerType,
        ledgers,
        opposingLedgers,
      );
      if (ledger?.value) return ledger.value;
    }

    const buyerName = companyPair.buyerCompany || selectedCompanyOption?.label;
    if (buyerName && formData.ledgerType === "Buyer") {
      const byName = ledgers.find((ledger) =>
        (ledger.companies || []).some(
          (c) =>
            String(getCompanyNameFromRef(c)).trim().toLowerCase() ===
            String(buyerName).trim().toLowerCase(),
        ),
      );
      if (byName?.value) return byName.value;
    }

    return "";
  }, [
    formData.ledgerId,
    formData.companyId,
    formData.ledgerType,
    companyPair.buyerCompany,
    selectedCompanyOption?.label,
    ledgers,
    opposingLedgers,
    resolveLedgerForCompany,
  ]);

  useEffect(() => {
    if (!formData.companyId || formData.ledgerId || ledgers.length === 0) {
      return;
    }
    const resolvedId = resolveLedgerIdForSave();
    if (resolvedId) {
      const ledger = ledgers.find((l) => l.value === resolvedId);
      if (ledger) setSelectedLedger(ledger);
      setFormData((prev) =>
        prev.ledgerId ? prev : { ...prev, ledgerId: resolvedId },
      );
    }
  }, [
    formData.companyId,
    formData.ledgerId,
    ledgers,
    resolveLedgerIdForSave,
  ]);

  const fetchHistory = useCallback(async () => {
    if (!formData.date) {
      setHistory([]);
      setHistoryEntries([]);
      return;
    }

    try {
      setFetchingHistory(true);
      const params = {
        limit: 1000,
      };

      const entryParams = {
        limit: 1000,
      };

      if (companyPair.buyerCompany || companyPair.supplierCompany) {
        // When companies are selected, show all their payments (not just today)
        if (companyPair.buyerCompany) {
          params.buyerCompany = companyPair.buyerCompany;
          entryParams.buyerCompany = companyPair.buyerCompany;
        }
        if (companyPair.supplierCompany) {
          params.supplierCompany = companyPair.supplierCompany;
          entryParams.supplierCompany = companyPair.supplierCompany;
        }
      } else {
        // No company selected, show all payments for the selected date
        params.startDate = formData.date;
        params.endDate = formData.date;
        if (formData.ledgerType) params.ledgerType = formData.ledgerType;
        if (formData.ledgerId) params.ledgerId = formData.ledgerId;

        entryParams.startDate = formData.date;
        entryParams.endDate = formData.date;
      }

      const [paymentsRes, entriesRes] = await Promise.all([
        api.get("/payment-received", { params }),
        api.get("/loading-entries", { params: entryParams }),
      ]);

      setHistory(paymentsRes.data.data || []);
      setHistoryEntries(entriesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [
    formData.date,
    formData.ledgerId,
    formData.ledgerType,
    companyPair.buyerCompany,
    companyPair.supplierCompany,
  ]);

  const handleSelectCreditPair = useCallback(
    (pair) => {
      if (!pair?.buyerCompany || !pair?.supplierCompany) return;

      const buyerCo = allCompanies.find(
        (c) =>
          String(c.companyName || "").trim().toLowerCase() ===
          String(pair.buyerCompany).trim().toLowerCase(),
      );

      const ledger = buyerCo
        ? resolveLedgerForCompany(
            buyerCo._id,
            formData.ledgerType,
            ledgers,
            opposingLedgers,
          )
        : null;

      setSelectedLedger(ledger);
      setFormData((prev) => ({
        ...prev,
        companyId: buyerCo?._id || prev.companyId,
        ledgerId: ledger?.value || prev.ledgerId,
        opposingCompanyId: pair.supplierCompany,
      }));
      setAllocationSource("advance");
    },
    [
      allCompanies,
      formData.ledgerType,
      ledgers,
      opposingLedgers,
      resolveLedgerForCompany,
    ],
  );

  const tallyHistoryRows = useMemo(
    () => buildTallyVoucherRows(history, 0, historyEntries),
    [history, historyEntries],
  );

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
    if (!formData.ledgerId && !companyPair.buyerCompany) {
      setLedgerBalance({
        advanceBalance: 0,
        totalAdvanceBalance: 0,
        creditByPair: [],
        advanceTotalDr: 0,
        totalAdvanceTotalDr: 0,
        creditToSeller: 0,
        totalCreditToSeller: 0,
        outstandingBalance: 0,
      });
      return;
    }

    try {
      const params = {};
      if (companyPair.buyerCompany) {
        params.buyerCompany = companyPair.buyerCompany;
      }
      if (companyPair.supplierCompany) {
        params.supplierCompany = companyPair.supplierCompany;
      }

      const url = formData.ledgerId
        ? `/payment-received/balance/${formData.ledgerId}`
        : "/payment-received/balance";

      const response = await api.get(url, { params });
      setLedgerBalance({
        outstandingBalance: response.data.outstandingBalance ?? 0,
        advanceBalance: response.data.advanceBalance ?? 0,
        totalAdvanceBalance: response.data.totalAdvanceBalance ?? 0,
        creditByPair: response.data.creditByPair ?? [],
        advanceTotalDr: response.data.advanceTotalDr ?? 0,
        totalAdvanceTotalDr: response.data.totalAdvanceTotalDr ?? 0,
        creditToSeller: response.data.creditToSeller ?? 0,
        totalCreditToSeller: response.data.totalCreditToSeller ?? 0,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [
    formData.ledgerId,
    companyPair.buyerCompany,
    companyPair.supplierCompany,
  ]);

  useEffect(() => {
    fetchHistory();
    fetchSummary();
    fetchLedgerBalance();
  }, [fetchHistory, fetchSummary, fetchLedgerBalance]);

  const fetchDateTotal = useCallback(async () => {
    try {
      const selectedDate = formData.date;
      
      // 1. Fetch Day Total (All payments for the date, regardless of company/ledger)
      const dayParams = {
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 1000,
      };
      const dayResponse = await api.get("/payment-received", { params: dayParams });
      const allPayments = dayResponse.data.data || [];
      const dTotal = allPayments.reduce(
        (sum, p) => sum + (p.amount || 0) + (p.claim || 0) + (p.tds || 0),
        0,
      );
      setDayTotal(dTotal);

      // 2. Fetch Filtered Total (Based on current company filters)
      const params = {
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 1000,
      };

      if (companyPair.buyerCompany || companyPair.supplierCompany) {
        if (companyPair.buyerCompany) params.buyerCompany = companyPair.buyerCompany;
        if (companyPair.supplierCompany) params.supplierCompany = companyPair.supplierCompany;
      } else {
        if (formData.ledgerType) params.ledgerType = formData.ledgerType;
        if (formData.ledgerId) params.ledgerId = formData.ledgerId;
      }

      const response = await api.get("/payment-received", { params });
      const payments = response.data.data || [];
      const total = payments.reduce(
        (sum, p) => sum + (p.amount || 0) + (p.claim || 0) + (p.tds || 0),
        0,
      );
      setDateTotal(total);
    } catch (error) {
      console.error("Error fetching date total:", error);
    }
  }, [
    formData.date,
    formData.ledgerId,
    formData.companyId,
    formData.ledgerType,
    companyPair.buyerCompany,
    companyPair.supplierCompany,
  ]);

  useEffect(() => {
    fetchDateTotal();
  }, [fetchDateTotal]);

  const handleSaveAllAllocations = async () => {
    const allocations = entries.filter(
      (e) => {
        if (e.isSaved && !editingPaymentId) return false;
        if (parseFloat(e.allocatedAmount) <= 0.01) return false;
        
        const details = calculateTallyDetails(e);
        const lorryBalance = Math.max(0, details.dueAmount - (parseFloat(e.allocatedAmount) || 0));
        const creditAmount = details.netAmount;
        if (Math.abs(lorryBalance - creditAmount) < 0.01) {
          return false;
        }
        return true;
      },
    );

    if (allocations.length === 0 && !editingPaymentId) {
      toast.error("No valid allocations to save (Lorry Balance equals Credit Amount for selected entries)");
      return;
    }

    const firstEntry = allocations[0] || entries[0];
    const pairPayload = firstEntry ? buildCompanyPayload(firstEntry) : buildCompanyPayload();
    const ledgerId = resolveLedgerIdForSave();
    const saveCompanyId = firstEntry ? resolveCompanyIdForSave(firstEntry) : formData.companyId;

    if (!saveCompanyId && !pairPayload.buyerCompany && !editingPaymentId) {
      toast.error("Select buyer company, then save");
      return;
    }
    if (
      allocationSource === "advance" &&
      !String(pairPayload.supplierCompany || "").trim() &&
      !editingPaymentId
    ) {
      toast.error("Select seller company or pick a lorry with supplier set");
      return;
    }

    try {
      setLoading(true);
      const recordLedgerType = formData.ledgerType || "Buyer";

      const totalAllocated = allocations.reduce(
        (sum, e) => sum + parseFloat(e.allocatedAmount || 0),
        0,
      );

      const recordAmount =
        allocationSource === "fresh"
          ? Math.max(totalAllocated, formData.amount || 0)
          : totalAllocated;

      const payload = {
        date: formData.allocationDate || formData.date,
        ledgerType: recordLedgerType,
        ledgerId: ledgerId || formData.ledgerId || undefined,
        companyId: saveCompanyId || formData.companyId || undefined,
        buyerCompany: pairPayload.buyerCompany || editingPayment?.buyerCompany || "",
        supplierCompany: pairPayload.supplierCompany || editingPayment?.supplierCompany || "",
        amount: formData.paymentMode === "Claim" || formData.paymentMode === "TDS" ? 0 : recordAmount,
        claim: formData.paymentMode === "Claim" ? recordAmount : (Number(formData.claim) || 0),
        tds: formData.paymentMode === "TDS" ? recordAmount : (Number(formData.tds) || 0),
        paymentType: editingPaymentId
          ? (allocationSource === "advance" ? "Adjustment" : (totalAllocated > 0 ? "Sauda-wise" : "Advance"))
          : (allocationSource === "fresh" ? (totalAllocated > 0 ? "Sauda-wise" : "Advance") : "Adjustment"),
        paymentMode:
          allocationSource === "fresh" || editingPaymentId ? formData.paymentMode : "Adjustment",
        mappings: allocations.map((e) => ({
          saudaNo: e.saudaNo,
          loadingEntryId: e._id,
          allocatedAmount: parseFloat(e.allocatedAmount || 0),
          remarks: e.rowRemarks,
          debitNote: e.debitNote,
          creditNote: e.creditNote,
        })),
        remarks:
          allocationSource === "fresh" && recordAmount > totalAllocated
            ? `${formData.remarks || "Bulk Allocation"} | Unallocated: Rs. ${(recordAmount - totalAllocated).toLocaleString("en-IN")}`
            : formData.remarks || "Bulk Allocation",
        sellerBillNo: editingPayment?.sellerBillNo || formData.sellerBillNo || "",
      };

      if (editingPaymentId) {
        await api.put(`/payment-received/${editingPaymentId}`, payload);
        toast.success(
          `Updated payment with ${allocations.length} allocations`,
        );
        setTimeout(() => navigate(-1), 1200);
      } else {
        await api.post("/payment-received", payload);
        toast.success(
          `Recorded payment of Rs. ${recordAmount.toLocaleString("en-IN")} with ${allocations.length} allocations${recordAmount > totalAllocated ? ` (plus Rs. ${(recordAmount - totalAllocated).toLocaleString("en-IN")} unallocated)` : ""}`,
        );
      }

      setEntries((prev) =>
        prev.map((e) => {
          const saved = allocations.some((a) => a.uiKey === e.uiKey);
          return saved ? { ...e, isSaved: true } : e;
        }),
      );

      if (allocationSource === "fresh" && !editingPaymentId) {
        setFormData((prev) => ({
          ...prev,
          amount: 0,
          claim: 0,
          tds: 0,
          ledgerId: prev.ledgerId || ledgerId,
        }));
      }

      fetchEntries(entriesPage);
      fetchHistory();
      fetchDateTotal();
      fetchSummary();
      fetchLedgerBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving bulk payment");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "date") {
      setFormData((prev) => ({
        ...prev,
        date: value,
        filterStartDate: "",
        filterEndDate: "",
      }));
      return;
    }
    setFormData((prev) => {
      const newVal =
        name === "amount" || name === "claim" || name === "tds"
          ? value === ""
            ? 0
            : parseFloat(value) || 0
          : value;

      if (name === "amount" && parseFloat(value) > 0) {
        setActiveTab("allocation");
      }

      return {
        ...prev,
        [name]: newVal,
      };
    });
  };

  const handleCompanyChange = (option) => {
    const companyId = option?.value || "";
    const ledger = resolveLedgerForCompany(
      companyId,
      formData.ledgerType,
      ledgers,
      opposingLedgers,
    );
    setSelectedLedger(ledger);
    setFormData((prev) => ({
      ...prev,
      companyId,
      ledgerId: ledger?.value || "",
      opposingCompanyId: "",
    }));
  };

  const handleClearCompany = () => {
    setSelectedLedger(null);
    setBuyerSellerOptions([]);
    setFormData((prev) => ({
      ...prev,
      companyId: "",
      ledgerId: "",
      opposingCompanyId: "",
    }));
  };

  const handleClearOpposingCompany = () => {
    setFormData((prev) => ({
      ...prev,
      opposingCompanyId: "",
    }));
  };

  const handleOpposingCompanyChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      opposingCompanyId: option?.value || "",
    }));
  };

  const sumOpenAllocationsExcept = useCallback(
    (uiKey) =>
      entries.reduce((sum, entry) => {
        if (entry.uiKey === uiKey || entry.isSaved) return sum;
        return sum + (parseFloat(entry.allocatedAmount) || 0);
      }, 0),
    [entries],
  );

  const getRemainingAllocationForRow = useCallback(
    (uiKey) => {
      const pool = Number(availableAllocationPool) || 0;
      const other = sumOpenAllocationsExcept(uiKey);
      return Math.max(0, pool - other);
    },
    [availableAllocationPool, sumOpenAllocationsExcept],
  );

  const handleAllocationChange = (uiKey, amount, rowDueAmount = 0) => {
    if (amount === "") {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.uiKey === uiKey ? { ...entry, allocatedAmount: "" } : entry,
        ),
      );
      return;
    }

    if (!/^\d*\.?\d*$/.test(amount)) return;

    const pool = Number(availableAllocationPool) || 0;
    const remaining = getRemainingAllocationForRow(uiKey);
    const dueAmount = Math.max(0, Number(rowDueAmount) || 0);
    const numAmount = parseFloat(amount);
    let valueToStore = amount;

    // Find the entry to check the condition
    const entry = entries.find(e => e.uiKey === uiKey);
    if (entry) {
      const details = calculateTallyDetails(entry);
      const lorryBalance = Math.max(0, details.dueAmount - numAmount);
      const creditAmount = details.netAmount;
      if (Math.abs(lorryBalance - creditAmount) < 0.01) {
        toast.warning("Warning: Lorry Balance will equal Credit Amount, this entry cannot be saved");
      }
    }

    if (!Number.isNaN(numAmount)) {
      // First, check if amount exceeds dueAmount (Lorry Balance)
      if (numAmount > dueAmount + 0.01) { // small tolerance for floating point errors
        valueToStore = String(
          Math.round(Math.min(numAmount, dueAmount) * 100) / 100,
        );
        toast.warning(
          `Max Cr. Rs. ${dueAmount.toLocaleString("en-IN")} (Lorry Balance) on this row`,
        );
      } else if (allocationSource === "advance") {
        if (pool <= 0.01 && numAmount > 0) {
          toast.error(
            fullCompanyMapping
              ? "No Credit (Advance) balance for this buyer → seller"
              : "Select seller and use From Advance",
          );
        } else if (numAmount > remaining) { 
          valueToStore = String(
            Math.round(Math.min(numAmount, Math.max(remaining, 0)) * 100) / 100,
          );
          toast.warning(
            `Max Rs. ${remaining.toLocaleString("en-IN")} from advance (pool Rs. ${pool.toLocaleString("en-IN")})`,
          );
        }
      } else if (pool <= 0.01 && numAmount > 0) {
        toast.error("Enter payment amount in the form above first");
      } else {
        const maxAllowed = Math.min(
          remaining,
          dueAmount,
        );
        if (numAmount > maxAllowed) { 
          valueToStore = String(
            Math.round(Math.min(numAmount, maxAllowed) * 100) / 100,
          );
          toast.warning(
            `Max Cr. Rs. ${maxAllowed.toLocaleString("en-IN")} on this row`,
          );
        }
      }
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.uiKey === uiKey
          ? { ...entry, allocatedAmount: valueToStore }
          : entry,
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

  const handleDebitNoteChange = (uiKey, debitNote) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.uiKey === uiKey ? { ...entry, debitNote } : entry,
      ),
    );
  };

  const handleCreditNoteChange = (uiKey, creditNote) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.uiKey === uiKey ? { ...entry, creditNote } : entry,
      ),
    );
  };

  const handleAddRow = (entry, index) => {
    const newRow = {
      ...entry,
      uiKey: `${entry._id}-extra-${Date.now()}`,
      allocatedAmount: "",
      debitNote: entry.debitNote || "Lorry freight due (Dr.)",
      creditNote:
        entry.creditNote ||
        (allocationSource === "advance"
          ? "Adjusted from advance · lorry"
          : "Payment received · lorry adjustment"),
      rowRemarks: "",
      isSaved: false,
      bankCharges: entry.bankCharges || 0, // Carry over bank charges to new row
    };
    const newEntries = [...entries];
    newEntries.splice(index + 1, 0, newRow);
    setEntries(newEntries);
  };

  const handleRemoveRow = (uiKey) => {
    setEntries((prev) => prev.filter((entry) => entry.uiKey !== uiKey));
  };

  const handleSaveRow = async (entry) => {
    const details = calculateTallyDetails(entry);
    const lorryBalance = Math.max(0, details.dueAmount - (parseFloat(entry.allocatedAmount) || 0));
    const creditAmount = details.netAmount;
    
    if (Math.abs(lorryBalance - creditAmount) < 0.01 && !editingPaymentId) {
      toast.error("Cannot save: Lorry Balance equals Credit Amount");
      return;
    }

    if (entry.allocatedAmount === "" && !entry.isSaved && !editingPaymentId) {
      toast.error("Please enter an allocation amount");
      return;
    }

    const isAdmin = user?.role === "Admin";
    const isEditingEntry = entry.isSaved && isAdmin && !editingPaymentId;
    const numAllocated = parseFloat(entry.allocatedAmount) || 0;
    const { dueAmount } = calculateTallyDetails(entry);

    const remainingPool = getRemainingAllocationForRow(entry.uiKey);
    const creditPool = Number(availableAllocationPool) || 0;
    const pairPayload = buildCompanyPayload(entry);

    if (allocationSource === "advance" && numAllocated > remainingPool + 1 && !editingPaymentId) {
      toast.error(
        `Cr. allocation cannot exceed Cr. advance (Rs. ${creditPool.toLocaleString("en-IN")} Cr., Rs. ${remainingPool.toLocaleString("en-IN")} Cr. left)`,
      );
      return;
    }

    let saveAllocated = numAllocated;
    if (
      allocationSource === "fresh" &&
      dueAmount > 1 &&
      saveAllocated > dueAmount + 1
    ) {
      toast.warning(
        `Capped to due Rs. ${dueAmount.toLocaleString("en-IN")} for ${entry.lorryNumber}`,
      );
      saveAllocated = dueAmount;
    }

    const effectiveCreditPool = Math.max(
      Number(formData.amount) || 0,
      Number(ledgerTopSummary.creditEntryTotal) || 0,
    );
    const rowCreditLeft = Math.max(
      0,
      effectiveCreditPool - sumOpenAllocationsExcept(entry.uiKey),
    );

    if (
      allocationSource === "fresh" &&
      effectiveCreditPool <= 0.01 &&
      saveAllocated > 0.01 &&
      !editingPaymentId
    ) {
      toast.error(
        "Enter payment received amount above before adjusting lorries",
      );
      return;
    }

    if (allocationSource === "fresh" && saveAllocated > rowCreditLeft + 1 && !editingPaymentId) {
      if (
        effectiveCreditPool <= 0.01 &&
        (ledgerBalance.totalAdvanceBalance || 0) > 0
      ) {
        toast.info(
          "Entry amount is Rs. 0. Switch to From Advance to use buyer Cr. balance.",
          { autoClose: 6000 },
        );
      } else {
        toast.error(
          `Exceeds entry total (Rs. ${rowCreditLeft.toLocaleString("en-IN")} left for this row)`,
        );
      }
      return;
    }

    const ledgerId = resolveLedgerIdForSave();

    const saveCompanyId = resolveCompanyIdForSave(entry);
    if (!isEditingEntry && !saveCompanyId && !pairPayload.buyerCompany && !editingPaymentId) {
      toast.error("Select buyer company filter, then save");
      return;
    }

    if (
      allocationSource === "advance" &&
      !String(pairPayload.supplierCompany || "").trim() &&
      !editingPaymentId
    ) {
      toast.error("Select seller company or use a lorry row with supplier");
      return;
    }

    try {
      setLoading(true);

      if (isEditingEntry) {
        await api.patch(`/payment-received/adjust-lorry/${entry._id}`, {
          paidAmount: numAllocated,
          paymentStatus:
            numAllocated >= calculateTallyDetails(entry).netAmount - 1
              ? "done"
              : "pending",
        });
        toast.success(`Payment adjusted for ${entry.lorryNumber}`);
      } else if (editingPaymentId) {
        const recordLedgerType = formData.ledgerType || "Buyer";
        const finalBuyer = pairPayload.buyerCompany || editingPayment?.buyerCompany || "";
        const finalSupplier = pairPayload.supplierCompany || editingPayment?.supplierCompany || "";
        const finalType = allocationSource === "advance" ? "Adjustment" : (numAllocated > 0 ? "Sauda-wise" : "Advance");

        const recordAmount =
          allocationSource === "fresh"
            ? Math.max(saveAllocated, formData.amount || 0)
            : saveAllocated;

        const existingMappings = editingPayment?.mappings || [];
        const newMapping = {
          saudaNo: entry.saudaNo,
          loadingEntryId: entry._id,
          allocatedAmount: saveAllocated,
          remarks: entry.rowRemarks,
          debitNote: entry.debitNote,
          creditNote: entry.creditNote,
        };
        const updatedMappings = [
          ...existingMappings.filter((m) => m.loadingEntryId?._id !== entry._id && m.loadingEntryId !== entry._id),
          newMapping,
        ];

        const payload = {
          date: formData.allocationDate || formData.date,
          ledgerType: recordLedgerType,
          ledgerId: ledgerId || formData.ledgerId || undefined,
          companyId: saveCompanyId || formData.companyId || undefined,
          buyerCompany: finalBuyer,
          supplierCompany: finalSupplier,
          amount: formData.paymentMode === "Claim" || formData.paymentMode === "TDS" ? 0 : recordAmount,
          claim: formData.paymentMode === "Claim" ? recordAmount : (Number(formData.claim) || 0),
          tds: formData.paymentMode === "TDS" ? recordAmount : (Number(formData.tds) || 0),
          paymentType: finalType,
          paymentMode: formData.paymentMode,
          mappings: updatedMappings,
          remarks: formData.remarks || editingPayment?.remarks || "",
          sellerBillNo: editingPayment?.sellerBillNo || "",
        };

        await api.put(`/payment-received/${editingPaymentId}`, payload);
        toast.success(`Updated payment for ${entry.lorryNumber}`);

        setEntries((prev) =>
          prev.map((e) =>
            e.uiKey === entry.uiKey ? { ...e, isSaved: true } : e,
          ),
        );
        setTimeout(() => navigate(-1), 1200);
      } else {
        const recordLedgerType = "Buyer";

        const lineRemark = [
          entry.debitNote || "Due against lorry",
          entry.creditNote || "Allocation posted",
          entry.rowRemarks || "",
        ]
          .filter(Boolean)
          .join(" | ");

        const recordAmount =
          allocationSource === "fresh"
            ? Math.max(saveAllocated, formData.amount)
            : saveAllocated;

        const payload = {
          date: formData.allocationDate || formData.date,
          ledgerType: recordLedgerType,
          ledgerId: ledgerId || undefined,
          companyId: saveCompanyId,
          ...pairPayload,
          amount: formData.paymentMode === "Claim" || formData.paymentMode === "TDS" ? 0 : recordAmount,
          claim: formData.paymentMode === "Claim" ? recordAmount : 0,
          tds: formData.paymentMode === "TDS" ? recordAmount : 0,
          paymentType:
            allocationSource === "fresh" ? "Sauda-wise" : "Adjustment",
          paymentMode:
            allocationSource === "fresh" ? formData.paymentMode : "Adjustment",
          mappings: [
            {
              saudaNo: entry.saudaNo,
              loadingEntryId: entry._id,
              allocatedAmount: saveAllocated,
              remarks: lineRemark,
              debitNote: entry.debitNote,
              creditNote: entry.creditNote,
            },
          ],
          remarks:
            allocationSource === "fresh" && recordAmount > saveAllocated
              ? `${lineRemark} | Unallocated: Rs. ${(recordAmount - saveAllocated).toLocaleString("en-IN")}`
              : lineRemark,
        };

        await api.post("/payment-received", payload);
        toast.success(
          allocationSource === "advance"
            ? `Cr. Rs. ${saveAllocated.toLocaleString("en-IN")} posted against ${entry.lorryNumber} (from Cr. advance)`
            : `Payment recorded for ${entry.lorryNumber}${recordAmount > saveAllocated ? ` (plus Rs. ${(recordAmount - saveAllocated).toLocaleString("en-IN")} unallocated)` : ""}`,
        );

        setEntries((prev) =>
          prev.map((e) =>
            e.uiKey === entry.uiKey ? { ...e, isSaved: true } : e,
          ),
        );

        if (allocationSource === "fresh") {
          setFormData((prev) => ({
            ...prev,
            amount: 0,
            claim: 0,
            tds: 0,
            ledgerId: prev.ledgerId || ledgerId,
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
    if (!formData.companyId || !formData.ledgerId) {
      toast.error("Select a company linked to a ledger account");
      return;
    }
    if (!companyPair.supplierCompany && !editingPaymentId) {
      toast.error(
        "Select seller company — advance is tracked buyer → seller only",
      );
      return;
    }

    const recordLedgerType = formData.ledgerType || "Buyer";

    try {
      setLoading(true);
      const pairLabel = `${companyPair.buyerCompany || editingPayment?.buyerCompany || ""} → ${companyPair.supplierCompany || editingPayment?.supplierCompany || ""}`;
      const payload = {
        ...formData,
        date: formData.allocationDate || formData.date,
        amount: formData.paymentMode === "Claim" || formData.paymentMode === "TDS" ? 0 : formData.amount,
        claim: formData.paymentMode === "Claim" ? formData.amount : 0,
        tds: formData.paymentMode === "TDS" ? formData.amount : 0,
        ledgerType: recordLedgerType,
        ledgerId: formData.ledgerId || undefined,
        companyId: formData.companyId,
        buyerCompany: companyPair.buyerCompany || editingPayment?.buyerCompany || "",
        supplierCompany: companyPair.supplierCompany || editingPayment?.supplierCompany || "",
        paymentType: "Advance",
        mappings: editingPayment?.mappings || [],
        remarks:
          formData.remarks?.trim() ||
          `Advance (Cr.) from buyer for ${pairLabel} · lorry-wise Cr. later`,
        sellerBillNo: editingPayment?.sellerBillNo || "",
      };

      if (editingPaymentId) {
        await api.put(`/payment-received/${editingPaymentId}`, payload);
        toast.success("Advance payment updated");
        setTimeout(() => navigate(-1), 1200);
      } else {
        await api.post("/payment-received", payload);
        toast.success("Advance payment recorded");
      }

      setFormData((prev) => ({
        ...prev,
        amount: 0,
        claim: 0,
        tds: 0,
        remarks: "",
      }));
      fetchHistory();
      fetchDateTotal();
      fetchLedgerBalance();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error recording advance");
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
      `Company: ${(selectedCompanyOption?.label || selectedLedger?.label || "N/A").toUpperCase()}`,
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
      header: "LORRY & BILL",
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 uppercase tracking-tighter text-xs">
              {row.lorryNumber}
            </span>
            {row.billNumber && (
              <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter">
                {row.billNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
              {row.commodity}
            </span>
            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100 uppercase">
              {((row.unloadingWeight || 0) > 0 ? row.unloadingWeight : row.loadingWeight) || 0} MT
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "BILL AMOUNT",
      accessor: (row) => {
        const details = calculateTallyDetails(row);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-black text-rose-600 text-xs tabular-nums">
              ₹{details.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
              Total Lorry Bill
            </span>
          </div>
        );
      },
    },
    {
      header: "PARTIES",
      accessor: (row) => (
        <div className="flex flex-col gap-1 max-w-[150px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-100 text-[8px] flex items-center justify-center text-blue-600 font-black">
              B
            </span>
            <span
              className={`text-[9px] font-black uppercase truncate ${
                matchCompanyName(row.buyerCompany, companyPair.buyerCompany)
                  ? "text-blue-700"
                  : "text-slate-400"
              }`}
            >
              {row.buyerCompany || "N/A"}
            </span>
          </div>
          <div className="flex justify-center -my-1 ml-3">
            <div className="h-2 w-0.5 bg-slate-200 relative">
              <div className="absolute -bottom-1 -left-[3px] border-t-4 border-t-slate-200 border-x-[3px] border-x-transparent"></div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-100 text-[8px] flex items-center justify-center text-green-600 font-black">
              S
            </span>
            <span
              className={`text-[9px] font-black uppercase truncate ${
                matchCompanyName(row.supplierCompany, companyPair.supplierCompany)
                  ? "text-green-700"
                  : "text-slate-400"
              }`}
            >
              {row.supplierCompany || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "BREAKDOWN & POST Cr.",
      accessor: (row) => {
        const details = calculateTallyDetails(row);
        const isLocked = row.isSaved && user?.role !== "Admin";
        const rowRemaining = getRemainingAllocationForRow(row.uiKey);
        const rowMax =
          allocationSource === "advance"
            ? rowRemaining
            : Math.min(
                rowRemaining,
                details.dueAmount > 0.01 ? details.dueAmount : rowRemaining,
              );
        const allocDisplay =
          row.allocatedAmount === "" || row.allocatedAmount == null
            ? ""
            : String(row.allocatedAmount);

        return (
          <div className="flex flex-col gap-1.5 text-[9px] font-black min-w-[1000px] uppercase">
            <div className="mb-1 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#1e3a5f] text-white px-2 py-0.5 rounded text-[8px]">
                  Sauda: {row.saudaNo}
                </span>
                {row.billNumber && (
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[8px]">
                    Bill: {row.billNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {allocationSource === "fresh" && formData.amount > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[7.5px]">
                      Entry Pool: ₹{Number(formData.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {allocationSource === "advance" && (ledgerBalance.advanceBalance > 0 || ledgerBalance.totalAdvanceBalance > 0) && (
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    <span className="text-[7.5px]">
                      Cr. Advance: ₹{(ledgerBalance.advanceBalance || ledgerBalance.totalAdvanceBalance).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Bill Breakdown */}
            <div className="grid grid-cols-6 gap-2 bg-white border border-slate-200 rounded px-3 py-2 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                  Gross Amount
                </span>
                <span className="h-6 px-2 rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold flex items-center tabular-nums">
                  ₹{details.grossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                  Less: CD ({details.cdPercent}%)
                </span>
                <span className="h-6 px-2 rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold flex items-center tabular-nums">
                  ₹{details.cdAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                  Less: Bank Charges
                </span>
                <input
                  type="number"
                  value={details.bankCharges}
                  onChange={(e) => {
                    // Update the entry's bank charges
                    const newBankCharges = parseFloat(e.target.value) || 0;
                    setEntries(prev => prev.map(e => 
                      e.uiKey === row.uiKey 
                        ? { ...e, bankCharges: newBankCharges } 
                        : e
                    ));
                  }}
                  disabled={row.isSaved && user?.role !== "Admin"}
                  className="h-6 px-2 rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold outline-none tabular-nums"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                  Taxable Amount
                </span>
                <span className="h-6 px-2 rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold flex items-center tabular-nums">
                  ₹{details.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                  Add: GST ({details.gstPercent}%)
                </span>
                <span className="h-6 px-2 rounded border border-slate-200 bg-white text-slate-700 text-[9px] font-bold flex items-center tabular-nums">
                  ₹{details.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                  Credit Amount
                </span>
                <span className="h-6 px-2 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[9px] font-bold flex items-center tabular-nums">
                  ₹{details.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3 items-end bg-slate-50 border border-slate-200 rounded px-3 py-2 shadow-inner">
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                  Posting Date
                </span>
                <input
                  type="date"
                  value={formData.allocationDate || formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allocationDate: e.target.value,
                    }))
                  }
                  className="h-8 px-2 rounded border border-slate-200 text-[10px] font-bold text-slate-700 outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                  Debit note
                </span>
                <input
                  type="text"
                  value={row.debitNote || ""}
                  onChange={(e) => handleDebitNoteChange(row.uiKey, e.target.value)}
                  disabled={isLocked}
                  className={`h-8 px-2 rounded border text-[10px] font-bold normal-case transition-all ${
                    isLocked
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-white border-slate-300 focus:border-slate-700 outline-none"
                  }`}
                  placeholder="Dr. note"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-rose-600 uppercase tracking-widest">
                  Lorry Bill (Dr.)
                </span>
                <span className="h-8 px-2 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-black flex items-center tabular-nums normal-case shadow-sm">
                  ₹{details.netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                  Credit note
                </span>
                <input
                  type="text"
                  value={row.creditNote || ""}
                  onChange={(e) => handleCreditNoteChange(row.uiKey, e.target.value)}
                  disabled={isLocked}
                  className={`h-8 px-2 rounded border text-[10px] font-bold normal-case transition-all ${
                    isLocked
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-white border-slate-300 focus:border-slate-700 outline-none"
                  }`}
                  placeholder="Cr. note"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">
                  Allocation (Cr.)
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={allocDisplay}
                    onChange={(e) =>
                      handleAllocationChange(
                        row.uiKey,
                        e.target.value,
                        details.dueAmount,
                      )
                    }
                    disabled={isLocked}
                    className={`h-8 w-full px-2 rounded border text-[10px] font-black tabular-nums normal-case transition-all ${
                      isLocked
                        ? "bg-slate-100 text-slate-400 border-slate-200"
                        : "bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-600 outline-none shadow-sm"
                    }`}
                    placeholder="0.00"
                  />
                  {!isLocked && rowMax > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAllocationChange(
                          row.uiKey,
                          String(rowMax),
                          details.dueAmount,
                        )
                      }
                      className="absolute -top-6 right-0 text-[8px] font-black uppercase text-emerald-700 hover:text-emerald-900 transition-colors bg-emerald-100/50 px-1.5 rounded"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                  Lorry Balance
                </span>
                <span className={`h-8 px-2 rounded border text-[10px] font-black flex items-center tabular-nums normal-case shadow-sm transition-all ${
                  details.dueAmount - (parseFloat(row.allocatedAmount) || 0) > 0.01
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}>
                  ₹{(Math.max(0, details.dueAmount - (parseFloat(row.allocatedAmount) || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "NARRATION",
      accessor: (row) => {
        const isLocked = row.isSaved && user?.role !== "Admin";
        const isExtraRow = row.uiKey.includes("-extra-");

        return (
          <div className="flex flex-col gap-2 min-w-[140px]">
            <textarea
              value={row.rowRemarks}
              onChange={(e) => handleRowRemarksChange(row.uiKey, e.target.value)}
              disabled={isLocked}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-[10px] font-bold ${
                isLocked
                  ? "bg-slate-50 text-slate-400 border-slate-100"
                  : "border-slate-200 bg-white focus:border-slate-900 focus:bg-yellow-50"
              } outline-none transition-all resize-none uppercase`}
              placeholder="Narration..."
            />
            {isExtraRow && !row.isSaved && (
              <button
                type="button"
                onClick={() => handleRemoveRow(row.uiKey)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all text-[10px] font-bold"
              >
                <FaTrash size={12} className="inline mr-1" /> Remove row
              </button>
            )}
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
                    ? "!border-green-500 !text-green-600 hover:!bg-green-50"
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
      title={editingPaymentId ? "Edit Payment Received" : "Payment Received"}
      subtitle={editingPaymentId ? "Update payment allocation and adjust amounts" : "Record and allocate payments in Tally-style ledger format"}
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
            {editingPaymentId && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                <FaExchangeAlt className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Edit Mode · Voucher #{editingPayment?.voucherNumber || "—"}
                </span>
              </div>
            )}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <TabButton
                active={activeTab === "payment_list"}
                label="Payment List"
                icon={FaMoneyBillWave}
                onClick={() => setActiveTab("payment_list")}
              />
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

        {(editingPaymentId || liveUnadjustedAmount > 0.01 || (editingPayment?.unadjustedAmount || 0) > 0.01) && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${
            editingPaymentId
              ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
              : liveUnadjustedAmount > 0
                ? "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50"
                : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50"
          }`}>
            <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner ${
                  editingPaymentId ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                }`}>
                  <FaMoneyBillWave size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {editingPaymentId ? "Unadjusted Amount (On Account / Advance)" : "Unadjusted Amount — Available for Allocation"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-800">
                      ₹{liveUnadjustedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {editingPaymentId && editingPayment && (editingPayment.unadjustedAmount || 0) !== liveUnadjustedAmount && (
                      <span className="text-xs font-bold text-slate-400">
                        (original: ₹{(Number(editingPayment.unadjustedAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    )}
                  </div>
                  {editingPayment?.paymentType && (
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Type: {editingPayment.paymentType}
                      {editingPayment.paymentMode ? ` · ${editingPayment.paymentMode}` : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                {editingPayment?.buyerCompany && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    {editingPayment.buyerCompany}
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                    {editingPayment.supplierCompany || "—"}
                  </div>
                )}
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {liveUnadjustedAmount > 0.01
                    ? "This amount remains unadjusted and is treated as advance / on-account"
                    : "All payment value has been allocated against lorries"}
                </div>
              </div>
            </div>
          </div>
        )}

        <StatDashboard
          selectedLedger={selectedLedger}
          selectedCompanyOption={selectedCompanyOption}
          dateTotal={dateTotal}
          dayTotal={dayTotal}
          formData={formData}
          ledgerBalance={ledgerBalance}
          entryStats={entryStats}
          companyPair={companyPair}
          fullCompanyMapping={fullCompanyMapping}
          ledgerTopSummary={ledgerTopSummary}
          allocationSource={allocationSource}
        />

        <AccountSelection
          allocationSource={allocationSource}
          setAllocationSource={setAllocationSource}
          formData={formData}
          handleInputChange={handleInputChange}
          primaryCompanyOptions={primaryCompanyOptions}
          opposingCompanyOptions={opposingCompanyOptions}
          selectedCompanyOption={selectedCompanyOption}
          selectedOpposingCompanyOption={selectedOpposingCompanyOption}
          handleCompanyChange={handleCompanyChange}
          handleOpposingCompanyChange={handleOpposingCompanyChange}
          handleClearCompany={handleClearCompany}
          handleClearOpposingCompany={handleClearOpposingCompany}
          paymentModes={paymentModes}
          loading={loading}
          handleRecordAdvance={handleRecordAdvance}
          hasResolvedLedger={Boolean(formData.ledgerId)}
          loadingSellerOptions={loadingSellerOptions}
          hasBuyerCompany={hasBuyerCompany}
          companyPair={companyPair}
          fullCompanyMapping={fullCompanyMapping}
          ledgerTopSummary={ledgerTopSummary}
          creditByPair={ledgerBalance.creditByPair}
          dateTotal={dateTotal}
          onSelectCreditPair={handleSelectCreditPair}
        />

        <PaymentRecordingPanel
          formData={formData}
          handleInputChange={handleInputChange}
          paymentModes={paymentModes}
          loading={loading}
          handleRecordAdvance={handleRecordAdvance}
          hasResolvedLedger={Boolean(formData.ledgerId)}
          ledgerBalance={ledgerBalance}
          ledgerTopSummary={ledgerTopSummary}
          allocationSource={allocationSource}
          companyPair={companyPair}
          fullCompanyMapping={fullCompanyMapping}
          history={history}
        />

        {(formData.amount > 0 ||
          (fullCompanyMapping && companyPair.buyerCompany)) && (
          <CreditBalancePanel
            creditEntryTotal={ledgerTopSummary.creditEntryTotal ?? 0}
            debitToSeller={ledgerTopSummary.debitToSeller ?? 0}
            debitPostedToSeller={ledgerTopSummary.debitPostedToSeller ?? 0}
            debitPendingInForm={ledgerTopSummary.debitPendingInForm ?? 0}
            creditBalanceRemaining={ledgerTopSummary.creditBalanceRemaining ?? 0}
            creditByPair={ledgerBalance.creditByPair}
            fullCompanyMapping={fullCompanyMapping}
            buyerCompany={companyPair.buyerCompany || ""}
            supplierCompany={companyPair.supplierCompany || ""}
            allocationSource={allocationSource}
            onSelectCreditPair={handleSelectCreditPair}
          />
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          {activeTab === "payment_list" && (
            <SimplePaymentList
              payments={history}
              loading={fetchingHistory}
              emptyMessage={
                companyPair.buyerCompany || companyPair.supplierCompany
                  ? `No payments recorded for ${[companyPair.buyerCompany, companyPair.supplierCompany].filter(Boolean).join(" → ")}. Switch to Allocation tab to record one.`
                  : "No payments found for the selected date. Select a company to view their full history or switch to Allocation tab."
              }
            />
          )}

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
              columns={columns}
              entriesPage={entriesPage}
              entriesTotal={entriesTotal}
              entriesPageSize={ENTRIES_PAGE_SIZE}
              fetchEntries={fetchEntries}
              entryStats={entryStats}
              dateTotal={dateTotal}
              ledgerBalance={ledgerBalance}
              companyPair={companyPair}
              fullCompanyMapping={fullCompanyMapping}
              hasBuyerCompany={hasBuyerCompany}
              hasCompanyTableScope={hasCompanyTableScope}
              buyerOnlyMapping={buyerOnlyMapping}
              loadingSellerOptions={loadingSellerOptions}
              onSelectCreditPair={handleSelectCreditPair}
              onSaveAll={handleSaveAllAllocations}
              loading={loading}
              ledgerTopSummary={ledgerTopSummary}
            />
          )}

          {activeTab === "history" && (
            <PaymentHistory
              fetchingHistory={fetchingHistory}
              formData={formData}
              companyPair={companyPair}
              tallyRows={tallyHistoryRows}
              onPrintVoucher={printVoucher}
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
