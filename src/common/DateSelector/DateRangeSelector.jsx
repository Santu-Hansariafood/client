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
        <div className={`group relative flex items-stretch gap-0 rounded-2xl border border-[#e6dcc4] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] transition-all duration-200 hover:border-[#dccfa8] hover:shadow-[0_18px_40px_-22px_rgba(6,95,70,0.42)] focus-within:ring-2 focus-within:ring-lux-gold/50 focus-within:border-lux-gold ${className}`}>
            <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 border-r border-[#ece4d2]">
                <div className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-xl transition-colors ${startDate ? 'bg-lux-emerald/10 text-lux-emerald' : 'bg-lux-ivory text-lux-muted'}`}>
                    <FaCalendarAlt size={13} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-lux-muted leading-none mb-1">From</span>
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className={`text-[12.5px] font-bold outline-none bg-transparent cursor-pointer h-5 w-full min-w-0 tabular-nums ${!startDate ? 'text-lux-muted' : 'text-lux-ink'}`}
                        title="From Date"
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-center px-1">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 ${startDate && endDate ? 'bg-lux-emerald text-white shadow-sm shadow-[0_10px_24px_-10px_rgba(6,95,70,0.5)]' : 'bg-lux-ivory text-lux-muted group-hover:bg-[#f2eee2] group-hover:text-lux-ink'}`}>
                    <FaArrowRight size={9} />
                </div>
            </div>
            
            <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 flex-row-reverse border-l border-[#ece4d2]">
                <div className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-xl transition-colors ${endDate ? 'bg-lux-gold/10 text-[#a3873f]' : 'bg-lux-ivory text-lux-muted'}`}>
                    <FaCalendarAlt size={13} />
                </div>
                <div className="flex flex-col min-w-0 flex-1 items-end">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-lux-muted leading-none mb-1">To</span>
                    <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className={`text-[12.5px] font-bold outline-none bg-transparent cursor-pointer h-5 w-full min-w-0 text-right tabular-nums ${!endDate ? 'text-lux-muted' : 'text-lux-ink'}`}
                        title="To Date"
                    />
                </div>
            </div>

            {onClear && (startDate || endDate) && (
                <button 
                    onClick={onClear}
                    className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600 hover:scale-110 transition-all duration-200 z-10"
                    title="Clear Dates"
                >
                    <FaTimes size={9} />
                </button>
            )}
        </div>
    );
};

export default DateRangeSelector;
