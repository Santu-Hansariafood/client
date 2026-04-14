import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/apiClient/apiClient";
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
  const [mobileCardsData, setMobileCardsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBidsAndParticipations = async () => {
    try {
      const [bidsRes, participateRes, confirmBidsRes] = await Promise.all([
        api.get("/bids"),
        api.get("/participatebids"),
        api.get("/confirm-bid"),
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
          acceptedRate: participation.acceptedRate,
          acceptedQuantity: participation.acceptedQuantity,
          deliveryDate: participation.deliveryDate
            ? new Date(participation.deliveryDate).toLocaleDateString()
            : "N/A",
          paymentTerms: participation.paymentTerms || "N/A",
          participationDate: new Date(
            participation.participationDate,
          ).toLocaleString(),
          rawDate: new Date(participation.participationDate),
          status: bidStatus,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => b.rawDate - a.rawDate);

    setMobileCardsData(matchedData);
    const tableRows = matchedData.map((item, index) => [
        index + 1,
        item.group,
        item.consignee,
        item.origin,
        item.commodity,
        item.quantity,
        item.rate,
        item.participationRate,
        item.participationQuantity,
        item.acceptedRate || "N/A",
        item.acceptedQuantity || "N/A",
        item.deliveryDate,
        item.paymentTerms,
        item.participationDate,
        item.status,
      ]);

    setFilteredData(tableRows);
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
    "Accepted Rate",
    "Accepted Quantity",
    "Delivery Date",
    "Payment Terms",
    "Participation Date",
    "Status",
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const currentMobileCards = mobileCardsData.slice(indexOfFirstItem, indexOfLastItem);
  const statusCounts = {
    accepted: mobileCardsData.filter((item) => item.status === "accepted").length,
    rejected: mobileCardsData.filter((item) => item.status === "rejected").length,
    pending: mobileCardsData.filter((item) => item.status === "Pending").length,
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/40 to-sky-50/50 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate(-2)}
                  className="group shrink-0 p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  <span className="group-hover:-translate-x-1 inline-block transition-transform">
                    ←
                  </span>{" "}
                  Back
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Participated Bids
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Premium tracking of your live and historical bid activity
                  </p>
                </div>
              </div>
              <button
                onClick={fetchBidsAndParticipations}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
              >
                Refresh 🔄
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Total
                </p>
                <p className="text-lg font-bold text-slate-800">{mobileCardsData.length}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold">
                  Pending
                </p>
                <p className="text-lg font-bold text-amber-800">{statusCounts.pending}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">
                  Accepted
                </p>
                <p className="text-lg font-bold text-emerald-800">{statusCounts.accepted}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-rose-700 font-semibold">
                  Rejected
                </p>
                <p className="text-lg font-bold text-rose-800">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>

          {mobileCardsData.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No Bids Found
              </h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                You haven&apos;t participated in any bids yet. Start bidding to
                see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                  <Tables headers={headers} rows={currentRows} />
                </div>
              </div>
              <div className="md:hidden space-y-3">
                {currentMobileCards.map((item, idx) => (
                  <div
                    key={`${item.participationDate}-${idx}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {item.group}
                        </p>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5">
                          {item.consignee}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.commodity} • {item.origin}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          item.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-3">
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                        <p className="text-[10px] text-slate-500 font-semibold">Bid Rate</p>
                        <p className="text-sm font-bold text-slate-800">₹{item.rate}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                        <p className="text-[10px] text-slate-500 font-semibold">Your Rate</p>
                        <p className="text-sm font-bold text-blue-700">₹{item.participationRate}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                        <p className="text-[10px] text-slate-500 font-semibold">Bid Qty</p>
                        <p className="text-sm font-bold text-slate-800">{item.quantity}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
                        <p className="text-[10px] text-slate-500 font-semibold">Your Qty</p>
                        <p className="text-sm font-bold text-blue-700">{item.participationQuantity}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-700">Delivery:</span>{" "}
                        {item.deliveryDate}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Payment:</span>{" "}
                        {item.paymentTerms}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Participated:</span>{" "}
                        {item.participationDate}
                      </p>
                    </div>
                  </div>
                ))}
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
