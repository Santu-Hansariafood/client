import React from "react";
import { useNavigate } from "react-router-dom";

const BidHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-semibold mb-3">Bid History</h2>

        <p className="text-gray-600 mb-6">
          Technical team is working on this. Live soon.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default BidHistory;