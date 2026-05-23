import React from 'react';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-slate-900/5 focus-within:border-slate-900 ${className}`}>
            <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-slate-400 text-xs" />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    title="From Date"
                />
            </div>
            
            <div className="h-4 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-2">
                <FaArrowRight className="text-slate-300 text-[10px]" />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    title="To Date"
                />
            </div>
        </div>
    );
};

export default DateRangeSelector;
