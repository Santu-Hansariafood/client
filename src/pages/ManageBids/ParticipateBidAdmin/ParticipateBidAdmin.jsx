import { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading"
const Tables = lazy(() =>import("../../../common/Tables/Tables"));
const Pagination = lazy(() =>import("../../../common/Paginations/Paginations"));
const SearchBox = lazy(() =>import("../../../common/SearchBox/SearchBox"));

const ParticipateBidAdmin = () => {
  const [bids, setBids] = useState([]);
  const [participationBids, setParticipationBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bidsRes, participateRes] = await Promise.all([
          axios.get("http://88.222.215.234:5000/api/bids"),
          axios.get("http://88.222.215.234:5000/api/participatebids"),
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentParticipations = participateRes.data.filter(
          (pBid) => new Date(pBid.participationDate) >= sevenDaysAgo
        );

        setBids(bidsRes.data);
        setParticipationBids(recentParticipations);
        setFilteredBids(recentParticipations);
        setLoading(false);
      } catch (error) {
        toast.error("Error fetching data", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getBidParticipationDetails = (data) => {
    const groupedBids = {};

    data.forEach((pBid) => {
      const matchingBid = bids.find((bid) => bid._id === pBid.bidId);
      if (!matchingBid) return;

      if (!groupedBids[pBid.bidId]) {
        groupedBids[pBid.bidId] = {
          bidId: pBid.bidId,
          slNo: 0,
          group: matchingBid.group,
          consignee: matchingBid.consignee || "N/A",
          origin: matchingBid.origin || "N/A",
          commodity: matchingBid.commodity || "N/A",
          quantity: matchingBid.quantity || 0,
          rates: matchingBid.rate || 0,
          rate: pBid.rate || 0,
          quantities: pBid.quantity || 0,
          mobiles: new Set(),
        };
      }
      groupedBids[pBid.bidId].mobiles.add(pBid.mobile);
    });

    return Object.values(groupedBids);
  };

  const headers = [
    "Sl No",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Bid Quantity",
    "Bid Rate",
    "Party Quantity",
    "Party Rate",
    "Bid Interaction",
  ];

  const filteredData = getBidParticipationDetails(filteredBids);
  const totalItems = filteredData.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const rows = currentItems.map((bid, index) => [
    indexOfFirstItem + index + 1,
    bid.group,
    bid.consignee,
    bid.origin,
    bid.commodity,
    bid.quantity,
    bid.rates,
    bid.quantities,
    bid.rate,
    <button
      onClick={() => navigate(`/confirm-bids/${bid.bidId}`)}
      className="text-blue-500 underline hover:text-blue-700"
    >
      {bid.mobiles.size} interactions
    </button>,
  ]);

  const handleSearch = (searchText) => {
    if (!searchText) {
      setFilteredBids(participationBids);
    } else {
      const searchLower = searchText.toLowerCase();
      setFilteredBids(
        participationBids.filter((pBid) =>
          bids.some(
            (bid) =>
              bid._id === pBid.bidId &&
              bid.consignee?.toLowerCase().includes(searchLower)
          )
        )
      );
    }
    setCurrentPage(1);
  };

  return (
    <Suspense fallback={<Loading/>}>
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Participate Bid Admin</h2>
      <SearchBox
        placeholder="Search by Consignee..."
        items={[...new Set(bids.map((bid) => bid.consignee).filter(Boolean))]}
        onSearch={handleSearch}
      />
      {loading ? (
        <Loading/>
      ) : (
        <>
          <Tables headers={headers} rows={rows} />
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
    </Suspense>
  );
};

export default ParticipateBidAdmin;
