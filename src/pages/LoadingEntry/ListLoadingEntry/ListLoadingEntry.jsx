import React, { lazy, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaClipboardList } from "react-icons/fa";

import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [userRole, mobile]);

  const fetchData = async () => {
    try {
      const [entriesRes, sellersRes, transportersRes, ordersRes] =
        await Promise.all([
          axios.get("/loading-entries"),
          axios.get("/sellers"),
          axios.get("/transporters", { params: { limit: 0 } }),
          axios.get("/self-order", { params: { limit: 0 } }),
        ]);

      const sellersData = Array.isArray(sellersRes.data)
        ? sellersRes.data
        : sellersRes.data?.data || [];
      const entriesData = Array.isArray(entriesRes.data)
        ? entriesRes.data
        : entriesRes.data?.data || [];
      const transportersData = Array.isArray(transportersRes.data)
        ? transportersRes.data
        : transportersRes.data?.data || [];
      const ordersData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.data || [];

      const sellerMapping = Object.fromEntries(
        sellersData.map((seller) => [seller._id, seller.sellerName]),
      );
      setSellerMap(sellerMapping);

      const buyerMapping = Object.fromEntries(
        ordersData.map((order) => [order.saudaNo, order.buyer]),
      );
      setBuyerMap(buyerMapping);

      const statusMapping = Object.fromEntries(
        ordersData.map((order) => [order.saudaNo, order.status || "active"]),
      );
      setStatusMap(statusMapping);

      const alreadyLoadedMapping = Object.fromEntries(
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
      );
      setAlreadyLoadedMap(alreadyLoadedMapping);

      const transporterMapping = Object.fromEntries(
        transportersData.map((t) => [t._id, t.name]),
      );
      setTransporterMap(transporterMapping);
      setTransporters(
        transportersData.map((t) => ({
          value: t._id,
          label: `${t.name} - ${t.mobile}`,
          name: t.name,
        })),
      );

      let entries = entriesData;
      if (userRole === "Seller") {
        const seller = sellersData.find((s) =>
          s.phoneNumbers?.some((p) => String(p.value) === String(mobile)),
        );
        if (seller) {
          entries = entries.filter(
            (e) => String(e.supplier) === String(seller._id),
          );
        } else {
          entries = [];
        }
      }

      setLoadingEntries(entries);
      setFilteredEntries(entries);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

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

      await axios.put(`/loading-entries/${editEntry._id}`, payload);
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
        await axios.delete(`/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete entry", error);
      }
    }
  };

  const handleDownload = async (entry) => {
    try {
      const fileUrl = await PrintLoadingEntry(entry);
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `LoadingEntry-${entry.billNumber || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started successfully!");
      } else {
        toast.error("Failed to generate download.");
      }
    } catch (error) {
      toast.error("Error generating download.", error);
    }
  };

  const headers = [
    "Sl No",
    "Loading Date",
    "Sauda No",
    "Seller Name",
    "Loading Weight",
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
      filteredEntries
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((entry, index) => [
          (currentPage - 1) * itemsPerPage + index + 1,
          formatDate(entry.loadingDate),
          entry.saudaNo || "N/A",
          sellerMap[entry.supplier] || "Unknown Supplier",
          entry.loadingWeight,
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
          <div
            key={`actions-${entry._id}`}
            className="flex justify-center gap-2"
          >
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
    [filteredEntries, sellerMap, currentPage, itemsPerPage],
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchBox
                placeholder="Search by Seller/Buyer Name..."
                items={[
                  ...new Set([
                    ...loadingEntries.map((e) => sellerMap[e.supplier] || ""),
                    ...loadingEntries.map((e) => buyerMap[e.saudaNo] || ""),
                  ]),
                ].filter(Boolean)}
                onSearch={(filteredNames) => {
                  if (!filteredNames.length) {
                    setFilteredEntries(loadingEntries);
                  } else {
                    setFilteredEntries(
                      loadingEntries.filter(
                        (entry) =>
                          filteredNames.includes(sellerMap[entry.supplier]) ||
                          filteredNames.includes(buyerMap[entry.saudaNo]),
                      ),
                    );
                  }
                  setCurrentPage(1);
                }}
              />

              <SearchBox
                placeholder="Search by Sauda No..."
                items={[
                  ...new Set(loadingEntries.map((e) => e.saudaNo || "")),
                ].filter(Boolean)}
                onSearch={(filteredSaudas) => {
                  if (!filteredSaudas.length) {
                    setFilteredEntries(loadingEntries);
                  } else {
                    setFilteredEntries(
                      loadingEntries.filter((entry) =>
                        filteredSaudas.includes(entry.saudaNo),
                      ),
                    );
                  }
                  setCurrentPage(1);
                }}
              />

              <SearchBox
                placeholder="Search by Lorry Number..."
                items={[
                  ...new Set(loadingEntries.map((entry) => entry.lorryNumber)),
                ].filter(Boolean)}
                onSearch={(filteredLorryNumbers) => {
                  if (!filteredLorryNumbers.length) {
                    setFilteredEntries(loadingEntries);
                  } else {
                    setFilteredEntries(
                      loadingEntries.filter((entry) =>
                        filteredLorryNumbers.includes(entry.lorryNumber),
                      ),
                    );
                  }
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            <Tables headers={headers} rows={rows} />
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredEntries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
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
