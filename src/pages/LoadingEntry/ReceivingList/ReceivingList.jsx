import React, { lazy, useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../utils/apiClient/apiClient";
import { FaClipboardList, FaEye, FaPrint } from "react-icons/fa";
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

  const handlePrint = () => {
    if (!selectedEntry) return;

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
    };

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

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receiving Entry - ${selectedEntry.saudaNo || "N/A"}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #fff;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #065f46;
            }
            .print-header h1 {
              margin: 0;
              color: #065f46;
              font-size: 24px;
            }
            .print-info {
              margin-top: 20px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f0fdf4;
              border-radius: 8px;
            }
            .print-info h3 {
              margin: 0 0 10px 0;
              color: #065f46;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .info-item {
              display: flex;
              flex-wrap: wrap;
            }
            .info-label {
              font-weight: bold;
              min-width: 140px;
            }
            .document-section {
              margin-top: 30px;
              page-break-before: always;
            }
            .document-section:first-of-type {
              page-break-before: avoid;
            }
            .document-title {
              font-size: 18px;
              font-weight: bold;
              color: #065f46;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ccc;
            }
            .document-image {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .pdf-link {
              padding: 20px;
              background: #dbeafe;
              border-radius: 8px;
              text-align: center;
              margin: 10px 0;
            }
            .pdf-link a {
              color: #1e40af;
              text-decoration: none;
              font-weight: bold;
              padding: 10px 20px;
              background: #fff;
              border-radius: 4px;
              display: inline-block;
              margin-top: 10px;
            }
            .download-links {
              margin: 20px 0;
              padding: 15px;
              background: #fef3c7;
              border-radius: 8px;
              text-align: center;
            }
            .download-links h4 {
              margin: 0 0 10px 0;
              color: #92400e;
            }
            .download-btn {
              display: inline-block;
              padding: 10px 20px;
              background: #065f46;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 5px;
              font-weight: bold;
            }
            .print-btn-container {
              text-align: center;
              margin: 20px 0;
            }
            .print-btn {
              padding: 12px 30px;
              background: #065f46;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-btn-container,
              .download-links {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Receiving Entry</h1>
          </div>
          
          <div class="print-info">
            <h3>Entry Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Sauda No:</span>
                <span>${selectedEntry.saudaNo || "N/A"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Loading No:</span>
                <span>${selectedEntry.billNumber || "N/A"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Lorry No:</span>
                <span>${selectedEntry.lorryNumber || "N/A"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Loading Weight:</span>
                <span>${selectedEntry.loadingWeight || 0} Tons</span>
              </div>
              <div class="info-item">
                <span class="info-label">Unloading Weight:</span>
                <span>${selectedEntry.unloadingWeight || 0} Tons</span>
              </div>
              <div class="info-item">
                <span class="info-label">Loading Date:</span>
                <span>${formatDate(selectedEntry.loadingDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Unloading Date:</span>
                <span>${formatDate(selectedEntry.unloadingDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Rate:</span>
                <span>Rs. ${selectedEntry.actualRate || 0}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Amount:</span>
                <span>Rs. ${((selectedEntry.unloadingWeight || 0) * (selectedEntry.actualRate || 0)).toFixed(2)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Seller Company:</span>
                <span>${selectedEntry.supplierCompany || "N/A"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Buyer Company:</span>
                <span>${selectedEntry.buyerCompany || "N/A"}</span>
              </div>
            </div>
          </div>
          
          <div class="print-btn-container">
            <button class="print-btn" onclick="window.print()">🖨️ Print Document</button>
          </div>
          
          ${documents.length > 0 ? `
            <div class="download-links">
              <h4>📥 Download Documents</h4>
              ${documents.map(doc => `
                <a href="${doc.url}" class="download-btn" download="${doc.name.replace(/\s+/g, '_')}">
                  Download ${doc.name}
                </a>
              `).join('')}
            </div>
          ` : ''}
          
          ${documents.map(doc => {
            if (doc.url.endsWith(".pdf")) {
              return `
                <div class="document-section">
                  <div class="document-title">${doc.name}</div>
                  <div class="pdf-link">
                    <p><strong>PDF Document: ${doc.name}</strong></p>
                    <a href="${doc.url}" target="_blank" rel="noopener noreferrer">
                      Open ${doc.name} in New Tab
                    </a>
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="document-section">
                  <div class="document-title">${doc.name}</div>
                  <img src="${doc.url}" class="document-image" alt="${doc.name}" />
                </div>
              `;
            }
          }).join("")}
          
          ${documents.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #666;">
              No documents attached
            </div>
          ` : ""}
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              console.log('Page loaded successfully');
            });
          </script>
        </body>
      </html>
    `;

    try {
      const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank', 'width=800,height=1000,location=yes,menubar=yes,scrollbars=yes,status=yes,toolbar=yes');
      
      if (!printWindow) {
        toast.error("Please allow pop-ups to view/print documents");
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receiving_Entry_${selectedEntry.saudaNo || 'Document'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return;
      }
      
      const hasPDF = documents.some(d => d.url.endsWith(".pdf"));
      if (hasPDF) {
        toast.info("PDF documents have direct download links - click them to download");
      }
      
    } catch (error) {
      console.error("Error opening print window:", error);
      toast.error("Unable to open print window. Please try again.");
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
