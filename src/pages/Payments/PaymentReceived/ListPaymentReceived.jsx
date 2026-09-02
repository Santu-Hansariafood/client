import { useState, useEffect, useCallback, useMemo, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import {
  FaMoneyBillWave,
  FaChartLine,
  FaCheckCircle,
  FaExclamationCircle,
  FaSync,
} from "react-icons/fa";

const SaudaMISSection = lazy(() => import("./components/SaudaMISSection"));
const MisStatCard = lazy(() => import("./components/MisStatCard"));
const MisFilterPanel = lazy(() => import("./components/MisFilterPanel"));
const MisVoucherLedger = lazy(() => import("./components/MisVoucherLedger"));
const MisLorryLedger = lazy(() => import("./components/MisLorryLedger"));
const MisPageHeader = lazy(() => import("./components/MisPageHeader"));
const PaymentVoucherPDF = lazy(() => import("./components/PaymentVoucherPDF"));
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);

import {
  buildTallyVoucherRows,
  calculateVoucherTotals,
  getLedgerRowClaimAmount,
} from "./utils/paymentLedgerUtils";
import Loading from "../../../common/Loading/Loading";

const ListPaymentReceived = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingEmailIds, setSendingEmailIds] = useState(new Set());
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("vouchers");
  const [ledgers, setLedgers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [fetchingLedgers, setFetchingLedgers] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
    search: "",
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
        setSellerCompanies(
          sellerCompaniesRes.data.data || sellerCompaniesRes.data || [],
        );

        const buyerCompaniesRes = await api.get("/buyers", {
          params: { limit: 0 },
        });
        setBuyerCompanies(
          buyerCompaniesRes.data.data || buyerCompaniesRes.data || [],
        );
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

  const buyerCompanyOptions = useMemo(() => {
    return allCompanies.map((c) => ({
      value: c._id,
      label: c.companyName,
    }));
  }, [allCompanies]);

  const sellerCompanyOptions = useMemo(() => {
    return sellerCompanies.map((c) => ({
      value: c.companyName,
      label: c.companyName,
    }));
  }, [sellerCompanies]);

  const primaryCompanyOptions = useMemo(() => {
    return buyerCompanyOptions;
  }, [buyerCompanyOptions]);

  const opposingCompanyOptions = useMemo(() => {
    return sellerCompanyOptions;
  }, [sellerCompanyOptions]);

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
  }, [filters.ledgerType, selectedCompany, selectedOpposingCompany]);

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
    } catch (error) {
      toast.error("Error fetching ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  const tallyListRows = useMemo(() => {
    return buildTallyVoucherRows(
      payments,
      openingBalance,
      [],
    );
  }, [payments, openingBalance]);

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

  const voucherTotals = useMemo(
    () => calculateVoucherTotals(tallyListRows),
    [tallyListRows],
  );

  const periodCredit = useMemo(
    () => tallyListRows.reduce((s, r) => s + (r.credit || 0), 0),
    [tallyListRows],
  );

  const totalUnadjusted = useMemo(() => {
    return payments.reduce((s, p) => s + (Number(p.unadjustedAmount) || 0), 0);
  }, [payments]);

  const handleRefresh = useCallback(() => {
    clearApiCache();
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchPayments();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchPayments]);

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      ledgerType: "",
      ledgerId: "",
      companyId: "",
      search: "",
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
    const ledger =
      buyerCompanies.find((b) =>
        (b.companyIds || b.companies || []).some((c) => {
          const cId = typeof c === "string" ? c : c._id;
          return cId === companyId;
        }),
      ) || null;
    setSelectedCompany(opt);
    setSelectedLedger(
      ledger
        ? {
            value: ledger._id,
            label: `${ledger.name} ${ledger.mobile ? `(${ledger.mobile})` : ""}`,
            companies: ledger.companyIds || ledger.companies || [],
          }
        : null,
    );
    setSelectedOpposingCompany(null);
    setSelectedSauda(null);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      companyId,
      ledgerId: ledger?._id || "",
      buyerCompany: opt?.label || "",
      supplierCompany: "",
    }));
  };

  const handleOpposingSelect = (opt) => {
    setSelectedOpposingCompany(opt);
    setSelectedSauda(null);
    setPage(1);

    if (filters.ledgerType === "Seller" && opt) {
      const sellerLedger = sellerCompanies.find(
        (s) => s.companyName === opt.label,
      );
      if (sellerLedger) {
        const ledger = ledgers.find((l) =>
          l.companies?.some(
            (c) => (typeof c === "string" ? c : c?.companyName) === opt.label,
          ),
        );
        setSelectedLedger(ledger || null);
        setFilters((prev) => ({
          ...prev,
          supplierCompany: opt?.label || "",
          ledgerId: ledger?.value || "",
        }));
        return;
      }
    }

    setFilters((prev) => ({
      ...prev,
      supplierCompany: opt?.label || "",
    }));
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const toWords = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + toWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          toWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + toWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          toWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + toWords(n % 100000) : "")
        );
      return (
        toWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + toWords(n % 10000000) : "")
      );
    };

    if (num === 0) return "Zero Rupees Only";

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = "";
    if (rupees > 0) {
      words += toWords(rupees) + " Rupees";
    }
    if (paise > 0) {
      words += (rupees > 0 ? " and " : "") + toWords(paise) + " Paise";
    }
    return words + " Only";
  };

  const generateMISReportPDF = async () => {
    clearApiCache();
    const params = {
      ...filters,
      limit: 5000,
    };

    const response = await api.get("/payment-received", {
      params,
    });

    const entryParams = {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      buyerCompany: filters.buyerCompany || undefined,
      supplierCompany: filters.supplierCompany || undefined,
      buyerId:
        filters.ledgerType === "Buyer"
          ? filters.ledgerId || undefined
          : undefined,
      supplier:
        filters.ledgerType === "Seller"
          ? filters.ledgerId || undefined
          : undefined,
      saudaNo: filters.saudaNo || undefined,
      limit: 5000,
    };
    const entriesRes = await api.get("/loading-entries", {
      params: entryParams,
    });
    const allEntries = entriesRes.data.data || [];

    const mappedEntries = (response.data.data || []).flatMap((payment) =>
      (payment.mappings || [])
        .map((mapping) => mapping.loadingEntryId)
        .filter(Boolean),
    );
    const reportEntriesById = new Map();
    [...allEntries, ...mappedEntries].forEach((entry) => {
      if (entry?._id) reportEntriesById.set(String(entry._id), entry);
    });

    const reportRows = buildTallyVoucherRows(
      response.data.data || [],
      openingBalance,
      Array.from(reportEntriesById.values()),
    );

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const getBase64 = (img) =>
      new Promise((resolve) => {
        const image = new Image();
        image.src = img;
        image.crossOrigin = "Anonymous";
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = () => resolve(null);
      });

    const logoBase64 = await getBase64("/logo/logo.png");

    const logoWidth = 40;
    const logoHeight = 20;
    const logoX = margin + 10;
    const logoY = 10;
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(26, 58, 95);
    doc.text("HANSARIA FOOD PRIVATE LIMITED", pageWidth / 2, 22, {
      align: "center",
    });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(64, 64, 64);
    doc.text(
      "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3",
      pageWidth / 2,
      29,
      { align: "center" },
    );
    doc.text("Bidhannagar, Kolkata, West Bengal - 700106", pageWidth / 2, 35, {
      align: "center",
    });

    doc.setLineWidth(0.5);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 40, pageWidth - margin, 40);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 95);
    doc.text("PARTY LEDGER", pageWidth / 2, 49, {
      align: "center",
    });

    doc.setLineWidth(0.5);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 54, pageWidth - margin, 54);

    let infoY = 58;
    const buyerName = filters.buyerCompany || "All";
    const sellerName = filters.supplierCompany || "All";
    const startDate = filters.startDate
      ? new Date(filters.startDate).toLocaleDateString("en-GB")
      : "All";
    const endDate = filters.endDate
      ? new Date(filters.endDate).toLocaleDateString("en-GB")
      : "All";

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
    doc.text(`: ${startDate} To ${endDate}`, pageWidth / 2 + 40, infoY + 10);

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

    let currentY = infoY + 40;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Please find the below payment details", margin, currentY + 5);
    currentY += 10;

    if (filters.ledgerId) {
      const formattedOpeningBalance = Number(openingBalance.toFixed(2));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Opening Balance:", margin, currentY + 5);
      doc.text(
        `Rs. ${formattedOpeningBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pageWidth - margin,
        currentY + 5,
        { align: "right" },
      );
      currentY += 10;
    }

    const calculateTallyDetails = (e) => {
      if (!e)
        return {
          netAmount: 0,
          dueAmount: 0,
          cdAmount: 0,
          gstAmount: 0,
          cdPercent: 0,
          gstPercent: 0,
          totalQualityClaims: 0,
          bankCharges: 0,
          secondClaim: 0,
          otherCharges: 0,
          tds: 0,
        };
      if (e.isRejected)
        return {
          netAmount: 0,
          dueAmount: 0,
          cdAmount: 0,
          gstAmount: 0,
          cdPercent: 0,
          gstPercent: 0,
          totalQualityClaims: 0,
          bankCharges: 0,
          secondClaim: 0,
          otherCharges: 0,
          tds: 0,
        };
      const weight =
        (e.unloadingWeight || 0) > 0 ? e.unloadingWeight : e.loadingWeight || 0;
      const rate = e.actualRate || 0;
      const cdPercent = e.cd || 0;
      const gstPercent = e.gst || 0;
      const grossAmount = weight * rate;
      const cdAmount = grossAmount * (cdPercent / 100);
      const amountAfterCd = grossAmount - cdAmount;
      const bankCharges = Number(e.bankCharges) || 0;
      const taxableAmount = amountAfterCd;
      const gstAmount = taxableAmount * (gstPercent / 100);
      const netAmountBeforeDeductions = taxableAmount + gstAmount;

      let totalQualityClaims = 0;
      if (e.qualityClaims && Array.isArray(e.qualityClaims)) {
        totalQualityClaims = e.qualityClaims.reduce((sum, claim) => {
          return sum + (Number(claim.claimAmount) || 0);
        }, 0);
      }

      const totalClaim = e.manualClaim
        ? Number(e.manualClaimAmount) || 0
        : totalQualityClaims;
      const secondClaim = Number(e.secondClaim) || 0;
      const otherCharges = Number(e.otherCharges) || 0;
      const tds = Number(e.tds) || 0;
      const netAmount = Math.max(
        0,
        netAmountBeforeDeductions -
          totalClaim -
          secondClaim -
          otherCharges -
          bankCharges -
          tds,
      );

      return {
        netAmount,
        dueAmount: Math.max(0, netAmount - (e.paidAmount || 0)),
        cdAmount,
        gstAmount,
        cdPercent,
        gstPercent,
        totalQualityClaims,
        bankCharges,
        secondClaim,
        otherCharges,
        tds,
      };
    };

    const extractRowData = (row) => {
      let saudaNo = "-";
      let lorryNo = "-";
      let unloadingWeight = null;
      let billNo = "-";
      let billAmount = 0;
      let paidAmount = 0;
      let payableAmount = 0;
      let remarks = "-";
      let qualityClaims = [];
      let cdAmount = 0;
      let gstAmount = 0;
      let cdPercent = 0;
      let gstPercent = 0;
      let totalQualityClaims = 0;
      let bankCharges = 0;
      let paymentClaimAmount = 0;
      let paymentTdsAmount = 0;
      let secondClaim = 0;
      let otherCharges = 0;

      if (row.isOpening) {
        return {
          saudaNo,
          lorryNo,
          unloadingWeight,
          billNo,
          billAmount,
          paidAmount,
          payableAmount,
          remarks,
          qualityClaims,
          cdAmount,
          gstAmount,
          cdPercent,
          gstPercent,
          totalQualityClaims,
          bankCharges,
          secondClaim,
          otherCharges,
          paymentTdsAmount,
          paymentClaimAmount,
        };
      }

      const raw = row.raw;
      if (raw?.uiType === "entry") {
        const details = calculateTallyDetails(raw);
        saudaNo = raw.saudaNo || "-";
        lorryNo = raw.lorryNumber || "-";
        unloadingWeight = raw.unloadingWeight || null;
        billNo = raw.billNumber || "-";
        billAmount = details.netAmount;
        paidAmount = raw.paidAmount || 0;
        payableAmount = details.dueAmount;
        remarks = raw.generalRemarks || raw.remarks || row.particulars || "-";
        qualityClaims = raw.qualityClaims || [];
        cdAmount = details.cdAmount;
        gstAmount = details.gstAmount;
        cdPercent = details.cdPercent;
        gstPercent = details.gstPercent;
        totalQualityClaims = details.totalQualityClaims;
        bankCharges = details.bankCharges;
      } else if (raw?.mappings?.length > 0) {
        const firstMapping = raw.mappings[0];
        const loadingEntry = firstMapping?.loadingEntryId;
        const details = calculateTallyDetails(loadingEntry);
        saudaNo = firstMapping?.saudaNo || loadingEntry?.saudaNo || "-";
        lorryNo = loadingEntry?.lorryNumber || "-";
        unloadingWeight = loadingEntry?.unloadingWeight || null;
        billNo = loadingEntry?.billNumber || "-";
        billAmount = details.netAmount;
        paidAmount = Number(firstMapping?.allocatedAmount || 0);
        payableAmount = details.dueAmount;
        remarks =
          firstMapping?.generalRemarks ||
          firstMapping?.remarks ||
          raw.remarks ||
          row.particulars ||
          "-";
        qualityClaims = loadingEntry?.qualityClaims || [];
        cdAmount = details.cdAmount;
        gstAmount = details.gstAmount;
        cdPercent = details.cdPercent;
        gstPercent = details.gstPercent;
        totalQualityClaims = details.totalQualityClaims;
        bankCharges = details.bankCharges;
        secondClaim = details.secondClaim;
        otherCharges = details.otherCharges;
        paymentTdsAmount = details.tds;
        paymentClaimAmount = Number(raw?.claim) || 0;
      } else {
        remarks = row.particulars;
      }

      let displayLorryNo = lorryNo;
      if (unloadingWeight) {
        const formattedWeight = Number(unloadingWeight).toFixed(3);
        displayLorryNo = `${lorryNo} (${formattedWeight} T)`;
      }

      return {
        saudaNo,
        lorryNo: displayLorryNo,
        billNo,
        billAmount,
        paidAmount,
        payableAmount,
        remarks,
        qualityClaims,
        cdAmount,
        gstAmount,
        cdPercent,
        gstPercent,
        totalQualityClaims,
        bankCharges,
        paymentClaimAmount,
        paymentTdsAmount,
        secondClaim,
        otherCharges,
      };
    };

    const groupedByCompanySauda = {};
    [...reportRows]
      .sort((a, b) => {
        const companyA = `${a.buyerCompany || ""} ${a.supplierCompany || ""}`;
        const companyB = `${b.buyerCompany || ""} ${b.supplierCompany || ""}`;
        return (
          companyA.localeCompare(companyB) ||
          String(a.raw?.saudaNo || a.saudaNo || "").localeCompare(
            String(b.raw?.saudaNo || b.saudaNo || ""),
            undefined,
            { numeric: true },
          )
        );
      })
      .forEach((row) => {
        const rowData = extractRowData(row);
        const saudaKey = rowData.saudaNo || "NO SAUDA";
        const buyerCompany = row.buyerCompany || "NO BUYER";
        const supplierCompany = row.supplierCompany || "NO SELLER";
        const groupKey = `${buyerCompany}::${supplierCompany}::${saudaKey}`;
        if (!groupedByCompanySauda[groupKey]) {
          groupedByCompanySauda[groupKey] = {
            buyerCompany,
            supplierCompany,
            saudaKey,
            rows: [],
          };
        }
        groupedByCompanySauda[groupKey].rows.push({ row, rowData });
      });

    const tableData = [];
    const saudaTotals = {};
    let ledgerDebitTotal = 0;
    let ledgerCreditTotal = 0;

    Object.values(groupedByCompanySauda).forEach(
      ({ buyerCompany, supplierCompany, saudaKey, rows: group }) => {
        let saudaDebitTotal = 0;
        let saudaCreditTotal = 0;
        let saudaPaidTotal = 0;
        let saudaCdTotal = 0;
        let saudaGstTotal = 0;
        let saudaQualityClaimsTotal = 0;
        let saudaBankChargesTotal = 0;

        tableData.push([
          {
            content: `BUYER: ${buyerCompany} | SAUDA NO: ${saudaKey}`,
            colSpan: 5,
            styles: {
              fillColor: [200, 200, 200],
              fontStyle: "bold",
              halign: "center",
            },
          },
        ]);

        group.forEach(({ row, rowData }) => {

          const credit = Number(row.credit) || 0;
          const isEntryRow = row.raw?.uiType === "entry";
          const displayClaimAmount = getLedgerRowClaimAmount(row);

          let gst = rowData.gstAmount || 0;
          let claims =
            displayClaimAmount ||
            rowData.totalQualityClaims + rowData.paymentClaimAmount;
          let cd = rowData.cdAmount || 0;
          let bankCharges = rowData.bankCharges || 0;
          let balance = Number(row.balance || 0);
          const displayCredit = isEntryRow
            ? 0
            : Math.max(credit, Number(rowData.paidAmount) || 0);

          if (isEntryRow) {
            gst = row.gstAmount || 0;
            claims = Number(
              displayClaimAmount ||
                rowData.totalQualityClaims + rowData.paymentClaimAmount ||
                row.raw?.manualClaimAmount ||
                0,
            );
            cd = Number(row.cdAmount || 0);
            bankCharges = Number(row.bankCharges || 0);
            balance = Number(row.debit || row.balance || 0);

            saudaCdTotal += cd;
            saudaGstTotal += gst;
            saudaQualityClaimsTotal += claims;
            saudaBankChargesTotal += bankCharges;
          }

          const unloadingDebit = isEntryRow
            ? (Number(row.raw?.unloadingWeight) || 0) *
              (Number(row.raw?.actualRate || row.raw?.rate) || 0)
            : Number(row.debit) || 0;
          saudaDebitTotal += unloadingDebit + gst - claims - cd - bankCharges;
          saudaCreditTotal += displayCredit;
          saudaPaidTotal += rowData.paidAmount;

          const formattedCredit = Number(displayCredit.toFixed(2));
          const formattedDebit = Number(
            Math.max(0, unloadingDebit + gst - claims - cd - bankCharges).toFixed(2),
          );
          ledgerDebitTotal += formattedDebit;
          ledgerCreditTotal += formattedCredit;
          const entryDate = isEntryRow
            ? row.raw?.loadingDate || row.raw?.unloadingDate || row.date
            : row.date;
          const mappedLorries = !isEntryRow
            ? (row.raw?.mappings || [])
                .map((mapping) => {
                  const entry = mapping.loadingEntryId || {};
                  const lorry = entry.lorryNumber || "-";
                  const bill = entry.billNumber || "-";
                  return `LORRY: ${lorry}${bill !== "-" ? ` / BILL: ${bill}` : ""}`;
                })
                .filter(Boolean)
                .join(" | ")
            : "";
          const adjustmentParts = [
            gst > 0 ? `GST +${gst.toFixed(2)}` : "",
            cd > 0 ? `CD -${cd.toFixed(2)}` : "",
            claims > 0 ? `CLAIM -${claims.toFixed(2)}` : "",
            bankCharges > 0 ? `BANK CHARGES -${bankCharges.toFixed(2)}` : "",
          ].filter(Boolean);
          const particulars = [
            `BUYER: ${(row.buyerCompany || buyerCompany || "-").toUpperCase()}`,
            rowData.saudaNo !== "-" ? `SAUDA: ${rowData.saudaNo}` : "",
            mappedLorries || (rowData.lorryNo !== "-" ? `LORRY: ${rowData.lorryNo}` : ""),
            !mappedLorries && rowData.billNo !== "-" ? `BILL: ${rowData.billNo}` : "",
            isEntryRow ? "BILL ENTRY" : `PAYMENT${row.raw?.paymentType ? ` (${row.raw.paymentType})` : ""}`,
            adjustmentParts.length > 0 ? adjustmentParts.join(" | ") : "",
            !isEntryRow && rowData.remarks !== "-" ? rowData.remarks : "",
          ]
            .filter(Boolean)
            .join(" | ");

          const statusText = row.raw?.isRejected
            ? "REJECTED"
            : Number(row.raw?.unloadingWeight || row.raw?.loadingWeight || 0) === 0
              ? "UNLOADING 0"
              : "";

          tableData.push([
            entryDate ? new Date(entryDate).toLocaleDateString("en-GB") : "-",
            `${particulars}${statusText ? ` | ${statusText}` : ""}`,
            formattedDebit > 0
              ? `Rs. ${formattedDebit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "",
            formattedCredit > 0
              ? `Rs. ${formattedCredit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "",
            balance !== 0
              ? `Rs. ${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "",
          ]);
        });

        const saudaBalance = Number(saudaDebitTotal.toFixed(2));
        tableData.push([
          {
            content: `TOTAL FOR SAUDA ${saudaKey}`,
            colSpan: 2,
            styles: {
              fontStyle: "bold",
              halign: "right",
            },
          },
          `Rs. ${saudaDebitTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `Rs. ${Number(saudaCreditTotal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `Rs. ${saudaBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ]);

        const saudaDifference = Number(
          (saudaDebitTotal - saudaCreditTotal).toFixed(2),
        );
        const saudaDifferenceText =
          saudaDifference > 0
            ? `Rs. ${saudaDifference.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr`
            : saudaDifference < 0
              ? `Rs. ${Math.abs(saudaDifference).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`
              : "NIL";
        tableData.push([
          {
            content: `DIFFERENCE FOR SAUDA ${saudaKey}`,
            colSpan: 2,
            styles: {
              fontStyle: "bold",
              textColor: [26, 58, 95],
              halign: "right",
            },
          },
          "",
          saudaDifferenceText,
          "",
        ]);

        saudaTotals[`${buyerCompany}::${supplierCompany}::${saudaKey}`] = {
          debit: saudaBalance,
          credit: saudaCreditTotal,
        };
      },
    );

    if (tableData.length === 0) {
      tableData.push([
        {
          content: "No records found",
          colSpan: 5,
          styles: {
            halign: "center",
            fontStyle: "bold",
          },
        },
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          "DATE",
          "PARTICULARS",
          "DEBIT (Dr.)",
          "CREDIT (Cr.)",
          "BALANCE",
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
        0: { halign: "center", cellWidth: 22 },
        1: { cellWidth: 115, overflow: "linebreak", halign: "left" },
        2: { halign: "right", cellWidth: 28 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 28 },
      },
      margin: { left: 7, right: 7, top: 7, bottom: 15 },
      tableWidth: "wrap",
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();

        doc.setLineWidth(0.2);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );
        doc.text("Confidential", pageWidth - margin, pageHeight - 8, {
          align: "right",
        });
      },
    });

    let grandTotalCd = 0;
    let grandTotalGst = 0;
    let grandTotalQualityClaims = 0;
    let grandTotalBankCharges = 0;
    let totalGross = ledgerDebitTotal;
    let totalCredit = ledgerCreditTotal;

    reportRows.forEach((row) => {
      if (!row.isOpening) {
        if (row.raw?.uiType === "entry") {
          const grossAmount = row.grossAmount || 0;

          const rowData = extractRowData(row);
          grandTotalCd += row.cdAmount || 0;
          grandTotalGst += row.gstAmount || 0;
          grandTotalQualityClaims +=
            row.totalClaims ||
            rowData.totalQualityClaims + rowData.paymentClaimAmount;
          grandTotalBankCharges += row.bankCharges || 0;
        }
      }
    });

    const totalGrossNum = Number(totalGross.toFixed(2));
    const totalCreditNum = Number(totalCredit.toFixed(2));
    const difference = Number(
      (Number(openingBalance || 0) + totalGrossNum - totalCreditNum).toFixed(2),
    );

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

    const formattedTotalGross = Number(totalGross.toFixed(2));
    doc.text(
      "TOTAL DEBIT",
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

    const formattedTotalCredit = Number(totalCredit.toFixed(2));
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

    const formattedTotalCd = Number(grandTotalCd.toFixed(2));
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

    const formattedTotalGst = Number(grandTotalGst.toFixed(2));
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

    const formattedTotalClaims = Number(grandTotalQualityClaims.toFixed(2));
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

    const formattedTotalBankCharges = Number(grandTotalBankCharges.toFixed(2));
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

    let bankSectionY = summaryY + 20;

    let sellerCompanyData = null;
    const sellerCompanyName =
      filters.ledgerType === "Buyer"
        ? selectedOpposingCompany?.label
        : filters.ledgerType === "Seller"
          ? selectedCompany?.label
          : filters.supplierCompany;

    if (sellerCompanyName) {
      sellerCompanyData = sellerCompanies.find(
        (c) =>
          c.companyName === sellerCompanyName ||
          (selectedOpposingCompany &&
            c._id === selectedOpposingCompany.value) ||
          (selectedCompany && c._id === selectedCompany.value),
      );
    }

    const bankDetails = sellerCompanyData?.bankDetails?.[0];

    let separatorY = bankSectionY + 30;

    if (bankDetails) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 58, 95);
      doc.text("BANK ACCOUNT DETAILS", margin, bankSectionY);

      const boxY = bankSectionY + 5;
      const boxHeight = 28;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(210);
      doc.roundedRect(
        margin,
        boxY,
        pageWidth - margin * 2,
        boxHeight,
        2,
        2,
        "FD",
      );

      doc.setFontSize(8.5);
      doc.setTextColor(40);

      const leftX = margin + 8;
      const rightX = pageWidth / 2 + 10;

      doc.setFont("helvetica", "bold");
      doc.text("Beneficiary :", leftX, boxY + 9);
      doc.setFont("helvetica", "normal");
      doc.text(
        bankDetails.accountHolderName || sellerCompanyName || "-",
        leftX + 28,
        boxY + 9,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Bank :", rightX, boxY + 9);
      doc.setFont("helvetica", "normal");
      doc.text(bankDetails.bankName || "-", rightX + 16, boxY + 9);

      doc.setFont("helvetica", "bold");
      doc.text("Account No. :", leftX, boxY + 19);
      doc.setFont("courier", "bold");
      doc.text(bankDetails.accountNumber || "-", leftX + 28, boxY + 19);

      doc.setFont("helvetica", "bold");
      doc.text("IFSC :", rightX, boxY + 19);
      doc.setFont("courier", "bold");
      doc.text(bankDetails.ifscCode || "-", rightX + 16, boxY + 19);

      separatorY = boxY + boxHeight + 5;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 58, 95);
      doc.text("Bank Account Details", margin, bankSectionY + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("No bank details available", margin + 10, bankSectionY + 15);

      separatorY = bankSectionY + 25;
    }

    doc.setLineWidth(0.2);
    doc.line(margin, separatorY, pageWidth - margin, separatorY);

    let finalSectionY = separatorY + 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      "OPENING BALANCE + TOTAL DEBIT - TOTAL CREDIT = DIFFERENCE",
      margin + 10,
      finalSectionY + 5,
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const formulaLine1 = `Rs. ${Number(openingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Opening) + Rs. ${totalGrossNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Total Debit)`;
    const formulaLine2 = ` - Rs. ${totalCreditNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Total Credit)`;
    const formulaLine3 = ` = Rs. ${difference.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${difference > 0 ? "Dr" : difference < 0 ? "Cr" : "NIL"})`;
    doc.text(formulaLine1, margin + 10, finalSectionY + 15);
    doc.text(formulaLine2, margin + 10, finalSectionY + 25);
    doc.text(formulaLine3, margin + 10, finalSectionY + 35);

    try {
      const qrText = encodeURIComponent(
        `HANSARIA FOOD PRIVATE LIMITED\nPayment MIS Report\nGross: ${totalGross}\nCredit: ${totalCredit}`,
      );
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;
      await doc.addImage(
        qrUrl,
        "PNG",
        pageWidth - margin - 45 - 15,
        finalSectionY,
        35,
        35,
      );
    } catch (qrError) {
      console.log("QR code not added:", qrError);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(
      `For ${filters.buyerCompany || "HANSARIA FOOD PRIVATE LIMITED"}`,
      pageWidth - margin,
      finalSectionY + 55,
      { align: "right" },
    );
    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", pageWidth - margin, finalSectionY + 64, {
      align: "right",
    });
    doc.line(
      pageWidth - 75,
      finalSectionY + 61,
      pageWidth - margin,
      finalSectionY + 61,
    );

    const pageCount = doc.internal.getNumberOfPages();

    doc.setPage(pageCount);
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Note: This is based on the buyer or supplier company provided data. This is not for the actual data. This is for the reference purpose not for legal use.",
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" },
    );

    doc.setLineWidth(0.2);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Page ${pageCount} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    );
    doc.text(
      `Printed on: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 8,
    );
    doc.text("Confidential", pageWidth - margin, pageHeight - 8, {
      align: "right",
    });

    return doc;
  };

  const generatePaymentAdvicePDF = async () => {
    const params = {
      ...filters,
      limit: 5000,
    };

    const response = await api.get("/payment-received", {
      params,
    });

    let allEntries = [];
    if (
      filters.ledgerType &&
      (filters.buyerCompany || filters.supplierCompany)
    ) {
      const entryParams = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 1000,
      };
      if (filters.buyerCompany) entryParams.buyerCompany = filters.buyerCompany;
      if (filters.supplierCompany)
        entryParams.supplierCompany = filters.supplierCompany;

      const entriesRes = await api.get("/loading-entries", {
        params: entryParams,
      });
      allEntries = entriesRes.data.data || [];
    }

    const reportRows = buildTallyVoucherRows(
      response.data.data || [],
      openingBalance,
      allEntries,
    );

    if (reportRows.length === 0) {
      throw new Error("No records found");
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

    const payments = response.data.data || [];

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
        head: [["NO", "DATE", "VOUCHER NO", "MODE", "AMOUNT"]],
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

    const entriesWithClaims = allEntries.filter(
      (e) =>
        e.qualityClaims &&
        e.qualityClaims.length > 0 &&
        e.qualityClaims.some((c) => Number(c.claimAmount) > 0),
    );

    if (entriesWithClaims.length > 0) {
      const claimTableData = [];
      let claimIdx = 1;
      entriesWithClaims.forEach((entry) => {
        const validClaims = entry.qualityClaims.filter(
          (c) => Number(c.claimAmount) > 0,
        );
        validClaims.forEach((claim) => {
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
            [
              "NO",
              "SAUDA NO",
              "LORRY NO",
              "BILL NO",
              "PARAMETER",
              "CLAIM AMOUNT",
            ],
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

    doc.setFontSize(9);
    doc.text("Authorised Signatory", pageWidth - margin, finalY + 20, {
      align: "right",
    });
    doc.line(pageWidth - 60, finalY + 17, pageWidth - margin, finalY + 17);

    return doc;
  };

  const handlePrintReport = async () => {
    try {
      setPrinting(true);
      const doc = await generateMISReportPDF();
      const buyerName = filters.buyerCompany
        ? filters.buyerCompany.replace(/[^a-zA-Z0-9]/g, "_")
        : "All_Buyers";
      const sellerName = filters.supplierCompany
        ? filters.supplierCompany.replace(/[^a-zA-Z0-9]/g, "_")
        : "All_Sellers";
      const startDate = filters.startDate ? filters.startDate : "All";
      const endDate = filters.endDate ? filters.endDate : "All";
      doc.save(
        `MIS_PaymentReceived_${buyerName}_${sellerName}_${startDate}_to_${endDate}.pdf`,
      );
      toast.success("MIS Report generated successfully");
    } catch (error) {
      console.error("Print Error:", error);
      if (error.message === "No records found") {
        toast.warning(error.message);
      } else {
        toast.error("Failed to generate MIS Report");
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPaymentAdvice = async () => {
    try {
      setPrinting(true);
      const doc = await generatePaymentAdvicePDF();
      doc.save(
        `Payment_Advice_${filters.startDate || "All"}_to_${filters.endDate || "All"}.pdf`,
      );
      toast.success("Payment Advice generated successfully");
    } catch (error) {
      console.error("Payment Advice Error:", error);
      if (error.message === "No records found") {
        toast.warning(error.message);
      } else {
        toast.error("Failed to generate Payment Advice");
      }
    } finally {
      setPrinting(false);
    }
  };

  const handleSendEmail = async (reportType) => {
    try {
      setSendingEmail(true);

      const sellerCompanyName =
        filters.ledgerType === "Buyer"
          ? selectedOpposingCompany?.label
          : filters.ledgerType === "Seller"
            ? selectedCompany?.label
            : filters.supplierCompany;

      if (!sellerCompanyName) {
        toast.error("Please select a seller company");
        return;
      }

      const sellerCompanyData = sellerCompanies.find(
        (c) =>
          c.companyName === sellerCompanyName ||
          (selectedOpposingCompany &&
            c._id === selectedOpposingCompany.value) ||
          (selectedCompany && c._id === selectedCompany.value),
      );

      if (!sellerCompanyData?.email) {
        toast.error("No email found for the selected seller company");
        return;
      }

      let doc;
      if (reportType === "MIS") {
        doc = await generateMISReportPDF();
      } else {
        doc = await generatePaymentAdvicePDF();
      }

      const pdfBase64 = doc.output("datauristring").split(",")[1];

      await api.post("/email/send-payment-received", {
        pdf: pdfBase64,
        recipientEmail: sellerCompanyData.email,
        reportType: reportType === "MIS" ? "MIS" : "PaymentAdvice",
        startDate: filters.startDate,
        endDate: filters.endDate,
        buyerCompany: filters.buyerCompany,
        supplierCompany: filters.supplierCompany,
      });

      toast.success("Email sent successfully!");
    } catch (error) {
      console.error("Send Email Error:", error);
      if (error.message === "No records found") {
        toast.warning(error.message);
      } else {
        toast.error("Failed to send email");
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const generateIndividualQRCode = async (row) => {
    const getValue = (...candidates) => {
      for (const value of candidates) {
        if (
          value &&
          String(value).trim() !== "" &&
          String(value).trim() !== "N/A"
        ) {
          return String(value).trim();
        }
      }
      return "-";
    };

    const firstMapping = row.raw?.mappings?.[0];
    const loadingEntry = firstMapping?.loadingEntryId;
    const billNo = getValue(
      loadingEntry?.billNumber,
      row.raw?.billNo,
      row.raw?.billNumber,
      row.billNo,
    );
    const saudaNo = getValue(
      firstMapping?.saudaNo,
      loadingEntry?.saudaNo,
      row.raw?.saudaNo,
      row.saudaNo,
    );
    const lorryNo = getValue(
      loadingEntry?.lorryNumber,
      row.raw?.lorryNumber,
      row.lorryNo,
    );

    const totalAmount = Math.max(
      Number(row.debit || 0),
      Number(row.credit || 0),
    );
    const qrText = [
      "HANSARIA FOOD PRIVATE LIMITED",
      `Date: ${row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-"}`,
      `Voucher No: ${row.raw?.voucherNo || row.id || "-"}`,
      `Buyer: ${row.buyerCompany || "-"}`,
      `Seller: ${row.supplierCompany || "-"}`,
      `Sauda No: ${saudaNo}`,
      `Lorry No: ${lorryNo}`,
      `Bill No: ${billNo}`,
      `Amount: Rs. ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ].join("\n");

    return await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  };

  const handleSendIndividualEmail = async ({
    row,
    buyerCompany,
    sellerCompany,
  }) => {
    try {
      setSendingEmailIds((prev) => new Set([...prev, row.id]));

      if (!sellerCompany?.email) {
        toast.error("No email found for the seller company");
        return;
      }

      const qrCodeUrl = await generateIndividualQRCode(row);

      const blob = await pdf(
        <PaymentVoucherPDF
          row={row}
          buyerCompany={buyerCompany}
          sellerCompany={sellerCompany}
          qrCodeUrl={qrCodeUrl}
          voucherNumber={1}
        />,
      ).toBlob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const pdfBase64 = await new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result.split(",")[1]);
        };
      });

      await api.post("/email/send-payment-received", {
        pdf: pdfBase64,
        recipientEmail: sellerCompany.email,
        reportType: "IndividualVoucher",
        individualPaymentId: row.raw?._id || row.id,
      });

      toast.success("Email sent successfully!");
    } catch (error) {
      console.error("Send Individual Email Error:", error);
      toast.error("Failed to send email");
    } finally {
      setSendingEmailIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(row.id);
        return newSet;
      });
    }
  };

  const handleEdit = (payment) => {
    navigate(`/payments/received/add?id=${payment._id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        setLoading(true);
        await api.delete(`/payment-received/${id}`);
        toast.success("Payment deleted successfully!");
        fetchPayments();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting payment");
      } finally {
        setLoading(false);
      }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <MisPageHeader activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaSync size={12} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => navigate("/payments/received/add")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#1e3a5f]/10 hover:from-[#172d4d] hover:to-[#254970] active:scale-[0.98] transition-all"
              >
                + New Payment
              </button>
            </div>
          </div>

          {activeTab === "vouchers" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4">
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
                  label="Unadjusted / Advance"
                  value={`₹ ${Number(totalUnadjusted).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subValue="On Account"
                  accent="amber"
                />
                <MisStatCard
                  icon={<FaExclamationCircle size={18} />}
                  label="Vouchers"
                  value={stats.count.toString()}
                  subValue="In view"
                  accent="green"
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
                onRecordPayment={() => navigate("/payments/received/add")}
                onSendEmail={handleSendEmail}
                printing={printing}
                sendingEmail={sendingEmail}
                printDisabled={loading || printing}
                ledgerTypeDisabled={false}
              />

              {fetchingLorryWise ? (
                <Loading />
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
                    <p className="font-bold text-slate-800">
                      No lorries for this sauda
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Sauda {selectedSauda.label} has no loading entries in the
                      system.
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
                  onSendEmail={handleSendIndividualEmail}
                  sendingEmailIds={sendingEmailIds}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  totals={voucherTotals}
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
