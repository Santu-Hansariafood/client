import { FaRobot, FaTimes } from "react-icons/fa";

const AIAgentFab = ({ isOpen, isMinimized, setIsMinimized, setIsOpen }) => {
  return (
    <div className="flex flex-col items-end gap-3">
      {isMinimized && isOpen && (
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-5 duration-300 mb-2">
          <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            saria.ai is active
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
              ? "bg-slate-800 rotate-90 scale-90"
              : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-110 hover:-translate-y-1 active:scale-95 shadow-emerald-200"
          }
        `}
      >
        {isOpen && !isMinimized ? (
          <FaTimes className="text-white text-2xl -rotate-90" />
        ) : (
          <>
            <div className="absolute inset-0 bg-white/20 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <FaRobot className="text-white text-3xl drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full shadow-sm" />
          </>
        )}
      </button>
    </div>
  );
};

export default AIAgentFab;
