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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

const getBase64 = (img) =>
  new Promise((resolve) => {
    const image = new Image();
    image.src = img;
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(null);
  });

const formatAmount = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const numberToWords = (num) => {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const makeWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? makeWords(n % 100) : "");
    if (n < 100000) return makeWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? makeWords(n % 1000) : "");
    if (n < 10000000) return makeWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? makeWords(n % 100000) : "");
    return makeWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? makeWords(n % 10000000) : "");
  };

  const integer = Math.floor(num);
  const fraction = Math.round((num - integer) * 100);

  let words = makeWords(integer) + "Rupees ";
  if (fraction > 0) {
    words += "and " + makeWords(fraction) + "Paise ";
  }
  return words + "Only";
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
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;

      const setBold = () => doc.setFont("helvetica", "bold");
      const setNormal = () => doc.setFont("helvetica", "normal");

      let y = 20;

      // Draw Main Border
      doc.setLineWidth(0.5);
      doc.setDrawColor(30, 41, 59); // Slate-800
      doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

      setBold();
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("RECEIVING ENTRY REPORT", pageWidth / 2, y, { align: "center" });

      y += 15;

      // Entry Details Section
      doc.setLineWidth(0.2);
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 60, "F");
      doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 60, "S");

      y += 5;
      setBold();
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text("LOGISTICS & SETTLEMENT DETAILS", margin + 5, y);

      y += 8;
      doc.setFontSize(10);

      const infoItems = [
        { label: "Sauda No:", value: selectedEntry.saudaNo || "N/A" },
        { label: "Loading No:", value: selectedEntry.billNumber || "N/A" },
        { label: "Lorry No:", value: (selectedEntry.lorryNumber || "N/A").toUpperCase() },
        { label: "Loading Weight:", value: `${selectedEntry.loadingWeight || 0} Tons` },
        { label: "Unloading Weight:", value: `${selectedEntry.unloadingWeight || 0} Tons` },
        { label: "Loading Date:", value: formatDate(selectedEntry.loadingDate) },
        { label: "Unloading Date:", value: formatDate(selectedEntry.unloadingDate) },
        { label: "Rate:", value: `Rs. ${selectedEntry.actualRate || 0}` },
        { label: "Amount:", value: `Rs. ${((selectedEntry.unloadingWeight || 0) * (selectedEntry.actualRate || 0)).toFixed(2)}` },
        { label: "Seller Company:", value: selectedEntry.supplierCompany || "N/A" },
        { label: "Buyer Company:", value: selectedEntry.buyerCompany || "N/A" },
      ];

      let col1X = margin + 5;
      let col2X = pageWidth / 2;

      infoItems.forEach((item, index) => {
        const x = index % 2 === 0 ? col1X : col2X;
        const yOffset = Math.floor(index / 2) * 6;

        setBold();
        doc.text(item.label, x, y + yOffset);
        setNormal();
        doc.text(String(item.value), x + 40, y + yOffset);
      });

      y += 40;

      // Add System Bill Page if applicable
      if (selectedEntry.billNumber && selectedEntry.billNumber !== "0") {
        doc.addPage();
        y = 20;

        // Draw Border for Bill
        doc.setLineWidth(0.5);
        doc.setDrawColor(30, 41, 59);
        doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

        setBold();
        doc.setFontSize(16);
        const commodityStr = String(selectedEntry.commodity || "").toLowerCase();
        const isExempted = commodityStr.includes("maize") || commodityStr.includes("rice");
        doc.text(isExempted ? "BILL OF SUPPLY" : "TAX INVOICE", pageWidth / 2, y, { align: "center" });

        y += 10;
        doc.setFontSize(12);
        doc.text(selectedEntry.supplierCompany || "N/A", margin + 5, y);
        
        y += 6;
        doc.setFontSize(9);
        setNormal();
        const supplier = selectedEntry.supplier || {};
        const supplierAddr = [
          supplier.address,
          supplier.city,
          supplier.state,
          supplier.pinNo || supplier.pin
        ].filter(Boolean).join(", ");
        doc.text(supplierAddr || "N/A", margin + 5, y);

        y += 5;
        doc.text(`GSTIN: ${supplier.gstNumber || supplier.gstin || "N/A"} | PAN: ${supplier.panNo || supplier.pan || "N/A"}`, margin + 5, y);

        y += 10;
        // Bill Meta Info
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 25, "F");
        doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 25, "S");

        const billMeta = [
          { label: "Invoice No:", value: selectedEntry.billNumber },
          { label: "Date:", value: formatDate(selectedEntry.dateOfIssue) },
          { label: "Sauda No:", value: selectedEntry.saudaNo },
          { label: "Lorry No:", value: (selectedEntry.lorryNumber || "").toUpperCase() },
        ];

        billMeta.forEach((item, index) => {
          const x = index < 2 ? margin + 5 : pageWidth / 2;
          const yOff = (index % 2) * 6;
          setBold();
          doc.text(item.label, x, y + yOff);
          setNormal();
          doc.text(String(item.value), x + 25, y + yOff);
        });

        y += 30;
        // Parties
        doc.rect(margin + 2, y - 5, (pageWidth - margin * 2 - 10) / 2, 35, "S");
        doc.rect(pageWidth / 2 + 3, y - 5, (pageWidth - margin * 2 - 10) / 2, 35, "S");

        setBold();
        doc.text("BILL TO:", margin + 5, y);
        doc.text("SHIPPED TO:", pageWidth / 2 + 6, y);
        
        setNormal();
        doc.text(selectedEntry.buyerCompany || "N/A", margin + 5, y + 5);
        doc.text(selectedEntry.consignee || "N/A", pageWidth / 2 + 6, y + 5);
        
        // Add addresses if available
        const buyerAddr = [selectedEntry.location, selectedEntry.district, selectedEntry.state].filter(Boolean).join(", ");
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(buyerAddr || "N/A", (pageWidth - margin * 2 - 20) / 2), margin + 5, y + 10);
        doc.text(doc.splitTextToSize(buyerAddr || "N/A", (pageWidth - margin * 2 - 20) / 2), pageWidth / 2 + 6, y + 10);

        y += 45;
        // Items Table
        const weight = Number(selectedEntry.loadingWeight || 0);
        const rate = Number(selectedEntry.actualRate || 0);
        const subtotal = weight * rate;
        const gstPercent = Number(selectedEntry.gst || 0);
        const gstAmount = subtotal * (gstPercent / 100);
        const total = subtotal + gstAmount;

        autoTable(doc, {
          startY: y,
          head: [["#", "Description", "Qty (Tons)", "Rate (Rs)", "Amount (Rs)"]],
          body: [[1, selectedEntry.commodity || "N/A", weight.toFixed(3), formatAmount(rate), formatAmount(subtotal)]],
          theme: "grid",
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          margin: { left: margin + 2, right: margin + 2 }
        });

        y = doc.lastAutoTable.finalY + 10;
        
        // Summary
        const summaryX = pageWidth - margin - 60;
        setBold();
        doc.setFontSize(9);
        doc.text("Subtotal:", summaryX, y);
        setNormal();
        doc.text(formatAmount(subtotal), pageWidth - margin - 5, y, { align: "right" });
        
        y += 6;
        if (gstPercent > 0) {
          setBold();
          doc.text(`GST (${gstPercent}%):`, summaryX, y);
          setNormal();
          doc.text(formatAmount(gstAmount), pageWidth - margin - 5, y, { align: "right" });
          y += 6;
        }
        
        setBold();
        doc.setFontSize(11);
        doc.text("Grand Total:", summaryX, y);
        doc.text(`Rs. ${formatAmount(total)}`, pageWidth - margin - 5, y, { align: "right" });
        
        y += 10;
        doc.setFontSize(8);
        setNormal();
        doc.text(`Amount in words: ${numberToWords(total)}`, margin + 5, y);

        y += 15;
        // Bank Details
        const bank = supplier.bankDetails?.[0] || {};
        if (bank.bankName) {
          setBold();
          doc.text("BANK DETAILS:", margin + 5, y);
          setNormal();
          doc.text(`${bank.bankName} | A/c: ${bank.accountNumber} | IFSC: ${bank.ifscCode}`, margin + 5, y + 4);
        }

        y = pageHeight - 30;
        setBold();
        doc.text(`For ${selectedEntry.supplierCompany || "N/A"}`, pageWidth - margin - 50, y, { align: "center" });
        y += 15;
        doc.text("Authorized Signatory", pageWidth - margin - 50, y, { align: "center" });
      }

      const docsToPrint = [];
      if (selectedEntry.documents?.kantaSlip) docsToPrint.push({ name: "Kanta Slip", url: selectedEntry.documents.kantaSlip });
      if (selectedEntry.documents?.unloadingChallan) docsToPrint.push({ name: "Unloading Challan", url: selectedEntry.documents.unloadingChallan });
      if (selectedEntry.documents?.partyBillCopy) docsToPrint.push({ name: "Party Bill Copy", url: selectedEntry.documents.partyBillCopy });

      if (docsToPrint.length > 0) {
        for (let i = 0; i < docsToPrint.length; i++) {
          const docInfo = docsToPrint[i];

          doc.addPage();
          y = 20;

          setBold();
          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text(docInfo.name.toUpperCase(), pageWidth / 2, y, { align: "center" });

          y += 10;

          if (!docInfo.url.endsWith(".pdf")) {
            try {
              const imgData = await getBase64(docInfo.url);
              if (imgData) {
                const imgWidth = pageWidth - margin * 4;
                const imgHeight = (imgWidth * 3) / 4;
                const maxHeight = pageHeight - y - 20;
                const finalHeight = Math.min(imgHeight, maxHeight);

                doc.addImage(imgData, "PNG", margin + 2, y, imgWidth, finalHeight);
              }
            } catch (imgErr) {
              console.error("Error loading image:", imgErr);
              setNormal();
              doc.setFontSize(10);
              doc.text("Image could not be rendered in PDF", pageWidth / 2, y, { align: "center" });
            }
          } else {
            setNormal();
            doc.setFontSize(10);
            doc.text("PDF Document - Link provided below", pageWidth / 2, y, { align: "center" });
            y += 10;
            doc.setTextColor(37, 99, 235); // Blue-600
            doc.textWithLink(docInfo.url, pageWidth / 2, y, { align: "center", url: docInfo.url });
            doc.setTextColor(0, 0, 0);
          }
        }
      }

      doc.save(`Receiving_Entry_${selectedEntry.saudaNo || "Report"}.pdf`);
      toast.update(toastId, { render: "PDF downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.update(toastId, { render: "Failed to generate PDF report", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

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
        ].filter(url => typeof url === 'string' && url.trim() !== '').length + (entry.billNumber && entry.billNumber !== "0" ? 1 : 0);

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
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">Live Database</span>
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
                  {/* System Generated Bill */}
                  {selectedEntry.billNumber && selectedEntry.billNumber !== "0" && (
                    <div className="space-y-4 group">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          System Bill
                        </h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50">Generated</span>
                      </div>
                      
                      <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[300px]">
                        <div className="group/btn flex flex-col items-center gap-4 p-10 text-center">
                          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <FaFileAlt size={32} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Invoice: {selectedEntry.billNumber}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Included in Print Report</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
