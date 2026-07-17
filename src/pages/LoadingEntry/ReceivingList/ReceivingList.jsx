import React, { lazy, Suspense, useCallback } from "react";
import { FaClipboardList, FaFileAlt, FaPrint, FaSync } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import logoUrl from "../../../assets/Hans.png";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Custom Hooks
import { useReceivingList } from "./hooks/useReceivingList";
import { useCopyEntry } from "./hooks/useCopyEntry";
import { useCdGstFetcher } from "./hooks/useCdGstFetcher";

// Components
import ReceivingTable from "./components/ReceivingTable";
import ReceivingPopup from "./components/ReceivingPopup";

const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const ReceivingList = () => {
  const { userRole, mobile, user } = useAuth();
  
  const {
    loadingEntries,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    searchInput,
    sentFilter,
    selectedEntry,
    showPopup,
    sellerCompanies,
    selectedSellerEmail,
    rows,
    getMasterData,
    setCurrentPage,
    setItemsPerPage,
    setSearchInput,
    setSentFilter,
    setSelectedEntry,
    setShowPopup,
    setSelectedSellerEmail,
    handleToggleSentStatus,
    fetchData,
  } = useReceivingList(userRole);

  const { handleCopy } = useCopyEntry();
  
  const {
    cdValue,
    gstValue,
    fetchCdGst,
    resetValues,
  } = useCdGstFetcher();

  // Handle view documents with CD/GST fetch
  const handleViewDocuments = useCallback(async (entry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
    
    // Auto-select first matching seller email if only one
    const matchingSellers = sellerCompanies.filter(
      (sc) =>
        entry?.supplierCompany?.toLowerCase() ===
        sc.companyName?.toLowerCase()
    );
    if (matchingSellers.length === 1) {
      setSelectedSellerEmail(matchingSellers[0].email);
    } else {
      setSelectedSellerEmail("");
    }
    
    // Fetch CD/GST values
    await fetchCdGst(entry.saudaNo);
  }, [sellerCompanies, setSelectedEntry, setShowPopup, setSelectedSellerEmail, fetchCdGst]);

  // Handle Download PDF Report
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
      `Rs. ${((entry.unloadingWeight && entry.unloadingWeight > 0 ? entry.unloadingWeight : entry.loadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
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

  // Reset values when popup closes
  const handlePopupClose = useCallback(() => {
    setShowPopup(false);
    setSelectedEntry(null);
    resetValues();
  }, [setShowPopup, setSelectedEntry, resetValues]);

  return (
    <AdminPageShell
      title="Receiving Entries"
      subtitle="Manage unloading data & document verification"
      icon={FaClipboardList}
      noContentCard
    >
      <div className="max-w-[1700px] mx-auto space-y-8 p-4 sm:p-6 lg:p-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
          <div className="relative space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 w-fit backdrop-blur-sm">
                {["All", "Sent", "Not Sent"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSentFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`relative px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                      sentFilter === status
                        ? "bg-white text-blue-600 shadow-md shadow-blue-100 ring-1 ring-blue-50"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={loadingEntries.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                >
                  <FaFileAlt size={14} />
                  Master Report
                </button>
                <button
                  onClick={handleDownloadPDFReport}
                  disabled={loadingEntries.length === 0}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                >
                  <FaPrint size={14} />
                  Table Report
                </button>
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center">
                  Live Database
                </span>
              </div>
            </div>
            <div className="relative group/search">
              <Suspense fallback={<Loading />}>
                <SearchBox
                  placeholder="Query by Sauda No, Lorry No, or Seller Company..."
                  items={[]}
                  returnQuery={true}
                  onSearch={setSearchInput}
                  value={searchInput}
                />
              </Suspense>
            </div>
          </div>
        </div>

        <ReceivingTable
          loading={loading}
          error={error}
          rows={rows}
          userRole={userRole}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          onViewDocuments={handleViewDocuments}
          onCopy={handleCopy}
          onToggleSentStatus={handleToggleSentStatus}
        />

        <ReceivingPopup
          selectedEntry={selectedEntry}
          showPopup={showPopup}
          setShowPopup={handlePopupClose}
          setSelectedEntry={setSelectedEntry}
          userRole={userRole}
          sellerCompanies={sellerCompanies}
          selectedSellerEmail={selectedSellerEmail}
          setSelectedSellerEmail={setSelectedSellerEmail}
          cdValue={cdValue}
          gstValue={gstValue}
          getMasterData={getMasterData}
          user={user}
          mobile={mobile}
          fetchData={fetchData}
        />
      </div>
    </AdminPageShell>
  );
};

export default ReceivingList;
