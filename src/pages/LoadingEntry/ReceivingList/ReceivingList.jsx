import React, {
  lazy,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import api from "../../../utils/apiClient/apiClient";
import {
  MdVisibility,
  MdDownload,
} from "react-icons/md";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaClipboardList } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { downloadFile } from "../../../utils/fileDownloader";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);

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

const ReceivingList = () => {
  const { userRole, mobile } = useAuth();

  const [loadingEntries, setLoadingEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

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

      if (filters.search) {
        searchParams.search = filters.search;
      }

      const response = await fetchWithAbort("/loading-entries/receiving", {
        params: searchParams,
      });

      if (!response || !isMountedRef.current) return;

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      
      setLoadingEntries(data);
      setTotalItems(payload.total || 0);
    } catch (error) {
      console.error("Error fetching entries:", error);
      if (isMountedRef.current && error.name !== "AbortError") {
        toast.error("Failed to fetch receiving entries");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [userRole, mobile, filters, currentPage, itemsPerPage, fetchWithAbort]);

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
    [],
  );

  const handleGeneralSearch = useCallback(
    (q) => {
      setFilters({ search: q });
      setCurrentPage(1);
    },
    [],
  );

  const handleView = useCallback((entry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
  }, []);

  const handleDownload = useCallback(async (entry) => {
    let toastId;
    try {
      toastId = toast.loading("Preparing PDF...");

      const blob = await PrintLoadingEntry(entry);
      if (!blob) throw new Error("Failed to generate PDF");

      let fileName = `receiving_report_${entry.saudaNo || "document"}`;
      if (entry.billNumber && entry.billNumber !== "0") {
        fileName += `_bill_${entry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Download started successfully!");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("PDF Download Error:", error);
      toast.error("Error generating download. Please try again.");
    }
  }, []);

  const handleDownloadPDFReport = useCallback(() => {
    if (loadingEntries.length === 0) return;

    const doc = new jsPDF("landscape");
    const tableColumn = [
      "Sauda No",
      "Loading No",
      "Lorry No",
      "Loading Wt",
      "Unloading Wt",
      "Loading Date",
      "Unloading Date",
      "Rate",
      "Amount",
      "Seller Co",
      "Buyer Co",
    ];

    const tableRows = loadingEntries.map((entry) => [
      entry.saudaNo || "N/A",
      entry.billNumber || "N/A",
      (entry.lorryNumber || "N/A").toUpperCase(),
      `${entry.loadingWeight || 0} T`,
      `${entry.unloadingWeight || 0} T`,
      formatDate(entry.loadingDate),
      formatDate(entry.unloadingDate),
      `Rs. ${entry.actualRate || 0}`,
      `Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
      entry.supplierCompany || "N/A",
      entry.buyerCompany || "N/A",
    ]);

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("RECEIVING ENTRIES REPORT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-GB")}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`ReceivingEntries_${new Date().toISOString().split("T")[0]}.pdf`);
  }, [loadingEntries]);

  const headers = useMemo(
    () => [
      "Sauda No",
      "Loading No",
      "Lorry No",
      "Loading Wt",
      "Unloading Wt",
      "Loading Date",
      "Unloading Date",
      "Rate",
      "Amount",
      "Seller Co",
      "Buyer Co",
      "Attachment",
      "Actions",
      "Download",
    ],
    [],
  );

  const rows = useMemo(() => {
    return loadingEntries.map((entry) => {
      const docs = entry.documents || {};
      const attachmentCount = [
        docs.kantaSlip,
        docs.unloadingChallan,
        docs.partyBillCopy,
        entry.documentUrl,
      ].filter(url => typeof url === 'string' && url.trim() !== '').length;

      return [
        entry.saudaNo || "N/A",
        entry.billNumber || "N/A",
        entry.lorryNumber || "N/A",
        `${entry.loadingWeight || 0} T`,
        `${entry.unloadingWeight || 0} T`,
        formatDate(entry.loadingDate),
        formatDate(entry.unloadingDate),
        `Rs. ${entry.actualRate || 0}`,
        `Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
        entry.supplierCompany || "N/A",
        entry.buyerCompany || "N/A",
        <span key={`attach-${entry._id}`} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">
          {attachmentCount} Files
        </span>,
        <div key={`actions-${entry._id}`} className="flex justify-center gap-2">
          <button
            onClick={() => handleView(entry)}
            title="View"
            className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
          >
            <MdVisibility size={18} />
          </button>
        </div>,
        <button
          key={`download-${entry._id}`}
          onClick={() => handleDownload(entry)}
          title="Download PDF"
          className="p-1 text-purple-500 hover:bg-purple-100 rounded transition-colors flex justify-center"
        >
          <MdDownload size={18} />
        </button>,
      ];
    });
  }, [loadingEntries, handleView, handleDownload]);

  return (
    <React.Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Receiving Entries"
        subtitle="Manage unloading data & document verification"
        icon={FaClipboardList}
      >
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <SearchBox
              placeholder="Search by seller, buyer, consignee..."
              items={[]}
              returnQuery={true}
              onSearch={handleGeneralSearch}
              value={filters.search}
            />
            <button
              onClick={handleDownloadPDFReport}
              disabled={loadingEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition disabled:opacity-50"
            >
              <MdDownload size={20} />
              Download Report
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            {loading ? (
              <div className="py-12">
                <Loading />
              </div>
            ) : (
              <>
                {loadingEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No receiving entries found
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
                      />
                    </div>
                  </>
                )}
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
              maxWidth="max-w-6xl"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'kantaSlip', label: 'Kanta Slip' },
                  { key: 'unloadingChallan', label: 'Unloading Challan' },
                  { key: 'partyBillCopy', label: 'Party Bill Copy' }
                ].map((docType) => {
                  const url = selectedEntry.documents?.[docType.key];
                  if (!url) return null;
                  
                  return (
                    <div key={docType.key} className="space-y-2">
                      <h4 className="font-bold text-slate-700 text-sm uppercase">{docType.label}</h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 min-h-[200px] flex items-center justify-center">
                        {url.endsWith(".pdf") ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">View PDF</a>
                        ) : (
                          <img src={url} alt={docType.label} className="w-full h-auto" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </React.Suspense>
  );
};

export default ReceivingList;
