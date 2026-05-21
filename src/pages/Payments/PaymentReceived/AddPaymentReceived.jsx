import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminPageShell from '../../../common/AdminPageShell/AdminPageShell';
import DataDropdown from '../../../common/DataDropdown/DataDropdown';
import DataInput from '../../../common/DataInput/DataInput';
import DateSelector from '../../../common/DateSelector/DateSelector';
import Tables from '../../../common/Tables/Tables';
import api from '../../../utils/apiClient/apiClient';
import Loading from '../../../common/Loading/Loading';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { FaSave, FaArrowLeft, FaMoneyBillWave, FaExchangeAlt, FaHistory, FaCalendarAlt, FaBuilding, FaSearch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const AddPaymentReceived = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);
    const [fetchingEntries, setFetchingEntries] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [entries, setEntries] = useState([]);
    const [tableSearch, setTableSearch] = useState('');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        ledgerType: 'Buyer',
        ledgerId: '',
        amount: 0,
        paymentType: 'Sauda-wise',
        paymentMode: 'Bank',
        remarks: ''
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
        { value: 'Adjustment', label: 'General Adjustment' }
    ];

    // Fetch ledgers based on type
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

    // Fetch pending entries for mapping
    const fetchEntries = useCallback(async () => {
        if (!formData.ledgerId || formData.paymentType !== 'Sauda-wise') {
            setEntries([]);
            return;
        }

        try {
            setFetchingEntries(true);
            let params = { 
                paymentStatus: 'pending'
            };
            
            if (formData.ledgerType === 'Seller') {
                params.supplier = formData.ledgerId;
            } else {
                params.buyerId = formData.ledgerId;
            }
            
            const response = await api.get('/loading-entries', { params });
            const items = response.data.data || [];
            setEntries(items.map(item => ({
                ...item,
                allocatedAmount: 0,
                rowRemarks: '',
                isSaved: item.paymentStatus === 'done'
            })));
        } catch (error) {
            toast.error('Error fetching pending entries');
        } finally {
            setFetchingEntries(false);
        }
    }, [formData.ledgerId, formData.ledgerType, formData.paymentType]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLedgerChange = (option) => {
        setSelectedLedger(option);
        setFormData(prev => ({ ...prev, ledgerId: option?.value || '' }));
    };

    const handleAllocationChange = (entryId, amount, netAmount, paidAmount) => {
        const numAmount = parseFloat(amount) || 0;
        const dueAmount = netAmount - (paidAmount || 0);
        
        if (numAmount > dueAmount + 1) { // Allow small rounding
            toast.warning(`Allocation cannot exceed due amount (₹${dueAmount.toFixed(2)})`);
            return;
        }

        setEntries(prev => prev.map(entry => 
            entry._id === entryId ? { ...entry, allocatedAmount: numAmount } : entry
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

        try {
            setLoading(true);
            const payload = {
                date: formData.date,
                ledgerType: formData.ledgerType,
                ledgerId: formData.ledgerId,
                amount: entry.allocatedAmount,
                paymentType: 'Sauda-wise',
                paymentMode: formData.paymentMode,
                mappings: [{
                    saudaNo: entry.saudaNo,
                    loadingEntryId: entry._id,
                    allocatedAmount: entry.allocatedAmount,
                    remarks: entry.rowRemarks
                }],
                remarks: entry.rowRemarks 
            };

            await api.post('/payment-received', payload);
            toast.success(`Payment saved for ${entry.lorryNumber}`);
            
            // Refresh entries to show updated paidAmount
            fetchEntries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving payment');
        } finally {
            setLoading(false);
        }
    };

    // Filtered entries for table search
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
                {/* Header Actions */}
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase tracking-widest text-[10px] transition-colors"
                    >
                        <FaArrowLeft />
                        Back to List
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Date</span>
                            <span className="text-sm font-bold text-slate-800">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <FaCalendarAlt size={18} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Side: Configuration (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                    <FaExchangeAlt size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Configuration</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Setup allocation rules</p>
                                </div>
                            </div>

                            <div className="space-y-4">
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Ledger</label>
                                    <DataDropdown
                                        options={ledgers}
                                        selectedOptions={selectedLedger}
                                        onChange={handleLedgerChange}
                                        placeholder={fetchingLedgers ? "Loading..." : `Select ${formData.ledgerType}`}
                                        isMulti={false}
                                        isDisabled={fetchingLedgers}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Date</label>
                                    <DateSelector
                                        value={formData.date}
                                        onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Mode</label>
                                    <DataDropdown
                                        options={paymentModes}
                                        selectedOptions={formData.paymentMode}
                                        onChange={(opt) => setFormData(prev => ({ ...prev, paymentMode: opt.value }))}
                                        isMulti={false}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">General Note</label>
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Internal reference..."
                                        rows={3}
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition text-sm font-medium text-slate-700 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Widget */}
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selection Summary</span>
                                <FaCheckCircle className="text-emerald-500" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Target Ledger</p>
                                    <p className="font-bold truncate">{selectedLedger?.label || 'Not Selected'}</p>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Pending</p>
                                    <p className="text-2xl font-black">{entries.length} Entries</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Entries Table (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                                        <FaBuilding size={14} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pending Sauda Entries</h3>
                                </div>
                                
                                <div className="relative w-full md:w-64">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-3" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH SAUDA, LORRY..."
                                        value={tableSearch}
                                        onChange={(e) => setTableSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                {fetchingEntries ? (
                                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Data...</p>
                                    </div>
                                ) : filteredEntries.length > 0 ? (
                                    <div className="p-2">
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
                                ) : (
                                    <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                                        <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                            {tableSearch ? <FaExclamationCircle size={32} /> : <FaHistory size={32} />}
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                            {tableSearch ? 'No matches found' : 'No Pending Entries'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-xs mx-auto">
                                            {tableSearch ? `No sauda or lorry matches "${tableSearch}"` : 'Select a ledger to view pending payments'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
};

export default AddPaymentReceived;
