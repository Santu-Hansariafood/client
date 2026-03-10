import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsers } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));

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
          axios.get("/bids"),
          axios.get("/participatebids"),
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentParticipations = participateRes.data.filter(
          (pBid) => new Date(pBid.participationDate) >= sevenDaysAgo
        );

        setBids(bidsRes.data);
        setParticipationBids(recentParticipations);
        setFilteredBids(recentParticipations);
      } catch {
        toast.error("Error fetching data");
      } finally {
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
    "Bid Qty",
    "Bid Rate",
    "Party Qty",
    "Party Rate",
    "Interactions",
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
      key={bid.bidId}
      type="button"
      onClick={() => navigate(`/confirm-bids/${bid.bidId}`)}
      className="font-medium text-emerald-700 hover:text-emerald-800"
    >
      {bid.mobiles.size} interaction{bid.mobiles.size !== 1 ? "s" : ""}
    </button>,
  ]);

  const consigneeItems = useMemo(
    () => [...new Set(bids.map((b) => b.consignee).filter(Boolean))],
    [bids]
  );

  const handleSearch = (filteredNames) => {
    if (!filteredNames || filteredNames.length === 0) {
      setFilteredBids(participationBids);
    } else if (filteredNames.length === consigneeItems.length) {
      setFilteredBids(participationBids);
    } else {
      const nameSet = new Set(filteredNames);
      setFilteredBids(
        participationBids.filter((pBid) => {
          const bid = bids.find((b) => b._id === pBid.bidId);
          return bid && nameSet.has(bid.consignee);
        })
      );
    }
    setCurrentPage(1);
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Participate bid (admin)"
        subtitle="Recent participation activity — last 7 days"
        icon={FaUsers}
        noContentCard
      >
        <div className="space-y-6">
          <SearchBox
            placeholder="Search by consignee..."
            items={consigneeItems}
            onSearch={handleSearch}
          />
          {loading ? (
            <Loading />
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg shadow-emerald-900/5 overflow-hidden">
                <Tables headers={headers} rows={rows} />
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ParticipateBidAdmin;
