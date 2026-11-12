import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useCallback,
  useMemo,
} from "react";
import {
  FaPlus,
  FaTrash,
  FaDownload,
  FaEdit,
  FaArrowLeft,
  FaTruckLoading,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { downloadFile } from "../../../utils/fileDownloader";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { capitalizeWords } from "../../../utils/textUtils/textUtils";
import useLoadingEntryData from "../../../hooks/useLoadingEntryData";
import useSaudaSuggestions from "../../../hooks/useSaudaSuggestions";
import useLoadingEntrySearch from "../../../hooks/useLoadingEntrySearch";
import stateCityData from "../../../data/state-city.json";

const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
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
    userRole === "Seller"
      ? true
      : Boolean(selectedGroup?.value || saudaSearch.trim());

  return (
    <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="lux-eyebrow text-lux-muted">
                Search Filters
              </p>
              <h3 className="font-serif text-lg font-semibold text-lux-ink mt-1">
                Find sauda entries quickly and add loading details smoothly
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-lux-gold/30 bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-emerald">
                Results: {resultCount}
              </span>
              {userRole !== "Seller" && (
                <span className="inline-flex items-center rounded-full border border-lux-gold/30 bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-emerald">
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
                    <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                    <p className="mt-1 text-xs text-lux-muted">
                      Start by selecting the buyer group.
                    </p>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                    <p className="mt-1 text-xs text-lux-muted">
                      Shows company names only, single select.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2.5 focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald outline-none transition shadow-sm"
                />

                {isSaudaSuggestOpen && saudaSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                    {saudaSuggestions.map((o) => (
                      <button
                        key={String(o.saudaNo)}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSaudaSelection(o);
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-lux-ivory transition border-b border-[#ece4d2] last:border-b-0"
                      >
                        <div className="text-sm font-semibold text-lux-ink">
                          Sauda: {o.saudaNo}
                          {o._count > 1 ? ` (${o._count})` : ""}
                        </div>
                        <div className="text-xs text-lux-muted">
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
                <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                    userRole === "Seller" ||
                    (userRole !== "Seller" &&
                      !selectedBuyer &&
                      !saudaSearch.trim())
                  }
                  isClearable={userRole !== "Seller"}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Seller Company
                </label>
                <DataDropdown
                  options={sellerCompanies}
                  selectedOptions={selectedSellerCompany || null}
                  onChange={setSelectedSellerCompany}
                  placeholder="Select Company"
                  isMulti={false}
                  disabled={userRole === "Seller"}
                  isClearable={userRole !== "Seller"}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search Loading Entries
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-[0.97]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersTableCard = ({
  orders,
  handleOpenPopup,
  toggleSaudaStatus,
  userRole,
}) => {
  const activeCount = orders.filter(
    (order) => order.status !== "closed",
  ).length;
  const closedCount = orders.length - activeCount;

  return (
    <div className="lux-card overflow-hidden w-full p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="lux-eyebrow text-lux-muted">
            Loading Search Results
          </p>
          <h3 className="font-serif text-lg font-semibold text-lux-ink mt-1">
            Matched Sauda Entries
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-lux-gold/30 bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-emerald">
            Total: {orders.length}
          </span>
          <span className="inline-flex items-center rounded-full border border-lux-gold/30 bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-emerald">
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
          rows={orders.map((order) => {
            const isClosed = order.status === "closed";

            return [
              formatDate(order.poDate || order.createdAt),
              <div key={`sauda-${order._id}`} className="flex flex-col">
                <span className="font-bold">{order.saudaNo}</span>
                {order.closeRemarks && (
                  <span className="text-[10px] text-rose-500 italic max-w-[120px] truncate" title={order.closeRemarks}>
                    {order.closeRemarks}
                  </span>
                )}
              </div>,
              capitalizeWords(order.supplierCompany),
              capitalizeWords(order.buyerCompany),
              capitalizeWords(order.consignee),
              capitalizeWords(order.commodity),
              order.quantity,
              order.rate,
              order.pendingQuantity,
              <span
                key={`status-${order._id}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  isClosed
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-lux-gold/30 bg-lux-ivory text-lux-emerald"
                }`}
              >
                {isClosed ? "Closed" : "Active"}
              </span>,
              <div
                key={`actions-${order._id}`}
                className="flex items-center gap-3"
              >
                {!isClosed ? (
                  <>
                    <button
                      onClick={() => handleOpenPopup(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-lux-ivory text-lux-emerald rounded-lg border border-lux-gold/30 hover:bg-white transition text-xs font-bold whitespace-nowrap"
                      title="Add Loading Entry"
                    >
                      <FaPlus /> Add Loading Entry
                    </button>
                    {(userRole === "Admin" || userRole === "Employee") && (
                      <button
                        onClick={() => toggleSaudaStatus(order)}
                        className="px-2.5 py-1.5 bg-lux-ivory text-lux-emerald rounded-lg border border-lux-gold/30 hover:bg-white transition text-xs font-bold"
                        title="Close Sauda"
                      >
                        Close
                      </button>
                    )}
                  </>
                ) : (userRole === "Admin" || userRole === "Employee") ? (
                  <button
                    onClick={() => toggleSaudaStatus(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-lux-ivory text-lux-muted rounded-lg border border-[#ece4d2] hover:bg-white transition text-xs font-bold"
                    title="Reopen Sauda"
                  >
                    Reopen
                  </button>
                ) : (
                  <span className="text-xs font-bold text-lux-muted italic px-3 py-1.5">
                    Closed
                  </span>
                )}
              </div>,
            ];
          })}
        />
      ) : (
        <div className="py-10 text-center text-lux-muted font-medium">
          No results found. Please adjust your filters.
        </div>
      )}
    </div>
  );
};

const AddLoadingEntry = () => {
  const { userRole, user } = useAuth();

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
  } = useLoadingEntryData(api, userRole, user);

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
    userRole,
  );

  const [activeView, setActiveView] = useState("list");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [existingEntries, setExistingEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
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
    unloadingDate: "",
    dueDate: "",
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
    sellerBillNo: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
    buyerBrokerage: 0,
    sellerBrokerage: 0,
    loadingFrom: "",
    status: "open",
  };

  const getPaymentTermsDays = (paymentTerms) => {
    if (paymentTerms === null || paymentTerms === undefined) return 0;
    const numericValue =
      typeof paymentTerms === "number"
        ? paymentTerms
        : parseInt(String(paymentTerms).match(/\d+/)?.[0] || "0", 10);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const calculateDueDate = (baseDate, paymentTerms) => {
    if (!baseDate) return "";
    const parsedDate = new Date(baseDate);
    if (Number.isNaN(parsedDate.getTime())) return "";
    parsedDate.setHours(0, 0, 0, 0);
    parsedDate.setDate(parsedDate.getDate() + getPaymentTermsDays(paymentTerms));
    return parsedDate.toISOString().split("T")[0];
  };

  const stateOptions = useMemo(() => {
    return stateCityData.map((item) => ({
      value: item.state,
      label: item.state,
    }));
  }, []);

  useEffect(() => {
    if (selectedGroup?.value || userRole === "Seller") {
      handleSearch();
    }
  }, [selectedGroup, selectedBuyer, selectedConsignee, handleSearch, userRole]);

  const toggleSaudaStatus = async (order) => {
    if (userRole === "Seller") {
      toast.error("Only Admin/Employee can change Sauda status.");
      return;
    }
    try {
      const isClosing = order.status !== "closed";
      let remarks = "";
      
      if (isClosing) {
        remarks = window.prompt("Enter remarks for closing this sauda:", "");
        if (remarks === null) return; // User cancelled
      }

      const newStatus = isClosing ? "closed" : "active";
      await api.put(`/self-order/${order._id}`, { 
        status: newStatus,
        closeRemarks: remarks 
      });
      
      toast.success(`Sauda ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully`);
      handleSearch();
    } catch (error) {
      console.error("Error updating sauda status:", error);
      toast.error("Failed to update sauda status");
    }
  };

  const handleOpenPopup = async (order) => {
    setSelectedOrder(order);
    const deliveryDate = order.poDate || order.createdAt || "";
    const formattedDeliveryDate = deliveryDate
      ? new Date(deliveryDate).toISOString().split("T")[0]
      : "";

    setLoadingEntries([
      {
        ...INITIAL_ENTRY,
        deliveryDate: formattedDeliveryDate,
      },
    ]);
    setActiveView("add");
    setExistingEntries([]);

    try {
      const response = await api.get(`/loading-entries/sauda/${order.saudaNo}`);
      setExistingEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching existing entries:", error);
    }
  };

  const handleAddMore = () => {
    const deliveryDate =
      selectedOrder?.poDate || selectedOrder?.createdAt || "";
    const formattedDeliveryDate = deliveryDate
      ? new Date(deliveryDate).toISOString().split("T")[0]
      : "";
    setLoadingEntries([
      ...loadingEntries,
      { ...INITIAL_ENTRY, deliveryDate: formattedDeliveryDate },
    ]);
  };

  const handleRemoveEntry = (index) => {
    if (loadingEntries.length > 1) {
      const newEntries = loadingEntries.filter((_, i) => i !== index);
      setLoadingEntries(newEntries);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...loadingEntries];

    if (
      field === "loadingDate" ||
      field === "unloadingDate" ||
      field === "dateOfIssue" ||
      field === "deliveryDate" ||
      field === "dueDate"
    ) {
      const d = new Date(value);
      newEntries[index][field] = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : "";
    } else if (field === "driverPhoneNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      const maxLength = 11;
      newEntries[index][field] = digitsOnly.slice(0, maxLength);
    } else {
      newEntries[index][field] = value;
    }

    if (field === "unloadingDate") {
      newEntries[index].dueDate = calculateDueDate(
        newEntries[index].unloadingDate,
        selectedOrder?.paymentTerms,
      );
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
        !/^0?\d{10}$/.test(entry.driverPhoneNumber)
      ) {
        toast.error(
          "Invalid phone number - should be 10 digits (can start with 0)",
        );
        setIsSaving(false);
        return;
      }
    }

    const totalNewWeight = calculateTotalLoadingWeight();
    const pending = selectedOrder.pendingQuantity || 0;

    if (totalNewWeight > pending + selectedOrder.quantity * 0.05) {
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
          buyerCompany: selectedOrder.buyerCompany,
          consignee: selectedOrder.consignee,
          commodity: selectedOrder.commodity,
          bags: entry.bags,
          status: entry.status || "open",
        })),
      };

      await api.post("/loading-entries/bulk", payload);
      clearApiCache();
      toast.success("All loading entries saved successfully");
      setActiveView("list");
      setSelectedOrder(null);
      setLoadingEntries([]);
      setExistingEntries([]);
      handleSearch();
    } catch (error) {
      console.error("Error saving entries:", error);
      toast.error(error.response?.data?.message || "Failed to save entries");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDownloadPDF = async (entry) => {
    let toastId;
    try {
      if (!entry._id) {
        toast.error("Please save the entry first before downloading.");
        return;
      }
      toastId = toast.loading("Preparing PDF...");

      const blob = await PrintLoadingEntry(entry);
      if (!blob) return;

      let fileName = `Lorry Challan - ${entry.lorryNumber || "document"}`;
      if (entry.billNumber) {
        fileName += ` and Bill - ${entry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Download started successfully!");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleEditHistoryEntry = (entry) => {
    setEditingEntry({
      ...entry,
      loadingDate: entry.loadingDate
        ? new Date(entry.loadingDate).toISOString().split("T")[0]
        : "",
      unloadingDate: entry.unloadingDate
        ? new Date(entry.unloadingDate).toISOString().split("T")[0]
        : "",
      dueDate: entry.dueDate
        ? new Date(entry.dueDate).toISOString().split("T")[0]
        : calculateDueDate(
            entry.unloadingDate
              ? new Date(entry.unloadingDate).toISOString().split("T")[0]
              : "",
            selectedOrder?.paymentTerms,
          ),
      dateOfIssue: entry.dateOfIssue
        ? new Date(entry.dateOfIssue).toISOString().split("T")[0]
        : "",
    });
    setActiveView("edit");
  };

  const handleDeleteHistoryEntry = async (id) => {
    if (window.confirm("Are you sure you want to delete this loading entry?")) {
      try {
        await api.delete(`/loading-entries/${id}`);
        clearApiCache();
        toast.success("Entry deleted successfully");
        const response = await api.get(
          `/loading-entries/sauda/${selectedOrder.saudaNo}`,
        );
        setExistingEntries(Array.isArray(response.data) ? response.data : []);

        const orderRes = await api.get(`/self-order/${selectedOrder._id}`);
        if (orderRes.data) {
          setSelectedOrder(orderRes.data);
        }
        handleSearch();
      } catch (error) {
        console.error("Error deleting entry:", error);
        toast.error("Failed to delete entry");
      }
    }
  };

  const handleUpdateEditingEntry = async () => {
    if (!editingEntry || !editingEntry._id) return;

    const loadingWt = parseFloat(editingEntry.loadingWeight) || 0;
    const unloadingWt = parseFloat(editingEntry.unloadingWeight) || 0;
    if (loadingWt > 0 && unloadingWt > loadingWt) {
      toast.error(
        `Unloading Weight (${unloadingWt.toFixed(3)} Tons) cannot exceed Loading Weight (${loadingWt.toFixed(3)} Tons)`,
      );
      return;
    }

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
        balance: balance,
      };

      await api.put(`/loading-entries/${editingEntry._id}`, payload);
      clearApiCache();
      toast.success("Entry updated successfully");
      setActiveView("add");
      setEditingEntry(null);

      const response = await api.get(
        `/loading-entries/sauda/${selectedOrder.saudaNo}`,
      );
      setExistingEntries(Array.isArray(response.data) ? response.data : []);

      const orderRes = await api.get(`/self-order/${selectedOrder._id}`);
      if (orderRes.data) {
        setSelectedOrder(orderRes.data);
      }
      handleSearch();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error(error.response?.data?.message || "Failed to update entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setActiveView("list");
    setSelectedOrder(null);
    setLoadingEntries([]);
    setExistingEntries([]);
    setEditingEntry(null);
  };

  const handleBackToAdd = () => {
    setActiveView("add");
    setEditingEntry(null);
  };

  if (
    userRole !== "Admin" &&
    userRole !== "Employee" &&
    userRole !== "Seller"
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-lux-muted font-medium">
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
        {activeView === "list" && (
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
                    className="inline-flex items-center rounded-full border border-lux-gold/30 bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-emerald"
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
              userRole={userRole}
            />
          </div>
        )}

        {activeView === "edit" && editingEntry && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleBackToAdd}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-lux-cream text-lux-emerald border border-[#e4dbc6] hover:bg-white font-bold shadow-sm transition"
              >
                <FaArrowLeft /> Back
              </button>
              <h2 className="font-serif text-xl font-semibold text-lux-ink">
                Edit Loading Entry
              </h2>
            </div>

            <div className="space-y-6 p-4 rounded-3xl lux-card w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Loading Date
                  </label>
                  <DateSelector
                    selectedDate={editingEntry.loadingDate}
                    onChange={(date) =>
                      setEditingEntry({
                        ...editingEntry,
                        loadingDate: date
                          ? new Date(date).toISOString().split("T")[0]
                          : "",
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Unloading Date
                  </label>
                  <DateSelector
                    selectedDate={editingEntry.unloadingDate}
                    onChange={(date) =>
                      setEditingEntry({
                        ...editingEntry,
                        unloadingDate: date
                          ? new Date(date).toISOString().split("T")[0]
                          : "",
                        dueDate: date
                          ? calculateDueDate(
                              new Date(date).toISOString().split("T")[0],
                              selectedOrder?.paymentTerms,
                            )
                          : "",
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Due Date
                  </label>
                  <DateSelector
                    selectedDate={editingEntry.dueDate}
                    onChange={(date) =>
                      setEditingEntry({
                        ...editingEntry,
                        dueDate: date
                          ? new Date(date).toISOString().split("T")[0]
                          : "",
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Loading From
                  </label>
                  <DataDropdown
                    options={stateOptions}
                    selectedOptions={
                      editingEntry.loadingFrom
                        ? stateOptions.find(
                            (s) => s.value === editingEntry.loadingFrom,
                          ) || null
                        : null
                    }
                    onChange={(option) => {
                      setEditingEntry({
                        ...editingEntry,
                        loadingFrom: option?.value || "",
                      });
                    }}
                    placeholder="Select State"
                    isMulti={false}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Lorry Number
                  </label>
                  <DataInput
                    value={editingEntry.lorryNumber}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        lorryNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Bags
                  </label>
                  <DataInput
                    type="number"
                    value={editingEntry.bags}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, bags: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Loading Weight (Tons)
                  </label>
                  <DataInput
                    type="number"
                    value={editingEntry.loadingWeight}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        loadingWeight: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Unloading Weight (Tons)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      editingEntry.unloadingWeight != null &&
                      editingEntry.unloadingWeight !== ""
                        ? editingEntry.unloadingWeight
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d{0,3}$/.test(val)) {
                        setEditingEntry({
                          ...editingEntry,
                          unloadingWeight: val,
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border border-[#e4dbc6] bg-lux-cream shadow-sm focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald outline-none transition text-sm ${
                      editingEntry.loadingWeight &&
                      editingEntry.unloadingWeight &&
                      parseFloat(editingEntry.unloadingWeight) >
                        parseFloat(editingEntry.loadingWeight)
                        ? "border-red-400 bg-red-50 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="e.g. 14.202 or 102.230"
                  />
                  {editingEntry.loadingWeight &&
                    editingEntry.unloadingWeight &&
                    parseFloat(editingEntry.unloadingWeight) >
                      parseFloat(editingEntry.loadingWeight) && (
                      <p className="text-xs text-red-600 font-semibold">
                        ⚠ Unloading Weight cannot exceed Loading Weight (
                        {Number(editingEntry.loadingWeight).toFixed(3)} Tons)
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Freight Rate
                  </label>
                  <DataInput
                    type="number"
                    value={editingEntry.freightRate}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        freightRate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Advance
                  </label>
                  <DataInput
                    type="number"
                    value={editingEntry.advance}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        advance: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Bill Number
                  </label>
                  <DataInput
                    value={editingEntry.billNumber}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        billNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Seller Bill No
                  </label>
                  <DataInput
                    value={editingEntry.sellerBillNo}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        sellerBillNo: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Driver Name
                  </label>
                  <DataInput
                    value={editingEntry.driverName}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        driverName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-lux-muted uppercase font-serif">
                    Driver Phone
                  </label>
                  <DataInput
                    value={editingEntry.driverPhoneNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      setEditingEntry({
                        ...editingEntry,
                        driverPhoneNumber: digitsOnly.slice(0, 11),
                      });
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#ece4d2]">
                <button
                  onClick={handleBackToAdd}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-6 py-2.5 text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-[0.97] font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEditingEntry}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Update Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === "add" && selectedOrder && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-lux-cream text-lux-emerald border border-[#e4dbc6] hover:bg-white font-bold shadow-sm transition"
              >
                <FaArrowLeft /> Back
              </button>
              <h2 className="font-serif text-xl font-semibold text-lux-ink">
                Add Loading Entry - Sauda: {selectedOrder.saudaNo}
              </h2>
            </div>

            <div className="space-y-6 rounded-3xl lux-card w-full p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-lux-ivory rounded-2xl text-sm border border-[#ece4d2] shadow-inner">
                <div className="bg-lux-cream p-3 rounded-xl border border-[#e4dbc6]">
                  <p className="text-lux-muted font-medium">Total Quantity</p>
                  <p className="font-serif font-bold text-lux-ink text-lg">
                    {(selectedOrder.quantity || 0).toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-lux-cream p-3 rounded-xl border border-[#e4dbc6]">
                  <p className="text-lux-muted font-medium">Already Loaded</p>
                  <p className="font-serif font-bold text-lux-ink text-lg">
                    {(
                      (selectedOrder.quantity || 0) -
                      (selectedOrder.pendingQuantity || 0)
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
                <div className="bg-lux-cream p-3 rounded-xl border border-lux-gold/30">
                  <p className="text-lux-emerald font-medium">
                    Currently Adding
                  </p>
                  <p className="font-serif font-bold text-lux-emerald text-lg">
                    {calculateTotalLoadingWeight().toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-lux-cream p-3 rounded-xl border border-lux-gold/30">
                  <p className="text-lux-emerald font-medium">
                    Remaining Pending
                  </p>
                  <p className="font-serif font-bold text-lux-emerald text-lg">
                    {Math.max(
                      0,
                      (selectedOrder.pendingQuantity || 0) -
                        calculateTotalLoadingWeight(),
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {existingEntries.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="font-serif text-lg font-semibold text-lux-ink flex items-center gap-2 px-2">
                      <span className="w-2 h-6 bg-lux-gold rounded-full"></span>
                      Previous Loading History ({existingEntries.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {existingEntries.map((entry, idx) => (
                        <div
                          key={`history-${idx}`}
                          className="p-4 bg-lux-ivory border border-[#ece4d2] rounded-2xl flex flex-wrap gap-4 items-center justify-between opacity-80"
                        >
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-bold text-lux-muted">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-lux-muted">
                                Date
                              </p>
                              <p className="text-sm font-bold text-lux-ink">
                                {formatDate(entry.loadingDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-lux-muted">
                                Lorry
                              </p>
                              <p className="text-sm font-bold text-lux-ink">
                                {entry.lorryNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-lux-muted">
                                Weight
                              </p>
                              <p className="text-sm font-bold text-lux-emerald">
                                {entry.loadingWeight} /{" "}
                                {entry.unloadingWeight || 0} T
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-lux-muted">
                                Bill No
                              </p>
                              <p className="text-sm font-bold text-lux-ink">
                                {entry.billNumber || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-lux-muted">
                                Seller Bill No
                              </p>
                              <p className="text-sm font-bold text-lux-ink">
                                {entry.sellerBillNo || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(userRole === "Admin" ||
                              userRole === "Employee") && (
                              <>
                                <button
                                  onClick={() => handleEditHistoryEntry(entry)}
                                  className="p-2 text-lux-emerald hover:bg-lux-ivory rounded-lg transition"
                                  title="Edit Entry"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteHistoryEntry(entry._id)
                                  }
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Entry"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDownloadPDF(entry)}
                              className="p-2 text-lux-muted hover:text-lux-emerald transition"
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

                <div className="flex flex-col gap-2 rounded-2xl border border-lux-gold/30 bg-gradient-to-r from-lux-cream via-lux-ivory to-lux-cream px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-sm ring-1 ring-lux-gold/30">
                      <FaTruckLoading className="text-lg" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-lux-ink">
                        New Loading Entry
                      </h3>
                      <p className="text-sm text-lux-muted">
                        Add lorry details clearly and keep each loading record
                        easy to review.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-3xl lux-card w-full transition-all hover:shadow-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lux-emerald via-lux-gold to-lux-emerald" />
                    <div className="p-4 sm:p-5 space-y-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-[#ece4d2] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft font-bold text-sm shadow-sm ring-1 ring-lux-gold/30">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-serif font-bold text-lux-ink">
                              Loading Specification
                            </h4>
                            <p className="text-xs text-lux-muted mt-0.5">
                              Enter transport, quantity and billing details for
                              this lorry.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadPDF(entry)}
                            className="flex items-center gap-2 px-3 py-2 text-lux-emerald bg-lux-ivory hover:bg-white rounded-xl transition text-sm font-bold border border-lux-gold/30"
                            title="Download Lorry Challan"
                          >
                            <FaDownload /> Challan
                          </button>
                          {loadingEntries.length > 1 && (
                            <button
                              onClick={() => handleRemoveEntry(index)}
                              className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-100"
                              title="Remove Entry"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory/50 p-5">
                        <div className="flex items-center justify-between gap-3 mb-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-lux-emerald">
                            Basic Details
                          </p>
                          <span className="inline-flex items-center rounded-full bg-lux-cream border border-lux-gold/30 px-3 py-1 text-[10px] font-bold text-lux-emerald shadow-sm">
                            LORRY #{index + 1}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                              Unloading Date
                            </label>
                            <DateSelector
                              selectedDate={entry.unloadingDate}
                              onChange={(date) =>
                                handleEntryChange(index, "unloadingDate", date)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                              Loading From
                            </label>
                            <DataDropdown
                              options={stateOptions}
                              selectedOptions={
                                entry.loadingFrom
                                  ? stateOptions.find(
                                      (s) => s.value === entry.loadingFrom,
                                    ) || null
                                  : null
                              }
                              onChange={(option) => {
                                const newEntries = [...loadingEntries];
                                newEntries[index].loadingFrom =
                                  option?.value || "";
                                setLoadingEntries(newEntries);
                              }}
                              placeholder="Select State"
                              isMulti={false}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                              Delivery Date
                            </label>
                            <div className="px-4 py-2.5 bg-lux-ivory border border-[#e4dbc6] rounded-xl text-sm font-semibold text-lux-muted cursor-not-allowed shadow-inner">
                              {entry.deliveryDate
                                ? formatDate(entry.deliveryDate)
                                : "N/A"}
                            </div>
                            <p className="text-[9px] text-lux-muted italic">
                              Auto-filled from Sauda
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                              className="bg-lux-cream"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                              Bags Count
                            </label>
                            <DataInput
                              type="number"
                              value={entry.bags}
                              onChange={(e) =>
                                handleEntryChange(index, "bags", e.target.value)
                              }
                              placeholder="No. of bags"
                              className="bg-lux-cream"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-[#e4dbc6] bg-lux-cream p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-lux-emerald mb-5">
                            Weight & Brokerage
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="col-span-2 mt-2 p-3 bg-lux-cream rounded-xl border border-[#e4dbc6] flex justify-between items-center shadow-sm">
                              <div>
                                <p className="text-[10px] font-bold text-lux-muted uppercase">
                                  Buyer Brokerage
                                </p>
                                <p className="text-sm font-bold text-lux-emerald">
                                  ₹{entry.buyerBrokerage || 0}
                                </p>
                              </div>
                              <div className="w-px h-8 bg-[#e4dbc6]"></div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-lux-muted uppercase">
                                  Seller Brokerage
                                </p>
                                <p className="text-sm font-bold text-lux-emerald">
                                  ₹{entry.sellerBrokerage || 0}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                                Due Date
                              </label>
                              <DateSelector
                                selectedDate={entry.dueDate}
                                onChange={(date) =>
                                  handleEntryChange(index, "dueDate", date)
                                }
                              />
                              <p className="text-[9px] text-lux-muted italic">
                                Auto-calculated from unloading date + payment terms. You can edit it.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#e4dbc6] bg-lux-cream p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-lux-emerald mb-5">
                            Billing Details
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                                Seller Bill No
                              </label>
                              <DataInput
                                value={entry.sellerBillNo}
                                onChange={(e) =>
                                  handleEntryChange(
                                    index,
                                    "sellerBillNo",
                                    e.target.value,
                                  )
                                }
                                placeholder="Seller invoice no."
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                        <div className="rounded-2xl border border-[#e4dbc6] bg-lux-cream p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-lux-emerald mb-5">
                            Transport & Freight
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
                                Transporter
                              </label>
                              <DataDropdown
                                options={transporters}
                                selectedOptions={
                                  entry.transporterId
                                    ? transporters.find(
                                        (t) => t.value === entry.transporterId,
                                      ) || null
                                    : null
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
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-lux-muted uppercase tracking-wider">
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
                                className="bg-lux-cream border-[#e4dbc6] focus:border-lux-emerald"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-[#ece4d2] bg-lux-ivory/30 p-5">
                        <div className="rounded-2xl border border-[#e4dbc6] bg-lux-cream px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-[10px] text-lux-muted uppercase font-bold tracking-widest mb-1">
                            Total Freight
                          </p>
                          <p className="font-serif font-bold text-lux-ink text-xl">
                            ₹ {Number(entry.totalFreight).toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-lux-gold/30 bg-lux-cream px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-[10px] text-lux-muted uppercase font-bold tracking-widest mb-1">
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
                        <div className="rounded-2xl border border-lux-gold/30 bg-lux-cream px-4 py-4 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-[10px] text-lux-muted uppercase font-bold tracking-widest mb-1">
                            Balance Due
                          </p>
                          <p className="font-serif font-bold text-lux-emerald text-xl">
                            ₹ {Number(entry.balance).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[#ece4d2]">
                <button
                  onClick={handleAddMore}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft rounded-2xl hover:-translate-y-0.5 transition-all font-bold shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 active:scale-95"
                >
                  <FaPlus /> Add More Lorry
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleBackToList}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-lux-cream text-lux-emerald rounded-2xl hover:bg-white transition font-bold border border-[#e4dbc6] shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntries}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-12 py-3 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft rounded-2xl hover:-translate-y-0.5 transition-all font-bold shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? "Saving..." : "Save All Lorry"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default AddLoadingEntry;
