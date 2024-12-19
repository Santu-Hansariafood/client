import { useState, useEffect, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { AiOutlineEye } from "react-icons/ai";
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const DateSelector = lazy(() =>
  import("../../../common/DateSelector/DateSelector")
);
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const BidIntroduction = lazy(() => import("../../../components/BidIntroduction/BidIntroduction"));
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../../common/Loading/Loading";

const BidList = () => {
  const [bids, setBids] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [searchCompany, setSearchCompany] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [showBidIntro, setShowBidIntro] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bidsResponse, commoditiesResponse, originsResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/bids"),
            fetch("http://localhost:5000/api/commodities"),
            fetch("http://localhost:5000/api/bid-locations"),
          ]);

        if (
          !bidsResponse.ok ||
          !commoditiesResponse.ok ||
          !originsResponse.ok
        ) {
          throw new Error("Failed to fetch data");
        }

        const bidsData = await bidsResponse.json();
        const commoditiesData = await commoditiesResponse.json();
        const originsData = await originsResponse.json();

        setBids(bidsData);
        setFilteredData(bidsData);
        setCommodities(commoditiesData);
        setOrigins(originsData);
      } catch (error) {
        setError("Error fetching data. Please try again later.");
        console.error("Error:", error);
      }
    };

    fetchData();
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

    if (startDate) {
      data = data.filter((bid) => new Date(bid.bidDate) >= startDate);
    }
    if (endDate) {
      data = data.filter((bid) => new Date(bid.bidDate) <= endDate);
    }

    data.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));

    setFilteredData(data);
  }, [searchCompany, startDate, endDate, bids]);

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
    "BidIntroduction",
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
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setSelectedBidId(bid._id)}
        title="View"
      >
        <AiOutlineEye size={20} />
      </button>,
      <button
        key={`intro-${index}`}
        className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
        onClick={() => setShowBidIntro(true)}
      >
        BidIntroduction
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
        {error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : showBidIntro ? (
          <BidIntroduction />
        ) : (
          <>
            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <SearchBox
                placeholder="Search by company"
                items={bids.map((bid) => bid.company)}
                onSearch={(filteredItems) => setSearchCompany(filteredItems)}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => setShowDateRange(!showDateRange)}
              >
                {showDateRange ? "Hide Date Range" : "Select Date Range"}
              </button>
            </div>
            {showDateRange && (
              <div className="mb-4 flex flex-col md:flex-row gap-4">
                <DateSelector
                  selectedDate={startDate}
                  onChange={(date) => setStartDate(date)}
                />
                <DateSelector
                  selectedDate={endDate}
                  onChange={(date) => setEndDate(date)}
                />
              </div>
            )}
            <div className="overflow-x-auto">
              <Tables headers={headers} rows={rows} />
            </div>
            {filteredData.length === 0 && (
              <p className="text-gray-500 text-center">No data available.</p>
            )}
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
          </>
        )}
        {selectedBidId && (
          <ViewBid
            bidId={selectedBidId}
            onClose={() => setSelectedBidId(null)}
          />
        )}
      </div>
    </Suspense>
  );
};

BidList.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string),
  rows: PropTypes.arrayOf(PropTypes.array),
};

export default BidList;
