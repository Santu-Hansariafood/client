import { useState, useEffect, Suspense } from "react";
import Loading from "../../../common/Loading/Loading";
import PropTypes from "prop-types";

const ViewBidPopup = ({ bidId, onClose }) => {
  const [bidDetails, setBidDetails] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bidResponse = await fetch(
          `http://localhost:5000/api/bids/${bidId}`
        );
        if (!bidResponse.ok) {
          throw new Error("Failed to fetch bid details.");
        }
        const bidData = await bidResponse.json();
        const commodityResponse = await fetch(
          "http://localhost:5000/api/commodities"
        );
        if (!commodityResponse.ok) {
          throw new Error("Failed to fetch commodities.");
        }
        const commodityData = await commodityResponse.json();
        const locationResponse = await fetch(
          "http://localhost:5000/api/bid-locations"
        );
        if (!locationResponse.ok) {
          throw new Error("Failed to fetch bid locations.");
        }
        const locationData = await locationResponse.json();
        setBidDetails(bidData);
        setCommodities(commodityData);
        setLocations(locationData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bidId) {
      fetchData();
    }
  }, [bidId]);

  const getCommodityName = (commodityId) => {
    const commodity = commodities.find((item) => item._id === commodityId);
    return commodity ? commodity.name : "Unknown";
  };

  const getCommodityParameters = (commodityId) => {
    const commodity = commodities.find((item) => item._id === commodityId);
    if (commodity && commodity.parameters) {
      return commodity.parameters.map((param) => (
        <li key={param._id}>
          {param.parameter}: {bidDetails.parameters[param._id] || "N/A"} %
        </li>
      ));
    }
    return <li>Unknown</li>;
  };

  const getLocationName = (locationId) => {
    const location = locations.find((item) => item._id === locationId);
    return location ? location.name : "Unknown";
  };

  if (!bidId) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
          <button
            className="absolute top-2 right-2 text-gray-600"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>
          {loading ? (
            <Loading />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-4 text-center">
                {" "}
                {bidDetails.type} Bid Details
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Company:</strong> {bidDetails.company}
                </p>
                <p>
                  <strong>Origin:</strong> {getLocationName(bidDetails.origin)}
                </p>
                <p>
                  <strong>Commodity:</strong>{" "}
                  {getCommodityName(bidDetails.commodity)}
                </p>
                <p>
                  <strong>Parameters:</strong>
                </p>
                <ul className="list-disc list-inside">
                  {getCommodityParameters(bidDetails.commodity)}
                </ul>
                <p>
                  <strong>Quantity:</strong> {bidDetails.quantity}{" "}
                  {bidDetails.unit}
                </p>
                <p>
                  <strong>Rate:</strong> {bidDetails.rate}
                </p>
                <p>
                  <strong>Bid Date:</strong>{" "}
                  {new Date(bidDetails.bidDate).toLocaleString()}
                </p>
                <p>
                  <strong>Start Time:</strong> {bidDetails.startTime}
                </p>
                <p>
                  <strong>End Time:</strong> {bidDetails.endTime}
                </p>
                <p>
                  <strong>Payment Terms:</strong> {bidDetails.paymentTerms}
                </p>
                <p>
                  <strong>Delivery:</strong> {bidDetails.delivery} days
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
};

ViewBidPopup.propTypes = {
  bidId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ViewBidPopup;
