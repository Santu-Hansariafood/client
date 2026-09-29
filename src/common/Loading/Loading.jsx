const Loading = ({ label = "Loading", fullScreen = true, compact = false }) => {
  const content = (
    <div className="flex flex-col items-center gap-3 sm:gap-4 text-center animate-fade-in">
      <div className={`relative flex items-center justify-center ${compact ? "h-10 w-10 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20"}`}>
        <div className="absolute inset-0 rounded-full border border-slate-100 animate-pulseSlow" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-200 border-r-teal-200 animate-ring-rotate-reverse" />
        <div className="absolute inset-3 sm:inset-4 rounded-full border-2 border-transparent border-t-emerald-500 border-r-cyan-500 animate-ring-rotate" />
        <div className={`absolute rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 animate-pulse shadow-lg shadow-emerald-500/40 ${compact ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-6 sm:w-6"}`} />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className={`font-bold tracking-[0.18em] sm:tracking-[0.2em] text-slate-700 uppercase font-display animate-pulse ${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}>
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 animate-dot-pulse ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} style={{ animationDelay: "0ms" }} />
          <span className={`rounded-full bg-gradient-to-br from-teal-400 to-teal-600 animate-dot-pulse ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} style={{ animationDelay: "160ms" }} />
          <span className={`rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 animate-dot-pulse ${compact ? "w-1.5 h-1.5" : "w-2 h-2"}`} style={{ animationDelay: "320ms" }} />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50/30 to-white px-4">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-8 sm:py-12 px-4">
      {content}
    </div>
  );
};

export default Loading;
