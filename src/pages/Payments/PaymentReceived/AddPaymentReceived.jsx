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
import { FaSave, FaArrowLeft, FaMoneyBillWave, FaExchangeAlt, FaHistory } from 'react-icons/fa';

const AddPaymentReceived = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingLedgers, setFetchingLedgers] = useState(false);
    const [fetchingEntries, setFetchingEntries] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [entries, setEntries] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState(null);
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        ledgerType: 'Buyer',
        ledgerId: '',
        amount: 0,
        paymentType: 'Sauda-wise',
        paymentMode: 'Bank',
        remarks: '',
        mappings: []
    });

    const paymentModes = [
        { value: 'By Cash', label: 'By Cash' },
        { value: 'Bank', label: 'Bank' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'TDS', label: 'TDS' },
        { value: 'GST', label: 'GST' },
        { value: 'Adjustment', label: 'Adjustment' }
    ];

    const ledgerTypes = [
        { value: 'Buyer', label: 'Buyer' },
        { value: 'Seller', label: 'Seller' }
    ];

    const paymentTypes = [
        { value: 'Sauda-wise', label: 'Sauda-wise' },
        { value: 'Adjustment', label: 'Adjustment' }
    ];

    // Fetch ledgers (Buyers or Sellers)
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
                    companies: item.companyIds || [] // For buyers, to filter entries
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
    useEffect(() => {
        if (formData.ledgerId && formData.paymentType === 'Sauda-wise') {
            const fetchEntries = async () => {
                try {
                    setFetchingEntries(true);
                    let query = { paymentStatus: 'pending' };
                    
                    if (formData.ledgerType === 'Seller') {
                        query.supplier = formData.ledgerId;
                    } else {
                        // For buyers, we need to find entries by company names associated with the buyer
                        // This might require a specialized backend route or client-side filtering if entries are fetched
                        // For now, let's assume we have a way to filter by buyerId if we update backend
                        query.buyerId = formData.ledgerId;
                    }
                    
                    const response = await api.get('/loading-entries', { params: query });
                    const items = response.data.data || [];
                    setEntries(items.map(item => ({
                        ...item,
                        allocatedAmount: 0
                    })));
                } catch (error) {
                    toast.error('Error fetching pending entries');
                } finally {
                    setFetchingEntries(false);
                }
            };
            fetchEntries();
        } else {
            setEntries([]);
        }
    }, [formData.ledgerId, formData.ledgerType, formData.paymentType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLedgerChange = (option) => {
        setSelectedLedger(option);
        setFormData(prev => ({ ...prev, ledgerId: option?.value || '' }));
    };

    const handleAllocationChange = (entryId, amount) => {
        const numAmount = parseFloat(amount) || 0;
        setEntries(prev => prev.map(entry => 
            entry._id === entryId ? { ...entry, allocatedAmount: numAmount } : entry
        ));
    };

    const totalAllocated = useMemo(() => {
        return entries.reduce((sum, entry) => sum + (entry.allocatedAmount || 0), 0);
    }, [entries]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.ledgerId) return toast.error('Please select a ledger');
        if (formData.amount <= 0) return toast.error('Please enter a valid amount');
        
        if (formData.paymentType === 'Sauda-wise' && totalAllocated <= 0) {
            return toast.error('Please allocate amount to at least one entry');
        }

        if (formData.paymentType === 'Sauda-wise' && totalAllocated > formData.amount) {
            return toast.error('Total allocated amount cannot exceed bulk payment amount');
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                mappings: entries
                    .filter(e => e.allocatedAmount > 0)
                    .map(e => ({
                        loadingEntryId: e._id,
                        saudaNo: e.saudaNo,
                        allocatedAmount: e.allocatedAmount
                    }))
            };

            await api.post('/payment-received', payload);
            toast.success('Payment received successfully');
            navigate('/payments/received/list');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving payment');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Date', accessor: (row) => new Date(row.loadingDate).toLocaleDateString() },
        { header: 'Sauda No', accessor: 'saudaNo' },
        { header: 'Lorry No', accessor: 'lorryNumber' },
        { header: 'Item', accessor: 'commodity' },
        { header: 'Unloading Wt', accessor: 'unloadingWeight' },
        { 
            header: 'Allocation', 
            accessor: (row) => (
                <input
                    type="number"
                    value={row.allocatedAmount}
                    onChange={(e) => handleAllocationChange(row._id, e.target.value)}
                    className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    placeholder="0.00"
                />
            )
        }
    ];

    return (
        <AdminPageShell
            title="Add Payment Received"
            subtitle="Record bulk payments and map them to sauda entries"
            icon={<FaMoneyBillWave />}
        >
            <div className="max-w-6xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition font-semibold"
                        >
                            <FaArrowLeft /> Back to List
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 transition disabled:opacity-50"
                        >
                            <FaSave /> {loading ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-semibold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Bulk Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-semibold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Payment Type</label>
                                    <DataDropdown
                                        options={paymentTypes}
                                        selectedOptions={formData.paymentType}
                                        onChange={(opt) => setFormData(prev => ({ ...prev, paymentType: opt.value }))}
                                        isMulti={false}
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
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Add any additional notes here..."
                                    className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-medium text-slate-700 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mapping Section */}
                    {formData.paymentType === 'Sauda-wise' && formData.ledgerId && (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Map Amount to Entries</h3>
                                    <p className="text-sm text-slate-500 font-medium">Allocate the bulk payment to specific sauda/lorry records</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Allocated</p>
                                        <p className={`text-2xl font-black ${totalAllocated > formData.amount ? 'text-red-500' : 'text-emerald-600'}`}>
                                            ₹{totalAllocated.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right border-l pl-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            ₹{(formData.amount - totalAllocated).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                {fetchingEntries ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Pending Entries...</p>
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
                                        <h4 className="text-lg font-bold text-slate-800">No Pending Entries Found</h4>
                                        <p className="text-slate-500 max-w-xs mx-auto">There are no pending sauda entries for this ledger that require payment mapping.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AdminPageShell>
    );
};

export default AddPaymentReceived;
