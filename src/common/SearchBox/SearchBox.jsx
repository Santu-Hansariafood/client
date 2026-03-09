import { useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";

const SearchBox = ({ placeholder, items, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value.trim();
    setSearchTerm(value);

    if (!value) {
      onSearch(items);
      return;
    }

    const filteredItems = items.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );

    onSearch(filteredItems);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch(items);
  };

  return (
    <div
      className="flex items-center w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-500"
      role="search"
      aria-label="Search items"
    >
      <FiSearch
        className="text-slate-400 dark:text-slate-500 shrink-0"
        size={20}
        aria-hidden="true"
      />
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder || "Search..."}
        className="w-full min-w-0 px-3 py-2 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        aria-label={placeholder || "Search"}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={clearSearch}
          className="ml-1 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
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
};

export default SearchBox;
