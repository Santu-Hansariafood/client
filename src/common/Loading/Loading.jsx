const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />

        <div>
          <h2 className="text-lg font-semibold text-slate-800">Loading...</h2>

          <p className="text-sm text-slate-500">
            Please wait while we prepare your workspace
          </p>
        </div>

        <a
          href="https://www.speedtest.net"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
        >
          Internet slow? Check speed with Speedtest
        </a>
      </div>
    </div>
  );
};

export default Loading;
