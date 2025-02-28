import { useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";

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

  return (
    <div
      className="flex items-center bg-green-100 rounded-lg p-2 w-full max-w-md shadow-lg transition focus-within:ring-2 focus-within:ring-yellow-500"
    >
      <FiSearch className="text-yellow-500 mr-2" size={20} />
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder || "Search..."}
        className="w-full px-2 py-1 bg-transparent focus:outline-none text-green-900 placeholder-green-600"
      />
    </div>
  );
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSearch: PropTypes.func.isRequired,
};

export default SearchBox;
