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

  const goFirst = () => onPageChange(1);
  const goLast = () => onPageChange(totalPages);

  return (
    <div className="flex flex-col items-center mt-6">
      <div className="w-full max-w-3xl flex items-center justify-between md:hidden bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          Prev
        </button>
        <div className="text-sm font-semibold text-gray-700">
          Page {currentPage} of {totalPages || 1}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
            currentPage === totalPages || totalPages === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-white text-blue-600 hover:bg-blue-100"
          }`}
        >
          Next
        </button>
      </div>

      <div className="hidden md:flex flex-col items-center w-full">
        <div className="flex justify-center flex-wrap gap-2 mb-3">
          {pageGroups.map((group) => (
            <button
              key={group}
              onClick={() => setCurrentGroup(group)}
              className={`px-3 py-1.5 rounded-xl shadow-sm transition-all duration-200 font-semibold border ${
                currentGroup === group
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white scale-105 border-transparent"
                  : "bg-white text-blue-600 hover:bg-blue-100 border-blue-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 bg-white/90 rounded-2xl shadow p-2 border border-gray-200">
          <button
            onClick={goFirst}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-white text-blue-600 hover:bg-blue-100"
            }`}
          >
            First
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-white text-blue-600 hover:bg-blue-100"
            }`}
          >
            Prev
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm ${
                currentPage === number
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white scale-105 border-transparent"
                  : "bg-white text-blue-600 hover:bg-blue-100 border-blue-200"
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-white text-blue-600 hover:bg-blue-100"
            }`}
          >
            Next
          </button>
          <button
            onClick={goLast}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-200 border border-gray-200 shadow-sm ${
              currentPage === totalPages || totalPages === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                : "bg-white text-blue-600 hover:bg-blue-100"
            }`}
          >
            Last
          </button>
        </div>
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
