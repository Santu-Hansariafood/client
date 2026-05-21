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
import { FaSave, FaArrowLeft, FaMoneyBillWave, FaExchangeAlt, FaHistory, FaCalendarAlt, FaBuilding } from 'react-icons/fa';

const AddPaymentReceived = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);
    const [fetchingEntries, setFetchingEntries] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [entries, setEntries] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

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
                paymentStatus: 'pending',
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
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
    }, [formData.ledgerId, formData.ledgerType, formData.paymentType, dateRange]);

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
        
        if (numAmount > dueAmount) {
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
                remarks: entry.rowRemarks // Also set top level remarks for history
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

    const columns = [
        { 
            header: 'Date & Sauda', 
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{new Date(row.loadingDate).toLocaleDateString('en-GB')}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{row.saudaNo}</span>
                </div>
            )
        },
        { 
            header: 'Lorry & Item', 
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-800 uppercase tracking-tighter">{row.lorryNumber}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{row.commodity}</span>
                </div>
            )
        },
        { 
            header: 'Tally Breakdown', 
            accessor: (row) => {
                const details = calculateTallyDetails(row);
                return (
                    <div className="flex flex-col gap-0.5 text-[10px] font-medium min-w-[150px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Net Amount:</span>
                            <span>₹{details.netAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                            <span>Paid:</span>
                            <span>₹{(row.paidAmount || 0).toFixed(2)}</span>
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
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="relative">
                            <input
                                type="number"
                                value={row.allocatedAmount}
                                onChange={(e) => handleAllocationChange(row._id, e.target.value, details.netAmount, row.paidAmount)}
                                disabled={isLocked}
                                className={`w-full px-3 py-2 rounded-xl border ${
                                    isLocked ? 'bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50/50'
                                } focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition font-bold text-slate-700`}
                                placeholder="Amount"
                            />
                            <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">
                                Due: ₹{details.dueAmount.toFixed(2)}
                            </p>
                        </div>
                        <textarea
                            value={row.rowRemarks}
                            onChange={(e) => handleRowRemarksChange(row._id, e.target.value)}
                            disabled={isLocked}
                            rows={1}
                            className={`w-full px-3 py-2 rounded-xl border text-xs ${
                                isLocked ? 'bg-slate-100 text-slate-400' : 'border-slate-200 bg-slate-50/50'
                            } focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition`}
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
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${
                            isLocked 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                    >
                        <FaSave />
                        {isLocked ? 'Saved' : 'Save Entry'}
                    </button>
                );
            }
        }
    ];

    return (
        <AdminPageShell
            title="Add Payment Received"
            subtitle="Record bulk payments and map them to sauda entries"
            icon={FaMoneyBillWave}
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <FaArrowLeft />
                        </div>
                        <span>Back to List</span>
                    </button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FaExchangeAlt size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Payment Allocation</h3>
                                <p className="text-sm text-slate-400 font-medium">Select ledger and filter entries by date</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ledger Type</label>
                                <DataDropdown
                                    options={ledgerTypes}
                                    selectedOptions={formData.ledgerType}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, ledgerType: opt.value }))}
                                    isMulti={false}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Select Ledger</label>
                                <DataDropdown
                                    options={ledgers}
                                    selectedOptions={selectedLedger}
                                    onChange={handleLedgerChange}
                                    placeholder={fetchingLedgers ? "Loading..." : `Select ${formData.ledgerType}`}
                                    isMulti={false}
                                    isDisabled={fetchingLedgers}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Date</label>
                                <DateSelector
                                    value={formData.date}
                                    onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Mode</label>
                                <DataDropdown
                                    options={paymentModes}
                                    selectedOptions={formData.paymentMode}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, paymentMode: opt.value }))}
                                    isMulti={false}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Filter Start Date</label>
                                <DateSelector
                                    value={dateRange.startDate}
                                    onChange={(val) => setDateRange(prev => ({ ...prev, startDate: val }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Filter End Date</label>
                                <DateSelector
                                    value={dateRange.endDate}
                                    onChange={(val) => setDateRange(prev => ({ ...prev, endDate: val }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Entries Table Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <FaBuilding className="text-emerald-600" />
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pending Entries</h3>
                            </div>
                        </div>

                        <div className="p-4">
                            {fetchingEntries ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Entries...</p>
                                </div>
                            ) : entries.length > 0 ? (
                                <Tables
                                    headers={columns.map(c => c.header)}
                                    rows={entries.map(entry => columns.map(col => {
                                        if (typeof col.accessor === 'function') {
                                            return col.accessor(entry);
                                        }
                                        return entry[col.accessor];
                                    }))}
                                />
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                        <FaHistory size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800">No Entries Found</h4>
                                    <p className="text-slate-500 max-w-xs mx-auto">Try adjusting the date filters or select a different ledger.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AdminPageShell>
    );
};

export default AddPaymentReceived;
