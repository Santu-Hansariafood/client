import React, { lazy, useEffect, useState, useMemo, useCallback } from "react";
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

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const ListLoadingEntry = () => {
  const { userRole, mobile } = useAuth();
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const [buyerMap, setBuyerMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [alreadyLoadedMap, setAlreadyLoadedMap] = useState({});
  const [transporters, setTransporters] = useState([]);
  const [transporterMap, setTransporterMap] = useState({});
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    saudaNo: "",
    lorryNumber: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    sellers: [],
    saudas: [],
    lorries: [],
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters]);

  const fetchStaticData = useCallback(async () => {
    try {
      const [sellersRes, transportersRes, ordersRes] = await Promise.all([
        api.get("/sellers"),
        api.get("/transporters", { params: { limit: 0 } }),
        api.get("/self-order", { params: { limit: 0 } }),
      ]);

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
        Object.fromEntries(ordersData.map((o) => [o.saudaNo, o.buyer])),
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
    } catch (error) {
      console.error("Error fetching static data:", error);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await api.get("/loading-entries/suggestions", {
        params: { role: userRole, mobile },
      });
      setSuggestions(res.data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, [userRole, mobile]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const entriesRes = await api.get("/loading-entries", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedFilters.search,
          saudaNo: debouncedFilters.saudaNo,
          lorryNumber: debouncedFilters.lorryNumber,
          role: userRole,
          mobile: mobile,
        },
      });

      const entriesPayload = entriesRes.data || {};
      const entriesData = Array.isArray(entriesPayload.data)
        ? entriesPayload.data
        : Array.isArray(entriesPayload)
          ? entriesPayload
          : [];

      setTotalItems(entriesPayload.total || 0);
      setTotalPages(entriesPayload.totalPages || 1);
      setLoadingEntries(entriesData);
      setFilteredEntries(entriesData);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to fetch loading entries");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedFilters.search,
    debouncedFilters.saudaNo,
    debouncedFilters.lorryNumber,
    userRole,
    mobile,
  ]);

  useEffect(() => {
    fetchStaticData();
    fetchSuggestions();
  }, [fetchStaticData, fetchSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((q, field) => {
    setFilters((prev) => ({ ...prev, [field]: q }));
    setCurrentPage(1);
  }, []);

  const handleView = (entry) => {
    setSelectedEntry(entry);
    setPopupType("view");
  };

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setEditEntry({
      ...entry,
      loadingDate: entry.loadingDate
        ? new Date(entry.loadingDate).toISOString().slice(0, 10)
        : "",
      dateOfIssue: entry.dateOfIssue
        ? new Date(entry.dateOfIssue).toISOString().slice(0, 10)
        : "",
    });
    setPopupType("edit");
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateEntry = async () => {
    if (!editEntry || !editEntry._id) return;

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
      };

      await api.put(`/loading-entries/${editEntry._id}`, payload);
      toast.success("Entry updated successfully");
      setPopupType("");
      setSelectedEntry(null);
      setEditEntry(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete entry", error);
      }
    }
  };

  const handleDownload = async (entry) => {
    let toastId;
    try {
      toastId = toast.loading("Preparing PDF...");
      
      const doc = await PrintLoadingEntry(entry);
      if (!doc) return;
      
      downloadFile(doc, `LoadingEntry-${entry.billNumber || "document"}.pdf`);

      toast.dismiss(toastId);
      toast.success("Download started successfully!");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("PDF Download Error:", error);
      toast.error("Error generating download.");
    }
  };

  const handleDownloadExcel = async () => {
    let toastId;
    try {
      toastId = toast.loading("Preparing Excel...");
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
      await downloadFile(blob, `LoadingEntries_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.dismiss(toastId);
      toast.success("Excel downloaded");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Excel Download Error:", error);
      toast.error("Failed to download Excel");
    }
  };

  const headers = [
    "Sl No",
    "Loading Date",
    "Sauda No",
    "Seller Company",
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
  ];

  const rows = useMemo(
    () =>
      filteredEntries.map((entry, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        formatDate(entry.loadingDate),
        entry.saudaNo || "N/A",
        entry.supplierCompany || "N/A",
        entry.loadingWeight,
        entry.unloadingWeight || 0,
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
        entry.driverName,
        entry.driverPhoneNumber,
        entry.freightRate,
        entry.totalFreight,
        entry.advance,
        entry.balance,
        entry.billNumber,
        formatDate(entry.dateOfIssue),
        entry.commodity,
        <div key={`actions-${entry._id}`} className="flex justify-center gap-2">
          <button
            onClick={() => handleView(entry)}
            title="View"
            className="p-1 text-blue-500 hover:bg-blue-100 rounded"
          >
            <MdVisibility size={18} />
          </button>
          {(userRole === "Admin" || userRole === "Employee") && (
            <>
              <button
                onClick={() => handleEdit(entry)}
                title="Edit"
                className="p-1 text-green-500 hover:bg-green-100 rounded"
              >
                <MdEdit size={18} />
              </button>
              <button
                onClick={() => handleDelete(entry._id)}
                title="Delete"
                className="p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <MdDelete size={18} />
              </button>
            </>
          )}
        </div>,
        <button
          key={`download-${entry._id}`}
          onClick={() => handleDownload(entry)}
          title="Download"
          className="p-1 text-purple-500 hover:bg-purple-100 rounded flex justify-center"
        >
          <MdDownload size={18} />
        </button>,
      ]),
    [
      filteredEntries,
      currentPage,
      itemsPerPage,
      alreadyLoadedMap,
      statusMap,
      transporterMap,
      userRole,
    ],
  );

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
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-md"
              >
                <MdDownload size={20} />
                Download Excel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchBox
                placeholder="Search by Seller/Buyer Name..."
                items={[...new Set([...suggestions.sellers])].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "search")}
              />

              <SearchBox
                placeholder="Search by Sauda No..."
                items={[...new Set(suggestions.saudas)].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "saudaNo")}
              />

              <SearchBox
                placeholder="Search by Lorry Number..."
                items={[...new Set(suggestions.lorries)].filter(Boolean)}
                returnQuery={true}
                onSearch={(q) => handleSearch(q, "lorryNumber")}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <Tables headers={headers} rows={rows} />
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>

          {selectedEntry && (
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
                          Loading Date
                        </label>
                        <input
                          type="date"
                          name="loadingDate"
                          value={editEntry.loadingDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Sauda No
                        </label>
                        <input
                          type="text"
                          name="saudaNo"
                          value={editEntry.saudaNo || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Lorry Number
                        </label>
                        <input
                          type="text"
                          name="lorryNumber"
                          value={editEntry.lorryNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Driver Phone
                        </label>
                        <input
                          type="text"
                          name="driverPhoneNumber"
                          value={editEntry.driverPhoneNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPopupType("");
                          setSelectedEntry(null);
                          setEditEntry(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateEntry}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
