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
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-lux-ivory scroll-smooth no-scrollbar"
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
                ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/20 rounded-tr-none"
                : "bg-lux-cream border border-[#e9e2d3] text-lux-ink rounded-tl-none"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {msg.call?.phone && (
              <a
                href={`tel:${msg.call.phone}`}
                aria-label={`Call ${msg.call.name}`}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-4 py-2 text-xs font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 transition hover:from-lux-deep hover:to-lux-night"
              >
                <FaPhone size={11} />
                Call {msg.call.name}
              </a>
            )}

            {msg.emailAction && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {emailSentIndex === idx ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-lux-ivory px-4 py-2 text-xs font-bold text-lux-emerald ring-1 ring-[#dccfa8]">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-4 py-2 text-xs font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 transition hover:from-lux-deep hover:to-lux-night disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaEnvelope size={11} />
                    {emailSendingIndex === idx ? "Sending..." : "Confirm & Send PDF"}
                  </button>
                )}
              </div>
            )}

            {msg.role === "user" ? (
              <div
                className="absolute bottom-2 right-2 text-lux-gold-soft/70"
                title="Sent"
              >
                <FaCheck size={12} />
              </div>
            ) : (
              <button
                onClick={() => handleCopy(msg.content, idx)}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-lux-ivory bg-lux-cream/80 text-lux-muted hover:text-lux-emerald backdrop-blur-sm shadow-sm"
                title="Copy message"
              >
                {copiedIndex === idx ? (
                  <FaCheck size={12} className="text-lux-gold" />
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
                    className="text-[11px] font-semibold bg-lux-ivory text-lux-emerald px-3 py-1.5 rounded-full border border-[#e9e2d3] hover:bg-lux-cream hover:border-[#dccfa8] transition-all flex items-center gap-1.5 group"
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
          <div className="bg-lux-cream border border-[#e9e2d3] p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
            <FaSpinner className="animate-spin text-lux-gold" />
            <span className="text-sm text-lux-muted font-medium italic">
              {thinkingPath || "Fetching details..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default AIAgentMessages;
