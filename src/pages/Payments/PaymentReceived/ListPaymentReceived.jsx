import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminPageShell from '../../../common/AdminPageShell/AdminPageShell';
import Tables from '../../../common/Tables/Tables';
import DataDropdown from '../../../common/DataDropdown/DataDropdown';
import api from '../../../utils/apiClient/apiClient';
import { 
    FaPlus, FaMoneyBillWave, FaFilter, FaCalendarAlt, 
    FaPrint, FaChartLine, FaCheckCircle, FaExclamationCircle, FaBuilding 
} from 'react-icons/fa';
import Paginations from '../../../common/Paginations/Paginations';
import logoImg from '../../../assets/Hans.png';

const StatCard = ({ icon, label, value, subValue, color, iconColor }) => (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all duration-300`}>
        <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${color} ${iconColor}`}>
                {icon}
            </div>
            {subValue && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight italic">{value}</p>
        </div>
    </div>
);

const ListPaymentReceived = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);

    const [filters, setFilters] = useState({
        ledgerType: '',
        ledgerId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchLedgers = useCallback(async () => {
        if (!filters.ledgerType) {
            setLedgers([]);
            return;
        }
        try {
            setFetchingLedgers(true);
            const endpoint = filters.ledgerType === 'Buyer' ? '/buyers' : '/sellers';
            const response = await api.get(endpoint);
            const data = response.data.data || response.data;
            setLedgers(data.map(item => ({
                value: item._id,
                label: item.name || item.sellerName
            })));
        } catch (error) {
            toast.error('Error fetching ledgers');
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
            const response = await api.get('/payment-received', {
                params: {
                    ...filters,
                    page,
                    limit
                }
            });
            setPayments(response.data.data || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            toast.error('Error fetching payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [page, filters]);

    const stats = useMemo(() => {
        const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const count = payments.length;
        return { totalReceived, count };
    }, [payments]);

    const handlePrintReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // --- Tally Style Header ---
        // Logo
        const img = new Image();
        img.src = logoImg;
        doc.addImage(img, 'PNG', 15, 10, 25, 25);
        
        // Company Name (Centered)
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Registered Office: Hansaria Food, MIS REPORT", pageWidth / 2, 26, { align: "center" });
        
        doc.setDrawColor(40);
        doc.setLineWidth(0.5);
        doc.line(15, 38, pageWidth - 15, 38);
        
        // MIS Report Subtitle
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const reportTitle = selectedLedger 
            ? `PAYMENT LEDGER: ${selectedLedger.label.toUpperCase()}`
            : "CONSOLIDATED PAYMENT RECEIVED REPORT";
        doc.text(reportTitle, 15, 48);
        
        // Date Range
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const dateRange = `Period: ${new Date(filters.startDate).toLocaleDateString('en-GB')} to ${new Date(filters.endDate).toLocaleDateString('en-GB')}`;
        doc.text(dateRange, pageWidth - 15, 48, { align: "right" });
        
        // Table Data
        const tableData = payments.map((p, idx) => [
            idx + 1,
            new Date(p.date).toLocaleDateString('en-GB'),
            p.ledgerId?.name || p.ledgerId?.sellerName || 'N/A',
            p.paymentMode,
            p.paymentType,
            p.mappings?.length || 0,
            `Rs. ${p.amount.toLocaleString()}`
        ]);
        
        doc.autoTable({
            startY: 55,
            head: [['S.No', 'Date', 'Ledger/Party Name', 'Mode', 'Type', 'Entries', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                6: { halign: 'right', fontStyle: 'bold' }
            },
            foot: [['', '', '', '', '', 'TOTAL RECEIVED', `Rs. ${stats.totalReceived.toLocaleString()}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 }
        });
        
        const finalY = doc.lastAutoTable.finalY || 80;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, finalY + 15);
        doc.text("Authorized Signatory", pageWidth - 15, finalY + 15, { align: "right" });
        
        doc.save(`MIS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const columns = [
        { 
            header: 'Date', 
            accessor: (row) => new Date(row.date).toLocaleDateString(),
            className: "font-semibold text-slate-700"
        },
        { 
            header: 'Ledger', 
            accessor: (row) => (
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{row.ledgerType}</span>
                    <span className="font-bold text-slate-800">{row.ledgerId?.name || row.ledgerId?.sellerName || 'N/A'}</span>
                </div>
            )
        },
        { 
            header: 'Amount', 
            accessor: (row) => (
                <span className="font-black text-emerald-600 italic tracking-tight">₹{row.amount.toLocaleString()}</span>
            )
        },
        { 
            header: 'Mode', 
            accessor: (row) => (
                <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                    {row.paymentMode}
                </span>
            )
        },
        { 
            header: 'Type', 
            accessor: (row) => (
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    row.paymentType === 'Sauda-wise' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                    {row.paymentType}
                </span>
            )
        },
        { 
            header: 'Mappings', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-slate-900">{row.mappings?.length || 0} Entries</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Settled Records</span>
                </div>
            )
        },
        { 
            header: 'Remarks', 
            accessor: 'remarks',
            className: "max-w-[200px] truncate italic text-slate-400 text-xs font-medium"
        }
    ];

    return (
        <AdminPageShell
            title="Payment Ledger MIS"
            subtitle="Analyze and print company-wise collection reports"
            icon={FaMoneyBillWave}
        >
            <div className="space-y-6">
                {/* MIS Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        icon={<FaChartLine size={18} />}
                        label="Total Received"
                        value={`₹${stats.totalReceived.toLocaleString('en-IN')}`}
                        subValue="In Selected Period"
                        color="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    <StatCard
                        icon={<FaMoneyBillWave size={18} />}
                        label="Transaction Count"
                        value={stats.count.toString()}
                        subValue="Vouchers"
                        color="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        icon={<FaBuilding size={18} />}
                        label="Active Filter"
                        value={selectedLedger?.label || filters.ledgerType || "Consolidated"}
                        subValue="Ledger Scope"
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
                                <h4 className="font-bold text-slate-800">Filter Configuration</h4>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Define report scope and dates</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handlePrintReport}
                                disabled={loading || payments.length === 0}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg disabled:opacity-50"
                            >
                                <FaPrint size={14} /> Print MIS Report
                            </button>
                            <button
                                onClick={() => navigate('/payments/received/add')}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg"
                            >
                                <FaPlus size={14} /> Record Payment
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Ledger Type</label>
                            <select
                                value={filters.ledgerType}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, ledgerType: e.target.value, ledgerId: '' }));
                                    setSelectedLedger(null);
                                }}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
                            >
                                <option value="">Consolidated</option>
                                <option value="Buyer">Buyer Ledger</option>
                                <option value="Seller">Seller Ledger</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Name</label>
                            <DataDropdown
                                options={ledgers}
                                selectedOptions={selectedLedger}
                                onChange={(opt) => {
                                    setSelectedLedger(opt);
                                    setFilters(prev => ({ ...prev, ledgerId: opt?.value || '' }));
                                }}
                                placeholder={fetchingLedgers ? "Syncing..." : "Search Account..."}
                                isMulti={false}
                                isDisabled={!filters.ledgerType}
                                className="rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">From Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">To Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                    <div className="p-2">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Generating Ledger...</p>
                            </div>
                        ) : payments.length > 0 ? (
                            <Tables
                                headers={columns.map(c => c.header)}
                                rows={payments.map(payment => columns.map(col => {
                                    if (typeof col.accessor === 'function') {
                                        return col.accessor(payment);
                                    }
                                    return payment[col.accessor];
                                }))}
                            />
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                    <FaMoneyBillWave size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800">No Records Found</h4>
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
            </div>
        </AdminPageShell>
    );
};

export default ListPaymentReceived;
