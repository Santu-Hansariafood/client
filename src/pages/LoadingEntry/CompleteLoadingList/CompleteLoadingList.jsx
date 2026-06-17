import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { toast } from "react-toastify";
import {
  FaTruckLoading,
  FaSearch,
  FaDownload,
  FaFilePdf,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../../../assets/Hans.png";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getSellerName = (item) =>
  item?.supplier?.sellerName ||
  item?.sellerName ||
  item?.supplierName ||
  item?.supplier ||
  "";

const getConsigneeDisplay = (item) => {
  if (item?.consignee) {
    if (typeof item.consignee === "object") {
      return (
        item.consignee.name ||
        item.consignee.label ||
        item.consignee.consigneeName ||
        "N/A"
      );
    }
    return item.consignee;
  }
  if (item?.shipTo) {
    if (typeof item.shipTo === "object") {
      return (
        item.shipTo.name ||
        item.shipTo.label ||
        item.shipTo.consigneeName ||
        "N/A"
      );
    }
    return item.shipTo;
  }
  return item?.consigneeName || "N/A";
};

const buildDropdownOptions = (values) =>
  [
    ...new Set(
      (values || []).map((value) => String(value || "").trim()).filter(Boolean),
    ),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: value,
      name: value,
    }));

const CompleteLoadingList = () => {
  const { userRole, mobile: authMobile } = useAuth();
  const location = useLocation();
  const mobile = location.state?.mobile || authMobile;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedBuyerCompany, setSelectedBuyerCompany] = useState(null);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);
  const [selectedSellerName, setSelectedSellerName] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        role: userRole,
        mobile,
        search: searchInput || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buyerCompany: selectedBuyerCompany?.value || undefined,
        sellerCompany: selectedSellerCompany?.value || undefined,
        status: "closed",
      };

      const response = await api.get("/self-order/pending/list", { params });
      setData(response.data.data || []);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching loading entries:", error);
      toast.error("Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  }, [
    userRole,
    mobile,
    currentPage,
    itemsPerPage,
    searchInput,
    startDate,
    endDate,
    selectedBuyerCompany,
    selectedSellerCompany,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [buyerCompanyOptions, setBuyerCompanyOptions] = useState([]);
  const [sellerCompanyOptions, setSellerCompanyOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [buyers, sellers] = await Promise.all([
          fetchAllPages("/buyers"),
          fetchAllPages("/sellers"),
        ]);

        // Collect all unique buyer company names
        const buyerCompanies = new Set();
        buyers.forEach(buyer => {
          if (buyer.companyName) {
            buyerCompanies.add(buyer.companyName);
          }
          if (buyer.companyNames) {
            buyer.companyNames.forEach(name => {
              if (name) buyerCompanies.add(name);
            });
          }
        });

        // Collect all unique seller company names
        const sellerCompanies = new Set();
        sellers.forEach(seller => {
          if (seller.companies) {
            seller.companies.forEach(company => {
              if (company) sellerCompanies.add(company);
            });
          }
        });

        setBuyerCompanyOptions(buildDropdownOptions([...buyerCompanies]));
        setSellerCompanyOptions(buildDropdownOptions([...sellerCompanies]));
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate(null);
    setEndDate(null);
    setSelectedBuyerCompany(null);
    setSelectedSellerCompany(null);
    setSelectedSellerName(null);
    setSelectedConsignee(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchInput,
    selectedSellerCompany,
    selectedBuyerCompany,
    selectedSellerName,
    selectedConsignee,
    startDate,
    endDate,
  ]);

  const handleDownloadExcel = async () => {
    try {
      const toastId = toast.loading("Preparing Excel...");
      const params = {
        limit: 5000,
        role: userRole,
        mobile,
        search: searchInput || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buyerCompany: selectedBuyerCompany?.value || undefined,
        sellerCompany: selectedSellerCompany?.value || undefined,
        status: "closed",
      };
      const response = await api.get("/self-order/pending/list", { params });
      const exportData = response.data.data || [];

      const excelRows = exportData.map((item, index) => {
        const quantity = item.quantity || 0;
        let pendingQuantity = item.pendingQuantity;
        if (
          (pendingQuantity === undefined ||
            pendingQuantity === null ||
            (pendingQuantity === 0 && item.status === "active")) &&
          item.status !== "closed"
        ) {
          pendingQuantity = quantity;
        } else {
          pendingQuantity = Number(pendingQuantity || 0);
        }
        const loadedQuantity = quantity - pendingQuantity;

        return {
          "Sl No": index + 1,
          Date: formatDate(item.poDate || item.createdAt),
          "Sauda No": item.saudaNo || "N/A",
          "Seller Company": item.supplierCompany || "N/A",
          "Seller Name": getSellerName(item) || "N/A",
          "Buyer Company": item.buyerCompany || "N/A",
          Consignee: getConsigneeDisplay(item),
          Commodity: item.commodity || "N/A",
          "Total Quantity": quantity.toFixed(2),
          "Pending Quantity": pendingQuantity.toFixed(2),
          "Loaded Quantity": loadedQuantity.toFixed(2),
          "Unloading Quantity": (item.totalUnloadingWeight || 0).toFixed(2),
          Rate: item.rate || 0,
          "Loaded Brokerage": (
            (item.totalUnloadingWeight || 0) *
            (item.buyerBrokerage?.brokerageSupplier || 0)
          ).toFixed(2),
          "Pending Brokerage": (
            pendingQuantity * (item.buyerBrokerage?.brokerageSupplier || 0)
          ).toFixed(2),
          "Total Brokerage": (
            ((item.totalUnloadingWeight || 0) + pendingQuantity) *
            (item.buyerBrokerage?.brokerageSupplier || 0)
          ).toFixed(2),
          "Payment Terms": item.paymentTerms || "N/A",
        };
      });

      if (excelRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("No data available to download.");
        return;
      }

      // Add total row
      const totals = exportData.reduce(
        (acc, item) => {
          const quantity = item.quantity || 0;
          let pendingQuantity = item.pendingQuantity;
          if (
            (pendingQuantity === undefined ||
              pendingQuantity === null ||
              (pendingQuantity === 0 && item.status === "active")) &&
            item.status !== "closed"
          ) {
            pendingQuantity = quantity;
          } else {
            pendingQuantity = Number(pendingQuantity || 0);
          }
          const loadedQuantity = quantity - pendingQuantity;
          const unloadingWeight = item.totalUnloadingWeight || 0;
          const brokerageRate = item.buyerBrokerage?.brokerageSupplier || 0;

          acc.totalQty += quantity;
          acc.totalPendingQty += pendingQuantity;
          acc.totalLoadedQty += loadedQuantity;
          acc.totalUnloadingQty += unloadingWeight;
          acc.totalLoadedBrokerage += unloadingWeight * brokerageRate;
          acc.totalPendingBrokerage += pendingQuantity * brokerageRate;
          return acc;
        },
        {
          totalQty: 0,
          totalPendingQty: 0,
          totalLoadedQty: 0,
          totalUnloadingQty: 0,
          totalLoadedBrokerage: 0,
          totalPendingBrokerage: 0,
        },
      );

      excelRows.push({
        "Sl No": "TOTAL",
        Date: "",
        "Sauda No": "",
        "Seller Company": "",
        "Seller Name": "",
        "Buyer Company": "",
        Consignee: "",
        Commodity: "",
        "Total Quantity": totals.totalQty.toFixed(2),
        "Pending Quantity": totals.totalPendingQty.toFixed(2),
        "Loaded Quantity": totals.totalLoadedQty.toFixed(2),
        "Unloading Quantity": totals.totalUnloadingQty.toFixed(2),
        Rate: "",
        "Loaded Brokerage": totals.totalLoadedBrokerage.toFixed(2),
        "Pending Brokerage": totals.totalPendingBrokerage.toFixed(2),
        "Total Brokerage": (
          totals.totalLoadedBrokerage + totals.totalPendingBrokerage
        ).toFixed(2),
        "Payment Terms": "",
      });

      await generateExcel(
        excelRows,
        `CompleteSaudaReport_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("Failed to generate Excel");
    }
  };

  const handleDownloadPDF = async (item) => {
    const toastId = toast.loading("Preparing PDF Report...");
    try {
      const saudaNo = item.saudaNo;
      const response = await api.get("/loading-entries", {
        params: { saudaNo, limit: 1000 },
      });
      const loadingEntries = response.data?.data || response.data || [];

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      try {
        doc.addImage(logoUrl, "PNG", 14, 10, 40, 20);
      } catch (e) {
        console.warn("Logo failed to load", e);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(5, 150, 105);
      doc.text("HANSARIA FOOD PRIVATE LIMITED", 60, 18);

      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Commodities & Brokerage Services", 60, 23);
      doc.text(
        "Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106",
        60,
        28,
      );

      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.5);
      doc.line(14, 35, pageWidth - 14, 35);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(`COMPLETE SAUDA REPORT: ${saudaNo}`, 14, 45);

      doc.setFillColor(249, 250, 251);
      doc.rect(14, 50, pageWidth - 28, 45, "F");
      doc.setDrawColor(229, 231, 235);
      doc.rect(14, 50, pageWidth - 28, 45, "S");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);

      const col1 = 18;
      const col2 = 60;
      const col3 = 110;
      const col4 = 150;

      doc.text("Sauda No:", col1, 58);
      doc.text("Date:", col1, 65);
      doc.text("Commodity:", col1, 72);
      doc.text("Buyer Company:", col1, 79);
      doc.text("Seller Company:", col1, 86);

      doc.text("Total Qty:", col3, 58);
      doc.text("Loaded Qty:", col3, 65);
      doc.text("Pending Qty:", col3, 72);
      doc.text("Rate:", col3, 79);
      doc.text("Consignee:", col3, 86);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);

      doc.text(saudaNo || "N/A", col2, 58);
      doc.text(formatDate(item.poDate || item.createdAt), col2, 65);
      doc.text(item.commodity || "N/A", col2, 72);
      doc.text(item.buyerCompany || "N/A", col2, 79);
      doc.text(item.supplierCompany || "N/A", col2, 86);

      doc.text(`${(item.quantity || 0).toFixed(2)} Tons`, col4, 58);
      doc.text(
        `${(item.quantity - (item.pendingQuantity || 0)).toFixed(2)} Tons`,
        col4,
        65,
      );
      doc.text(`${(item.pendingQuantity || 0).toFixed(2)} Tons`, col4, 72);
      doc.text(`Rs. ${item.rate || 0}`, col4, 79);
      doc.text(getConsigneeDisplay(item) || "N/A", col4, 86);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105);
      doc.text("LORRY-WISE LOADING & UNLOADING DETAILS", 14, 105);

      const tableColumn = [
        "Sl No",
        "Lorry Number",
        "Loading Date",
        "Loading Wt (T)",
        "Unloading Date",
        "Unloading Wt (T)",
        "Status",
      ];

      const tableRows = loadingEntries.map((entry, idx) => [
        idx + 1,
        entry.lorryNumber || "N/A",
        formatDate(entry.loadingDate),
        (entry.loadingWeight || 0).toFixed(2),
        formatDate(entry.unloadingDate),
        (entry.unloadingWeight || 0).toFixed(2),
        entry.unloadingWeight > 0 ? "Delivered" : "In-Transit",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        theme: "grid",
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontSize: 9,
          halign: "center",
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "middle",
          halign: "center",
        },
        columnStyles: {
          1: { halign: "left", fontStyle: "bold" },
          3: { halign: "right" },
          5: { halign: "right" },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      const finalY = doc.lastAutoTable.finalY || 110;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);

      const sigX = pageWidth - 60;
      doc.text("Thanks and regards,", sigX, finalY + 15);
      doc.text("Team Hansaria", sigX, finalY + 20);
      doc.text("Purchase department", sigX, finalY + 25);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text(
        "This is a system generated report for internal logistics monitoring.",
        14,
        pageHeight - 15,
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString("en-GB")}`,
        pageWidth - 65,
        pageHeight - 15,
      );

      doc.save(`Complete_Sauda_${saudaNo}_Details.pdf`);
      toast.dismiss(toastId);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF report");
    }
  };

  const headers = [
    "Sl No",
    "Date",
    "Sauda No",
    "Seller Company",
    "Seller Name",
    "Buyer Company",
    "Consignee",
    "Commodity",
    "Total Qty",
    "Pending Qty",
    "Loaded Qty",
    "Rate",
    "Brokerage",
    "Payment Terms",
    "Status",
    "Action",
  ];

  const rows = data.map((item, index) => {
    const quantity = item.quantity || 0;
    let pendingQuantity = item.pendingQuantity;

    if (pendingQuantity === undefined || pendingQuantity === null) {
      pendingQuantity = quantity;
    }

    const loadedQuantity = quantity - pendingQuantity;
    const isWithinTolerance = pendingQuantity <= 0 && pendingQuantity >= -quantity * 0.05;
    const isClosed = item.status === "closed" || isWithinTolerance;

    const brokerageRate = item.buyerBrokerage?.brokerageSupplier || 0;
    const unloadingWeight = item.totalUnloadingWeight || 0;
    const loadedBrokerage = (unloadingWeight * brokerageRate).toFixed(2);
    const pendingBrokerage = (
      Math.max(0, pendingQuantity) * brokerageRate
    ).toFixed(2);
    const totalBrokerage = (
      parseFloat(loadedBrokerage) + parseFloat(pendingBrokerage)
    ).toFixed(2);

    return [
      (currentPage - 1) * itemsPerPage + index + 1,
      formatDate(item.poDate || item.createdAt),
      item.saudaNo || "N/A",
      <span
        key={`seller-co-${item._id}`}
        className="font-semibold text-slate-700"
      >
        {item.supplierCompany || "N/A"}
      </span>,
      getSellerName(item) || "N/A",
      item.buyerCompany || "N/A",
      getConsigneeDisplay(item),
      item.commodity || "N/A",
      quantity,
      <span
        key={`pending-${item._id}`}
        className={`${pendingQuantity < 0 ? "text-rose-600" : "text-amber-600"} font-bold`}
      >
        {pendingQuantity.toFixed(2)}
      </span>,
      loadedQuantity.toFixed(2),
      item.rate || 0,
      <div key={`brokerage-${item._id}`} className="flex flex-col text-xs">
        <span className="text-slate-600 font-medium">
          Total: ₹{totalBrokerage}
        </span>
        <span className="text-emerald-600">
          Loaded: ₹{loadedBrokerage} (On {unloadingWeight.toFixed(2)}T)
        </span>
        <span className="text-amber-600">Pending: ₹{pendingBrokerage}</span>
      </div>,
      item.paymentTerms || "N/A",
      <span
        key={`status-${item._id}`}
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isClosed
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {isClosed ? "Closed" : "Active"}
      </span>,
      <button
        key={`pdf-${item._id}`}
        onClick={() => handleDownloadPDF(item)}
        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
        title="Download Detailed PDF"
      >
        <FaFilePdf size={16} />
      </button>,
    ];
  });

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Complete Sauda List"
        subtitle="Manage all saudas with full delivery details"
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FaSearch className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Filter & Search
                </h3>
                <p className="text-sm text-slate-500">
                  Filter complete sauda with independent responsive fields
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Search
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Enter search term..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
                {userRole !== "Seller" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Seller Company
                      </label>
                      <DataDropdown
                        options={sellerCompanyOptions}
                        selectedOptions={selectedSellerCompany}
                        onChange={setSelectedSellerCompany}
                        placeholder="Select Seller Company"
                        isMulti={false}
                        isClearable
                      />
                    </div>
                  </>
                )}
                <div
                  className={
                    userRole === "Seller" ? "sm:col-span-1 xl:col-span-3" : ""
                  }
                >
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Buyer Company
                  </label>
                  <DataDropdown
                    options={buyerCompanyOptions}
                    selectedOptions={selectedBuyerCompany}
                    onChange={setSelectedBuyerCompany}
                    placeholder="Select Buyer Company"
                    isMulti={false}
                    isClearable
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                    Start Date
                  </label>
                  <DateSelector
                    selectedDate={startDate}
                    onChange={setStartDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    End Date
                  </label>
                  <DateSelector selectedDate={endDate} onChange={setEndDate} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 min-w-[160px] px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all duration-200 border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="flex-1 min-w-[160px] px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loading />
              </div>
            ) : data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Tables headers={headers} rows={rows} />
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-500 font-medium">
                No entries found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default CompleteLoadingList;
