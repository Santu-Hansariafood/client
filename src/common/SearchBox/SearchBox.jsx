import { useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";
import { AiOutlineCloseCircle } from "react-icons/ai";

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
      className="flex items-center bg-white/90 border border-gray-200 rounded-2xl p-2 w-full max-w-md shadow-sm transition focus-within:ring-2 focus-within:ring-blue-300"
      role="search"
      aria-label="Search items"
    >
      <FiSearch className="text-blue-600 mx-2" size={20} aria-hidden="true" />
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder || "Search..."}
        className="w-full px-2 py-2 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500"
        aria-label={placeholder || "Search"}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={clearSearch}
          className="ml-2 text-gray-600 hover:text-red-600 transition"
          aria-label="Clear search"
          title="Clear"
        >
          <AiOutlineCloseCircle size={20} />
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
