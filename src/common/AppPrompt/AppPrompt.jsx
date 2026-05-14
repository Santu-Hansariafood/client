import React, { useState, useEffect } from "react";
import {
  FaMobileAlt,
  FaGooglePlay,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";

const AppPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent,
      );
    const isDismissed = sessionStorage.getItem("appPromptDismissed");

    if (isMobile && !isDismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("appPromptDismissed", "true");
  };

  const handleOpenApp = () => {
    const intentUrl =
      "intent://bid.hansariafood.in#Intent;scheme=https;package=com.hansariafood.bid;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.hansariafood.bid;end";
    window.location.href = intentUrl;
    handleDismiss();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 animate-fade-in-up">
      <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <FaTimes size={18} />
        </button>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <FaMobileAlt size={28} className="text-white" />
          </div>

          <div className="flex-1">
            <h4 className="text-lg font-black tracking-tight leading-tight">
              Better in the App
            </h4>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Open in Hansaria Bid App for the full intelligence experience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
          <button
            onClick={handleOpenApp}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <FaExternalLinkAlt size={14} />
            Open App
          </button>

          <a
            href="https://play.google.com/store/apps/details?id=com.hansariafood.bid"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs uppercase tracking-widest border border-white/5 transition-all active:scale-95"
          >
            <FaGooglePlay size={14} />
            Get App
          </a>
        </div>
      </div>
    </div>
  );
};

export default AppPrompt;
