import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaRegHandPointer,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const SupplierBidList = () => {
  const navigate = useNavigate();
  const { mobile: authMobile } = useAuth();
  const location = useLocation();
  const { mobile: routeMobile } = location.state || {};
  const mobile = routeMobile || authMobile;

  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [activeTab, setActiveTab] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loadingFrom, setLoadingFrom] = useState("");
  const [remarks, setRemarks] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [sellerCompany, setSellerCompany] = useState("");
  const [bidLocations, setBidLocations] = useState([]);
  const [nowTime, setNowTime] = useState(() => new Date());
  const [serverNow, setServerNow] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchBids = useCallback(async () => {
    if (!mobile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `/bids/supplier-today?mobile=${encodeURIComponent(mobile)}`,
      );
      const payload = res.data?.data || res.data || {};

      const items = payload.bids || [];
      const myParticipations = payload.myParticipations || [];
      const counts = payload.participantCounts || {};
      const locations = payload.bidLocations || [];
      const serverNowValue = payload.serverNow || null;
      const seller = payload.seller || null;

      setBids(items);
      setParticipations(myParticipations);
      setParticipantCounts(counts);
      setBidLocations(locations);
      setServerNow(serverNowValue);
      setSellerInfo(seller);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch bid data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mobile]);

  useEffect(() => {
    if (!mobile) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    fetchBids();
  }, [fetchBids, mobile]);

  const getBidEndDateTime = (bid) => {
    const bidDateStr = bid.bidDate ? bid.bidDate.split("T")[0] : "";
    if (!bidDateStr || !bid.endTime) return null;
    const [year, month, day] = bidDateStr.split("-").map(Number);
    const [endHours, endMinutes] = String(bid.endTime).split(":").map(Number);
    if (
      !year ||
      !month ||
      !day ||
      Number.isNaN(endHours) ||
      Number.isNaN(endMinutes)
    ) {
      return null;
    }
    return new Date(year, month - 1, day, endHours, endMinutes, 0, 0);
  };

  const formatCountdown = (msRemaining) => {
    const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleParticipate = (bid) => {
    setSelectedBid(bid);
    const existingParticipation = participations.find(
      (p) => p.bidId === bid._id,
    );
    const companies = Array.isArray(sellerInfo?.companies)
      ? sellerInfo.companies.filter(Boolean)
      : [];
    if (existingParticipation) {
      setRate(existingParticipation.rate || "");
      setQuantity(existingParticipation.quantity || "");
      setLoadingFrom(existingParticipation.loadingFrom || "");
      setRemarks(existingParticipation.remarks || "");

      const rawDeliveryDate = existingParticipation.deliveryDate;
      let normalizedDeliveryDate = "";
      if (rawDeliveryDate) {
        const parsed = new Date(rawDeliveryDate);
        if (!Number.isNaN(parsed.getTime())) {
          normalizedDeliveryDate = parsed.toISOString().split("T")[0];
        }
      }
      setDeliveryDate(normalizedDeliveryDate);

      setPaymentTerms(existingParticipation.paymentTerms || "");
      setSellerCompany(existingParticipation.sellerCompany || "");
    } else {
      setRate(bid.rate || "");
      setQuantity(bid.quantity || "");
      setLoadingFrom("");
      setRemarks("");
      let defaultDeliveryDate = "";
      if (bid.bidDate && bid.delivery) {
        const baseDate = new Date(bid.bidDate);
        const deliveryDays = Number(bid.delivery);
        if (!Number.isNaN(baseDate.getTime()) && !Number.isNaN(deliveryDays)) {
          baseDate.setDate(baseDate.getDate() + deliveryDays);
          if (!Number.isNaN(baseDate.getTime())) {
            defaultDeliveryDate = baseDate.toISOString().split("T")[0];
          }
        }
      }
      setDeliveryDate(defaultDeliveryDate);
      setPaymentTerms(bid.paymentTerms || "");
      if (companies.length === 1) {
        setSellerCompany(String(companies[0] || "").trim());
      } else {
        setSellerCompany("");
      }
    }
    setIsPopupOpen(true);
  };

  const handleConfirm = async () => {
    if (!rate || !quantity) {
      toast.error("Please enter a valid rate and quantity.");
      return;
    }
    const companies = Array.isArray(sellerInfo?.companies)
      ? sellerInfo.companies.filter(Boolean)
      : [];
    if (companies.length > 1 && !String(sellerCompany || "").trim()) {
      toast.error("Please select your company.");
      return;
    }
    try {
      const participationData = {
        bidId: selectedBid._id,
        mobile: mobile,
        rate: Number(rate),
        quantity: Number(quantity),
        loadingFrom,
        remarks,
        deliveryDate,
        paymentTerms,
        sellerCompany: String(sellerCompany || "").trim(),
      };
      await axios.post("/participatebids", participationData);
      toast.success("Participation successful!");
      setIsPopupOpen(false);
      fetchBids();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to participate in the bid.";
      toast.error(errorMessage);
    }
  };

  const filteredBids = useMemo(() => {
    return bids
      .filter((bid) => {
        const bidEndDateTime = getBidEndDateTime(bid);
        if (!bidEndDateTime && bid.status === "active") return true;
        if (!bidEndDateTime && bid.status !== "active") return false;

        const isParticipated = participations.some((p) => p.bidId === bid._id);
        const isClosed = bid.status === "closed";
        const participation = participations.find((p) => p.bidId === bid._id);
        const isAccepted = participation?.status === "accepted";
        const isRejected = participation?.status === "rejected";

        if (activeTab === "active") {
          return bid.status === "active";
        }
        if (activeTab === "participated") {
          return isParticipated;
        }
        if (activeTab === "closed") {
          return isClosed;
        }
        if (activeTab === "accepted") {
          return isAccepted;
        }
        if (activeTab === "rejected") {
          return isRejected;
        }
        return false;
      })
      .sort((a, b) => {
        const aEnd = getBidEndDateTime(a)?.getTime() ?? 0;
        const bEnd = getBidEndDateTime(b)?.getTime() ?? 0;
        return bEnd - aEnd;
      });
  }, [bids, participations, activeTab]);

  const normalizeGroupName = useCallback(
    (value) => String(value ?? "").trim() || "Ungrouped",
    [],
  );

  const normalizeCompanyName = useCallback(
    (value) => String(value ?? "").trim() || "Unknown Company",
    [],
  );

  const normalizeCommodityName = useCallback(
    (value) => String(value ?? "").trim() || "Unknown Commodity",
    [],
  );

  const groupIndex = useMemo(() => {
    const groups = new Map();

    filteredBids.forEach((bid) => {
      const groupName = normalizeGroupName(bid.group);
      const companyName = normalizeCompanyName(bid.consignee);
      const commodityName = normalizeCommodityName(bid.commodity);

      if (!groups.has(groupName)) {
        groups.set(groupName, {
          groupName,
          bidCount: 0,
          commodities: new Set(),
          companies: new Map(),
        });
      }

      const entry = groups.get(groupName);
      entry.bidCount += 1;
      entry.commodities.add(commodityName);

      if (!entry.companies.has(companyName)) {
        entry.companies.set(companyName, {
          companyName,
          bidCount: 0,
          commodities: new Set(),
        });
      }

      const companyEntry = entry.companies.get(companyName);
      companyEntry.bidCount += 1;
      companyEntry.commodities.add(commodityName);
    });

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        commodities: Array.from(g.commodities).sort((a, b) =>
          a.localeCompare(b),
        ),
        companies: Array.from(g.companies.values())
          .map((c) => ({
            ...c,
            commodities: Array.from(c.commodities).sort((a, b) =>
              a.localeCompare(b),
            ),
          }))
          .sort((a, b) => a.companyName.localeCompare(b.companyName)),
        companyCount: g.companies.size,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [
    filteredBids,
    normalizeCommodityName,
    normalizeCompanyName,
    normalizeGroupName,
  ]);

  useEffect(() => {
    if (!selectedGroupName) {
      if (selectedCompanyName) setSelectedCompanyName(null);
      return;
    }

    const groupExists = groupIndex.some(
      (g) => g.groupName === selectedGroupName,
    );
    if (!groupExists) {
      setSelectedGroupName(null);
      setSelectedCompanyName(null);
      return;
    }

    if (selectedCompanyName) {
      const group = groupIndex.find((g) => g.groupName === selectedGroupName);
      const companyExists = group?.companies.some(
        (c) => c.companyName === selectedCompanyName,
      );
      if (!companyExists) setSelectedCompanyName(null);
    }
  }, [groupIndex, selectedCompanyName, selectedGroupName]);

  const bidCount = filteredBids.length;

  const displayedBids = useMemo(() => {
    return filteredBids.filter((bid) => {
      if (
        selectedGroupName &&
        normalizeGroupName(bid.group) !== selectedGroupName
      ) {
        return false;
      }
      if (
        selectedCompanyName &&
        normalizeCompanyName(bid.consignee) !== selectedCompanyName
      ) {
        return false;
      }
      return true;
    });
  }, [
    filteredBids,
    normalizeCompanyName,
    normalizeGroupName,
    selectedCompanyName,
    selectedGroupName,
  ]);

  const subtitleText = useMemo(() => {
    if (selectedGroupName && selectedCompanyName) {
      return `${displayedBids.length} ${activeTab} bid(s) • ${selectedGroupName} → ${selectedCompanyName}`;
    }
    if (selectedGroupName) {
      return `Select a company in ${selectedGroupName} to view ${activeTab} bids`;
    }
    return `Select a group to view ${activeTab} bids`;
  }, [activeTab, displayedBids.length, selectedCompanyName, selectedGroupName]);

  const mappedCommodityText = useMemo(() => {
    const commodities = sellerInfo?.commodities;
    if (!Array.isArray(commodities) || commodities.length === 0) return "";
    return commodities
      .map((c) => String(c?.name || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join(", ");
  }, [sellerInfo]);

  const syncTimeText = useMemo(() => {
    if (!serverNow) return null;
    const parsed = new Date(serverNow);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [serverNow]);

  const renderBidCard = (bid) => {
    const isParticipated = participations.some((p) => p.bidId === bid._id);
    const participation = isParticipated
      ? participations.find((p) => p.bidId === bid._id)
      : null;
    const participationStatus = (
      participation?.status || "pending"
    ).toLowerCase();
    const isRevised =
      participation?.createdAt &&
      participation?.updatedAt &&
      new Date(participation.updatedAt).getTime() >
        new Date(participation.createdAt).getTime();
    const bidEndDateTime = getBidEndDateTime(bid);
    const isClosed = bid.status === "closed";
    const countdownText =
      bidEndDateTime && !isClosed
        ? formatCountdown(bidEndDateTime.getTime() - nowTime.getTime())
        : "00:00:00";
    const participantCount = participantCounts[String(bid._id)] || 0;
    const hasNoParticipants = participantCount === 0;
    const qualityText = Object.entries(bid.parameters || {})
      .filter(
        ([, value]) =>
          String(value ?? "").trim() !== "" && String(value) !== "0",
      )
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", ");

    return (
      <div
        key={bid._id}
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-100/80"
      >
        <div className="p-4 sm:p-5">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate uppercase tracking-wider">
                {bid.group}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 sm:mt-1 truncate">
                {bid.consignee}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 truncate">
                {bid.commodity} - {bid.origin}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <p className="text-[11px] sm:text-sm font-semibold text-red-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Ends: {bid.endTime} {!isClosed && `• ${countdownText}`}
                </p>
                {!isClosed && (
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Interactions: {participantCount}
                  </p>
                )}
              </div>
            </div>
            {isParticipated && (
              <div
                className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shadow-sm ${
                  participationStatus === "accepted"
                    ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                    : participationStatus === "rejected"
                      ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                      : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                }`}
              >
                {participationStatus === "accepted" ? (
                  <FaCheckCircle className="text-xs" />
                ) : participationStatus === "rejected" ? (
                  <FaTimesCircle className="text-xs" />
                ) : (
                  <FaHourglassHalf className="text-[10px]" />
                )}
                {participationStatus.charAt(0).toUpperCase() +
                  participationStatus.slice(1)}
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Quantity
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-700">
                {bid.quantity}{" "}
                <span className="text-[10px] sm:text-xs font-normal">Tons</span>
              </p>
            </div>
            {!isClosed && (
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  Rate
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-700">
                  ₹{bid.rate}
                </p>
              </div>
            )}

            <div className="sm:col-span-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Quality Parameters
              </p>
              <p className="text-[11px] sm:text-sm font-semibold text-slate-700 mt-0.5 leading-tight">
                {qualityText || "N/A"}
              </p>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  Payment Terms
                </p>
                <p className="text-[11px] sm:text-sm font-semibold text-slate-700 mt-0.5">
                  {bid.paymentTerms || "N/A"}
                </p>
              </div>
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  Expected Delivery
                </p>
                <p className="text-[11px] sm:text-sm font-semibold text-slate-700 mt-0.5">
                  {bid.delivery ? `${bid.delivery} days` : "N/A"}
                </p>
              </div>
            </div>

            {isParticipated && (
              <>
                <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                    Your Rate
                  </p>
                  <p className="text-sm sm:text-base font-bold text-blue-700">
                    ₹{participation.rate}
                  </p>
                </div>
                <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                    Your Quantity
                  </p>
                  <p className="text-sm sm:text-base font-bold text-blue-700">
                    {participation.quantity}{" "}
                    <span className="text-[10px] sm:text-xs font-normal">
                      Tons
                    </span>
                  </p>
                </div>
                {(participation.deliveryDate || participation.paymentTerms) && (
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50">
                      <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                        Expected Delivery Date
                      </p>
                      <p className="text-[11px] sm:text-sm font-semibold text-blue-700 mt-0.5">
                        {participation.deliveryDate
                          ? new Date(
                              participation.deliveryDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="bg-blue-50/30 p-2.5 rounded-xl border border-blue-100/50">
                      <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                        Your Payment Terms
                      </p>
                      <p className="text-[11px] sm:text-sm font-semibold text-blue-700 mt-0.5">
                        {participation.paymentTerms || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
                {participation?.sellerCompany && (
                  <div className="sm:col-span-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                      Your Company
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 truncate">
                      {participation.sellerCompany}
                    </p>
                  </div>
                )}
                {participationStatus === "accepted" && (
                  <div className="sm:col-span-2 bg-green-50/30 p-2.5 rounded-xl border border-green-100/50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                        Accepted Rate
                      </p>
                      <p className="text-sm sm:text-base font-bold text-green-700">
                        ₹{participation.acceptedRate ?? participation.rate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                        Accepted Quantity
                      </p>
                      <p className="text-sm sm:text-base font-bold text-green-700">
                        {participation.acceptedQuantity ??
                          participation.quantity}{" "}
                        <span className="text-[10px] sm:text-xs font-normal">
                          Tons
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                {participationStatus === "rejected" &&
                  String(participation?.adminNotes || "").trim() !== "" && (
                    <div className="sm:col-span-2 bg-red-50/30 p-2.5 rounded-xl border border-red-100/50">
                      <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                        Rejection Notes
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-red-700 mt-0.5 leading-tight">
                        {participation.adminNotes}
                      </p>
                    </div>
                  )}
                {participationStatus === "pending" && isRevised && (
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Revised Participation
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-50/70 px-4 sm:px-5 py-3 border-t border-slate-100">
          <button
            onClick={() => handleParticipate(bid)}
            disabled={isClosed}
            className={`w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl py-2.5 sm:py-3 transition-all ${
              isClosed
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : isParticipated
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm"
            }`}
          >
            <FaRegHandPointer className="text-base" />
            {isClosed
              ? activeTab === "closed" && hasNoParticipants
                ? "Closed • No participants"
                : "Bid Closed"
              : isParticipated
                ? "Update Participation"
                : "Participate Now"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Supplier Bids"
        subtitle={subtitleText}
        icon={FaGavel}
        noContentCard
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/35 to-sky-50/45 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  Brand Bid Desk
                </p>
                <p className="text-sm sm:text-base font-semibold text-slate-800 mt-0.5">
                  Smart, classy and responsive bidding experience
                </p>
              </div>
              {syncTimeText && (
                <span className="inline-flex items-center w-fit px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                  Synced {syncTimeText}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-start mb-2">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FaArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          </div>

          {mappedCommodityText && (
            <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white via-white to-emerald-50/40 px-5 py-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Mapped Commodities
              </p>
              <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
                {mappedCommodityText}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 sm:gap-3 p-2 bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Active Bids
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "closed"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setActiveTab("participated")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "participated"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Participated
            </button>
            <button
              onClick={() => setActiveTab("accepted")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "accepted"
                  ? "bg-green-50 text-green-700 border border-green-200 shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "rejected"
                  ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"
                  : "text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Rejected
            </button>
          </div>

          {loading ? (
            <Loading />
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-200 text-red-600 font-medium">
              {error}
            </div>
          ) : bidCount === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No {activeTab} bids found for your selected commodities.
            </div>
          ) : (
            <>
              {(selectedGroupName || selectedCompanyName) && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupName(null);
                      setSelectedCompanyName(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <FaArrowLeft />
                    Groups
                  </button>
                  {selectedGroupName && selectedCompanyName && (
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyName(null)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Companies
                    </button>
                  )}
                  {selectedGroupName && (
                    <span className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-xl border border-slate-200 shadow-sm">
                      {selectedGroupName}
                    </span>
                  )}
                  {selectedCompanyName && (
                    <span className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl border border-slate-200">
                      {selectedCompanyName}
                    </span>
                  )}
                </div>
              )}

              {!selectedGroupName ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {groupIndex.map((g) => (
                    <button
                      key={g.groupName}
                      type="button"
                      onClick={() => {
                        setSelectedGroupName(g.groupName);
                        setSelectedCompanyName(null);
                      }}
                      className="text-left bg-white rounded-2xl border border-emerald-100 p-4 sm:p-5 shadow-lg shadow-emerald-900/5 hover:shadow-xl transition-shadow"
                    >
                      <p className="text-sm font-bold text-slate-800">
                        {g.groupName}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 mt-2">
                        {g.companyCount} company(s) • {g.bidCount} bid(s)
                      </p>
                      {g.commodities.length > 0 && (
                        <p className="text-xs font-semibold text-slate-600 mt-2">
                          {g.commodities.slice(0, 3).join(", ")}
                          {g.commodities.length > 3 ? "…" : ""}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : !selectedCompanyName ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg shadow-emerald-900/5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-800">
                        {selectedGroupName} Companies
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {groupIndex.find(
                          (g) => g.groupName === selectedGroupName,
                        )?.companyCount || 0}{" "}
                        company(s)
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {(
                        groupIndex.find(
                          (g) => g.groupName === selectedGroupName,
                        )?.companies || []
                      ).map((c) => (
                        <button
                          key={c.companyName}
                          type="button"
                          onClick={() => setSelectedCompanyName(c.companyName)}
                          className="text-left bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <p className="text-sm font-bold text-slate-800">
                            {c.companyName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-2">
                            {c.bidCount} bid(s)
                          </p>
                          {c.commodities.length > 0 && (
                            <p className="text-xs font-semibold text-slate-600 mt-2">
                              {c.commodities.slice(0, 3).join(", ")}
                              {c.commodities.length > 3 ? "…" : ""}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : displayedBids.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
                  No {activeTab} bids found for {selectedCompanyName}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {displayedBids.map(renderBidCard)}
                </div>
              )}
            </>
          )}
        </div>

        {isPopupOpen && selectedBid && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={`Participate in: ${selectedBid.consignee}`}
          >
            <div className="space-y-5 p-1">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Submit Your Offer
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  Fill all important details to make your participation stand out.
                </p>
              </div>
              {Array.isArray(sellerInfo?.companies) &&
                sellerInfo.companies.filter(Boolean).length > 0 && (
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Your Company
                    </span>
                    <select
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none bg-white shadow-sm"
                      value={sellerCompany}
                      onChange={(e) => setSellerCompany(e.target.value)}
                      disabled={
                        sellerInfo.companies.filter(Boolean).length === 1
                      }
                    >
                      {sellerInfo.companies.filter(Boolean).length > 1 && (
                        <option value="">Select Company</option>
                      )}
                      {sellerInfo.companies
                        .filter(Boolean)
                        .map((companyName) => (
                          <option key={companyName} value={companyName}>
                            {companyName}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Your Rate
                </span>
                <input
                  type="number"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none shadow-sm"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter your rate"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Your Quantity (Tons)
                </span>
                <input
                  type="number"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none shadow-sm"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Loading From
                </span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none bg-white shadow-sm"
                  value={loadingFrom}
                  onChange={(e) => setLoadingFrom(e.target.value)}
                >
                  <option value="">Select Loading Location</option>
                  {bidLocations.map((loc) => (
                    <option key={loc._id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Delivery Date
                  </span>
                  <input
                    type="date"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none shadow-sm"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Payment Terms
                  </span>
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none shadow-sm"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 15 Days"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Remarks
                </span>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none shadow-sm"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional remarks?"
                  rows={2}
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg font-semibold"
                >
                  Confirm Participation
                </button>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default SupplierBidList;
