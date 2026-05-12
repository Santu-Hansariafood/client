import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import {
  FaUsers,
  FaArrowLeft,
  FaGavel,
  FaHandshake,
  FaCheckCircle,
  FaFilter,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const InteractionsPopup = lazy(
  () => import("../InteractionsPopup/InteractionsPopup"),
);

const ParticipateBidAdmin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroup = searchParams.get("group") || "All";
  const { userRole, mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [participationBids, setParticipationBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [buyerGroups, setBuyerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [isBuyerAdmin, setIsBuyerAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const normalize = (str) =>
    (str || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "Buyer") {
          const res = await api.get("/bids/buyer-today", {
            params: { mobile, date: selectedDate.toISOString().split("T")[0] },
          });
          const { bids: bidsData, participations, buyer } = res.data;
          setIsBuyerAdmin(buyer.isAdmin || false);

          const groups = (buyer.groups || []).map(normalize);
          const companies = (buyer.companies || []).map((c) =>
            String(c).trim(),
          );
          setBuyerGroups(groups);

          if (groups.length > 0 && selectedGroup === "All") {
            setSelectedGroup(groups[0]);
          }

          const allowedBids = bidsData.filter((bid) => {
            const bidGroup = normalize(bid.group);
            const isOwnBid =
              String(bid.createdByMobile || "") === String(mobile || "");
            const belongsToGroup = groups.includes(bidGroup);
            const belongsToCompany = companies.includes(
              String(bid.company || "").trim(),
            );
            return isOwnBid || belongsToGroup || belongsToCompany;
          });

          setBids(allowedBids);
          setParticipationBids(participations);
        } else {
          const [bidsRes, participateRes] = await Promise.all([
            api.get("/bids"),
            api.get("/participatebids"),
          ]);
          const bidsData = bidsRes.data?.data || bidsRes.data || [];
          const participations =
            participateRes.data?.data || participateRes.data || [];
          setBids(bidsData);
          setParticipationBids(participations);
        }
      } catch {
        // Silent error for polling
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time update: poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [userRole, mobile, selectedDate]);

  const getBidParticipationDetails = useCallback((data) => {
    const groupedBids = {};
    data.forEach((pBid) => {
      const matchingBid = bids.find((bid) => bid._id === pBid.bidId);
      if (!matchingBid) return;

      if (userRole === "Buyer") {
        if (
          selectedGroup !== "All" &&
          normalize(matchingBid.group) !== normalize(selectedGroup)
        ) {
          return;
        }
      }

      if (!groupedBids[pBid.bidId]) {
        groupedBids[pBid.bidId] = {
          bidId: pBid.bidId,
          group: matchingBid.group,
          consignee: matchingBid.consignee || "N/A",
          origin: matchingBid.origin || "N/A",
          commodity: matchingBid.commodity || "N/A",
          quantity: matchingBid.quantity || 0,
          rates: matchingBid.rate || 0,
          rate: pBid.rate || 0,
          date: pBid.createdAt || pBid.participationDate,
          quantities: 0,
          acceptanceQuantity: 0,
          acceptanceRate: 0,
          mobiles: new Set(),
          sellers: new Set(),
        };
      }
      groupedBids[pBid.bidId].mobiles.add(pBid.mobile);
      groupedBids[pBid.bidId].quantities += pBid.quantity || 0;
      groupedBids[pBid.bidId].acceptanceQuantity += pBid.acceptedQuantity || 0;
      if (pBid.acceptedRate)
        groupedBids[pBid.bidId].acceptanceRate = pBid.acceptedRate;

      const sellerLabel =
        userRole === "Buyer"
          ? pBid.sellerCompany || "N/A"
          : pBid.sellerName && pBid.sellerName.trim().length > 0
            ? pBid.sellerName
            : pBid.mobile;
      if (sellerLabel) groupedBids[pBid.bidId].sellers.add(sellerLabel);
    });
    return Object.values(groupedBids).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bids, userRole, selectedGroup]);

  const filteredData = useMemo(() => {
    // 1. Filter by Date
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    let filtered = participationBids.filter((pBid) => {
      const pDate = new Date(pBid.createdAt || pBid.participationDate);
      pDate.setHours(0, 0, 0, 0);
      return pDate.getTime() === targetDate.getTime();
    });

    // 2. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((pBid) => {
        const bid = bids.find((b) => b._id === pBid.bidId);
        return (
          bid &&
          (bid.consignee?.toLowerCase().includes(q) ||
            bid.commodity?.toLowerCase().includes(q) ||
            bid.origin?.toLowerCase().includes(q) ||
            bid.group?.toLowerCase().includes(q))
        );
      });
    }

    return getBidParticipationDetails(filtered);
  }, [participationBids, bids, selectedDate, searchQuery, getBidParticipationDetails]);

  const headers = [
    "Sl No",
    "Date",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    userRole === "Buyer" ? "Companies" : "Sellers",
    "Bid Qty",
    "Bid Rate",
    "Party Qty",
    "Party Rate",
    "Acceptance Qty",
    "Acceptance Rate",
    "Interactions",
  ];

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Auto-reset page if search/filter makes current page invalid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredData, indexOfFirstItem, indexOfLastItem]);

  const rows = currentItems.map((bid, index) => [
    indexOfFirstItem + index + 1,
    new Date(bid.date).toLocaleDateString(),
    bid.group,
    bid.consignee,
    bid.origin,
    bid.commodity,
    Array.from(bid.sellers || []).join(", ") || "N/A",
    bid.quantity,
    bid.rates,
    bid.quantities,
    bid.rate,
    `${bid.acceptanceQuantity} Tons`,
    bid.acceptanceRate ? `₹${bid.acceptanceRate}` : "N/A",
    <button
      key={bid.bidId}
      type="button"
      onClick={() => setSelectedBidId(bid.bidId)}
      className="font-medium text-emerald-700 hover:text-emerald-800 underline decoration-emerald-200 underline-offset-4"
    >
      {bid.mobiles.size} interaction{bid.mobiles.size !== 1 ? "s" : ""}
    </button>,
  ]);

  const consigneeItems = useMemo(
    () =>
      [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [bids],
  );

  const handleSearch = (query) => {
    setSearchQuery(typeof query === "string" ? query : "");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const stats = useMemo(() => {
    const targetDate = new Date(selectedDate || new Date());
    targetDate.setHours(0, 0, 0, 0);

    const bidsCreatedToday = bids.filter((bid) => {
      const bDate = new Date(bid.createdAt || bid.date);
      bDate.setHours(0, 0, 0, 0);
      return bDate.getTime() === targetDate.getTime();
    }).length;

    const todayParticipations = participationBids.filter((pBid) => {
      const pDate = new Date(pBid.createdAt || pBid.participationDate);
      pDate.setHours(0, 0, 0, 0);
      return pDate.getTime() === targetDate.getTime();
    });

    const totalAcceptedQty = todayParticipations.reduce(
      (sum, p) => sum + (p.acceptedQuantity || 0),
      0,
    );

    return {
      totalBidsToday: bidsCreatedToday,
      totalParticipationsToday: todayParticipations.length,
      totalAcceptedQty: totalAcceptedQty,
      filteredResults: filteredData.length,
    };
  }, [selectedDate, bids, participationBids, filteredData.length]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={
          userRole === "Buyer"
            ? "Participate bid list"
            : "Participate bid (admin)"
        }
        subtitle={
          userRole === "Buyer"
            ? "View your company's bid activity"
            : "Monitor participation activity and acceptance in real-time"
        }
        icon={FaUsers}
        noContentCard
      >
        <div className="max-w-[1600px] mx-auto space-y-8 p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                  <FaGavel className="text-xl" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                    Today&apos;s Bids
                  </p>
                  <p className="text-3xl font-black text-slate-800 leading-none mt-1">
                    {stats.totalBidsToday}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <FaHandshake className="text-xl" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                    Participations
                  </p>
                  <p className="text-3xl font-black text-slate-800 leading-none mt-1">
                    {stats.totalParticipationsToday}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-amber-100 shadow-xl shadow-amber-900/5 group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                  <FaCheckCircle className="text-xl" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                    Accepted Qty
                  </p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-1">
                    {stats.totalAcceptedQty.toFixed(2)} T
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-900/5 group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-lg shadow-slate-200">
                  <FaFilter className="text-xl" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Filtered
                  </p>
                  <p className="text-3xl font-black text-slate-800 leading-none mt-1">
                    {stats.filteredResults}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:flex-1">
                <SearchBox
                  placeholder="Search by consignee, commodity..."
                  items={consigneeItems}
                  onSearch={handleSearch}
                  returnQuery={true}
                />
              </div>

              <div className="w-full sm:w-auto flex items-center gap-3 bg-slate-50 p-2 px-4 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <DateSelector
                      selectedDate={selectedDate}
                      onChange={setSelectedDate}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden xl:block" />

            {userRole === "Buyer" && (
              <div className="flex items-center gap-3 w-full xl:w-auto">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 rounded-2xl hover:bg-slate-100 transition shadow-sm border border-slate-200"
                >
                  <FaArrowLeft /> Back
                </button>

                {buyerGroups.length > 1 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="flex-1 xl:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-400/10 outline-none shadow-sm transition-all"
                  >
                    <option value="All">All Groups</option>
                    {buyerGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {selectedBidId && (
            <InteractionsPopup
              bidId={selectedBidId}
              onClose={() => setSelectedBidId(null)}
            />
          )}

          {/* Main Content Area */}
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <Loading />
              <p className="text-sm font-bold text-emerald-600 animate-pulse tracking-widest uppercase">
                Fetching Real-time Data...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 overflow-hidden">
                <div className="p-2">
                  <Tables headers={headers} rows={rows} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ParticipateBidAdmin;
