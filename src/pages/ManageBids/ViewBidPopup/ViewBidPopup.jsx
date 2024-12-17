import { useState, useEffect, useMemo, Suspense } from "react";
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
        const [bidResponse, commodityResponse, locationResponse] =
          await Promise.all([
            fetch(`http://localhost:5000/api/bids/${bidId}`),
            fetch("http://localhost:5000/api/commodities"),
            fetch("http://localhost:5000/api/bid-locations"),
          ]);

        if (!bidResponse.ok || !commodityResponse.ok || !locationResponse.ok) {
          throw new Error("Failed to fetch data. Please try again later.");
        }

        const [bidData, commodityData, locationData] = await Promise.all([
          bidResponse.json(),
          commodityResponse.json(),
          locationResponse.json(),
        ]);

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

  const capitalize = (text) =>
    text ? text.replace(/\b\w/g, (char) => char.toUpperCase()) : "";

  const commodityName = useMemo(() => {
    if (!bidDetails?.commodity) return "Unknown";
    const commodity = commodities.find(
      (item) => item._id === bidDetails.commodity
    );
    return commodity ? capitalize(commodity.name) : "Unknown";
  }, [commodities, bidDetails]);

  const commodityParameters = useMemo(() => {
    if (!bidDetails?.commodity) return null;
    const commodity = commodities.find(
      (item) => item._id === bidDetails.commodity
    );
    if (commodity && commodity.parameters) {
      return commodity.parameters
        .filter((param) => {
          const value = bidDetails.parameters[param._id];
          return value !== "N/A" && value !== 0;
        })
        .map((param) => (
          <li key={param._id}>
            {capitalize(param.parameter)}: {bidDetails.parameters[param._id]}%
          </li>
        ));
    }
    return null;
  }, [commodities, bidDetails]);

  const locationName = useMemo(() => {
    if (!bidDetails?.origin) return "Unknown";
    const location = locations.find((item) => item._id === bidDetails.origin);
    return location ? capitalize(location.name) : "Unknown";
  }, [locations, bidDetails]);

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
                {capitalize(bidDetails.type)} Bid Details
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Company:</strong> {capitalize(bidDetails.company)}
                </p>
                <p>
                  <strong>Origin:</strong> {locationName}
                </p>
                <p>
                  <strong>Commodity:</strong> {commodityName}
                </p>
                {commodityParameters && (
                  <div>
                    <strong>Parameters:</strong>
                    <ul className="list-disc list-inside">
                      {commodityParameters}
                    </ul>
                  </div>
                )}
                <p>
                  <strong>Quantity:</strong> {bidDetails.quantity} TONS
                </p>
                <p>
                  <strong>Rate:</strong> ₹{bidDetails.rate}
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
                  <strong>Payment Terms:</strong>{" "}
                  {capitalize(bidDetails.paymentTerms)}
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
