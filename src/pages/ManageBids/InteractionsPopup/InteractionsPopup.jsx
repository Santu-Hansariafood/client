import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
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
} from "react-icons/fa";

const normalizeString = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

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

const InteractionsPopup = ({ bidId, onClose, canInteract = true }) => {
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
      if (!canInteract) {
        toast.error("Interactions are only allowed for today's bids.");
        return;
      }
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
        clearApiCache();
        toast.success(`Bid interaction ${status} successfully.`);
      } catch (error) {
        console.error("Status update error:", error);
        toast.error("Failed to update status.");
      }
    },
    [actorMobile, actorRole, canInteract],
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!canInteract) {
        toast.error("Deletions are only allowed for today's bids.");
        return;
      }
      if (!window.confirm("Are you sure you want to delete this interaction?"))
        return;
      try {
        await api.delete(`/participatebids/${id}`);
        clearApiCache();
        setInteractions((prev) => prev.filter((i) => i._id !== id));
        toast.success("Interaction deleted.");
      } catch (error) {
        console.error("Delete interaction error:", error);
        toast.error("Failed to delete interaction.");
      }
    },
    [canInteract],
  );

  const isReviewer = useMemo(
    () =>
      actorRole === "Admin" ||
      actorRole === "Employee" ||
      actorRole === "Buyer",
    [actorRole],
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ece4d2] bg-lux-cream/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">
              Bid Interactions
            </h2>
            <p className="lux-eyebrow mt-1 flex items-center gap-2">
              <FaHistory className="text-xs" /> Participant Review History
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lux-muted transition-all duration-300 hover:scale-105 hover:bg-[#f2eee2] hover:text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
          >
            <span className="text-2xl font-bold group-hover:scale-110 transition-transform">
              &times;
            </span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 text-lux-muted sm:px-6 sm:py-6 md:px-8">
          {!canInteract && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#e6dcc4] bg-lux-ivory p-4 text-lux-emerald">
              <FaHistory className="text-lg" />
              <p className="text-sm font-bold uppercase tracking-wider">
                Viewing Historical Records — Interactions Disabled
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                <FaCheckCircle className="text-lg" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-lux-ink">
                  Review &amp; Acceptance
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-lux-muted">
                  Compare participant offers side-by-side, add internal notes,
                  and finalize the bid by accepting or rejecting proposals.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : interactions.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#ece4d2] bg-lux-ivory text-lux-gold-soft">
                <FaHistory size={40} />
              </div>
              <h3 className="font-serif text-xl font-semibold tracking-tight text-lux-ink">
                No interactions found
              </h3>
              <p className="mt-1 text-sm font-medium text-lux-muted">
                Wait for participants to place their bids
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-8">
              {interactions.map((interaction) => (
                <InteractionCard
                  key={interaction._id}
                  interaction={interaction}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  isReviewer={isReviewer}
                  actorRole={actorRole}
                  canInteract={canInteract}
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
  canInteract: PropTypes.bool,
};

const InteractionCard = ({
  interaction,
  onStatusChange,
  onDelete,
  isReviewer,
  actorRole,
  canInteract,
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
          ? "border-emerald-200 bg-emerald-50/30"
          : interaction.status === "rejected"
            ? "border-rose-200 bg-rose-50/30"
            : "border-[#ece4d2] bg-lux-cream hover:border-[#e6dcc4]"
      }`}
    >
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${
          interaction.status === "accepted"
            ? "border-emerald-100 bg-emerald-50/50"
            : interaction.status === "rejected"
              ? "border-rose-50 bg-rose-50/50"
              : "border-[#ece4d2] bg-lux-ivory/60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
              interaction.status === "accepted"
                ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/40"
                : interaction.status === "rejected"
                  ? "bg-rose-500 text-white"
                  : "border border-[#e4dbc6] bg-lux-cream text-lux-muted"
            }`}
          >
            <FaBuilding className="text-lg" />
          </div>
          <div>
            <h4 className="font-serif text-base font-semibold leading-tight text-lux-ink">
              {partyName}
            </h4>
            {actorRole !== "Buyer" && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-lux-muted">
                <FaPhoneAlt className="text-[10px]" /> {interaction.mobile}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRevised && interaction.status === "pending" && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm animate-pulse">
              Revised
            </span>
          )}
          <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
              interaction.status === "accepted"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : interaction.status === "rejected"
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : "border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"
            }`}
          >
            {interaction.status || "Pending"}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaRupeeSign className="text-lux-emerald" /> Proposed Rate
            </p>
            <p className="font-serif text-2xl font-black tracking-tight text-lux-ink">
              ₹{interaction.rate}
            </p>
          </div>
          <div className="space-y-1">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaWeightHanging className="text-lux-emerald" /> Proposed Qty
            </p>
            <p className="font-serif text-2xl font-black tracking-tight text-lux-ink">
              {interaction.quantity}{" "}
              <span className="text-sm font-bold text-lux-muted">Tons</span>
            </p>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaRegClock className="text-lux-emerald" /> Interaction Time
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-bold text-lux-ink">
              <span className="rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-1">
                {interactionTime}
              </span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 border-y border-[#ece4d2] py-5 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaCalendarAlt className="text-lux-emerald" /> Expected Delivery
            </p>
            <p className="text-sm font-bold text-lux-ink">
              {interaction.deliveryDate
                ? new Date(interaction.deliveryDate).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )
                : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaCreditCard className="text-lux-emerald" /> Payment Terms
            </p>
            <p className="text-sm font-bold text-lux-ink">
              {interaction.paymentTerms || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="lux-eyebrow flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-lux-emerald" /> Loading From
            </p>
            <p className="text-sm font-bold text-lux-ink">
              {interaction.loadingFrom || "N/A"}
            </p>
          </div>
        </div>

        {interaction.remarks && (
          <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4">
            <p className="lux-eyebrow mb-2 flex items-center gap-1.5">
              <FaStickyNote className="text-lux-emerald" /> Seller Remarks
            </p>
            <p className="text-sm font-medium italic leading-relaxed text-lux-muted">
              &quot;{interaction.remarks}&quot;
            </p>
          </div>
        )}

        {(interaction.status === "accepted" || hasAcceptedValues) && (
          <div className="rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                <FaCheckCircle className="text-sm" /> Final Accepted Details
              </p>
              <div className="mx-4 h-px flex-1 bg-emerald-100/50" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-lux-cream p-4 shadow-sm">
                <p className="lux-eyebrow text-emerald-600">Rate</p>
                <p className="mt-1 font-serif text-xl font-black text-emerald-700">
                  ₹{interaction.acceptedRate || interaction.rate}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-lux-cream p-4 shadow-sm">
                <p className="lux-eyebrow text-emerald-600">Quantity</p>
                <p className="mt-1 font-serif text-xl font-black text-emerald-700">
                  {interaction.acceptedQuantity || interaction.quantity}{" "}
                  <span className="text-xs">Tons</span>
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-lux-cream p-4 shadow-sm">
                <p className="lux-eyebrow text-emerald-600">Accepted At</p>
                <p className="mt-1.5 text-sm font-black text-emerald-700">
                  {acceptedTime}
                </p>
              </div>
            </div>
            {interaction.adminNotes && (
              <div className="mt-4 rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-3">
                <p className="lux-eyebrow mb-1 text-emerald-600">
                  Internal Notes
                </p>
                <p className="text-sm font-medium italic text-lux-ink">
                  &quot;{interaction.adminNotes}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {interaction.status === "pending" && isReviewer && (
          <div className="space-y-6 pt-4">
            <div className="space-y-5 rounded-3xl border border-[#ece4d2] bg-lux-ivory p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-md shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
                  <FaCheckCircle />
                </div>
                <h5 className="font-serif text-sm font-black uppercase tracking-widest text-lux-ink">
                  Acceptance Proposal
                </h5>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="lux-eyebrow ml-1 block">
                    Acceptance Rate (₹)
                  </label>
                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lux-muted transition-colors group-focus-within:text-lux-emerald">
                      ₹
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream py-3 pl-8 pr-4 font-bold text-lux-ink shadow-sm outline-none transition-all focus:border-lux-emerald focus:ring-4 focus:ring-lux-gold/20 disabled:bg-lux-ivory disabled:text-lux-muted"
                      value={acceptedRate}
                      onChange={(e) => setAcceptedRate(e.target.value)}
                      placeholder="Rate"
                      disabled={!canInteract}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="lux-eyebrow ml-1 block">
                    Acceptance Qty (Tons)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 font-bold text-lux-ink shadow-sm outline-none transition-all focus:border-lux-emerald focus:ring-4 focus:ring-lux-gold/20 disabled:bg-lux-ivory disabled:text-lux-muted"
                    value={acceptedQuantity}
                    onChange={(e) => setAcceptedQuantity(e.target.value)}
                    placeholder="Quantity"
                    disabled={!canInteract}
                  />
                </div>
                <div className="space-y-2">
                  <label className="lux-eyebrow ml-1 block">
                    Accepted Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 font-bold text-lux-ink shadow-sm outline-none transition-all focus:border-lux-emerald focus:ring-4 focus:ring-lux-gold/20 disabled:bg-lux-ivory disabled:text-lux-muted"
                    value={acceptedAt}
                    onChange={(e) => setAcceptedAt(e.target.value)}
                    disabled={!canInteract}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="lux-eyebrow ml-1 block">Review Notes</label>
                <textarea
                  className="min-h-[100px] w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream p-4 font-medium text-lux-ink shadow-sm outline-none transition-all focus:border-lux-emerald focus:ring-4 focus:ring-lux-gold/20 disabled:bg-lux-ivory disabled:text-lux-muted"
                  placeholder="Share feedback or internal reasoning for this decision..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canInteract}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleSave("accepted")}
                disabled={!canInteract}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep px-8 py-3.5 text-sm font-black uppercase tracking-widest text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
              >
                <FaCheckCircle /> Accept Proposal
              </button>
              <button
                onClick={() => handleSave("rejected")}
                disabled={!canInteract}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-rose-200 bg-lux-cream px-8 py-3.5 text-sm font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
              >
                <FaTimesCircle /> Reject
              </button>
              <button
                onClick={() => onDelete(interaction._id)}
                disabled={!canInteract}
                className="rounded-2xl border border-transparent p-3.5 text-lux-muted shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-60"
                title="Delete Interaction"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        )}

        {interaction.status === "rejected" && isReviewer && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => onStatusChange(interaction._id, "pending", notes)}
              disabled={!canInteract}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
            >
              <FaHistory className="text-xs" /> Reopen Interaction
            </button>
            <button
              onClick={() => onDelete(interaction._id)}
              disabled={!canInteract}
              className="rounded-2xl border border-[#e4dbc6] p-3.5 text-lux-muted shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-60"
              title="Delete Interaction"
            >
              <FaTrashAlt />
            </button>
          </div>
        )}

        {interaction.status === "accepted" && isReviewer && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onDelete(interaction._id)}
              disabled={!canInteract}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e4dbc6] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-muted shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-60"
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
