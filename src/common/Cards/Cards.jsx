import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Cards = ({ title, count, icon: Icon, link }) => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate(link);
  };

  return (
    <div
      className="relative bg-white p-6 rounded-lg shadow-md transform transition-transform hover:scale-105 hover:shadow-lg hover:bg-gray-50 group"
      onClick={handleRedirect}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full mb-4 group-hover:bg-blue-600 transition-all">
        <Icon className="text-xl" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-700">{count}</p>
      <div
        className="absolute top-6 right-6 p-2 bg-gray-200 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all cursor-pointer"
        onClick={handleRedirect}
      >
        <FaArrowRight />
      </div>
    </div>
  );
};

export default Cards;
