import { useState, useEffect, lazy, Suspense } from "react";
import PropTypes from "prop-types";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const DateSelector = lazy(() =>
  import("../../../common/DateSelector/DateSelector")
);
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../../common/Loading/Loading";

const BidList = () => {
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
        const response = await fetch("http://localhost:5000/api/bids");
        const data = await response.json();
        setBids(data);
        setFilteredData(data);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    };

    const fetchCommodities = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/commodities");
        const data = await response.json();
        setCommodities(data);
      } catch (error) {
        console.error("Error fetching commodities:", error);
      }
    };

    const fetchOrigins = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/bid-locations");
        const data = await response.json();
        setOrigins(data);
      } catch (error) {
        console.error("Error fetching origins:", error);
      }
    };

    fetchBids();
    fetchCommodities();
    fetchOrigins();
  }, []);

  useEffect(() => {
    let data = [...bids];

    if (searchCompany.length > 0) {
      data = data.filter((bid) =>
        searchCompany.some((term) =>
          bid.company.toLowerCase().includes(term.toLowerCase())
        )
      );
    }

    if (filterType !== "all") {
      data = data.filter((bid) => bid.type === filterType);
    }

    if (startDate) {
      data = data.filter((bid) => new Date(bid.bidDate) >= startDate);
    }
    if (endDate) {
      data = data.filter((bid) => new Date(bid.bidDate) <= endDate);
    }

    data.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));

    setFilteredData(data);
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
    "ID",
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
    "View Bid",
  ];

  const rows = filteredData
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((bid, index) => [
      filteredData.length - ((currentPage - 1) * itemsPerPage + index),
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
        key={index}
        className="text-blue-500 underline hover:text-blue-700"
        onClick={() => setSelectedBidId(bid._id)}
      >
        View Bid
      </button>,
    ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
          Bid Management Dashboard
        </h1>
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <SearchBox
            placeholder="Search by company"
            items={bids.map((bid) => bid.company)}
            onSearch={(filteredItems) => setSearchCompany(filteredItems)}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3"
          >
            <option value="all">All</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
          </select>
          <DateSelector
            selectedDate={startDate}
            onChange={(date) => setStartDate(date)}
          />
          <DateSelector
            selectedDate={endDate}
            onChange={(date) => setEndDate(date)}
          />
        </div>
        <Tables headers={headers} rows={rows} />
        <div className="mt-4 flex justify-center">
          {Array.from({
            length: Math.ceil(filteredData.length / itemsPerPage),
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`mx-1 px-3 py-1 rounded border border-gray-300 ${
                currentPage === index + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      {selectedBidId && (
        <ViewBid bidId={selectedBidId} onClose={() => setSelectedBidId(null)} />
      )}
    </Suspense>
  );
};

BidList.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string),
  rows: PropTypes.arrayOf(PropTypes.array),
};

export default BidList;
