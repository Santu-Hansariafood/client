import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane } from "react-icons/fa";
import React from "react";

// eslint-disable-next-line react/display-name
const AIAgentInput = React.memo(({
  input,
  setInput,
  handleSend,
  startListening,
  isListening,
}) => {
  return (
    <div className="p-4 bg-white border-t border-slate-100">
      <div className="relative flex items-center gap-2">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Voice Search"
        >
          {isListening ? (
            <FaMicrophoneSlash size={16} />
          ) : (
            <FaMicrophone size={16} />
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend(null, true)}
          placeholder="Type a command..."
          className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
        />
        <button
          onClick={() => handleSend(null, true)}
          disabled={!input.trim()}
          className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
      <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
        Powered by Saria AI • Minimal Commands Supported
      </p>
    </div>
  );
});

export default AIAgentInput;
