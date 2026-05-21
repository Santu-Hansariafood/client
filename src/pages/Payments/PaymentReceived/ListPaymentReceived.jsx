import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminPageShell from '../../../common/AdminPageShell/AdminPageShell';
import Tables from '../../../common/Tables/Tables';
import api from '../../../utils/apiClient/apiClient';
import { FaPlus, FaMoneyBillWave, FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import Paginations from '../../../common/Paginations/Paginations';

const ListPaymentReceived = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [filters, setFilters] = useState({
        ledgerType: '',
        startDate: '',
        endDate: ''
    });

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
            setPayments(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Error fetching payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [page, filters]);

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
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-0.5">{row.ledgerType}</span>
                    <span className="font-bold text-slate-800">{row.ledgerId?.name || row.ledgerId?.sellerName || 'N/A'}</span>
                </div>
            )
        },
        { 
            header: 'Amount', 
            accessor: (row) => (
                <span className="font-black text-emerald-600">₹{row.amount.toLocaleString()}</span>
            )
        },
        { 
            header: 'Mode', 
            accessor: (row) => (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    {row.paymentMode}
                </span>
            )
        },
        { 
            header: 'Type', 
            accessor: (row) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
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
                <span className="text-sm font-medium text-slate-500">
                    {row.mappings?.length || 0} Entries
                </span>
            )
        },
        { 
            header: 'Remarks', 
            accessor: 'remarks',
            className: "max-w-[200px] truncate italic text-slate-400 text-sm"
        }
    ];

    return (
        <AdminPageShell
            title="Received Payments"
            subtitle="View and manage all bulk payments received"
            icon={<FaMoneyBillWave />}
        >
            <div className="space-y-6">
                {/* Top Actions & Filters */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition text-sm font-semibold text-slate-600"
                            />
                        </div>
                        <span className="text-slate-400 font-bold">to</span>
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition text-sm font-semibold text-slate-600"
                            />
                        </div>
                        <select
                            value={filters.ledgerType}
                            onChange={(e) => setFilters(prev => ({ ...prev, ledgerType: e.target.value }))}
                            className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition text-sm font-semibold text-slate-600"
                        >
                            <option value="">All Types</option>
                            <option value="Buyer">Buyer</option>
                            <option value="Seller">Seller</option>
                        </select>
                    </div>

                    <button
                        onClick={() => navigate('/payments/received/add')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition whitespace-nowrap"
                    >
                        <FaPlus /> Record New Payment
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-2">
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <Tables
                                headers={columns.map(c => c.header)}
                                rows={payments.map(payment => columns.map(col => {
                                    if (typeof col.accessor === 'function') {
                                        return col.accessor(payment);
                                    }
                                    return payment[col.accessor];
                                }))}
                            />
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
