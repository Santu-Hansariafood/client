import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();
  const [counter, setCounter] = useState(10);

  useEffect(() => {
    if (counter === 0) {
      navigate("/");
    }
    const timer = setInterval(() => {
      setCounter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [counter, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-yellow-100 px-6 text-center">
      <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
        <p className="font-bold">You are not authorized! Please go back safely.</p>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-4">404 - Page Not Found</h1>
        <p className="text-yellow-600 mb-4">Redirecting in {counter} seconds...</p>
        <div className="flex space-x-4">
          <button
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="w-5 h-5 mr-2" /> Go Back
          </button>
          <button
            className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
            onClick={() => navigate("/")}
          >
            <FaHome className="w-5 h-5 mr-2" /> Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
