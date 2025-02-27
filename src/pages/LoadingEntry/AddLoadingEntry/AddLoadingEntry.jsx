import axios from "axios";
import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Tables from "../../../common/Tables/Tables";

const capitalizeWords = (str) =>
  str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const fetchData = async (url, key) => {
  try {
    const response = await axios.get(url);
    return response.data.map((item) => ({
      value: item._id,
      label: capitalizeWords(item[key]),
    }));
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    return [];
  }
};

const fetchOrders = async (supplierId, consignee) => {
  try {
    const response = await axios.get("http://localhost:5000/api/self-order");
    return response.data.filter(
      (order) => order.supplier === supplierId && order.consignee === consignee
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

const AddLoadingEntry = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoading(true);
      const [suppliersData, consigneesData] = await Promise.all([
        fetchData("http://localhost:5000/api/sellers", "sellerName"),
        fetchData("http://localhost:5000/api/consignees", "name"),
      ]);
      setSuppliers(suppliersData);
      setConsignees(consigneesData);
      setLoading(false);
    };
    loadDropdowns();
  }, []);

  const handleSearch = async () => {
    if (selectedSupplier && selectedConsignee) {
      setLoading(true);
      let orderData = await fetchOrders(
        selectedSupplier.value,
        selectedConsignee.label
      );
      orderData.sort((a, b) => {
        return a.buyer.localeCompare(b.buyer) || a.consignee.localeCompare(b.consignee);
      });
      setOrders(orderData);
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Loading Entry</h2>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-gray-700 font-medium">Select Supplier:</label>
              <DataDropdown
                options={suppliers}
                selectedOptions={selectedSupplier ? [selectedSupplier] : []}
                onChange={setSelectedSupplier}
                placeholder="Select Supplier"
                isMulti={false}
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-700 font-medium">Select Consignee:</label>
              <DataDropdown
                options={consignees}
                selectedOptions={selectedConsignee ? [selectedConsignee] : []}
                onChange={setSelectedConsignee}
                placeholder="Select Consignee"
                isMulti={false}
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Search
          </button>
          {orders.length > 0 && (
            <Tables
              headers={["Sauda No","Seller Name", "Company","Consignee", "Commodity", "Quantity", "Rate", "Pending Quantity", "Action"]}
              rows={orders.map((order) => [
                order.saudaNo,
                capitalizeWords(order.supplierCompany),
                capitalizeWords(order.buyerCompany),
                capitalizeWords(order.consignee),
                capitalizeWords(order.commodity),
                order.quantity,
                order.rate,
                capitalizeWords(order.pendingQuantity),
                <button
                  onClick={() => navigate(`/loading-entry-sauda/${order.supplier}`, { state: { order } })}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaPlus />
                </button>
              ])}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AddLoadingEntry;
