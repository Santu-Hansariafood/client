import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";
import {
  FaRegClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrashAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCalendarAlt,
  FaRupeeSign,
  FaWeightHanging,
  FaBuilding,
  FaPhoneAlt,
  FaStickyNote,
  FaHistory,
  FaUserCircle,
} from "react-icons/fa";

/**
 * Helper to normalize strings for comparison
 */
const normalizeString = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/**
 * Helper to format date and time
 */
const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "N/A";
  }
};

const InteractionsPopup = ({ bidId, onClose }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { mobile: actorMobile, userRole: actorRole } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        const [interactionsRes, bidRes] = await Promise.all([
          api.get(`/participatebids?bidId=${bidId}`),
          api.get(`/bids/${bidId}`),
        ]);

        if (!isMounted) return;

        const bidData = bidRes.data;
        const interactionsData =
          interactionsRes.data.data || interactionsRes.data || [];

        // Authorization check for Buyer
        if (actorRole === "Buyer" && bidData) {
          const buyerRes = await api.get("/bids/buyer-today", {
            params: { mobile: actorMobile },
          });
          const buyerInfo = buyerRes.data?.buyer;

          if (!buyerInfo) {
            toast.error("Unauthorized: Buyer information not found.");
            onClose();
            return;
          }

          const allowedGroups = (buyerInfo.groups || []).map(normalizeString);
          const allowedCompanies = (buyerInfo.companies || []).map((c) =>
            String(c).trim(),
          );
          const bidGroup = normalizeString(bidData.group);
          const bidCompany = String(bidData.company || "").trim();
          const isOwnBid =
            String(bidData.createdByMobile || "") === String(actorMobile || "");

          if (
            !isOwnBid &&
            !allowedGroups.includes(bidGroup) &&
            !allowedCompanies.includes(bidCompany)
          ) {
            toast.error(
              "You are not authorized to view interactions for this bid.",
            );
            onClose();
            return;
          }
        }

        setInteractions(interactionsData);
      } catch (error) {
        console.error("Fetch interactions error:", error);
        toast.error("Failed to load bid interactions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInteractions();
    return () => {
      isMounted = false;
    };
  }, [bidId, actorRole, actorMobile, onClose]);

  const handleStatusChange = useCallback(
    async (id, status, adminNotes, acceptance) => {
      try {
        const payload =
          status === "accepted"
            ? {
                status,
                adminNotes,
                acceptanceRate: acceptance?.rate,
                acceptanceQuantity: acceptance?.quantity,
                acceptedAt: acceptance?.acceptedAt || new Date().toISOString(),
                acceptedByMobile: actorMobile,
                acceptedByRole: actorRole,
              }
            : { status, adminNotes };

        const response = await api.patch(
          `/participatebids/${id}/status`,
          payload,
        );

        setInteractions((prev) =>
          prev.map((i) =>
            i._id === id
              ? {
                  ...i,
                  ...response.data,
                  sellerName: i.sellerName,
                  sellerCompany: i.sellerCompany,
                }
              : i,
          ),
        );
        toast.success(`Bid interaction ${status} successfully.`);
      } catch (error) {
        console.error("Status update error:", error);
        toast.error("Failed to update status.");
      }
    },
    [actorMobile, actorRole],
  );

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this interaction?"))
      return;
    try {
      await api.delete(`/participatebids/${id}`);
      setInteractions((prev) => prev.filter((i) => i._id !== id));
      toast.success("Interaction deleted.");
    } catch (error) {
      console.error("Delete interaction error:", error);
      toast.error("Failed to delete interaction.");
    }
  }, []);

  const isReviewer = useMemo(
    () =>
      actorRole === "Admin" ||
      actorRole === "Employee" ||
      actorRole === "Buyer",
    [actorRole],
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-6 sm:px-8 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bid Interactions
            </h2>
            <p className="text-sm font-semibold text-emerald-600 mt-1 uppercase tracking-widest flex items-center gap-2">
              <FaHistory className="text-xs" /> Participant Review History
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all duration-300 shadow-sm"
          >
            <span className="text-2xl font-bold group-hover:scale-110 transition-transform">
              &times;
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50/50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 flex-shrink-0">
                <FaCheckCircle className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Review & Acceptance
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Compare participant offers side-by-side, add internal notes,
                  and finalize the bid by accepting or rejecting proposals.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loading />
              <p className="text-sm font-bold text-emerald-600 animate-pulse tracking-widest uppercase">
                Loading Interactions...
              </p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <FaUserCircle className="text-3xl" />
              </div>
              <p className="text-slate-500 font-bold">
                No interactions found for this bid.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {interactions.map((interaction) => (
                <InteractionCard
                  key={interaction._id}
                  interaction={interaction}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  isReviewer={isReviewer}
                  actorRole={actorRole}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

InteractionsPopup.propTypes = {
  bidId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const InteractionCard = ({
  interaction,
  onStatusChange,
  onDelete,
  isReviewer,
  actorRole,
}) => {
  const [notes, setNotes] = useState(interaction.adminNotes || "");
  const [acceptedRate, setAcceptedRate] = useState(
    interaction.acceptedRate ?? interaction.rate ?? "",
  );
  const [acceptedQuantity, setAcceptedQuantity] = useState(
    interaction.acceptedQuantity ?? interaction.quantity ?? "",
  );
  const [acceptedAt, setAcceptedAt] = useState(
    interaction.acceptedAt
      ? new Date(interaction.acceptedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );

  const handleSave = useCallback(
    (status) => {
      if (status === "accepted") {
        if (!acceptedRate || !acceptedQuantity) {
          return toast.warning("Please enter acceptance rate and quantity.");
        }
        const acceptance = {
          rate: Number(acceptedRate),
          quantity: Number(acceptedQuantity),
          acceptedAt: new Date(acceptedAt).toISOString(),
        };
        onStatusChange(interaction._id, status, notes, acceptance);
        return;
      }
      onStatusChange(interaction._id, status, notes);
    },
    [
      acceptedRate,
      acceptedQuantity,
      acceptedAt,
      notes,
      interaction._id,
      onStatusChange,
    ],
  );

  const interactionTime = useMemo(
    () => formatDateTime(interaction.createdAt),
    [interaction.createdAt],
  );
  const acceptedTime = useMemo(
    () => formatDateTime(interaction.acceptedAt),
    [interaction.acceptedAt],
  );

  const isRevised = useMemo(() => {
    if (!interaction.createdAt || !interaction.updatedAt) return false;
    return (
      new Date(interaction.updatedAt).getTime() >
      new Date(interaction.createdAt).getTime()
    );
  }, [interaction.createdAt, interaction.updatedAt]);

  const partyName = useMemo(() => {
    return (
      String(interaction.sellerCompany || "").trim() ||
      (actorRole === "Buyer"
        ? "N/A"
        : String(interaction.sellerName || "").trim()) ||
      "Unknown Company"
    );
  }, [interaction.sellerCompany, interaction.sellerName, actorRole]);

  const hasAcceptedValues = useMemo(() => {
    return (
      interaction.acceptedRate != null || interaction.acceptedQuantity != null
    );
  }, [interaction.acceptedRate, interaction.acceptedQuantity]);

  return (
    <div
      className={`group overflow-hidden rounded-[2rem] border-2 transition-all duration-300 shadow-sm hover:shadow-xl ${
        interaction.status === "accepted"
          ? "border-emerald-200 bg-emerald-50/20"
          : interaction.status === "rejected"
            ? "border-rose-100 bg-rose-50/20"
            : "border-slate-100 bg-white hover:border-emerald-200"
      }`}
    >
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${
          interaction.status === "accepted"
            ? "border-emerald-100 bg-emerald-50/50"
            : interaction.status === "rejected"
              ? "border-rose-50 bg-rose-50/50"
              : "border-slate-50 bg-slate-50/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
              interaction.status === "accepted"
                ? "bg-emerald-600 text-white"
                : interaction.status === "rejected"
                  ? "bg-rose-500 text-white"
                  : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <FaBuilding className="text-lg" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800 leading-tight">
              {partyName}
            </h4>
            {actorRole !== "Buyer" && (
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <FaPhoneAlt className="text-[10px]" /> {interaction.mobile}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRevised && interaction.status === "pending" && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-200 shadow-sm animate-pulse">
              Revised
            </span>
          )}
          <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
              interaction.status === "accepted"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : interaction.status === "rejected"
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {interaction.status || "Pending"}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaRupeeSign className="text-emerald-500" /> Proposed Rate
            </p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              ₹{interaction.rate}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaWeightHanging className="text-emerald-500" /> Proposed Qty
            </p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {interaction.quantity}{" "}
              <span className="text-sm font-bold text-slate-400">Tons</span>
            </p>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaRegClock className="text-emerald-500" /> Interaction Time
            </p>
            <p className="text-sm font-bold text-slate-700 mt-1.5 flex items-center gap-2">
              <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                {interactionTime}
              </span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5 border-y border-slate-50">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaCalendarAlt className="text-blue-500" /> Expected Delivery
            </p>
            <p className="text-sm font-bold text-slate-700">
              {interaction.deliveryDate
                ? new Date(interaction.deliveryDate).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )
                : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaCreditCard className="text-amber-500" /> Payment Terms
            </p>
            <p className="text-sm font-bold text-slate-700">
              {interaction.paymentTerms || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-rose-500" /> Loading From
            </p>
            <p className="text-sm font-bold text-slate-700">
              {interaction.loadingFrom || "N/A"}
            </p>
          </div>
        </div>

        {interaction.remarks && (
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <FaStickyNote className="text-emerald-500" /> Seller Remarks
            </p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
              "{interaction.remarks}"
            </p>
          </div>
        )}

        {(interaction.status === "accepted" || hasAcceptedValues) && (
          <div className="rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <FaCheckCircle className="text-sm" /> Final Accepted Details
              </p>
              <div className="h-px flex-1 mx-4 bg-emerald-100/50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Rate
                </p>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  ₹{interaction.acceptedRate || interaction.rate}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Quantity
                </p>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {interaction.acceptedQuantity || interaction.quantity}{" "}
                  <span className="text-xs">Tons</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Accepted At
                </p>
                <p className="text-sm font-black text-emerald-700 mt-1.5">
                  {acceptedTime}
                </p>
              </div>
            </div>
            {interaction.adminNotes && (
              <div className="mt-4 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  Internal Notes
                </p>
                <p className="text-sm font-medium text-slate-700 italic">
                  "{interaction.adminNotes}"
                </p>
              </div>
            )}
          </div>
        )}

        {interaction.status !== "accepted" && isReviewer && (
          <div className="space-y-6 pt-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                  <FaCheckCircle />
                </div>
                <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Acceptance Proposal
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Acceptance Rate (₹)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      ₹
                    </span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                      value={acceptedRate}
                      onChange={(e) => setAcceptedRate(e.target.value)}
                      placeholder="Rate"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Acceptance Qty (Tons)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    value={acceptedQuantity}
                    onChange={(e) => setAcceptedQuantity(e.target.value)}
                    placeholder="Quantity"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Accepted Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    value={acceptedAt}
                    onChange={(e) => setAcceptedAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Review Notes
                </label>
                <textarea
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 shadow-sm min-h-[100px]"
                  placeholder="Share feedback or internal reasoning for this decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleSave("accepted")}
                className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200 font-black text-sm uppercase tracking-widest flex items-center gap-2"
              >
                <FaCheckCircle /> Accept Proposal
              </button>
              <button
                onClick={() => handleSave("rejected")}
                className="px-8 py-3.5 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl hover:bg-rose-50 active:scale-95 transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2"
              >
                <FaTimesCircle /> Reject
              </button>
              <button
                onClick={() => onDelete(interaction._id)}
                className="p-3.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                title="Delete Interaction"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        )}
        {interaction.status !== "pending" && isReviewer && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onDelete(interaction._id)}
              className="px-5 py-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 hover:border-rose-100 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <FaTrashAlt className="text-[10px]" /> Remove Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

InteractionCard.propTypes = {
  interaction: PropTypes.object.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isReviewer: PropTypes.bool.isRequired,
  actorRole: PropTypes.string,
};

export default InteractionsPopup;
