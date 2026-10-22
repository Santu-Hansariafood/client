import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import {
  FaRegHandPointer,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaArrowLeft,
  FaLayerGroup,
  FaBuilding,
  FaBoxOpen,
  FaUsers,
  FaChevronRight,
  FaStar,
  FaBrain,
  FaClock,
  FaWeightHanging,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { formatDate, formatTime } from "../../../utils/textUtils/textUtils";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import SudokuGame from "../../../components/SudokuGame/SudokuGame";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const formatBidRate = (rate) =>
  rate === null || rate === undefined ? "Not disclosed" : `₹${rate}`;

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
  const [financeRequired, setFinanceRequired] = useState("no");
  const [sellerCompany, setSellerCompany] = useState("");
  const [bidLocations, setBidLocations] = useState([]);
  const [nowTime, setNowTime] = useState(() => new Date());
  const [serverNow, setServerNow] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [showMindFreshGame, setShowMindFreshGame] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchBids = useCallback(async () => {
    if (!mobile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
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
      setFinanceRequired(existingParticipation.financeRequired || "no");
      setSellerCompany(existingParticipation.sellerCompany || "");
    } else {
      setRate(
        bid.rate !== null && bid.rate !== undefined ? bid.rate || "" : "",
      );
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
      setFinanceRequired("no");
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
        financeRequired,
        sellerCompany: String(sellerCompany || "").trim(),
      };
      await api.post("/participatebids", participationData);
      toast.success("Participation successful!");
      clearApiCache();
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
      if (!entry.rates) entry.rates = new Set();
      if (bid.rate) entry.rates.add(bid.rate);

      if (!entry.companies.has(companyName)) {
        entry.companies.set(companyName, {
          companyName,
          bidCount: 0,
          commodities: new Set(),
          rates: new Set(),
        });
      }

      const companyEntry = entry.companies.get(companyName);
      companyEntry.bidCount += 1;
      companyEntry.commodities.add(commodityName);
      if (bid.rate) companyEntry.rates.add(bid.rate);
    });

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        commodities: Array.from(g.commodities).sort((a, b) =>
          a.localeCompare(b),
        ),
        rates: Array.from(g.rates || []).sort((a, b) => a - b),
        companies: Array.from(g.companies.values())
          .map((c) => ({
            ...c,
            commodities: Array.from(c.commodities).sort((a, b) =>
              a.localeCompare(b),
            ),
            rates: Array.from(c.rates).sort((a, b) => a - b),
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
    const acceptedTimestamp =
      participationStatus === "accepted"
        ? participation?.acceptedAt || participation?.updatedAt || null
        : null;
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
      .filter(([, vals]) => {
        const base = String(vals?.baseValue ?? "").trim();
        const max = String(vals?.maxValue ?? "").trim();
        return base !== "" || max !== "";
      })
      .flatMap(([key, vals]) => {
        const parts = [];
        if (vals?.baseValue) parts.push(`${key} (Base: ${vals.baseValue})`);
        if (vals?.maxValue) parts.push(`${key} (Max: ${vals.maxValue})`);
        return parts;
      })
      .join(", ");

    return (
      <div
        key={bid._id}
        className="group overflow-hidden rounded-2xl border border-[#ece4d2] bg-lux-cream shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="lux-eyebrow flex items-center gap-1.5 truncate">
                <FaLayerGroup className="text-lux-emerald" />
                {bid.group}
              </p>
              <h3 className="mt-0.5 truncate font-serif text-base font-bold text-lux-ink sm:mt-1 sm:text-lg">
                {bid.consignee}
              </h3>
              <p className="flex items-center gap-1.5 truncate text-xs text-lux-muted sm:text-sm">
                <FaBoxOpen className="shrink-0 text-lux-emerald" />
                {bid.commodity} - {bid.origin}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 sm:text-sm">
                  <FaClock className="text-rose-500" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-600" />
                  Ends: {bid.endTime} {!isClosed && `• ${countdownText}`}
                </p>
                {!isClosed && (
                  <p className="inline-flex items-center gap-1 rounded-md border border-[#e6dcc4] bg-lux-ivory px-2 py-0.5 text-[10px] font-semibold text-lux-muted sm:text-xs">
                    <FaUsers className="text-[10px] text-lux-emerald" />
                    Interactions: {participantCount}
                  </p>
                )}
              </div>
            </div>
            {isParticipated && (
              <div
                className={`flex flex-col items-end gap-0.5 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold shadow-sm sm:px-3 sm:text-xs ${
                  participationStatus === "accepted"
                    ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                    : participationStatus === "rejected"
                      ? "border border-rose-200 bg-rose-100 text-rose-700"
                      : "border border-[#e6dcc4] bg-lux-cream text-lux-emerald"
                }`}
              >
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  {participationStatus === "accepted" ? (
                    <FaCheckCircle className="text-xs" />
                  ) : participationStatus === "rejected" ? (
                    <FaTimesCircle className="text-xs" />
                  ) : (
                    <FaHourglassHalf className="text-[10px]" />
                  )}
                  {participationStatus.charAt(0).toUpperCase() +
                    participationStatus.slice(1)}
                </span>
                {participationStatus === "accepted" && acceptedTimestamp && (
                  <span className="text-right text-[9px] font-semibold leading-tight text-emerald-600 sm:text-[10px]">
                    {formatDate(acceptedTimestamp)} • {formatTime(acceptedTimestamp)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 transition-all duration-300 hover:shadow-sm">
              <p className="lux-eyebrow inline-flex items-center gap-1.5">
                <FaWeightHanging className="text-lux-emerald" />
                Quantity
              </p>
              <p className="text-sm font-bold text-lux-ink sm:text-base">
                {bid.quantity}{" "}
                <span className="text-[10px] font-normal sm:text-xs">Tons</span>
              </p>
            </div>
            {!isClosed && bid.rate !== null && bid.rate !== undefined && (
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 transition-all duration-300 hover:shadow-sm">
                <p className="lux-eyebrow inline-flex items-center gap-1.5">
                  <FaGavel className="text-lux-emerald" />
                  Rate
                </p>
                <p className="text-sm font-bold text-lux-ink sm:text-base">
                  {formatBidRate(bid.rate)}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 transition-all duration-300 hover:shadow-sm sm:col-span-2">
              <p className="lux-eyebrow inline-flex items-center gap-1.5">
                <FaStar className="text-lux-gold" />
                Quality Parameters
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-tight text-lux-ink sm:text-sm">
                {qualityText || "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 transition-all duration-300 hover:shadow-sm">
                <p className="lux-eyebrow inline-flex items-center gap-1.5">
                  <FaBuilding className="text-lux-emerald" />
                  Payment Terms
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-lux-ink sm:text-sm">
                  {bid.paymentTerms || "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 transition-all duration-300 hover:shadow-sm">
                <p className="lux-eyebrow inline-flex items-center gap-1.5">
                  <FaClock className="text-lux-gold" />
                  Expected Delivery
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-lux-ink sm:text-sm">
                  {bid.delivery ? `${bid.delivery} Days` : "N/A"}
                </p>
              </div>
            </div>

            {isParticipated && (
              <>
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5">
                  <p className="lux-eyebrow">
                    Your Rate
                  </p>
                  <p className="text-sm font-bold text-lux-emerald sm:text-base">
                    ₹{participation.rate}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5">
                  <p className="lux-eyebrow">
                    Your Quantity
                  </p>
                  <p className="text-sm font-bold text-lux-emerald sm:text-base">
                    {participation.quantity}{" "}
                    <span className="text-[10px] font-normal sm:text-xs">
                      Tons
                    </span>
                  </p>
                </div>
                {(participation.deliveryDate || participation.paymentTerms) && (
                  <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2 sm:gap-4">
                    <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5">
                      <p className="lux-eyebrow">
                        Expected Delivery Date
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-lux-emerald sm:text-sm">
                        {participation.deliveryDate
                          ? new Date(
                              participation.deliveryDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5">
                      <p className="lux-eyebrow">
                        Your Payment Terms
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-lux-emerald sm:text-sm">
                        {participation.paymentTerms || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
                {participation?.sellerCompany && (
                  <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-2.5 sm:col-span-2">
                    <p className="lux-eyebrow">
                      Your Company
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-lux-ink sm:text-sm">
                      {participation.sellerCompany}
                    </p>
                  </div>
                )}
                {participationStatus === "accepted" && (
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-2.5 sm:col-span-2 sm:grid-cols-4">
                    <div>
                      <p className="lux-eyebrow text-emerald-600">
                        Accepted Rate
                      </p>
                      <p className="text-sm font-bold text-emerald-700 sm:text-base">
                        ₹{participation.acceptedRate ?? participation.rate}
                      </p>
                    </div>
                    <div>
                      <p className="lux-eyebrow text-emerald-600">
                        Accepted Quantity
                      </p>
                      <p className="text-sm font-bold text-emerald-700 sm:text-base">
                        {participation.acceptedQuantity ??
                          participation.quantity}{" "}
                        <span className="text-[10px] font-normal sm:text-xs">
                          Tons
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="lux-eyebrow text-emerald-600">
                        Accepted Date
                      </p>
                      <p className="text-sm font-bold text-emerald-700 sm:text-base">
                        {formatDate(acceptedTimestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="lux-eyebrow text-emerald-600">
                        Accepted Time
                      </p>
                      <p className="text-sm font-bold text-emerald-700 sm:text-base">
                        {formatTime(acceptedTimestamp)}
                      </p>
                    </div>
                  </div>
                )}
                {participationStatus === "rejected" &&
                  String(participation?.adminNotes || "").trim() !== "" && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-2.5 sm:col-span-2">
                      <p className="lux-eyebrow text-rose-600">
                        Rejection Notes
                      </p>
                      <p className="mt-0.5 text-xs font-semibold leading-tight text-rose-700 sm:text-sm">
                        {participation.adminNotes}
                      </p>
                    </div>
                  )}
                {participationStatus === "pending" && isRevised && (
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:text-xs">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Revised Participation
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="border-t border-[#ece4d2] bg-lux-ivory/60 px-4 py-3 sm:px-5">
          <button
            onClick={() => handleParticipate(bid)}
            disabled={isClosed}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 sm:py-3 sm:text-sm ${
              isClosed
                ? "cursor-not-allowed border border-[#e4dbc6] bg-lux-ivory text-lux-muted"
                : isParticipated
                  ? "border border-[#e4dbc6] bg-lux-cream text-lux-emerald shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
                  : "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 hover:-translate-y-0.5 hover:shadow-xl"
            }`}
          >
            <FaRegHandPointer className="text-base transition-transform group-hover:scale-110" />
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
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="lux-card lux-gold-top w-full p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="lux-eyebrow">
                  Brand Bid Desk
                </p>
                <p className="mt-0.5 text-sm font-semibold text-lux-ink sm:text-base">
                  Smart, classy and responsive bidding experience With Hansaria Food Private Limited
                </p>
              </div>
              {syncTimeText && (
                <span className="inline-flex w-fit items-center rounded-full border border-[#e6dcc4] bg-lux-ivory px-3 py-1.5 text-xs font-semibold text-lux-muted">
                  Synced {syncTimeText}
                </span>
              )}
            </div>
          </div>
          <div className="mb-2 flex justify-start">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              <FaArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          </div>

          {mappedCommodityText && (
            <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-5 py-4 shadow-sm">
              <p className="lux-eyebrow">
                Mapped Commodities
              </p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-lux-ink">
                {mappedCommodityText}
              </p>
            </div>
          )}
          <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#ece4d2] bg-lux-cream p-2 shadow-sm sm:gap-3">
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "active"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border border-transparent text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
              }`}
            >
              Active Bids
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "closed"
                  ? "border border-rose-200 bg-rose-50 text-rose-700 shadow-sm"
                  : "border border-transparent text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setActiveTab("participated")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "participated"
                  ? "border border-[#e6dcc4] bg-lux-ivory text-lux-emerald shadow-sm"
                  : "border border-transparent text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
              }`}
            >
              Participated
            </button>
            <button
              onClick={() => setActiveTab("accepted")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "accepted"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border border-transparent text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "rejected"
                  ? "border border-rose-200 bg-rose-50 text-rose-600 shadow-sm"
                  : "border border-transparent text-lux-muted hover:bg-lux-ivory hover:text-lux-ink"
              }`}
            >
              Rejected
            </button>
          </div>

          {loading ? (
            <Loading />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center font-medium text-rose-700">
              {error}
            </div>
          ) : bidCount === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e9e2d3] bg-lux-cream py-10 text-center font-medium text-lux-muted">
                <p>No {activeTab} bids found for your selected commodities.</p>
                <button
                  type="button"
                  onClick={() => setShowMindFreshGame((prev) => !prev)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-ivory px-4 py-2 text-sm font-semibold text-lux-emerald transition-colors hover:bg-white"
                >
                  <FaBrain />
                  {showMindFreshGame ? "Hide Mind Fresh Sudoku" : "Mind Fresh with Sudoku"}
                </button>
              </div>
              {showMindFreshGame && (
                <SudokuGame title="Mind Fresh Sudoku (6x6)" />
              )}
            </div>
          ) : (
            <>
              {(selectedGroupName || selectedCompanyName) && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#ece4d2] bg-lux-cream px-3 py-2.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupName(null);
                      setSelectedCompanyName(null);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                  >
                    <FaArrowLeft />
                    Groups
                  </button>
                  {selectedGroupName && selectedCompanyName && (
                    <button
                      type="button"
                      onClick={() => setSelectedCompanyName(null)}
                      className="rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-sm font-semibold text-lux-ink shadow-sm transition-colors hover:bg-white"
                    >
                      Companies
                    </button>
                  )}
                  {selectedGroupName && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
                      <FaLayerGroup className="text-xs" />
                      {selectedGroupName}
                    </span>
                  )}
                  {selectedGroupName && selectedCompanyName && (
                    <FaChevronRight className="text-xs text-lux-muted" />
                  )}
                  {selectedCompanyName && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6dcc4] bg-lux-ivory px-3 py-1.5 text-sm font-semibold text-lux-emerald">
                      <FaBuilding className="text-xs" />
                      {selectedCompanyName}
                    </span>
                  )}
                </div>
              )}

              {!selectedGroupName ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {groupIndex.map((g) => (
                    <button
                      key={g.groupName}
                      type="button"
                      onClick={() => {
                        setSelectedGroupName(g.groupName);
                        setSelectedCompanyName(null);
                      }}
                    className="group rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 text-left shadow-lg shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
                    >
                      <p className="flex items-center gap-2 font-serif text-sm font-bold text-lux-ink transition-colors group-hover:text-lux-emerald">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft">
                          <FaLayerGroup className="text-xs" />
                        </span>
                        {g.groupName}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-lux-muted">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#e6dcc4] bg-lux-cream px-2 py-0.5">
                          <FaBuilding className="text-[10px] text-lux-muted" />
                          {g.companyCount} company(s)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-emerald-700">
                          <FaGavel className="text-[10px]" />
                          {g.bidCount} bid(s)
                        </span>
                        {g.rates && g.rates.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-emerald-700">
                            <FaGavel className="text-[10px]" />
                            ₹{g.rates.length === 1 ? g.rates[0] : `${g.rates[0]} - ${g.rates[g.rates.length - 1]}`}
                          </span>
                        )}
                      </p>
                      {g.commodities.length > 0 && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold leading-relaxed text-lux-muted">
                          <FaBoxOpen className="shrink-0 text-lux-emerald" />
                          {g.commodities.slice(0, 3).join(", ")}
                          {g.commodities.length > 3 ? "…" : ""}
                        </p>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-lux-emerald">
                        Explore group
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !selectedCompanyName ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 shadow-lg shadow-emerald-900/5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="inline-flex items-center gap-2 font-serif text-sm font-bold text-lux-ink">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft">
                          <FaBuilding className="text-xs" />
                        </span>
                        {selectedGroupName} Companies
                      </p>
                      <p className="inline-flex items-center gap-1 rounded-full border border-[#e6dcc4] bg-lux-cream px-2 py-1 text-xs font-semibold text-lux-muted">
                        <FaStar className="text-[10px] text-lux-gold" />
                        {groupIndex.find(
                          (g) => g.groupName === selectedGroupName,
                        )?.companyCount || 0}{" "}
                        company(s)
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {(
                        groupIndex.find(
                          (g) => g.groupName === selectedGroupName,
                        )?.companies || []
                      ).map((c) => (
                        <button
                          key={c.companyName}
                          type="button"
                          onClick={() => setSelectedCompanyName(c.companyName)}
                          className="group rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                        >
                          <p className="flex items-center gap-2 font-serif text-sm font-bold text-lux-ink transition-colors group-hover:text-lux-emerald">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft">
                              <FaBuilding className="text-xs" />
                            </span>
                            {c.companyName}
                          </p>
                          <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-lux-muted">
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#e6dcc4] bg-lux-cream px-2 py-0.5 text-lux-emerald">
                              <FaGavel className="text-[10px]" />
                              {c.bidCount} bid(s)
                            </span>
                            {c.rates && c.rates.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-emerald-700">
                                <FaGavel className="text-[10px]" />
                                ₹{c.rates.length === 1 ? c.rates[0] : `${c.rates[0]} - ${c.rates[c.rates.length - 1]}`}
                              </span>
                            )}
                          </p>
                          {c.commodities.length > 0 && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold leading-relaxed text-lux-muted">
                              <FaBoxOpen className="shrink-0 text-lux-emerald" />
                              {c.commodities.slice(0, 3).join(", ")}
                              {c.commodities.length > 3 ? "…" : ""}
                            </p>
                          )}
                          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-lux-emerald">
                            View bids
                            <span className="transition-transform group-hover:translate-x-0.5">→</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : displayedBids.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#e9e2d3] bg-lux-cream py-10 text-center font-medium text-lux-muted">
                    <p>No {activeTab} bids found for {selectedCompanyName}.</p>
                    <button
                      type="button"
                      onClick={() => setShowMindFreshGame((prev) => !prev)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-ivory px-4 py-2 text-sm font-semibold text-lux-emerald transition-colors hover:bg-white"
                    >
                      <FaBrain />
                      {showMindFreshGame ? "Hide Mind Fresh Sudoku" : "Mind Fresh with Sudoku"}
                    </button>
                  </div>
                  {showMindFreshGame && (
                    <SudokuGame title="Mind Fresh Sudoku (6x6)" />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedBid.rate !== null && selectedBid.rate !== undefined && (
                  <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-3 py-2.5">
                    <p className="lux-eyebrow">
                      Bid Rate
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-lux-ink">
                      {formatBidRate(selectedBid.rate)}
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-3 py-2.5">
                  <p className="lux-eyebrow">
                    Bid Quantity
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-lux-ink">{selectedBid.quantity} Tons</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory px-4 py-3">
                <p className="lux-eyebrow">
                  Submit Your Offer
                </p>
                <p className="mt-1 text-sm font-semibold text-lux-ink">
                  Fill all important details to make your participation stand out.
                </p>
              </div>
              {Array.isArray(sellerInfo?.companies) &&
                sellerInfo.companies.filter(Boolean).length > 0 && (
                  <label className="block">
                    <span className="lux-eyebrow block">
                      Your Company
                    </span>
                    <select
                      className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
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
                <span className="lux-eyebrow block">
                  Your Rate
                </span>
                <input
                  type="number"
                  className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter your rate"
                />
              </label>
              <label className="block">
                <span className="lux-eyebrow block">
                  Your Quantity (Tons)
                </span>
                <input
                  type="number"
                  className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </label>
              <label className="block">
                <span className="lux-eyebrow block">
                  Loading From
                </span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="lux-eyebrow block">
                    Delivery Date
                  </span>
                  <input
                    type="date"
                    className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                    value={deliveryDate}
                    readOnly
                    disabled
                  />
                </label>
                <label className="block">
                  <span className="lux-eyebrow block">
                    Payment Terms
                  </span>
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                    value={paymentTerms}
                    readOnly
                    disabled
                    placeholder="e.g. 15 Days"
                  />
                </label>
              </div>
              <label className="block">
                <span className="lux-eyebrow block">
                  Finance Required
                </span>
                <select
                  value={financeRequired}
                  onChange={(e) => setFinanceRequired(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
              <label className="block">
                <span className="lux-eyebrow block">
                  Remarks
                </span>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-lux-ink shadow-sm outline-none focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/50"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional remarks?"
                  rows={2}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 font-bold text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
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
