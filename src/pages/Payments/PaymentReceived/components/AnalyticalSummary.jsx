import React from 'react';
import { FaChartBar, FaChartLine, FaArrowRight } from 'react-icons/fa';

const AnalyticalSummary = ({ summaryType, setSummaryType, summary }) => {
    return (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {summary.map((item, idx) => {
                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            const periodLabel = summaryType === 'month' ? monthNames[item._id.period - 1] : `Week ${item._id.period}`;
                            const netBalance = (item.received || 0) - (item.sent || 0);

                            return (
                                <div key={idx} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full -mr-20 -mt-20 group-hover:bg-slate-900 transition-colors duration-500"></div>
                                    
                                    <div className="relative z-10 flex-1">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{item._id.year}</span>
                                                <h4 className="text-2xl font-black text-slate-900 italic group-hover:text-white transition-colors">{periodLabel}</h4>
                                            </div>
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all duration-500 shadow-sm">
                                                <FaChartLine size={24} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                                                    <span>Payment Received</span>
                                                    <span className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{item.receivedCount || 0} Entries</span>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-white transition-colors">
                                                    Rs. {(item.received || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">
                                                    <span>Payment Sent</span>
                                                    <span className="bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{item.sentCount || 0} Entries</span>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-white transition-colors">
                                                    Rs. {(item.sent || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 group-hover:border-white/10 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60 mb-1">Net Balance</p>
                                                <p className={`text-xl font-black italic ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'} group-hover:text-white transition-colors`}>
                                                    {netBalance >= 0 ? '+' : ''}Rs. {netBalance.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white/10 group-hover:text-white transition-all">
                                                <FaArrowRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
    );
};

export default AnalyticalSummary;
