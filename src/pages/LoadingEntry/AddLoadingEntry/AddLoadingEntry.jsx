import axios from "axios";
import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Tables from "../../../common/Tables/Tables";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaTruckLoading } from "react-icons/fa";

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
    const response = await axios.get("/self-order");
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
        fetchData("/sellers", "sellerName"),
        fetchData("/consignees", "name"),
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
    <AdminPageShell
      title="Add Loading Entry"
      subtitle="Select supplier and consignee to find sauda entries for loading"
      icon={FaTruckLoading}
      noContentCard
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
          {loading ? (
            <p className="text-center text-slate-500 font-medium">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">
                    Supplier
                  </label>
                  <DataDropdown
                    options={suppliers}
                    selectedOptions={selectedSupplier ? [selectedSupplier] : []}
                    onChange={setSelectedSupplier}
                    placeholder="Select Supplier"
                    isMulti={false}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">
                    Consignee
                  </label>
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
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition font-semibold"
              >
                Search
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
          {orders.length > 0 ? (
            <Tables
              headers={[
                "Sauda No",
                "Seller Name",
                "Company",
                "Consignee",
                "Commodity",
                "Quantity",
                "Rate",
                "Pending Quantity",
                "Action",
              ]}
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
                  key={order._id || order.saudaNo}
                  onClick={() =>
                    navigate(`/loading-entry-sauda/${order.supplier}`, {
                      state: { order },
                    })
                  }
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-emerald-700 hover:bg-emerald-50 transition"
                  aria-label="Add loading entry"
                  title="Add loading entry"
                >
                  <FaPlus />
                </button>,
              ])}
            />
          ) : (
            <div className="py-10 text-center text-slate-500 font-medium">
              No results yet. Select supplier & consignee and search.
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AddLoadingEntry;
