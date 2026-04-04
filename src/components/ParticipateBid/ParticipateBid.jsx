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
    if (bids.length === 0 || participations.length === 0) {
      setFilteredData([]);
      return;
    }

    const matchedData = participations
      .filter((p) => String(p.mobile) === String(mobile))
      .map((participation) => {
        const bid = bids.find((b) => b._id === participation.bidId);
        if (!bid) return null;

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
          deliveryDate: participation.deliveryDate
            ? new Date(participation.deliveryDate).toLocaleDateString()
            : "N/A",
          paymentTerms: participation.paymentTerms || "N/A",
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
        item.deliveryDate,
        item.paymentTerms,
        item.participationDate,
        item.status,
      ]);

    setFilteredData(matchedData);
    setCurrentPage(1);
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
    "Delivery Date",
    "Payment Terms",
    "Participation Date",
    "Status",
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-2)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
              >
                <span className="group-hover:-translate-x-1 inline-block transition-transform">
                  ←
                </span>{" "}
                Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Participated Bids
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Track your active and historical bid participations
                </p>
              </div>
            </div>
            <button
              onClick={fetchBidsAndParticipations}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
            >
              Refresh 🔄
            </button>
          </div>

          {filteredData.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Bids Found</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                You haven't participated in any bids yet. Start bidding to see
                them here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Tables headers={headers} rows={currentRows} />
                </div>
              </div>

              <div className="flex justify-center pb-8">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default ParticipateBid;
