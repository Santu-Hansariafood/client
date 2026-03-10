const Loading = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-emerald-50/40">
      <div className="w-full max-w-md rounded-3xl border border-amber-200/60 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-sm p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" style={{ animationDuration: "0.75s" }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-slate-900">Loading…</p>
            <p className="text-sm text-slate-500">Preparing your workspace</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer" />
          <div className="h-3 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer w-11/12" />
          <div className="h-3 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer w-9/12" />
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Secure</span>
          <span className="font-medium">Fast</span>
          <span className="font-medium">Reliable</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
