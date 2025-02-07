import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Tables from "../../../common/Tables/Tables";

const SupplierBidList = () => {
  const { mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const [sellersRes, commoditiesRes, bidsRes] = await Promise.all([
          axios.get("https://phpserver-v77g.onrender.com/api/sellers"),
          axios.get("https://phpserver-v77g.onrender.com/api/commodities"),
          axios.get("https://phpserver-v77g.onrender.com/api/bids"),
        ]);

        const seller = sellersRes.data.find((s) =>
          s.phoneNumbers.some((p) => String(p.value) === String(mobile))
        );

        if (!seller) {
          setError("No seller found for this mobile number.");
          setLoading(false);
          return;
        }

        const commodityMap = {};
        commoditiesRes.data.forEach((commodity) => {
          commodityMap[commodity._id] = commodity.name;
        });

        const sellerCommodityIds = seller.commodities.map((c) => c._id);

        const sellerBids = bidsRes.data
          .filter((bid) => sellerCommodityIds.includes(bid.commodity))
          .map((bid) => ({
            ...bid,
            commodityName: commodityMap[bid.commodity] || "Unknown Commodity",
          }));

        setBids(sellerBids);
      } catch (error) {
        setError("Failed to fetch bid data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [mobile]);

  const headers = [
    "Company",
    "Commodity",
    "Quantity",
    "Rate",
    "Bid Date",
    "Start Time",
    "End Time",
    "Payment Terms",
    "Delivery",
  ];

  const rows = bids.map((bid) => [
    bid.company,
    bid.commodityName,
    bid.quantity,
    bid.rate,
    new Date(bid.bidDate).toLocaleDateString(),
    bid.startTime,
    bid.endTime,
    bid.paymentTerms,
    bid.delivery,
  ]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Manage Bids</h1>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : <Tables headers={headers} rows={rows} />}
    </div>
  );
};

export default SupplierBidList;
