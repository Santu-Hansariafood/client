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
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="lux-card lux-gold-top group relative overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -mr-32 -mt-32 top-0 right-0 h-64 w-64 rounded-full bg-lux-gold/5 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="relative space-y-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex w-fit flex-wrap items-center rounded-2xl border border-[#e6dcc4] bg-[#f2eee2] p-1.5">
                {["All", "Sent", "Not Sent"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSentFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`relative px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                      sentFilter === status
                        ? "bg-lux-cream text-lux-emerald shadow-md shadow-lux-emerald/10 ring-1 ring-lux-gold/30"
                        : "text-lux-muted hover:bg-white/60 hover:text-lux-ink"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={loadingEntries.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                >
                  <FaFileAlt size={14} />
                  Master Report
                </button>
                <button
                  onClick={handleDownloadPDFReport}
                  disabled={loadingEntries.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
                >
                  <FaPrint size={14} />
                  Table Report
                </button>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
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
