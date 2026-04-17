import React, { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";

const InteractionsPopup = ({ bidId, onClose }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { mobile: actorMobile, userRole: actorRole } = useAuth();

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const response = await api.get(`/participatebids?bidId=${bidId}`);
        setInteractions(response.data.data || response.data);
      } catch (error) {
        toast.error("Failed to fetch interactions.");
      }
      setLoading(false);
    };
    fetchInteractions();
  }, [bidId]);

  const handleStatusChange = async (id, status, adminNotes, acceptance) => {
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
      setInteractions(
        interactions.map((i) =>
          i._id === id
            ? {
                ...response.data,
                sellerName: i.sellerName,
                sellerCompany: i.sellerCompany,
              }
            : i,
        ),
      );
      toast.success(`Interaction ${status}.`);
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const isReviewer = actorRole === "Admin" || actorRole === "Employee" || actorRole === "Buyer";

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/95 rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Bid Interactions
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 text-xl leading-none transition"
          >
            &times;
          </button>
        </div>
        <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Participant Review
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Compare offers, add notes, then accept or reject confidently.
          </p>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <InteractionCard
                key={interaction._id}
                interaction={interaction}
                onStatusChange={handleStatusChange}
                isReviewer={isReviewer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InteractionCard = ({ interaction, onStatusChange, isReviewer }) => {
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

  const handleSave = (status) => {
    if (status === "accepted") {
      if (!acceptedRate || !acceptedQuantity) {
        return alert("Please enter acceptance rate and quantity.");
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
  };

  const interactionTime = interaction.createdAt
    ? new Date(interaction.createdAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  const isRevised =
    interaction.createdAt &&
    interaction.updatedAt &&
    new Date(interaction.updatedAt).getTime() >
      new Date(interaction.createdAt).getTime();

  const partyName =
    String(interaction.sellerCompany || "").trim() ||
    String(interaction.sellerName || "").trim() ||
    "Unknown Company";
  const hasAcceptedValues =
    interaction.acceptedRate != null || interaction.acceptedQuantity != null;
  const acceptedRateValue =
    interaction.acceptedRate ?? interaction.rate ?? "N/A";
  const acceptedQuantityValue =
    interaction.acceptedQuantity ?? interaction.quantity ?? "N/A";

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border relative shadow-sm transition-all duration-200 ${
        interaction.status === "accepted"
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-100/60"
          : interaction.status === "rejected"
            ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white"
            : "border-slate-200 bg-gradient-to-br from-slate-50/90 to-white hover:shadow-md"
      }`}
    >
      {isRevised && interaction.status === "pending" && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
            Revised
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Seller Company
          </p>
          <p className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5 leading-snug break-words">
            {partyName}
          </p>
          <p className="text-xs text-slate-500 mt-1">Mobile: {interaction.mobile}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Proposed Rate
          </p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5">
            ₹{interaction.rate}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Proposed Quantity
          </p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5">
            {interaction.quantity} Tons
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Last Interaction
          </p>
          <p className="text-sm text-slate-700 mt-1">{interactionTime}</p>
        </div>
      </div>

      {(interaction.status === "accepted" || hasAcceptedValues) && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Accepted Values
          </p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Accepted Rate
              </p>
              <p className="text-base font-bold text-emerald-700 mt-0.5">
                ₹{acceptedRateValue}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Accepted Quantity
              </p>
              <p className="text-base font-bold text-emerald-700 mt-0.5">
                {acceptedQuantityValue} Tons
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t pt-4 border-slate-100">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Expected Delivery Date
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {interaction.deliveryDate
              ? new Date(interaction.deliveryDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Payment Terms
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {interaction.paymentTerms || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Loading From
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {interaction.loadingFrom || "N/A"}
          </p>
        </div>
        {interaction.remarks && (
          <div className="sm:col-span-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Seller Remarks
            </p>
            <p className="text-sm italic text-slate-600 mt-0.5 bg-white/80 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
              "{interaction.remarks}"
            </p>
          </div>
        )}
      </div>
      {interaction.status !== "accepted" && isReviewer && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/95 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Acceptance Proposal
            </p>
            <span className="text-[11px] font-medium text-slate-400">
              Optional for reject
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">Acceptance Rate</p>
            <input
              type="number"
              className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
              value={acceptedRate}
              onChange={(e) => setAcceptedRate(e.target.value)}
              placeholder="Enter accepted rate"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">
              Acceptance Quantity
            </p>
            <input
              type="number"
              className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
              value={acceptedQuantity}
              onChange={(e) => setAcceptedQuantity(e.target.value)}
              placeholder="Enter accepted quantity"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Accepted On</p>
            <input
              type="datetime-local"
              className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
              value={acceptedAt}
              onChange={(e) => setAcceptedAt(e.target.value)}
            />
          </div>
          </div>
        </div>
      )}
      {isReviewer && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Review Notes
          </p>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white/80"
            placeholder="Add notes for the seller..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2.5">
        {interaction.status !== "accepted" && isReviewer && (
          <button
            onClick={() => handleSave("accepted")}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm font-semibold min-w-[120px]"
          >
            Accept
          </button>
        )}
        {interaction.status !== "rejected" && isReviewer && (
          <button
            onClick={() => handleSave("rejected")}
            className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition shadow-sm font-semibold min-w-[120px]"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractionsPopup;
