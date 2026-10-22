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
    <div className="p-4 bg-lux-cream border-t border-[#e9e2d3]">
      <div className="relative flex items-center gap-2">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-lux-ivory text-lux-muted hover:bg-[#ece4d2] hover:text-lux-emerald"
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
          className="flex-1 bg-lux-ivory text-lux-ink border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-lux-gold/50 focus:border-lux-gold/40 outline-none transition-all placeholder:text-lux-muted/70"
        />
        <button
          onClick={() => handleSend(null, true)}
          disabled={!input.trim()}
          className="w-11 h-11 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 rounded-2xl flex items-center justify-center hover:from-lux-deep hover:to-lux-night disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-lux-emerald/30"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
      <p className="mt-2 text-[10px] text-center text-lux-muted font-medium">
        Powered by Saria AI • Minimal Commands Supported
      </p>
    </div>
  );
});

export default AIAgentInput;
