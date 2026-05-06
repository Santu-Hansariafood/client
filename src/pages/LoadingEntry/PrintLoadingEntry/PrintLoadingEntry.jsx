import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaTruck, FaDownload, FaSearch, FaArrowLeft } from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Pagination = React.lazy(() => import("../../../common/Paginations/Paginations"));
const SearchBox = React.lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = React.lazy(() => import("../../../common/PopupBox/PopupBox"));

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const normalizeText = (text) => {
  return String(text || "").trim().toLowerCase();
};

const buildSaudaAddress = (sauda, prefix) => {
  const parts = [];
  if (sauda[`${prefix}Location`]) parts.push(sauda[`${prefix}Location`]);
  if (sauda[`${prefix}District`]) parts.push(sauda[`${prefix}District`]);
  if (sauda[`${prefix}State`]) parts.push(sauda[`${prefix}State`]);
  if (sauda[`${prefix}PinCode`]) parts.push(sauda[`${prefix}PinCode`]);
  return parts.length ? parts.join(", ") : null;
};

const PrintLoadingEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSaudaNo = searchParams.get("saudaNo");

  const [loading, setLoading] = useState(false);
  const [saudaData, setSaudaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [viewPopupOpen, setViewPopupOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSaudaData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/self-order", { params: { limit: 0 } });
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        data = response.data.items;
      }

      setSaudaData(data);
      setFilteredData(data);
      setTotalItems(data.length);
    } catch (error) {
      console.error("Error fetching sauda data:", error);
      toast.error("Failed to load sauda data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaudaData();
  }, [fetchSaudaData]);

  useEffect(() => {
    if (!searchText) {
      setFilteredData(saudaData);
      setTotalItems(saudaData.length);
      return;
    }

    const searchLower = normalizeText(searchText);
    const filtered = saudaData.filter((item) => {
      const fields = [
        item.saudaNo,
        item.buyerCompany,
        item.buyerName,
        item.supplierCompany,
        item.commodity,
      ].map(normalizeText);
      return fields.some((f) => f.includes(searchLower));
    });

    setFilteredData(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchText, saudaData]);

  useEffect(() => {
    if (initialSaudaNo && saudaData.length > 0) {
      const matching = saudaData.find((s) => String(s.saudaNo) === String(initialSaudaNo));
      if (matching) {
        setSelectedChallan(matching);
        setViewPopupOpen(true);
      }
    }
  }, [initialSaudaNo, saudaData]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePDF = async (challan) => {
    try {
      toast.loading("Generating lorry challan...");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("LORRY CHALLAN", pageWidth / 2, 25, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Date: ${formatDate(new Date())}`, pageWidth - margin - 30, 30, { align: "right" });
      doc.text(`Sauda No: ${challan.saudaNo || "N/A"}`, margin, 35);

      const buyerName = challan.buyerCompany || challan.buyerName || "N/A";
      const buyerAddress = challan.buyerAddress || challan.deliveryAddress || buildSaudaAddress(challan, "buyer") || buildSaudaAddress(challan, "delivery") || "N/A";
      const buyerGst = challan.buyerGstNo || challan.buyerGstNumber || challan.gstNo || "";

      const consigneeName = challan.consigneeName || challan.shipToName || challan.consignee?.name || challan.shipTo?.name || "N/A";
      const consigneeAddress = challan.consigneeAddress || challan.shipToAddress || buildSaudaAddress(challan, "consignee") || buildSaudaAddress(challan, "shipTo") || "N/A";
      const consigneeGst = challan.consigneeGstNo || challan.shipToGstNo || challan.consignee?.gstNo || challan.consignee?.gstNumber || "";
      const consigneePan = challan.consigneePanNo || challan.shipToPanNo || challan.consignee?.panNo || challan.consignee?.panNumber || "";
      const consigneeMobile = challan.consigneeMobile || challan.shipToMobile || challan.consignee?.phone || challan.consignee?.mobile || "";

      doc.setLineWidth(0.5);
      doc.rect(margin, 40, contentWidth, 40);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("BUYER ACCOUNT", margin + 5, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${buyerName}`, margin + 5, 55);
      doc.text(`Address: ${buyerAddress}`, margin + 5, 62);
      if (buyerGst) {
        doc.text(`GST: ${buyerGst}`, margin + 5, 69);
      }

      doc.rect(margin, 85, contentWidth, 45);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("SHIP TO (CONSIGNEE)", margin + 5, 93);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${consigneeName}`, margin + 5, 100);
      doc.text(`Address: ${consigneeAddress}`, margin + 5, 107);
      if (consigneeMobile) {
        doc.text(`Mobile: ${consigneeMobile}`, margin + 5, 114);
      }
      if (consigneeGst) {
        doc.text(`GST: ${consigneeGst}`, margin + 5, 121);
      }
      if (consigneePan) {
        doc.text(`PAN: ${consigneePan}`, margin + 80, 121);
      }

      const tableStartY = 140;
      const tableData = [
        ["Seller Company", challan.supplierCompany || "N/A"],
        ["Commodity", challan.commodity || "N/A"],
        ["Quantity", `${challan.quantity || 0} Tons`],
        ["Broker", challan.brokerName || "Hansaria Food Private Limited"],
      ];

      autoTable(doc, {
        startY: tableStartY,
        head: [["Particulars", "Details"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: 0,
          fontStyle: "bold"
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        }
      });

      const finalY = (doc.lastAutoTable?.finalY || tableStartY) + 20;
      doc.setFontSize(9);
      doc.setLineWidth(0.3);
      
      doc.line(margin, finalY, pageWidth / 2 - 5, finalY);
      doc.text("Driver Signature", margin, finalY + 5);
      
      doc.line(pageWidth / 2 + 5, finalY, pageWidth - margin, finalY);
      doc.text("Authorized Signature", pageWidth / 2 + 10, finalY + 5, { align: "left" });

      toast.dismiss();
      toast.success("Lorry challan generated!");
      doc.save(`LorryChallan-${challan.saudaNo || "document"}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.dismiss();
      toast.error("Failed to generate lorry challan");
    }
  };

  const handleView = (challan) => {
    setSelectedChallan(challan);
    setViewPopupOpen(true);
  };

  const handleDownload = (challan) => {
    generatePDF(challan);
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Lorry Challan"
        subtitle="Generate and print lorry challans from sauda entries"
        icon={FaTruck}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              <FaArrowLeft size={14} />
              Back
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sauda Entries</h3>
                {totalItems > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                  </p>
                )}
              </div>
            </div>

            <SearchBox
              placeholder="Search by sauda no, buyer, seller, commodity..."
              items={[]}
              returnQuery={true}
              onSearch={(q) => setSearchText(q)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loading />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No sauda entries found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Sl No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Sauda No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Buyer Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Seller Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Commodity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedData.map((item, index) => (
                        <tr key={item._id || index} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {item.saudaNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.buyerCompany || item.buyerName || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.supplierCompany || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.commodity || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.quantity || 0} Tons
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleView(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View"
                              >
                                <FaSearch size={16} />
                              </button>
                              <button
                                onClick={() => handleDownload(item)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Download Challan"
                              >
                                <FaDownload size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200 p-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {viewPopupOpen && selectedChallan && (
          <PopupBox
            isOpen={viewPopupOpen}
            onClose={() => {
              setViewPopupOpen(false);
              setSelectedChallan(null);
            }}
            title={`Lorry Challan - Sauda No: ${selectedChallan.saudaNo}`}
            maxWidth="max-w-4xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                    Buyer Account
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong className="text-slate-500">Name:</strong>{" "}
                      <span className="text-slate-800">
                        {selectedChallan.buyerCompany || selectedChallan.buyerName || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <strong className="text-slate-500">Address:</strong>{" "}
                      <span className="text-slate-800">
                        {selectedChallan.buyerAddress || selectedChallan.deliveryAddress || buildSaudaAddress(selectedChallan, "buyer") || "N/A"}
                      </span>
                    </p>
                    {selectedChallan.buyerGstNo || selectedChallan.buyerGstNumber ? (
                      <p className="text-sm">
                        <strong className="text-slate-500">GST:</strong>{" "}
                        <span className="text-slate-800">
                          {selectedChallan.buyerGstNo || selectedChallan.buyerGstNumber}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                    Ship To (Consignee)
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong className="text-slate-500">Name:</strong>{" "}
                      <span className="text-slate-800">
                        {selectedChallan.consigneeName || selectedChallan.shipToName || selectedChallan.consignee?.name || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <strong className="text-slate-500">Address:</strong>{" "}
                      <span className="text-slate-800">
                        {selectedChallan.consigneeAddress || selectedChallan.shipToAddress || buildSaudaAddress(selectedChallan, "consignee") || "N/A"}
                      </span>
                    </p>
                    {selectedChallan.consigneeMobile || selectedChallan.shipToMobile || selectedChallan.consignee?.phone ? (
                      <p className="text-sm">
                        <strong className="text-slate-500">Mobile:</strong>{" "}
                        <span className="text-slate-800">
                          {selectedChallan.consigneeMobile || selectedChallan.shipToMobile || selectedChallan.consignee?.phone}
                        </span>
                      </p>
                    ) : null}
                    {selectedChallan.consigneeGstNo || selectedChallan.shipToGstNo || selectedChallan.consignee?.gstNo ? (
                      <p className="text-sm">
                        <strong className="text-slate-500">GST:</strong>{" "}
                        <span className="text-slate-800">
                          {selectedChallan.consigneeGstNo || selectedChallan.shipToGstNo || selectedChallan.consignee?.gstNo}
                        </span>
                      </p>
                    ) : null}
                    {selectedChallan.consigneePanNo || selectedChallan.shipToPanNo || selectedChallan.consignee?.panNo ? (
                      <p className="text-sm">
                        <strong className="text-slate-500">PAN:</strong>{" "}
                        <span className="text-slate-800">
                          {selectedChallan.consigneePanNo || selectedChallan.shipToPanNo || selectedChallan.consignee?.panNo}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Sauda Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Sauda No</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedChallan.saudaNo}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Commodity</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedChallan.commodity || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedChallan.quantity || 0} Tons</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Seller</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedChallan.supplierCompany || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setViewPopupOpen(false);
                    setSelectedChallan(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(selectedChallan)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <FaDownload size={16} />
                  Download Challan
                </button>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default PrintLoadingEntry;
