import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  FaMoneyCheckAlt,
  FaSearch,
  FaDownload,
  FaFilePdf,
  FaCheckCircle,
  FaClock,
  FaCheckDouble,
  FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { downloadFile } from "../../../utils/fileDownloader";
import logoUrl from "../../../assets/Hans.png";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const DateSelector = lazy(() => import("../../../common/DateSelector/DateSelector"));

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB");
};

const PaymentList = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial status from path
  const isReceivedPath = location.pathname.includes("/payments/received");
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(isReceivedPath ? "done" : "all");
  const [exporting, setExporting] = useState(false);

  // Sync paymentStatus when location changes
  useEffect(() => {
    if (location.pathname.includes("/payments/received")) {
      setPaymentStatus("done");
    } else {
      setPaymentStatus("all");
    }
    setCurrentPage(1);
  }, [location.pathname]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/payments", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          paymentStatus,
        },
      });
      setData(response.data.data);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, startDate, endDate, paymentStatus]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPayments();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchPayments]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "done" : "pending";
    try {
      await api.patch(`/payments/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);
      fetchPayments();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDownloadExcel = async () => {
    if (exporting) return;
    setExporting(true);
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const response = await api.get("/payments/export/excel", {
        params: {
          search: searchInput,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          paymentStatus,
        },
        responseType: "blob",
      });
      const fileName = `Payments_${paymentStatus}_${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadFile(new Blob([response.data]), fileName);
      toast.update(toastId, { render: "Excel downloaded successfully", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error("Excel Download Error:", error);
      toast.update(toastId, { render: "Failed to download Excel", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape");
    const tableColumn = [
      "Sl No", "Sauda No", "Lorry No", "Buyer", "Consignee", "Seller Name", "Seller Co", "Terms", "Date", "Qty", "Amount", "Status"
    ];

    const tableRows = data.map((item) => [
      item.slNo,
      item.saudaNo,
      item.lorryNumber || "N/A",
      item.buyerCompany,
      item.consignee,
      item.supplier?.sellerName || "N/A",
      item.supplierCompany,
      item.paymentTerms,
      formatDate(item.unloadingDate),
      `${(item.unloadingWeight || 0).toFixed(2)} T`,
      `Rs. ${(item.amount || 0).toLocaleString("en-IN")}`,
      item.paymentStatus.toUpperCase()
    ]);

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text(`PAYMENTS ${paymentStatus === 'done' ? 'RECEIVED' : 'SYNC'} REPORT`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`Payments_${paymentStatus}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const headers = [
    "Sl No", "Sauda No", "Lorry No", "Buyer Company", "Consignee", "Seller Name", "Seller Company", "Payment Terms", "Unloading Date", "Unloading Qty", "Amount", "Status"
  ];

  const rows = data.map((item) => [
    item.slNo,
    item.saudaNo,
    <span key={`lorry-${item._id}`} className="font-bold text-slate-600 uppercase">{item.lorryNumber || "N/A"}</span>,
    <span key={`buyer-${item._id}`} className="font-semibold text-slate-700">{item.buyerCompany}</span>,
    item.consignee,
    item.supplier?.sellerName || "N/A",
    item.supplierCompany,
    <span key={`terms-${item._id}`} className="text-xs text-blue-600 font-bold">{item.paymentTerms}</span>,
    formatDate(item.unloadingDate),
    <span key={`qty-${item._id}`} className="font-bold">{item.unloadingWeight.toFixed(2)} T</span>,
    <span key={`amt-${item._id}`} className="font-black text-emerald-700">Rs. {item.amount.toLocaleString("en-IN")}</span>,
    <button
      key={`status-${item._id}`}
      onClick={() => toggleStatus(item._id, item.paymentStatus)}
      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${
        item.paymentStatus === "done"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
    >
      {item.paymentStatus === "done" ? <FaCheckCircle /> : <FaClock />}
      {item.paymentStatus}
    </button>
  ]);

  const tabs = [
    { id: "all", label: "All Payments", icon: <FaClipboardList />, link: "/payments/list" },
    { id: "pending", label: "Pending", icon: <FaClock />, link: "/payments/list" },
    { id: "done", label: "Received", icon: <FaCheckDouble />, link: "/payments/received" },
  ];

  return (
    <AdminPageShell noContentCard>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 space-y-8">
        {/* Sub-navbar / Tabs */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setPaymentStatus(tab.id);
                navigate(tab.link);
              }}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                paymentStatus === tab.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 transform transition-transform hover:rotate-12">
                <FaMoneyCheckAlt size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
                  Payment <span className="text-emerald-600">{paymentStatus === 'done' ? 'Received' : 'Sync'}</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                  {paymentStatus === 'done' ? 'Verified Settlement Records' : 'Financial Settlement Tracker'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleDownloadExcel}
                disabled={exporting}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FaDownload className="text-emerald-600" />
                {exporting ? "Exporting..." : "Excel"}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <FaFilePdf />
                PDF Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="relative group/input">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Sauda, Company..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                placeholderText="From Date"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <DateSelector
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                placeholderText="To Date"
                className="w-full"
              />
            </div>

            <div className="bg-slate-50 rounded-2xl flex items-center px-6 py-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-4">Status:</span>
              <span className={`text-sm font-black uppercase ${paymentStatus === 'done' ? 'text-emerald-600' : paymentStatus === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                {paymentStatus === 'all' ? 'All Records' : paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} />
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default PaymentList;
