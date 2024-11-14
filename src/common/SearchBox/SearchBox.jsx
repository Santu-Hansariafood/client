import { useState } from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";

const SearchBox = ({ placeholder, items, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filteredItems = items.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
    onSearch(filteredItems);
  };

  return (
    <div
      className="
        flex
        items-center
        border
        border-blue-500
        rounded
        p-2
        w-full
        max-w-md
        shadow-md
        bg-white
      "
    >
      <FiSearch className="text-blue-500 mr-2" size={20} />
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder || "Search..."}
        className="
          w-full
          px-2
          py-1
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          text-gray-700
        "
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
