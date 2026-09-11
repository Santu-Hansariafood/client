const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-slate-200/80 animate-pulse" />
          <div className="absolute inset-1.5 rounded-full border border-slate-100" />
          <div className="relative h-10 w-10 animate-[spin_1.1s_linear_infinite] rounded-full border-[3px] border-slate-200 border-t-slate-800 border-r-slate-600" />
        </div>

        <p className="text-sm font-medium tracking-[0.12em] text-slate-600 uppercase opacity-80 animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
};

export default Loading;
