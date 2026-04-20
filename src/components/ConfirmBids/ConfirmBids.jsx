import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaUserTag } from "react-icons/fa";
const Tables = lazy(() => import("../../common/Tables/Tables"));
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const ConfirmBids = () => {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const { mobile, userRole } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [bidDetails, setBidDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [approvalRate, setApprovalRate] = useState("");
  const [approvalQuantity, setApprovalQuantity] = useState("");

  const fetchDetails = async () => {
    try {
      const endpoints = [
        api.get("/participatebids", { params: { bidId } }),
        api.get("/sellers"),
        api.get(`/bids/${bidId}`),
        api.get("/confirm-bid", { params: { bidId } }),
      ];

      if (userRole === "Buyer") {
        endpoints.push(api.get("/bids/buyer-today", { params: { mobile } }));
      }

      const responses = await Promise.all(endpoints);
      
      const bidParticipants = responses[0].data?.data || responses[0].data || [];
      const sellers = responses[1].data?.data || responses[1].data || [];
      const matchedBid = responses[2].data;
      const confirmedBids = responses[3].data?.data || responses[3].data || [];

      if (userRole === "Buyer" && matchedBid) {
        const buyerInfo = responses[4].data.buyer;
        const normalize = (str) =>
          (str || "")
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        const allowedGroups = (buyerInfo.groups || []).map(normalize);
        const allowedCompanies = (buyerInfo.companies || []).map(c => String(c).trim());
        const bidGroup = normalize(matchedBid.group);
        const bidCompany = String(matchedBid.company || "").trim();
        const isOwnBid = String(matchedBid.createdByMobile || "") === String(mobile || "");

        if (!isOwnBid && !allowedGroups.includes(bidGroup) && !allowedCompanies.includes(bidCompany)) {
          toast.error("You are not authorized to view this bid.");
          navigate("/manage-bids/bid-list");
          return;
        }
      }

      setBidDetails(matchedBid || null);

      const detailedParticipants = bidParticipants.map((p, index) => {
        const seller = sellers.find((s) =>
          s.phoneNumbers.some((phone) => phone.value === String(p.mobile)),
        );

        const confirmedBid = confirmedBids.find((c) => c.phone === p.mobile);
        const confirmedStatus = confirmedBid ? confirmedBid.status : "Review";
        const acceptedRate =
          typeof confirmedBid?.acceptanceRate === "number"
            ? confirmedBid.acceptanceRate
            : null;
        const acceptedQty =
          typeof confirmedBid?.acceptanceQuantity === "number"
            ? confirmedBid.acceptanceQuantity
            : null;
        const acceptedAt = confirmedBid?.acceptedAt
          ? new Date(confirmedBid.acceptedAt)
          : null;
        const amountBaseRate =
          typeof acceptedRate === "number" ? acceptedRate : Number(p.rate);
        const amountBaseQty =
          typeof acceptedQty === "number" ? acceptedQty : Number(p.quantity);
        const amount =
          typeof confirmedBid?.acceptanceAmount === "number"
            ? confirmedBid.acceptanceAmount
            : Number.isFinite(amountBaseRate) && Number.isFinite(amountBaseQty)
              ? amountBaseRate * amountBaseQty
              : null;

        return {
          slNo: index + 1,
          participationId: p._id,
          sellerName: seller ? seller.sellerName : "Unknown",
          phone: p.mobile,
          email: seller ? seller.emails[0]?.value : "N/A",
          rate: p.rate,
          quantity: p.quantity,
          company: seller ? seller.companies.join(", ") : "N/A",
          status: confirmedStatus,
          acceptedRate,
          acceptedQty,
          acceptedAt,
          amount,
        };
      });

      setParticipants(detailedParticipants);
    } catch (error) {
      toast.error("Error fetching bid details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [bidId]);

  const openPopup = (bid) => {
    setSelectedBid(bid);
    setApprovalRate(String(bid?.acceptedRate ?? bid?.rate ?? ""));
    setApprovalQuantity(String(bid?.acceptedQty ?? bid?.quantity ?? ""));
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedBid(null);
    setApprovalRate("");
    setApprovalQuantity("");
  };

  const handleStatusChange = async (status) => {
    if (!selectedBid) return;

    const confirmAction = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} this bid?`,
    );
    if (!confirmAction) return;

    try {
      const acceptanceRateNumber =
        approvalRate === "" ? null : Number(approvalRate);
      const acceptanceQtyNumber =
        approvalQuantity === "" ? null : Number(approvalQuantity);

      await api.post("/confirm-bid", {
        bidId,
        phone: selectedBid.phone,
        status,
        participationId: selectedBid.participationId,
        acceptanceRate: Number.isFinite(acceptanceRateNumber)
          ? acceptanceRateNumber
          : null,
        acceptanceQuantity: Number.isFinite(acceptanceQtyNumber)
          ? acceptanceQtyNumber
          : null,
        acceptedAt: status === "Confirmed" ? new Date().toISOString() : null,
        acceptedByMobile: mobile || "",
        acceptedByRole: userRole || "",
      });

      toast.success(`Bid ${status.toLowerCase()} successfully!`);
      await fetchDetails();
    } catch (error) {
      toast.error("Failed to update bid status.", error);
    } finally {
      closePopup();
    }
  };

  const headers =
    userRole === "Buyer"
      ? [
          "Sl No",
          "Company",
          "Rate",
          "Quantity",
          "Approved Rate",
          "Approved Qty",
          "Amount",
          "Approved Time",
          "Status",
          "Action",
        ]
      : [
          "Sl No",
          "Seller Name",
          "Company",
          "Phone",
          "Email",
          "Rate",
          "Quantity",
          "Approved Rate",
          "Approved Qty",
          "Amount",
          "Approved Time",
          "Status",
          "Action",
        ];

  const rows = participants.map((p) => {
    const baseRow = [
      p.slNo,
      p.company,
      p.rate,
      p.quantity,
      typeof p.acceptedRate === "number" ? p.acceptedRate : "-",
      typeof p.acceptedQty === "number" ? p.acceptedQty : "-",
      typeof p.amount === "number" ? `₹${p.amount}` : "-",
      p.acceptedAt ? p.acceptedAt.toLocaleString() : "-",
      <span
        className={`px-3 py-1 rounded-full text-white text-sm ${
          p.status === "Confirmed"
            ? "bg-green-500"
            : p.status === "Rejected"
              ? "bg-red-500"
              : "bg-yellow-500"
        }`}
        key={p.phone}
      >
        {p.status}
      </span>,
      <button
        key={p.slNo}
        className={`text-blue-500 hover:underline ${
          p.status !== "Review" ? "cursor-not-allowed opacity-50" : ""
        }`}
        onClick={() => openPopup(p)}
        disabled={p.status !== "Review"}
      >
        Review
      </button>,
    ];

    if (userRole === "Buyer") {
      return baseRow;
    }

    return [
      p.slNo,
      p.sellerName,
      p.company,
      p.phone,
      p.email,
      ...baseRow.slice(2),
    ];
  });

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-semibold text-sm"
              >
                <FaArrowLeft />
                Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Confirm Bids</h2>
                <p className="text-sm text-slate-500 font-medium">Review and accept the best offers for your bid</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loading />
            </div>
          ) : (
            <div className="space-y-6">
              {bidDetails && (
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FaUserTag />
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">Bid Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Commodity</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{bidDetails.commodity}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Route</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{bidDetails.origin} → {bidDetails.consignee}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quantity</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{bidDetails.quantity} MT</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Rate</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{bidDetails.rate}</p>
                    </div>
                  </div>
                  {bidDetails.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notes</p>
                      <p className="text-xs text-slate-600 mt-1 italic">{bidDetails.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Participating Sellers</h3>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    {participants.length} Sellers
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <Tables headers={headers} rows={rows} />
                </div>
              </div>
            </div>
          )}
        </div>

        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={closePopup}
            title="Review Participation"
          >
            <div className="space-y-6 p-2">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className={`grid ${userRole === "Buyer" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                  {userRole !== "Buyer" && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
                      <p className="text-sm font-bold text-slate-800">{selectedBid?.sellerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company</p>
                    <p className="text-sm font-bold text-slate-800">{selectedBid?.company}</p>
                  </div>
                  {userRole !== "Buyer" && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-bold text-slate-800">{selectedBid?.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Seller Rate</p>
                  <p className="text-lg font-bold text-blue-700">₹{selectedBid?.rate}</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Seller Qty</p>
                  <p className="text-lg font-bold text-indigo-700">{selectedBid?.quantity} MT</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Final Approval Rate
                    </span>
                    <input
                      type="number"
                      value={approvalRate}
                      onChange={(e) => setApprovalRate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition-all font-bold text-slate-700"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Final Approval Qty
                    </span>
                    <input
                      type="number"
                      value={approvalQuantity}
                      onChange={(e) => setApprovalQuantity(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition-all font-bold text-slate-700"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  className="flex-1 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200"
                  onClick={() => handleStatusChange("Confirmed")}
                >
                  <FaCheckCircle />
                  Confirm & Accept
                </button>
                <button
                  className="flex-1 bg-white text-rose-600 border-2 border-rose-100 px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-95 transition-all"
                  onClick={() => handleStatusChange("Rejected")}
                >
                  <FaTimesCircle />
                  Reject Bid
                </button>
              </div>
            </div>
          </PopupBox>
        )}
      </div>
    </Suspense>
  );
};

export default ConfirmBids;
