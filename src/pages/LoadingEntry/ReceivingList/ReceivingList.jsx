import React, { lazy, useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../utils/apiClient/apiClient";
import { FaClipboardList, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const ReceivingList = () => {
  const { userRole, mobile } = useAuth();
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/loading-entries/receiving", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          role: userRole,
          mobile: mobile,
        },
      });

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      setLoadingEntries(data);
      setFilteredEntries(data);
      setTotalItems(payload.total || 0);
    } catch (error) {
      console.error("Error fetching receiving entries:", error);
      toast.error("Failed to fetch receiving entries");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, userRole, mobile]);

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

  const handleViewDocuments = (entry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
  };

  const headers = [
    "Sl No",
    "Sauda No",
    "Loading No",
    "Lorry No",
    "Loading Weight",
    "Unloading Weight",
    "Loading Date",
    "Unloading Date",
    "Rate",
    "Amount",
    "Seller Company",
    "Buyer Company",
    "View Attachments",
  ];

  const rows = useMemo(
    () =>
      filteredEntries.map((entry, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        entry.saudaNo || "N/A",
        entry._id ? entry._id.toString().slice(-8) : "N/A",
        entry.lorryNumber || "N/A",
        entry.loadingWeight || 0,
        entry.unloadingWeight || 0,
        formatDate(entry.loadingDate),
        formatDate(entry.unloadingDate),
        entry.freightRate || 0,
        ((entry.unloadingWeight || 0) * (entry.freightRate || 0)).toFixed(2),
        entry.supplierCompany || "N/A",
        entry.buyerCompany || "N/A",
        <button
          key={`view-${entry._id}`}
          onClick={() => handleViewDocuments(entry)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          <FaEye size={16} className="inline mr-1" /> View
        </button>,
      ]),
    [filteredEntries, currentPage, itemsPerPage]
  );

  return (
    <AdminPageShell
      title="Receiving Entries"
      subtitle="View receiving entries with documents"
      icon={FaClipboardList}
      noContentCard
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <SearchBox
              placeholder="Search by Sauda No, Lorry No, or Seller Company..."
              items={[]}
              returnQuery={true}
              onSearch={(q) => {
                setSearchInput(q);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
          {loading && <Loading />}
          {!loading && (
            <>
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
            </>
          )}
        </div>

        {showPopup && selectedEntry && (
          <PopupBox
            isOpen={showPopup}
            onClose={() => {
              setShowPopup(false);
              setSelectedEntry(null);
            }}
            title="Document Attachments"
            maxWidth="max-w-5xl"
          >
            <div className="space-y-6 p-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedEntry.documents?.kantaSlip && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700">Kanta Slip</h4>
                    {selectedEntry.documents.kantaSlip.endsWith(".pdf") ? (
                      <a
                        href={selectedEntry.documents.kantaSlip}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                      >
                        View PDF
                      </a>
                    ) : (
                      <img
                        src={selectedEntry.documents.kantaSlip}
                        alt="Kanta Slip"
                        className="w-full rounded-lg border"
                      />
                    )}
                  </div>
                )}
                {selectedEntry.documents?.unloadingChallan && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700">Unloading Challan</h4>
                    {selectedEntry.documents.unloadingChallan.endsWith(".pdf") ? (
                      <a
                        href={selectedEntry.documents.unloadingChallan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                      >
                        View PDF
                      </a>
                    ) : (
                      <img
                        src={selectedEntry.documents.unloadingChallan}
                        alt="Unloading Challan"
                        className="w-full rounded-lg border"
                      />
                    )}
                  </div>
                )}
                {selectedEntry.documents?.partyBillCopy && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-700">Party Bill Copy</h4>
                    {selectedEntry.documents.partyBillCopy.endsWith(".pdf") ? (
                      <a
                        href={selectedEntry.documents.partyBillCopy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                      >
                        View PDF
                      </a>
                    ) : (
                      <img
                        src={selectedEntry.documents.partyBillCopy}
                        alt="Party Bill Copy"
                        className="w-full rounded-lg border"
                      />
                    )}
                  </div>
                )}
                {(!selectedEntry.documents?.kantaSlip &&
                  !selectedEntry.documents?.unloadingChallan &&
                  !selectedEntry.documents?.partyBillCopy) && (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    No documents attached
                  </div>
                )}
              </div>
            </div>
          </PopupBox>
        )}
      </div>
    </AdminPageShell>
  );
};

export default ReceivingList;
