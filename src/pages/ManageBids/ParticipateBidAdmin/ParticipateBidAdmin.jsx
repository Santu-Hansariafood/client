import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
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
  FaClock,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { getSocket } from "../../../utils/socket/socket";

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

const ITEMS_PER_PAGE = 10;

const ParticipateBidAdmin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialGroup = searchParams.get("group") || "All";

  const { userRole, mobile } = useAuth();

  const [bids, setBids] = useState([]);
  const [participationBids, setParticipationBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBidId, setSelectedBidId] = useState(null);

  const [buyerGroups, setBuyerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(initialGroup);
  const [isBuyerAdmin, setIsBuyerAdmin] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState("");

  const normalize = useCallback((str) => {
    return (str || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      if (userRole === "Buyer") {
        const res = await api.get("/bids/buyer-today", {
          params: {
            mobile,
            date: selectedDate.toISOString().split("T")[0],
          },
        });

        const { bids: bidsData, participations, buyer } = res.data;
        setIsBuyerAdmin(buyer.isAdmin || false);

        const groups = (buyer.groups || []).map(normalize);

        const companies = (buyer.companies || []).map((c) => String(c).trim());

        setBuyerGroups(groups);

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
        const dateStr = selectedDate.toISOString().split("T")[0];
        const [bidsRes, participateRes] = await Promise.all([
          api.get("/bids", { params: { date: dateStr } }),
          api.get("/participatebids", { params: { date: dateStr } }),
        ]);

        const bidsData = bidsRes.data?.data || bidsRes.data || [];

        const participations =
          participateRes.data?.data || participateRes.data || [];

        setBids(bidsData);
        setParticipationBids(participations);
      }
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [mobile, normalize, selectedDate, userRole, selectedGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket listener for real-time updates without polling
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification) => {
      const type = notification.type;
      // Refresh data if any bid participation or status change occurs
      if (
        type === "BidParticipation" ||
        type === "BidRejection" ||
        type === "BidConfirmation"
      ) {
        console.log("Real-time bid update received, refreshing data...");
        fetchData(true); // Silent refresh
      }
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [fetchData]);

  useEffect(() => {
    if (buyerGroups.length > 0 && selectedGroup === "All") {
      setSelectedGroup(buyerGroups[0]);
    }
  }, [buyerGroups, selectedGroup]);

  const getBidParticipationDetails = useCallback(
    (data) => {
      const groupedBids = {};

      data.forEach((pBid) => {
        const matchingBid = bids.find((bid) => bid._id === pBid.bidId);

        if (!matchingBid) return;

        if (
          userRole === "Buyer" &&
          selectedGroup !== "All" &&
          normalize(matchingBid.group) !== normalize(selectedGroup)
        ) {
          return;
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
            pendingCount: 0,
            completedCount: 0,
          };
        }

        const status = (pBid.status || "pending").toLowerCase();
        if (status === "pending") {
          groupedBids[pBid.bidId].pendingCount += 1;
        } else if (status === "accepted" || status === "rejected") {
          groupedBids[pBid.bidId].completedCount += 1;
        }

        groupedBids[pBid.bidId].mobiles.add(pBid.mobile);

        groupedBids[pBid.bidId].quantities += pBid.quantity || 0;

        groupedBids[pBid.bidId].acceptanceQuantity +=
          pBid.acceptedQuantity || 0;

        if (pBid.acceptedRate) {
          groupedBids[pBid.bidId].acceptanceRate = pBid.acceptedRate;
        }

        const sellerLabel =
          userRole === "Buyer"
            ? pBid.sellerCompany || "N/A"
            : pBid.sellerName?.trim()?.length > 0
              ? pBid.sellerName
              : pBid.mobile;

        if (sellerLabel) {
          groupedBids[pBid.bidId].sellers.add(sellerLabel);
        }
      });

      return Object.values(groupedBids).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
    },
    [bids, normalize, selectedGroup, userRole],
  );

  const filteredData = useMemo(() => {
    const targetDate = new Date(selectedDate);

    targetDate.setHours(0, 0, 0, 0);

    let filtered = participationBids.filter((pBid) => {
      const pDate = new Date(pBid.createdAt || pBid.participationDate);

      pDate.setHours(0, 0, 0, 0);

      return pDate.getTime() === targetDate.getTime();
    });

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
  }, [
    bids,
    getBidParticipationDetails,
    participationBids,
    searchQuery,
    selectedDate,
  ]);

  const totalItems = filteredData.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(Number(page));
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(typeof query === "string" ? query : "");
    setCurrentPage(1);
  }, []);

  const stats = useMemo(() => {
    const targetDate = new Date(selectedDate);

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
      totalAcceptedQty,
      filteredResults: filteredData.length,
    };
  }, [bids, filteredData.length, participationBids, selectedDate]);

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
    "Status",
    "Interactions",
  ];

  const rows = useMemo(() => {
    return paginatedData.map((bid, index) => [
      (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
      <div key={`date-${bid.bidId}`} className="flex flex-col">
        <span className="font-bold text-slate-700">
          {new Date(bid.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase">
          {new Date(bid.date).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>,
      <span key={`group-${bid.bidId}`} className="font-black text-emerald-700 uppercase tracking-tighter">{bid.group}</span>,
      <span key={`consignee-${bid.bidId}`} className="font-bold text-slate-800">{bid.consignee}</span>,
      bid.origin,
      <span key={`commodity-${bid.bidId}`} className="font-bold text-slate-600">{bid.commodity}</span>,
      <div key={`sellers-${bid.bidId}`} className="max-w-[150px]">
        <p className="text-xs font-medium text-slate-600 truncate">
          {Array.from(bid.sellers || []).join(", ") || "N/A"}
        </p>
      </div>,
      <span key={`bidqty-${bid.bidId}`} className="font-black text-slate-900">{bid.quantity} T</span>,
      <span key={`bidrate-${bid.bidId}`} className="font-black text-emerald-600">₹{bid.rates}</span>,
      <span key={`partyqty-${bid.bidId}`} className="font-bold text-blue-600">{bid.quantities} T</span>,
      <span key={`partyrate-${bid.bidId}`} className="font-bold text-blue-600">₹{bid.rate}</span>,
      <div key={`status-${bid.bidId}`} className="flex flex-col gap-1">
        {bid.pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {bid.pendingCount} Pending
          </span>
        ) : bid.completedCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-emerald-200">
            <FaCheckCircle size={10} />
            Complete
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 uppercase">No Activity</span>
        )}
      </div>,
      <button
        key={bid.bidId}
        type="button"
        onClick={() => setSelectedBidId(bid.bidId)}
        className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <FaUsers size={12} className="group-hover:scale-110 transition-transform" />
          {bid.mobiles.size} interaction{bid.mobiles.size !== 1 ? "s" : ""}
        </span>
      </button>,
    ]);
  }, [currentPage, paginatedData]);

  const consigneeItems = useMemo(() => {
    return [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [bids]);

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
            <div className="bg-white p-6 rounded-[2rem] shadow border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <FaGavel />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-emerald-600">
                    Bids
                  </p>

                  <p className="text-3xl font-black">{stats.totalBidsToday}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <FaHandshake />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-blue-600">
                    Participations
                  </p>

                  <p className="text-3xl font-black">
                    {stats.totalParticipationsToday}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <FaCheckCircle />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-amber-600">
                    Accepted Qty
                  </p>

                  <p className="text-3xl font-black">
                    {stats.totalAcceptedQty.toFixed(2)} T
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center">
                  <FaFilter />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-600">
                    Filtered
                  </p>

                  <p className="text-3xl font-black">{stats.filteredResults}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow border">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBox
                  placeholder="Search by consignee, commodity..."
                  items={consigneeItems}
                  onSearch={handleSearch}
                  returnQuery={true}
                />
              </div>

              <DateSelector
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
            </div>

            {userRole === "Buyer" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 font-bold"
                >
                  <FaArrowLeft />
                </button>

                {buyerGroups.length > 1 && (
                  <select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2.5 rounded-2xl border"
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

          {loading ? (
            <div className="py-32 flex justify-center">
              <Loading />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white border shadow overflow-hidden">
                <div className="p-2">
                  <Tables headers={headers} rows={rows} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border shadow flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={ITEMS_PER_PAGE}
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
