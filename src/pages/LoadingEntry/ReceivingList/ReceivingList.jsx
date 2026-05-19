import { lazy, useEffect, useState, useMemo, useCallback, Suspense } from "react";
import PropTypes from "prop-types";
import api from "../../../utils/apiClient/apiClient";
import { 
  FaClipboardList, 
  FaEye, 
  FaPrint, 
  FaCopy, 
  FaExclamationTriangle, 
  FaSync,
  FaFileAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { downloadFile } from "../../../utils/fileDownloader";

import { jsPDF } from "jspdf";
import "jspdf-autotable";

// --- Components ---
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

// --- Utilities ---
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

// --- Sub-components ---

const AttachmentBadge = ({ count }) => (
  <span
    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2 w-fit"
    role="status"
    aria-label={`${count} attachments`}
  >
    <FaFileAlt className="text-slate-400" />
    {count} {count === 1 ? "File" : "Files"}
  </span>
);

AttachmentBadge.propTypes = {
  count: PropTypes.number.isRequired,
};

const ReceivingList = () => {
  const { userRole, mobile } = useAuth();
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/loading-entries/receiving", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          role: userRole,
          mobile: mobile,
        },
      });

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      setLoadingEntries(data);
      setTotalItems(Number(payload.total) || 0);
    } catch (error) {
      console.error("Error fetching receiving entries:", error);
      setError("Failed to load receiving entries. Please check your connection.");
      toast.error("Failed to fetch receiving entries");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, userRole, mobile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleViewDocuments = useCallback((entry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
  }, []);

  const handleSearch = useCallback((q) => {
    setSearchInput(q);
    setCurrentPage(1);
  }, []);

  const handleCopy = useCallback((entry) => {
    const documents = [];
    if (entry.documents?.kantaSlip)
      documents.push(`Kanta Slip: ${entry.documents.kantaSlip}`);
    if (entry.documents?.unloadingChallan)
      documents.push(`Unloading Challan: ${entry.documents.unloadingChallan}`);
    if (entry.documents?.partyBillCopy)
      documents.push(`Party Bill Copy: ${entry.documents.partyBillCopy}`);

    const textToCopy = `
Receiving Entry Details:
------------------------
Sauda No: ${entry.saudaNo || "N/A"}
Loading No: ${entry.billNumber || "N/A"}
Lorry No: ${(entry.lorryNumber || "N/A").toUpperCase()}
Loading Weight: ${entry.loadingWeight || 0} Tons
Unloading Weight: ${entry.unloadingWeight || 0} Tons
Loading Date: ${formatDate(entry.loadingDate)}
Unloading Date: ${formatDate(entry.unloadingDate)}
Rate: Rs. ${entry.actualRate || 0}
Amount: Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}
Seller Company: ${entry.supplierCompany || "N/A"}
Buyer Company: ${entry.buyerCompany || "N/A"}

Documents:
${documents.length > 0 ? documents.join("\n") : "No documents attached"}
    `.trim();

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("Entry details copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy details");
      });
  }, []);

  const handlePrint = async () => {
    if (!selectedEntry) return;

    const toastId = toast.loading("Generating professional PDF report...");

    try {
      const blob = await PrintLoadingEntry(selectedEntry);
      if (!blob) throw new Error("Failed to generate PDF");

      let fileName = `receiving_report_${selectedEntry.saudaNo || "document"}`;
      if (selectedEntry.billNumber && selectedEntry.billNumber !== "0") {
        fileName += `_bill_${selectedEntry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);
      toast.update(toastId, { 
        render: "PDF downloaded successfully!", 
        type: "success", 
        isLoading: false, 
        autoClose: 3000 
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.update(toastId, { 
        render: "Failed to generate PDF report", 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

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

  const headers = [
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
  ];

  const rows = useMemo(
    () =>
      loadingEntries.map((entry) => {
        // Robust attachment count logic
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
          <span key={`lorry-${entry._id}`} className="font-bold uppercase text-slate-600">{entry.lorryNumber || "N/A"}</span>,
          `${entry.loadingWeight || 0} T`,
          `${entry.unloadingWeight || 0} T`,
          formatDate(entry.loadingDate),
          formatDate(entry.unloadingDate),
          `Rs. ${entry.actualRate || 0}`,
          `Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
          entry.supplierCompany || "N/A",
          entry.buyerCompany || "N/A",
          <AttachmentBadge key={`attach-${entry._id}`} count={attachmentCount} />,
          <div key={`actions-${entry._id}`} className="flex items-center gap-2">
            <button
              onClick={() => handleViewDocuments(entry)}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 focus:ring-2 focus:ring-blue-500/20"
              title="View Documents"
              aria-label="View Documents"
            >
              <FaEye size={16} />
            </button>
            <button
              onClick={() => handleCopy(entry)}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 focus:ring-2 focus:ring-emerald-500/20"
              title="Copy Details"
              aria-label="Copy Details"
            >
              <FaCopy size={16} />
            </button>
          </div>,
        ];
      }),
    [loadingEntries, handleCopy, handleViewDocuments],
  );

  if (error) {
    return (
      <AdminPageShell noContentCard>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4 p-8 bg-white rounded-3xl border border-red-100 shadow-xl max-w-md">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <FaExclamationTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sync Failure</h2>
            <p className="text-slate-500 text-sm font-semibold">{error}</p>
            <button 
              onClick={fetchData} 
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 mx-auto shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              <FaSync />
              Retry Fetch
            </button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Receiving Entries"
        subtitle="Manage unloading data & document verification"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-[1700px] mx-auto space-y-8 p-4 sm:p-6 lg:p-10">
          {/* Filter Header */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] italic">Search <span className="text-blue-600">Sync</span></h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadPDFReport}
                    disabled={loadingEntries.length === 0}
                    className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <FaPrint size={14} />
                    Download PDF
                  </button>
                  <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center">Live Database</span>
                </div>
              </div>
              <div className="relative group/search">
                <SearchBox
                  placeholder="Query by Sauda No, Lorry No, or Seller Company..."
                  items={[]}
                  returnQuery={true}
                  onSearch={handleSearch}
                  value={searchInput}
                />
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-[2.5rem]">
                <Loading />
              </div>
            )}
            
            <Tables headers={headers} rows={rows} />
            
            {totalItems > 0 && (
              <div className="mt-10 flex justify-center pb-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
            
            {!loading && rows.length === 0 && (
              <div className="py-20 text-center">
                <FaClipboardList className="text-6xl text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">No entries found</p>
              </div>
            )}
          </div>

          {/* Document Popup */}
          {showPopup && selectedEntry && (
            <PopupBox
              isOpen={showPopup}
              onClose={() => {
                setShowPopup(false);
                setSelectedEntry(null);
              }}
              title="Document Attachments"
              maxWidth="max-w-6xl"
              headerActions={
                <button
                  onClick={handlePrint}
                  title="Print Report"
                  aria-label="Print Report"
                  className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all duration-300 shadow-xl shadow-slate-200 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-400/20 active:scale-95 group"
                >
                  <FaPrint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              }
            >
              <div className="p-4 sm:p-8 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {[
                    { key: 'kantaSlip', label: 'Kanta Slip', color: 'blue' },
                    { key: 'unloadingChallan', label: 'Unloading Challan', color: 'indigo' },
                    { key: 'partyBillCopy', label: 'Party Bill Copy', color: 'emerald' }
                  ].map((docType) => {
                    const url = selectedEntry.documents?.[docType.key];
                    if (!url) return null;
                    
                    return (
                      <div key={docType.key} className="space-y-4 group">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3`}>
                            <span className={`w-2 h-2 rounded-full bg-${docType.color}-500 animate-pulse`} />
                            {docType.label}
                          </h4>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50">Verified</span>
                        </div>
                        
                        <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[300px]">
                          {url.endsWith(".pdf") ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/btn flex flex-col items-center gap-4 p-10 text-center"
                            >
                              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                                <FaFileAlt size={32} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">View PDF Document</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opens in new tab</p>
                              </div>
                            </a>
                          ) : (
                            <img
                              src={url}
                              alt={docType.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {Object.values(selectedEntry.documents || {}).every(v => !v) && (
                  <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                    <FaClipboardList className="text-6xl text-slate-200 mx-auto mb-6" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Zero artifacts detected</p>
                  </div>
                )}
              </div>
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ReceivingList;
