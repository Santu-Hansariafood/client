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
  const [summary, setSummary] = useState([]);
  const [summaryType, setSummaryType] = useState("month");
  const [tableSearch, setTableSearch] = useState("");
  const [buyerSellerOptions, setBuyerSellerOptions] = useState([]);
  const [loadingSellerOptions, setLoadingSellerOptions] = useState(false);
  const [dateTotal, setDateTotal] = useState(0);
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
  const [activeTab, setActiveTab] = useState("allocation"); // allocation, history, summary
  const [allocationSource, setAllocationSource] = useState("fresh"); // fresh, advance

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    allocationDate: new Date().toISOString().split("T")[0],
    ledgerType: "Buyer",
    ledgerId: "",
    companyId: "",
    opposingCompanyId: "",
    amount: 0,
    paymentType: "Sauda-wise",
    paymentMode: "Bank",
    remarks: "",
    filterStartDate: "",
    filterEndDate: "",
  });

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

  const ledgerTopSummary = useMemo(
    () =>
      computeBuyerSellerLedgerSummary({
        allocationSource,
        formAmount: formData.amount,
        ledgerBalance,
        fullCompanyMapping,
        creditPendingInForm,
        creditTableTotal,
      }),
    [
      allocationSource,
      formData.amount,
      ledgerBalance,
      fullCompanyMapping,
      creditPendingInForm,
      creditTableTotal,
    ],
  );

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
            isUnloaded: true,
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
          isUnloaded: true,
          paymentStatus: "pending",
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
          })),
        );
        setEntriesTotal(
          useWideFetch ? items.length : (response.data.total ?? items.length),
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
      return;
    }

    try {
      setFetchingHistory(true);
      const params = {
        startDate: formData.date,
        endDate: formData.date,
        limit: 500,
      };
      if (formData.ledgerType) {
        params.ledgerType = formData.ledgerType;
      }
      if (formData.ledgerId) params.ledgerId = formData.ledgerId;
      if (companyPair.buyerCompany) {
        params.buyerCompany = companyPair.buyerCompany;
      }
      if (companyPair.supplierCompany) {
        params.supplierCompany = companyPair.supplierCompany;
      }
      const response = await api.get("/payment-received", { params });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  }, [
    formData.ledgerId,
    formData.ledgerType,
    formData.date,
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
    () => buildTallyVoucherRows(history, 0),
    [history],
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
      const params = {
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 1000,
      };

      if (formData.ledgerId && formData.companyId) {
        params.ledgerId = formData.ledgerId;
      }
      if (formData.ledgerType) {
        params.ledgerType = formData.ledgerType;
      }
      if (companyPair.buyerCompany) {
        params.buyerCompany = companyPair.buyerCompany;
      }
      if (companyPair.supplierCompany) {
        params.supplierCompany = companyPair.supplierCompany;
      }

      const response = await api.get("/payment-received", { params });
      const payments = response.data.data || [];
      const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

  const handleAutoAllocate = useCallback(() => {
    const pool = Number(availableAllocationPool) || 0;
    if (pool <= 0) {
      toast.warning("Please enter a payment amount first");
      return;
    }

    let remainingPool = pool;
    const newEntries = entries.map((entry) => {
      if (entry.isSaved || remainingPool <= 0.01) {
        return entry;
      }

      const { dueAmount } = calculateTallyDetails(entry);
      const alloc = Math.min(remainingPool, dueAmount);
      
      if (alloc > 0.01) {
        remainingPool -= alloc;
        return { ...entry, allocatedAmount: String(Math.round(alloc * 100) / 100) };
      }
      return entry;
    });

    setEntries(newEntries);
    toast.success("Amount allocated to pending lorries");
  }, [availableAllocationPool, entries]);

  const handleSaveAllAllocations = async () => {
    const allocations = entries.filter(
      (e) => !e.isSaved && parseFloat(e.allocatedAmount) > 0.01,
    );

    if (allocations.length === 0) {
      toast.error("No new allocations to save");
      return;
    }

    const firstEntry = allocations[0];
    const pairPayload = buildCompanyPayload(firstEntry);
    const ledgerId = resolveLedgerIdForSave();
    const saveCompanyId = resolveCompanyIdForSave(firstEntry);

    if (!saveCompanyId && !pairPayload.buyerCompany) {
      toast.error("Select buyer company, then save");
      return;
    }
    if (
      allocationSource === "advance" &&
      !String(pairPayload.supplierCompany || "").trim()
    ) {
      toast.error("Select seller company or pick a lorry with supplier set");
      return;
    }

    try {
      setLoading(true);
      const recordLedgerType = "Buyer";

      const totalAllocated = allocations.reduce(
        (sum, e) => sum + parseFloat(e.allocatedAmount),
        0,
      );

      const payload = {
        date: formData.allocationDate || formData.date,
        ledgerType: recordLedgerType,
        ledgerId: ledgerId || undefined,
        companyId: saveCompanyId,
        ...pairPayload,
        amount: totalAllocated,
        paymentType: allocationSource === "fresh" ? "Sauda-wise" : "Adjustment",
        paymentMode:
          allocationSource === "fresh" ? formData.paymentMode : "Adjustment",
        mappings: allocations.map((e) => ({
          saudaNo: e.saudaNo,
          loadingEntryId: e._id,
          allocatedAmount: parseFloat(e.allocatedAmount),
          remarks: e.rowRemarks,
        })),
        remarks: formData.remarks || "Bulk Allocation",
      };

      await api.post("/payment-received", payload);
      toast.success(`Recorded payment with ${allocations.length} allocations`);

      setEntries((prev) =>
        prev.map((e) => {
          const saved = allocations.some((a) => a.uiKey === e.uiKey);
          return saved ? { ...e, isSaved: true } : e;
        }),
      );

      if (allocationSource === "fresh") {
        setFormData((prev) => ({
          ...prev,
          amount: Math.max(0, prev.amount - totalAllocated),
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? (value === "" ? 0 : parseFloat(value) || 0) : value,
    }));
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

    if (!Number.isNaN(numAmount)) {
      if (allocationSource === "advance") {
        if (pool <= 0.01 && numAmount > 0) {
          toast.error(
            fullCompanyMapping
              ? "No Dr. advance for this buyer → seller"
              : "Select seller and use From Advance",
          );
        } else if (numAmount > remaining + 1) { // Increased tolerance to 1
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
          dueAmount > 1 ? dueAmount : remaining, // Increased tolerance
        );
        if (numAmount > maxAllowed + 1) { // Increased tolerance
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
    const numAllocated = parseFloat(entry.allocatedAmount) || 0;
    const { dueAmount } = calculateTallyDetails(entry);

    const remainingPool = getRemainingAllocationForRow(entry.uiKey);
    const debitPool = Number(availableAllocationPool) || 0;
    const pairPayload = buildCompanyPayload(entry);

    if (allocationSource === "advance" && numAllocated > remainingPool + 1) {
      toast.error(
        `Cr. allocation cannot exceed Dr. advance (Rs. ${debitPool.toLocaleString("en-IN")} Dr., Rs. ${remainingPool.toLocaleString("en-IN")} Cr. left)`,
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

    const effectiveDebitPool = Math.max(
      Number(formData.amount) || 0,
      Number(ledgerTopSummary.debitEntryTotal) || 0,
    );
    const rowDebitLeft = Math.max(
      0,
      effectiveDebitPool - sumOpenAllocationsExcept(entry.uiKey),
    );

    if (
      allocationSource === "fresh" &&
      effectiveDebitPool <= 0.01 &&
      saveAllocated > 0.01
    ) {
      toast.error(
        "Enter payment received amount above before adjusting lorries",
      );
      return;
    }

    if (allocationSource === "fresh" && saveAllocated > rowDebitLeft + 1) {
      if (
        effectiveDebitPool <= 0.01 &&
        (ledgerBalance.totalAdvanceBalance || 0) > 0
      ) {
        toast.info(
          "Entry amount is Rs. 0. Switch to From Advance to use buyer Dr. balance.",
          { autoClose: 6000 },
        );
      } else {
        toast.error(
          `Exceeds entry total (Rs. ${rowDebitLeft.toLocaleString("en-IN")} left for this row)`,
        );
      }
      return;
    }

    const ledgerId = resolveLedgerIdForSave();

    const saveCompanyId = resolveCompanyIdForSave(entry);
    if (!isEditing && !saveCompanyId && !pairPayload.buyerCompany) {
      toast.error("Select buyer company filter, then save");
      return;
    }

    if (
      allocationSource === "advance" &&
      !String(pairPayload.supplierCompany || "").trim()
    ) {
      toast.error("Select seller company or use a lorry row with supplier");
      return;
    }

    try {
      setLoading(true);

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
        const recordLedgerType = "Buyer";

        const lineRemark = [
          entry.debitNote || "Due against lorry",
          entry.creditNote || "Allocation posted",
          entry.rowRemarks || "",
        ]
          .filter(Boolean)
          .join(" | ");

        const payload = {
          date: formData.allocationDate || formData.date,
          ledgerType: recordLedgerType,
          ledgerId: ledgerId || undefined,
          companyId: saveCompanyId,
          ...pairPayload,
          amount: saveAllocated,
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
            },
          ],
          remarks: lineRemark,
        };

        await api.post("/payment-received", payload);
        toast.success(
          allocationSource === "advance"
            ? `Cr. Rs. ${saveAllocated.toLocaleString("en-IN")} posted against ${entry.lorryNumber} (from Dr. advance)`
            : `Payment recorded for ${entry.lorryNumber}`,
        );

        setEntries((prev) =>
          prev.map((e) =>
            e.uiKey === entry.uiKey ? { ...e, isSaved: true } : e,
          ),
        );

        if (allocationSource === "fresh") {
          setFormData((prev) => ({
            ...prev,
            amount: Math.max(0, prev.amount - saveAllocated),
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
    if (!companyPair.supplierCompany) {
      toast.error(
        "Select seller company — advance is tracked buyer → seller only",
      );
      return;
    }

    const recordLedgerType = "Buyer";

    try {
      setLoading(true);
      const pairLabel = `${companyPair.buyerCompany} → ${companyPair.supplierCompany}`;
      const payload = {
        ...formData,
        date: formData.allocationDate || formData.date,
        ledgerType: recordLedgerType,
        companyId: formData.companyId,
        ...buildCompanyPayload(),
        paymentType: "Advance",
        mappings: [],
        remarks:
          formData.remarks?.trim() ||
          `Advance (Dr.) from buyer for ${pairLabel} · lorry-wise Cr. later`,
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

  const entryStats = useMemo(() => {
    let totalDue = 0;
    let pendingCount = 0;

    entries.forEach((entry) => {
      const details = calculateTallyDetails(entry);
      if (details.dueAmount <= 0.01) return;
      totalDue += details.dueAmount;
      if (entry.paymentStatus !== "done") {
        pendingCount++;
      }
    });

    return { totalDue, pendingCount };
  }, [entries]);

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
            <span className="w-3 h-3 rounded-full bg-amber-100 text-[8px] flex items-center justify-center text-amber-600 font-black">
              S
            </span>
            <span
              className={`text-[9px] font-black uppercase truncate ${
                matchCompanyName(row.supplierCompany, companyPair.supplierCompany)
                  ? "text-amber-700"
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
          <div className="flex flex-col gap-1.5 text-[9px] font-black min-w-[600px] uppercase">
            <div className="mb-1 flex items-center gap-2">
              <span className="bg-[#1e3a5f] text-white px-2 py-0.5 rounded text-[8px]">
                Sauda: {row.saudaNo}
              </span>
              {row.billNumber && (
                <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[8px]">
                  Bill: {row.billNumber}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2 items-center bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400">Date</span>
                <span className="text-slate-700 normal-case">
                  {new Date(formData.allocationDate || formData.date).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400">Debit note</span>
                <input
                  type="text"
                  value={row.debitNote || ""}
                  onChange={(e) => handleDebitNoteChange(row.uiKey, e.target.value)}
                  disabled={isLocked}
                  className={`h-7 px-2 rounded border text-[10px] font-bold normal-case ${
                    isLocked
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-white border-slate-300 focus:border-slate-700 outline-none"
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400">Debited payment</span>
                <span className="h-7 px-2 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-black flex items-center tabular-nums normal-case">
                  Rs. {details.dueAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400">Credit note</span>
                <input
                  type="text"
                  value={row.creditNote || ""}
                  onChange={(e) => handleCreditNoteChange(row.uiKey, e.target.value)}
                  disabled={isLocked}
                  className={`h-7 px-2 rounded border text-[10px] font-bold normal-case ${
                    isLocked
                      ? "bg-slate-100 text-slate-400 border-slate-200"
                      : "bg-white border-slate-300 focus:border-slate-700 outline-none"
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400">Credit amount</span>
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
                    className={`h-7 w-full px-2 rounded border text-[10px] font-black tabular-nums normal-case ${
                      isLocked
                        ? "bg-slate-100 text-slate-400 border-slate-200"
                        : "bg-emerald-50 border-emerald-300 text-emerald-800 focus:border-emerald-600 outline-none"
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
                      className="absolute -top-6 right-0 text-[8px] font-black uppercase text-emerald-700"
                    >
                      Max
                    </button>
                  )}
                </div>
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
          selectedCompanyOption={selectedCompanyOption}
          dateTotal={dateTotal}
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
          onSelectCreditPair={handleSelectCreditPair}
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
              onAutoAllocate={handleAutoAllocate}
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
