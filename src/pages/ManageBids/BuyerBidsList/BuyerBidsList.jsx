import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaGavel, FaArrowLeft } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
import { useAuth } from "../../../context/AuthContext/AuthContext";
import "react-datepicker/dist/react-datepicker.css";

const BuyerBidsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [searchCompany, setSearchCompany] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get("/bids");
        const items = response.data?.data || response.data || [];
        const sorted = items.sort(
          (a, b) => new Date(b.bidDate) - new Date(a.bidDate),
        );
        setBids(sorted);
        setFilteredData(sorted);
      } catch {
        toast.error("Error fetching bids");
      }
    };
    const fetchCommodities = async () => {
      try {
        const response = await axios.get("/commodities");
        const items = response.data?.data || response.data || [];
        const sorted = items.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setCommodities(sorted);
      } catch {
        toast.error("Error fetching commodities");
      }
    };
    const fetchOrigins = async () => {
      try {
        const response = await axios.get("/bid-locations");
        const items = response.data?.data || response.data || [];
        const sorted = items.sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        setOrigins(sorted);
      } catch {
        toast.error("Error fetching origins");
      }
    };
    fetchBids();
    fetchCommodities();
    fetchOrigins();
  }, []);

  useEffect(() => {
    let data = [...bids];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (user && user.group) {
      data = data.filter((bid) => bid.group === user.group);
    }

    if (searchCompany.length > 0) {
      const set = new Set(searchCompany);
      data = data.filter((bid) => set.has(bid.company));
    }
    if (filterType !== "all") {
      data = data.filter((bid) => bid.type === filterType);
    }

    if (!startDate && !endDate) {
      data = data.filter((bid) => {
        const bidDateStr = bid.bidDate ? bid.bidDate.split("T")[0] : "";
        return bidDateStr === todayStr;
      });
    } else {
      if (startDate) {
        data = data.filter((bid) => new Date(bid.bidDate) >= startDate);
      }
      if (endDate) {
        data = data.filter((bid) => new Date(bid.bidDate) <= endDate);
      }
    }
    data.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));
    setFilteredData(data);
    setCurrentPage(1);
  }, [searchCompany, filterType, startDate, endDate, bids]);

  const getCommodityName = (id) => {
    const commodity = commodities.find((item) => item._id === id);
    return commodity ? commodity.name : "Unknown";
  };

  const getOriginName = (id) => {
    const origin = origins.find((item) => item._id === id);
    return origin ? origin.name : "Unknown";
  };

  const getParametersDisplay = (parameters, commodityId) => {
    const commodity = commodities.find((item) => item._id === commodityId);
    if (!commodity) return "N/A";
    return commodity.parameters
      .map((param) => `${param.parameter}: ${parameters[param._id] || "N/A"}`)
      .join(", ");
  };

  const headers = [
    "Sl No",
    "Type",
    "Company",
    "Origin",
    "Commodity",
    "Parameters",
    "Quantity",
    "Unit",
    "Rate",
    "Bid Date",
    "Start Time",
    "End Time",
    "Payment Terms",
    "Delivery",
    "View",
  ];

  const rows = filteredData
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((bid, index) => [
      (currentPage - 1) * itemsPerPage + index + 1,
      bid.type,
      bid.company,
      getOriginName(bid.origin),
      getCommodityName(bid.commodity),
      getParametersDisplay(bid.parameters, bid.commodity),
      bid.quantity,
      bid.unit,
      bid.rate,
      new Date(bid.bidDate).toLocaleDateString(),
      bid.startTime,
      bid.endTime,
      bid.paymentTerms,
      `${bid.delivery} days`,
      <button
        key={bid._id}
        type="button"
        className="font-medium text-emerald-700 hover:text-emerald-800 underline decoration-emerald-300"
        onClick={() => setSelectedBidId(bid._id)}
      >
        View bid
      </button>,
    ]);

  const companyItems = [
    ...new Set(bids.map((b) => b.company).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Bid list"
        subtitle="Filter by company, type, and date range"
        icon={FaGavel}
        noContentCard
        extraHeaderContent={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
            Back
          </button>
        }
      >
        <div className="max-w-full space-y-6">
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 items-stretch lg:items-end">
            <SearchBox
              placeholder="Search by company..."
              items={companyItems}
              onSearch={(filtered) => setSearchCompany(filtered)}
              className="max-w-full lg:max-w-xs"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-slate-800 shadow-md shadow-emerald-900/5 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none min-w-[140px]"
            >
              <option value="all">All types</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
            </select>
            <div className="flex flex-wrap gap-3">
              <DateSelector
                selectedDate={startDate}
                onChange={(date) => setStartDate(date)}
              />
              <DateSelector
                selectedDate={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-lg shadow-emerald-900/5 overflow-hidden">
            <Tables headers={headers} rows={rows} />
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {selectedBidId && (
          <ViewBid
            bidId={selectedBidId}
            onClose={() => setSelectedBidId(null)}
          />
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default BuyerBidsList;
