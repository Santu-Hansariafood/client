import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
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
    <div className="w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <label
              htmlFor="dropdown-select"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Choose Buyers:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:flex-initial sm:max-w-md">
              <DataDropdown
                options={dropdownData}
                selectedOptions={selectedItems}
                onChange={handleSelectChange}
                placeholder="Select Buyers"
                isMulti={true}
              />
              <button
                onClick={handleSelectAll}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Select All
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Selected Buyers:
            </h3>
            <ul className="space-y-2">
              {selectedItems.length === 0 ? (
                <li className="py-4 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
                  No buyers selected
                </li>
              ) : (
                selectedItems.map((seller) => (
                  <li
                    key={seller.value}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {seller.label}
                    </span>
                    <button
                      onClick={() => handleRemove(seller)}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/40"
                      aria-label={`Remove ${seller.label}`}
                    >
                      <IoClose size={18} />
                    </button>
                  </li>
                ))
              )}
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
