import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { FaPlus, FaTrash, FaUniversity, FaSave, FaEdit, FaDownload } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import Buttons from "../../../common/Buttons/Buttons";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const DataDropdown = lazy(() => import("../../../common/DataDropdown/DataDropdown"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const DownloadSauda = lazy(
  () => import("../../../components/DownloadSauda/DownloadSauda"),
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
  value === undefined || value === null || value === "" ? "-" : formatNumber(value);

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateWiseTotals, setDateWiseTotals] = useState([]);
  const [adjustmentRows, setAdjustmentRows] = useState([]);
  const [selectedTotalDate, setSelectedTotalDate] = useState(null);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [saudaRows, setSaudaRows] = useState([
    {
      id: Date.now(),
      saudaNo: "",
      sellerCompany: "",
      saudaOptions: [],
      manualAdjustment: "",
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load finance report");
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, selectedConsignee]);

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
        toast.error(error.response?.data?.message || "Failed to load financer seller companies");
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

  const lookupSauda = async (rowId, saudaNo, sellerCompany, manualAdjustment) => {
    const value = String(saudaNo || "").trim();
    const company = String(sellerCompany || "").trim();
    const adjustment = Math.max(0, Number(manualAdjustment || 0));
    if (!value || !company) {
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? { ...row, status: !value ? "Enter Sauda No" : "Select seller company" }
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
          manualAdjustment: adjustment,
          page: 1,
          limit: 100,
        },
      });
      const match = (response.data?.data || []).find(
        (item) => String(item.saudaNo).toLowerCase() === value.toLowerCase(),
      );
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id !== rowId
            ? row
            : match
              ? {
                  ...row,
                  sellerCompany: company,
                  saudaDate: match.poDate || null,
                  purchaseQuantity: Number(match.quantity || 0),
                  consignee: match.consignee || "",
                  adjustmentId: response.data?.adjustments?.find(
                    (adjustment) =>
                      String(adjustment.saudaNo).toLowerCase() === value.toLowerCase() &&
                      String(adjustment.sellerCompany).toLowerCase() === company.toLowerCase(),
                  )?._id || "",
                  adjustmentDate: response.data?.adjustments?.find(
                    (adjustment) =>
                      String(adjustment.saudaNo).toLowerCase() === value.toLowerCase() &&
                      String(adjustment.sellerCompany).toLowerCase() === company.toLowerCase(),
                  )?.adjustmentDate || "",
                  manualAdjustment: String(
                    response.data?.adjustments?.find(
                      (adjustment) =>
                        String(adjustment.saudaNo).toLowerCase() === value.toLowerCase() &&
                        String(adjustment.sellerCompany).toLowerCase() === company.toLowerCase(),
                    )?.adjustmentQuantity || 0,
                  ),
                  pendingQuantity: Math.abs(
                    Number(match.quantity || 0) -
                      Number(
                        response.data?.adjustments?.find(
                          (adjustment) =>
                            String(adjustment.saudaNo).toLowerCase() === value.toLowerCase() &&
                            String(adjustment.sellerCompany).toLowerCase() === company.toLowerCase(),
                        )?.adjustmentQuantity || 0,
                      ),
                  ),
                  status: getAdjustmentStatus(
                    Number(match.quantity || 0),
                    Number(
                      response.data?.adjustments?.find(
                        (adjustment) =>
                          String(adjustment.saudaNo).toLowerCase() === value.toLowerCase() &&
                          String(adjustment.sellerCompany).toLowerCase() === company.toLowerCase(),
                      )?.adjustmentQuantity || 0,
                    ),
                  ),
                }
              : { ...row, pendingQuantity: null, status: "Not found" },
        ),
      );
    } catch (error) {
      setSaudaRows((rows) =>
        rows.map((row) => (row.id === rowId ? { ...row, status: "Lookup failed" } : row)),
      );
      toast.error(error.response?.data?.message || "Failed to find Sauda");
    }
  };

  const updateSaudaRow = (id, value) => {
    setSaudaRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              saudaNo: value,
              adjustmentId: "",
              purchaseQuantity: null,
              consignee: "",
              pendingQuantity: null,
              status: "",
            }
          : row,
      ),
    );
  };

  const loadSaudaOptions = async (rowId, sellerCompany, consignee = selectedConsignee) => {
    if (!sellerCompany) return;
    try {
      const response = await api.get("/financers/pending-options", {
        params: { sellerCompany, consignee: consignee || undefined },
      });
      setSaudaRows((rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                saudaOptions: response.data?.saudaNumbers || [],
                saudaNo: "",
                adjustmentId: "",
                purchaseQuantity: null,
                consignee: "",
                pendingQuantity: null,
                status: "",
              }
            : row,
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load Sauda numbers");
    }
  };

  useEffect(() => {
    saudaRows.forEach((row) => {
      if (row.sellerCompany) {
        loadSaudaOptions(row.id, row.sellerCompany, selectedConsignee);
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
        sellerCompany: "",
        saudaOptions: [],
        manualAdjustment: "",
        purchaseQuantity: null,
        consignee: "",
        pendingQuantity: null,
        status: "",
      },
    ]);
  };

  const saveAdjustment = async (row) => {
    const adjustmentQuantity = Math.max(0, Number(row.manualAdjustment || 0));
    if (!row.saudaNo || !row.sellerCompany || !row.purchaseQuantity || !adjustmentQuantity) {
      toast.error("Lookup a Sauda and enter an adjustment quantity first");
      return;
    }
    try {
      const payload = {
        saudaNo: row.saudaNo,
        sellerCompany: row.sellerCompany,
        consignee: row.consignee,
        purchaseQuantity: row.purchaseQuantity,
        pendingQuantity: row.pendingQuantity,
        adjustmentQuantity,
      };
      const response = row.adjustmentId
        ? await api.put(`/financers/adjustments/${row.adjustmentId}`, payload)
        : await api.post("/financers/adjustments", payload);
      setSaudaRows((rows) =>
        rows.map((item) =>
          item.id === row.id
            ? {
                ...item,
                adjustmentId: response.data?._id || row.adjustmentId,
                adjustmentDate: response.data?.adjustmentDate || new Date().toISOString(),
                status: getAdjustmentStatus(item.purchaseQuantity, item.manualAdjustment),
              }
            : item,
        ),
      );
      toast.success("Adjustment saved");
      loadReport();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save adjustment");
    }
  };

  const deleteAdjustment = async (row) => {
    if (!row.adjustmentId) return;
    try {
      await api.delete(`/financers/adjustments/${row.adjustmentId}`);
      setSaudaRows((rows) =>
        rows.map((item) =>
          item.id === row.id
            ? {
                ...item,
                adjustmentId: "",
                manualAdjustment: "",
                    pendingQuantity: Number(item.purchaseQuantity || 0),
                    status: getAdjustmentStatus(item.purchaseQuantity, 0),
              }
            : item,
        ),
      );
      toast.success("Adjustment deleted");
      loadReport();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete adjustment");
    }
  };

  const removeSaudaRow = (id) => {
    setSaudaRows((rows) =>
      rows.length === 1
        ? [{ id: Date.now(), saudaNo: "", sellerCompany: "", saudaOptions: [], manualAdjustment: "", purchaseQuantity: null, consignee: "", pendingQuantity: null, status: "" }]
        : rows.filter((row) => row.id !== id),
    );
  };

  const handleDateChange = (setter) => (date) => {
    setter(date);
    setPage(1);
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
  ]);

  const consigneeOptions = consignees.map((consignee) => ({
    value: consignee,
    label: consignee,
  }));

  const sellerCompanyOptions = sellerCompanies.map((company) => ({
    value: company,
    label: company,
  }));

  const selectedDateTotals = selectedTotalDate
    ? dateWiseTotals.filter(
        (item) => formatDateParam(selectedTotalDate) === item.date,
      )
    : dateWiseTotals;

  const selectedSaudaDetails = selectedDateTotals.flatMap(
    (item) => item.saudaDetails || [],
  );

  const selectedPartyTotals = selectedDateTotals.flatMap(
    (item) => (item.partyTotals || []).map((party) => ({ ...party, date: item.date })),
  );

  const selectedAdjustments = selectedTotalDate
    ? adjustmentRows.filter(
        (item) => formatDateParam(selectedTotalDate) === formatDateParam(item.adjustmentDate),
      )
    : adjustmentRows;

  const saudaLookupRows = saudaRows.map((row) => [
    <div key={`lookup-${row.id}`} className="flex min-w-[310px] flex-col gap-2">
      <select
        value={row.saudaNo}
        onChange={(event) => {
          const saudaNo = event.target.value;
          updateSaudaRow(row.id, saudaNo);
          if (saudaNo && row.sellerCompany) {
            lookupSauda(row.id, saudaNo, row.sellerCompany, row.manualAdjustment);
          }
        }}
        disabled={!row.sellerCompany || row.saudaOptions.length === 0}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
      >
        <option value="">Select Sauda number</option>
        {(row.saudaOptions || []).map((option) => (
          <option key={option.saudaNo} value={option.saudaNo}>
            {option.saudaNo} - {formatDate(option.poDate)}
          </option>
        ))}
      </select>
      <select
        value={row.sellerCompany}
        onChange={(event) => {
          const company = event.target.value;
          setSaudaRows((rows) =>
            rows.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    sellerCompany: company,
                    saudaNo: "",
                    adjustmentId: "",
                    saudaOptions: [],
                    purchaseQuantity: null,
                    consignee: "",
                    pendingQuantity: null,
                    status: "",
                  }
                : item,
            ),
          );
          loadSaudaOptions(row.id, company, selectedConsignee);
        }}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Select seller company</option>
        {sellerCompanyOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
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
                          : Math.abs(purchaseQuantity - manualAdjustment),
                      status:
                        item.purchaseQuantity === null
                          ? ""
                          : getAdjustmentStatus(purchaseQuantity, manualAdjustment),
                    };
                  })()
                : item,
            ),
          )
        }
        placeholder="Selling / adjusted quantity (Tons)"
        className="h-10 w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => lookupSauda(row.id, row.saudaNo, row.sellerCompany, row.manualAdjustment)}
          className="h-9 flex-1 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Check quantity
        </button>
        <button
          type="button"
          onClick={() => saveAdjustment(row)}
          title={row.adjustmentId ? "Update adjustment" : "Save adjustment"}
          className="inline-flex h-9 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={row.pendingQuantity === null || !row.manualAdjustment}
        >
          {row.adjustmentId ? <FaEdit size={12} /> : <FaSave size={12} />}
        </button>
      </div>
    </div>,
    <div key={`details-${row.id}`} className="min-w-[210px] space-y-1 text-xs">
      <div><span className="font-bold text-slate-500">Company:</span> {row.sellerCompany || "-"}</div>
      <div><span className="font-bold text-slate-500">Consignee:</span> {row.consignee || "-"}</div>
    </div>,
    formatDate(row.saudaDate),
    formatDate(row.adjustmentDate),
    row.purchaseQuantity === null ? "-" : `${formatNumber(row.purchaseQuantity)} Tons`,
    row.manualAdjustment ? `${formatNumber(row.manualAdjustment)} Tons` : "0 Tons",
    row.pendingQuantity === null ? "-" : `${formatNumber(row.pendingQuantity)} Tons`,
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
    <div key={`remove-${row.id}`} className="flex gap-1">
      {row.adjustmentId && (
        <button
          type="button"
          onClick={() => deleteAdjustment(row)}
          title="Delete adjustment"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
        >
          <FaTrash size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={() => removeSaudaRow(row.id)}
        title="Remove Sauda row"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <FaTrash size={12} />
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
          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Sauda Report Filters</h2>
                <p className="text-sm text-slate-500">View financed Saudas by date range and consignee</p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-3 sm:items-end">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">From Date</label>
                  <DateSelector selectedDate={fromDate} onChange={handleDateChange(setFromDate)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">To Date</label>
                  <DateSelector selectedDate={toDate} onChange={handleDateChange(setToDate)} />
                </div>
                <div>
                  <DataDropdown
                    label="Consignee"
                    options={consigneeOptions}
                    selectedOptions={selectedConsignee}
                    onChange={(option) => {
                      setSelectedConsignee(option?.value || "");
                      setPage(1);
                    }}
                    placeholder="All Consignees"
                    isClearable
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Purchase Orders</h2>
                <p className="text-sm text-slate-500">Company-wise financed Sauda list</p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {total} Records
              </span>
            </div>
            {loading ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto">
                <Tables
                  headers={["Sl No", "Date", "Sauda No", "Seller Company", "Buyer Company", "Consignee", "Purchase Quantity", "Rate", "CD", "GST", "Delivery Date", "Payment Terms"]}
                  rows={orderRows}
                />
              </div>
            )}
            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
            />
          </section>

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Buying vs Selling Adjustment Lookup</h2>
                <p className="text-sm text-slate-500">Compare buying and selling quantities for the selected Sauda</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  Consignee: {selectedConsignee || "All consignees"}
                </p>
              </div>
              <Buttons label="Add Sauda" onClick={addSaudaRow} size="sm" icon={<FaPlus />} />
            </div>
            <div className="overflow-x-auto">
              <Tables
                headers={["Seller Sauda No", "Seller Company / Consignee", "Sauda Date", "Adjustment Date", "Buying Quantity", "Selling / Adjusted Quantity", "Difference", "Adjustment Status", "Actions"]}
                rows={saudaLookupRows}
              />
            </div>
            {adjustmentRows.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Adjustment Equality Report</h3>
                <Tables
                  headers={["Buyer", "Buyer Company", "Sauda No", "Seller Name", "Seller Company", "Sauda Date", "Adjustment Date", "Buying Quantity", "Adjusted Quantity", "Difference", "Status"]}
                  rows={adjustmentRows.map((adjustment) => [
                    adjustment.buyer || "-",
                    adjustment.buyerCompany || "-",
                    adjustment.saudaNo || "-",
                    adjustment.sellerName || "-",
                    adjustment.sellerCompany || "-",
                    formatDate(adjustment.saudaDate),
                    formatDate(adjustment.adjustmentDate),
                    `${formatNumber(adjustment.purchaseQuantity)} Tons`,
                    `${formatNumber(adjustment.adjustmentQuantity)} Tons`,
                    `${formatNumber(Math.abs(Number(adjustment.purchaseQuantity || 0) - Number(adjustment.adjustmentQuantity || 0)))} Tons`,
                    <span key={`adjustment-status-${adjustment._id || adjustment.saudaNo}`} className={getAdjustmentStatus(adjustment.purchaseQuantity, adjustment.adjustmentQuantity) === "Equal" ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                      {getAdjustmentStatus(adjustment.purchaseQuantity, adjustment.adjustmentQuantity)}
                    </span>,
                  ])}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Date-wise Totals</h2>
                <p className="text-sm text-slate-500">Sauda, adjustment, loaded, and pending quantities for a selected date</p>
              </div>
              <div className="w-full sm:w-56">
                <label className="mb-1 block text-xs font-bold text-slate-600">Select Date</label>
                <DateSelector
                  selectedDate={selectedTotalDate}
                  onChange={setSelectedTotalDate}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Tables
                headers={["Date", "Total Saudas", "Sauda Quantity", "Loaded Quantity", "Total Adjustment", "Pending Quantity"]}
                rows={selectedDateTotals.map((item) => [
                  formatDate(item.date),
                  formatNumber(item.saudaCount),
                  `${formatNumber(item.saudaQuantity)} Tons`,
                  `${formatNumber(item.loadedQuantity)} Tons`,
                  `${formatNumber(item.adjustmentQuantity)} Tons`,
                  `${formatNumber(item.pendingQuantity)} Tons`,
                ])}
              />
            </div>
            {selectedPartyTotals.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Seller to Buyer Totals</h3>
                <Tables
                  headers={["Date", "Seller Name", "Seller Company", "Buyer", "Buyer Company", "Purchase Quantity", "Adjusted Quantity", "Pending Quantity"]}
                  rows={selectedPartyTotals.map((party) => [
                    formatDate(party.date),
                    party.sellerName || "-",
                    party.sellerCompany || "-",
                    party.buyer || "-",
                    party.buyerCompany || "-",
                    `${formatNumber(party.purchaseQuantity)} Tons`,
                    `${formatNumber(party.adjustedQuantity)} Tons`,
                    `${formatNumber(party.pendingQuantity)} Tons`,
                  ])}
                />
              </div>
            )}
            {selectedSaudaDetails.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Sauda Details</h3>
                <Tables
                  headers={["Sauda Date", "Sauda No", "Buyer", "Buyer Company", "Seller Name", "Seller Company", "Consignee", "Commodity", "Quantity", "Loaded", "Adjusted", "Pending", "Rate", "Delivery Date", "Payment Terms"]}
                  rows={selectedSaudaDetails.map((sauda) => [
                    formatDate(sauda.saudaDate),
                    sauda.saudaNo || "-",
                    sauda.buyer || "-",
                    sauda.buyerCompany || "-",
                    sauda.sellerName || "-",
                    sauda.sellerCompany || "-",
                    sauda.consignee || "-",
                    sauda.commodity || "-",
                    `${formatNumber(sauda.quantity)} Tons`,
                    `${formatNumber(sauda.loadedQuantity)} Tons`,
                    `${formatNumber(sauda.adjustmentQuantity)} Tons`,
                    `${formatNumber(sauda.pendingQuantity)} Tons`,
                    formatNumber(sauda.rate),
                    formatDate(sauda.deliveryDate),
                    sauda.paymentTerms || "-",
                  ])}
                />
              </div>
            )}
            {selectedAdjustments.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="mb-3 text-sm font-bold text-slate-700">Adjusted Saudas</h3>
                <Tables
                  headers={["Adjustment Date", "Sauda No", "Buyer Company", "Seller Name", "Seller Company", "Adjusted Quantity", "Actions"]}
                  rows={selectedAdjustments.map((adjustment) => [
                    formatDate(adjustment.adjustmentDate),
                    adjustment.saudaNo || "-",
                    adjustment.buyerCompany || "-",
                    adjustment.sellerName || "-",
                    adjustment.sellerCompany || "-",
                    `${formatNumber(adjustment.adjustmentQuantity)} Tons`,
                    <div key={`adjustment-actions-${adjustment._id || adjustment.saudaNo}`} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAdjustment(adjustment)}
                        title="View adjustment details"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      >
                        <AiOutlineEye size={17} />
                      </button>
                      <DownloadSauda
                        data={adjustment}
                        button={
                          <button
                            type="button"
                            title="Download Sauda"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <FaDownload size={13} />
                          </button>
                        }
                      />
                    </div>,
                  ])}
                />
              </div>
            )}
            {selectedAdjustment && (
              <div className="mt-4 grid gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="font-bold">Buyer:</span> {selectedAdjustment.buyer || "-"}</div>
                <div><span className="font-bold">Buyer Company:</span> {selectedAdjustment.buyerCompany || "-"}</div>
                <div><span className="font-bold">Sauda No:</span> {selectedAdjustment.saudaNo || "-"}</div>
                <div><span className="font-bold">Seller Name:</span> {selectedAdjustment.sellerName || "-"}</div>
                <div><span className="font-bold">Seller Company:</span> {selectedAdjustment.sellerCompany || "-"}</div>
                <div><span className="font-bold">Consignee:</span> {selectedAdjustment.consignee || "-"}</div>
                <div><span className="font-bold">Buying Quantity:</span> {formatNumber(selectedAdjustment.purchaseQuantity)} Tons</div>
                <div><span className="font-bold">Adjusted Quantity:</span> {formatNumber(selectedAdjustment.adjustmentQuantity)} Tons</div>
                <button
                  type="button"
                  onClick={() => setSelectedAdjustment(null)}
                  className="text-left text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  Close details
                </button>
              </div>
            )}
          </section>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default FinanceReport;
