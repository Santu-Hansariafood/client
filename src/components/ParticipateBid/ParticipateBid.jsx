import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/apiClient/apiClient";
import { useAuth } from "../../context/AuthContext/AuthContext";
import Loading from "../../common/Loading/Loading";
import { formatDateTime } from "../../utils/textUtils/textUtils";

const Tables = lazy(() => import("../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../common/Paginations/Paginations"));

const ParticipateBid = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroup = searchParams.get("group") || "All";
  const { mobile, userRole } = useAuth();
  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [bidStatuses, setBidStatuses] = useState([]);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [buyerGroups, setBuyerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [filteredData, setFilteredData] = useState([]);
  const [mobileCardsData, setMobileCardsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBidsAndParticipations = async () => {
    try {
      const [bidsRes, participateRes, confirmBidsRes, buyerTodayRes] = await Promise.all([
        api.get("/bids"),
        api.get("/participatebids", { params: { mobile } }),
        api.get("/confirm-bid", { params: { mobile } }),
        userRole === "Buyer" ? api.get("/bids/buyer-today", { params: { mobile, date: new Date().toISOString().split("T")[0] } }) : Promise.resolve({ data: {} }),
      ]);

      setBids(bidsRes.data?.data || bidsRes.data || []);
      setParticipations(participateRes.data?.data || participateRes.data || []);
      setBidStatuses(confirmBidsRes.data?.data || confirmBidsRes.data || []);
      if (userRole === "Buyer") {
        const groups = buyerTodayRes.data.buyer?.groups || [];
        setBuyerGroups(groups);
        if (groups.length > 0 && selectedGroup === "All") {
          setSelectedGroup(groups[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchBidsAndParticipations();

    const fetchBuyerProfile = async () => {
      try {
        if (userRole === "Buyer" && mobile) {
          const res = await api.get(`/buyers?mobile=${mobile}`);
          if (res.data && res.data.length > 0) {
            setBuyerProfile(res.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching buyer profile", error);
      }
    };
    fetchBuyerProfile();
  }, [mobile, userRole]);

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

        if (selectedGroup !== "All" && bid.group !== selectedGroup) {
          return null;
        }

        const bidStatus =
          bidStatuses.find((c) => c.bidId === bid._id)?.status || "Pending";

        return {
          group: bid.group || "N/A",
          consignee: bid.consignee || "N/A",
          origin: bid.origin || "N/A",
          commodity: bid.commodity || "Unknown Commodity",
          quantity: bid.quantity || "N/A",
          rate: bid.rate || "N/A",
          company: bid.company || "N/A",
          participationRate: participation.rate || "N/A",
          participationQuantity: participation.quantity || "N/A",
          acceptedRate: participation.acceptedRate,
          acceptedQuantity: participation.acceptedQuantity,
          acceptedAt: participation.acceptedAt
            ? formatDateTime(participation.acceptedAt)
            : "N/A",
          participationStatus: participation.status || "pending",
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
      item.company,
      item.consignee,
      item.origin,
      item.commodity,
      item.quantity,
      item.rate,
      item.participationRate,
      item.participationQuantity,
      item.acceptedRate || "N/A",
      item.acceptedQuantity || "N/A",
      item.acceptedAt,
      item.deliveryDate,
      item.paymentTerms,
      item.participationDate,
      item.status,
    ]);

    setFilteredData(tableRows);
    setCurrentPage(1);
  }, [bids, participations, bidStatuses, mobile, selectedGroup]);

  const headers = [
    "Count",
    "Group",
    "Company",
    "Consignee",
    "Origin",
    "Commodity",
    "Bid Quantity",
    "Bid Rate",
    "Participation Rate",
    "Participation Quantity",
    "Accepted Rate",
    "Accepted Quantity",
    "Accepted On",
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
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 rounded-3xl lux-card p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="group shrink-0 p-2.5 bg-lux-cream border border-[#e9e2d3] text-lux-emerald rounded-xl hover:bg-lux-ivory transition-all shadow-sm"
                >
                  <span className="group-hover:-translate-x-1 inline-block transition-transform">
                    ←
                  </span>{" "}
                  Back
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-lux-ink">
                    Participated Bids
                  </h2>
                  <p className="text-xs sm:text-sm text-lux-muted font-medium">
                    Premium tracking of your live and historical bid activity
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {userRole === "Buyer" && buyerGroups.length > 1 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-display font-bold text-lux-gold uppercase tracking-wider ml-1">
                      Filter by Group
                    </span>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-[#e9e2d3] bg-lux-ivory text-sm font-semibold text-lux-ink focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none min-w-[180px] h-[42px]"
                    >
                      <option value="All">All My Groups</option>
                      {buyerGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={fetchBidsAndParticipations}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft font-semibold rounded-xl ring-1 ring-lux-gold/30 hover:from-lux-deep hover:to-lux-night transition-all shadow-md shadow-lux-emerald/15"
                >
                  Refresh 🔄
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-[#e9e2d3] bg-lux-cream px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-lux-muted font-semibold">
                  Total
                </p>
                <p className="text-lg font-bold text-lux-ink">{mobileCardsData.length}</p>
              </div>
              <div className="rounded-xl border border-[#e6dcc4] bg-lux-gold/15 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-lux-gold font-semibold">
                  Pending
                </p>
                <p className="text-lg font-bold text-lux-ink">{statusCounts.pending}</p>
              </div>
              <div className="rounded-xl border border-[#e9e2d3] bg-lux-ivory px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-lux-emerald font-semibold">
                  Accepted
                </p>
                <p className="text-lg font-bold text-lux-emerald">{statusCounts.accepted}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-red-700 font-semibold">
                  Rejected
                </p>
                <p className="text-lg font-bold text-red-700">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>

          {mobileCardsData.length === 0 ? (
            <div className="py-20 text-center lux-card rounded-3xl shadow-sm">
              <div className="w-16 h-16 bg-lux-ivory rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-lux-ink">
                No Bids Found
              </h3>
              <p className="text-lux-muted mt-1 max-w-xs mx-auto">
                You haven&apos;t participated in any bids yet. Start bidding to
                see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="hidden md:block lux-card rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                  <Tables headers={headers} rows={currentRows} />
                </div>
              </div>
              <div className="md:hidden space-y-3">
                {currentMobileCards.map((item, idx) => (
                  <div
                    key={`${item.participationDate}-${idx}`}
                    className="rounded-2xl border border-[#e9e2d3] bg-lux-cream p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-lux-gold">
                          {item.group}
                        </p>
                        <h3 className="text-base font-serif font-bold text-lux-ink mt-0.5">
                          {item.consignee}
                        </h3>
                        <p className="text-xs text-lux-muted mt-0.5">
                          {item.commodity} • {item.origin}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          item.status === "accepted"
                            ? "bg-lux-ivory text-lux-emerald border-[#e9e2d3]"
                            : item.status === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-lux-gold/15 text-lux-gold border-[#e6dcc4]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-3">
                      <div className="rounded-lg bg-lux-ivory border border-[#e9e2d3] px-2.5 py-2">
                        <p className="text-[10px] text-lux-muted font-semibold">Bid Rate</p>
                        <p className="text-sm font-bold text-lux-ink">₹{item.rate}</p>
                      </div>
                      <div className="rounded-lg bg-lux-ivory border border-[#e9e2d3] px-2.5 py-2">
                        <p className="text-[10px] text-lux-muted font-semibold">Your Rate</p>
                        <p className="text-sm font-bold text-lux-emerald">₹{item.participationRate}</p>
                      </div>
                      <div className="rounded-lg bg-lux-ivory border border-[#e9e2d3] px-2.5 py-2">
                        <p className="text-[10px] text-lux-muted font-semibold">Bid Qty</p>
                        <p className="text-sm font-bold text-lux-ink">{item.quantity}</p>
                      </div>
                      <div className="rounded-lg bg-lux-ivory border border-[#e9e2d3] px-2.5 py-2">
                        <p className="text-[10px] text-lux-muted font-semibold">Your Qty</p>
                        <p className="text-sm font-bold text-lux-emerald">{item.participationQuantity}</p>
                      </div>
                    </div>
                    {(item.participationStatus === "accepted" ||
                      item.acceptedAt !== "N/A") && (
                      <div className="mt-3 rounded-xl border border-[#e9e2d3] bg-lux-ivory p-2.5 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-lux-emerald font-semibold">
                            Accepted Rate
                          </p>
                          <p className="text-sm font-bold text-lux-emerald">
                            ₹{item.acceptedRate || item.participationRate}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-lux-emerald font-semibold">
                            Accepted Qty
                          </p>
                          <p className="text-sm font-bold text-lux-emerald">
                            {item.acceptedQuantity || item.participationQuantity}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-lux-emerald font-semibold">
                            Accepted On
                          </p>
                          <p className="text-sm font-bold text-lux-emerald">
                            {item.acceptedAt}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-lux-muted">
                      <p>
                        <span className="font-semibold text-lux-ink">Delivery:</span>{" "}
                        {item.deliveryDate}
                      </p>
                      <p>
                        <span className="font-semibold text-lux-ink">Payment:</span>{" "}
                        {item.paymentTerms}
                      </p>
                      <p>
                        <span className="font-semibold text-lux-ink">Participated:</span>{" "}
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
