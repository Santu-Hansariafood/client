import { FaRobot, FaTimes } from "react-icons/fa";
import React from "react";

// eslint-disable-next-line react/display-name
const AIAgentFab = React.memo(({ isOpen, isMinimized, setIsMinimized, setIsOpen }) => {
  return (
    <div className="flex flex-col items-end gap-3">
      {isMinimized && isOpen && (
        <div className="bg-lux-cream px-4 py-2 rounded-2xl shadow-xl shadow-lux-emerald/20 border border-[#e9e2d3] animate-in fade-in slide-in-from-right-5 duration-300 mb-2">
          <p className="text-xs font-bold text-lux-ink flex items-center gap-2">
            <span className="w-2 h-2 bg-lux-gold rounded-full animate-pulse" />
            Saria AI is active
          </p>
        </div>
      )}

      <button
        onClick={() => {
          if (isOpen && isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`
          group relative w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-2xl
          ${
            isOpen && !isMinimized
              ? "bg-lux-night ring-1 ring-lux-gold/30 rotate-90 scale-90"
              : "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 hover:from-lux-deep hover:to-lux-night hover:scale-110 hover:-translate-y-1 active:scale-95 shadow-lux-emerald/30"
          }
        `}
      >
        {isOpen && !isMinimized ? (
          <FaTimes className="text-lux-gold-soft text-2xl -rotate-90" />
        ) : (
          <>
            <div className="absolute inset-0 bg-lux-gold/25 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <FaRobot className="text-lux-gold-soft text-3xl drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-lux-gold border-4 border-lux-cream rounded-full shadow-sm" />
          </>
        )}
      </button>
    </div>
  );
});

export default AIAgentFab;
