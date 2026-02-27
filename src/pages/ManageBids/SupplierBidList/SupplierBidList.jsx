import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaRegHandPointer } from "react-icons/fa";
import { IoArrowBack, IoRefresh } from "react-icons/io5";
import Loading from "../../../common/Loading/Loading";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const SupplierBidList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { commodityNames = [], mobile } = location.state || {};

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidCount, setBidCount] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchBids = async () => {
    setLoading(true);
    setError(null);
    try {
      if (commodityNames.length === 0) {
        setError("No commodities selected.");
        setLoading(false);
        return;
      }
      const bidsRes = await axios.get("https://phpserver-kappa.vercel.app/api/bids");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const filteredBids = bidsRes.data
        .filter((bid) => {
          const bidDate = new Date(bid.bidDate);
          bidDate.setHours(0, 0, 0, 0);
          return (
            commodityNames.includes(bid.commodity) && bidDate >= sevenDaysAgo
          );
        })
        .sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));
      setBids(filteredBids);
      setBidCount(filteredBids.length);
    } catch (error) {
      setError("Failed to fetch bid data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line
  }, [commodityNames]);

  const handleParticipate = (bid) => {
    setSelectedBid(bid);
    setRate(bid.rate || "");
    setQuantity(bid.quantity || "");
    setIsPopupOpen(true);
  };

  const handleConfirm = async () => {
    if (!rate || !quantity) {
      alert("Please enter a valid rate and quantity.");
      return;
    }
    try {
      const participationData = {
        bidId: selectedBid._id,
        mobile: mobile,
        rate: Number(rate),
        quantity: Number(quantity),
      };
      await axios.post(
        "https://phpserver-kappa.vercel.app/api/participatebids",
        participationData
      );
      alert("Participation successful!");
      setIsPopupOpen(false);
    } catch (error) {
      alert("Failed to participate in the bid.");
    }
  };

  const groupedBids = useMemo(() => {
    const now = new Date();
    const groups = {};
    bids.forEach((bid) => {
      if (bid.endTime && new Date(bid.endTime) > now) {
        if (!groups[bid.group]) groups[bid.group] = [];
        groups[bid.group].push(bid);
      }
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [bids]);

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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Manage Bids ({bidCount})
        </h1>
        {loading ? (
          <p className="text-center text-gray-600">Loading bids...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : groupedBids.length === 0 ? (
          <p className="text-center text-gray-600">
            No active bids available for {commodityNames.join(", ")} in the last 7 days.
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
                      rows={groupBids.map((bid) => [
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
                        <button
                          onClick={() => handleParticipate(bid)}
                          className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                        >
                          <FaRegHandPointer /> Participate
                        </button>,
                      ])}
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
