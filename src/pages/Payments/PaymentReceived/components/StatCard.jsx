import React from 'react';

const StatCard = ({ icon, label, value, subValue, color, iconColor, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
        <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${color} ${iconColor}`}>
                {icon}
            </div>
            {subValue && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight italic">{value}</p>
        </div>
    </div>
);

export default StatCard;
