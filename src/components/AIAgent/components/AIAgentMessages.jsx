import { useState, useCallback } from "react";
import { FaArrowRight, FaSpinner, FaCopy, FaCheck, FaPhone, FaEnvelope } from "react-icons/fa";
import React from "react";

// eslint-disable-next-line react/display-name
const AIAgentMessages = React.memo(({
  messages,
  isLoadingData,
  thinkingPath,
  handleSend,
  scrollRef,
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [emailSendingIndex, setEmailSendingIndex] = useState(null);
  const [emailSentIndex, setEmailSentIndex] = useState(null);

  const handleCopy = useCallback((text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth no-scrollbar"
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${
            msg.role === "user" ? "justify-end" : "justify-start"
          } animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div
            className={`group relative max-w-[85%] rounded-2xl p-3.5 pb-8 shadow-sm ${
              msg.role === "user"
                ? "bg-emerald-600 text-white rounded-tr-none"
                : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {msg.call?.phone && (
              <a
                href={`tel:${msg.call.phone}`}
                aria-label={`Call ${msg.call.name}`}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                <FaPhone size={11} />
                Call {msg.call.name}
              </a>
            )}

            {msg.emailAction && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {emailSentIndex === idx ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
                    <FaCheck size={11} /> Email sent
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={emailSendingIndex === idx}
                    onClick={async () => {
                      setEmailSendingIndex(idx);
                      try {
                        await msg.emailAction.onConfirm();
                        setEmailSentIndex(idx);
                      } catch (error) {
                        console.error("AI email send failed:", error);
                      } finally {
                        setEmailSendingIndex(null);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaEnvelope size={11} />
                    {emailSendingIndex === idx ? "Sending..." : "Confirm & Send PDF"}
                  </button>
                )}
              </div>
            )}

            {msg.role === "user" ? (
              <div
                className="absolute bottom-2 right-2 text-white/70"
                title="Sent"
              >
                <FaCheck size={12} />
              </div>
            ) : (
              <button
                onClick={() => handleCopy(msg.content, idx)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-slate-200 bg-white/70 text-slate-400 hover:text-slate-600 backdrop-blur-sm shadow-sm"
                title="Copy message"
              >
                {copiedIndex === idx ? (
                  <FaCheck size={12} className="text-emerald-500" />
                ) : (
                  <FaCopy size={12} />
                )}
              </button>
            )}

            {msg.suggestions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s, true)}
                    className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all flex items-center gap-1.5 group"
                  >
                    {s}
                    <FaArrowRight
                      size={8}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {(isLoadingData || thinkingPath) && (
        <div className="flex justify-start animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600" />
            <span className="text-sm text-slate-500 font-medium italic">
              {thinkingPath || "Fetching details..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default AIAgentMessages;
