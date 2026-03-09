const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-6 p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
          <div
            className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"
            style={{ animationDuration: "0.8s" }}
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">Loading</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
