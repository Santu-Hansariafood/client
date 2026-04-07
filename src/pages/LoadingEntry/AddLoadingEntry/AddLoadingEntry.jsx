import axios from "axios";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { FaPlus, FaTrash, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Tables from "../../../common/Tables/Tables";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaTruckLoading } from "react-icons/fa";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import Loading from "../../../common/Loading/Loading";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(() => import("../../../common/DateSelector/DateSelector"));

const capitalizeWords = (str) => {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

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

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const AddLoadingEntry = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [saudaSearch, setSaudaSearch] = useState(""); // Add sauda search
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const INITIAL_ENTRY = {
    loadingDate: new Date().toISOString().split('T')[0],
    loadingWeight: "",
    lorryNumber: "",
    addedTransport: "",
    driverName: "",
    driverPhoneNumber: "",
    freightRate: "",
    totalFreight: 0,
    advance: 0,
    balance: 0,
    billNumber: "",
    dateOfIssue: new Date().toISOString().split('T')[0],
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoading(true);
      try {
        const [suppliersData, consigneesRes] = await Promise.all([
          fetchData("/sellers", "sellerName"),
          axios.get("/consignees", { params: { limit: 0 } }), // Request full list
        ]);
        
        // Use consistent data extraction
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
        toast.error("Error loading dropdown data");
      }
      setLoading(false);
    };
    loadDropdowns();
  }, []);

  // Auto-fill logic when Sauda No is entered
  useEffect(() => {
    const autoFillSauda = async () => {
      const trimmedSauda = saudaSearch.trim();
      if (trimmedSauda.length >= 3) { // Use 3 chars for exact match intent
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

            // Update the orders list with just this one match
            const processedOrder = {
              ...matchedOrder,
              isClosed: matchedOrder.status === "closed" || Math.abs(matchedOrder.pendingQuantity || 0) <= (matchedOrder.quantity || 0) * 0.05
            };
            setOrders([processedOrder]);

            // Automatically open the popup for this sauda
            if (!processedOrder.isClosed) {
              handleOpenPopup(processedOrder);
            } else {
              toast.info(`Sauda ${matchedOrder.saudaNo} is already closed.`);
            }
          }
        } catch (err) {
          console.error("Error auto-filling sauda details:", err);
        }
      }
    };

    const timer = setTimeout(autoFillSauda, 500); // Debounce to allow full typing
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

  const handleOpenPopup = (order) => {
    setSelectedOrder(order);
    setLoadingEntries([{ ...INITIAL_ENTRY }]);
    setIsPopupOpen(true);
  };

  const handleAddMore = () => {
    setLoadingEntries([...loadingEntries, { ...INITIAL_ENTRY }]);
  };

  const handleRemoveEntry = (index) => {
    if (loadingEntries.length > 1) {
      const newEntries = loadingEntries.filter((_, i) => i !== index);
      setLoadingEntries(newEntries);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...loadingEntries];
    newEntries[index][field] = value;

    // Recalculate freight if weight or rate changed
    if (field === "loadingWeight" || field === "freightRate" || field === "advance") {
      const weight = parseFloat(newEntries[index].loadingWeight) || 0;
      const rate = parseFloat(newEntries[index].freightRate) || 0;
      const advance = parseFloat(newEntries[index].advance) || 0;
      
      newEntries[index].totalFreight = (weight * rate).toFixed(2);
      newEntries[index].balance = (newEntries[index].totalFreight - advance).toFixed(2);
    }

    setLoadingEntries(newEntries);
  };

  const calculateTotalLoadingWeight = () => {
    return loadingEntries.reduce((sum, entry) => sum + (parseFloat(entry.loadingWeight) || 0), 0);
  };

  const handleSaveEntries = async () => {
    if (!selectedOrder) return;
    
    setIsSaving(true);
    try {
      const payload = {
        saudaNo: selectedOrder.saudaNo,
        entries: loadingEntries.map(entry => ({
          ...entry,
          saudaNo: selectedOrder.saudaNo,
          supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
          consignee: selectedOrder.consignee,
          commodity: selectedOrder.commodity,
        }))
      };

      await axios.post("/loading-entries/bulk", payload);
      toast.success("All loading entries saved successfully");
      setIsPopupOpen(false);
      handleSearch(); // Refresh the list to update pending quantities
    } catch (error) {
      console.error("Error saving entries:", error);
      toast.error(error.response?.data?.message || "Failed to save entries");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async (entry) => {
    try {
      const fullEntry = {
        ...entry,
        saudaNo: selectedOrder.saudaNo,
        supplier: selectedOrder.supplier,
        consignee: selectedOrder.consignee,
        commodity: selectedOrder.commodity,
      };
      const fileUrl = await PrintLoadingEntry(fullEntry);
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `LoadingEntry-${entry.billNumber || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
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
                  formatDate(order.poDate || order.createdAt),
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
                        onClick={() => handleOpenPopup(order)}
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

        {isPopupOpen && selectedOrder && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={`Loading Entries for Sauda: ${selectedOrder.saudaNo}`}
            maxWidth="max-w-6xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-sm border border-slate-100">
                <div>
                  <p className="text-slate-500">Total Quantity</p>
                  <p className="font-bold text-slate-800">{(selectedOrder.quantity || 0).toFixed(2)} Tons</p>
                </div>
                <div>
                  <p className="text-slate-500">Already Loaded</p>
                  <p className="font-bold text-slate-800">
                    {((selectedOrder.quantity || 0) - (selectedOrder.pendingQuantity || 0)).toFixed(2)} Tons
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-emerald-600">Currently Adding</p>
                  <p className="font-bold text-emerald-700">{calculateTotalLoadingWeight().toFixed(2)} Tons</p>
                </div>
                <div>
                  <p className="text-slate-500 text-amber-600">New Pending</p>
                  <p className="font-bold text-amber-700">
                    {((selectedOrder.pendingQuantity || 0) - calculateTotalLoadingWeight()).toFixed(2)} Tons
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {loadingEntries.map((entry, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-2xl space-y-4 relative bg-white shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">Entry #{index + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(entry)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <FaDownload />
                        </button>
                        {loadingEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove Entry"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Loading Date</label>
                        <DateSelector
                          selectedDate={entry.loadingDate}
                          onChange={(date) => handleEntryChange(index, "loadingDate", date)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Quantity (Tons)</label>
                        <DataInput
                          type="number"
                          value={entry.loadingWeight}
                          onChange={(e) => handleEntryChange(index, "loadingWeight", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Lorry No</label>
                        <DataInput
                          value={entry.lorryNumber}
                          onChange={(e) => handleEntryChange(index, "lorryNumber", e.target.value)}
                          placeholder="Lorry Number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Transporter Name</label>
                        <DataInput
                          value={entry.addedTransport}
                          onChange={(e) => handleEntryChange(index, "addedTransport", e.target.value)}
                          placeholder="Transporter Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Driver Name</label>
                        <DataInput
                          value={entry.driverName}
                          onChange={(e) => handleEntryChange(index, "driverName", e.target.value)}
                          placeholder="Driver Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Driver No</label>
                        <DataInput
                          value={entry.driverPhoneNumber}
                          onChange={(e) => handleEntryChange(index, "driverPhoneNumber", e.target.value)}
                          placeholder="Driver Mobile"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Freight Rate</label>
                        <DataInput
                          type="number"
                          value={entry.freightRate}
                          onChange={(e) => handleEntryChange(index, "freightRate", e.target.value)}
                          placeholder="Rate per Ton"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Bill No</label>
                        <DataInput
                          value={entry.billNumber}
                          onChange={(e) => handleEntryChange(index, "billNumber", e.target.value)}
                          placeholder="Bill Number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Bill Issue Date</label>
                        <DateSelector
                          selectedDate={entry.dateOfIssue}
                          onChange={(date) => handleEntryChange(index, "dateOfIssue", date)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Total Freight</p>
                        <p className="font-bold text-slate-700">₹ {entry.totalFreight}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Advance</p>
                        <DataInput
                          type="number"
                          className="text-center font-bold"
                          value={entry.advance}
                          onChange={(e) => handleEntryChange(index, "advance", e.target.value)}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Balance</p>
                        <p className="font-bold text-amber-600">₹ {entry.balance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleAddMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition font-bold shadow-md shadow-slate-200"
                >
                  <FaPlus /> Add More Entries
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntries}
                    disabled={isSaving}
                    className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold shadow-md shadow-emerald-200 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save All Entries"}
                  </button>
                </div>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default AddLoadingEntry;
