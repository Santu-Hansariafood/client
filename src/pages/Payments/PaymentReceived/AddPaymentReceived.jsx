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
                allocatedAmount: item.paymentStatus === 'done' ? item.paidAmount : '',
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
            const params = {
                startDate: selectedDate,
                endDate: selectedDate,
                limit: 1000
            };
            
            // Filter by ledger if selected
            if (formData.ledgerId) {
                params.ledgerId = formData.ledgerId;
            }

            const response = await api.get('/payment-received', { params });
            const payments = response.data.data || [];
            const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            setDateTotal(total);
        } catch (error) {
            console.error('Error fetching date total:', error);
        }
    }, [formData.date, formData.ledgerId]);

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
        if (entry.allocatedAmount === '' && !entry.isSaved) {
            toast.error('Please enter an allocation amount');
            return;
        }

        const isAdmin = user?.role === 'Admin';
        const isEditing = entry.isSaved && isAdmin;

        if (allocationSource === 'advance' && entry.allocatedAmount > ledgerBalance.advanceBalance) {
            toast.error('Allocation exceeds available Advance Balance');
            return;
        }

        try {
            setLoading(true);
            const numAllocated = parseFloat(entry.allocatedAmount) || 0;

            if (isEditing) {
                // Admin Edit: Use the special adjustment API
                // We assume the admin is setting the TOTAL paid amount for this lorry
                await api.patch(`/payment-received/adjust-lorry/${entry._id}`, {
                    paidAmount: numAllocated,
                    paymentStatus: numAllocated >= (calculateTallyDetails(entry).netAmount - 1) ? 'done' : 'pending'
                });
                toast.success(`Payment adjusted for ${entry.lorryNumber}`);
            } else {
                // Normal Save: Create a new payment record (adds to existing paidAmount)
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
                toast.success(`Payment recorded for ${entry.lorryNumber}`);
            }
            
            fetchEntries(entriesPage);
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
        { header: 'TIME', accessor: (row) => <span className="text-[10px] font-black">{new Date(row.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> },
        { header: 'MODE', accessor: (row) => <span className="text-[10px] font-black uppercase text-slate-500">{row.paymentMode}</span> },
        { header: 'PARTICULARS (SAUDAS)', accessor: (row) => <span className="text-[10px] font-bold text-slate-600">{(row.mappings || []).map(m => m.saudaNo).join(', ') || 'Advance'}</span> },
        { header: 'AMOUNT', accessor: (row) => <span className="font-black text-slate-900 text-sm italic">₹{row.amount.toLocaleString()}</span> },
        { header: 'REMARKS', accessor: (row) => <span className="text-[10px] text-slate-400 font-medium italic">{row.remarks || '-'}</span> },
        { 
            header: 'PRINT', 
            accessor: (row) => (
                <button 
                    onClick={() => printVoucher(row)}
                    className="p-1.5 border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                >
                    <FaPrint size={12} />
                </button>
            ) 
        }
    ];

    const columns = [
        { 
            header: 'DATE & SAUDA', 
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-xs">{new Date(row.loadingDate).toLocaleDateString('en-GB')}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{row.saudaNo}</span>
                </div>
            )
        },
        { 
            header: 'LORRY & ITEM', 
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 uppercase tracking-tighter text-xs">{row.lorryNumber}</span>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">{row.commodity}</span>
                </div>
            )
        },
        { 
            header: 'PARTIES', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5 max-w-[150px]">
                    <span className="text-[9px] font-black uppercase text-slate-400 leading-none">B: {row.buyerCompany || 'N/A'}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400 leading-none">S: {row.supplierCompany || 'N/A'}</span>
                </div>
            )
        },
        { 
            header: 'BREAKDOWN', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                return (
                    <div className="flex flex-col gap-0.5 text-[9px] font-black min-w-[140px] uppercase">
                        <div className="flex justify-between text-slate-400">
                            <span>Net Amount:</span>
                            <span>₹{details.netAmount.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Paid:</span>
                            <span>₹{(row.paidAmount || 0).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-900 mt-0.5 pt-0.5 text-rose-600 text-[10px]">
                            <span>Due:</span>
                            <span>₹{details.dueAmount.toFixed(0)}</span>
                        </div>
                    </div>
                );
            }
        },
        { 
            header: 'ALLOCATION', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                const isLocked = row.isSaved && user?.role !== 'Admin';

                return (
                    <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <div className="relative group">
                            <input
                                type="number"
                                value={row.allocatedAmount}
                                onChange={(e) => handleAllocationChange(row._id, e.target.value, details.netAmount, row.paidAmount)}
                                onWheel={(e) => e.target.blur()}
                                disabled={isLocked}
                                className={`w-full px-2 py-1.5 border ${
                                    isLocked ? 'bg-slate-50 text-slate-400 border-slate-200' : 'border-slate-900 bg-white focus:bg-yellow-50'
                                } outline-none transition font-black text-slate-900 text-xs`}
                                placeholder="0.00"
                            />
                            {!isLocked && (
                                <button
                                    onClick={() => handleAllocationChange(row._id, details.dueAmount.toString(), details.netAmount, row.paidAmount)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-900 px-1 py-0.5 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    Full
                                </button>
                            )}
                        </div>
                        <textarea
                            value={row.rowRemarks}
                            onChange={(e) => handleRowRemarksChange(row._id, e.target.value)}
                            disabled={isLocked}
                            rows={1}
                            className={`w-full px-2 py-1 border text-[10px] font-bold ${
                                isLocked ? 'bg-slate-50 text-slate-400 border-slate-200' : 'border-slate-900 bg-white focus:bg-yellow-50'
                            } outline-none transition resize-none uppercase`}
                            placeholder="Narration..."
                        />
                    </div>
                );
            }
        },
        {
            header: 'ACTION',
            accessor: (row) => {
                const isLocked = row.isSaved && user?.role !== 'Admin';
                const isAdmin = user?.role === 'Admin';
                
                return (
                    <div className="flex flex-col gap-1 w-full">
                        <button
                            type="button"
                            onClick={() => handleSaveRow(row)}
                            disabled={(isLocked && !isAdmin) || loading}
                            className={`px-3 py-2 border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all w-full ${
                                isLocked && !isAdmin
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                                    : isAdmin && row.isSaved
                                        ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                        : 'bg-slate-900 text-white border-slate-900 hover:bg-black'
                            }`}
                        >
                            {isLocked && !isAdmin ? <FaCheckCircle size={10} /> : (isAdmin && row.isSaved ? <FaExchangeAlt size={10} /> : <FaSave size={10} />)}
                            {isLocked && !isAdmin ? 'Locked' : (isAdmin && row.isSaved ? 'Adjust' : 'Save')}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <AdminPageShell
            title="Payment Voucher"
            subtitle="Record and allocate payments in Tally-style ledger format"
            icon={FaFileInvoiceDollar}
        >
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Top Action Bar & Stats */}
                <div className="flex flex-col gap-4">
                    {/* Action Bar */}
                    <div className="bg-white px-4 py-3 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-900 hover:bg-slate-100 px-3 py-1.5 border border-slate-900 font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                <FaArrowLeft />
                                Esc - Back
                            </button>
                            <div className="flex gap-1 bg-slate-100 p-1 border border-slate-200">
                                {['allocation', 'history', 'summary'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeTab === tab 
                                                ? 'bg-slate-900 text-white shadow-sm' 
                                                : 'text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Payment Received Inputs at Top */}
                            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 border border-slate-900 w-full sm:w-auto">
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none pl-1">Voucher Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="0.00"
                                        className="w-full sm:w-28 h-8 px-3 border border-slate-900 bg-white focus:bg-yellow-50 outline-none transition font-black text-slate-900 text-xs"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none pl-1">Voucher Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full sm:w-36 h-8 px-2 border border-slate-900 bg-white focus:bg-yellow-50 outline-none transition font-bold text-slate-900 text-[11px]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                                    <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none pl-1">Through (Mode)</label>
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleInputChange}
                                        className="w-full sm:w-36 h-8 px-2 border border-slate-900 bg-white focus:bg-yellow-50 outline-none transition font-bold text-slate-900 text-[11px] appearance-none cursor-pointer"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-900 p-4 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                                {selectedLedger ? `${selectedLedger.label} RECEIVED (DATE)` : 'TOTAL RECEIVED (DATE)'}
                            </p>
                            <div className="flex items-end justify-between">
                                <p className="text-xl font-black text-white tracking-tighter italic">₹{dateTotal.toLocaleString('en-IN')}</p>
                                <FaMoneyBillWave className="text-slate-600 group-hover:text-slate-900 transition-colors" size={16} />
                            </div>
                        </div>

                        {selectedLedger && (
                            <div className="bg-white p-4 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                    {formData.ledgerType === 'Seller' ? 'Seller Due (All Time)' : 'Buyer Due (All Time)'}
                                </p>
                                <div className="flex items-end justify-between">
                                    <p className="text-xl font-black text-rose-600 tracking-tighter italic">₹{ledgerBalance.outstandingBalance.toLocaleString('en-IN')}</p>
                                    <FaExclamationCircle className="text-slate-200 group-hover:text-rose-400 transition-colors" size={16} />
                                </div>
                            </div>
                        )}

                        {selectedLedger && (
                            <div className="bg-white p-4 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Advance Balance</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">₹{ledgerBalance.advanceBalance.toLocaleString('en-IN')}</p>
                                    <FaHistory className="text-slate-200 group-hover:text-slate-900 transition-colors" size={16} />
                                </div>
                            </div>
                        )}

                        {selectedLedger && (
                            <div className="bg-white p-4 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Pending Records</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">{entryStats.pendingCount}</p>
                                    <FaBuilding className="text-slate-200 group-hover:text-slate-400 transition-colors" size={16} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Configuration Card */}
                <div className="bg-white border-2 border-slate-900 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                <FaExchangeAlt size={14} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Account Selection</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Configure ledger & allocation rules</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 border border-slate-200">
                            {[
                                { id: 'fresh', label: 'Fresh Payment' },
                                { id: 'advance', label: 'From Advance' }
                            ].map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => setAllocationSource(source.id)}
                                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                                        allocationSource === source.id 
                                            ? 'bg-slate-900 text-white shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-900'
                                    }`}
                                >
                                    {source.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ledger Type</label>
                            <DataDropdown
                                options={ledgerTypes}
                                selectedOptions={formData.ledgerType}
                                onChange={(opt) => setFormData(prev => ({ ...prev, ledgerType: opt.value }))}
                                isMulti={false}
                                className="h-9 text-xs border-slate-900"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Select Ledger Account</label>
                            <DataDropdown
                                options={ledgers}
                                selectedOptions={selectedLedger}
                                onChange={handleLedgerChange}
                                placeholder={fetchingLedgers ? "Syncing..." : `Select ${formData.ledgerType}`}
                                isMulti={false}
                                isDisabled={fetchingLedgers}
                                className="h-9 text-xs border-slate-900"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1 w-full">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Voucher Narration / Remarks</label>
                            <input
                                type="text"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                placeholder="Enter narration for this voucher..."
                                className="w-full h-9 px-3 border border-slate-900 bg-white focus:bg-yellow-50 outline-none transition text-xs font-bold text-slate-900"
                            />
                        </div>
                        {allocationSource === 'fresh' && (
                            <button
                                onClick={handleRecordAdvance}
                                disabled={loading || !selectedLedger || formData.amount <= 0}
                                className="h-9 px-6 bg-slate-900 text-white border border-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                Record Advance (₹{formData.amount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'allocation' && (
                    <div className="bg-white border-2 border-slate-900 overflow-hidden flex flex-col min-h-[400px]">
                        <div className="px-6 py-4 border-b border-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 flex items-center justify-center text-white transition-colors ${allocationSource === 'fresh' ? 'bg-slate-900' : 'bg-slate-700'}`}>
                                    {allocationSource === 'fresh' ? <FaBuilding size={14} /> : <FaExchangeAlt size={14} />}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                        {allocationSource === 'fresh' ? 'Allocation Ledger' : 'Advance Adjustment Ledger'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                        {allocationSource === 'fresh' ? 'Map fresh payments to saudas' : `Using ₹${ledgerBalance.advanceBalance.toLocaleString()} from Advance Account`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {/* Date Range Filters */}
                                <div className="flex items-center gap-2 bg-white p-1 border border-slate-900">
                                    <div className="flex flex-col px-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none">From</span>
                                        <input
                                            type="date"
                                            value={formData.filterStartDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterStartDate: e.target.value }))}
                                            className="text-[10px] font-bold text-slate-900 outline-none h-6 bg-transparent"
                                        />
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="flex flex-col px-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none">To</span>
                                        <input
                                            type="date"
                                            value={formData.filterEndDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterEndDate: e.target.value }))}
                                            className="text-[10px] font-bold text-slate-900 outline-none h-6 bg-transparent"
                                        />
                                    </div>
                                    {(formData.filterStartDate || formData.filterEndDate) && (
                                        <button 
                                            onClick={() => setFormData(prev => ({ ...prev, filterStartDate: '', filterEndDate: '' }))}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <FaArrowLeft size={10} />
                                        </button>
                                    )}
                                </div>

                                <div className="relative w-full md:w-64">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH SAUDA / LORRY..."
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-900 bg-white text-[10px] font-black uppercase tracking-widest focus:bg-yellow-50 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-0">
                            {fetchingEntries ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Pending...</p>
                                </div>
                            ) : filteredEntries.length > 0 ? (
                                <>
                                    <div className="border-b border-slate-900">
                                        <Tables
                                            headers={columns.map(c => c.header)}
                                            rows={filteredEntries.map(entry => columns.map(col => {
                                                if (typeof col.accessor === 'function') {
                                                    return col.accessor(entry);
                                                }
                                                return entry[col.accessor];
                                            }))}
                                        />
                                    </div>
                                    
                                    {/* Pagination Controls */}
                                    {entriesTotalPages > 1 && (
                                        <div className="px-6 py-3 border-b border-slate-900 flex items-center justify-between bg-slate-50">
                                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                Page {entriesPage} of {entriesTotalPages}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => fetchEntries(entriesPage - 1)}
                                                    disabled={entriesPage === 1 || fetchingEntries}
                                                    className="px-3 py-1.5 border border-slate-900 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase"
                                                >
                                                    Prev
                                                </button>
                                                
                                                <div className="flex gap-1 mx-2">
                                                    {[...Array(entriesTotalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        if (
                                                            pageNum === 1 || 
                                                            pageNum === entriesTotalPages || 
                                                            (pageNum >= entriesPage - 1 && pageNum <= entriesPage + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => fetchEntries(pageNum)}
                                                                    className={`w-7 h-7 border border-slate-900 text-[10px] font-black transition-all ${
                                                                        entriesPage === pageNum 
                                                                            ? 'bg-slate-900 text-white' 
                                                                            : 'bg-white text-slate-900 hover:bg-slate-100'
                                                                    }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        } else if (
                                                            pageNum === entriesPage - 2 || 
                                                            pageNum === entriesPage + 2
                                                        ) {
                                                            return <span key={pageNum} className="text-slate-400 px-1">.</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => fetchEntries(entriesPage + 1)}
                                                    disabled={entriesPage === entriesTotalPages || fetchingEntries}
                                                    className="px-3 py-1.5 border border-slate-900 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-black uppercase"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-slate-900 px-8 py-3 flex items-center justify-between border-t-2 border-slate-900">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">List Total Due</p>
                                                <p className="text-lg font-black text-white tracking-tighter">₹{entryStats.totalDue.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-700"></div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Date Received ({new Date(formData.date).toLocaleDateString()})</p>
                                                <p className="text-lg font-black text-white tracking-tighter">₹{dateTotal.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="flex flex-col items-end">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entries</p>
                                                <p className="text-lg font-black text-white">{entries.length}</p>
                                            </div>
                                            <div className="flex flex-col items-end border-l border-slate-700 pl-8">
                                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Pending Count</p>
                                                <p className="text-lg font-black text-white">{entryStats.pendingCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-12 h-12 border-2 border-slate-200 flex items-center justify-center text-slate-300 mb-4">
                                        <FaHistory size={24} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">No Pending Records Found</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto">
                                        All entries are fully settled for this account.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white border-2 border-slate-900 overflow-hidden min-h-[400px]">
                        <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                    <FaHistory size={14} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Voucher History (On {new Date(formData.date).toLocaleDateString()})</h3>
                            </div>
                        </div>
                        <div className="p-0">
                            {fetchingHistory ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
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
                                    <div className="w-12 h-12 border-2 border-slate-200 flex items-center justify-center text-slate-300 mb-4">
                                        <FaHistory size={24} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">No Previous Payments</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto">
                                        No payments were recorded for this ledger on the selected date.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="bg-white border-2 border-slate-900 overflow-hidden min-h-[400px]">
                        <div className="px-6 py-4 border-b border-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                    <FaChartBar size={14} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Periodic Summary</h3>
                            </div>
                            <div className="flex bg-white border border-slate-900 p-0.5">
                                {['month', 'week'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSummaryType(type)}
                                        className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                                            summaryType === type 
                                                ? 'bg-slate-900 text-white' 
                                                : 'text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        {type}ly
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50/50">
                            {summary.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {summary.map((item, idx) => (
                                        <div key={idx} className="bg-white border-2 border-slate-900 p-5 group hover:bg-yellow-50 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white">
                                                    <FaFileInvoiceDollar size={14} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item._id.year}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                {summaryType === 'month' ? `Month ${item._id.period}` : `Week ${item._id.period}`}
                                            </p>
                                            <p className="text-xl font-black text-slate-900 italic">₹{item.totalAmount.toLocaleString()}</p>
                                            <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase border-t border-slate-100 pt-3">
                                                {item.count} Transactions
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 border-2 border-slate-200 flex items-center justify-center text-slate-300 mb-4">
                                        <FaChartBar size={24} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">No Summary Available</h4>
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
