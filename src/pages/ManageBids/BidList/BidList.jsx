import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaGavel, FaArrowLeft, FaUsers, FaClock, FaSearch, FaLayerGroup, FaChartLine } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const BidList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroup = searchParams.get("group") || "All";
  const { userRole, mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [consigneeSellers, setConsigneeSellers] = useState([]);
  const [consigneeSellersLoading, setConsigneeSellersLoading] = useState(false);
  const [consigneeSellersPage, setConsigneeSellersPage] = useState(1);
  const [consigneeSellersHasMore, setConsigneeSellersHasMore] = useState(false);
  const [editableRateQuantity, setEditableRateQuantity] = useState(null);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredConsignees, setFilteredConsignees] = useState([]);
  const [reactivateBid, setReactivateBid] = useState(null);
  const [buyerGroups, setBuyerGroups] = useState([]);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState(initialGroup);
  const [isBuyerAdmin, setIsBuyerAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === "Buyer") {
          const res = await api.get("/bids/buyer-today", {
            params: { mobile, date: new Date().toISOString().split("T")[0] },
          });
          const { bids: items, buyer } = res.data;
          setIsBuyerAdmin(buyer.isAdmin || false);
          setBuyerGroups(buyer.groups || []);
          setBuyerCompanies(buyer.companies || []);
          setBids(items);

          if (buyer.groups && buyer.groups.length > 0 && selectedFilterGroup === "All") {
            setSelectedFilterGroup(buyer.groups[0]);
          }
        } else {
          const bidsRes = await api.get("/bids");
          const items = bidsRes.data?.data || bidsRes.data || [];
          setIsBuyerAdmin(false);
          setBuyerGroups([]);
          setBids(items);
        }
      } catch {
        setError("Error fetching data. Please try again later.");
      }
    };
    fetchData();
  }, [userRole, mobile]);

  const filteredBids = useMemo(() => {
    const now = new Date();
    const getISODate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = getISODate(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = getISODate(yesterday);

    // Helper for normalizing group names
    const normalize = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const normalizedBuyerGroups = (buyerGroups || []).map(normalize);

    return bids
      .filter((bid) => {
        // Handle bidDate which can be a string or a Date object
        let bidDateObj;
        try {
          bidDateObj = new Date(bid.bidDate);
        } catch {
          return false;
        }

        const bidDateStr = getISODate(bidDateObj);
        const isToday = bidDateStr === todayStr;
        const isYesterday = bidDateStr === yesterdayStr;

        let bidStartTime = null;
        let bidEndTime = null;

        if (isToday) {
          if (bid.startTime) {
            const [sH, sM] = bid.startTime.split(":").map(Number);
            bidStartTime = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              sH,
              sM,
            );
          }
          if (bid.endTime) {
            const [eH, eM] = bid.endTime.split(":").map(Number);
            bidEndTime = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              eH,
              eM,
            );
          }
        }

        let matches = false;

        if (activeTab === "active") {
          matches =
            isToday &&
            bidStartTime &&
            bidEndTime &&
            now >= bidStartTime &&
            now <= bidEndTime;
        } else if (activeTab === "closed") {
          matches = isToday && bidEndTime && now > bidEndTime;
        } else if (activeTab === "previous") {
          matches = isYesterday;
        }

        if (!matches) return false;

        if (
          filteredConsignees.length > 0 &&
          !filteredConsignees.includes(bid.consignee)
        ) {
          return false;
        }

        if (userRole === "Admin" || userRole === "Employee") {
          return true;
        }

        if (userRole === "Buyer") {
          // If a specific group is selected, check it first
          if (
            selectedFilterGroup !== "All" &&
            normalize(bid.group) !== normalize(selectedFilterGroup)
          ) {
            return false;
          }

          // Then check if the bid belongs to ANY of the buyer's groups, companies, or is their own bid
          const bidGroupNormalized = normalize(bid.group);
          const belongsToGroup = normalizedBuyerGroups.includes(bidGroupNormalized);
          const belongsToCompany = (buyerCompanies || []).includes(bid.company);
          const isOwnBid =
            String(bid.createdByMobile || "") === String(mobile || "");

          if (!belongsToGroup && !belongsToCompany && !isOwnBid) return false;

          // For non-admins, ensure they only see their own bids or those from admins/employees for their company
          if (!isBuyerAdmin) {
            const role = String(bid.createdByRole || "").toLowerCase();
            const creatorMobile = String(bid.createdByMobile || "");
            const currentMobile = String(mobile || "");

            const createdByAdminOrEmployee =
              role === "admin" || role === "employee";
            const createdByCurrentBuyer =
              creatorMobile !== "" && creatorMobile === currentMobile;

            if (!createdByAdminOrEmployee && !createdByCurrentBuyer) {
              if (!(buyerCompanies || []).includes(bid.company)) return false;
            }
          }
          return true;
        }

        // Only Admin and Employee can display the full list, other roles see nothing here
        return false;
      })
      .sort((a, b) => {
        const dateA = new Date(a.closedAt || a.updatedAt || a.createdAt);
        const dateB = new Date(b.closedAt || b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
  }, [
    bids,
    activeTab,
    filteredConsignees,
  ]);

  const consigneeItems = useMemo(
    () =>
      [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [bids],
  );

  const handleSearchConsignee = (filteredNames) => {
    if (Array.isArray(filteredNames)) {
      if (filteredNames.length === consigneeItems.length) {
        setFilteredConsignees([]);
      } else {
        setFilteredConsignees(filteredNames);
      }
    } else {
      setFilteredConsignees([]);
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-GB");

  const openConsigneeSellers = async (consignee) => {
    if (
      !["Admin", "Employee"].includes(userRole) ||
      !consignee ||
      consignee === "N/A"
    ) {
      return;
    }

    setSelectedConsignee(consignee);
    setConsigneeSellers([]);
    setConsigneeSellersPage(1);
    setConsigneeSellersHasMore(false);
    setConsigneeSellersLoading(true);
    try {
      const response = await api.get("/bids/consignee-sellers", {
        params: { consignee, page: 1, limit: 10 },
      });
      setConsigneeSellers(response.data?.data || []);
      setConsigneeSellersHasMore(Boolean(response.data?.hasMore));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load consignee sellers.",
      );
      setSelectedConsignee("");
    } finally {
      setConsigneeSellersLoading(false);
    }
  };

  const loadMoreConsigneeSellers = async () => {
    if (consigneeSellersLoading || !consigneeSellersHasMore || !selectedConsignee) {
      return;
    }

    const nextPage = consigneeSellersPage + 1;
    setConsigneeSellersLoading(true);
    try {
      const response = await api.get("/bids/consignee-sellers", {
        params: { consignee: selectedConsignee, page: nextPage, limit: 10 },
      });
      setConsigneeSellers((previous) => [
        ...previous,
        ...(response.data?.data || []),
      ]);
      setConsigneeSellersPage(nextPage);
      setConsigneeSellersHasMore(Boolean(response.data?.hasMore));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load more consignee sellers.",
      );
    } finally {
      setConsigneeSellersLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editableRateQuantity) return;
    try {
      const { id, rate, quantity } = editableRateQuantity;
      await api.put(`/bids/${id}`, { rate, quantity });
      clearApiCache();
      toast.success("Bid updated successfully!");
      setBids((prev) =>
        prev.map((bid) => (bid._id === id ? { ...bid, rate, quantity } : bid)),
      );
      setEditableRateQuantity(null);
    } catch {
      toast.error("Failed to update bid. Please try again.");
    }
  };

  const headers = [
    "Sl No",
    "Group",
    "Company",
    "Consignee",
    "Origin",
    "Commodity",
    "Quantity",
    "Rate",
    "Bid Date",
    "Start Time",
    "End Time",
    "Payment Terms",
    "Delivery",
    "Status",
    "Actions",
  ];

  const groupedBids = useMemo(() => {
    const groups = {};
    filteredBids.forEach((bid) => {
      if (!groups[bid.group]) groups[bid.group] = [];
      groups[bid.group].push(bid);
    });
    return Object.keys(groups)
      .sort()
      .map((group) => ({
        group,
        bids: groups[group],
        consignees: [...new Set(groups[group].map((b) => b.consignee))],
        bidCount: groups[group].length,
      }));
  }, [filteredBids]);

  const tabCounts = useMemo(() => {
    const now = new Date();
    const getISODate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = getISODate(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = getISODate(yesterday);

    const normalize = (str) =>
      (str || "")
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const normalizedBuyerGroups = (buyerGroups || []).map(normalize);

    const counts = { active: 0, closed: 0, previous: 0 };

    bids.forEach((bid) => {
      if (
        filteredConsignees.length > 0 &&
        !filteredConsignees.includes(bid.consignee)
      ) {
        return;
      }

      if (userRole === "Admin" || userRole === "Employee") {
        // Full access
      } else if (userRole === "Buyer") {
        if (
          selectedFilterGroup !== "All" &&
          normalize(bid.group) !== normalize(selectedFilterGroup)
        ) {
          return;
        }

        const bidGroupNormalized = normalize(bid.group);
        const belongsToGroup = normalizedBuyerGroups.includes(bidGroupNormalized);
        const belongsToCompany = (buyerCompanies || []).includes(bid.company);
        const isOwnBid =
          String(bid.createdByMobile || "") === String(mobile || "");

        if (!belongsToGroup && !belongsToCompany && !isOwnBid) return;

        if (!isBuyerAdmin) {
          const role = String(bid.createdByRole || "").toLowerCase();
          const creatorMobile = String(bid.createdByMobile || "");
          const currentMobile = String(mobile || "");

          const createdByAdminOrEmployee =
            role === "admin" || role === "employee";
          const createdByCurrentBuyer =
            creatorMobile !== "" && creatorMobile === currentMobile;

          if (!createdByAdminOrEmployee && !createdByCurrentBuyer) {
            if (!(buyerCompanies || []).includes(bid.company)) return;
          }
        }
      } else {
        // Other roles see nothing in counts
        return;
      }

      let bidDateObj;
      try {
        bidDateObj = new Date(bid.bidDate);
      } catch {
        return;
      }

      const bidDateStr = getISODate(bidDateObj);
      const isToday = bidDateStr === todayStr;
      const isYesterday = bidDateStr === yesterdayStr;

      let bidStartTime = null;
      let bidEndTime = null;

      if (isToday) {
        if (bid.startTime) {
          const [sH, sM] = bid.startTime.split(":").map(Number);
          bidStartTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            sH,
            sM,
          );
        }
        if (bid.endTime) {
          const [eH, eM] = bid.endTime.split(":").map(Number);
          bidEndTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            eH,
            eM,
          );
        }
      }

      if (
        isToday &&
        bidStartTime &&
        bidEndTime &&
        now >= bidStartTime &&
        now <= bidEndTime
      )
        counts.active += 1;
      if (isToday && bidEndTime && now > bidEndTime) counts.closed += 1;
      if (isYesterday) counts.previous += 1;
    });

    return counts;
  }, [bids, filteredConsignees, userRole, buyerGroups, isBuyerAdmin, mobile]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/bids/${id}/status`, { status });
      clearApiCache();
      toast.success(
        `Bid ${status === "closed" ? "closed" : "activated"} successfully!`,
      );
      setBids((prev) =>
        prev.map((bid) => (bid._id === id ? { ...bid, status } : bid)),
      );
    } catch {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const buildRow = (bid, index) => [
    index + 1,
    bid.group,
    bid.company || "N/A",
    ["Admin", "Employee"].includes(userRole) ? (
      <button
        type="button"
        className="font-semibold text-left text-lux-emerald underline decoration-dotted underline-offset-4 hover:text-lux-deep"
        onClick={() => openConsigneeSellers(bid.consignee)}
        title="View top sellers for this consignee"
      >
        {bid.consignee}
      </button>
    ) : (
      bid.consignee
    ),
    bid.origin,
    bid.commodity,
    bid.quantity,
    bid.rate,
    formatDate(bid.bidDate),
    bid.startTime,
    bid.endTime,
    bid.paymentTerms,
    bid.delivery,
    <span
      key={`status-${bid._id}`}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
        bid.status === "active"
          ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border border-rose-200 bg-rose-100 text-rose-700"
      }`}
    >
      {bid.status === "active" ? "Active" : "Closed"}
    </span>,
    <div key={`actions-${bid._id}`} className="flex items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e4dbc6] bg-lux-cream text-lux-emerald shadow-sm transition hover:bg-white hover:shadow-lg"
        onClick={() =>
          setEditableRateQuantity({
            id: bid._id,
            rate: bid.rate,
            quantity: bid.quantity,
          })
        }
        title="Edit rate & quantity"
      >
        <AiOutlineEdit size={16} />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e4dbc6] bg-lux-cream text-lux-emerald shadow-sm transition hover:bg-white hover:shadow-lg"
        onClick={() => setSelectedBid(bid)}
        title="View bid"
      >
        <AiOutlineEye size={16} />
      </button>
      {userRole === "Buyer" && (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-[#e4dbc6] bg-lux-cream text-lux-emerald shadow-sm transition hover:bg-white hover:shadow-lg"
          onClick={() => navigate(`/confirm-bids/${bid._id}`)}
          title="View bidders"
        >
          <FaUsers size={14} />
        </button>
      )}
      {bid.status === "active" ? (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500 text-white shadow-sm transition hover:bg-rose-600 active:scale-[0.97]"
          onClick={() => handleStatusUpdate(bid._id, "closed")}
          title="Stop Bidding"
        >
          <span className="text-xs font-bold">Stop</span>
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-sm transition hover:-translate-y-0.5"
          onClick={() =>
            setReactivateBid({
              ...bid,
              endTime: bid.endTime,
              quantity: bid.quantity,
              rate: bid.rate,
            })
          }
          title="Activate Bidding"
        >
          <span className="text-xs font-bold">Start</span>
        </button>
      )}
    </div>,
  ];

  const handleReactivateSubmit = async () => {
    if (!reactivateBid) return;

    try {
      const { _id, endTime, quantity, rate } = reactivateBid;
      await api.put(`/bids/${_id}`, { endTime, quantity, rate });
      await api.patch(`/bids/${_id}/status`, { status: "active" });
      clearApiCache();
      toast.success("Bid reactivated successfully!");
      setBids((prev) =>
        prev.map((bid) =>
          bid._id === _id
            ? { ...bid, status: "active", endTime, quantity, rate }
            : bid,
        ),
      );
      setReactivateBid(null);
    } catch {
      toast.error("Failed to reactivate bid. Please try again.");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Bid Management"
        subtitle={
          activeTab === "active"
            ? "Today's active bids"
            : activeTab === "closed"
              ? "Today's closed bids"
              : "Yesterday's historical bids"
        }
        icon={FaGavel}
        noContentCard
      >
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="lux-eyebrow inline-flex items-center gap-1.5">
                  <FaChartLine />
                  Buyer Bid Desk
                </p>
                <p className="mt-0.5 font-serif text-sm font-semibold text-lux-ink sm:text-base">
                  Modern bid tracking for fast buyer decisions
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#e6dcc4] bg-lux-cream px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-lux-muted">
                <FaClock className="text-lux-emerald" />
                Live view
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-4 py-3">
                <p className="lux-eyebrow">
                  Active
                </p>
                <p className="font-serif text-xl font-semibold text-lux-ink">{tabCounts.active}</p>
              </div>
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-4 py-3">
                <p className="lux-eyebrow">
                  Closed
                </p>
                <p className="font-serif text-xl font-semibold text-lux-ink">{tabCounts.closed}</p>
              </div>
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-4 py-3">
                <p className="lux-eyebrow">
                  Previous
                </p>
                <p className="font-serif text-xl font-semibold text-lux-ink">{tabCounts.previous}</p>
              </div>
            </div>
          </div>
          {userRole === "Buyer" && (
            <div className="flex justify-start">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                <FaArrowLeft />
                Back
              </button>
            </div>
          )}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center font-medium text-rose-700">
              {error}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-3 shadow-sm">
                <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex w-full flex-wrap gap-2 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-1 lg:w-fit">
                    <button
                      onClick={() => setActiveTab("active")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all sm:px-6 ${
                        activeTab === "active"
                          ? "bg-lux-cream text-lux-emerald shadow-sm"
                          : "text-lux-muted hover:text-lux-ink"
                      }`}
                    >
                      Active Bids
                    </button>
                    <button
                      onClick={() => setActiveTab("closed")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all sm:px-6 ${
                        activeTab === "closed"
                          ? "bg-lux-cream text-rose-600 shadow-sm"
                          : "text-lux-muted hover:text-lux-ink"
                      }`}
                    >
                      Closed Bids
                    </button>
                    <button
                      onClick={() => setActiveTab("previous")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all sm:px-6 ${
                        activeTab === "previous"
                          ? "bg-lux-cream text-lux-emerald shadow-sm"
                          : "text-lux-muted hover:text-lux-ink"
                      }`}
                    >
                      Previous Bids
                    </button>
                  </div>

          {userRole === "Buyer" && buyerGroups && buyerGroups.length > 1 && (
            <div className="flex flex-col gap-1.5 w-full sm:w-64">
              <div className="lux-eyebrow inline-flex items-center gap-2">
                <FaLayerGroup className="text-lux-emerald" />
                Filter Your Groups
              </div>
              <select
                value={selectedFilterGroup}
                onChange={(e) => setSelectedFilterGroup(e.target.value)}
                className="h-[42px] w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-sm font-semibold text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
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

                  <div className="w-full lg:w-auto">
                    <div className="lux-eyebrow mb-1.5 inline-flex items-center gap-2">
                      <FaSearch className="text-lux-emerald" />
                      Search Consignee
                    </div>
                    <SearchBox
                      placeholder="Search by consignee..."
                      items={consigneeItems}
                      onSearch={handleSearchConsignee}
                      className="max-w-full sm:max-w-md"
                    />
                  </div>
                </div>
              </div>

              {filteredBids.length === 0 ? (
                <div className="rounded-2xl border border-[#e9e2d3] bg-lux-cream py-12 text-center">
                  <p className="inline-flex items-center gap-2 font-medium text-lux-muted">
                    <FaLayerGroup className="text-lux-muted" />
                    No {activeTab} bids found.
                  </p>
                </div>
              ) : (
                <div className="lux-card overflow-hidden p-4 sm:p-6">
                  <Tables
                    headers={headers}
                    rows={filteredBids.map((bid, idx) => buildRow(bid, idx))}
                  />
                </div>
              )}
            </>
          )}

          {reactivateBid && (
            <PopupBox
              isOpen={!!reactivateBid}
              onClose={() => setReactivateBid(null)}
              title="Reactivate Bid"
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    End Time
                  </span>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
                    value={reactivateBid.endTime}
                    onChange={(e) =>
                      setReactivateBid({
                        ...reactivateBid,
                        endTime: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Quantity
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
                    value={reactivateBid.quantity}
                    onChange={(e) =>
                      setReactivateBid({
                        ...reactivateBid,
                        quantity: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Rate
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
                    value={reactivateBid.rate}
                    onChange={(e) =>
                      setReactivateBid({
                        ...reactivateBid,
                        rate: e.target.value,
                      })
                    }
                  />
                </label>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setReactivateBid(null)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReactivateSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            </PopupBox>
          )}

          {selectedGroup && (
            <PopupBox
              isOpen={!!selectedGroup}
              onClose={() => setSelectedGroup(null)}
              title={`Bids — ${selectedGroup}`}
            >
              <Tables
                headers={headers}
                rows={
                  groupedBids
                    .find((g) => g.group === selectedGroup)
                    ?.bids.map((bid, idx) => buildRow(bid, idx)) || []
                }
              />
            </PopupBox>
          )}

          {editableRateQuantity && (
            <PopupBox
              isOpen={!!editableRateQuantity}
              onClose={() => setEditableRateQuantity(null)}
              title="Edit rate & quantity"
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Rate / Ton
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
                    value={editableRateQuantity.rate}
                    onChange={(e) =>
                      setEditableRateQuantity({
                        ...editableRateQuantity,
                        rate: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Quantity (tons)
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink outline-none focus:ring-2 focus:ring-lux-gold/50"
                    value={editableRateQuantity.quantity}
                    onChange={(e) =>
                      setEditableRateQuantity({
                        ...editableRateQuantity,
                        quantity: e.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-3 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                  onClick={handleEdit}
                >
                  Save changes
                </button>
              </div>
            </PopupBox>
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {consigneeSellersLoading ? "Loading..." : "Show more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </PopupBox>

          {selectedBid && (
            <ViewBid
              bidId={selectedBid._id}
              onClose={() => setSelectedBid(null)}
            />
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default BidList;
