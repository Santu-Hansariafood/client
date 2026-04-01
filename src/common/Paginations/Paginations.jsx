import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showGoTo = true,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [currentGroup, setCurrentGroup] = useState(1);
  const pagesPerGroup = 5;
  const [gotoValue, setGotoValue] = useState("");

  useEffect(() => {
    setCurrentGroup(
      Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1
    );
  }, [currentPage, totalPages]);

  const pageGroups = [];
  for (let i = 1; i <= totalPages; i += pagesPerGroup) {
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
  const btnDisabled = "bg-slate-100 text-slate-400 cursor-not-allowed";
  const btnActive = "bg-slate-900 text-white hover:bg-slate-800 shadow-sm";
  const btnDefault = "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300";
  const btnPrimary = "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-sm shadow-emerald-500/20";

  return (
    <div className="flex flex-col items-center gap-4 mt-6 w-full">
      <div className="w-full flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing{" "}
          {totalItems === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1}
          {" - "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <select
              className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-slate-700"
              value={itemsPerPage}
              onChange={(e) => {
                const size = Number(e.target.value);
                onPageSizeChange(size);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between w-full max-w-sm md:hidden gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} flex-1 py-2.5 ${currentPage === 1 ? btnDisabled : btnActive}`}
        >
          <FaChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </button>
        <span className="text-sm font-medium text-slate-600 shrink-0">
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

      <div className="hidden md:flex flex-col items-center w-full gap-4">
        {pageGroups.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {pageGroups.map((group) => (
              <button
                key={group}
                onClick={() => {
                  setCurrentGroup(group);
                  onPageChange(group);
                }}
                className={`${btnBase} px-3 py-2 text-sm ${
                  currentGroup === group ? btnPrimary : btnDefault
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
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
          {showGoTo && (
            <div className="ml-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Go to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={gotoValue}
                onChange={(e) => setGotoValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = Math.max(1, Math.min(totalPages, Number(gotoValue || "1")));
                    onPageChange(n);
                    setGotoValue("");
                  }
                }}
                className="w-16 h-9 px-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                placeholder="Pg"
                aria-label="Go to page"
              />
              <button
                onClick={() => {
                  const n = Math.max(1, Math.min(totalPages, Number(gotoValue || "1")));
                  onPageChange(n);
                  setGotoValue("");
                }}
                className={`${btnBase} ${btnDefault} h-9 min-w-[2.25rem]`}
              >
                Go
              </button>
            </div>
          )}
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
  onPageSizeChange: PropTypes.func,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  showPageSize: PropTypes.bool,
  showGoTo: PropTypes.bool,
};

export default Pagination;
