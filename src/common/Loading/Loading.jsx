const Loading = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/60 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-300/30 blur-3xl rounded-full animate-pulse" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
              <div className="w-8 h-8 rounded-full border-[3px] border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>

            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 ring-4 ring-white animate-ping" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-900 tracking-tight">
              Loading...
            </p>
            <p className="text-sm text-slate-500">Preparing your workspace</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 relative z-10">
          <div className="h-3 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          <div className="h-3 rounded-full w-11/12 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          <div className="h-3 rounded-full w-9/12 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-medium relative z-10">
          <span className="px-2 py-1 rounded-full bg-slate-100">🔒 Secure</span>
          <span className="px-2 py-1 rounded-full bg-slate-100">⚡ Fast</span>
          <span className="px-2 py-1 rounded-full bg-slate-100">
            ✔ Reliable
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
