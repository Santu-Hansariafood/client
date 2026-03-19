import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";

const SearchBox = ({
  placeholder,
  items,
  onSearch,
  className = "",
  debounceMs = 250,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
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
    [items]
  );

  useEffect(() => {
    const q = String(debouncedTerm ?? "").trim().toLowerCase();
    if (!q) {
      onSearch(normalizedItems);
      return;
    }
    const filtered = normalizedItems.filter((item) =>
      item.toLowerCase().includes(q)
    );
    onSearch(filtered);
  }, [debouncedTerm, normalizedItems, onSearch]);

  return (
    <div
      className={`flex items-center w-full max-w-md bg-white border border-emerald-100 rounded-xl px-4 py-2.5 shadow-md shadow-emerald-900/5 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:border-emerald-400 ${className}`}
      role="search"
      aria-label="Search items"
    >
      <FiSearch
        className="text-emerald-600/70 shrink-0"
        size={20}
        aria-hidden="true"
      />
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder || "Search..."}
        autoComplete="off"
        className="w-full min-w-0 px-3 py-2 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
        aria-label={placeholder || "Search"}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={clearSearch}
          className="ml-1 p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          aria-label="Clear search"
          title="Clear"
        >
          <IoCloseCircle size={20} />
        </button>
      )}
    </div>
  );
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSearch: PropTypes.func.isRequired,
  className: PropTypes.string,
  debounceMs: PropTypes.number,
};

export default SearchBox;
