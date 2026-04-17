import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import api from "../../../utils/apiClient/apiClient";
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
    const todayStr = now.toLocaleDateString("en-CA");
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    return bids
      .filter((bid) => {
        const bidDateStr =
          bid.bidDate && typeof bid.bidDate === "string"
            ? bid.bidDate.split("T")[0]
            : "";
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

        if (userRole === "Buyer" && selectedFilterGroup !== "All") {
          if (bid.group !== selectedFilterGroup) return false;
        }

        return true;
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

  const handleEdit = async () => {
    if (!editableRateQuantity) return;
    try {
      const { id, rate, quantity } = editableRateQuantity;
      await api.put(`/bids/${id}`, { rate, quantity });
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
    const todayStr = now.toLocaleDateString("en-CA");
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    const counts = { active: 0, closed: 0, previous: 0 };

    bids.forEach((bid) => {
      if (
        filteredConsignees.length > 0 &&
        !filteredConsignees.includes(bid.consignee)
      ) {
        return;
      }

      if (userRole === "Buyer") {
        if (selectedFilterGroup !== "All" && bid.group !== selectedFilterGroup) {
          return;
        }

        if (!buyerGroups || buyerGroups.length === 0) {
          // If no groups, still allow if company matches
          // But we need to check if the bid actually belongs to the buyer's companies if selectedFilterGroup is "All"
          if (selectedFilterGroup === "All" && !buyerCompanies.includes(bid.company)) {
            // Check if it's their own bid
            const creatorMobile = String(bid.createdByMobile || "");
            const currentMobile = String(mobile || "");
            if (creatorMobile !== currentMobile) return;
          }
        } else {
          const bidGroupNormalized = (bid.group || "")
            .trim()
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");

          const belongsToGroup = buyerGroups.includes(bidGroupNormalized);
          const belongsToCompany = buyerCompanies.includes(bid.company);
          const isOwnBid = String(bid.createdByMobile || "") === String(mobile || "");

          if (!belongsToGroup && !belongsToCompany && !isOwnBid) return;
        }

        if (!isBuyerAdmin) {
          const role = String(bid.createdByRole || "").toLowerCase();
          const creatorMobile = String(bid.createdByMobile || "");
          const currentMobile = String(mobile || "");

          const createdByAdminOrEmployee =
            role === "admin" || role === "employee";
          const createdByCurrentBuyer =
            creatorMobile !== "" && creatorMobile === currentMobile;

          if (!createdByAdminOrEmployee && !createdByCurrentBuyer) {
             // If not created by admin/employee or self, check if it's for their company
             if (!buyerCompanies.includes(bid.company)) return;
          }
        }
      }

      const bidDateStr =
        bid.bidDate && typeof bid.bidDate === "string"
          ? bid.bidDate.split("T")[0]
          : "";
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

      if (isToday && bidStartTime && bidEndTime && now >= bidStartTime && now <= bidEndTime)
        counts.active += 1;
      if (isToday && bidEndTime && now > bidEndTime) counts.closed += 1;
      if (isYesterday) counts.previous += 1;
    });

    return counts;
  }, [bids, filteredConsignees, userRole, buyerGroups, isBuyerAdmin, mobile]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/bids/${id}/status`, { status });
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
    bid.consignee,
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
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        bid.status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {bid.status === "active" ? "Active" : "Closed"}
    </span>,
    <div key={`actions-${bid._id}`} className="flex items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
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
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        onClick={() => setSelectedBid(bid)}
        title="View bid"
      >
        <AiOutlineEye size={16} />
      </button>
      {userRole === "Buyer" && (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          onClick={() => navigate(`/confirm-bids/${bid._id}`)}
          title="View bidders"
        >
          <FaUsers size={14} />
        </button>
      )}
      {bid.status === "active" ? (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors"
          onClick={() => handleStatusUpdate(bid._id, "closed")}
          title="Stop Bidding"
        >
          <span className="text-xs font-bold">Stop</span>
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors"
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
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/35 to-sky-50/45 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5">
                  <FaChartLine />
                  Buyer Bid Desk
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-800 mt-0.5">
                  Modern bid tracking for fast buyer decisions
                </p>
              </div>
              <div className="inline-flex items-center w-fit px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 gap-1.5">
                <FaClock className="text-emerald-600" />
                Live view
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                  Active
                </p>
                <p className="text-base font-bold text-emerald-800">{tabCounts.active}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
                  Closed
                </p>
                <p className="text-base font-bold text-rose-800">{tabCounts.closed}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                  Previous
                </p>
                <p className="text-base font-bold text-amber-800">{tabCounts.previous}</p>
              </div>
            </div>
          </div>
          {userRole === "Buyer" && (
            <div className="flex justify-start">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FaArrowLeft />
                Back
              </button>
            </div>
          )}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700 font-medium">
              {error}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                  <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-full lg:w-fit">
                    <button
                      onClick={() => setActiveTab("active")}
                      className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "active"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Active Bids
                    </button>
                    <button
                      onClick={() => setActiveTab("closed")}
                      className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "closed"
                          ? "bg-white text-red-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Closed Bids
                    </button>
                    <button
                      onClick={() => setActiveTab("previous")}
                      className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "previous"
                          ? "bg-white text-amber-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Previous Bids
                    </button>
                  </div>

                  {userRole === "Buyer" && buyerGroups.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <FaLayerGroup className="text-emerald-600" />
                        Filter by Group
                      </div>
                      <select
                        value={selectedFilterGroup}
                        onChange={(e) => setSelectedFilterGroup(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-400/50 outline-none"
                      >
                        <option value="All">All Groups</option>
                        {buyerGroups.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="w-full lg:w-auto">
                    <div className="inline-flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                      <FaSearch className="text-emerald-600" />
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
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-slate-500 font-medium inline-flex items-center gap-2">
                    <FaLayerGroup className="text-slate-400" />
                    No {activeTab} bids found.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg shadow-emerald-900/5 overflow-hidden">
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
                  <span className="text-sm font-medium text-slate-700">
                    End Time
                  </span>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
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
                  <span className="text-sm font-medium text-slate-700">
                    Quantity
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
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
                  <span className="text-sm font-medium text-slate-700">
                    Rate
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
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
                    className="px-6 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReactivateSubmit}
                    className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
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
                  <span className="text-sm font-medium text-slate-700">
                    Rate / Ton
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
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
                  <span className="text-sm font-medium text-slate-700">
                    Quantity (tons)
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
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
                  className="w-full py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  onClick={handleEdit}
                >
                  Save changes
                </button>
              </div>
            </PopupBox>
          )}

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
