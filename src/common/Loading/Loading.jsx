const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-1/2 h-full border-t-4 border-l-4 border-green-500 rounded-full animate-spin-clockwise"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full border-t-4 border-r-4 border-yellow-500 rounded-full animate-spin-counter"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        <p className="text-gray-500">Please wait your network is slow.</p>
      </div>
    </div>
  );
};

export default Loading;
