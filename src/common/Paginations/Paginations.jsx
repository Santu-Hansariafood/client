import PropTypes from "prop-types";
import { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

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
  const [gotoValue, setGotoValue] = useState("");

  const getVisiblePages = () => {
    const pages = [];
    const delta = 1;

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (rangeStart > 2) pages.push("...");

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const btnBase =
    "inline-flex items-center justify-center min-w-[2.4rem] h-9 px-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50";

  const btnDefault =
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300";

  const btnActive =
    "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700";

  const btnDisabled =
    "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200";

  return (
    <div className="w-full flex flex-col gap-3 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-slate-600">
        <span>
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}{" "}
          - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-400/40"
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

      <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${
            currentPage === 1 ? btnDisabled : btnDefault
          }`}
        >
          <FaAngleDoubleLeft />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${
            currentPage === 1 ? btnDisabled : btnDefault
          }`}
        >
          <FaChevronLeft />
        </button>

        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`${btnBase} ${
              currentPage === page
                ? btnActive
                : page === "..."
                  ? "cursor-default text-slate-400"
                  : btnDefault
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${
            currentPage === totalPages ? btnDisabled : btnDefault
          }`}
        >
          <FaChevronRight />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${
            currentPage === totalPages ? btnDisabled : btnDefault
          }`}
        >
          <FaAngleDoubleRight />
        </button>

        {showGoTo && (
          <div className="ml-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = Math.max(
                    1,
                    Math.min(totalPages, Number(gotoValue || "1")),
                  );
                  onPageChange(n);
                  setGotoValue("");
                }
              }}
              className="w-16 h-9 px-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-400/40"
              placeholder="Pg"
            />
            <button
              onClick={() => {
                const n = Math.max(
                  1,
                  Math.min(totalPages, Number(gotoValue || "1")),
                );
                onPageChange(n);
                setGotoValue("");
              }}
              className={`${btnBase} ${btnDefault}`}
            >
              Go
            </button>
          </div>
        )}
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
