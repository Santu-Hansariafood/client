import React from 'react';
import { FaCalendarAlt, FaArrowRight, FaTimes } from 'react-icons/fa';

const DateRangeSelector = ({ 
    startDate, 
    endDate, 
    onStartDateChange, 
    onEndDateChange, 
    onClear,
    className = "" 
}) => {
    return (
        <div className={`group relative flex items-stretch gap-0 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)] focus-within:ring-2 focus-within:ring-emerald-500/15 focus-within:border-emerald-500/60 ${className}`}>
            <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 border-r border-slate-100">
                <div className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-xl transition-colors ${startDate ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                    <FaCalendarAlt size={13} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none mb-1">From</span>
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className={`text-[12.5px] font-bold outline-none bg-transparent cursor-pointer h-5 w-full min-w-0 tabular-nums ${!startDate ? 'text-slate-400' : 'text-slate-800'}`}
                        title="From Date"
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-center px-1">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 ${startDate && endDate ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400'}`}>
                    <FaArrowRight size={9} />
                </div>
            </div>
            
            <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 flex-row-reverse border-l border-slate-100">
                <div className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-xl transition-colors ${endDate ? 'bg-blue-500/10 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                    <FaCalendarAlt size={13} />
                </div>
                <div className="flex flex-col min-w-0 flex-1 items-end">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none mb-1">To</span>
                    <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className={`text-[12.5px] font-bold outline-none bg-transparent cursor-pointer h-5 w-full min-w-0 text-right tabular-nums ${!endDate ? 'text-slate-400' : 'text-slate-800'}`}
                        title="To Date"
                    />
                </div>
            </div>

            {onClear && (startDate || endDate) && (
                <button 
                    onClick={onClear}
                    className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 hover:scale-110 transition-all duration-200 z-10"
                    title="Clear Dates"
                >
                    <FaTimes size={9} />
                </button>
            )}
        </div>
    );
};

export default DateRangeSelector;
