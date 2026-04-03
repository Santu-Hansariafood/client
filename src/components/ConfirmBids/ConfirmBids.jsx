import { useEffect, useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";
const Tables = lazy(() => import("../../common/Tables/Tables"));
const PopupBox = lazy(() => import("../../common/PopupBox/PopupBox"));

const ConfirmBids = () => {
  const { bidId } = useParams();
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
      const [participateRes, sellersRes, bidsRes, confirmRes] =
        await Promise.all([
          axios.get("/participatebids"),
          axios.get("/sellers"),
          axios.get("/bids"),
          axios.get("/confirm-bid"),
        ]);

      const bids = bidsRes.data?.data || bidsRes.data || [];
      const matchedBid = bids.find((b) => b._id === bidId);
      setBidDetails(matchedBid || null);

      const confirmedBidsRaw = confirmRes.data?.data || confirmRes.data || [];
      const confirmedBids = confirmedBidsRaw.filter((c) => c.bidId === bidId);

      const participationRaw =
        participateRes.data?.data || participateRes.data || [];
      const bidParticipants = participationRaw.filter(
        (p) => p.bidId === bidId
      );
      const sellers = sellersRes.data?.data || sellersRes.data || [];

      const detailedParticipants = bidParticipants.map((p, index) => {
        const seller = sellers.find((s) =>
          s.phoneNumbers.some((phone) => phone.value === String(p.mobile))
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
        const acceptedAt = confirmedBid?.acceptedAt ? new Date(confirmedBid.acceptedAt) : null;
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
      `Are you sure you want to ${status.toLowerCase()} this bid?`
    );
    if (!confirmAction) return;

    try {
      const acceptanceRateNumber =
        approvalRate === "" ? null : Number(approvalRate);
      const acceptanceQtyNumber =
        approvalQuantity === "" ? null : Number(approvalQuantity);

      await axios.post("/confirm-bid", {
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

  const headers = [
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

  const rows = participants.map((p) => [
    p.slNo,
    p.sellerName,
    p.company,
    p.phone,
    p.email,
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
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-center">Confirm Bids</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {bidDetails && (
              <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2 text-center">
                  Bid Details
                </h3>
                <p>
                  <strong>Group:</strong> {bidDetails.group}
                </p>
                <p>
                  <strong>Consignee:</strong> {bidDetails.consignee}
                </p>
                <p>
                  <strong>Origin:</strong> {bidDetails.origin}
                </p>
                <p>
                  <strong>Commodity:</strong> {bidDetails.commodity}
                </p>
                <p>
                  <strong>Quantity:</strong> {bidDetails.quantity} MT
                </p>
                <p>
                  <strong>Rate:</strong> ₹{bidDetails.rate}
                </p>
                <p>
                  <strong>Notes:</strong> {bidDetails.notes}
                </p>
                <p>
                  <strong>Bid Date:</strong>{" "}
                  {new Date(bidDetails.bidDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <Tables headers={headers} rows={rows} />
          </>
        )}
        {isPopupOpen && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={closePopup}
            title="Confirm Your Bid"
          >
            <div className="text-center">
              <p>
                <strong>Seller Name:</strong> {selectedBid?.sellerName}
              </p>
              <p>
                <strong>Company:</strong> {selectedBid?.company}
              </p>
              <p>
                <strong>Rate:</strong> ₹{selectedBid?.rate}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedBid?.quantity} MT
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Approve Rate
                  </span>
                  <input
                    type="number"
                    value={approvalRate}
                    onChange={(e) => setApprovalRate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Approve Quantity
                  </span>
                  <input
                    type="number"
                    value={approvalQuantity}
                    onChange={(e) => setApprovalQuantity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none"
                  />
                </label>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={() => handleStatusChange("Confirmed")}
                >
                  ✔ Confirm
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => handleStatusChange("Rejected")}
                >
                  ✖ Reject
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
