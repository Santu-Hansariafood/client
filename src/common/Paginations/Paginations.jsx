import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [currentGroup, setCurrentGroup] = useState(1);
  const pagesPerGroup = 5;
  const paginationStep = totalPages > 100 ? 100 : 10;

  useEffect(() => {
    setCurrentGroup(Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1);
  }, [currentPage, totalPages]);

  const pageGroups = [];
  for (let i = 1; i <= totalPages; i += paginationStep) {
    pageGroups.push(i);
  }

  const pageNumbers = [];
  const start = currentGroup;
  const end = Math.min(start + pagesPerGroup - 1, totalPages);
  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  const goFirst = () => onPageChange(1);
  const goLast = () => onPageChange(totalPages);

  const btnBase = "inline-flex items-center justify-center min-w-[2.5rem] h-10 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2";
  const btnDisabled = "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500";
  const btnActive = "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm";
  const btnDefault = "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700";
  const btnPrimary = "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-sm shadow-emerald-500/20";

  return (
    <div className="flex flex-col items-center gap-4 mt-6 w-full">
      {/* Mobile: compact prev/next */}
      <div className="flex items-center justify-between w-full max-w-sm md:hidden gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 shadow-sm">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} flex-1 py-2.5 ${currentPage === 1 ? btnDisabled : btnActive}`}
        >
          <FaChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </button>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} flex-1 py-2.5 ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnActive}`}
        >
          Next
          <FaChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Desktop: full pagination */}
      <div className="hidden md:flex flex-col items-center w-full gap-4">
        {pageGroups.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {pageGroups.map((group) => (
              <button
                key={group}
                onClick={() => setCurrentGroup(group)}
                className={`${btnBase} px-3 py-2 text-sm ${
                  currentGroup === group ? btnPrimary : btnDefault
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <button
            onClick={goFirst}
            disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnDefault}`}
            title="First page"
          >
            <FaAngleDoubleLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnDefault}`}
            title="Previous"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`${btnBase} ${currentPage === number ? btnPrimary : btnDefault}`}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnDefault}`}
            title="Next"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goLast}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnDefault}`}
            title="Last page"
          >
            <FaAngleDoubleRight className="w-4 h-4" />
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
