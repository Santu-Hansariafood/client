import React, { lazy, useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../utils/apiClient/apiClient";
import { FaClipboardList, FaEye, FaPrint } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { jsPDF } from "jspdf";

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
  };

  const handlePrint = async () => {
    if (!selectedEntry) return;

    const toastId = toast.loading("Generating PDF...");

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

      doc.setLineWidth(0.5);
      doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

      setBold();
      doc.setFontSize(18);
      doc.text("RECEIVING ENTRY", pageWidth / 2, y, { align: "center" });

      y += 15;

      doc.setLineWidth(0.2);
      doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 60);
      
      y += 5;
      setBold();
      doc.setFontSize(11);
      doc.text("ENTRY DETAILS", margin + 5, y);
      
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

      const documents = [];
      if (selectedEntry.documents?.kantaSlip) {
        documents.push({ name: "Kanta Slip", url: selectedEntry.documents.kantaSlip });
      }
      if (selectedEntry.documents?.unloadingChallan) {
        documents.push({ name: "Unloading Challan", url: selectedEntry.documents.unloadingChallan });
      }
      if (selectedEntry.documents?.partyBillCopy) {
        documents.push({ name: "Party Bill Copy", url: selectedEntry.documents.partyBillCopy });
      }

      if (documents.length > 0) {
        for (let i = 0; i < documents.length; i++) {
          const docInfo = documents[i];
          
          if (i > 0) {
            doc.addPage();
            y = 20;
          }

          setBold();
          doc.setFontSize(14);
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
                
                doc.addImage(
                  imgData,
                  "PNG",
                  margin + 2,
                  y,
                  imgWidth,
                  finalHeight
                );
              }
            } catch (imgErr) {
              console.error("Error loading image:", imgErr);
              setNormal();
              doc.setFontSize(10);
              doc.text("Image could not be loaded", pageWidth / 2, y, { align: "center" });
            }
          } else {
            setNormal();
            doc.setFontSize(10);
            doc.text("PDF Document - Please open separately", pageWidth / 2, y, { align: "center" });
            y += 10;
            doc.setTextColor(0, 0, 255);
            doc.textWithLink(docInfo.url, pageWidth / 2, y, { 
              align: "center",
              url: docInfo.url 
            });
            doc.setTextColor(0, 0, 0);
          }
        }
      } else {
        setNormal();
        doc.setFontSize(10);
        doc.text("No documents attached", pageWidth / 2, y, { align: "center" });
      }

      doc.save(`Receiving_Entry_${selectedEntry.saudaNo || 'Document'}.pdf`);
      toast.dismiss(toastId);
      toast.success("PDF downloaded successfully!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const headers = [
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
      filteredEntries.map((entry) => [
        entry.saudaNo || "N/A",
        entry.billNumber || "N/A",
        entry.lorryNumber || "N/A",
        entry.loadingWeight || 0,
        entry.unloadingWeight || 0,
        formatDate(entry.loadingDate),
        formatDate(entry.unloadingDate),
        entry.actualRate || 0,
        ((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2),
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
    [filteredEntries]
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
            headerActions={
              <button
                onClick={handlePrint}
                title="Print"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-amber-100/90 hover:text-white hover:bg-white/15 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 active:scale-95"
              >
                <FaPrint className="w-5 h-5" />
              </button>
            }
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
