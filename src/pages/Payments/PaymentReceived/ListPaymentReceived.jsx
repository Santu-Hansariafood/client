import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Tables from "../../../common/Tables/Tables";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import api from "../../../utils/apiClient/apiClient";
import {
  FaPlus,
  FaMoneyBillWave,
  FaFilter,
  FaCalendarAlt,
  FaPrint,
  FaChartLine,
  FaCheckCircle,
  FaExclamationCircle,
  FaBuilding,
  FaTruck,
  FaBoxOpen,
} from "react-icons/fa";
import Paginations from "../../../common/Paginations/Paginations";
import DateRangeSelector from "../../../common/DateSelector/DateRangeSelector";
import logoImg from "../../../assets/Hans.png";
import TabButton from "./components/TabButton";
import SaudaMISSection from "./components/SaudaMISSection";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const StatCard = ({ icon, label, value, subValue, color, iconColor }) => (
  <div
    className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all duration-300`}
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} ${iconColor}`}>{icon}</div>
      {subValue && (
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
          {subValue}
        </span>
      )}
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-slate-900 tracking-tight italic">
        {value}
      </p>
    </div>
  </div>
);

const ListPaymentReceived = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("vouchers"); // vouchers, sauda
  const [ledgers, setLedgers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [fetchingLedgers, setFetchingLedgers] = useState(false);

  const [allBuyers, setAllBuyers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [saudas, setSaudas] = useState([]);
  const [selectedSauda, setSelectedSauda] = useState(null);
  const [selectedBuyerForSauda, setSelectedBuyerForSauda] = useState(null);
  const [selectedSellerForSauda, setSelectedSellerForSauda] = useState(null);
  const [lorryWiseData, setLorryWiseData] = useState([]);
  const [fetchingLorryWise, setFetchingLorryWise] = useState(false);

  const [filters, setFilters] = useState({
    ledgerType: "",
    ledgerId: "",
    companyId: "",
    startDate: "",
    endDate: "",
    saudaNo: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [companiesRes, buyersRes, sellersRes] = await Promise.all([
          api.get('/companies'),
          api.get('/buyers'),
          api.get('/sellers')
        ]);
        setAllCompanies(companiesRes.data.data || companiesRes.data || []);
        
        const bData = buyersRes.data.data || buyersRes.data || [];
        setAllBuyers(bData.map(b => ({ value: b._id, label: b.name, companies: b.companyIds || [] })));
        
        const sData = sellersRes.data.data || sellersRes.data || [];
        setAllSellers(sData.map(s => ({ value: s._id, label: s.sellerName, companies: s.companies || [] })));
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Saudas when Buyer and Seller are selected
  useEffect(() => {
    const fetchSaudas = async () => {
      if (selectedBuyerForSauda && selectedSellerForSauda) {
        try {
          const response = await api.get("/loading-entries/saudas", {
            params: {
              buyerId: selectedBuyerForSauda.value,
              sellerId: selectedSellerForSauda.value,
            },
          });
          const saudaList = response.data.data || response.data || [];
          setSaudas(saudaList.map(s => ({ value: s.saudaNo, label: s.saudaNo })));
        } catch (error) {
          console.error("Error fetching saudas:", error);
        }
      } else {
        setSaudas([]);
        setSelectedSauda(null);
      }
    };
    fetchSaudas();
  }, [selectedBuyerForSauda, selectedSellerForSauda]);

  // Fetch Lorry-wise data when Sauda is selected
  useEffect(() => {
    const fetchLorryWise = async () => {
      if (selectedSauda) {
        try {
          setFetchingLorryWise(true);
          const response = await api.get(`/self-orders/details/${selectedSauda.value}`);
          const { entries, payments } = response.data;
          
          // Map payments to entries (adjustments)
          const processedEntries = entries.map(entry => {
            const adjustments = payments.filter(p => 
              p.mappings && p.mappings.some(m => m.loadingEntryId === entry._id)
            ).map(p => {
              const mapping = p.mappings.find(m => m.loadingEntryId === entry._id);
              return {
                paymentDate: p.date,
                voucherNo: p.voucherNo,
                amount: mapping.allocatedAmount,
                paymentMode: p.paymentMode
              };
            });
            
            const totalAdjusted = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
            return {
              ...entry,
              adjustments,
              totalAdjusted,
              balance: (entry.totalFreight || 0) - totalAdjusted
            };
          });
          
          setLorryWiseData(processedEntries);
        } catch (error) {
          console.error("Error fetching lorry wise data:", error);
        } finally {
          setFetchingLorryWise(false);
        }
      } else {
        setLorryWiseData([]);
      }
    };
    fetchLorryWise();
  }, [selectedSauda]);

  const fetchLedgers = useCallback(async () => {
    if (!filters.ledgerType) {
      setLedgers([]);
      return;
    }
    try {
      setFetchingLedgers(true);
      const endpoint = filters.ledgerType === "Buyer" ? "/buyers" : "/sellers";
      const response = await api.get(endpoint);
      const data = response.data.data || response.data;
      setLedgers(
        data.map((item) => ({
          value: item._id,
          label: item.name || item.sellerName,
          companies: item.companyIds || item.companies || []
        })),
      );
    } catch (error) {
      toast.error("Error fetching ledgers");
    } finally {
      setFetchingLedgers(false);
    }
  }, [filters.ledgerType]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/payment-received", {
        params: {
          ...filters,
          page,
          limit,
        },
      });
      setPayments(response.data.data || []);
      setTotal(response.data.total || 0);
      setTotalAmount(response.data.totalAmount || 0);
      setOpeningBalance(response.data.openingBalance || 0);
    } catch (error) {
      toast.error("Error fetching payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  const stats = useMemo(() => {
    return { 
        openingBalance: openingBalance,
        totalReceived: totalAmount, 
        closingBalance: openingBalance + totalAmount,
        count: total 
    };
  }, [openingBalance, totalAmount, total]);

  const handlePrintReport = async () => {
    try {
      setPrinting(true);

      const params = {
        ...filters,
        limit: 5000,
      };

      const response = await api.get("/payment-received", {
        params,
      });

      const allPayments = response.data.data || [];

      if (allPayments.length === 0) {
        toast.warning("No records found");
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      // --- TALLY STYLE HEADER ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106", pageWidth / 2, 20, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth - margin, 25); // Top Border

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const reportTitle = "PAYMENT RECEIVED MIS REPORT";
      doc.text(reportTitle, margin, 32);

      if (selectedCompany) {
        doc.setFontSize(10);
        doc.text(`COMPANY: ${selectedCompany.label.toUpperCase()}`, margin, 38);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateRange = filters.startDate && filters.endDate 
        ? `Period: ${new Date(filters.startDate).toLocaleDateString("en-GB")} to ${new Date(filters.endDate).toLocaleDateString("en-GB")}`
        : "Period: Consolidated (All Time)";
      doc.text(dateRange, pageWidth - margin, 32, { align: "right" });

      doc.line(margin, selectedCompany ? 41 : 35, pageWidth - margin, selectedCompany ? 41 : 35); // Bottom Header Border

      let currentY = selectedCompany ? 45 : 40;

      // Opening Balance Row
      if (filters.ledgerId) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Opening Balance:", margin, currentY + 5);
          doc.text(`Rs. ${openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, pageWidth - margin, currentY + 5, { align: "right" });
          currentY += 10;
      }

      // Table Data
      const tableData = allPayments.map((p, idx) => {
        const buyerNames = [
          ...new Set(
            p.mappings
              ?.map((m) => m.loadingEntryId?.buyerCompany)
              .filter(Boolean),
          ),
        ].join(", ");

        const sellerNames = [
          ...new Set(
            p.mappings
              ?.map((m) => m.loadingEntryId?.supplierCompany)
              .filter(Boolean),
          ),
        ].join(", ");

        return [
          idx + 1,
          new Date(p.date).toLocaleDateString("en-GB"),
          (p.ledgerId?.name || p.ledgerId?.sellerName || "N/A").toUpperCase(),
          (buyerNames || "-").toUpperCase(),
          (sellerNames || "-").toUpperCase(),
          p.paymentMode.toUpperCase(),
          `Rs. ${Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "NO",
            "DATE",
            "LEDGER NAME",
            "BUYER COMPANY",
            "SELLER COMPANY",
            "MODE",
            "AMOUNT",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
          valign: "middle",
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "center", cellWidth: 20 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { halign: "center", cellWidth: 20 },
          6: { halign: "right", fontStyle: "bold", cellWidth: 25 },
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - margin,
            doc.internal.pageSize.height - 10,
            { align: "right" }
          );
          doc.text(
            `Printed on: ${new Date().toLocaleString()}`,
            margin,
            doc.internal.pageSize.height - 10,
          );
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 70;
      
      // Total and Closing Balance
      if (finalY + 30 > doc.internal.pageSize.height) {
        doc.addPage();
        doc.setLineWidth(0.5);
        doc.line(margin, 10, pageWidth - margin, 10);
      }

      const summaryY = doc.lastAutoTable?.finalY + 10 || 80;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      // Total amount in the selected period
      doc.text(
        `Period Total : Rs. ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        pageWidth - margin,
        summaryY,
        { align: "right" },
      );

      // Closing Balance (Opening + Total)
      if (filters.ledgerId) {
          doc.text(
            `Closing Balance : Rs. ${(openingBalance + totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            pageWidth - margin,
            summaryY + 7,
            { align: "right" },
          );
      }

      doc.setFontSize(9);
      doc.text("Authorised Signatory", pageWidth - margin, summaryY + 20, { align: "right" });
      doc.line(pageWidth - 60, summaryY + 17, pageWidth - margin, summaryY + 17);

      doc.save(
        `MIS_PaymentReceived_${filters.startDate}_to_${filters.endDate}.pdf`,
      );

      toast.success("MIS Report generated successfully");
    } catch (error) {
      console.error("Print Error:", error);

      toast.error("Failed to generate MIS Report");
    } finally {
      setPrinting(false);
    }
  };

  const columns = [
    {
      header: "Date",
      accessor: (row) => new Date(row.date).toLocaleDateString(),
      className: "font-semibold text-slate-700",
    },
    {
      header: "Ledger / Company",
      accessor: (row) => {
        let companyLabel = 'Consolidated';
        
        if (row.companyId) {
            if (row.ledgerType === 'Buyer') {
                const companyInfo = allCompanies.find(c => c._id === row.companyId);
                companyLabel = companyInfo?.companyName || 'N/A';
            } else {
                // For Sellers, companyId is the name string
                companyLabel = row.companyId;
            }
        } else if (row.mappings && row.mappings.length > 0) {
            // Fallback for older records: extract company from first mapping
            const firstMapping = row.mappings[0].loadingEntryId;
            if (firstMapping) {
                companyLabel = row.ledgerType === 'Buyer' 
                    ? (firstMapping.buyerCompany || 'N/A')
                    : (firstMapping.supplierCompany || 'N/A');
            }
        }

        return (
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        {row.ledgerType}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase truncate max-w-[120px]" title={companyLabel}>
                        {companyLabel}
                    </span>
                </div>
                <span className="font-bold text-slate-800">
                    {row.ledgerId?.name || row.ledgerId?.sellerName || "N/A"}
                </span>
            </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: (row) => (
        <span className="font-black text-emerald-600 italic tracking-tight">
          Rs. {row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Mode",
      accessor: (row) => (
        <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
          {row.paymentMode}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: (row) => (
        <span
          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
            row.paymentType === "Sauda-wise"
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-amber-50 text-amber-600 border-amber-100"
          }`}
        >
          {row.paymentType}
        </span>
      ),
    },
    {
      header: "Mappings",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-slate-900">
            {row.mappings?.length || 0} Entries
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
            Settled Records
          </span>
        </div>
      ),
    },
    {
      header: "Remarks",
      accessor: "remarks",
      className:
        "max-w-[200px] truncate italic text-slate-400 text-xs font-medium",
    },
  ];

  return (
    <AdminPageShell
      title="Payment Ledger MIS"
      subtitle="Analyze and print company-wise collection reports"
      icon={FaMoneyBillWave}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <TabButton 
                    active={activeTab === 'vouchers'} 
                    label="Voucher MIS" 
                    icon={FaMoneyBillWave} 
                    onClick={() => setActiveTab('vouchers')} 
                />
                <TabButton 
                    active={activeTab === 'sauda'} 
                    label="Sauda-wise MIS" 
                    icon={FaChartLine} 
                    onClick={() => setActiveTab('sauda')} 
                />
            </div>
        </div>

        {activeTab === 'vouchers' ? (
          <>
            {/* MIS Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FaChartLine size={18} />}
            label="Opening Balance"
            value={`Rs. ${stats.openingBalance.toLocaleString("en-IN")}`}
            subValue="Before Period"
            color="bg-slate-50"
            iconColor="text-slate-600"
          />
          <StatCard
            icon={<FaMoneyBillWave size={18} />}
            label="Period Total"
            value={`Rs. ${stats.totalReceived.toLocaleString("en-IN")}`}
            subValue="In Selected Period"
            color="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={<FaCheckCircle size={18} />}
            label="Closing Balance"
            value={`Rs. ${stats.closingBalance.toLocaleString("en-IN")}`}
            subValue="At Period End"
            color="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<FaExclamationCircle size={18} />}
            label="Transaction Count"
            value={stats.count.toString()}
            subValue="Vouchers"
            color="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <FaFilter size={14} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">
                  Filter Configuration
                </h4>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  Define report scope and dates
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrintReport}
                disabled={loading || printing || payments.length === 0}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg disabled:opacity-50"
              >
                {printing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <FaPrint size={14} />
                )}
                {printing ? "Generating..." : "Print MIS Report"}
              </button>
              <button
                onClick={() => navigate("/payments/received/add")}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg"
              >
                <FaPlus size={14} /> Record Payment
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Ledger Type
              </label>
              <select
                value={filters.ledgerType}
                onChange={(e) => {
                  setPage(1);
                  setFilters((prev) => ({
                    ...prev,
                    ledgerType: e.target.value,
                    ledgerId: "",
                    companyId: "",
                  }));
                  setSelectedLedger(null);
                  setSelectedCompany(null);
                  setSelectedBuyerForSauda(null);
                  setSelectedSellerForSauda(null);
                  setSelectedSauda(null);
                }}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
              >
                <option value="">Consolidated</option>
                <option value="Buyer">Buyer Ledger</option>
                <option value="Seller">Seller Ledger</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Account Name
              </label>
              <DataDropdown
                options={ledgers}
                selectedOptions={selectedLedger}
                onChange={(opt) => {
                  setSelectedLedger(opt);
                  setSelectedCompany(null);
                  setPage(1);
                  setFilters((prev) => ({
                    ...prev,
                    ledgerId: opt?.value || "",
                    companyId: "",
                  }));
                  // Auto-populate Sauda Buyer/Seller based on Ledger Type
                  if (filters.ledgerType === 'Buyer') {
                    setSelectedBuyerForSauda(opt);
                  } else if (filters.ledgerType === 'Seller') {
                    setSelectedSellerForSauda(opt);
                  }
                }}
                placeholder={
                  fetchingLedgers ? "Syncing..." : "Search Account..."
                }
                isMulti={false}
                isDisabled={!filters.ledgerType}
                className="rounded-xl border-slate-200"
              />
            </div>

            {/* Added Buyer and Seller filters for Sauda MIS */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                {filters.ledgerType === 'Buyer' ? 'Filter by Seller' : 'Filter by Buyer'}
              </label>
              <DataDropdown
                options={filters.ledgerType === 'Buyer' ? allSellers : allBuyers}
                selectedOptions={filters.ledgerType === 'Buyer' ? selectedSellerForSauda : selectedBuyerForSauda}
                onChange={(opt) => {
                  if (filters.ledgerType === 'Buyer') {
                    setSelectedSellerForSauda(opt);
                  } else {
                    setSelectedBuyerForSauda(opt);
                  }
                  setSelectedSauda(null);
                }}
                placeholder={filters.ledgerType === 'Buyer' ? "Select Seller..." : "Select Buyer..."}
                isMulti={false}
                isDisabled={!selectedLedger}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Sauda No
              </label>
              <DataDropdown
                options={saudas}
                selectedOptions={selectedSauda}
                onChange={setSelectedSauda}
                placeholder={(!selectedBuyerForSauda || !selectedSellerForSauda) ? "Pick Buyer & Seller" : "Select Sauda..."}
                isMulti={false}
                isDisabled={!selectedBuyerForSauda || !selectedSellerForSauda}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Period Selection
              </label>
              <DateRangeSelector
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(date) => {
                  setPage(1);
                  setFilters((prev) => ({ ...prev, startDate: date }));
                }}
                onEndDateChange={(date) => {
                  setPage(1);
                  setFilters((prev) => ({ ...prev, endDate: date }));
                }}
                onClear={() => {
                  setPage(1);
                  setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
                }}
                className="!h-11"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
          <div className="p-2">
            {loading || fetchingLorryWise ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {fetchingLorryWise ? "Syncing Lorry Data..." : "Generating Ledger..."}
                </p>
              </div>
            ) : selectedSauda ? (
              lorryWiseData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sl.No</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lorry No.</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No.</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Freight</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payment Date / Voucher</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount</th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lorryWiseData.map((lorry, idx) => (
                        <tr key={lorry._id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="px-4 py-4 text-xs font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-4 text-xs font-black text-slate-900 uppercase">
                            {lorry.lorryNumber}
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-500">
                            {lorry.billNumber || "NIL"}
                          </td>
                          <td className="px-4 py-4 text-xs font-black text-slate-700">
                            ₹ {lorry.totalFreight?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className="px-4 py-4">
                            {lorry.adjustments.length > 0 ? (
                              <div className="flex flex-col gap-1.5 items-center">
                                {lorry.adjustments.map((adj, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 p-1 rounded-lg shadow-sm w-full justify-between">
                                    <span className="text-[9px] font-medium text-slate-500">
                                      {formatDate(adj.paymentDate)}
                                    </span>
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                                      {adj.voucherNo}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs font-black text-emerald-600">
                            ₹ {lorry.totalAdjusted?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className={`px-4 py-4 text-xs font-black ${lorry.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            ₹ {lorry.balance?.toLocaleString("en-IN") || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                    <FaTruck size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">No Lorries Found</h4>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                    No loading entries found for Sauda {selectedSauda.label}.
                  </p>
                </div>
              )
            ) : payments.length > 0 ? (
              <Tables
                headers={columns.map((c) => c.header)}
                rows={payments.map((payment) =>
                  columns.map((col) => {
                    if (typeof col.accessor === "function") {
                      return col.accessor(payment);
                    }
                    return payment[col.accessor];
                  }),
                )}
              />
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                  <FaMoneyBillWave size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-800">
                  No Records Found
                </h4>
                <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                  No payment receipts match your current filters and date range.
                </p>
              </div>
            )}
          </div>

          {total > limit && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <Paginations
                currentPage={page}
                totalPages={Math.ceil(total / limit)}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
          </>
        ) : (
            <SaudaMISSection />
        )}
      </div>
    </AdminPageShell>
  );
};

export default ListPaymentReceived;
