import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaRegHandPointer, FaGavel } from "react-icons/fa";
import { IoArrowBack, IoRefresh } from "react-icons/io5";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const SupplierBidList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { commodityNames = [], mobile } = location.state || {};

  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active", "participated", "closed"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loadingFrom, setLoadingFrom] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [bidLocations, setBidLocations] = useState([]);

  const fetchBids = async () => {
    setLoading(true);
    setError(null);
    try {
      if (commodityNames.length === 0) {
        setError("No commodities selected.");
        setLoading(false);
        return;
      }
      const [bidsRes, participationsRes, locationsRes] = await Promise.all([
        axios.get("/bids"),
        axios.get(`/participatebids?mobile=${mobile}`),
        axios.get("/bid-locations")
      ]);

      const items = bidsRes.data?.data || bidsRes.data || [];
      const myParticipations = participationsRes.data?.data || participationsRes.data || [];
      const locations = locationsRes.data?.data || locationsRes.data || [];

      // Only keep bids for selected commodities
      const relevantBids = items.filter(bid => commodityNames.includes(bid.commodity));
      
      setBids(relevantBids);
      setParticipations(myParticipations);
      setBidLocations(locations);
    } catch (error) {
      setError("Failed to fetch bid data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line
  }, [commodityNames, mobile]);

  const handleParticipate = (bid) => {
    setSelectedBid(bid);
    // If already participated, pre-fill with previous values
    const existingParticipation = participations.find(p => p.bidId === bid._id);
    if (existingParticipation) {
      setRate(existingParticipation.rate || "");
      setQuantity(existingParticipation.quantity || "");
      setLoadingFrom(existingParticipation.loadingFrom || "");
      setRemarks(existingParticipation.remarks || "");
    } else {
      setRate(bid.rate || "");
      setQuantity(bid.quantity || "");
      setLoadingFrom("");
      setRemarks("");
    }
    setIsPopupOpen(true);
  };

  const handleConfirm = async () => {
    if (!rate || !quantity) {
      toast.error("Please enter a valid rate and quantity.");
      return;
    }
    try {
      const participationData = {
        bidId: selectedBid._id,
        mobile: mobile,
        rate: Number(rate),
        quantity: Number(quantity),
        loadingFrom,
        remarks,
      };
      await axios.post(
        "/participatebids",
        participationData
      );
      toast.success("Participation successful!");
      setIsPopupOpen(false);
      fetchBids(); // Refresh to update participation status
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to participate in the bid.";
      toast.error(errorMessage);
    }
  };

  const filteredBids = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return bids.filter((bid) => {
      const bidDateStr = bid.bidDate ? bid.bidDate.split('T')[0] : "";
      
      // Only display today's bids
      if (bidDateStr !== todayStr) {
        return false;
      }

      const [year, month, day] = bidDateStr.split('-').map(Number);
      const [endHours, endMinutes] = bid.endTime.split(':').map(Number);
      const bidEndDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

      const isParticipated = participations.some(p => p.bidId === bid._id);
      const isClosed = bid.status === 'closed' || now >= bidEndDateTime;

      if (activeTab === "active") {
        return bid.status === "active" && now < bidEndDateTime;
      } else if (activeTab === "participated") {
        return isParticipated;
      } else if (activeTab === "closed") {
        return isClosed;
      }
      return false;
    }).sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));
  }, [bids, participations, activeTab]);

  const groupedBids = useMemo(() => {
    const groups = {};
    filteredBids.forEach((bid) => {
      if (!groups[bid.group]) groups[bid.group] = [];
      groups[bid.group].push(bid);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBids]);

  const bidCount = filteredBids.length;

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-2)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            <IoArrowBack /> Back
          </button>
          <button
            onClick={fetchBids}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            <IoRefresh /> Refresh
          </button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Manage Bids</h1>
          <p className="text-slate-500 mt-1">
            {activeTab === "active"
              ? "View and participate in active bids"
              : activeTab === "participated"
                ? "Bids you have participated in"
                : "Closed bids from the last 7 days"}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "active"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active Bids
          </button>
          <button
            onClick={() => setActiveTab("participated")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "participated"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Participated Bids
          </button>
          <button
            onClick={() => setActiveTab("closed")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "closed"
                ? "bg-white text-red-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Closed Bids
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading bids...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : groupedBids.length === 0 ? (
          <p className="text-center text-gray-600">
            No {activeTab} bids available for {commodityNames.join(", ")}
            {activeTab === "closed" ? " in the last 7 days" : ""}.
          </p>
        ) : (
          <div>
            {groupedBids.map(([groupName, groupBids]) => (
              <div key={groupName} className="mb-4">
                <button
                  className="font-bold text-lg text-blue-700 hover:underline"
                  onClick={() => setSelectedGroup(selectedGroup === groupName ? null : groupName)}
                >
                  {groupName} <span className="text-gray-500">({[...new Set(groupBids.map(b => b.consignee))].length} consignees)</span>
                </button>
                {selectedGroup === groupName && (
                  <div className="mt-2 bg-white rounded shadow p-4">
                    <Tables
                      headers={["Consignee", "Commodity", "Quantity", "Rate", "Bid Date", "Start Time", "End Time", "Payment Terms", "Delivery", "Parameters", "Action"]}
                      rows={groupBids.map((bid) => {
                        const isParticipated = participations.some(p => p.bidId === bid._id);
                        const bidDateStr = bid.bidDate ? bid.bidDate.split('T')[0] : new Date().toISOString().split('T')[0];
                        const [year, month, day] = bidDateStr.split('-').map(Number);
                        const [endHours, endMinutes] = bid.endTime.split(':').map(Number);
                        const bidEndDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
                        const isClosed = bid.status === 'closed' || new Date() >= bidEndDateTime;

                        return [
                          bid.consignee,
                          bid.commodity,
                          bid.quantity,
                          bid.rate,
                          bid.bidDate ? new Date(bid.bidDate).toLocaleDateString() : "N/A",
                          bid.startTime || "-",
                          bid.endTime || "-",
                          bid.paymentTerms || "N/A",
                          bid.delivery || "N/A",
                          bid.parameters
                            ? Object.entries(bid.parameters)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")
                            : "No Parameters",
                          isClosed ? (
                            <span key={bid._id} className="text-red-500 font-bold">Closed</span>
                          ) : (
                            <button
                              key={bid._id}
                              onClick={() => handleParticipate(bid)}
                              className={`flex items-center gap-2 font-bold ${
                                isParticipated ? "text-emerald-600" : "text-blue-500 hover:text-blue-700"
                              }`}
                            >
                              <FaRegHandPointer /> {isParticipated ? "Update Bid" : "Participate"}
                            </button>
                          ),
                        ];
                      })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Suspense fallback={null}>
          {isPopupOpen && (
            <PopupBox
              isOpen={isPopupOpen}
              onClose={() => setIsPopupOpen(false)}
              title="Participate in Bid"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1">Rate:</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Quantity:</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Loading From:</label>
                  <select
                    value={loadingFrom}
                    onChange={(e) => setLoadingFrom(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">Select Location</option>
                    {bidLocations.map((loc) => (
                      <option key={loc._id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Remarks:</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                    rows="2"
                  />
                </div>
                <button
                  onClick={handleConfirm}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </PopupBox>
          )}
        </Suspense>
      </div>
    </Suspense>
  );
};

export default SupplierBidList;
