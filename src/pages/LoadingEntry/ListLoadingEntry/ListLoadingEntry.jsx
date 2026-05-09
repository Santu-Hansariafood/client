import React, {
  lazy,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import api from "../../../utils/apiClient/apiClient";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaClipboardList } from "react-icons/fa";

import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { downloadFile } from "../../../utils/fileDownloader";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const FileUpload = lazy(() => import("../../../common/FileUpload/FileUpload"));

const DEBOUNCE_DELAY = 500;
const DEFAULT_ITEMS_PER_PAGE = 10;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
  } catch {
    return "N/A";
  }
};

const validateEntryData = (entry) => {
  const errors = [];
  if (!entry.saudaNo?.trim()) errors.push("Sauda number is required");
  if (!entry.lorryNumber?.trim()) errors.push("Lorry number is required");
  if (entry.loadingWeight && isNaN(parseFloat(entry.loadingWeight)))
    errors.push("Invalid loading weight");
  if (entry.freightRate && isNaN(parseFloat(entry.freightRate)))
    errors.push("Invalid freight rate");
  return errors;
};

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
};

const ListLoadingEntry = () => {
  const { userRole, mobile } = useAuth();

  const [loadingEntries, setLoadingEntries] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const [buyerMap, setBuyerMap] = useState({});
  const [paymentTermsMap, setPaymentTermsMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [alreadyLoadedMap, setAlreadyLoadedMap] = useState({});
  const [transporters, setTransporters] = useState([]);
  const [transporterMap, setTransporterMap] = useState({});
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    saudaNo: "",
    lorryNumber: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestions, setSuggestions] = useState({
    sellers: [],
    saudas: [],
    lorries: [],
  });
  const [itemsPerPage, setItemsPerPage] = useLocalStorage(
    "loadingEntriesPerPage",
    DEFAULT_ITEMS_PER_PAGE,
  );
  const [exporting, setExporting] = useState(false);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const staticDataLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const debouncedFilters = useDebounce(filters, DEBOUNCE_DELAY);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWithAbort = useCallback(async (url, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await api.get(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      return response;
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    }
  }, []);

  const fetchStaticData = useCallback(async () => {
    if (staticDataLoadedRef.current) return;

    try {
      const [sellersRes, transportersRes, ordersRes] = await Promise.all([
        api.get("/sellers"),
        api.get("/transporters", { params: { limit: 0 } }),
        api.get("/self-order", { params: { limit: 0 } }),
      ]);

      if (!isMountedRef.current) return;

      const sellersData = Array.isArray(sellersRes.data)
        ? sellersRes.data
        : sellersRes.data?.data || [];
      const transportersData = Array.isArray(transportersRes.data)
        ? transportersRes.data
        : transportersRes.data?.data || [];
      const ordersData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.data || [];

      setSellerMap(
        Object.fromEntries(sellersData.map((s) => [s._id, s.sellerName])),
      );
      setBuyerMap(
        Object.fromEntries(ordersData.map((o) => [o.saudaNo, o.buyerCompany])),
      );
      setPaymentTermsMap(
        Object.fromEntries(
          ordersData.map((o) => [o.saudaNo, o.paymentTerms || ""]),
        ),
      );
      setStatusMap(
        Object.fromEntries(
          ordersData.map((o) => [o.saudaNo, o.status || "active"]),
        ),
      );
      setTransporterMap(
        Object.fromEntries(transportersData.map((t) => [t._id, t.name])),
      );
      setTransporters(
        transportersData.map((t) => ({
          value: t._id,
          label: `${t.name} - ${t.mobile}`,
          name: t.name,
        })),
      );

      setAlreadyLoadedMap(
        Object.fromEntries(
          ordersData.map((order) => {
            const quantity = order.quantity || 0;
            let pendingQuantity = order.pendingQuantity;
            if (
              (pendingQuantity === undefined ||
                pendingQuantity === null ||
                (pendingQuantity === 0 && order.status === "active")) &&
              order.status !== "closed"
            ) {
              pendingQuantity = quantity;
            } else {
              pendingQuantity = pendingQuantity || 0;
            }
            return [order.saudaNo, quantity - pendingQuantity];
          }),
        ),
      );

      staticDataLoadedRef.current = true;
    } catch (error) {
      console.error("Error fetching static data:", error);
      staticDataLoadedRef.current = true;
      if (isMountedRef.current) {
        toast.error("Failed to load reference data");
      }
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!userRole) return;

    try {
      const res = await api.get("/loading-entries/suggestions", {
        params: { role: userRole, mobile },
      });

      if (isMountedRef.current && res.data) {
        setSuggestions(res.data);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, [userRole, mobile]);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!userRole || !isMountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const searchParams = {
        page: currentPage,
        limit: itemsPerPage,
        role: userRole,
        mobile: mobile,
      };

      if (debouncedFilters.search) {
        searchParams.search = debouncedFilters.search;
      }
      if (debouncedFilters.saudaNo) {
        searchParams.saudaNo = debouncedFilters.saudaNo;
      }
      if (debouncedFilters.lorryNumber) {
        searchParams.lorryNumber = debouncedFilters.lorryNumber;
      }

      const response = await fetchWithAbort("/loading-entries", {
        params: searchParams,
      });

      if (!response || !isMountedRef.current) return;

      let entriesData = [];
      let total = 0;

      if (Array.isArray(response.data)) {
        entriesData = response.data;
        total = entriesData.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        entriesData = response.data.data;
        total = response.data.total || entriesData.length;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        entriesData = response.data.items;
        total = response.data.total || entriesData.length;
      }

      const sortedEntries = [...entriesData].sort((a, b) => {
        const dateA = a.loadingDate || a.createdAt || a._id;
        const dateB = b.loadingDate || b.createdAt || b._id;

        if (dateA && dateB) {
          try {
            const timeA = new Date(dateA).getTime();
            const timeB = new Date(dateB).getTime();
            if (!isNaN(timeA) && !isNaN(timeB)) {
              return timeB - timeA;
            }
          } catch (e) {
            /* empty */
          }
        }

        if (a._id && b._id) {
          return b._id.localeCompare(a._id);
        }

        return 0;
      });

      setLoadingEntries(sortedEntries);
      setTotalItems(total);
    } catch (error) {
      console.error("Error fetching entries:", error);
      if (isMountedRef.current && error.name !== "AbortError") {
        toast.error("Failed to fetch loading entries");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [
    userRole,
    mobile,
    debouncedFilters,
    currentPage,
    itemsPerPage,
    fetchWithAbort,
  ]);

  useEffect(() => {
    if (!userRole) return;

    fetchStaticData();
    fetchSuggestions();
  }, [userRole, fetchStaticData, fetchSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback(
    (size) => {
      setItemsPerPage(size);
      setCurrentPage(1);
    },
    [setItemsPerPage],
  );

  // Handle search with debounce
  const handleSearch = useCallback((q, field) => {
    setFilters((prev) => ({ ...prev, [field]: q || "" }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: "", saudaNo: "", lorryNumber: "" });
    setCurrentPage(1);
  }, []);

  const handleView = useCallback((entry) => {
    setSelectedEntry(entry);
    setPopupType("view");
  }, []);

  const handleEdit = useCallback((entry) => {
    setSelectedEntry(entry);
    setEditEntry({
      ...entry,
      loadingDate: entry.loadingDate
        ? new Date(entry.loadingDate).toISOString().slice(0, 10)
        : "",
      dateOfIssue: entry.dateOfIssue
        ? new Date(entry.dateOfIssue).toISOString().slice(0, 10)
        : "",
      unloadingDate: entry.unloadingDate
        ? new Date(entry.unloadingDate).toISOString().slice(0, 10)
        : "",
      documents: entry.documents || {
        kantaSlip: null,
        unloadingChallan: null,
        partyBillCopy: null,
      },
    });
    setPopupType("edit");
  }, []);

  const handleEditFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditEntry((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateEntry = useCallback(async () => {
    if (!editEntry?._id) {
      toast.error("Invalid entry data");
      return;
    }

    const validationErrors = validateEntryData(editEntry);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editEntry,
        loadingDate: editEntry.loadingDate
          ? new Date(editEntry.loadingDate).toISOString()
          : null,
        dateOfIssue: editEntry.dateOfIssue
          ? new Date(editEntry.dateOfIssue).toISOString()
          : null,
        unloadingDate: editEntry.unloadingDate
          ? new Date(editEntry.unloadingDate).toISOString()
          : null,
      };

      await api.put(`/loading-entries/${editEntry._id}`, payload);
      toast.success("Entry updated successfully");
      setPopupType("");
      setSelectedEntry(null);
      setEditEntry(null);
      await fetchData();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update entry";
      toast.error(message);
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editEntry, fetchData]);

  // Handle delete entry
  const handleDelete = useCallback(
    async (id) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this entry? This action cannot be undone.",
        )
      ) {
        return;
      }

      try {
        await api.delete(`/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        await fetchData();
      } catch (error) {
        toast.error("Failed to delete entry");
        console.error("Delete error:", error);
      }
    },
    [fetchData],
  );

  const handleDownload = useCallback(async (entry) => {
    let toastId;
    try {
      toastId = toast.loading("Preparing PDF...");

      const blob = await PrintLoadingEntry(entry);
      if (!blob) throw new Error("Failed to generate PDF");

      const fileName = `LorryChallan-${entry.billNumber || entry.saudaNo || "document"}.pdf`;
      downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Download started successfully!");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("PDF Download Error:", error);
      toast.error("Error generating download. Please try again.");
    }
  }, []);

  const handleDownloadExcel = useCallback(async () => {
    if (exporting || loadingEntries.length === 0) return;

    let toastId;
    try {
      setExporting(true);
      toastId = toast.loading("Preparing Excel file...");

      const response = await api.get("/loading-entries/export/excel", {
        params: {
          search: filters.search,
          saudaNo: filters.saudaNo,
          lorryNumber: filters.lorryNumber,
          role: userRole,
          mobile: mobile,
        },
        responseType: "blob",
        timeout: 60000,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileName = `LoadingEntries_${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Excel Download Error:", error);
      toast.error("Failed to download Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [filters, userRole, mobile, exporting, loadingEntries.length]);

  // Table headers
  const headers = useMemo(
    () => [
      "Sl No",
      "Serial No",
      "Loading Date",
      "Sauda No",
      "Seller Company",
      "Buyer Company",
      "Consignee",
      "Payment Terms",
      "Loading Weight",
      "Unloading Weight",
      "Already Loaded",
      "Status",
      "Lorry Number",
      "Transport",
      "Driver",
      "Phone",
      "Freight Rate",
      "Total Freight",
      "Advance",
      "Balance",
      "Bill No",
      "Date of Issue",
      "Commodity",
      "Actions",
      "Download",
    ],
    [],
  );

  // Table rows - using loadingEntries directly
  const rows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return loadingEntries.map((entry, index) => [
      start + index + 1,
      start + index + 1,
      formatDate(entry.loadingDate),
      entry.saudaNo || "N/A",
      entry.supplierCompany || "N/A",
      buyerMap[entry.saudaNo] || entry.buyerCompany || "N/A",
      entry.consignee || "N/A",
      paymentTermsMap[entry.saudaNo] || "N/A",
      entry.loadingWeight ? entry.loadingWeight.toFixed(2) : "0.00",
      entry.unloadingWeight ? entry.unloadingWeight.toFixed(2) : "0.00",
      (alreadyLoadedMap[entry.saudaNo] || 0).toFixed(2),
      <span
        key={`status-${entry._id}`}
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          statusMap[entry.saudaNo] === "closed"
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {statusMap[entry.saudaNo] === "closed" ? "Closed" : "Active"}
      </span>,
      entry.lorryNumber,
      transporterMap[entry.transporterId] || entry.addedTransport || "N/A",
      entry.driverName || "N/A",
      entry.driverPhoneNumber || "N/A",
      entry.freightRate ? `₹ ${entry.freightRate}` : "N/A",
      entry.totalFreight ? `₹ ${entry.totalFreight}` : "N/A",
      entry.advance ? `₹ ${entry.advance}` : "N/A",
      entry.balance ? `₹ ${entry.balance}` : "N/A",
      entry.billNumber || "N/A",
      formatDate(entry.dateOfIssue),
      entry.commodity || "N/A",
      <div key={`actions-${entry._id}`} className="flex justify-center gap-2">
        <button
          onClick={() => handleView(entry)}
          title="View"
          className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
          aria-label="View entry"
        >
          <MdVisibility size={18} />
        </button>
        {(userRole === "Admin" || userRole === "Employee") && (
          <>
            <button
              onClick={() => handleEdit(entry)}
              title="Edit"
              className="p-1 text-green-500 hover:bg-green-100 rounded transition-colors"
              aria-label="Edit entry"
            >
              <MdEdit size={18} />
            </button>
            <button
              onClick={() => handleDelete(entry._id)}
              title="Delete"
              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
              aria-label="Delete entry"
            >
              <MdDelete size={18} />
            </button>
          </>
        )}
      </div>,
      <button
        key={`download-${entry._id}`}
        onClick={() => handleDownload(entry)}
        title="Download PDF"
        className="p-1 text-purple-500 hover:bg-purple-100 rounded transition-colors flex justify-center"
        aria-label="Download PDF"
      >
        <MdDownload size={18} />
      </button>,
    ]);
  }, [
    loadingEntries,
    currentPage,
    itemsPerPage,
    alreadyLoadedMap,
    statusMap,
    transporterMap,
    userRole,
    paymentTermsMap,
    buyerMap,
    handleView,
    handleEdit,
    handleDelete,
    handleDownload,
  ]);

  const hasActiveFilters =
    filters.search || filters.saudaNo || filters.lorryNumber;

  if (initialLoading && loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loading />
      </div>
    );
  }

  return (
    <React.Suspense fallback={<Loading />}>
      <AdminPageShell
        title={
          userRole === "Seller" ? "Your Loading Entries" : "Loading Entries"
        }
        subtitle={
          userRole === "Seller"
            ? "View and download your loading documents"
            : "Search, view, edit, and download loading entry documents"
        }
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters Section */}
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                {totalItems > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Showing{" "}
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                    -{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems} entries
                    {hasActiveFilters && (
                      <span className="ml-2 text-emerald-600 font-medium">
                        (filtered)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={handleDownloadExcel}
                disabled={exporting || loadingEntries.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download Excel"
              >
                <MdDownload size={20} />
                {exporting ? "Preparing..." : "Download Excel"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchBox
                placeholder="Search by seller, buyer, consignee, commodity..."
                items={[...new Set(suggestions.sellers)].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "search")}
              />
              <SearchBox
                placeholder="Search by sauda number..."
                items={[...new Set(suggestions.saudas)].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "saudaNo")}
              />
              <SearchBox
                placeholder="Search by lorry number..."
                items={[...new Set(suggestions.lorries)].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "lorryNumber")}
              />
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                  aria-label="Clear all filters"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            {loading ? (
              <div className="py-12">
                <Loading />
              </div>
            ) : (
              <>
                {loadingEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">
                      No loading entries found
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Clear filters to see all entries
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <Tables headers={headers} rows={rows} />
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* View/Edit Popup */}
          {selectedEntry && popupType && (
            <PopupBox
              isOpen={!!popupType}
              onClose={() => {
                setPopupType("");
                setSelectedEntry(null);
                setEditEntry(null);
              }}
              title={
                popupType === "view" ? "Loading Entry Details" : "Edit Entry"
              }
              maxWidth="max-w-7xl"
            >
              {popupType === "view" ? (
                <div className="space-y-6 p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Basic Info
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Loading Date:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedEntry.loadingDate)}
                        </span>
                        <span className="text-slate-500">Sauda No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.saudaNo}
                        </span>
                        <span className="text-slate-500">Seller:</span>
                        <span className="font-semibold text-slate-800">
                          {sellerMap[selectedEntry.supplier] || "N/A"}
                        </span>
                        <span className="text-slate-500">Payment Terms:</span>
                        <span className="font-semibold text-slate-800">
                          {paymentTermsMap[selectedEntry.saudaNo] || "N/A"}
                        </span>
                        <span className="text-slate-500">Commodity:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.commodity || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Transport Details
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Lorry No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.lorryNumber}
                        </span>
                        <span className="text-slate-500">Transporter:</span>
                        <span className="font-semibold text-slate-800">
                          {transporterMap[selectedEntry.transporterId] ||
                            selectedEntry.addedTransport ||
                            "N/A"}
                        </span>
                        <span className="text-slate-500">Driver Name:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.driverName || "N/A"}
                        </span>
                        <span className="text-slate-500">Driver Phone:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.driverPhoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Weight & Billing
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Weight:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.loadingWeight} Tons
                        </span>
                        <span className="text-slate-500">Unloading Wt:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.unloadingWeight || 0} Tons
                        </span>
                        <span className="text-slate-500">Bill No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.billNumber || "N/A"}
                        </span>
                        <span className="text-slate-500">Bill Date:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedEntry.dateOfIssue)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Financial Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-500">Freight Rate:</span>
                        <span className="font-bold text-slate-800">
                          ₹ {selectedEntry.freightRate}
                        </span>
                        <span className="text-slate-500">Total Freight:</span>
                        <span className="font-bold text-slate-800">
                          ₹ {selectedEntry.totalFreight}
                        </span>
                        <span className="text-slate-500">Advance:</span>
                        <span className="font-bold text-emerald-600">
                          ₹ {selectedEntry.advance}
                        </span>
                        <span className="text-slate-500">Balance Due:</span>
                        <span className="font-bold text-amber-600">
                          ₹ {selectedEntry.balance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setPopupType("");
                        setSelectedEntry(null);
                      }}
                      className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                editEntry && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Loading Date *
                        </label>
                        <input
                          type="date"
                          name="loadingDate"
                          value={editEntry.loadingDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Loading Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Sauda No *
                        </label>
                        <input
                          type="text"
                          name="saudaNo"
                          value={editEntry.saudaNo || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Sauda Number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          value={paymentTermsMap[editEntry.saudaNo] || "N/A"}
                          disabled
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-700 cursor-not-allowed"
                          aria-label="Payment Terms (read-only)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Bill No
                        </label>
                        <input
                          type="text"
                          name="billNumber"
                          value={editEntry.billNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Bill Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Lorry Number *
                        </label>
                        <input
                          type="text"
                          name="lorryNumber"
                          value={editEntry.lorryNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Lorry Number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Transporter
                        </label>
                        <DataDropdown
                          options={transporters}
                          selectedOptions={
                            editEntry.transporterId
                              ? [
                                  transporters.find(
                                    (t) => t.value === editEntry.transporterId,
                                  ),
                                ].filter(Boolean)
                              : []
                          }
                          onChange={(option) => {
                            setEditEntry((prev) => ({
                              ...prev,
                              transporterId: option?.value || "",
                              addedTransport: option?.name || "",
                            }));
                          }}
                          placeholder="Select Transporter"
                          isMulti={false}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          name="driverName"
                          value={editEntry.driverName || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Driver Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Driver Phone
                        </label>
                        <input
                          type="tel"
                          name="driverPhoneNumber"
                          value={editEntry.driverPhoneNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Driver Phone"
                          pattern="[0-9]{10}"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Commodity
                        </label>
                        <input
                          type="text"
                          name="commodity"
                          value={editEntry.commodity || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Commodity"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Loading Weight
                        </label>
                        <input
                          type="number"
                          name="loadingWeight"
                          value={editEntry.loadingWeight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Loading Weight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Unloading Weight
                        </label>
                        <input
                          type="number"
                          name="unloadingWeight"
                          value={editEntry.unloadingWeight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Unloading Weight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Unloading Date
                        </label>
                        <input
                          type="date"
                          name="unloadingDate"
                          value={editEntry.unloadingDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Unloading Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Freight Rate
                        </label>
                        <input
                          type="number"
                          name="freightRate"
                          value={editEntry.freightRate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Freight Rate"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Total Freight
                        </label>
                        <input
                          type="number"
                          name="totalFreight"
                          value={editEntry.totalFreight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Total Freight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Advance
                        </label>
                        <input
                          type="number"
                          name="advance"
                          value={editEntry.advance || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Advance"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Balance
                        </label>
                        <input
                          type="number"
                          name="balance"
                          value={editEntry.balance || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Balance"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Date of Issue
                        </label>
                        <input
                          type="date"
                          name="dateOfIssue"
                          value={editEntry.dateOfIssue || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Date of Issue"
                        />
                      </div>
                    </div>

                    {(editEntry.unloadingWeight && editEntry.unloadingDate) ||
                    editEntry.documents?.kantaSlip ||
                    editEntry.documents?.unloadingChallan ||
                    editEntry.documents?.partyBillCopy ? (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-base font-bold text-slate-800 mb-4">
                          Document Upload
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FileUpload
                            label="1. Kanta Slip"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.kantaSlip}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  kantaSlip: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  kantaSlip: "",
                                },
                              }));
                            }}
                          />
                          <FileUpload
                            label="2. Unloading Challan"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.unloadingChallan}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  unloadingChallan: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  unloadingChallan: "",
                                },
                              }));
                            }}
                          />
                          <FileUpload
                            label="3. Party Bill Copy"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.partyBillCopy}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  partyBillCopy: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  partyBillCopy: "",
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-slate-200 pt-6">
                        <p className="text-sm text-slate-500 text-center py-4">
                          Please fill in both Unloading Weight and Unloading
                          Date to enable document upload.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPopupType("");
                          setSelectedEntry(null);
                          setEditEntry(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateEntry}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? "Saving..." : "Update Entry"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </React.Suspense>
  );
};

export default ListLoadingEntry;
