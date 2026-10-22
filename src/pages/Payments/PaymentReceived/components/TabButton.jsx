import React from "react";

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group ${
      active
        ? "font-serif font-semibold text-lux-ink"
        : "text-lux-muted hover:text-lux-ink"
    }`}
  >
    <Icon size={14} className={active ? "text-lux-ink" : "text-lux-muted"} />
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-lux-gold rounded-t-full" />
    )}
    {!active && (
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-lux-gold-soft group-hover:w-full transition-all duration-300" />
    )}
  </button>
);

export default TabButton;
