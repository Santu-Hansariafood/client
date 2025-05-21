import PropTypes from "prop-types";
import { useState } from "react";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [currentGroup, setCurrentGroup] = useState(
    Math.floor((currentPage - 1) / 10) * 10 + 1
  );
  const paginationStep = totalPages > 100 ? 100 : 10;

  const pageGroups = [];
  for (let i = 1; i <= totalPages; i += paginationStep) {
    pageGroups.push(i);
  }

  const pageNumbers = [];
  for (let i = currentGroup; i < currentGroup + 10 && i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col items-center mt-6">
      <div className="flex justify-center space-x-2 mb-3">
        {pageGroups.map((group) => (
          <button
            key={group}
            onClick={() => setCurrentGroup(group)}
            className={`px-3 py-1 rounded-lg shadow transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400/60 border border-transparent ${
              currentGroup === group
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white scale-105"
                : "bg-white text-blue-600 hover:bg-blue-100 border-blue-200"
            }`}
          >
            {group}
          </button>
        ))}
      </div>
      <div className="flex justify-center space-x-2 bg-white/80 rounded-xl shadow p-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          Previous
        </button>

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/60 shadow-sm ${
              currentPage === number
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white scale-105"
                : "bg-white text-blue-600 hover:bg-blue-100 border-blue-200"
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
