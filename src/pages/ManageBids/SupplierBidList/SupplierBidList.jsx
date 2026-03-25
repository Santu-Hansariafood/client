import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaRegHandPointer, FaGavel, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import { IoArrowBack, IoRefresh } from "react-icons/io5";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

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

  const renderBidCard = (bid) => {
    const isParticipated = participations.some(p => p.bidId === bid._id);
    const participation = isParticipated ? participations.find(p => p.bidId === bid._id) : null;

    return (
      <div key={bid._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-100/80">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-medium">{bid.group}</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{bid.consignee}</h3>
              <p className="text-sm text-slate-600">{bid.commodity} - {bid.origin}</p>
            </div>
            {isParticipated && (
              <div className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${participation.status === 'accepted' ? 'bg-green-100 text-green-700' : participation.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {participation.status === 'accepted' ? <FaCheckCircle /> : participation.status === 'rejected' ? <FaTimesCircle /> : <FaHourglassHalf />}
                {participation.status.charAt(0).toUpperCase() + participation.status.slice(1)}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Quantity</p>
              <p className="font-semibold text-slate-700">{bid.quantity} Tons</p>
            </div>
            <div>
              <p className="text-slate-500">Company Rate</p>
              <p className="font-semibold text-slate-700">₹{bid.rate}</p>
            </div>
            {isParticipated && (
              <>
                <div>
                  <p className="text-slate-500">Your Rate</p>
                  <p className="font-semibold text-blue-700">₹{participation.rate}</p>
                </div>
                <div>
                  <p className="text-slate-500">Your Quantity</p>
                  <p className="font-semibold text-blue-700">{participation.quantity} Tons</p>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-50/70 px-5 py-3">
          <button
            onClick={() => handleParticipate(bid)}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg py-2 transition-colors"
          >
            <FaRegHandPointer />
            {isParticipated ? "Update Participation" : "Participate Now"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Supplier Bids"
        subtitle={`You have ${bidCount} ${activeTab} bid(s) for your selected commodities`}
        icon={FaGavel}
        noContentCard
      >
        <div className="max-w-6xl mx-auto">
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
              Participated
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
            <Loading />
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-200 text-red-600 font-medium">
              {error}
            </div>
          ) : bidCount === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No {activeTab} bids found for your selected commodities.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBids.map(renderBidCard)}
            </div>
          )}
        </div>

        {isPopupOpen && selectedBid && (
          <PopupBox isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} title={`Participate in: ${selectedBid.consignee}`}>
            <div className="space-y-4 p-1">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Your Rate</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter your rate"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Your Quantity (Tons)</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Loading From</span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none bg-white"
                  value={loadingFrom}
                  onChange={(e) => setLoadingFrom(e.target.value)}
                >
                  <option value="">Select Loading Location</option>
                  {bidLocations.map(loc => (
                    <option key={loc._id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Remarks</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional remarks?"
                  rows={3}
                />
              </label>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-6 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Confirm Participation
                </button>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default SupplierBidList;
