import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaGavel } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const BidList = () => {
  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all", "active", or "closed"
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [editableRateQuantity, setEditableRateQuantity] = useState(null);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchConsignee, setSearchConsignee] = useState("");
  const [reactivateBid, setReactivateBid] = useState(null); // Holds bid data for reactivation

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/bids");
        const items = response.data?.data || response.data || [];
        setBids(items);
      } catch {
        setError("Error fetching data. Please try again later.");
      }
    };
    fetchData();
  }, []);

  const filteredBids = useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return bids.filter((bid) => {
      const [endHours, endMinutes] = bid.endTime.split(':').map(Number);
      const bidEndDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHours, endMinutes);

      let matches = false;

      if (activeTab === 'all') { // Today's Bids
        const createDate = new Date(bid.createdAt);
        matches = createDate >= todayStart;
      } else if (activeTab === 'active') {
        matches = bid.status === 'active' && now < bidEndDateTime;
      } else if (activeTab === 'closed') {
        matches = bid.status === 'closed' || now >= bidEndDateTime;
      }

      if (!matches) return false;

      // Filter by Search
      if (
        searchConsignee &&
        !bid.consignee?.toLowerCase().includes(searchConsignee.toLowerCase())
      ) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.closedAt || a.updatedAt || a.createdAt);
      const dateB = new Date(b.closedAt || b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [bids, activeTab, searchConsignee]);

  const consigneeItems = useMemo(
    () =>
      [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [bids]
  );

  const handleSearchConsignee = (filteredNames) => {
    if (typeof filteredNames === "string") {
      setSearchConsignee(filteredNames);
    } else if (Array.isArray(filteredNames) && filteredNames.length > 0) {
      setSearchConsignee(filteredNames[0]);
    } else {
      setSearchConsignee("");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-GB");

  const handleEdit = async () => {
    if (!editableRateQuantity) return;
    try {
      const { id, rate, quantity } = editableRateQuantity;
      await axios.put(`/bids/${id}`, { rate, quantity });
      toast.success("Bid updated successfully!");
      setBids((prev) =>
        prev.map((bid) => (bid._id === id ? { ...bid, rate, quantity } : bid))
      );
      setEditableRateQuantity(null);
    } catch {
      toast.error("Failed to update bid. Please try again.");
    }
  };

  const headers = [
    "Sl No",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Parameters",
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
      }));
  }, [filteredBids]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(`/bids/${id}/status`, { status });
      toast.success(`Bid ${status === "closed" ? "closed" : "activated"} successfully!`);
      setBids((prev) =>
        prev.map((bid) => (bid._id === id ? { ...bid, status } : bid))
      );
    } catch {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const buildRow = (bid, index) => [
    index + 1,
    bid.group,
    bid.consignee,
    bid.origin,
    bid.commodity,
    Object.entries(bid.parameters || {})
      .filter(([, value]) => value !== "0")
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", "),
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
          onClick={() => setReactivateBid({ ...bid, endTime: bid.endTime, quantity: bid.quantity, rate: bid.rate })}
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
      await axios.put(`/bids/${_id}`, { endTime, quantity, rate });
      await axios.patch(`/bids/${_id}/status`, { status: "active" });

      toast.success("Bid reactivated successfully!");
      setBids((prev) =>
        prev.map((bid) =>
          bid._id === _id
            ? { ...bid, status: "active", endTime, quantity, rate }
            : bid
        )
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
          activeTab === "all"
            ? "Manage all bids"
            : activeTab === "active"
              ? "Manage all active bids"
              : "View all closed bids"
        }
        icon={FaGavel}
        noContentCard
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700 font-medium">
              {error}
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === "all"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    All Bids
                  </button>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === "active"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Active Bids
                  </button>
                  <button
                    onClick={() => setActiveTab("closed")}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === "closed"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Closed Bids
                  </button>
                </div>
                <SearchBox
                  placeholder="Search by consignee..."
                  items={consigneeItems}
                  onSearch={handleSearchConsignee}
                  className="max-w-full sm:max-w-md"
                />
              </div>

              {groupedBids.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-slate-500 font-medium">
                    No {activeTab === "all" ? "" : activeTab} bids found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groupedBids.map(({ group, consignees }) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setSelectedGroup(group)}
                      className={`text-left rounded-2xl border p-5 shadow-md shadow-emerald-900/5 transition-all ${
                        activeTab === "active"
                          ? "border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-lg"
                          : activeTab === "closed"
                            ? "border-red-100 bg-white hover:border-red-200 hover:shadow-lg"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-lg font-bold text-slate-800">
                          {group}
                        </span>
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded-full ${
                            activeTab === "active"
                              ? "text-emerald-700 bg-emerald-50"
                              : activeTab === "closed"
                                ? "text-red-700 bg-red-50"
                                : "text-slate-600 bg-slate-100"
                          }`}
                        >
                          {consignees.length} consignee
                          {consignees.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {consignees.join(", ")}
                      </p>
                    </button>
                  ))}
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
                  <span className="text-sm font-medium text-slate-700">End Time</span>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                    value={reactivateBid.endTime}
                    onChange={(e) =>
                      setReactivateBid({ ...reactivateBid, endTime: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Quantity</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                    value={reactivateBid.quantity}
                    onChange={(e) =>
                      setReactivateBid({ ...reactivateBid, quantity: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Rate</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                    value={reactivateBid.rate}
                    onChange={(e) =>
                      setReactivateBid({ ...reactivateBid, rate: e.target.value })
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
                    ?.bids.map((bid, idx) =>
                      buildRow(bid, idx)
                    ) || []
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
