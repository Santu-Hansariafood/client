import { useState, useEffect, lazy, Suspense } from "react";
import { AiOutlineEye, AiOutlineEdit } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
import { useMemo } from "react";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const ViewBid = lazy(() => import("../ViewBidPopup/ViewBidPopup"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);

const BidList = () => {
  const [bids, setBids] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [editableRateQuantity, setEditableRateQuantity] = useState(null);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://phpserver-kappa.vercel.app/api/bids"
        );
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const filteredBids = response.data.filter(
          (bid) => new Date(bid.bidDate) >= sevenDaysAgo
        );

        const sortedBids = filteredBids.sort(
          (a, b) => new Date(b.bidDate) - new Date(a.bidDate)
        );

        setBids(sortedBids);
        setFilteredData(sortedBids);
      } catch (error) {
        setError("Error fetching data. Please try again later.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const data = searchQuery
      ? bids.filter((bid) =>
          bid.consignee.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : bids;
    setFilteredData(data);
    setCurrentPage(1);
  }, [searchQuery, bids]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const handleEdit = async () => {
    if (!editableRateQuantity) return;

    try {
      const { id, rate, quantity } = editableRateQuantity;

      const response = await axios.put(
        `https://phpserver-kappa.vercel.app/api/bids/${id}`,
        { rate, quantity }
      );

      toast.success("Bid updated successfully!");

      setBids((prevBids) =>
        prevBids.map((bid) =>
          bid._id === id ? { ...bid, rate, quantity } : bid
        )
      );

      setEditableRateQuantity(null);
    } catch (error) {
      console.error("Error updating bid:", error);
      toast.error("Failed to update bid. Please try again.");
    }
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    "View/Edit Rate & Quantity",
    "View Bid",
  ];

  const rows = paginatedData.map((bid, index) => [
    filteredData.length - ((currentPage - 1) * itemsPerPage + index),
    bid.group,
    bid.consignee,
    bid.origin,
    bid.commodity,
    Object.entries(bid.parameters)
      .filter(([_, value]) => value !== "0")
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", "),
    bid.quantity,
    bid.rate,
    formatDate(bid.bidDate),
    bid.startTime,
    bid.endTime,
    bid.paymentTerms,
    bid.delivery,
    <button
      key={`rate-quantity-${index}`}
      className="text-green-500 hover:text-green-700 flex items-center gap-1"
      onClick={() =>
        setEditableRateQuantity({
          id: bid._id,
          rate: bid.rate,
          quantity: bid.quantity,
        })
      }
      title="View/Edit Rate & Quantity"
    >
      <AiOutlineEdit size={20} />
    </button>,
    <button
      key={`view-bid-${index}`}
      className="text-blue-500 hover:text-blue-700"
      onClick={() => setSelectedBid(bid)}
      title="View"
    >
      <AiOutlineEye size={20} />
    </button>,
  ]);

  const [selectedGroup, setSelectedGroup] = useState(null);

  const groupedBids = useMemo(() => {
    const groups = {};
    bids.forEach((bid) => {
      if (!groups[bid.group]) groups[bid.group] = [];
      groups[bid.group].push(bid);
    });
    return Object.keys(groups)
      .sort()
      .map((group) => ({
        group,
        bids: groups[group],
        consignees: [...new Set(groups[group].map((b) => b.consignee))],
      }));
  }, [bids]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
          Bid Management Dashboard
        </h1>
        {error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <SearchBox
                placeholder="Search by consignee"
                onSearch={setSearchQuery}
              />
            </div>
            <div className="overflow-x-auto">
              {groupedBids.map(({ group, bids, consignees }) => (
                <div key={group} className="mb-6 border rounded p-4 bg-gray-50">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <span className="font-bold text-lg">{group}</span>
                    <span className="text-sm text-green-600">
                      {consignees.length} Consignees
                    </span>
                  </div>
                  <div className="mt-2 text-gray-700">
                    Consignees: {consignees.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {selectedGroup && (
          <PopupBox
            isOpen={!!selectedGroup}
            onClose={() => setSelectedGroup(null)}
            title={`Bids for Group: ${selectedGroup}`}
          >
            <Tables
              headers={headers}
              rows={groupedBids
                .find((g) => g.group === selectedGroup)
                .bids.map((bid, index) => [
                  filteredData.length -
                    ((currentPage - 1) * itemsPerPage + index),
                  bid.group,
                  bid.consignee,
                  bid.origin,
                  bid.commodity,
                  Object.entries(bid.parameters)
                    .filter(([_, value]) => value !== "0")
                    .map(([key, value]) => `${key}: ${value}%`)
                    .join(", "),
                  bid.quantity,
                  bid.rate,
                  formatDate(bid.bidDate),
                  bid.startTime,
                  bid.endTime,
                  bid.paymentTerms,
                  bid.delivery,
                  <button
                    key={`rate-quantity-${index}`}
                    className="text-green-500 hover:text-green-700 flex items-center gap-1"
                    onClick={() =>
                      setEditableRateQuantity({
                        id: bid._id,
                        rate: bid.rate,
                        quantity: bid.quantity,
                      })
                    }
                    title="View/Edit Rate & Quantity"
                  >
                    <AiOutlineEdit size={20} />
                  </button>,
                  <button
                    key={`view-bid-${index}`}
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => setSelectedBid(bid)}
                    title="View"
                  >
                    <AiOutlineEye size={20} />
                  </button>,
                ])}
            />
          </PopupBox>
        )}
        {editableRateQuantity && (
          <PopupBox
            isOpen={!!editableRateQuantity}
            onClose={() => setEditableRateQuantity(null)}
            title="Edit Rate & Quantity"
          >
            <div className="space-y-4">
              <label>
                Rate / Tons:
                <input
                  type="number"
                  className="border p-2 w-full"
                  value={editableRateQuantity.rate}
                  onChange={(e) =>
                    setEditableRateQuantity({
                      ...editableRateQuantity,
                      rate: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Quantity in Tons:
                <input
                  type="number"
                  className="border p-2 w-full"
                  value={editableRateQuantity.quantity}
                  onChange={(e) =>
                    setEditableRateQuantity({
                      ...editableRateQuantity,
                      quantity: e.target.value,
                    })
                  }
                />
              </label>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleEdit}
              >
                Save
              </button>
            </div>
          </PopupBox>
        )}
        {selectedBid && (
          <ViewBid
            bidId={selectedBid._id}
            onClose={() => setSelectedBid(null)}
          />
        )}
      </div>
    </Suspense>
  );
};

export default BidList;
