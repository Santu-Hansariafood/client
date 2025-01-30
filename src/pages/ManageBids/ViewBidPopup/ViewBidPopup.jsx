import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Loading from "../../../common/Loading/Loading";

const ViewBidPopup = ({ bidId, onClose }) => {
  const [bidDetails, setBidDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBidDetails = async () => {
      try {
        const response = await fetch(`https://phpserver-v77g.onrender.com/api/bids/${bidId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch bid details.");
        }
        const data = await response.json();
        setBidDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bidId) fetchBidDetails();
  }, [bidId]);

  if (!bidId) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
        <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500" onClick={onClose}>
          ✖
        </button>
        {loading ? (
          <Loading />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center uppercase">{bidDetails.type} Bid Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Group:</strong> {bidDetails.group}</p>
              <p><strong>Consignee:</strong> {bidDetails.consignee}</p>
              <p><strong>Origin:</strong> {bidDetails.origin}</p>
              <p><strong>Commodity:</strong> {bidDetails.commodity}</p>
              <div>
                <strong>Quality Parameters:</strong>
                <ul className="list-disc list-inside border-dotted border-b-2 pb-2 mt-1">
                  {Object.entries(bidDetails.parameters).map(([key, value]) => (
                    <li key={key}>{key}: {value}%</li>
                  ))}
                </ul>
              </div>
              <p><strong>Quantity:</strong> {bidDetails.quantity} TONS</p>
              <p><strong>Rate:</strong> ₹{bidDetails.rate}</p>
              <p><strong>Bid Date:</strong> {new Date(bidDetails.bidDate).toLocaleDateString("en-GB")}</p>
              <p><strong>Start Time:</strong> {bidDetails.startTime}</p>
              <p><strong>End Time:</strong> {bidDetails.endTime}</p>
              <p><strong>Payment Terms:</strong> {bidDetails.paymentTerms}</p>
              <p><strong>Delivery:</strong> {bidDetails.delivery}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ViewBidPopup.propTypes = {
  bidId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ViewBidPopup;
