import { FaRobot, FaMinus, FaTrash, FaTimes } from "react-icons/fa";

const AIAgentHeader = ({ setIsMinimized, clearHistory, setIsOpen }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <FaRobot className="text-xl animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-wide">Saria AI</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          title="Minimize"
        >
          <FaMinus size={14} />
        </button>
        <button
          onClick={clearHistory}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          title="Clear History"
        >
          <FaTrash size={14} />
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          title="Close"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

export default AIAgentHeader;
