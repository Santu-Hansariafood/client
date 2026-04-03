import { lazy, Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaRegHandPointer,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const SupplierBidList = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const location = useLocation();
  const { mobile } = location.state || {};

  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [activeTab, setActiveTab] = useState("all"); // "all", "active", "participated", "closed"
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
  const [nowTime, setNowTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchBids = useCallback(async () => {
    if (!mobile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/bids/supplier-today?mobile=${mobile}`);
      const payload = res.data?.data || res.data || {};

      const items = payload.bids || [];
      const myParticipations = payload.myParticipations || [];
      const counts = payload.participantCounts || {};
      const locations = payload.bidLocations || [];

      setBids(items);
      setParticipations(myParticipations);
      setParticipantCounts(counts);
      setBidLocations(locations);
    } catch (error) {
      setError("Failed to fetch bid data.");
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const getBidEndDateTime = (bid) => {
    const bidDateStr = bid.bidDate ? bid.bidDate.split("T")[0] : "";
    if (!bidDateStr || !bid.endTime) return null;
    const [year, month, day] = bidDateStr.split("-").map(Number);
    const [endHours, endMinutes] = String(bid.endTime).split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(endHours) || Number.isNaN(endMinutes)) {
      return null;
    }
    return new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
  };

  const formatCountdown = (msRemaining) => {
    const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleParticipate = (bid) => {
    setSelectedBid(bid);
    const existingParticipation = participations.find(
      (p) => p.bidId === bid._id,
    );
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
      await axios.post("/participatebids", participationData);
      toast.success("Participation successful!");
      setIsPopupOpen(false);
      fetchBids();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to participate in the bid.";
      toast.error(errorMessage);
    }
  };

  const filteredBids = useMemo(() => {
    const todayStr = nowTime.toISOString().split("T")[0];

    return bids
      .filter((bid) => {
        const bidDateStr = bid.bidDate ? bid.bidDate.split("T")[0] : "";

        if (bidDateStr !== todayStr) {
          return false;
        }

        const bidEndDateTime = getBidEndDateTime(bid);
        if (!bidEndDateTime) return false;
        const isParticipated = participations.some((p) => p.bidId === bid._id);
        const isClosed = bid.status === "closed" || nowTime >= bidEndDateTime;

        if (activeTab === "all") {
          return true;
        } else if (activeTab === "active") {
          return bid.status === "active" && nowTime < bidEndDateTime;
        } else if (activeTab === "participated") {
          return isParticipated;
        } else if (activeTab === "closed") {
          return isClosed;
        }
        return false;
      })
      .sort((a, b) => {
        const aEnd = getBidEndDateTime(a)?.getTime() ?? 0;
        const bEnd = getBidEndDateTime(b)?.getTime() ?? 0;
        return bEnd - aEnd;
      });
  }, [bids, participations, activeTab, nowTime]);

  const groupedBids = useMemo(() => {
    const groups = {};
    filteredBids.forEach((bid) => {
      if (!groups[bid.group]) groups[bid.group] = [];
      groups[bid.group].push(bid);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBids]);

  useEffect(() => {
    const groupNames = groupedBids.map(([name]) => name);
    if (groupedBids.length > 0 && (!selectedGroup || !groupNames.includes(selectedGroup))) {
      setSelectedGroup(groupedBids[0][0]);
    }
  }, [groupedBids, selectedGroup]);

  const bidCount = filteredBids.length;
  const selectedGroupBids = useMemo(() => {
    if (!selectedGroup) return [];
    const match = groupedBids.find(([groupName]) => groupName === selectedGroup);
    return match ? match[1] : [];
  }, [groupedBids, selectedGroup]);

  const renderBidCard = (bid) => {
    const isParticipated = participations.some((p) => p.bidId === bid._id);
    const participation = isParticipated
      ? participations.find((p) => p.bidId === bid._id)
      : null;
    const participationStatus = (participation?.status || "pending").toLowerCase();
    const bidEndDateTime = getBidEndDateTime(bid);
    const isClosed = bid.status === "closed" || (bidEndDateTime ? nowTime >= bidEndDateTime : false);
    const countdownText = bidEndDateTime
      ? formatCountdown(bidEndDateTime.getTime() - nowTime.getTime())
      : "00:00:00";
    const participantCount = participantCounts[String(bid._id)] || 0;
    const hasNoParticipants = participantCount === 0;
    const qualityText = Object.entries(bid.parameters || {})
      .filter(([, value]) => String(value ?? "").trim() !== "" && String(value) !== "0")
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", ");

    return (
      <div
        key={bid._id}
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-100/80"
      >
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-medium">{bid.group}</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {bid.consignee}
              </h3>
              <p className="text-sm text-slate-600">
                {bid.commodity} - {bid.origin}
              </p>
              <p className="text-sm font-semibold text-red-600 mt-1">
                End time: {bid.endTime} • {isClosed ? "Closed" : countdownText}
              </p>
            </div>
            {isParticipated && (
              <div
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${participationStatus === "accepted" ? "bg-green-100 text-green-700" : participationStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
              >
                {participationStatus === "accepted" ? (
                  <FaCheckCircle />
                ) : participationStatus === "rejected" ? (
                  <FaTimesCircle />
                ) : (
                  <FaHourglassHalf />
                )}
                {participationStatus.charAt(0).toUpperCase() +
                  participationStatus.slice(1)}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Quantity</p>
              <p className="font-semibold text-slate-700">
                {bid.quantity} Tons
              </p>
            </div>
            <div>
              <p className="text-slate-500">Company Rate</p>
              <p className="font-semibold text-slate-700">₹{bid.rate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Quality Parameters</p>
              <p className="font-semibold text-slate-700">
                {qualityText || "N/A"}
              </p>
            </div>
            {isParticipated && (
              <>
                <div>
                  <p className="text-slate-500">Your Rate</p>
                  <p className="font-semibold text-blue-700">
                    ₹{participation.rate}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Your Quantity</p>
                  <p className="font-semibold text-blue-700">
                    {participation.quantity} Tons
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-50/70 px-5 py-3">
          <button
            onClick={() => handleParticipate(bid)}
            disabled={isClosed}
            className={`w-full flex items-center justify-center gap-2 text-sm font-bold rounded-lg py-2 transition-colors ${isClosed ? "text-slate-400 cursor-not-allowed" : "text-emerald-600 hover:bg-emerald-50"}`}
          >
            <FaRegHandPointer />
            {isClosed
              ? activeTab === "closed" && hasNoParticipants
                ? "Closed • No participants"
                : "Bid Closed"
              : isParticipated
                ? "Update Participation"
                : "Participate Now"}
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
        <div className="max-w-6xl mx-auto space-y-6">
          {userRole === "Buyer" && (
            <div className="flex justify-start mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FaArrowLeft />
                Back
              </button>
            </div>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Today Bids
            </button>
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
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Groups (click to view bids)
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupedBids.map(([groupName, groupBids]) => (
                    <button
                      key={groupName}
                      type="button"
                      onClick={() => setSelectedGroup(groupName)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        selectedGroup === groupName
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {groupName} ({groupBids.length})
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg shadow-emerald-900/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-slate-800">
                    {selectedGroup || "Group"} Bids
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {selectedGroupBids.length} bid(s)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedGroupBids.map(renderBidCard)}
                </div>
              </div>
            </div>
          )}
        </div>

        {isPopupOpen && selectedBid && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={`Participate in: ${selectedBid.consignee}`}
          >
            <div className="space-y-4 p-1">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Your Rate
                </span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter your rate"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Your Quantity (Tons)
                </span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Loading From
                </span>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none bg-white"
                  value={loadingFrom}
                  onChange={(e) => setLoadingFrom(e.target.value)}
                >
                  <option value="">Select Loading Location</option>
                  {bidLocations.map((loc) => (
                    <option key={loc._id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Remarks
                </span>
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
