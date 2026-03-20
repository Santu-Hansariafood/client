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
  const [activeTab, setActiveTab] = useState("active"); // "active" or "closed"
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [editableRateQuantity, setEditableRateQuantity] = useState(null);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchConsignee, setSearchConsignee] = useState("");

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
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2);
    // Set to start of the day 2 days ago to be more inclusive
    twoDaysAgo.setHours(0, 0, 0, 0);

    return bids.filter((bid) => {
      // Filter by Tab
      if (activeTab === "active") {
        if (bid.status !== "active") return false;
      } else {
        if (bid.status !== "closed") return false;
        // Only show closed bids from the last 2 days
        // We use closedAt as the primary date, fall back to updatedAt or bidDate
        const closeDate = new Date(bid.closedAt || bid.updatedAt || bid.bidDate || bid.createdAt);
        if (closeDate < twoDaysAgo) return false;
      }

      // Filter by Search
      if (
        searchConsignee &&
        !bid.consignee?.toLowerCase().includes(searchConsignee.toLowerCase())
      ) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by the most recent relevant date
      const dateA = new Date(a.closedAt || a.updatedAt || a.bidDate || a.createdAt);
      const dateB = new Date(b.closedAt || b.updatedAt || b.bidDate || b.createdAt);
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
          onClick={() => handleStatusUpdate(bid._id, "active")}
          title="Activate Bidding"
        >
          <span className="text-xs font-bold">Start</span>
        </button>
      )}
    </div>,
  ];

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Bid Management"
        subtitle={
          activeTab === "active"
            ? "Manage all active bids"
            : "View bids closed within the last 2 days"
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
                    No {activeTab} bids found
                    {activeTab === "closed" ? " for the last 2 days" : ""}.
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
                          : "border-red-100 bg-white hover:border-red-200 hover:shadow-lg"
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
                              : "text-red-700 bg-red-50"
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
