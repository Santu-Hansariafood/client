import { FaRobot, FaMinus, FaTrash, FaTimes } from "react-icons/fa";
import React from "react";

// eslint-disable-next-line react/display-name
const AIAgentHeader = React.memo(({ setIsMinimized, clearHistory, setIsOpen }) => {
  return (
    <div className="bg-gradient-to-br from-lux-emerald to-lux-deep p-4 flex items-center justify-between text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-lux-gold/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <FaRobot className="text-xl animate-pulse" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-sm tracking-wide">Saria AI</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-lux-gold rounded-full animate-ping" />
            <span className="text-[10px] text-lux-gold-soft font-display font-medium uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 hover:bg-lux-gold/15 rounded-xl transition-colors"
          title="Minimize"
        >
          <FaMinus size={14} />
        </button>
        <button
          onClick={clearHistory}
          className="p-2 hover:bg-lux-gold/15 rounded-xl transition-colors"
          title="Clear History"
        >
          <FaTrash size={14} />
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-lux-gold/15 rounded-xl transition-colors"
          title="Close"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
});

export default AIAgentHeader;
