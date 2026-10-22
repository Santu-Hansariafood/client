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
    <div className="w-full p-6 rounded-2xl border border-[#e9e2d3] dark:border-lux-deep bg-gradient-to-br from-lux-cream via-[#f7f4ec] to-lux-cream dark:from-lux-night dark:via-lux-night dark:to-lux-night shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)]">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-[#e9e2d3] dark:border-lux-deep border-t-lux-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <label
              htmlFor="dropdown-select"
              className="text-sm font-medium text-lux-ink dark:text-lux-ivory"
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
                className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-white font-medium text-sm hover:from-lux-deep hover:to-lux-deep transition-colors focus:outline-none focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 shadow-[0_10px_24px_-10px_rgba(6,95,70,0.5)] dark:focus:ring-offset-lux-night"
              >
                Select All
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold font-serif text-lux-ink dark:text-lux-ivory mb-3">
              Selected Buyers:
            </h3>
            <ul className="space-y-2">
              {selectedItems.length === 0 ? (
                <li className="py-4 px-4 rounded-xl bg-lux-ivory dark:bg-lux-night/50 border border-[#e9e2d3] dark:border-lux-deep text-center text-sm text-lux-muted dark:text-lux-muted">
                  No buyers selected
                </li>
              ) : (
                [...selectedItems]
                  .sort((a, b) =>
                    String(a.label || "").localeCompare(String(b.label || "")),
                  )
                  .map((seller) => (
                    <li
                      key={seller.value}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-lux-ivory dark:bg-lux-night/50 border border-[#e9e2d3] dark:border-lux-deep"
                    >
                      <span className="text-sm font-medium text-lux-ink dark:text-lux-ivory truncate">
                        {seller.label}
                      </span>
                      <button
                        onClick={() => handleRemove(seller)}
                        className="shrink-0 p-1.5 rounded-lg text-lux-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/40"
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
