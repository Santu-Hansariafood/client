import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminPageShell from '../../../common/AdminPageShell/AdminPageShell';
import DataDropdown from '../../../common/DataDropdown/DataDropdown';
import DataInput from '../../../common/DataInput/DataInput';
import DateSelector from '../../../common/DateSelector/DateSelector';
import Tables from '../../../common/Tables/Tables';
import api from '../../../utils/apiClient/apiClient';
import Loading from '../../../common/Loading/Loading';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { 
    FaSave, FaArrowLeft, FaMoneyBillWave, FaExchangeAlt, 
    FaHistory, FaCalendarAlt, FaBuilding, FaSearch, 
    FaCheckCircle, FaExclamationCircle, FaPrint, FaChartBar,
    FaArrowRight, FaCaretRight, FaFileInvoiceDollar
} from 'react-icons/fa';

const AddPaymentReceived = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);
    const [fetchingEntries, setFetchingEntries] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [entries, setEntries] = useState([]);
    const [entriesPage, setEntriesPage] = useState(1);
    const [entriesTotalPages, setEntriesTotalPages] = useState(1);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState([]);
    const [summaryType, setSummaryType] = useState('month');
    const [tableSearch, setTableSearch] = useState('');
    const [dateTotal, setDateTotal] = useState(0);
    const [ledgerBalance, setLedgerBalance] = useState({ advanceBalance: 0, outstandingBalance: 0 });
    const [activeTab, setActiveTab] = useState('allocation'); // allocation, history, summary
    const [allocationSource, setAllocationSource] = useState('fresh'); // fresh, advance

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        ledgerType: 'Buyer',
        ledgerId: '',
        amount: 0,
        paymentType: 'Sauda-wise',
        paymentMode: 'Bank',
        remarks: '',
        filterStartDate: '',
        filterEndDate: ''
    });

    const ledgerTypes = [
        { value: 'Buyer', label: 'Buyer' },
        { value: 'Seller', label: 'Seller' }
    ];

    const paymentModes = [
        { value: 'Bank', label: 'Bank Transfer' },
        { value: 'By Cash', label: 'Cash' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'TDS', label: 'TDS' },
        { value: 'GST', label: 'GST Adjustment' },
        { value: 'Loan', label: 'Loan' },
        { value: 'Adjustment', label: 'General Adjustment' }
    ];

    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                setFetchingLedgers(true);
                const endpoint = formData.ledgerType === 'Buyer' ? '/buyers' : '/sellers';
                const response = await api.get(endpoint);
                const data = response.data.data || response.data;
                setLedgers(data.map(item => ({
                    value: item._id,
                    label: item.name || item.sellerName,
                    companies: item.companyIds || []
                })));
                setSelectedLedger(null);
                setFormData(prev => ({ ...prev, ledgerId: '', mappings: [] }));
            } catch (error) {
                toast.error('Error fetching ledgers');
            } finally {
                setFetchingLedgers(false);
            }
        };
        fetchLedgers();
    }, [formData.ledgerType]);

    const fetchEntries = useCallback(async (page = 1) => {
        if (!formData.ledgerId || formData.paymentType !== 'Sauda-wise') {
            setEntries([]);
            return;
        }

        try {
            setFetchingEntries(true);
            let params = { 
                page: page,
                limit: 20, // Showing 20 entries per page
                startDate: formData.filterStartDate,
                endDate: formData.filterEndDate
            };
            
            if (formData.ledgerType === 'Seller') {
                params.supplier = formData.ledgerId;
            } else {
                params.buyerId = formData.ledgerId;
            }
            
            const response = await api.get('/loading-entries', { params });
            const items = response.data.data || [];
            
            // Client side sorting to be double sure: Pending first, then Done
            const sortedItems = [...items].sort((a, b) => {
                if (a.paymentStatus === 'pending' && b.paymentStatus === 'done') return -1;
                if (a.paymentStatus === 'done' && b.paymentStatus === 'pending') return 1;
                return new Date(b.loadingDate) - new Date(a.loadingDate);
            });

            setEntries(sortedItems.map(item => ({
                ...item,
                allocatedAmount: '',
                rowRemarks: '',
                isSaved: item.paymentStatus === 'done'
            })));
            setEntriesTotalPages(response.data.totalPages || 1);
            setEntriesPage(page);
        } catch (error) {
            toast.error('Error fetching entries');
        } finally {
            setFetchingEntries(false);
        }
    }, [formData.ledgerId, formData.ledgerType, formData.paymentType, formData.filterStartDate, formData.filterEndDate]);

    useEffect(() => {
        fetchEntries(1);
    }, [fetchEntries]);

    const fetchHistory = useCallback(async () => {
        if (!formData.ledgerId) {
            setHistory([]);
            return;
        }

        try {
            setFetchingHistory(true);
            const params = {
                ledgerId: formData.ledgerId,
                startDate: formData.date,
                endDate: formData.date
            };
            const response = await api.get('/payment-received', { params });
            setHistory(response.data.data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setFetchingHistory(false);
        }
    }, [formData.ledgerId, formData.date]);

    const fetchSummary = useCallback(async () => {
        if (!formData.ledgerId) return;
        try {
            const response = await api.get('/payment-received/summary', {
                params: { ledgerId: formData.ledgerId, type: summaryType }
            });
            setSummary(response.data || []);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [formData.ledgerId, summaryType]);

    // Fetch ledger balance
    const fetchLedgerBalance = useCallback(async () => {
        if (!formData.ledgerId) return;
        try {
            const response = await api.get(`/payment-received/balance/${formData.ledgerId}`);
            setLedgerBalance(response.data);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }, [formData.ledgerId]);

    useEffect(() => {
        fetchHistory();
        fetchSummary();
        fetchLedgerBalance();
    }, [fetchHistory, fetchSummary, fetchLedgerBalance]);

    // Fetch total received for the selected date
    const fetchDateTotal = useCallback(async () => {
        try {
            const selectedDate = formData.date;
            const response = await api.get('/payment-received', {
                params: {
                    startDate: selectedDate,
                    endDate: selectedDate,
                    limit: 1000
                }
            });
            const payments = response.data.data || [];
            const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            setDateTotal(total);
        } catch (error) {
            console.error('Error fetching date total:', error);
        }
    }, [formData.date]);

    useEffect(() => {
        fetchDateTotal();
    }, [fetchDateTotal]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLedgerChange = (option) => {
        setSelectedLedger(option);
        setFormData(prev => ({ ...prev, ledgerId: option?.value || '' }));
    };

    const handleAllocationChange = (entryId, amount, netAmount, paidAmount) => {
        if (amount === '') {
            setEntries(prev => prev.map(entry => 
                entry._id === entryId ? { ...entry, allocatedAmount: '' } : entry
            ));
            return;
        }

        const numAmount = parseFloat(amount) || 0;
        const dueAmount = netAmount - (paidAmount || 0);
        
        if (numAmount > dueAmount + 1) {
            toast.warning(`Allocation cannot exceed due amount (₹${dueAmount.toFixed(2)})`);
            return;
        }

        setEntries(prev => prev.map(entry => 
            entry._id === entryId ? { ...entry, allocatedAmount: amount } : entry
        ));
    };

    const handleRowRemarksChange = (entryId, remarks) => {
        setEntries(prev => prev.map(entry => 
            entry._id === entryId ? { ...entry, rowRemarks: remarks } : entry
        ));
    };

    const calculateTallyDetails = (entry) => {
        const weight = entry.unloadingWeight || 0;
        const rate = entry.actualRate || 0;
        const cdPercent = entry.cd || 0;
        const gstPercent = entry.gst || 0;

        const grossAmount = weight * rate;
        const cdAmount = grossAmount * (cdPercent / 100);
        const taxableAmount = grossAmount - cdAmount;
        const gstAmount = taxableAmount * (gstPercent / 100);
        const netAmount = taxableAmount + gstAmount;

        return {
            grossAmount,
            cdAmount,
            taxableAmount,
            gstAmount,
            netAmount,
            cdPercent,
            gstPercent,
            dueAmount: netAmount - (entry.paidAmount || 0)
        };
    };

    const handleSaveRow = async (entry) => {
        if (entry.allocatedAmount <= 0) {
            toast.error('Please enter an allocation amount');
            return;
        }

        if (allocationSource === 'advance' && entry.allocatedAmount > ledgerBalance.advanceBalance) {
            toast.error('Allocation exceeds available Advance Balance');
            return;
        }

        try {
            setLoading(true);
            const numAllocated = parseFloat(entry.allocatedAmount) || 0;
            const payload = {
                date: formData.date,
                ledgerType: formData.ledgerType,
                ledgerId: formData.ledgerId,
                amount: allocationSource === 'fresh' ? numAllocated : 0,
                paymentType: allocationSource === 'fresh' ? 'Sauda-wise' : 'Adjustment',
                paymentMode: allocationSource === 'fresh' ? formData.paymentMode : 'Adjustment',
                mappings: [{
                    saudaNo: entry.saudaNo,
                    loadingEntryId: entry._id,
                    allocatedAmount: numAllocated,
                    remarks: entry.rowRemarks
                }],
                remarks: entry.rowRemarks 
            };

            await api.post('/payment-received', payload);
            toast.success(`Payment adjusted for ${entry.lorryNumber}`);
            
            fetchEntries();
            fetchHistory();
            fetchDateTotal();
            fetchSummary();
            fetchLedgerBalance();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving payment');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordAdvance = async () => {
        if (formData.amount <= 0) {
            toast.error('Please enter an advance amount');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                paymentType: 'Advance',
                mappings: []
            };

            await api.post('/payment-received', payload);
            toast.success('Advance payment recorded');
            setFormData(prev => ({ ...prev, amount: 0, remarks: '' }));
            fetchHistory();
            fetchDateTotal();
            fetchLedgerBalance();
        } catch (error) {
            toast.error('Error recording advance');
        } finally {
            setLoading(false);
        }
    };

    const printVoucher = (payment) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text("PAYMENT VOUCHER", pageWidth / 2, 20, { align: "center" });
        
        doc.setDrawColor(200);
        doc.line(15, 25, pageWidth - 15, 25);
        
        // Details
        doc.setFontSize(10);
        doc.text(`Voucher No: ${payment._id.substring(payment._id.length - 8).toUpperCase()}`, 15, 35);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString('en-GB')}`, pageWidth - 15, 35, { align: "right" });
        
        doc.text(`Account: ${selectedLedger?.label || 'N/A'}`, 15, 45);
        doc.text(`Mode: ${payment.paymentMode}`, pageWidth - 15, 45, { align: "right" });
        
        // Table
        const tableData = (payment.mappings || []).map((m, i) => [
            i + 1,
            m.saudaNo || 'N/A',
            m.remarks || '-',
            `Rs. ${m.allocatedAmount.toLocaleString()}`
        ]);
        
        doc.autoTable({
            startY: 55,
            head: [['No', 'Sauda No', 'Particulars', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
            foot: [['', '', 'TOTAL', `Rs. ${payment.amount.toLocaleString()}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });
        
        const finalY = doc.lastAutoTable.finalY || 70;
        doc.text(`Amount in words: ${payment.amount.toLocaleString()} Rupees Only`, 15, finalY + 15);
        doc.text(`Remarks: ${payment.remarks || '-'}`, 15, finalY + 25);
        
        // Signatures
        doc.line(15, finalY + 60, 65, finalY + 60);
        doc.text("Receiver Signature", 15, finalY + 65);
        
        doc.line(pageWidth - 65, finalY + 60, pageWidth - 15, finalY + 60);
        doc.text("Authorised Signatory", pageWidth - 15, finalY + 65, { align: "right" });
        
        doc.save(`Voucher_${payment._id.substring(payment._id.length - 8)}.pdf`);
    };

    const filteredEntries = useMemo(() => {
        if (!tableSearch) return entries;
        const search = tableSearch.toLowerCase();
        return entries.filter(entry => 
            (entry.saudaNo || '').toLowerCase().includes(search) ||
            (entry.lorryNumber || '').toLowerCase().includes(search) ||
            (entry.buyerCompany || '').toLowerCase().includes(search) ||
            (entry.supplierCompany || '').toLowerCase().includes(search) ||
            (entry.commodity || '').toLowerCase().includes(search)
        );
    }, [entries, tableSearch]);

    const entryStats = useMemo(() => {
        let totalDue = 0;
        let pendingCount = 0;
        
        entries.forEach(entry => {
            const details = calculateTallyDetails(entry);
            totalDue += details.dueAmount;
            if (entry.paymentStatus === 'pending') {
                pendingCount++;
            }
        });

        return { totalDue, pendingCount };
    }, [entries]);

    const historyColumns = [
        { header: 'Time', accessor: (row) => new Date(row.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
        { header: 'Mode', accessor: 'paymentMode' },
        { header: 'Saudas', accessor: (row) => (row.mappings || []).map(m => m.saudaNo).join(', ') },
        { header: 'Amount', accessor: (row) => <span className="font-bold text-emerald-700">₹{row.amount.toLocaleString()}</span> },
        { header: 'Remarks', accessor: 'remarks' },
        { 
            header: 'Print', 
            accessor: (row) => (
                <button 
                    onClick={() => printVoucher(row)}
                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <FaPrint size={14} />
                </button>
            ) 
        }
    ];

    const columns = [
        { 
            header: 'Date & Sauda', 
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{new Date(row.loadingDate).toLocaleDateString('en-GB')}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{row.saudaNo}</span>
                </div>
            )
        },
        { 
            header: 'Lorry & Item', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-800 uppercase tracking-tighter text-sm">{row.lorryNumber}</span>
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-none">{row.commodity}</span>
                </div>
            )
        },
        { 
            header: 'Companies', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5 max-w-[150px]">
                    <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Buyer: {row.buyerCompany || 'N/A'}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Seller: {row.supplierCompany || 'N/A'}</span>
                </div>
            )
        },
        { 
            header: 'Tally Breakdown', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                return (
                    <div className="flex flex-col gap-0.5 text-[10px] font-medium min-w-[140px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Net Amount:</span>
                            <span className="font-bold">₹{details.netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                            <span>Paid:</span>
                            <span className="font-bold">₹{(row.paidAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-0.5 font-black text-rose-600 text-xs">
                            <span>Due:</span>
                            <span>₹{details.dueAmount.toFixed(2)}</span>
                        </div>
                    </div>
                );
            }
        },
        { 
            header: 'Allocation & Remarks', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                const isLocked = row.isSaved && user?.role !== 'Admin';

                return (
                    <div className="flex flex-col gap-2 min-w-[180px]">
                        <div className="relative">
                            <input
                                type="number"
                                value={row.allocatedAmount}
                                onChange={(e) => handleAllocationChange(row._id, e.target.value, details.netAmount, row.paidAmount)}
                                disabled={isLocked}
                                className={`w-full px-3 py-1.5 rounded-xl border ${
                                    isLocked ? 'bg-slate-50 text-slate-400 border-slate-100' : 'border-slate-200 bg-white'
                                } focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-bold text-slate-700 text-sm`}
                                placeholder="Amount"
                            />
                        </div>
                        <textarea
                            value={row.rowRemarks}
                            onChange={(e) => handleRowRemarksChange(row._id, e.target.value)}
                            disabled={isLocked}
                            rows={1}
                            className={`w-full px-3 py-1.5 rounded-xl border text-[11px] ${
                                isLocked ? 'bg-slate-50 text-slate-400 border-slate-100' : 'border-slate-200 bg-white'
                            } focus:ring-2 focus:ring-emerald-500/20 outline-none transition resize-none`}
                            placeholder="Add remarks..."
                        />
                    </div>
                );
            }
        },
        {
            header: 'Actions',
            accessor: (row) => {
                const isLocked = row.isSaved && user?.role !== 'Admin';
                return (
                    <button
                        type="button"
                        onClick={() => handleSaveRow(row)}
                        disabled={isLocked || loading}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm w-full ${
                            isLocked 
                                ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed' 
                                : 'bg-slate-900 text-white hover:bg-black active:scale-95'
                        }`}
                    >
                        {isLocked ? <FaCheckCircle size={12} /> : <FaSave size={12} />}
                        {isLocked ? 'Saved' : 'Save'}
                    </button>
                );
            }
        }
    ];

    return (
        <AdminPageShell
            title="Add Payment Received"
            subtitle="Record and allocate payments to pending sauda entries"
            icon={FaMoneyBillWave}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top Action Bar & Stats */}
                <div className="flex flex-col gap-6">
                    {/* Action Bar */}
                    <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase tracking-widest text-[10px] transition-colors"
                            >
                                <FaArrowLeft />
                                Back
                            </button>
                            <div className="hidden sm:block h-6 w-px bg-slate-100"></div>
                            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl overflow-x-auto no-scrollbar">
                                {['allocation', 'history', 'summary'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeTab === tab 
                                                ? 'bg-slate-900 text-white shadow-md' 
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Payment Received Inputs at Top */}
                            <div className="flex flex-wrap items-center gap-4 bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100 w-full sm:w-auto">
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none pl-1">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full sm:w-24 h-9 px-3 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-black text-emerald-700 text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none pl-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full sm:w-32 h-9 px-2 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-bold text-slate-700 text-[10px]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none pl-1">Through</label>
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleInputChange}
                                        className="w-full sm:w-32 h-9 px-2 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-bold text-slate-700 text-[10px] appearance-none cursor-pointer"
                                    >
                                        {paymentModes.map(mode => (
                                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-[1.5rem] shadow-xl shadow-slate-200 relative overflow-hidden group border border-slate-800">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Received (Date)</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-2xl font-black text-white italic tracking-tighter">₹{dateTotal.toLocaleString('en-IN')}</p>
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 backdrop-blur-md border border-white/10 shadow-inner">
                                        <FaMoneyBillWave size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-3">Total Due Payment</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-2xl font-black text-rose-600 italic tracking-tighter">₹{entryStats.totalDue.toLocaleString('en-IN')}</p>
                                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                                        <FaExclamationCircle size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">Advance Balance</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-2xl font-black text-emerald-600 italic tracking-tighter">₹{ledgerBalance.advanceBalance.toLocaleString('en-IN')}</p>
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                        <FaHistory size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-500/5 rounded-full blur-2xl group-hover:bg-slate-500/10 transition-all"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Pending Records</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-2xl font-black text-slate-800 italic tracking-tighter">{entryStats.pendingCount}</p>
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                                        <FaBuilding size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Card */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                <FaExchangeAlt size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tally Voucher Setup</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Configure ledger & allocation rules</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                            {[
                                { id: 'fresh', label: 'Fresh Payment', icon: <FaMoneyBillWave size={10}/> },
                                { id: 'advance', label: 'Adjust from Advance', icon: <FaHistory size={10}/> }
                            ].map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => setAllocationSource(source.id)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                        allocationSource === source.id 
                                            ? 'bg-white text-slate-900 shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {source.icon}
                                    {source.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Type</label>
                            <DataDropdown
                                options={ledgerTypes}
                                selectedOptions={formData.ledgerType}
                                onChange={(opt) => setFormData(prev => ({ ...prev, ledgerType: opt.value }))}
                                isMulti={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Ledger Account</label>
                            <DataDropdown
                                options={ledgers}
                                selectedOptions={selectedLedger}
                                onChange={handleLedgerChange}
                                placeholder={fetchingLedgers ? "Syncing..." : `Select ${formData.ledgerType}`}
                                isMulti={false}
                                isDisabled={fetchingLedgers}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voucher Narration / Remarks</label>
                            <input
                                type="text"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                placeholder="Enter narration for this voucher..."
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition text-sm font-medium text-slate-700"
                            />
                        </div>
                        {allocationSource === 'fresh' && (
                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleRecordAdvance}
                                    disabled={loading || !selectedLedger || formData.amount <= 0}
                                    className="h-11 px-6 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                >
                                    Record Advance (₹{formData.amount})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'allocation' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-8 py-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors ${allocationSource === 'fresh' ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                                    {allocationSource === 'fresh' ? <FaBuilding size={14} /> : <FaExchangeAlt size={14} />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        {allocationSource === 'fresh' ? 'Allocation Ledger' : 'Advance Adjustment Ledger'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                        {allocationSource === 'fresh' ? 'Map fresh payments to saudas' : `Using ₹${ledgerBalance.advanceBalance.toLocaleString()} from Advance Account`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {/* Date Range Filters */}
                                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                    <div className="flex flex-col px-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none">From</span>
                                        <input
                                            type="date"
                                            value={formData.filterStartDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterStartDate: e.target.value }))}
                                            className="text-[10px] font-bold text-slate-600 outline-none h-6"
                                        />
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="flex flex-col px-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none">To</span>
                                        <input
                                            type="date"
                                            value={formData.filterEndDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterEndDate: e.target.value }))}
                                            className="text-[10px] font-bold text-slate-600 outline-none h-6"
                                        />
                                    </div>
                                    {(formData.filterStartDate || formData.filterEndDate) && (
                                        <button 
                                            onClick={() => setFormData(prev => ({ ...prev, filterStartDate: '', filterEndDate: '' }))}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <FaArrowLeft size={10} />
                                        </button>
                                    )}
                                </div>

                                <div className="relative w-full md:w-64">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-3" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH..."
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-2">
                            {fetchingEntries ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Pending...</p>
                                </div>
                            ) : filteredEntries.length > 0 ? (
                                <>
                                    <Tables
                                        headers={columns.map(c => c.header)}
                                        rows={filteredEntries.map(entry => columns.map(col => {
                                            if (typeof col.accessor === 'function') {
                                                return col.accessor(entry);
                                            }
                                            return entry[col.accessor];
                                        }))}
                                    />
                                    
                                    {/* Pagination Controls */}
                                    {entriesTotalPages > 1 && (
                                        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Page {entriesPage} of {entriesTotalPages}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => fetchEntries(entriesPage - 1)}
                                                    disabled={entriesPage === 1 || fetchingEntries}
                                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <FaArrowLeft size={10} />
                                                </button>
                                                
                                                {[...Array(entriesTotalPages)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    // Show first, last, and pages around current
                                                    if (
                                                        pageNum === 1 || 
                                                        pageNum === entriesTotalPages || 
                                                        (pageNum >= entriesPage - 1 && pageNum <= entriesPage + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => fetchEntries(pageNum)}
                                                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                                                    entriesPage === pageNum 
                                                                        ? 'bg-slate-900 text-white shadow-md' 
                                                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    } else if (
                                                        pageNum === entriesPage - 2 || 
                                                        pageNum === entriesPage + 2
                                                    ) {
                                                        return <span key={pageNum} className="text-slate-300">...</span>;
                                                    }
                                                    return null;
                                                })}

                                                <button
                                                    onClick={() => fetchEntries(entriesPage + 1)}
                                                    disabled={entriesPage === entriesTotalPages || fetchingEntries}
                                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <FaArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                        <FaHistory size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Pending Records</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto">
                                        All entries are fully settled for this account.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                <FaHistory size={14} />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Previous Payments (On {new Date(formData.date).toLocaleDateString()})</h3>
                        </div>
                        <div className="p-2">
                            {fetchingHistory ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading History...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <Tables
                                    headers={historyColumns.map(c => c.header)}
                                    rows={history.map(row => historyColumns.map(col => {
                                        if (typeof col.accessor === 'function') {
                                            return col.accessor(row);
                                        }
                                        return row[col.accessor];
                                    }))}
                                />
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                        <FaExclamationCircle size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Previous Payments</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto">
                                        No payments were recorded for this ledger on the selected date.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                                    <FaChartBar size={14} />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Periodic Summary</h3>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                {['month', 'week'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSummaryType(type)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            summaryType === type 
                                                ? 'bg-white text-slate-900 shadow-sm' 
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {type}ly
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-8">
                            {summary.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {summary.map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                    <FaFileInvoiceDollar size={18} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item._id.year}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                {summaryType === 'month' ? `Month ${item._id.period}` : `Week ${item._id.period}`}
                                            </p>
                                            <p className="text-2xl font-black text-slate-800 italic">₹{item.totalAmount.toLocaleString()}</p>
                                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                {item.count} Transactions
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                        <FaChartBar size={32} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">No Summary Available</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select a ledger to view analytical summaries.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminPageShell>
    );
};

export default AddPaymentReceived;
