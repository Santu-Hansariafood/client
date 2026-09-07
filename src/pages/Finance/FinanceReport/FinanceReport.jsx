import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { FaPlus, FaTrash, FaUniversity } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DateRangeSelector from "../../../common/DateSelector/DateRangeSelector";
import Buttons from "../../../common/Buttons/Buttons";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const FinanceReport = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [orders, setOrders] = useState([]);
  const [financers, setFinancers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saudaRows, setSaudaRows] = useState([
    { id: Date.now(), saudaNo: "", pendingQuantity: null, status: "" },
  ]);
  const itemsPerPage = 10;

  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: String(group._id), label: group.groupName })),
    [groups],
  );
  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: String(company._id), label: company.companyName })),
    [companies],
  );

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingGroups(true);
      const response = await api.get("/financers/report", {
        params: {
          groupId: selectedGroup?.value || undefined,
          companyId: selectedCompany?.value || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: itemsPerPage,
        },
      });
      setOrders(response.data?.data || []);
      setFinancers(response.data?.financers || []);
      setTotal(Number(response.data?.total) || 0);
      setGroups(response.data?.groups || []);
      setCompanies(response.data?.companies || []);
    } catch (error) {
      setOrders([]);
      setFinancers([]);
      setTotal(0);
      toast.error(error.response?.data?.message || "Failed to load finance report");
    } finally {
      setLoading(false);
      setLoadingGroups(false);
    }
  }, [endDate, page, selectedCompany, selectedGroup, startDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedCompany(null);
    setPage(1);
  };

  const lookupSauda = async (rowId, saudaNo) => {
    const value = String(saudaNo || "").trim();
    if (!value) return;
    try {
      const response = await api.get("/financers/report", {
        params: {
          groupId: selectedGroup?.value || undefined,
          companyId: selectedCompany?.value || undefined,
          saudaNos: value,
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <DataDropdown
                label="Group"
                options={groupOptions}
                selectedOptions={selectedGroup}
                onChange={handleGroupChange}
                placeholder={loadingGroups ? "Loading groups..." : "All financed groups"}
                isDisabled={loadingGroups}
              />
              <DataDropdown
                label="Buyer Company"
                options={companyOptions}
                selectedOptions={selectedCompany}
                onChange={(company) => {
                  setSelectedCompany(company);
                  setPage(1);
                }}
                placeholder="All financed buyer companies"
                isDisabled={!selectedGroup || companies.length === 0}
              />
              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Order Date
                </label>
                <DateRangeSelector
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={(value) => {
                    setStartDate(value);
                    setPage(1);
                  }}
                  onEndDateChange={(value) => {
                    setEndDate(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                />
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
