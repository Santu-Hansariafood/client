import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { FaPlus, FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaTruckLoading } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { capitalizeWords } from "../../../utils/textUtils/textUtils";
import useLoadingEntryData from "../../../hooks/useLoadingEntryData";
import useSaudaSuggestions from "../../../hooks/useSaudaSuggestions";
import useLoadingEntrySearch from "../../../hooks/useLoadingEntrySearch";

const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const SearchFiltersCard = ({
  loading,
  userRole,
  groups,
  selectedGroup,
  setSelectedGroup,
  filteredBuyers,
  selectedBuyer,
  setSelectedBuyer,
  consignees,
  selectedConsignee,
  setSelectedConsignee,
  sellers,
  selectedSellerName,
  setSelectedSellerName,
  sellerCompanies,
  selectedSellerCompany,
  setSelectedSellerCompany,
  allSellers,
  saudaSearch,
  setSaudaSearch,
  saudaSuggestions,
  isSaudaSuggestOpen,
  setIsSaudaSuggestOpen,
  handleSaudaSelection,
  handleSearch,
  handleClearFilters,
  resultCount,
}) => {
  const canSearch =
    userRole === "Seller" ? true : Boolean(selectedGroup?.value || saudaSearch.trim());

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-lg p-4 sm:p-6">
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Search Filters
              </p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                Find sauda entries quickly and add loading details smoothly
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                Results: {resultCount}
              </span>
              {userRole !== "Seller" && (
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Group first, then company
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div
              className={`grid grid-cols-1 gap-4 ${
                userRole !== "Seller" ? "md:grid-cols-4" : "md:grid-cols-2"
              }`}
            >
              {userRole !== "Seller" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-slate-700">
                      Group
                    </label>
                    <DataDropdown
                      options={groups}
                      selectedOptions={selectedGroup || null}
                      onChange={setSelectedGroup}
                      placeholder="Select Group"
                      isMulti={false}
                      isClearable
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Start by selecting the buyer group.
                    </p>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-slate-700">
                      Buyer Company
                    </label>
                    <DataDropdown
                      options={filteredBuyers}
                      selectedOptions={selectedBuyer || null}
                      onChange={setSelectedBuyer}
                      placeholder="Select Company"
                      isMulti={false}
                      isClearable
                      disabled={!selectedGroup}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shows company names only, single select.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Consignee
                </label>
                <DataDropdown
                  options={consignees}
                  selectedOptions={selectedConsignee || null}
                  onChange={setSelectedConsignee}
                  placeholder={
                    userRole !== "Seller" && !selectedBuyer
                      ? "Select Company First"
                      : "Select Consignee"
                  }
                  isMulti={false}
                  disabled={userRole !== "Seller" && !selectedBuyer}
                  isClearable
                />
              </div>
              <div className="relative">
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Sauda No
                </label>
                <input
                  type="text"
                  value={saudaSearch}
                  onChange={(e) => setSaudaSearch(e.target.value)}
                  onFocus={() => {
                    if (saudaSuggestions.length > 0)
                      setIsSaudaSuggestOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsSaudaSuggestOpen(false), 120);
                  }}
                  placeholder="Search by Sauda No"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition shadow-sm"
                />

                {isSaudaSuggestOpen && saudaSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                    {saudaSuggestions.map((o) => (
                      <button
                        key={String(o.saudaNo)}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSaudaSelection(o);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0"
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          Sauda: {o.saudaNo}
                          {o._count > 1 ? ` (${o._count})` : ""}
                        </div>
                        <div className="text-xs text-slate-500">
                          {capitalizeWords(o.consignee)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Seller Name
                </label>
                <DataDropdown
                  options={sellers}
                  selectedOptions={selectedSellerName || null}
                  onChange={setSelectedSellerName}
                  placeholder={
                    userRole !== "Seller" &&
                    !selectedBuyer &&
                    !saudaSearch.trim()
                      ? "Select Buyer or Sauda"
                      : "Select Seller"
                  }
                  isMulti={false}
                  disabled={
                    userRole !== "Seller" &&
                    !selectedBuyer &&
                    !saudaSearch.trim()
                  }
                  isClearable
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Seller Company
                </label>
                <DataDropdown
                  options={sellerCompanies}
                  selectedOptions={selectedSellerCompany || null}
                  onChange={setSelectedSellerCompany}
                  placeholder="Select Company"
                  isMulti={false}
                  isClearable
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search Loading Entries
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 transition font-semibold border border-slate-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersTableCard = ({ orders, handleOpenPopup, toggleSaudaStatus }) => {
  const activeCount = orders.filter((order) => order.status !== "closed").length;
  const closedCount = orders.length - activeCount;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Loading Search Results
          </p>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            Matched Sauda Entries
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Total: {orders.length}
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Active: {activeCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            Closed: {closedCount}
          </span>
        </div>
      </div>
      {orders.length > 0 ? (
        <Tables
          headers={[
            "Date",
            "Sauda No",
            "Seller Name",
            "Company",
            "Consignee",
            "Commodity",
            "Quantity",
            "Rate",
            "Pending Quantity",
            "Status",
            "Action",
          ]}
          rows={orders.map((order) => [
            formatDate(order.poDate || order.createdAt),
            order.saudaNo,
            capitalizeWords(order.supplierCompany),
            capitalizeWords(order.buyerCompany),
            capitalizeWords(order.consignee),
            capitalizeWords(order.commodity),
            order.quantity,
            order.rate,
            order.pendingQuantity,
            <span
              key={`status-${order._id}`}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                order.isClosed
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {order.isClosed ? "Closed" : "Active"}
            </span>,
            <div
              key={`actions-${order._id}`}
              className="flex items-center gap-3"
            >
              {order.status !== "closed" ? (
                <>
                  <button
                    onClick={() => handleOpenPopup(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-xs font-bold whitespace-nowrap"
                    title="Add Loading Entry"
                  >
                    <FaPlus /> Add Loading Entry
                  </button>
                  <button
                    onClick={() => toggleSaudaStatus(order)}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-xs font-bold"
                    title="Close Sauda"
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleSaudaStatus(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-bold"
                  title="Reopen Sauda"
                >
                  Reopen to Add
                </button>
              )}
            </div>,
          ])}
        />
      ) : (
        <div className="py-10 text-center text-slate-500 font-medium">
          No results found. Please adjust your filters.
        </div>
      )}
    </div>
  );
};

const AddLoadingEntry = () => {
  const { userRole } = useAuth();

  // Custom Hooks for data fetching and state management
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    filteredBuyers,
    selectedBuyer,
    setSelectedBuyer,
    consignees,
    selectedConsignee,
    setSelectedConsignee,
    allSellers,
    sellers,
    selectedSellerName,
    setSelectedSellerName,
    sellerCompanies,
    selectedSellerCompany,
    setSelectedSellerCompany,
    transporters,
  } = useLoadingEntryData(api, userRole);

  const {
    saudaSearch,
    setSaudaSearch,
    saudaSuggestions,
    isSaudaSuggestOpen,
    setIsSaudaSuggestOpen,
    handleSaudaSelection,
  } = useSaudaSuggestions(
    api,
    selectedGroup,
    selectedBuyer,
    filteredBuyers,
    allSellers,
    setSelectedBuyer,
    setSelectedConsignee,
    setSelectedSellerName,
    setSelectedSellerCompany,
  );

  const {
    results: orders,
    setResults: setOrders,
    loading,
    handleSearch,
  } = useLoadingEntrySearch(
    api,
    selectedGroup,
    selectedBuyer,
    selectedConsignee,
    selectedSellerName,
    selectedSellerCompany,
    saudaSearch,
  );

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [existingEntries, setExistingEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleClearFilters = useCallback(() => {
    setSelectedGroup(null);
    setSelectedBuyer(null);
    setSelectedConsignee(null);
    setSelectedSellerName(null);
    setSelectedSellerCompany(null);
    setSaudaSearch("");
    setOrders([]);
  }, [
    setSelectedGroup,
    setSelectedBuyer,
    setSelectedConsignee,
    setSelectedSellerName,
    setSelectedSellerCompany,
    setSaudaSearch,
    setOrders,
  ]);

  const selectedSummary = useMemo(
    () =>
      [
        selectedGroup?.label,
        selectedBuyer?.label,
        selectedConsignee?.label,
        selectedSellerName?.label,
        selectedSellerCompany?.label,
      ].filter(Boolean),
    [
      selectedGroup,
      selectedBuyer,
      selectedConsignee,
      selectedSellerName,
      selectedSellerCompany,
    ],
  );

  const INITIAL_ENTRY = {
    loadingDate: new Date().toISOString().split("T")[0],
    loadingWeight: "",
    bags: "",
    lorryNumber: "",
    transporterId: "",
    addedTransport: "",
    driverName: "",
    driverPhoneNumber: "",
    freightRate: "",
    totalFreight: 0,
    advance: 0,
    balance: 0,
    billNumber: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
    status: "open",
  };

  useEffect(() => {
    if (selectedGroup?.value) {
      handleSearch();
    }
  }, [selectedGroup, selectedBuyer, selectedConsignee, handleSearch]);

  const toggleSaudaStatus = async (order) => {
    if (userRole === "Seller") {
      toast.error("Only Admin/Employee can change Sauda status.");
      return;
    }
    try {
      const newStatus = order.status === "closed" ? "active" : "closed";
      await api.put(`/self-order/${order._id}`, { status: newStatus });
      handleSearch();
    } catch (error) {
      console.error("Error updating sauda status:", error);
    }
  };

  const handleOpenPopup = async (order) => {
    setSelectedOrder(order);
    setLoadingEntries([{ ...INITIAL_ENTRY }]);
    setIsPopupOpen(true);
    setExistingEntries([]); // Clear previous data

    // Fetch existing entries for this sauda
    try {
      const response = await api.get(`/loading-entries/sauda/${order.saudaNo}`);
      setExistingEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching existing entries:", error);
      // toast.error("Could not load previous loading history");
    }
  };

  const handleAddMore = () => {
    setLoadingEntries([...loadingEntries, { ...INITIAL_ENTRY }]);
  };

  const handleRemoveEntry = (index) => {
    if (loadingEntries.length > 1) {
      const newEntries = loadingEntries.filter((_, i) => i !== index);
      setLoadingEntries(newEntries);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...loadingEntries];

    if (field === "loadingDate" || field === "dateOfIssue") {
      const d = new Date(value);
      newEntries[index][field] = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : "";
    } else {
      newEntries[index][field] = value;
    }

    if (
      field === "loadingWeight" ||
      field === "freightRate" ||
      field === "advance"
    ) {
      const weight = parseFloat(newEntries[index].loadingWeight) || 0;
      const rate = parseFloat(newEntries[index].freightRate) || 0;
      const advance = parseFloat(newEntries[index].advance) || 0;

      const total = +(weight * rate).toFixed(2);
      const balance = +(total - advance).toFixed(2);

      newEntries[index].totalFreight = total;
      newEntries[index].balance = balance;
    }

    setLoadingEntries(newEntries);
  };
  const calculateTotalLoadingWeight = () => {
    return loadingEntries.reduce(
      (sum, entry) => sum + (parseFloat(entry.loadingWeight) || 0),
      0,
    );
  };

  const handleSaveEntries = async () => {
    if (!selectedOrder) return;

    setIsSaving(true);

    for (const entry of loadingEntries) {
      const weight = parseFloat(entry.loadingWeight) || 0;
      const rate = parseFloat(entry.freightRate) || 0;
      const advance = parseFloat(entry.advance) || 0;

      if (weight < 0 || rate < 0 || advance < 0) {
        toast.error("Values cannot be negative");
        setIsSaving(false);
        return;
      }

      if (
        entry.driverPhoneNumber &&
        !/^\d{10}$/.test(entry.driverPhoneNumber)
      ) {
        toast.error("Invalid phone number");
        setIsSaving(false);
        return;
      }
    }

    const totalNewWeight = calculateTotalLoadingWeight();
    const pending = selectedOrder.pendingQuantity || 0;

    if (totalNewWeight > pending + selectedOrder.quantity * 0.05) {
      // Allow 5% tolerance
      const confirmSave = window.confirm(
        `Total loading weight (${totalNewWeight.toFixed(2)} Tons) exceeds pending quantity (${pending.toFixed(2)} Tons). Do you want to proceed?`,
      );
      if (!confirmSave) {
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
        saudaNo: selectedOrder.saudaNo,
        entries: loadingEntries.map((entry) => ({
          ...entry,
          saudaNo: selectedOrder.saudaNo,
          supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
          supplierCompany: selectedOrder.supplierCompany,
          consignee: selectedOrder.consignee,
          commodity: selectedOrder.commodity,
          bags: entry.bags,
          status: entry.status || "open",
        })),
      };

      await api.post("/loading-entries/bulk", payload);
      toast.success("All loading entries saved successfully");
      setIsPopupOpen(false);
      handleSearch();
    } catch (error) {
      console.error("Error saving entries:", error);
      toast.error(error.response?.data?.message || "Failed to save entries");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDownloadPDF = async (entry) => {
    try {
      const fullEntry = {
        ...entry,
        saudaNo: selectedOrder.saudaNo,
        supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
        supplierCompany: selectedOrder.supplierCompany,
        consignee: selectedOrder.consignee,
        commodity: selectedOrder.commodity,
        bags: entry.bags,
      };
      const fileUrl = await PrintLoadingEntry(fullEntry);
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `LoadingEntry-${entry.billNumber || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (
    userRole !== "Admin" &&
    userRole !== "Employee" &&
    userRole !== "Seller"
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-medium">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={
          userRole === "Seller" ? "Add Your Loading Entry" : "Add Loading Entry"
        }
        subtitle={
          userRole === "Seller"
            ? "Create challans for your orders"
            : "Select group, buyer, consignee, seller name and seller company to find sauda entries for loading"
        }
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <SearchFiltersCard
            loading={loading}
            userRole={userRole}
            groups={groups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            filteredBuyers={filteredBuyers}
            selectedBuyer={selectedBuyer}
            setSelectedBuyer={setSelectedBuyer}
            consignees={consignees}
            selectedConsignee={selectedConsignee}
            setSelectedConsignee={setSelectedConsignee}
            sellers={sellers}
            selectedSellerName={selectedSellerName}
            setSelectedSellerName={setSelectedSellerName}
            sellerCompanies={sellerCompanies}
            selectedSellerCompany={selectedSellerCompany}
            setSelectedSellerCompany={setSelectedSellerCompany}
            allSellers={allSellers}
            saudaSearch={saudaSearch}
            setSaudaSearch={setSaudaSearch}
            saudaSuggestions={saudaSuggestions}
            isSaudaSuggestOpen={isSaudaSuggestOpen}
            setIsSaudaSuggestOpen={setIsSaudaSuggestOpen}
            handleSaudaSelection={handleSaudaSelection}
            handleSearch={handleSearch}
            handleClearFilters={handleClearFilters}
            resultCount={orders.length}
          />

          {selectedSummary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSummary.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          <OrdersTableCard
            orders={orders}
            handleOpenPopup={handleOpenPopup}
            toggleSaudaStatus={toggleSaudaStatus}
          />
        </div>

        {isPopupOpen && selectedOrder && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={`Add Loading Entry - Sauda: ${selectedOrder.saudaNo}`}
            maxWidth="max-w-[98vw] max-w-none"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 shadow-inner">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Total Quantity</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(selectedOrder.quantity || 0).toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Already Loaded</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(
                      (selectedOrder.quantity || 0) -
                      (selectedOrder.pendingQuantity || 0)
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-emerald-600 font-medium">
                    Currently Adding
                  </p>
                  <p className="font-bold text-emerald-700 text-lg">
                    {calculateTotalLoadingWeight().toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-100">
                  <p className="text-amber-600 font-medium">
                    Remaining Pending
                  </p>
                  <p className="font-bold text-amber-700 text-lg">
                    {Math.max(
                      0,
                      (selectedOrder.pendingQuantity || 0) -
                        calculateTotalLoadingWeight(),
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar p-2">
                {/* Previous Loading History Section */}
                {existingEntries.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2">
                      <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                      Previous Loading History ({existingEntries.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {existingEntries.map((entry, idx) => (
                        <div
                          key={`history-${idx}`}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between opacity-80"
                        >
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Date
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {formatDate(entry.loadingDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Lorry
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {entry.lorryNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Weight
                              </p>
                              <p className="text-sm font-bold text-emerald-600">
                                {entry.loadingWeight} Tons
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Bill No
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {entry.billNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadPDF(entry)}
                            className="p-2 text-slate-500 hover:text-emerald-600 transition"
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  New Loading Entry
                </h3>

                {loadingEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 border border-slate-200 rounded-3xl space-y-6 relative bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-700">
                          Loading Specification
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(entry)}
                          className="flex items-center gap-2 px-3 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-sm font-bold border border-purple-100"
                          title="Download Lorry Challan"
                        >
                          <FaDownload /> Challan
                        </button>
                        {loadingEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition border border-red-100"
                            title="Remove Entry"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Loading Date
                        </label>
                        <DateSelector
                          selectedDate={entry.loadingDate}
                          onChange={(date) =>
                            handleEntryChange(index, "loadingDate", date)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Weight (Tons)
                        </label>
                        <DataInput
                          type="number"
                          value={entry.loadingWeight}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "loadingWeight",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bags Count
                        </label>
                        <DataInput
                          type="number"
                          value={entry.bags}
                          onChange={(e) =>
                            handleEntryChange(index, "bags", e.target.value)
                          }
                          placeholder="No. of bags"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Lorry Number
                        </label>
                        <DataInput
                          value={entry.lorryNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "lorryNumber",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. RJ 14 GA 1234"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Transporter
                        </label>
                        <DataDropdown
                          options={transporters}
                          selectedOptions={
                            entry.transporterId
                              ? [
                                  transporters.find(
                                    (t) => t.value === entry.transporterId,
                                  ),
                                ].filter(Boolean)
                              : []
                          }
                          onChange={(option) => {
                            const newEntries = [...loadingEntries];
                            newEntries[index].transporterId =
                              option?.value || "";
                            newEntries[index].addedTransport =
                              option?.name || "";
                            setLoadingEntries(newEntries);
                          }}
                          placeholder="Select Transporter"
                          isMulti={false}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Name
                        </label>
                        <DataInput
                          value={entry.driverName}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverName",
                              e.target.value,
                            )
                          }
                          placeholder="Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Mobile
                        </label>
                        <DataInput
                          value={entry.driverPhoneNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverPhoneNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Freight Rate
                        </label>
                        <DataInput
                          type="number"
                          value={entry.freightRate}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "freightRate",
                              e.target.value,
                            )
                          }
                          placeholder="Rs. per ton"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Number
                        </label>
                        <DataInput
                          value={entry.billNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "billNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Invoice no."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Issue Date
                        </label>
                        <DateSelector
                          selectedDate={entry.dateOfIssue}
                          onChange={(date) =>
                            handleEntryChange(index, "dateOfIssue", date)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Total Freight
                        </p>
                        <p className="font-bold text-slate-800 text-lg">
                          ₹ {Number(entry.totalFreight).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Advance Amount
                        </p>
                        <div className="max-w-[120px]">
                          <DataInput
                            type="number"
                            className="text-center font-bold !py-1"
                            value={entry.advance}
                            onChange={(e) =>
                              handleEntryChange(
                                index,
                                "advance",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Balance Due
                        </p>
                        <p className="font-bold text-amber-600 text-lg">
                          ₹ {Number(entry.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                <button
                  onClick={handleAddMore}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all font-bold shadow-lg shadow-slate-200 active:scale-95"
                >
                  <FaPlus /> Add More Lorry
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="flex-1 sm:flex-none px-8 py-3 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition font-bold border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntries}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-12 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? "Saving..." : "Save All Lorry"}
                  </button>
                </div>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default AddLoadingEntry;
