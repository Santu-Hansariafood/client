import { useState, useEffect, lazy, Suspense } from "react";
import { FaPlus, FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaTruckLoading } from "react-icons/fa";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const capitalizeWords = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const fetchData = async (url, key) => {
  try {
    const response = await axios.get(url);
    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    if (url === "/sellers") {
      return data.flatMap((seller) =>
        (seller.companies || []).map((company) => ({
          value: seller._id,
          label: capitalizeWords(company),
          company: company,
          sellerName: seller.sellerName,
        })),
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

  const INITIAL_ENTRY = {
    loadingDate: new Date().toISOString().split("T")[0],
    loadingWeight: "",
    bags: "",
    lorryNumber: "",
    addedTransport: "",
    driverName: "",
    driverPhoneNumber: "",
    freightRate: "",
    totalFreight: 0,
    advance: 0,
    balance: 0,
    billNumber: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoading(true);
      try {
        const [suppliersData, consigneesRes] = await Promise.all([
          fetchData("/sellers", "sellerName"),
          axios.get("/consignees", { params: { limit: 0 } }),
        ]);

        const rawConsignees = Array.isArray(consigneesRes.data)
          ? consigneesRes.data
          : consigneesRes.data?.data || [];

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

  useEffect(() => {
    const autoFillSauda = async () => {
      const trimmedSauda = saudaSearch.trim();
      if (trimmedSauda.length >= 3) {
        try {
          const response = await axios.get("/self-order");
          const allOrders = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];

          const matchedOrder = allOrders.find(
            (order) =>
              order.saudaNo?.toLowerCase() === trimmedSauda.toLowerCase(),
          );

          if (matchedOrder) {
            const supplierOption = suppliers.find(
              (s) =>
                String(s.value) ===
                  String(matchedOrder.supplier?._id || matchedOrder.supplier) &&
                s.company === matchedOrder.supplierCompany,
            );
            if (supplierOption) setSelectedSupplier(supplierOption);

            const consigneeOption = consignees.find(
              (c) => c.name === matchedOrder.consignee,
            );
            if (consigneeOption) setSelectedConsignee(consigneeOption);

            const processedOrder = {
              ...matchedOrder,
              isClosed:
                matchedOrder.status === "closed" ||
                Math.abs(matchedOrder.pendingQuantity || 0) <=
                  (matchedOrder.quantity || 0) * 0.05,
            };
            setOrders([processedOrder]);

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

    const timer = setTimeout(autoFillSauda, 500);
    return () => clearTimeout(timer);
  }, [saudaSearch, suppliers, consignees]);

  const handleSearch = async () => {
    if (selectedSupplier && selectedConsignee) {
      setLoading(true);

      try {
        const response = await axios.get("/self-order");
        const allOrders = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        let orderData = allOrders.filter(
          (order) =>
            String(order.supplier?._id || order.supplier) ===
              String(selectedSupplier.value) &&
            order.supplierCompany === selectedSupplier.company &&
            order.consignee === selectedConsignee.name,
        );

        if (saudaSearch.trim()) {
          orderData = orderData.filter((order) =>
            order.saudaNo?.toLowerCase().includes(saudaSearch.toLowerCase()),
          );
        }

        orderData = orderData.map((order) => {
          const quantity = order.quantity || 0;
          const pendingQuantity = order.pendingQuantity || 0;
          const tolerance = quantity * 0.05;
          const isClosed =
            order.status === "closed" || Math.abs(pendingQuantity) <= tolerance;
          return { ...order, isClosed };
        });

        orderData.sort((a, b) => {
          if (a.isClosed !== b.isClosed) {
            return a.isClosed ? 1 : -1;
          }
          const getTime = (d) => {
            const t = new Date(d).getTime();
            return isNaN(t) ? 0 : t;
          };

          return (
            getTime(b.poDate || b.createdAt) - getTime(a.poDate || a.createdAt)
          );
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
      handleSearch();
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

    if (field === "loadingDate" || field === "dateOfIssue") {
      const d = new Date(value);
      newEntries[index][field] = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : "";
    } else {
      newEntries[index][field] = value;
    }

    if (
      field === "loadingWeight" ||
      field === "freightRate" ||
      field === "advance"
    ) {
      const weight = parseFloat(newEntries[index].loadingWeight) || 0;
      const rate = parseFloat(newEntries[index].freightRate) || 0;
      const advance = parseFloat(newEntries[index].advance) || 0;

      const total = +(weight * rate).toFixed(2);
      const balance = +(total - advance).toFixed(2);

      newEntries[index].totalFreight = total;
      newEntries[index].balance = balance;
    }

    setLoadingEntries(newEntries);
  };
  const calculateTotalLoadingWeight = () => {
    return loadingEntries.reduce(
      (sum, entry) => sum + (parseFloat(entry.loadingWeight) || 0),
      0,
    );
  };

  const handleSaveEntries = async () => {
    if (!selectedOrder) return;

    setIsSaving(true);

    for (const entry of loadingEntries) {
      const weight = parseFloat(entry.loadingWeight) || 0;
      const rate = parseFloat(entry.freightRate) || 0;
      const advance = parseFloat(entry.advance) || 0;

      // ✅ Negative validation HERE
      if (weight < 0 || rate < 0 || advance < 0) {
        toast.error("Values cannot be negative");
        setIsSaving(false);
        return;
      }

      // ✅ Phone validation (already correct)
      if (
        entry.driverPhoneNumber &&
        !/^\d{10}$/.test(entry.driverPhoneNumber)
      ) {
        toast.error("Invalid phone number");
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
        saudaNo: selectedOrder.saudaNo,
        entries: loadingEntries.map((entry) => ({
          ...entry,
          saudaNo: selectedOrder.saudaNo,
          supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
          supplierCompany: selectedOrder.supplierCompany,
          consignee: selectedOrder.consignee,
          commodity: selectedOrder.commodity,
          bags: entry.bags,
        })),
      };

      await axios.post("/loading-entries/bulk", payload);
      toast.success("All loading entries saved successfully");
      setIsPopupOpen(false);
      handleSearch();
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
        supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
        supplierCompany: selectedOrder.supplierCompany,
        consignee: selectedOrder.consignee,
        commodity: selectedOrder.commodity,
        bags: entry.bags,
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
              <Loading />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-slate-700">
                      Supplier
                    </label>
                    <DataDropdown
                      options={suppliers}
                      selectedOptions={
                        selectedSupplier ? [selectedSupplier] : []
                      }
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
                      selectedOptions={
                        selectedConsignee ? [selectedConsignee] : []
                      }
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
                  order.pendingQuantity,
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
                  <div
                    key={`actions-${order._id}`}
                    className="flex items-center gap-3"
                  >
                    {order.status !== "closed" ? (
                      <>
                        <button
                          onClick={() => handleOpenPopup(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-xs font-bold whitespace-nowrap"
                          title="Add Loading Entry"
                        >
                          <FaPlus /> Add Loading Entry
                        </button>
                        <button
                          onClick={() => toggleSaudaStatus(order)}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-xs font-bold"
                          title="Close Sauda"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleSaudaStatus(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-bold"
                        title="Reopen Sauda"
                      >
                        Reopen to Add
                      </button>
                    )}
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
            title={`Add Loading Entry - Sauda: ${selectedOrder.saudaNo}`}
            maxWidth="max-w-7xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 shadow-inner">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Total Quantity</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(selectedOrder.quantity || 0).toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Already Loaded</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(
                      (selectedOrder.quantity || 0) -
                      (selectedOrder.pendingQuantity || 0)
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-emerald-600 font-medium">
                    Currently Adding
                  </p>
                  <p className="font-bold text-emerald-700 text-lg">
                    {calculateTotalLoadingWeight().toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-100">
                  <p className="text-amber-600 font-medium">
                    Remaining Pending
                  </p>
                  <p className="font-bold text-amber-700 text-lg">
                    {Math.max(
                      0,
                      (selectedOrder.pendingQuantity || 0) -
                        calculateTotalLoadingWeight(),
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                {loadingEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="p-5 border border-slate-200 rounded-3xl space-y-6 relative bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-700">
                          Loading Specification
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(entry)}
                          className="flex items-center gap-2 px-3 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-sm font-bold border border-purple-100"
                          title="Download Lorry Challan"
                        >
                          <FaDownload /> Challan
                        </button>
                        {loadingEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition border border-red-100"
                            title="Remove Entry"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Loading Date
                        </label>
                        <DateSelector
                          selectedDate={entry.loadingDate}
                          onChange={(date) =>
                            handleEntryChange(index, "loadingDate", date)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Weight (Tons)
                        </label>
                        <DataInput
                          type="number"
                          value={entry.loadingWeight}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "loadingWeight",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bags Count
                        </label>
                        <DataInput
                          type="number"
                          value={entry.bags}
                          onChange={(e) =>
                            handleEntryChange(index, "bags", e.target.value)
                          }
                          placeholder="No. of bags"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Lorry Number
                        </label>
                        <DataInput
                          value={entry.lorryNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "lorryNumber",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. RJ 14 GA 1234"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Transporter
                        </label>
                        <DataInput
                          value={entry.addedTransport}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "addedTransport",
                              e.target.value,
                            )
                          }
                          placeholder="Name of transport"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Name
                        </label>
                        <DataInput
                          value={entry.driverName}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverName",
                              e.target.value,
                            )
                          }
                          placeholder="Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Mobile
                        </label>
                        <DataInput
                          value={entry.driverPhoneNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverPhoneNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Freight Rate
                        </label>
                        <DataInput
                          type="number"
                          value={entry.freightRate}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "freightRate",
                              e.target.value,
                            )
                          }
                          placeholder="Rs. per ton"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Number
                        </label>
                        <DataInput
                          value={entry.billNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "billNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Invoice no."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Issue Date
                        </label>
                        <DateSelector
                          selectedDate={entry.dateOfIssue}
                          onChange={(date) =>
                            handleEntryChange(index, "dateOfIssue", date)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Total Freight
                        </p>
                        <p className="font-bold text-slate-800 text-lg">
                          ₹ {Number(entry.totalFreight).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Advance Amount
                        </p>
                        <div className="max-w-[120px]">
                          <DataInput
                            type="number"
                            className="text-center font-bold !py-1"
                            value={entry.advance}
                            onChange={(e) =>
                              handleEntryChange(
                                index,
                                "advance",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Balance Due
                        </p>
                        <p className="font-bold text-amber-600 text-lg">
                          ₹ {Number(entry.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                <button
                  onClick={handleAddMore}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all font-bold shadow-lg shadow-slate-200 active:scale-95"
                >
                  <FaPlus /> Add More Lorry
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="flex-1 sm:flex-none px-8 py-3 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition font-bold border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntries}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-12 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? "Saving..." : "Save All Lorry"}
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
