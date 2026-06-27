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
        <div className={`flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all group hover:border-slate-300 focus-within:ring-4 focus-within:ring-slate-900/5 focus-within:border-slate-900 ${className}`}>
            <div className="flex items-center gap-2 flex-1">
                <FaCalendarAlt className={`transition-colors ${startDate ? 'text-slate-900' : 'text-slate-400'}`} size={14} />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 leading-none">From</span>
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className={`text-sm font-medium outline-none bg-transparent cursor-pointer h-6 ${!startDate ? 'text-slate-400' : 'text-slate-900'}`}
                        title="From Date"
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <FaArrowRight className="text-slate-300 group-hover:text-slate-400 transition-colors" size={10} />
                </div>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-end text-right">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 leading-none">To</span>
                    <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className={`text-sm font-medium outline-none bg-transparent cursor-pointer h-6 text-right ${!endDate ? 'text-slate-400' : 'text-slate-900'}`}
                        title="To Date"
                    />
                </div>
                <FaCalendarAlt className={`transition-colors ${endDate ? 'text-slate-900' : 'text-slate-400'}`} size={14} />
            </div>

            {onClear && (startDate || endDate) && (
                <button 
                    onClick={onClear}
                    className="ml-2 p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                    title="Clear Dates"
                >
                    <FaTimes size={10} />
                </button>
            )}
        </div>
    );
};

export default DateRangeSelector;
