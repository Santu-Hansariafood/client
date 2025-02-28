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
    <div className="flex flex-col items-center mt-4">
      <div className="flex justify-center space-x-2 mb-2">
        {pageGroups.map((group) => (
          <button
            key={group}
            onClick={() => setCurrentGroup(group)}
            className={`px-3 py-1 rounded ${
              currentGroup === group
                ? "bg-blue-500 text-white"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            {group}
          </button>
        ))}
      </div>
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded ${
            currentPage === 1 && "cursor-not-allowed opacity-50"
          }`}
        >
          Previous
        </button>

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded ${
              currentPage === number
                ? "bg-blue-500 text-white"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded ${
            currentPage === totalPages && "cursor-not-allowed opacity-50"
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
