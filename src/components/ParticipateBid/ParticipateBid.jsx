import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext/AuthContext";
import Loading from "../../common/Loading/Loading";

const Tables = lazy(() => import("../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../common/Paginations/Paginations"));

const ParticipateBid = () => {
  const navigate = useNavigate();
  const { mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [bidStatuses, setBidStatuses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBidsAndParticipations = async () => {
    try {
      const [bidsRes, participateRes, confirmBidsRes] = await Promise.all([
        axios.get("/bids"),
        axios.get("/participatebids"),
        axios.get("/confirm-bid"),
      ]);

      setBids(bidsRes.data?.data || bidsRes.data || []);
      setParticipations(participateRes.data?.data || participateRes.data || []);
      setBidStatuses(confirmBidsRes.data?.data || confirmBidsRes.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchBidsAndParticipations();
  }, []);

  useEffect(() => {
    if (bids.length > 0 && participations.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const matchedData = participations
        .filter((p) => String(p.mobile) === String(mobile))
        .map((participation) => {
          const bid = bids.find((b) => b._id === participation.bidId);
          if (!bid) return null;

          const bidDate = new Date(participation.participationDate);
          bidDate.setHours(0, 0, 0, 0);
          if (bidDate < sevenDaysAgo) return null;

          const bidStatus =
            bidStatuses.find((c) => c.bidId === bid._id)?.status || "Pending";

          return {
            group: bid.group || "N/A",
            consignee: bid.consignee || "N/A",
            origin: bid.origin || "N/A",
            commodity: bid.commodity || "Unknown Commodity",
            quantity: bid.quantity || "N/A",
            rate: bid.rate || "N/A",
            participationRate: participation.rate || "N/A",
            participationQuantity: participation.quantity || "N/A",
            participationDate: new Date(
              participation.participationDate
            ).toLocaleString(),
            rawDate: new Date(participation.participationDate),
            status: bidStatus,
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => b.rawDate - a.rawDate)
        .map((item, index) => [
          index + 1,
          item.group,
          item.consignee,
          item.origin,
          item.commodity,
          item.quantity,
          item.rate,
          item.participationRate,
          item.participationQuantity,
          item.participationDate,
          item.status,
        ]);

      setFilteredData(matchedData);
      setCurrentPage(1);
    }
  }, [bids, participations, bidStatuses, mobile]);

  const headers = [
    "Count",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Bid Quantity",
    "Bid Rate",
    "Participation Rate",
    "Participation Quantity",
    "Participation Date",
    "Status",
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 sm:p-6 bg-white shadow-md rounded-md w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-2)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            ← Back
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center flex-grow">
            Participated Bids
          </h2>
          <button
            onClick={fetchBidsAndParticipations}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Refresh 🔄
          </button>
        </div>
        <div className="overflow-x-auto">
          <Tables headers={headers} rows={currentRows} />
        </div>
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </Suspense>
  );
};

export default ParticipateBid;
