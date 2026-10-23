import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

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
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

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
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [consigneeSellers, setConsigneeSellers] = useState([]);
  const [consigneeSellersLoading, setConsigneeSellersLoading] = useState(false);
  const [consigneeSellersPage, setConsigneeSellersPage] = useState(1);
  const [consigneeSellersHasMore, setConsigneeSellersHasMore] = useState(false);

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

  const fetchData = useCallback(
    async (isSilent = false) => {
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

          const companies = (buyer.companies || []).map((c) =>
            String(c).trim(),
          );

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
    },
    [mobile, normalize, selectedDate, userRole],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification) => {
      const type = notification.type;
      if (
        type === "BidParticipation" ||
        type === "BidRejection" ||
        type === "BidConfirmation"
      ) {
        console.log("Real-time bid update received, refreshing data...");
        fetchData(true);
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

  const openConsigneeSellers = useCallback(async (consignee) => {
    if (!consignee || consignee === "N/A") return;

    setSelectedConsignee(consignee);
    setConsigneeSellers([]);
    setConsigneeSellersPage(1);
    setConsigneeSellersHasMore(false);
    setConsigneeSellersLoading(true);
    try {
      const response = await api.get("/participatebids/consignee-sellers", {
        params: { consignee, page: 1, limit: 10 },
      });
      setConsigneeSellers(response.data?.data || []);
      setConsigneeSellersHasMore(Boolean(response.data?.hasMore));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load consignee sellers.");
      setSelectedConsignee("");
    } finally {
      setConsigneeSellersLoading(false);
    }
  }, []);

  const loadMoreConsigneeSellers = useCallback(async () => {
    if (consigneeSellersLoading || !consigneeSellersHasMore || !selectedConsignee) {
      return;
    }

    const nextPage = consigneeSellersPage + 1;
    setConsigneeSellersLoading(true);
    try {
      const response = await api.get("/participatebids/consignee-sellers", {
        params: { consignee: selectedConsignee, page: nextPage, limit: 10 },
      });
      setConsigneeSellers((previous) => [
        ...previous,
        ...(response.data?.data || []),
      ]);
      setConsigneeSellersPage(nextPage);
      setConsigneeSellersHasMore(Boolean(response.data?.hasMore));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load more consignee sellers.");
    } finally {
      setConsigneeSellersLoading(false);
    }
  }, [consigneeSellersHasMore, consigneeSellersLoading, consigneeSellersPage, selectedConsignee]);

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
        <span className="font-bold text-lux-ink">
          {new Date(bid.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span className="text-[10px] font-medium uppercase text-lux-muted">
          {new Date(bid.date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>,
      <span
        key={`group-${bid.bidId}`}
        className="font-serif font-black uppercase tracking-tight text-lux-emerald"
      >
        {bid.group}
      </span>,
      ["Admin", "Employee"].includes(userRole) ? (
        <button
          key={`consignee-${bid.bidId}`}
          type="button"
          onClick={() => openConsigneeSellers(bid.consignee)}
          className="text-left font-semibold text-lux-emerald underline decoration-dotted underline-offset-4 hover:text-lux-deep"
          title="View top sellers for this consignee"
        >
          {bid.consignee}
        </button>
      ) : (
        <span key={`consignee-${bid.bidId}`} className="font-bold text-lux-ink">
          {bid.consignee}
        </span>
      ),
      bid.origin,
      <span key={`commodity-${bid.bidId}`} className="font-bold text-lux-muted">
        {bid.commodity}
      </span>,
      <div key={`sellers-${bid.bidId}`} className="max-w-[150px]">
        <p className="truncate text-xs font-medium text-lux-muted">
          {Array.from(bid.sellers || []).join(", ") || "N/A"}
        </p>
      </div>,
      <span key={`bidqty-${bid.bidId}`} className="font-black text-lux-ink">
        {bid.quantity} T
      </span>,
      <span
        key={`bidrate-${bid.bidId}`}
        className="font-black text-lux-emerald"
      >
        ₹{bid.rates}
      </span>,
      <span key={`partyqty-${bid.bidId}`} className="font-bold text-lux-emerald">
        {bid.quantities} T
      </span>,
      <span key={`partyrate-${bid.bidId}`} className="font-bold text-lux-emerald">
        ₹{bid.rate}
      </span>,
      <div key={`status-${bid.bidId}`} className="flex flex-col gap-1">
        {bid.pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            {bid.pendingCount} Pending
          </span>
        ) : bid.completedCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
            <FaCheckCircle size={10} />
            Complete
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase text-lux-muted">
            No Activity
          </span>
        )}
      </div>,
      <button
        key={bid.bidId}
        type="button"
        onClick={() => setSelectedBidId(bid.bidId)}
        className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-lux-emerald shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <span className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <FaUsers
            size={12}
            className="transition-transform group-hover:scale-110"
          />
          {bid.mobiles.size} interaction{bid.mobiles.size !== 1 ? "s" : ""}
        </span>
      </button>,
    ]);
  }, [currentPage, openConsigneeSellers, paginatedData, userRole]);

  const consigneeItems = useMemo(() => {
    return [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [bids]);

  const canInteract = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    return target.getTime() === today.getTime();
  }, [selectedDate]);

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
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lux-card lux-gold-top w-full p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                  <FaGavel />
                </div>

                <div>
                  <p className="lux-eyebrow text-lux-emerald">
                    Bids
                  </p>

                  <p className="font-serif text-3xl font-black text-lux-ink">{stats.totalBidsToday}</p>
                </div>
              </div>
            </div>

            <div className="lux-card lux-gold-top w-full p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                  <FaHandshake />
                </div>

                <div>
                  <p className="lux-eyebrow text-lux-emerald">
                    Participations
                  </p>

                  <p className="font-serif text-3xl font-black text-lux-ink">
                    {stats.totalParticipationsToday}
                  </p>
                </div>
              </div>
            </div>

            <div className="lux-card lux-gold-top w-full p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                  <FaCheckCircle />
                </div>

                <div>
                  <p className="lux-eyebrow text-lux-emerald">
                    Accepted Qty
                  </p>

                  <p className="font-serif text-3xl font-black text-lux-ink">
                    {stats.totalAcceptedQty.toFixed(2)} T
                  </p>
                </div>
              </div>
            </div>

            <div className="lux-card lux-gold-top w-full p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                  <FaFilter />
                </div>

                <div>
                  <p className="lux-eyebrow text-lux-emerald">
                    Filtered
                  </p>

                  <p className="font-serif text-3xl font-black text-lux-ink">{stats.filteredResults}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lux-card flex flex-col gap-4 p-4 sm:p-5 xl:flex-row">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
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
                    className="rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2.5 text-lux-ink shadow-sm outline-none focus:ring-2 focus:ring-lux-gold/50"
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
              canInteract={canInteract}
            />
          )}

          <PopupBox
            isOpen={Boolean(selectedConsignee)}
            onClose={() => setSelectedConsignee("")}
            title={`Top sellers for ${selectedConsignee}`}
            width="w-[96vw] max-w-6xl"
            height="h-auto max-h-[90vh]"
          >
            {consigneeSellersLoading ? (
              <Loading />
            ) : (
              <div className="space-y-4">
                <Tables
                  headers={[
                    "Rank",
                    "Seller Name",
                    "Company",
                    "Phone Number",
                    "Sauda Quantity",
                    "Last Sauda",
                  ]}
                  rows={consigneeSellers.map((seller, index) => [
                    index + 1,
                    seller.sellerName || "Unknown",
                    [
                      ...(seller.saudaCompanies || []),
                      ...(seller.sellerCompanies || []).filter(
                        (company) =>
                          !(seller.saudaCompanies || []).includes(company),
                      ),
                    ].filter(Boolean).join(", ") || "N/A",
                    (seller.phoneNumbers || [])
                      .map((phone) => phone?.value)
                      .filter(Boolean)
                      .join(", ") || seller.mobile || "N/A",
                    `${seller.totalSaudaQuantity || 0} T`,
                    seller.lastSaudaAt
                      ? new Date(seller.lastSaudaAt).toLocaleString(
                          "en-IN",
                          { dateStyle: "medium", timeStyle: "short" },
                        )
                      : "N/A",
                  ])}
                />
                {consigneeSellersHasMore && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={loadMoreConsigneeSellers}
                      disabled={consigneeSellersLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {consigneeSellersLoading ? "Loading..." : "Show more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </PopupBox>

          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-6">
              <div className="lux-card overflow-hidden p-4 sm:p-6">
                <div className="p-2">
                  <Tables headers={headers} rows={rows} />
                </div>
              </div>

              <div className="flex justify-center rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 sm:p-6">
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
