import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";

const SearchBox = ({
  placeholder,
  items,
  onSearch,
  className = "",
  debounceMs = 200,
  returnQuery = false,
  value: externalValue = undefined,
  expandable = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(externalValue || "");
  const [debouncedTerm, setDebouncedTerm] = useState(externalValue || "");
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!expandable);

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== searchTerm) {
      setSearchTerm(externalValue);
      setDebouncedTerm(externalValue);
    }
  }, [externalValue]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (returnQuery) {
      onSearch("");
    } else {
      onSearch(normalizedItems);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm), debounceMs);
    return () => clearTimeout(handle);
  }, [searchTerm, debounceMs]);

  const normalizedItems = useMemo(
    () =>
      Array.isArray(items)
        ? items.map((item) => {
            if (typeof item === "object" && item !== null) {
              return Object.values(item).join(" ");
            }
            return String(item ?? "");
          })
        : [],
    [items],
  );

  useEffect(() => {
    const q = String(debouncedTerm ?? "").trim();
    if (returnQuery) {
      onSearch(q);
      return;
    }
    const lowered = q.toLowerCase();
    if (!lowered) {
      onSearch(normalizedItems);
      return;
    }
    const filtered = normalizedItems.filter((item) =>
      item.toLowerCase().includes(lowered),
    );
    onSearch(filtered);
  }, [debouncedTerm, normalizedItems, onSearch, returnQuery]);

  if (expandable && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`
          flex items-center justify-center shrink-0
          w-12 h-12 sm:w-11 sm:h-11
          rounded-2xl
          bg-white border border-slate-200
          text-emerald-600
          shadow-md shadow-slate-900/5
          transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
          hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-lg
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-emerald-400/50
          ${className}
        `}
        aria-label="Open search"
      >
        <FiSearch className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
      </button>
    );
  }

  return (
    <div
      className={`
        relative group animate-scale-in
        ${expandable ? "w-full sm:w-auto" : "w-full max-w-md"}
        ${className}
      `}
      role="search"
      aria-label="Search items"
    >
      <div
        className={`
          absolute -inset-0.5 rounded-2xl transition-all duration-400 ease-out pointer-events-none opacity-0 blur-md
          ${isFocused ? "opacity-100 bg-gradient-to-r from-emerald-400/25 via-cyan-400/25 to-teal-400/25" : ""}
        `}
      />
      <div
        className={`
          relative flex items-center
          w-full sm:min-w-[280px] sm:max-w-sm
          bg-white border-2
          rounded-2xl
          px-3.5 sm:px-4 py-2.5 sm:py-3
          transition-all duration-350 cubic-bezier(0.2, 0.8, 0.2, 1)
          ${isFocused
            ? "border-emerald-500 ring-4 ring-emerald-500/12 shadow-xl shadow-emerald-900/10 scale-[1.01]"
            : "border-slate-200 shadow-md shadow-slate-900/5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10"
          }
        `}
      >
        <div className={`
          shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl
          transition-all duration-300
          ${isFocused ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-110 shadow-md shadow-emerald-500/30" : "bg-emerald-50 text-emerald-600/80 group-hover:bg-emerald-100 group-hover:text-emerald-700"}
        `}>
          <FiSearch
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-300"
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (expandable && !searchTerm) setIsExpanded(false);
          }}
          placeholder={placeholder || "Search..."}
          autoComplete="off"
          className="w-full min-w-0 px-3 sm:px-3.5 py-1.5 bg-transparent text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:outline-none tracking-tight"
          aria-label={placeholder || "Search"}
          autoFocus={expandable}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="
              shrink-0 flex items-center justify-center
              w-8 h-8 sm:w-9 sm:h-9 rounded-xl
              text-slate-400
              transition-all duration-250 ease-out
              hover:text-red-500 hover:bg-red-50 hover:scale-110
              focus:outline-none focus:ring-2 focus:ring-red-400/40
              animate-pop-in
            "
            aria-label="Clear search"
            title="Clear"
          >
            <IoCloseCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          </button>
        )}
      </div>

      <div
        className={`
          absolute inset-x-5 sm:inset-x-6 bottom-0 h-0.5 rounded-full
          transition-all duration-400 ease-out origin-left pointer-events-none
          ${isFocused ? "scale-x-100 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient-border" : "scale-x-0 bg-transparent"}
        `}
      />
    </div>
  );
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSearch: PropTypes.func.isRequired,
  className: PropTypes.string,
  debounceMs: PropTypes.number,
  returnQuery: PropTypes.bool,
  expandable: PropTypes.bool,
};

export default SearchBox;
