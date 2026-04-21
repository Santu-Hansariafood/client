import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { FaPlus, FaTrash, FaDownload, FaEdit } from "react-icons/fa";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

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
    deliveryDate: "",
    loadingWeight: "",
    unloadingWeight: "",
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
    buyerBrokerage: 0,
    sellerBrokerage: 0,
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
    const deliveryDate = order.poDate || order.createdAt || "";
    const formattedDeliveryDate = deliveryDate 
      ? new Date(deliveryDate).toISOString().split("T")[0] 
      : "";
      
    setLoadingEntries([{ 
      ...INITIAL_ENTRY, 
      deliveryDate: formattedDeliveryDate 
    }]);
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
    const deliveryDate = selectedOrder?.poDate || selectedOrder?.createdAt || "";
    const formattedDeliveryDate = deliveryDate 
      ? new Date(deliveryDate).toISOString().split("T")[0] 
      : "";
    setLoadingEntries([...loadingEntries, { ...INITIAL_ENTRY, deliveryDate: formattedDeliveryDate }]);
  };

  const handleRemoveEntry = (index) => {
    if (loadingEntries.length > 1) {
      const newEntries = loadingEntries.filter((_, i) => i !== index);
      setLoadingEntries(newEntries);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...loadingEntries];

    if (field === "loadingDate" || field === "dateOfIssue" || field === "deliveryDate") {
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
      field === "advance" ||
      field === "unloadingWeight"
    ) {
      const weight = parseFloat(newEntries[index].loadingWeight) || 0;
      const uWeight = parseFloat(newEntries[index].unloadingWeight) || 0;
      const rate = parseFloat(newEntries[index].freightRate) || 0;
      const advance = parseFloat(newEntries[index].advance) || 0;

      const total = +(weight * rate).toFixed(2);
      const balance = +(total - advance).toFixed(2);

      newEntries[index].totalFreight = total;
      newEntries[index].balance = balance;

      // Real-time brokerage calculation for display
      if (selectedOrder) {
        const buyerRate = selectedOrder.buyerBrokerage?.brokerageBuyer || 0;
        const sellerRate = selectedOrder.buyerBrokerage?.brokerageSupplier || 0;
        newEntries[index].buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
        newEntries[index].sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
      }
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

  const handleEditHistoryEntry = (entry) => {
    setEditingEntry({
      ...entry,
      loadingDate: entry.loadingDate ? new Date(entry.loadingDate).toISOString().split('T')[0] : '',
      dateOfIssue: entry.dateOfIssue ? new Date(entry.dateOfIssue).toISOString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteHistoryEntry = async (id) => {
    if (window.confirm("Are you sure you want to delete this loading entry?")) {
      try {
        await api.delete(`/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        // Refresh existing entries
        const response = await api.get(`/loading-entries/sauda/${selectedOrder.saudaNo}`);
        setExistingEntries(Array.isArray(response.data) ? response.data : []);
        
        // Refresh the selected order to update pending quantity
        const orderRes = await api.get(`/self-order/${selectedOrder._id}`);
        if (orderRes.data) {
          setSelectedOrder(orderRes.data);
        }
        handleSearch(); // Refresh main table
      } catch (error) {
        console.error("Error deleting entry:", error);
        toast.error("Failed to delete entry");
      }
    }
  };

  const handleUpdateEditingEntry = async () => {
    if (!editingEntry || !editingEntry._id) return;
    
    setIsSaving(true);
    try {
      const weight = parseFloat(editingEntry.loadingWeight) || 0;
      const rate = parseFloat(editingEntry.freightRate) || 0;
      const advance = parseFloat(editingEntry.advance) || 0;
      const total = +(weight * rate).toFixed(2);
      const balance = +(total - advance).toFixed(2);

      const payload = {
        ...editingEntry,
        totalFreight: total,
        balance: balance
      };

      await api.put(`/loading-entries/${editingEntry._id}`, payload);
      toast.success("Entry updated successfully");
      setIsEditModalOpen(false);
      setEditingEntry(null);
      
      // Refresh existing entries
      const response = await api.get(`/loading-entries/sauda/${selectedOrder.saudaNo}`);
      setExistingEntries(Array.isArray(response.data) ? response.data : []);

      // Refresh the selected order to update pending quantity
      const orderRes = await api.get(`/self-order/${selectedOrder._id}`);
      if (orderRes.data) {
        setSelectedOrder(orderRes.data);
      }
      handleSearch(); // Refresh main table
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error(error.response?.data?.message || "Failed to update entry");
    } finally {
      setIsSaving(false);
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

        {isEditModalOpen && editingEntry && (
          <PopupBox
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingEntry(null);
            }}
            title="Edit Loading Entry"
          >
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Loading Date</label>
                  <DataInput
                    type="date"
                    value={editingEntry.loadingDate}
                    onChange={(e) => setEditingEntry({...editingEntry, loadingDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Lorry Number</label>
                  <DataInput
                    value={editingEntry.lorryNumber}
                    onChange={(e) => setEditingEntry({...editingEntry, lorryNumber: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bags</label>
                  <DataInput
                    type="number"
                    value={editingEntry.bags}
                    onChange={(e) => setEditingEntry({...editingEntry, bags: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Loading Weight (Tons)</label>
                  <DataInput
                    type="number"
                    value={editingEntry.loadingWeight}
                    onChange={(e) => setEditingEntry({...editingEntry, loadingWeight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Freight Rate</label>
                  <DataInput
                    type="number"
                    value={editingEntry.freightRate}
                    onChange={(e) => setEditingEntry({...editingEntry, freightRate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Advance</label>
                  <DataInput
                    type="number"
                    value={editingEntry.advance}
                    onChange={(e) => setEditingEntry({...editingEntry, advance: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bill Number</label>
                  <DataInput
                    value={editingEntry.billNumber}
                    onChange={(e) => setEditingEntry({...editingEntry, billNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Driver Name</label>
                  <DataInput
                    value={editingEntry.driverName}
                    onChange={(e) => setEditingEntry({...editingEntry, driverName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Driver Phone</label>
                  <DataInput
                    value={editingEntry.driverPhoneNumber}
                    onChange={(e) => setEditingEntry({...editingEntry, driverPhoneNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEditingEntry}
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
                >
                  {isSaving ? "Saving..." : "Update Entry"}
                </button>
              </div>
            </div>
          </PopupBox>
        )}

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
                          <div className="flex gap-2">
                            {(userRole === "Admin" || userRole === "Employee") && (
                              <>
                                <button
                                  onClick={() => handleEditHistoryEntry(entry)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="Edit Entry"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteHistoryEntry(entry._id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Entry"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDownloadPDF(entry)}
                              className="p-2 text-slate-500 hover:text-emerald-600 transition"
                              title="Download PDF"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/30 px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                      <FaTruckLoading className="text-lg" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        New Loading Entry
                      </h3>
                      <p className="text-sm text-slate-500">
                        Add lorry details clearly and keep each loading record easy to review.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
                    <div className="p-4 sm:p-5 space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-sm">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            Loading Specification
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Enter transport, quantity and billing details for this lorry.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(entry)}
                          className="flex items-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-sm font-bold border border-purple-100"
                          title="Download Lorry Challan"
                        >
                          <FaDownload /> Challan
                        </button>
                        {loadingEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition border border-red-100"
                            title="Remove Entry"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                          Basic Details
                        </p>
                        <span className="inline-flex items-center rounded-full bg-white border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                          LORRY #{index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Loading Date
                          </label>
                          <DateSelector
                            selectedDate={entry.loadingDate}
                            onChange={(date) =>
                              handleEntryChange(index, "loadingDate", date)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Delivery Date
                          </label>
                          <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed shadow-inner">
                            {entry.deliveryDate ? formatDate(entry.deliveryDate) : "N/A"}
                          </div>
                          <p className="text-[9px] text-slate-400 italic">Auto-filled from Sauda</p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Bags Count
                          </label>
                          <DataInput
                            type="number"
                            value={entry.bags}
                            onChange={(e) =>
                              handleEntryChange(index, "bags", e.target.value)
                            }
                            placeholder="No. of bags"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-5">
                          Weight & Brokerage
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Loading Wt
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
                              className="bg-white border-blue-100 focus:border-blue-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Unloading Wt
                            </label>
                            <DataInput
                              type="number"
                              value={entry.unloadingWeight}
                              onChange={(e) =>
                                handleEntryChange(
                                  index,
                                  "unloadingWeight",
                                  e.target.value,
                                )
                              }
                              placeholder="0.00"
                              className="bg-white border-blue-100 focus:border-blue-400"
                            />
                          </div>
                          <div className="col-span-2 mt-2 p-3 bg-white rounded-xl border border-blue-100 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Buyer Brokerage</p>
                              <p className="text-sm font-bold text-blue-700">₹{entry.buyerBrokerage || 0}</p>
                            </div>
                            <div className="w-px h-8 bg-blue-100"></div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Seller Brokerage</p>
                              <p className="text-sm font-bold text-blue-700">₹{entry.sellerBrokerage || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-5">
                          Billing Details
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                              className="bg-white border-amber-100 focus:border-amber-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Issue Date
                            </label>
                            <DateSelector
                              selectedDate={entry.dateOfIssue}
                              onChange={(date) =>
                                handleEntryChange(index, "dateOfIssue", date)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-5">
                          Transport & Freight
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                              className="bg-white border-purple-100 focus:border-purple-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                              placeholder="Driver name"
                              className="bg-white border-purple-100 focus:border-purple-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                              className="bg-white border-purple-100 focus:border-purple-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-slate-100 bg-slate-50/30 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Total Freight
                        </p>
                        <p className="font-bold text-slate-800 text-xl">
                          ₹ {Number(entry.totalFreight).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4 flex flex-col items-center justify-center shadow-sm">
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
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Balance Due
                        </p>
                        <p className="font-bold text-amber-600 text-xl">
                          ₹ {Number(entry.balance).toFixed(2)}
                        </p>
                      </div>
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
