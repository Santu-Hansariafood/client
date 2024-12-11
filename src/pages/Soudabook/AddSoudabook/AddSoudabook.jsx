import { useState, useEffect } from "react";
import axios from "axios";
import DateSelector from "../../../common/DateSelector/DateSelector";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DataInput from "../../../common/DataInput/DataInput";
import { FaPlus, FaTrash } from "react-icons/fa";

const AddSoudabook = () => {
  const [sellers, setSellers] = useState([]);
  const [items, setItems] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [rows, setRows] = useState([
    {
      date: new Date(),
      sellerName: null,
      item: null,
      oQnty: "",
      buyerName: null,
      rate: "",
      loadingQnty: "",
      location: "",
      unloadingQnty: "",
      paymentTerms: "",
      remarks: "",
    },
  ]);

  // Fetch Sellers, Items, and Buyers on component mount
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sellers");
        const sellerOptions = response.data.map((seller) => ({
          value: seller._id,
          label: seller.name,
        }));
        setSellers(sellerOptions);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };

    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/commodities");
        const itemOptions = response.data.map((item) => ({
          value: item._id,
          label: item.name,
        }));
        setItems(itemOptions);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    const fetchBuyers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/buyers");
        const buyerOptions = response.data.map((buyer) => ({
          value: buyer._id,
          label: buyer.name,
        }));
        setBuyers(buyerOptions);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      }
    };

    fetchSellers();
    fetchItems();
    fetchBuyers();
  }, []);

  // Handle Add Row
  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        date: new Date(),
        sellerName: null,
        item: null,
        oQnty: "",
        buyerName: null,
        rate: "",
        loadingQnty: "",
        location: "",
        unloadingQnty: "",
        paymentTerms: "",
        remarks: "",
      },
    ]);
  };

  // Handle Remove Row
  const handleRemoveRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  // Handle Change
  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  return (
    <div className="p-6 bg-gray-50 shadow-lg rounded-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
        Add Soudabook
      </h2>

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-center border p-4 rounded-lg bg-white shadow-md"
        >
          {/* Date Selector */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <DateSelector
              selectedDate={row.date}
              onChange={(date) => handleChange(index, "date", date)}
            />
          </div>

          {/* Seller Name Dropdown */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller Name
            </label>
            <DataDropdown
              options={sellers}
              selectedOptions={row.sellerName}
              onChange={(selected) => handleChange(index, "sellerName", selected)}
              placeholder="Select Seller"
            />
          </div>

          {/* Item Dropdown */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <DataDropdown
              options={items}
              selectedOptions={row.item}
              onChange={(selected) => handleChange(index, "item", selected)}
              placeholder="Select Item"
            />
          </div>

          {/* O.Qnty Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              O.Qnty
            </label>
            <DataInput
              value={row.oQnty}
              onChange={(e) => handleChange(index, "oQnty", e.target.value)}
              placeholder="O.Qnty"
            />
          </div>

          {/* Buyer Name Dropdown */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Name
            </label>
            <DataDropdown
              options={buyers}
              selectedOptions={row.buyerName}
              onChange={(selected) =>
                handleChange(index, "buyerName", selected)
              }
              placeholder="Select Buyer"
            />
          </div>

          {/* Rate Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate
            </label>
            <DataInput
              value={row.rate}
              onChange={(e) => handleChange(index, "rate", e.target.value)}
              placeholder="Rate"
            />
          </div>

          {/* Loading Qnty Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loading Qnty
            </label>
            <DataInput
              value={row.loadingQnty}
              onChange={(e) =>
                handleChange(index, "loadingQnty", e.target.value)
              }
              placeholder="Loading Qnty"
            />
          </div>

          {/* Location Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <DataInput
              value={row.location}
              onChange={(e) => handleChange(index, "location", e.target.value)}
              placeholder="Location"
            />
          </div>

          {/* Unloading Qnty Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unloading Qnty
            </label>
            <DataInput
              value={row.unloadingQnty}
              onChange={(e) =>
                handleChange(index, "unloadingQnty", e.target.value)
              }
              placeholder="Unloading Qnty"
            />
          </div>

          {/* Payment Terms Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <DataInput
              value={row.paymentTerms}
              onChange={(e) =>
                handleChange(index, "paymentTerms", e.target.value)
              }
              placeholder="Payment Terms"
            />
          </div>

          {/* Remarks Input */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <DataInput
              value={row.remarks}
              onChange={(e) => handleChange(index, "remarks", e.target.value)}
              placeholder="Remarks"
            />
          </div>

          {/* Remove Button */}
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => handleRemoveRow(index)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash size={18} />
            </button>
          </div>
        </div>
      ))}

      {/* Add More Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handleAddRow}
          className="flex items-center px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md shadow-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add More
        </button>
      </div>
    </div>
  );
};

export default AddSoudabook;
