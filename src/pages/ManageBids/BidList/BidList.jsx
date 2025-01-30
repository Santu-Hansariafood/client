import { useState, useEffect, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { AiOutlineEye } from "react-icons/ai";
import axios from "axios";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const DateSelector = lazy(() => import("../../../common/DateSelector/DateSelector"));
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const BidIntroduction = lazy(() => import("../../../components/BidIntroduction/BidIntroduction"));
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../../common/Loading/Loading";

const BidList = () => {
  const [bids, setBids] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [showBidIntro, setShowBidIntro] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://phpserver-v77g.onrender.com/api/bids");
        const sortedBids = response.data.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate));
        setBids(sortedBids);
        setFilteredData(sortedBids);
      } catch (error) {
        setError("Error fetching data. Please try again later.");
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let data = [...bids];

    if (searchQuery) {
      data = data.filter((bid) => bid.consignee.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (startDate) {
      data = data.filter((bid) => new Date(bid.bidDate) >= startDate);
    }
    if (endDate) {
      data = data.filter((bid) => new Date(bid.bidDate) <= endDate);
    }

    setFilteredData(data);
  }, [searchQuery, startDate, endDate, bids]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const headers = [
    "ID",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Parameters",
    "Quantity",
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
      bid.group,
      bid.consignee,
      bid.origin,
      bid.commodity,
      Object.entries(bid.parameters)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", "),
      bid.quantity,
      bid.rate,
      formatDate(bid.bidDate),
      bid.startTime,
      bid.endTime,
      bid.paymentTerms,
      bid.delivery,
      <button
        key={index}
        className="text-blue-500 hover:text-blue-700"
        onClick={() => setSelectedBid(bid)}
        title="View"
      >
        <AiOutlineEye size={20} />
      </button>,
    ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-6xl mx-auto">
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
                placeholder="Search by consignee"
                onSearch={(query) => setSearchQuery(query)}
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
       {selectedBid && (
  <ViewBid bidId={selectedBid._id} onClose={() => setSelectedBid(null)} />
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
