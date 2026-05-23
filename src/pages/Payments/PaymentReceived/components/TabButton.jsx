import React from 'react';

const TabButton = ({ active, label, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group ${
            active 
                ? 'text-slate-900' 
                : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        <Icon size={14} className={active ? 'text-slate-900' : 'text-slate-400'} />
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full" />
        )}
        {!active && (
            <div className="absolute bottom-0 left-0 w-0 h-1 bg-slate-200 group-hover:w-full transition-all duration-300" />
        )}
    </button>
);

export default TabButton;
