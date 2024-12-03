import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { MdDeleteForever } from "react-icons/md";
import DataDropdown from "../DataDropdown/DataDropdown";

const DropdownSelector = ({ fetchData }) => {
  const [dropdownData, setDropdownData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const sellers = await fetchData();
        setDropdownData(sellers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [fetchData]);

  const handleRemove = (item) => {
    setSelectedItems((prev) => prev.filter((i) => i.value !== item.value));
  };

  const handleSelectChange = (selectedOptions) => {
    setSelectedItems(selectedOptions || []);
  };

  const handleSelectAll = () => {
    setSelectedItems(dropdownData);
  };

  return (
    <div className="w-full p-6 bg-white shadow-md rounded-lg">
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <label
              htmlFor="dropdown-select"
              className="text-gray-700 font-medium w-full sm:w-auto"
            >
              Choose Buyers:
            </label>
            <DataDropdown
              options={dropdownData}
              selectedOptions={selectedItems}
              onChange={handleSelectChange}
              placeholder="Select Buyers"
              isMulti={true}
            />

            <button
              onClick={handleSelectAll}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Select All
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Selected Buyers:
            </h3>
            <ul className="space-y-2 mt-2">
              {selectedItems.map((seller) => (
                <li
                  key={seller.value}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{seller.label}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(seller)}
                    className="text-red-500 hover:underline"
                  >
                    <MdDeleteForever />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

DropdownSelector.propTypes = {
  fetchData: PropTypes.func.isRequired,
};

export default DropdownSelector;
