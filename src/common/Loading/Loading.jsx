const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-yellow-50 to-gray-100">
      <div className="backdrop-blur-md bg-white/60 rounded-2xl shadow-2xl border border-white/40 px-10 py-8 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-6">
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-400 via-yellow-300 to-green-600 opacity-30 animate-pulse"></span>
          <svg className="w-20 h-20 animate-spin-slow relative z-10" viewBox="0 0 80 80">
            <circle
              className="text-green-400 opacity-30"
              cx="40" cy="40" r="32"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
            />
            <circle
              className="text-yellow-400"
              cx="40" cy="40" r="32"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray="60 200"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 drop-shadow-sm mb-2 tracking-wide">Loading...</h2>
        <p className="text-gray-600 text-base">Please wait, your network is slow.</p>
      </div>
    </div>
  );
};

export default Loading;
