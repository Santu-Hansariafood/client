import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { FaPlus, FaTrash, FaUniversity } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import Buttons from "../../../common/Buttons/Buttons";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

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
  const [financers, setFinancers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saudaRows, setSaudaRows] = useState([
    { id: Date.now(), saudaNo: "", pendingQuantity: null, status: "" },
  ]);
  const itemsPerPage = 10;

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/financers/report", {
        params: {
          page,
          limit: itemsPerPage,
          startDate: formatDateParam(selectedDate),
          endDate: formatDateParam(selectedDate),
        },
      });
      setOrders(response.data?.data || []);
      setFinancers(response.data?.financers || []);
      setTotal(Number(response.data?.total) || 0);
    } catch (error) {
      setOrders([]);
      setFinancers([]);
      setTotal(0);
      toast.error(error.response?.data?.message || "Failed to load finance report");
    } finally {
      setLoading(false);
    }
  }, [page, selectedDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const lookupSauda = async (rowId, saudaNo) => {
    const value = String(saudaNo || "").trim();
    if (!value) return;
    try {
      const response = await api.get("/financers/report", {
        params: {
          saudaNos: value,
          page: 1,
          limit: 100,
          startDate: formatDateParam(selectedDate),
          endDate: formatDateParam(selectedDate),
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
              ? { ...row, pendingQuantity: match.pendingQuantity, status: "Found" }
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
        row.id === id ? { ...row, saudaNo: value, pendingQuantity: null, status: "" } : row,
      ),
    );
  };

  const addSaudaRow = () => {
    setSaudaRows((rows) => [
      ...rows,
      { id: Date.now() + rows.length, saudaNo: "", pendingQuantity: null, status: "" },
    ]);
  };

  const removeSaudaRow = (id) => {
    setSaudaRows((rows) =>
      rows.length === 1
        ? [{ id: Date.now(), saudaNo: "", pendingQuantity: null, status: "" }]
        : rows.filter((row) => row.id !== id),
    );
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
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
    formatDate(order.deliveryDate),
    order.paymentTerms || "-",
  ]);

  const financerRows = financers.map((item, index) => [
    index + 1,
    item.groupId?.groupName || "-",
    item.buyerId?.name || "-",
    item.companyId?.companyName || "-",
  ]);

  const saudaLookupRows = saudaRows.map((row) => [
    <input
      key={`input-${row.id}`}
      value={row.saudaNo}
      onChange={(event) => updateSaudaRow(row.id, event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") lookupSauda(row.id, row.saudaNo);
      }}
      placeholder="Seller Sauda No"
      className="h-10 w-full min-w-[150px] rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    />,
    row.pendingQuantity === null ? "-" : `${formatNumber(row.pendingQuantity)} Tons`,
    <span
      key={`status-${row.id}`}
      className={row.status === "Found" ? "font-bold text-emerald-600" : "text-slate-500"}
    >
      {row.status || "Enter Sauda No"}
    </span>,
    <button
      key={`remove-${row.id}`}
      type="button"
      onClick={() => removeSaudaRow(row.id)}
      title="Remove Sauda row"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
    >
      <FaTrash size={12} />
    </button>,
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
                <h2 className="text-lg font-bold text-slate-800">Sauda Report Date</h2>
                <p className="text-sm text-slate-500">View financed Saudas for a selected date</p>
              </div>
              <div className="w-full sm:w-72">
                <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Added Financers</h2>
                <p className="text-sm text-slate-500">Saved buyer-company financer mappings</p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {financers.length} Added
              </span>
            </div>
            <div className="overflow-x-auto">
              <Tables
                headers={["Sl No", "Group", "Buyer", "Buyer Company"]}
                rows={financerRows}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Sales Orders</h2>
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
                  headers={["Sl No", "Date", "Sauda No", "Seller Company", "Buyer Company", "Consignee", "Sell Quantity", "Rate", "Delivery Date", "Payment Terms"]}
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
                <h2 className="text-lg font-bold text-slate-800">Pending Quantity Lookup</h2>
                <p className="text-sm text-slate-500">Enter seller Sauda numbers to check pending quantity</p>
              </div>
              <Buttons label="Add Sauda" onClick={addSaudaRow} size="sm" icon={<FaPlus />} />
            </div>
            <div className="overflow-x-auto">
              <Tables
                headers={["Seller Sauda No", "Pending Quantity", "Status", "Actions"]}
                rows={saudaLookupRows}
              />
            </div>
          </section>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default FinanceReport;
