import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
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
  showGoTo = true,
}) => {
  const normalizedCurrentPage = Number.isFinite(Number(currentPage))
    ? Number(currentPage)
    : 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const [gotoValue, setGotoValue] = useState("");
  const safeCurrentPage = Math.min(
    Math.max(1, normalizedCurrentPage),
    totalPages,
  );

  useEffect(() => {
    if (totalItems > 0 && onPageChange && safeCurrentPage !== normalizedCurrentPage) {
      onPageChange(safeCurrentPage);
    }
  }, [normalizedCurrentPage, safeCurrentPage, onPageChange, totalItems]);

  const getVisiblePages = useCallback(() => {
    const pages = [];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const delta = isMobile ? 0 : 1;

    const rangeStart = Math.max(2, safeCurrentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, safeCurrentPage + delta);

    pages.push(1);

    if (rangeStart > 2) pages.push("...");

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [safeCurrentPage, totalPages]);

  const btnBaseMobile =
    "inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[2.4rem] h-10 sm:h-9 px-1.5 sm:px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-250 ease-out focus:outline-none focus:ring-2 focus:ring-lux-gold/50 select-none active:scale-95";

  const btnDefault =
    "bg-lux-cream text-lux-muted border border-[#e6dcc4] hover:bg-lux-ivory hover:border-[#dccfa8] hover:text-lux-emerald hover:-translate-y-0.5 shadow-sm hover:shadow-md";

  const btnActive =
    "bg-gradient-to-br from-lux-emerald to-lux-deep text-white ring-1 ring-lux-gold/40 shadow-lg shadow-lux-emerald/25 hover:from-lux-deep hover:to-lux-deep animate-scale-in";

  const btnDisabled =
    "bg-[#f7f4ec] text-lux-muted/50 cursor-not-allowed border border-[#e9e2d3] opacity-60";

  const navBtnBase =
    "inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl transition-all duration-250 ease-out focus:outline-none focus:ring-2 focus:ring-lux-gold/50 select-none active:scale-95";

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 mt-5 sm:mt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm text-lux-muted px-1">
        <span className="font-semibold tracking-wide text-center sm:text-left">
          Showing <span className="text-lux-emerald font-bold">{totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}</span>
          {" - "}
          <span className="text-lux-emerald font-bold">{Math.min(safeCurrentPage * itemsPerPage, totalItems)}</span>
          {" of "}
          <span className="text-lux-gold font-extrabold">{totalItems}</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2eee2] text-lux-gold text-xs font-bold border border-[#e6dcc4] font-serif">
          Page {safeCurrentPage} / {totalPages}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-lux-cream via-lux-cream to-[#f7f4ec] backdrop-blur border border-[#e9e2d3] shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)]">
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className={`${navBtnBase} ${
            safeCurrentPage === 1 ? btnDisabled : btnDefault
          }`}
          title="First page"
        >
          <FaAngleDoubleLeft className="text-sm sm:text-base" />
        </button>

        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className={`${navBtnBase} ${
            safeCurrentPage === 1 ? btnDisabled : btnDefault
          }`}
          title="Previous page"
        >
          <FaChevronLeft className="text-sm sm:text-base" />
        </button>

        <div className="flex items-center gap-1 px-1 sm:px-1.5">
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className={`${btnBaseMobile} ${
                safeCurrentPage === page
                  ? btnActive
                  : page === "..."
                    ? "cursor-default text-lux-muted font-bold min-w-[1.5rem]"
                    : btnDefault
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className={`${navBtnBase} ${
            safeCurrentPage === totalPages ? btnDisabled : btnDefault
          }`}
          title="Next page"
        >
          <FaChevronRight className="text-sm sm:text-base" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          className={`${navBtnBase} ${
            safeCurrentPage === totalPages ? btnDisabled : btnDefault
          }`}
          title="Last page"
        >
          <FaAngleDoubleRight className="text-sm sm:text-base" />
        </button>

        {showGoTo && totalPages > 5 && (
          <div className="w-full sm:w-auto sm:ml-2 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ece4d2] mt-1 sm:mt-0">
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
              className="w-full sm:w-16 h-10 sm:h-9 px-3 sm:px-2 rounded-xl border border-[#e6dcc4] text-sm font-semibold text-lux-ink placeholder:text-lux-muted focus:ring-2 focus:ring-lux-gold/40 focus:border-lux-gold transition-all outline-none bg-lux-cream"
              placeholder="Go to page"
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
              className="shrink-0 inline-flex items-center justify-center h-10 sm:h-9 px-4 sm:px-3 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-white text-xs sm:text-sm font-bold shadow-md shadow-lux-emerald/20 hover:from-lux-deep hover:to-lux-deep hover:shadow-lg hover:shadow-lux-emerald/30 transition-all duration-250 active:scale-95 focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
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
  showGoTo: PropTypes.bool,
};

export default Pagination;
