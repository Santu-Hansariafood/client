import { lazy, useEffect, useState } from "react";
import axios from "axios";
import { FaRegHandPointer } from "react-icons/fa";
import { useLocation } from "react-router-dom";
const Tables = lazy(() =>import("../../../common/Tables/Tables"));
const Pagination = lazy(() =>import("../../../common/Paginations/Paginations"));
const PopupBox = lazy(() =>import("../../../common/PopupBox/PopupBox"));

const SupplierBidList = () => {
  const location = useLocation();
  const { commodityNames = [], mobile } = location.state || {};
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidCount, setBidCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBids = async () => {
      try {
        if (commodityNames.length === 0) {
          setError("No commodities selected.");
          setLoading(false);
          return;
        }

        const bidsRes = await axios.get("https://phpserver-v77g.onrender.com/api/bids");

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const filteredBids = bidsRes.data
          .filter((bid) => {
            const bidDate = new Date(bid.bidDate);
            return commodityNames.includes(bid.commodity) && bidDate >= sevenDaysAgo;
          })
          .sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));

        setBids(filteredBids);
        setBidCount(filteredBids.length);
        setCurrentPage(1);
      } catch (error) {
        setError("Failed to fetch bid data.",error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
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
        quantity: Number(quantity)
      };

      const response = await axios.post(
        "http://localhost:5000/api/participatebids",
        participationData
      );

      alert("Participation successful!");
      console.log("Server Response:", response.data);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error submitting participation:", error);
      alert("Failed to participate in the bid.");
    }
  };

  const headers = [
    "Count", "Company", "consignee","Commodity", "Quantity", "Rate", "Bid Date", "Start Time", "End Time", "Payment Terms", "Delivery", "Parameters", "Action"
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBids = bids.slice(indexOfFirstItem, indexOfLastItem);

  const rows = currentBids.map((bid, index) => [
    indexOfFirstItem + index + 1,
    bid.group || "N/A",
    bid.consignee || "N/A",
    bid.commodity || "Unknown Commodity",
    bid.quantity || "N/A",
    bid.rate || "N/A",
    bid.bidDate ? new Date(bid.bidDate).toLocaleDateString() : "N/A",
    bid.startTime || "-",
    bid.endTime || "-",
    bid.paymentTerms || "N/A",
    bid.delivery || "N/A",
    bid.parameters ? Object.entries(bid.parameters).map(([key, value]) => `${key}: ${value}`).join(", ") : "No Parameters",
    <button
      onClick={() => handleParticipate(bid)}
      className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
    >
      <FaRegHandPointer /> Participate
    </button>
  ]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Bids ({bidCount})
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading bids...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : bids.length === 0 ? (
        <p className="text-center text-gray-600">
          No active bids available for {commodityNames.join(", ")} in the last 7 days.
        </p>
      ) : (
        <>
          <Tables headers={headers} rows={rows} />
          <Pagination
            currentPage={currentPage}
            totalItems={bidCount}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {isPopupOpen && selectedBid && (
        <PopupBox isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} title="Participate in Bid">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4 text-sm text-gray-700">
              <p><strong>Company:</strong> {selectedBid.group || "N/A"}</p>
              <p><strong>Commodity:</strong> {selectedBid.commodity || "Unknown"}</p>
              <p><strong>Consignee:</strong>{selectedBid.consignee|| "N/A"}</p>
              <p><strong>Origin:</strong>{selectedBid.origin}</p>
              <p><strong>Quantity:</strong> {selectedBid.quantity || "N/A"}<strong> Tons</strong></p>
              <p><strong>Rate: &#x20B9;</strong>  {selectedBid.rate || "N/A"}</p>
              <p><strong>Bid Date:</strong> {new Date(selectedBid.bidDate).toLocaleDateString()}</p>
              <p><strong>Start Time:</strong> {selectedBid.startTime || "-"}</p>
              <p><strong>End Time:</strong> {selectedBid.endTime || "-"}</p>
              <p><strong>Payment Terms:</strong> {selectedBid.paymentTerms || "N/A"}<strong> Days</strong></p>
              <p><strong>Delivery:</strong> {selectedBid.delivery || "N/A"}<strong> Days</strong></p>
              <p><strong>Parameters:</strong> {selectedBid.parameters 
                ? Object.entries(selectedBid.parameters).map(([key, value]) => `${key}: ${value} %`).join(", ") 
                : "No Parameters"}
              </p>
            </div>
                <p><strong>Notes: </strong> {selectedBid.notes || "No Notes for This"} </p>
            <div className="space-y-4">
              <label className="block text-gray-700 font-semibold">Enter Your Rate:</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your rate"
              />

              <label className="block text-gray-700 font-semibold">Enter Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Enter quantity"
              />

              <button
                onClick={handleConfirm}
                className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                Confirm Bids
              </button>
            </div>
          </div>
        </PopupBox>
      )}
    </div>
  );
};

export default SupplierBidList;
