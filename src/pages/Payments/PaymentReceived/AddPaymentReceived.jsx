import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminPageShell from '../../../common/AdminPageShell/AdminPageShell';
import DataDropdown from '../../../common/DataDropdown/DataDropdown';
import Tables from '../../../common/Tables/Tables';
import Buttons from '../../../common/Buttons/Buttons';
import SearchBox from '../../../common/SearchBox/SearchBox';
import Paginations from '../../../common/Paginations/Paginations';
import api from '../../../utils/apiClient/apiClient';
import Loading from '../../../common/Loading/Loading';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { 
    FaSave, FaArrowLeft, FaMoneyBillWave, FaExchangeAlt, 
    FaHistory, FaCalendarAlt, FaBuilding, FaSearch, 
    FaCheckCircle, FaExclamationCircle, FaPrint, FaChartBar,
    FaArrowRight, FaCaretRight, FaFileInvoiceDollar, FaFilter,
    FaRegCalendarAlt, FaWallet, FaChartLine, FaPlus, FaTrash
} from 'react-icons/fa';


const StatCard = ({ icon, label, value, subValue, color, iconColor, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
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

const TabButton = ({ active, label, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group ${
            active 
                ? 'text-slate-900' 
                : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        <Icon size={14} className={active ? 'text-slate-900' : 'text-slate-400'} />
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full" />
        )}
        {!active && (
            <div className="absolute bottom-0 left-0 w-0 h-1 bg-slate-200 group-hover:w-full transition-all duration-300" />
        )}
    </button>
);

const AddPaymentReceived = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);
    const [fetchingEntries, setFetchingEntries] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [allCompanies, setAllCompanies] = useState([]);
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
        companyId: '',
        amount: 0,
        paymentType: 'Sauda-wise',
        paymentMode: 'Bank',
        remarks: '',
        filterStartDate: '',
        filterEndDate: ''
    });

    const unallocatedBalance = useMemo(() => {
        if (allocationSource !== 'fresh') return 0;
        const totalAllocated = entries.reduce((sum, entry) => {
            // Only count entries that are NOT saved yet (currently being allocated)
            if (!entry.isSaved) {
                return sum + (parseFloat(entry.allocatedAmount) || 0);
            }
            return sum;
        }, 0);
        return Math.max(0, (formData.amount || 0) - totalAllocated);
    }, [formData.amount, entries, allocationSource]);

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
        const fetchCompanies = async () => {
            try {
                const response = await api.get('/companies');
                const data = response.data.data || response.data || [];
                setAllCompanies(data);
            } catch (error) {
                console.error('Error fetching companies:', error);
            }
        };
        fetchCompanies();
    }, []);

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
                    companies: item.companyIds || item.companies || []
                })));
                setSelectedLedger(null);
                setFormData(prev => ({ ...prev, ledgerId: '', companyId: '', mappings: [] }));
            } catch (error) {
                toast.error('Error fetching ledgers');
            } finally {
                setFetchingLedgers(false);
            }
        };
        fetchLedgers();
    }, [formData.ledgerType]);

    const fetchEntries = useCallback(async (page = 1) => {
        if (!formData.ledgerId || !formData.companyId || formData.paymentType !== 'Sauda-wise') {
            setEntries([]);
            return;
        }

        try {
            setFetchingEntries(true);
            
            // Resolve company name from ID
            let companyName = '';
            if (formData.ledgerType === 'Buyer') {
                const selectedCompany = allCompanies.find(c => c._id === formData.companyId);
                companyName = selectedCompany?.companyName || '';
            } else {
                // For Sellers, companyId is already the name string
                companyName = formData.companyId;
            }

            let params = { 
                page: page,
                limit: 20,
                startDate: formData.filterStartDate,
                endDate: formData.filterEndDate,
                isUnloaded: true 
            };

            if (formData.companyId) {
                params.companyId = formData.companyId;
            }
            
            if (formData.ledgerType === 'Seller') {
                params.supplier = formData.ledgerId;
                if (companyName) params.supplierCompany = companyName;
            } else {
                params.buyerId = formData.ledgerId;
                if (companyName) params.buyerCompany = companyName;
            }
            
            const response = await api.get('/loading-entries', { params });
            const items = response.data.data || [];
            
            // Client side sorting: Pending first, then Done
            const sortedItems = [...items].sort((a, b) => {
                if (a.paymentStatus === 'pending' && b.paymentStatus === 'done') return -1;
                if (a.paymentStatus === 'done' && b.paymentStatus === 'pending') return 1;
                return new Date(b.loadingDate) - new Date(a.loadingDate);
            });

            setEntries(sortedItems.map((item, index) => ({
                ...item,
                uiKey: `${item._id}-${index}-${Date.now()}`,
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
    }, [formData.ledgerId, formData.ledgerType, formData.paymentType, formData.filterStartDate, formData.filterEndDate, formData.companyId, allCompanies]);

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
        setFormData(prev => ({ ...prev, ledgerId: option?.value || '', companyId: '' }));
    };

    const handleCompanyChange = (option) => {
        setFormData(prev => ({ ...prev, companyId: option?.value || '' }));
    };

    const handleAllocationChange = (uiKey, amount, netAmount, paidAmount) => {
        if (amount === '') {
            setEntries(prev => prev.map(entry => 
                entry.uiKey === uiKey ? { ...entry, allocatedAmount: '' } : entry
            ));
            return;
        }

        const numAmount = parseFloat(amount) || 0;
        const dueAmount = netAmount - (paidAmount || 0);
        
        // 1. Validate against Lorry Due
        if (numAmount > dueAmount + 1) {
            toast.warning(`Allocation cannot exceed due amount (₹${dueAmount.toFixed(2)})`);
            return;
        }

        // 2. Validate against Voucher Balance (only for fresh payments)
        if (allocationSource === 'fresh') {
            const currentEntry = entries.find(e => e.uiKey === uiKey);
            const currentAllocatedForThisRow = parseFloat(currentEntry?.allocatedAmount) || 0;
            const otherAllocationsTotal = (formData.amount || 0) - unallocatedBalance - currentAllocatedForThisRow;
            
            if (numAmount + otherAllocationsTotal > (formData.amount || 0) + 1) {
                toast.error(`Total allocation cannot exceed Voucher Amount (₹${formData.amount})`);
                return;
            }
        }

        setEntries(prev => prev.map(entry => 
            entry.uiKey === uiKey ? { ...entry, allocatedAmount: amount } : entry
        ));
    };

    const handleRowRemarksChange = (uiKey, remarks) => {
        setEntries(prev => prev.map(entry => 
            entry.uiKey === uiKey ? { ...entry, rowRemarks: remarks } : entry
        ));
    };

    const handleAddRow = (entry, index) => {
        const newRow = {
            ...entry,
            uiKey: `${entry._id}-extra-${Date.now()}`,
            allocatedAmount: '',
            rowRemarks: '',
            isSaved: false // New sub-rows are never saved initially
        };
        const newEntries = [...entries];
        newEntries.splice(index + 1, 0, newRow);
        setEntries(newEntries);
    };

    const handleRemoveRow = (uiKey) => {
        setEntries(prev => prev.filter(entry => entry.uiKey !== uiKey));
    };

    const calculateTallyDetails = (entry) => {
        // Use unloading weight if available, otherwise fallback to loading weight for allocation purposes
        const weight = (entry.unloadingWeight || 0) > 0 ? entry.unloadingWeight : (entry.loadingWeight || 0);
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
            dueAmount: Math.max(0, netAmount - (entry.paidAmount || 0))
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

                // Decrease the Voucher Amount by the allocated amount
                if (allocationSource === 'fresh') {
                    setFormData(prev => ({
                        ...prev,
                        amount: Math.max(0, prev.amount - numAllocated)
                    }));
                }
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
        { header: 'TIME', accessor: (row) => <span className="text-[10px] font-black text-slate-400">{new Date(row.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> },
        { header: 'MODE', accessor: (row) => <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{row.paymentMode}</span> },
        { header: 'PARTICULARS', accessor: (row) => <span className="text-[10px] font-bold text-slate-600">{(row.mappings || []).map(m => m.saudaNo).join(', ') || 'Advance Payment'}</span> },
        { header: 'AMOUNT', accessor: (row) => <span className="font-black text-slate-900 text-sm italic">₹{row.amount.toLocaleString()}</span> },
        { header: 'REMARKS', accessor: (row) => <span className="text-[10px] text-slate-400 font-medium italic">{row.remarks || '-'}</span> },
        { 
            header: 'ACTION', 
            accessor: (row) => (
                <Buttons
                    label=""
                    icon={<FaPrint size={12} />}
                    variant="ghost"
                    size="sm"
                    onClick={() => printVoucher(row)}
                    className="!p-2 hover:bg-slate-100"
                />
            ) 
        }
    ];

    const columns = [
        { 
            header: 'DATE & SAUDA', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 text-xs">{new Date(row.loadingDate).toLocaleDateString('en-GB')}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{row.saudaNo}</span>
                </div>
            )
        },
        { 
            header: 'LORRY & ITEM', 
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 uppercase tracking-tighter text-xs">{row.lorryNumber}</span>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">{row.commodity}</span>
                    <div className="mt-1 flex items-center gap-1">
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100 uppercase">
                            Unloading: {row.unloadingWeight || 0} MT
                        </span>
                    </div>
                </div>
            )
        },
        { 
            header: 'PARTIES', 
            accessor: (row) => (
                <div className="flex flex-col gap-1 max-w-[150px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-100 text-[8px] flex items-center justify-center text-blue-600 font-black">B</span>
                        <span className="text-[9px] font-black uppercase text-slate-500 truncate">{row.buyerCompany || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-100 text-[8px] flex items-center justify-center text-amber-600 font-black">S</span>
                        <span className="text-[9px] font-black uppercase text-slate-500 truncate">{row.supplierCompany || 'N/A'}</span>
                    </div>
                </div>
            )
        },
        { 
            header: 'BREAKDOWN', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                return (
                    <div className="flex flex-col gap-1 text-[9px] font-black min-w-[140px] uppercase">
                        <div className="flex justify-between text-slate-400">
                            <span>Net Amt:</span>
                            <span>₹{details.netAmount.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Paid:</span>
                            <span>₹{(row.paidAmount || 0).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 text-rose-600 text-[10px]">
                            <span>Due:</span>
                            <span className="bg-rose-50 px-1.5 rounded">₹{details.dueAmount.toFixed(0)}</span>
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
                const isExtraRow = row.uiKey.includes('-extra-');

                return (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="relative group">
                            <input
                                type="number"
                                value={row.allocatedAmount}
                                onChange={(e) => handleAllocationChange(row.uiKey, e.target.value, details.netAmount, row.paidAmount)}
                                onWheel={(e) => e.target.blur()}
                                disabled={isLocked}
                                className={`w-full px-3 py-2 rounded-xl border-2 transition-all ${
                                    isLocked 
                                        ? 'bg-slate-50 text-slate-400 border-slate-100' 
                                        : 'border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5'
                                } font-black text-slate-900 text-xs`}
                                placeholder="0.00"
                            />
                            {!isLocked && (
                                <button
                                    onClick={() => handleAllocationChange(row.uiKey, details.dueAmount.toString(), details.netAmount, row.paidAmount)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    Full
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <textarea
                                value={row.rowRemarks}
                                onChange={(e) => handleRowRemarksChange(row.uiKey, e.target.value)}
                                disabled={isLocked}
                                rows={1}
                                className={`flex-1 px-3 py-1.5 rounded-lg border text-[10px] font-bold ${
                                    isLocked 
                                        ? 'bg-slate-50 text-slate-400 border-slate-100' 
                                        : 'border-slate-200 bg-white focus:border-slate-900 focus:bg-yellow-50'
                                } outline-none transition-all resize-none uppercase`}
                                placeholder="Narration..."
                            />
                            {isExtraRow && !row.isSaved && (
                                <button
                                    onClick={() => handleRemoveRow(row.uiKey)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Remove row"
                                >
                                    <FaTrash size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'ACTION',
            accessor: (row, index) => {
                const isLocked = row.isSaved && user?.role !== 'Admin';
                const isAdmin = user?.role === 'Admin';
                
                return (
                    <div className="flex flex-col gap-1 w-full min-w-[100px]">
                        <div className="flex gap-1">
                            <Buttons
                                label={isLocked && !isAdmin ? 'Locked' : (isAdmin && row.isSaved ? 'Adjust' : 'Save')}
                                onClick={() => handleSaveRow(row)}
                                disabled={(isLocked && !isAdmin) || loading}
                                variant={isLocked && !isAdmin ? 'ghost' : (isAdmin && row.isSaved ? 'outline' : 'primary')}
                                size="sm"
                                icon={isLocked && !isAdmin ? <FaCheckCircle size={12} /> : (isAdmin && row.isSaved ? <FaExchangeAlt size={12} /> : <FaSave size={12} />)}
                                className={`flex-1 !text-[10px] !py-2.5 ${
                                    isAdmin && row.isSaved ? '!border-amber-500 !text-amber-600 hover:!bg-amber-50' : ''
                                }`}
                            />
                            {!isLocked && (
                                <button
                                    onClick={() => handleAddRow(row, index)}
                                    className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                                    title="Add another allocation for this lorry"
                                >
                                    <FaPlus size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <AdminPageShell
            title="Payment Received"
            subtitle="Record and allocate payments in Tally-style ledger format"
            icon={FaFileInvoiceDollar}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section: Navigation & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Buttons
                            label="Back"
                            icon={<FaArrowLeft size={12} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                        />
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                            <TabButton 
                                active={activeTab === 'allocation'} 
                                label="Allocation" 
                                icon={FaExchangeAlt} 
                                onClick={() => setActiveTab('allocation')} 
                            />
                            <TabButton 
                                active={activeTab === 'history'} 
                                label="History" 
                                icon={FaHistory} 
                                onClick={() => setActiveTab('history')} 
                            />
                            <TabButton 
                                active={activeTab === 'summary'} 
                                label="Summary" 
                                icon={FaChartBar} 
                                onClick={() => setActiveTab('summary')} 
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                        <FaRegCalendarAlt className="text-emerald-500" />
                        <span className="text-sm font-bold tracking-tight">
                            {new Date(formData.date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<FaWallet size={18} />}
                        label={selectedLedger ? `${selectedLedger.label} Received` : 'Total Received'}
                        value={`₹${dateTotal.toLocaleString('en-IN')}`}
                        subValue="Today"
                        color="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    
                    <StatCard
                        icon={<FaExclamationCircle size={18} />}
                        label={formData.ledgerType === 'Seller' ? 'Seller Due' : 'Buyer Due'}
                        value={`₹${ledgerBalance.outstandingBalance.toLocaleString('en-IN')}`}
                        subValue="Total Outstanding"
                        color="bg-rose-50"
                        iconColor="text-rose-600"
                    />

                    <StatCard
                        icon={<FaHistory size={18} />}
                        label="Advance Balance"
                        value={`₹${ledgerBalance.advanceBalance.toLocaleString('en-IN')}`}
                        subValue="Available Credit"
                        color="bg-blue-50"
                        iconColor="text-blue-600"
                    />

                    <StatCard
                        icon={<FaChartLine size={18} />}
                        label="Pending Records"
                        value={entryStats.pendingCount.toString()}
                        subValue="Unsettled Saudas"
                        color="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                </div>

                {/* Main Configuration Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                <FaBuilding size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Account Selection</h3>
                                <p className="text-xs text-slate-500 font-medium">Configure ledger and payment details</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {[
                                { id: 'fresh', label: 'Payment Received', icon: <FaMoneyBillWave size={12} /> },
                                { id: 'advance', label: 'From Advance', icon: <FaExchangeAlt size={12} /> }
                            ].map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => setAllocationSource(source.id)}
                                    className={`flex items-center gap-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
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

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Ledger Type</label>
                                <DataDropdown
                                    options={ledgerTypes}
                                    selectedOptions={formData.ledgerType}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, ledgerType: opt.value }))}
                                    isMulti={false}
                                    className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Name</label>
                                <DataDropdown
                                    options={ledgers}
                                    selectedOptions={selectedLedger}
                                    onChange={handleLedgerChange}
                                    placeholder={fetchingLedgers ? "Syncing..." : `Select ${formData.ledgerType}`}
                                    isMulti={false}
                                    isDisabled={fetchingLedgers}
                                    className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Company (Filter)</label>
                                <DataDropdown
                                    options={selectedLedger?.companies?.map(c => {
                                        const isObjectId = typeof c === 'string' && c.length === 24 && /^[0-9a-fA-F]+$/.test(c);
                                        const companyId = typeof c === 'string' ? c : (c._id || c.value || c.id);
                                        
                                        let label = 'Unknown';
                                        if (formData.ledgerType === 'Buyer') {
                                            // Look up in allCompanies for Buyer
                                            const companyInfo = allCompanies.find(comp => comp._id === companyId);
                                            label = companyInfo?.companyName || (typeof c === 'object' ? (c.companyName || c.label) : companyId);
                                        } else {
                                            // For Seller, it's usually the name string
                                            label = companyId;
                                        }
                                        
                                        return { value: companyId, label };
                                    }) || []}
                                    selectedOptions={formData.companyId ? {
                                        value: formData.companyId,
                                        label: formData.ledgerType === 'Buyer' 
                                            ? (allCompanies.find(comp => comp._id === formData.companyId)?.companyName || 'Unknown')
                                            : formData.companyId // For Sellers, value is the name
                                    } : null}
                                    onChange={handleCompanyChange}
                                    placeholder="Select Company"
                                    isMulti={false}
                                    isDisabled={!selectedLedger}
                                    className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Voucher Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount === 0 ? '' : formData.amount}
                                        onChange={handleInputChange}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="0.00"
                                        className="w-full h-[42px] pl-8 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Mode</label>
                                <select
                                    name="paymentMode"
                                    value={formData.paymentMode}
                                    onChange={handleInputChange}
                                    className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                                >
                                    {paymentModes.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                            <div className="lg:col-span-2 space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Voucher Narration</label>
                                <input
                                    type="text"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Enter narration for this voucher..."
                                    className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                />
                            </div>
                            <div className="flex items-end">
                                <Buttons
                                    label={`Record Advance (₹${formData.amount})`}
                                    onClick={handleRecordAdvance}
                                    disabled={loading || !selectedLedger || formData.amount <= 0 || allocationSource !== 'fresh'}
                                    variant="primary"
                                    className="w-full h-[42px] rounded-xl shadow-lg shadow-emerald-600/20"
                                    icon={<FaSave />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    {activeTab === 'allocation' && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                        <FaFilter size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">
                                            {allocationSource === 'fresh' ? 'Allocation Ledger' : 'Advance Adjustment'}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                                            {allocationSource === 'fresh' ? 'Map payments to saudas' : `Using ₹${ledgerBalance.advanceBalance.toLocaleString()} Credit`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {allocationSource === 'fresh' && formData.amount > 0 && (
                                        <div className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-700 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 leading-none mb-1">Available to Allocate</span>
                                                <span className="text-sm font-black italic tracking-tight">₹{unallocatedBalance.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="w-px h-6 bg-emerald-700/50 mx-1"></div>
                                            <FaMoneyBillWave className="text-emerald-400 animate-pulse" />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                                        <input
                                            type="date"
                                            value={formData.filterStartDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterStartDate: e.target.value }))}
                                            className="text-[11px] font-bold text-slate-700 outline-none bg-transparent"
                                        />
                                        <span className="text-slate-300">|</span>
                                        <input
                                            type="date"
                                            value={formData.filterEndDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, filterEndDate: e.target.value }))}
                                            className="text-[11px] font-bold text-slate-700 outline-none bg-transparent"
                                        />
                                        {(formData.filterStartDate || formData.filterEndDate) && (
                                            <button 
                                                onClick={() => setFormData(prev => ({ ...prev, filterStartDate: '', filterEndDate: '' }))}
                                                className="ml-1 text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-all"
                                            >
                                                <FaArrowLeft size={10} />
                                            </button>
                                        )}
                                    </div>

                                    <SearchBox
                                        placeholder="Search Sauda / Lorry..."
                                        items={entries}
                                        onSearch={setTableSearch}
                                        returnQuery={true}
                                        className="!max-w-[300px]"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                {fetchingEntries ? (
                                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                                        <Loading size="lg" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Entries...</p>
                                    </div>
                                ) : filteredEntries.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Tables
                                            headers={columns.map(c => c.header)}
                                            rows={filteredEntries.map((entry, index) => columns.map(col => {
                                                if (typeof col.accessor === 'function') {
                                                    return col.accessor(entry, index);
                                                }
                                                return entry[col.accessor];
                                            }))}
                                        />
                                        
                                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                                            <Paginations
                                                currentPage={entriesPage}
                                                totalItems={entriesTotalPages * 20} // Assuming 20 per page as per fetchEntries
                                                itemsPerPage={20}
                                                onPageChange={(page) => fetchEntries(page)}
                                            />
                                        </div>

                                        <div className="bg-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-10">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Unpaid Due</p>
                                                    <p className="text-2xl font-black text-white italic tracking-tighter">₹{entryStats.totalDue.toLocaleString('en-IN')}</p>
                                                </div>
                                                <div className="w-px h-10 bg-slate-800 hidden md:block"></div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Date Received</p>
                                                    <p className="text-2xl font-black text-white italic tracking-tighter">₹{dateTotal.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pending Count</p>
                                                    <p className="text-2xl font-black text-rose-400">{entryStats.pendingCount}</p>
                                                </div>
                                                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                                    <FaFileInvoiceDollar className="text-slate-500" size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                            <FaHistory size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800">No Pending Records</h4>
                                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                                            All entries for this ledger are fully settled or no records match your filters.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                        <FaHistory size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Voucher History</h4>
                                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                                            Records for {new Date(formData.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                {fetchingHistory ? (
                                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                                        <Loading size="lg" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Loading History...</p>
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
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                            <FaHistory size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800">No Previous Payments</h4>
                                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                                            No payments were recorded for this ledger on the selected date.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                        <FaChartBar size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Analytical Summary</h4>
                                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Periodic collection trends</p>
                                    </div>
                                </div>

                                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                                    {['month', 'week'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSummaryType(type)}
                                            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                summaryType === type 
                                                    ? 'bg-slate-900 text-white shadow-md' 
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
                                            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-[2rem] group hover:border-slate-900 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-slate-900 transition-colors duration-300"></div>
                                                
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                                                            <FaFileInvoiceDollar size={20} />
                                                        </div>
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60">{item._id.year}</span>
                                                    </div>
                                                    
                                                    <div className="space-y-1 mb-6">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-white/60">
                                                            {summaryType === 'month' ? `Period ${item._id.period}` : `Week ${item._id.period}`}
                                                        </p>
                                                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter group-hover:text-white transition-colors duration-300">
                                                            ₹{item.totalAmount.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <div className="pt-6 border-t border-slate-100 group-hover:border-white/10 flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-white">{item.count} Transactions</span>
                                                        <FaArrowRight className="text-slate-200 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-32 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                            <FaChartBar size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800">No Summary Data</h4>
                                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                                            Analytical data will appear here once you select a ledger and record transactions.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminPageShell>
    );
};

export default AddPaymentReceived;
