import {
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import {
  FaPlus,
  FaTrash,
  FaUniversity,
  FaSave,
  FaEdit,
  FaChevronDown,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { pdf } from "@react-pdf/renderer";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";
import AdjustedSaudasSection from "./components/AdjustedSaudasSection";
import DateWiseTotalsSection from "./components/DateWiseTotalsSection";
import FinanceReportFilters from "./components/FinanceReportFilters";
import PurchaseOrdersSection from "./components/PurchaseOrdersSection";
import SaudaMappingPdf from "./components/SaudaMappingPdf";

import Buttons from "../../../common/Buttons/Buttons";
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const getAdjustmentStatus = (buyingQuantity, sellingQuantity) =>
  buyingQuantity !== null &&
  Math.abs(Number(buyingQuantity || 0) - Number(sellingQuantity || 0)) < 0.01
    ? "Equal"
    : "Not Equal";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const formatOptionalNumber = (value) =>
  value === undefined || value === null || value === ""
    ? "-"
    : formatNumber(value);

const formatDateParam = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FinanceReport = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [consignees, setConsignees] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [exportingFormat, setExportingFormat] = useState("");
  const [page, setPage] = useState(1);
  const [adjustedSaudasPage, setAdjustedSaudasPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateWiseTotals, setDateWiseTotals] = useState([]);
  const [adjustmentRows, setAdjustmentRows] = useState([]);
  const [paginatedAdjustmentRows, setPaginatedAdjustmentRows] = useState([]);
  const [adjustedSaudasTotal, setAdjustedSaudasTotal] = useState(0);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const adjustmentLookupRef = useRef(null);
  const [saudaRows, setSaudaRows] = useState([
    {
      id: Date.now(),
      saudaNo: "",
      saudaNos: [],
      buyerSaudaNo: "",
      buyerCompany: "",
      buyerQuantity: null,
      sellerCompany: "",
      saudaOptions: [],
      manualAdjustment: "",
      saudaDetails: [],
      purchaseQuantity: null,
      consignee: "",
      pendingQuantity: null,
      status: "",
    },
  ]);
  const itemsPerPage = 10;

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/financers/report", {
        params: {
          page,
          limit: itemsPerPage,
          adjustmentPage: adjustedSaudasPage,
          adjustmentLimit: itemsPerPage,
          startDate: formatDateParam(fromDate),
          endDate: formatDateParam(toDate),
          consignee: selectedConsignee || undefined,
        },
      });
      setOrders(response.data?.data || []);
      setConsignees(response.data?.consigneeOptions || []);
      setTotal(Number(response.data?.total) || 0);
      setDateWiseTotals(response.data?.dateWiseTotals || []);
      setAdjustmentRows(response.data?.adjustments || []);
      setPaginatedAdjustmentRows(response.data?.adjustedSaudas || []);
      setAdjustedSaudasTotal(Number(response.data?.adjustedSaudasTotal) || 0);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load finance report",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    adjustedSaudasPage,
    fromDate,
    toDate,
    selectedConsignee,
  ]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const loadSellerFinancerCompanies = async () => {
      try {
        const response = await api.get("/financers/pending-options");
        setSellerCompanies(response.data?.sellerCompanies || []);
      } catch (error) {
        setSellerCompanies([]);
        toast.error(
          error.response?.data?.message ||
            "Failed to load financer seller companies",
        );
      }
    };
    loadSellerFinancerCompanies();
  }, []);

  useEffect(() => {
    if (selectedConsignee && !consignees.includes(selectedConsignee)) {
      setSelectedConsignee("");
      setPage(1);
    }
  }, [consignees, selectedConsignee]);

  const lookupSauda = async (
    rowId,
    saudaNos,
    sellerCompany,
    manualAdjustment,
    buyerSaudaNoOverride,
    buyerCompanyOverride,
  ) => {
    const currentRow = saudaRows.find((row) => row.id === rowId);
    const buyerSaudaNo = buyerSaudaNoOverride ?? currentRow?.buyerSaudaNo ?? "";
    const buyerCompany = buyerCompanyOverride ?? currentRow?.buyerCompany ?? "";
    const values = (Array.isArray(saudaNos) ? saudaNos : [saudaNos])
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const value = values.join(",");
    const company = String(sellerCompany || "").trim();
    const adjustment = Math.max(0, Number(manualAdjustment || 0));
    if (!values.length || !company) {
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                status: !values.length
                  ? "Select Sauda No"
                  : "Select seller company",
              }
            : row,
        ),
      );
      return;
    }
    try {
      const response = await api.get("/financers/report", {
        params: {
          saudaNos: value,
          sellerCompany: company,
          buyerSaudaNo: buyerSaudaNo || undefined,
          buyerCompany: buyerCompany || undefined,
          manualAdjustment: adjustment,
          page: 1,
          limit: 100,
        },
      });
      const adjustments = response.data?.adjustments || [];
      const matches = response.data?.data || [];
      const details = values
        .map((saudaNo) => {
          const match = matches.find(
            (item) =>
              String(item.saudaNo).toLowerCase() === saudaNo.toLowerCase(),
          );
          const adjustment = adjustments.find(
            (item) =>
              String(item.saudaNo).toLowerCase() === saudaNo.toLowerCase() &&
              String(item.sellerCompany).toLowerCase() ===
                company.toLowerCase() &&
              (!buyerSaudaNo ||
                String(item.buyerSaudaNo || "").toLowerCase() ===
                  buyerSaudaNo.toLowerCase()) &&
              (!buyerCompany ||
                String(item.buyerCompany || "").toLowerCase() ===
                  buyerCompany.toLowerCase()),
          );
          return match
            ? {
                ...match,
                adjustmentId: adjustment?._id || "",
                adjustmentDate: adjustment?.adjustmentDate || "",
                adjustmentQuantity: Number(adjustment?.adjustmentQuantity || 0),
                pendingQuantity: Math.max(
                  0,
                  Number(match.quantity || 0) -
                    Number(adjustment?.adjustmentQuantity || 0),
                ),
              }
            : null;
        })
        .filter(Boolean);
      const purchaseQuantity = details.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );
      const currentAdjustment = details.reduce(
        (total, item) => total + Number(item.adjustmentQuantity || 0),
        0,
      );
      const effectiveAdjustment = currentRow?.buyerSaudaNo
        ? Number(currentRow.manualAdjustment || currentRow.buyerQuantity || 0)
        : currentAdjustment || Number(currentRow?.manualAdjustment || 0);
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id !== rowId
            ? row
            : {
                ...row,
                sellerCompany: company,
                saudaNo: values.join(", "),
                saudaNos: values,
                saudaDetails: details,
                saudaDate: details[0]?.poDate || null,
                purchaseQuantity,
                consignee: details[0]?.consignee || "",
                adjustmentId: "",
                adjustmentDate: details[0]?.adjustmentDate || "",
                manualAdjustment: String(
                  row.buyerSaudaNo
                    ? row.manualAdjustment || row.buyerQuantity || ""
                    : currentAdjustment || row.manualAdjustment || "",
                ),
                pendingQuantity: Math.max(
                  0,
                  purchaseQuantity - effectiveAdjustment,
                ),
                status:
                  details.length === values.length
                    ? getAdjustmentStatus(
                        purchaseQuantity,
                        currentRow?.buyerSaudaNo
                          ? currentRow.buyerQuantity
                          : effectiveAdjustment,
                      )
                    : "Some Sauda not found",
              },
        ),
      );
    } catch (error) {
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id === rowId ? { ...row, status: "Lookup failed" } : row,
        ),
      );
      toast.error(error.response?.data?.message || "Failed to find Sauda");
    }
  };

  const loadSaudaOptions = async (
    rowId,
    sellerCompany,
    consignee = selectedConsignee,
  ) => {
    if (!sellerCompany) return;
    try {
      const response = await api.get("/financers/pending-options", {
        params: { sellerCompany, consignee: consignee || undefined },
      });
      const normalizedConsignee = String(consignee || "")
        .trim()
        .toLowerCase();
      const saudaOptions = (response.data?.saudaNumbers || []).filter(
        (option) =>
          !normalizedConsignee ||
          String(option.consignee || "")
            .trim()
            .toLowerCase() === normalizedConsignee,
      );
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                saudaOptions,
                saudaNo: "",
                adjustmentId: "",
                purchaseQuantity: null,
                consignee: row.buyerSaudaNo ? row.consignee : "",
                pendingQuantity: null,
                status: "",
              }
            : row,
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load Sauda numbers",
      );
    }
  };

  useEffect(() => {
    saudaRows.forEach((row) => {
      if (row.sellerCompany) {
        loadSaudaOptions(
          row.id,
          row.sellerCompany,
          row.buyerSaudaNo ? row.consignee : selectedConsignee,
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConsignee]);

  const addSaudaRow = () => {
    setSaudaRows((rows) => [
      ...rows,
      {
        id: Date.now() + rows.length,
        saudaNo: "",
        saudaNos: [],
        buyerSaudaNo: "",
        buyerCompany: "",
        buyerQuantity: null,
        sellerCompany: "",
        saudaOptions: [],
        manualAdjustment: "",
        purchaseQuantity: null,
        consignee: "",
        pendingQuantity: null,
        saudaDetails: [],
        status: "",
      },
    ]);
  };

  const saveAdjustment = async (row) => {
    const adjustmentQuantity = Math.max(0, Number(row.manualAdjustment || 0));
    if (
      !row.saudaNos?.length ||
      !row.sellerCompany ||
      !row.purchaseQuantity ||
      !adjustmentQuantity
    ) {
      toast.error(
        "Select Saudas and enter a combined adjustment quantity first",
      );
      return;
    }
    const selectedSaudaKeys = new Set(
      row.saudaNos.map((saudaNo) => String(saudaNo).trim().toLowerCase()),
    );
    const resolvedSaudaKeys = new Set(
      (row.saudaDetails || []).map((detail) =>
        String(detail.saudaNo || "")
          .trim()
          .toLowerCase(),
      ),
    );
    if (
      !row.saudaDetails?.length ||
      selectedSaudaKeys.size !== resolvedSaudaKeys.size ||
      [...selectedSaudaKeys].some((saudaNo) => !resolvedSaudaKeys.has(saudaNo))
    ) {
      toast.error("Check the selected seller Saudas before saving");
      return;
    }
    if (
      adjustmentQuantity > Number(row.purchaseQuantity) + 0.01 ||
      (row.buyerSaudaNo &&
        adjustmentQuantity > Number(row.buyerQuantity || 0) + 0.01)
    ) {
      toast.error("Adjusted quantity cannot exceed the buying quantity");
      return;
    }
    if (
      row.buyerSaudaNo &&
      getAdjustmentStatus(row.purchaseQuantity, row.buyerQuantity) !== "Equal"
    ) {
      toast.error(
        "Add seller Saudas until their combined quantity matches the buyer Sauda",
      );
      return;
    }
    try {
      const adjustmentGroupId =
        row.adjustmentGroupId || `${Date.now()}-${row.id}`;
      let remainingAdjustment = adjustmentQuantity;
      for (const detail of row.saudaDetails) {
        const quantity = Number(detail.quantity || 0);
        const allocatedAdjustment = Math.min(quantity, remainingAdjustment);
        const payload = {
          saudaNo: detail.saudaNo,
          adjustmentGroupId,
          adjustedWithSaudaNos: row.saudaNos.filter(
            (saudaNo) =>
              String(saudaNo).toLowerCase() !==
              String(detail.saudaNo).toLowerCase(),
          ),
          buyerSaudaNo: row.buyerSaudaNo,
          buyerCompany: row.buyerCompany,
          sellerCompany: row.sellerCompany,
          consignee: detail.consignee || row.consignee,
          purchaseQuantity: quantity,
          pendingQuantity: Math.max(0, quantity - allocatedAdjustment),
          adjustmentQuantity: allocatedAdjustment,
        };
        if (detail.adjustmentId && allocatedAdjustment) {
          await api.put(
            `/financers/adjustments/${detail.adjustmentId}`,
            payload,
          );
        } else if (!detail.adjustmentId && allocatedAdjustment) {
          await api.post("/financers/adjustments", payload);
        } else if (detail.adjustmentId && !allocatedAdjustment) {
          await api.delete(`/financers/adjustments/${detail.adjustmentId}`);
        }
        remainingAdjustment = Math.max(
          0,
          remainingAdjustment - allocatedAdjustment,
        );
      }
      setSaudaRows((rows) =>
        rows.map((item) =>
          item.id === row.id
            ? {
                ...item,
                adjustmentGroupId,
                adjustmentDate: new Date().toISOString(),
                status: getAdjustmentStatus(
                  item.purchaseQuantity,
                  item.buyerSaudaNo
                    ? item.buyerQuantity
                    : item.manualAdjustment,
                ),
              }
            : item,
        ),
      );
      await lookupSauda(
        row.id,
        row.saudaNos,
        row.sellerCompany,
        row.manualAdjustment,
        row.buyerSaudaNo,
        row.buyerCompany,
      );
      toast.success("Adjustment saved");
      await loadReport();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save adjustment");
    }
  };

  const deleteAdjustment = async (row) => {
    const adjustmentIds = (row.saudaDetails || [])
      .map((detail) => detail.adjustmentId)
      .filter(Boolean);
    if (!adjustmentIds.length) {
      toast.error("No saved adjustments found for this Sauda selection");
      return;
    }
    try {
      await Promise.all(
        adjustmentIds.map((id) => api.delete(`/financers/adjustments/${id}`)),
      );
      await lookupSauda(
        row.id,
        row.saudaNos,
        row.sellerCompany,
        row.manualAdjustment,
        row.buyerSaudaNo,
        row.buyerCompany,
      );
      toast.success("Adjustment deleted");
      await loadReport();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete adjustment",
      );
    }
  };

  const adjustEqualityRow = (adjustment) => {
    const rowId = saudaRows[0]?.id || Date.now();
    const saudaNo = String(adjustment.saudaNo || "").trim();
    const saudaNos = [
      ...new Set(
        [
          saudaNo,
          ...(adjustment.adjustedWithSaudaNos || []).map((value) =>
            String(value || "").trim(),
          ),
        ].filter(Boolean),
      ),
    ];
    const sellerCompany = String(adjustment.sellerCompany || "").trim();
    if (!saudaNo || !sellerCompany) return;

    setSaudaRows((rows) => {
      const nextRow = {
        id: rowId,
        saudaNo: saudaNos.join(", "),
        saudaNos,
        buyerSaudaNo: adjustment.buyerSaudaNo || "",
        buyerCompany: adjustment.buyerCompany || "",
        buyerQuantity: adjustment.buyerSaudaNo
          ? Number(adjustment.buyerQuantity || 0)
          : null,
        sellerCompany,
        saudaOptions: rows[0]?.saudaOptions || [],
        manualAdjustment: String(
          adjustment.buyerSaudaNo
            ? adjustment.buyerQuantity || 0
            : adjustment.adjustmentQuantity || 0,
        ),
        purchaseQuantity: Number(adjustment.purchaseQuantity || 0),
        consignee: adjustment.consignee || "",
        pendingQuantity: Math.abs(
          Number(adjustment.purchaseQuantity || 0) -
            Number(adjustment.adjustmentQuantity || 0),
        ),
        saudaDetails: [],
        status: "Loading Sauda...",
      };
      return rows.length
        ? rows.map((row, index) => (index === 0 ? nextRow : row))
        : [nextRow];
    });
    lookupSauda(
      rowId,
      saudaNos,
      sellerCompany,
      adjustment.buyerSaudaNo
        ? adjustment.buyerQuantity
        : adjustment.adjustmentQuantity,
      adjustment.buyerSaudaNo || "",
      adjustment.buyerCompany || "",
    );
  };

  const startPurchaseOrderAdjustment = (order) => {
    const rowId = saudaRows[0]?.id || Date.now();
    const nextRow = {
      id: rowId,
      saudaNo: "",
      saudaNos: [],
      buyerSaudaNo: order.saudaNo || "",
      buyerCompany: order.buyerCompany || "",
      buyerQuantity: Number(order.quantity || 0),
      sellerCompany: "",
      saudaOptions: [],
      manualAdjustment: String(order.quantity || ""),
      purchaseQuantity: null,
      consignee: order.consignee || "",
      pendingQuantity: null,
      saudaDetails: [],
      status: "",
    };
    setSaudaRows((rows) =>
      rows.length
        ? rows.map((row, index) => (index === 0 ? nextRow : row))
        : [nextRow],
    );
    requestAnimationFrame(() => {
      if (!adjustmentLookupRef.current) return;
      adjustmentLookupRef.current.open = true;
      adjustmentLookupRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const removeSaudaRow = (id) => {
    setSaudaRows((rows) =>
      rows.length === 1
        ? [
            {
              id: Date.now(),
              saudaNo: "",
              saudaNos: [],
              buyerSaudaNo: "",
              buyerCompany: "",
              buyerQuantity: null,
              sellerCompany: "",
              saudaOptions: [],
              manualAdjustment: "",
              purchaseQuantity: null,
              consignee: "",
              pendingQuantity: null,
              saudaDetails: [],
              status: "",
            },
          ]
        : rows.filter((row) => row.id !== id),
    );
  };

  const handleDateChange = (setter) => (date) => {
    setter(date);
    setPage(1);
  };

  const downloadSaudaMappings = async (format) => {
    setExportingFormat(format);
    try {
      const response = await api.get("/financers/report", {
        params: {
          page: 1,
          limit: 1,
          adjustmentPage: 1,
          adjustmentLimit: itemsPerPage,
          exportAdjustedSaudas: true,
          startDate: formatDateParam(fromDate),
          endDate: formatDateParam(toDate),
          consignee: selectedConsignee || undefined,
        },
      });
      const adjustments = response.data?.adjustedSaudas || [];
      const buyerAdjustedTotals = new Map();
      adjustments.forEach((adjustment) => {
        if (!adjustment.buyerSaudaNo) return;
        const key = `${String(adjustment.buyerSaudaNo).toLowerCase()}|${String(adjustment.buyerCompany || "").toLowerCase()}`;
        buyerAdjustedTotals.set(
          key,
          (buyerAdjustedTotals.get(key) || 0) +
            Number(adjustment.adjustmentQuantity || 0),
        );
      });
      const rows = adjustments.map((adjustment) => {
        const buyerKey = `${String(adjustment.buyerSaudaNo || "").toLowerCase()}|${String(adjustment.buyerCompany || "").toLowerCase()}`;
        const buyerAdjustedTotal = buyerAdjustedTotals.get(buyerKey) || 0;
        const sellerQuantity = Number(
          adjustment.purchaseQuantity || adjustment.quantity || 0,
        );
        const adjustedQuantity = Number(adjustment.adjustmentQuantity || 0);
        const sellerSaudas = [
          ...new Set([
            adjustment.saudaNo,
            ...(adjustment.adjustedWithSaudaNos || []),
          ]),
        ].filter(Boolean);

        return {
          "Adjustment Date": formatDate(adjustment.adjustmentDate),
          "Buyer Sauda": adjustment.buyerSaudaNo || "-",
          "Buyer Company": adjustment.buyerCompany || "-",
          "Buyer PO Date": formatDate(adjustment.buyerSaudaDate),
          "Buyer Quantity (Tons)": Number(adjustment.buyerQuantity || 0),
          "Buyer Adjusted Total (Tons)": buyerAdjustedTotal,
          "Buyer Pending (Tons)": adjustment.buyerSaudaNo
            ? Math.max(
                0,
                Number(adjustment.buyerQuantity || 0) - buyerAdjustedTotal,
              )
            : 0,
          "Seller Sauda": adjustment.saudaNo || "-",
          "All Mapped Seller Saudas": sellerSaudas.join(", ") || "-",
          "Seller Name": adjustment.sellerName || "-",
          "Seller Company": adjustment.sellerCompany || "-",
          Consignee:
            adjustment.consignee || adjustment.buyerConsignee || "-",
          Commodity: adjustment.commodity || "-",
          "Seller PO Date": formatDate(adjustment.saudaDate),
          "Seller Quantity (Tons)": sellerQuantity,
          "Adjusted Quantity (Tons)": adjustedQuantity,
          "Seller Pending (Tons)": Math.max(
            0,
            sellerQuantity - adjustedQuantity,
          ),
          Rate: Number(adjustment.rate || 0),
          CD: Number(adjustment.cd || 0),
          GST: Number(adjustment.gst || 0),
          "Delivery Date": formatDate(adjustment.deliveryDate),
          "Payment Terms": adjustment.paymentTerms || "-",
        };
      });
      if (!rows.length) {
        toast.info("No Sauda mappings match the selected filters");
        return;
      }

      const from = formatDateParam(fromDate) || "all-dates";
      const to = formatDateParam(toDate) || "all-dates";
      const consigneeName = (selectedConsignee || "all-consignees")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const fileName = `finance-sauda-mapping-${from}-to-${to}-${consigneeName}`;

      if (format === "excel") {
        await generateExcel(rows, `${fileName}.xlsx`);
        return;
      }

      const pdfBlob = await pdf(
        <SaudaMappingPdf
          rows={rows}
          from={from}
          to={to}
          consignee={selectedConsignee}
        />,
      ).toBlob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `${fileName}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to export Sauda mappings",
      );
    } finally {
      setExportingFormat("");
    }
  };

  const orderRows = orders.map((order, index) => [
    (page - 1) * itemsPerPage + index + 1,
    formatDate(order.poDate),
    order.saudaNo || "-",
    order.supplierCompany || "-",
    order.buyerCompany || "-",
    order.consignee || "-",
    formatNumber(order.quantity),
    formatNumber(order.rate),
    formatOptionalNumber(order.cd),
    formatOptionalNumber(order.gst),
    formatDate(order.deliveryDate),
    order.paymentTerms || "-",
    <button
      key={`adjust-${order._id || order.saudaNo}`}
      type="button"
      onClick={() => startPurchaseOrderAdjustment(order)}
      className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
    >
      Adjust
    </button>,
  ]);

  const consigneeOptions = consignees.map((consignee) => ({
    value: consignee,
    label: consignee,
  }));

  const sellerCompanyOptions = sellerCompanies.map((company) => ({
    value: company,
    label: company,
  }));

  const selectedDateTotals = dateWiseTotals;

  const selectedSaudaDetails = selectedDateTotals.flatMap(
    (item) => item.saudaDetails || [],
  );

  const selectedPartyTotals = selectedDateTotals.flatMap((item) =>
    (item.partyTotals || []).map((party) => ({ ...party, date: item.date })),
  );

  const selectedAdjustments = adjustmentRows;

  const adjustedQuantityByBuyerSauda = new Map();
  adjustmentRows.forEach((adjustment) => {
    if (!adjustment.buyerSaudaNo) return;
    const key = `${String(adjustment.buyerSaudaNo).toLowerCase()}|${String(adjustment.buyerCompany || "").toLowerCase()}`;
    adjustedQuantityByBuyerSauda.set(
      key,
      (adjustedQuantityByBuyerSauda.get(key) || 0) +
        Number(adjustment.adjustmentQuantity || 0),
    );
  });

  const saudaLookupRows = saudaRows.map((row) => [
    <div key={`lookup-${row.id}`} className="min-w-[230px]">
      <DataDropdown
        options={(row.saudaOptions || []).map((option) => ({
          value: option.saudaNo,
          label: `${option.saudaNo} - ${formatDate(option.poDate)}`,
        }))}
        selectedOptions={row.saudaNos}
        isMulti
        isClearable
        disableSorting
        isDisabled={!row.sellerCompany || row.saudaOptions.length === 0}
        placeholder="Select one or more Saudas"
        onChange={(options) => {
          const saudaNos = (options || []).map((option) => option.value);
          setSaudaRows((rows) =>
            rows.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    saudaNo: saudaNos.join(", "),
                    saudaNos,
                    saudaDetails: [],
                    purchaseQuantity: null,
                    pendingQuantity: null,
                    manualAdjustment: "",
                    status: "",
                  }
                : item,
            ),
          );
          if (saudaNos.length && row.sellerCompany) {
            lookupSauda(
              row.id,
              saudaNos,
              row.sellerCompany,
              row.manualAdjustment,
            );
          }
        }}
      />
    </div>,
    <div key={`seller-company-${row.id}`} className="min-w-[210px] space-y-2">
      <DataDropdown
        options={sellerCompanyOptions}
        selectedOptions={row.sellerCompany}
        isClearable
        placeholder="Select seller company"
        onChange={(option) => {
          const company = option?.value || "";
          setSaudaRows((rows) =>
            rows.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    sellerCompany: company,
                    saudaNo: "",
                    saudaNos: [],
                    adjustmentId: "",
                    saudaOptions: [],
                    purchaseQuantity: null,
                    consignee: item.buyerSaudaNo ? item.consignee : "",
                    pendingQuantity: null,
                    saudaDetails: [],
                    status: "",
                  }
                : item,
            ),
          );
          if (company) {
            loadSaudaOptions(
              row.id,
              company,
              row.buyerSaudaNo ? row.consignee : selectedConsignee,
            );
          }
        }}
      />
      <div className="text-xs text-slate-500">
        Consignee: {row.consignee || "-"}
      </div>
      <button
        type="button"
        onClick={() =>
          lookupSauda(
            row.id,
            row.saudaNo,
            row.sellerCompany,
            row.manualAdjustment,
          )
        }
        className="h-9 w-full rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
      >
        Check quantity
      </button>
    </div>,
    row.buyerSaudaNo || "-",
    row.buyerCompany || "-",
    row.buyerQuantity === null || row.buyerQuantity === undefined
      ? "-"
      : `${formatNumber(row.buyerQuantity)} Tons`,
    row.purchaseQuantity === null
      ? "-"
      : `${formatNumber(row.purchaseQuantity)} Tons`,
    `${formatNumber(
      (row.saudaDetails || []).reduce(
        (total, detail) => total + Number(detail.adjustmentQuantity || 0),
        0,
      ),
    )} Tons`,
    <div key={`wanted-adjustment-${row.id}`} className="min-w-[190px]">
      <input
        type="number"
        min="0"
        step="0.01"
        value={row.manualAdjustment}
        onChange={(event) =>
          setSaudaRows((rows) =>
            rows.map((item) =>
              item.id === row.id
                ? (() => {
                    const manualAdjustment = Math.max(
                      0,
                      Number(event.target.value || 0),
                    );
                    const purchaseQuantity = Number(item.purchaseQuantity || 0);
                    return {
                      ...item,
                      manualAdjustment: event.target.value,
                      pendingQuantity:
                        item.purchaseQuantity === null
                          ? null
                          : Math.max(0, purchaseQuantity - manualAdjustment),
                      status:
                        item.purchaseQuantity === null
                          ? ""
                          : getAdjustmentStatus(
                              purchaseQuantity,
                              item.buyerSaudaNo
                                ? item.buyerQuantity
                                : manualAdjustment,
                            ),
                    };
                  })()
                : item,
            ),
          )
        }
        aria-label={`Wanted adjusted quantity for ${row.buyerSaudaNo || row.saudaNo || "Sauda"}`}
        placeholder="Wanted adjusted quantity (Tons)"
        className="h-10 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
    </div>,
    row.pendingQuantity === null
      ? "-"
      : `${formatNumber(row.pendingQuantity)} Tons`,
    <span
      key={`status-${row.id}`}
      className={
        row.status === "Equal"
          ? "font-bold text-emerald-600"
          : row.status === "Not Equal"
            ? "font-bold text-amber-600"
            : "text-slate-500"
      }
    >
      {row.status || "Enter Sauda No"}
    </span>,
    <div key={`actions-${row.id}`} className="flex min-w-[150px] flex-col gap-2">
      <button
        type="button"
        onClick={() => saveAdjustment(row)}
        disabled={
          row.pendingQuantity === null ||
          !row.manualAdjustment ||
          (row.buyerSaudaNo && row.status !== "Equal")
        }
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {row.saudaDetails?.some((detail) => detail.adjustmentId) ? (
          <FaEdit size={12} />
        ) : (
          <FaSave size={12} />
        )}
        {row.saudaDetails?.some((detail) => detail.adjustmentId)
          ? "Update adjustment"
          : "Save adjustment"}
      </button>
      {row.saudaDetails?.some((detail) => detail.adjustmentId) && (
        <button
          type="button"
          onClick={() => deleteAdjustment(row)}
          title="Delete saved adjustment"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          <FaTrash size={12} />
          Delete
        </button>
      )}
      <button
        type="button"
        onClick={() => removeSaudaRow(row.id)}
        title="Remove Sauda row"
        className="inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
      >
        <FaTrash size={12} />
        Remove row
      </button>
    </div>,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Finance Report"
        subtitle="Financed buyer-company Sauda sales orders and pending quantities"
        icon={FaUniversity}
        noContentCard
      >
        <div className="space-y-6">
          <FinanceReportFilters
            fromDate={fromDate}
            toDate={toDate}
            consigneeOptions={consigneeOptions}
            selectedConsignee={selectedConsignee}
            exportingFormat={exportingFormat}
            loading={loading}
            onFromDateChange={handleDateChange(setFromDate)}
            onToDateChange={handleDateChange(setToDate)}
            onConsigneeChange={(value) => {
              setSelectedConsignee(value);
              setPage(1);
            }}
            onExport={downloadSaudaMappings}
          />

          <PurchaseOrdersSection
            rows={orderRows}
            loading={loading}
            total={total}
            page={page}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
          />

          <details
            ref={adjustmentLookupRef}
            className="border-y border-slate-200 bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-slate-800 sm:px-6">
              <span>Sauda adjustments</span>
              <span className="text-xs font-normal text-slate-500">
                {adjustedSaudasTotal} saved
              </span>
              <FaChevronDown
                aria-hidden="true"
                className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                size={13}
              />
            </summary>
            <section className="space-y-4 px-4 pb-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Buying vs selling
                  </h2>
                  <p className="text-sm text-slate-500">
                    Consignee: {selectedConsignee || "All consignees"}
                  </p>
                </div>
                <Buttons
                  label="Add Sauda"
                  onClick={addSaudaRow}
                  size="sm"
                  icon={<FaPlus />}
                />
              </div>
              <div className="overflow-x-auto">
                <Tables
                  headers={[
                    "Seller Sauda No(s)",
                    "Seller Company",
                    "Buyer Sauda No",
                    "Buyer Company",
                    "Buyer Order Quantity",
                    "Seller Order Quantity",
                    "Adjusted Quantity",
                    "Wanted Adjusted Quantity",
                    "Pending Quantity",
                    "Adjustment Status",
                    "Actions",
                  ]}
                  rows={saudaLookupRows}
                />
              </div>
              <AdjustedSaudasSection
                rows={paginatedAdjustmentRows}
                total={adjustedSaudasTotal}
                page={adjustedSaudasPage}
                itemsPerPage={itemsPerPage}
                adjustedQuantityByBuyerSauda={adjustedQuantityByBuyerSauda}
                formatDate={formatDate}
                formatNumber={formatNumber}
                getAdjustmentStatus={getAdjustmentStatus}
                onPageChange={setAdjustedSaudasPage}
                onAdjust={adjustEqualityRow}
              />
            </section>
          </details>

          <details className="border-b border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-slate-800 sm:px-6">
              <span>Totals and transaction details</span>
              <FaChevronDown
                aria-hidden="true"
                className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                size={13}
              />
            </summary>
            <div className="px-4 pb-5 sm:px-6">
              <DateWiseTotalsSection
                dateTotals={selectedDateTotals}
                partyTotals={selectedPartyTotals}
                saudaDetails={selectedSaudaDetails}
                adjustments={selectedAdjustments}
                selectedAdjustment={selectedAdjustment}
                formatDate={formatDate}
                formatNumber={formatNumber}
                onSelectAdjustment={setSelectedAdjustment}
                onClearAdjustment={() => setSelectedAdjustment(null)}
              />
            </div>
          </details>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default FinanceReport;
