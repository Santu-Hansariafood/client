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
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.data || []);

    if (url === "/sellers") {
      // Flatten sellers to their companies
      return data.flatMap((seller) =>
        (seller.companies || []).map((company) => ({
          value: seller._id,
          label: capitalizeWords(company),
          company: company,
          sellerName: seller.sellerName,
        }))
      );
    }
    return data.map((item) => ({
      value: item._id,
      label: capitalizeWords(item[key]),
    }));
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    return [];
  }
};

const AddLoadingEntry = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [saudaSearch, setSaudaSearch] = useState(""); // Add sauda search
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoading(true);
      try {
        const [suppliersData, consigneesRes] = await Promise.all([
          fetchData("/sellers", "sellerName"),
          axios.get("/consignees"),
        ]);
        
        // The consignees route might return { data: [...] } or just [...]
        const rawConsignees = Array.isArray(consigneesRes.data) 
          ? consigneesRes.data 
          : (consigneesRes.data?.data || []);

        const consigneesData = rawConsignees.map((c) => ({
          value: c._id,
          label: `${capitalizeWords(c.name)} - ${capitalizeWords(c.location || "N/A")}, ${capitalizeWords(c.district || "N/A")}, ${capitalizeWords(c.state || "N/A")}`,
          name: c.name,
        }));
        setSuppliers(suppliersData);
        setConsignees(consigneesData);
      } catch (err) {
        console.error("Error loading dropdowns:", err);
      }
      setLoading(false);
    };
    loadDropdowns();
  }, []);

  // Auto-fill logic when Sauda No is entered
  useEffect(() => {
    const autoFillSauda = async () => {
      const trimmedSauda = saudaSearch.trim();
      if (trimmedSauda.length >= 2) { // Changed to 2 characters to be more responsive
        try {
          const response = await axios.get("/self-order");
          const allOrders = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          
          const matchedOrder = allOrders.find(
            (order) => order.saudaNo?.toLowerCase() === trimmedSauda.toLowerCase()
          );

          if (matchedOrder) {
            // Find and set the supplier
            const supplierOption = suppliers.find(
              (s) => 
                String(s.value) === String(matchedOrder.supplier?._id || matchedOrder.supplier) && 
                s.company === matchedOrder.supplierCompany
            );
            if (supplierOption) setSelectedSupplier(supplierOption);

            // Find and set the consignee
            const consigneeOption = consignees.find(
              (c) => c.name === matchedOrder.consignee
            );
            if (consigneeOption) setSelectedConsignee(consigneeOption);
          }
        } catch (err) {
          console.error("Error auto-filling sauda details:", err);
        }
      }
    };

    const timer = setTimeout(autoFillSauda, 300); // Shorter debounce
    return () => clearTimeout(timer);
  }, [saudaSearch, suppliers, consignees]);

  const handleSearch = async () => {
    if (selectedSupplier && selectedConsignee) {
      setLoading(true);
      
      try {
        const response = await axios.get("/self-order");
        const allOrders = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        let orderData = allOrders.filter(
          (order) =>
            String(order.supplier?._id || order.supplier) === String(selectedSupplier.value) &&
            order.supplierCompany === selectedSupplier.company &&
            order.consignee === selectedConsignee.name
        );

      // Filter by sauda number if entered
      if (saudaSearch.trim()) {
        orderData = orderData.filter((order) =>
          order.saudaNo?.toLowerCase().includes(saudaSearch.toLowerCase())
        );
      }

      // Add "isClosed" status based on tolerance (+/- 5%)
      orderData = orderData.map((order) => {
        const quantity = order.quantity || 0;
        const pendingQuantity = order.pendingQuantity || 0;
        const tolerance = quantity * 0.05;
        const isClosed = order.status === "closed" || Math.abs(pendingQuantity) <= tolerance;
        return { ...order, isClosed };
      });

      // Sort: incomplete on top, then by date (newest first)
      orderData.sort((a, b) => {
        if (a.isClosed !== b.isClosed) {
          return a.isClosed ? 1 : -1;
        }
        return new Date(b.poDate || b.createdAt) - new Date(a.poDate || a.createdAt);
      });

      setOrders(orderData);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSaudaStatus = async (order) => {
    try {
      const newStatus = order.status === "closed" ? "active" : "closed";
      await axios.put(`/self-order/${order._id}`, { status: newStatus });
      handleSearch(); // Refresh list
    } catch (error) {
      console.error("Error updating sauda status:", error);
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">
                    Sauda No
                  </label>
                  <input
                    type="text"
                    value={saudaSearch}
                    onChange={(e) => setSaudaSearch(e.target.value)}
                    placeholder="Search by Sauda No"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition"
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
                "Date",
                "Sauda No",
                "Seller Name",
                "Company",
                "Consignee",
                "Commodity",
                "Quantity",
                "Rate",
                "Pending Quantity",
                "Status",
                "Action",
              ]}
              rows={orders.map((order) => [
                new Date(order.poDate || order.createdAt).toLocaleDateString(),
                order.saudaNo,
                capitalizeWords(order.supplierCompany),
                capitalizeWords(order.buyerCompany),
                capitalizeWords(order.consignee),
                capitalizeWords(order.commodity),
                order.quantity,
                order.rate,
                capitalizeWords(order.pendingQuantity),
                <span
                  key={`status-${order._id}`}
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.isClosed
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {order.isClosed ? "Closed" : "Active"}
                </span>,
                <div key={`actions-${order._id}`} className="flex gap-2">
                  {!order.isClosed && (
                    <button
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
                    </button>
                  )}
                  <button
                    onClick={() => toggleSaudaStatus(order)}
                    className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold transition ${
                      order.status === "closed"
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                    title={order.status === "closed" ? "Reopen Sauda" : "Close Sauda"}
                  >
                    {order.status === "closed" ? "Reopen" : "Close"}
                  </button>
                </div>,
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
