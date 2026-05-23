import React from 'react';
import { FaFilter, FaMoneyBillWave, FaArrowLeft, FaHistory, FaFileInvoiceDollar } from 'react-icons/fa';
import SearchBox from '../../../../common/SearchBox/SearchBox';
import Loading from '../../../../common/Loading/Loading';
import Tables from '../../../../common/Tables/Tables';
import Paginations from '../../../../common/Paginations/Paginations';

const AllocationLedger = ({ 
    allocationSource, 
    formData, 
    unallocatedBalance, 
    setFormData, 
    tableSearch, 
    setTableSearch, 
    entries, 
    fetchingEntries, 
    filteredEntries, 
    columns, 
    entriesPage, 
    fetchEntries, 
    entriesTotalPages, 
    entryStats, 
    dateTotal,
    ledgerBalance
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                        <FaFilter size={14} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            {formData.ledgerType === 'Buyer' 
                                ? (allocationSource === 'fresh' ? 'Payment Received Ledger' : 'Advance Adjustment')
                                : (allocationSource === 'fresh' ? 'Payment Sent Ledger' : 'Advance Adjustment')
                            }
                            {formData.ledgerType === 'Buyer' && allocationSource === 'fresh' && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full border border-blue-100">
                                    Buyer <FaArrowLeft className="rotate-180 size-2" /> Seller
                                </span>
                            )}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                            {allocationSource === 'fresh' 
                                ? (formData.ledgerType === 'Buyer' ? 'Map received payments to saudas' : 'Map sent payments to saudas')
                                : `Using ₹${ledgerBalance.advanceBalance.toLocaleString()} Credit`
                            }
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {allocationSource === 'fresh' && formData.amount > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-700 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 leading-none mb-1">
                                    {formData.ledgerType === 'Buyer' ? 'Available to Allocate' : 'Available to Send'}
                                </span>
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
                                totalItems={entriesTotalPages * 20}
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
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                                        {formData.ledgerType === 'Buyer' ? 'Date Received' : 'Date Sent'}
                                    </p>
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
    );
};

export default AllocationLedger;
