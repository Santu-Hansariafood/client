import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsers, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const InteractionsPopup = lazy(
  () => import("../InteractionsPopup/InteractionsPopup"),
);

const ParticipateBidAdmin = () => {
  const navigate = useNavigate();
  const { userRole, mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [participationBids, setParticipationBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [buyerGroup, setBuyerGroup] = useState(null);
  const [isBuyerAdmin, setIsBuyerAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bidsRes, participateRes, buyersRes, companiesRes] =
          await Promise.all([
            axios.get("/bids"),
            axios.get("/participatebids"),
            userRole === "Buyer"
              ? axios.get("/buyers")
              : Promise.resolve({ data: [] }),
            userRole === "Buyer"
              ? axios.get("/companies")
              : Promise.resolve({ data: [] }),
          ]);

        const bidsData = bidsRes.data?.data || bidsRes.data || [];
        const participations =
          participateRes.data?.data || participateRes.data || [];
        const buyers = buyersRes.data?.data || buyersRes.data || [];
        const companies = companiesRes.data?.data || companiesRes.data || [];

        if (userRole === "Buyer") {
          const buyer = buyers.find((b) =>
            b.mobile?.some((m) => String(m) === String(mobile)),
          );
          if (buyer) {
            setIsBuyerAdmin(buyer.isAdmin || false);
            const company = companies.find(
              (c) => String(c._id) === String(buyer.companyId),
            );
            if (company && company.group) {
              const formattedGroup = company.group
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(" ");
              setBuyerGroup(formattedGroup);
            }
          }
        }

        const allParticipations = participations.sort(
          (a, b) =>
            new Date(b.participationDate) - new Date(a.participationDate),
        );

        setBids(bidsData);
        setParticipationBids(allParticipations);
        setFilteredBids(allParticipations);
      } catch {
        toast.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userRole, mobile]);

  const getBidParticipationDetails = (data) => {
    const groupedBids = {};
    data.forEach((pBid) => {
      const matchingBid = bids.find((bid) => bid._id === pBid.bidId);
      if (!matchingBid) return;

      // Filter by buyer group if applicable
      if (userRole === "Buyer") {
        if (buyerGroup && matchingBid.group !== buyerGroup) {
          return;
        }
        // Additional filter for buyers: must be admin or the creator of the bid
        const isCreator =
          String(matchingBid.createdByMobile) === String(mobile);
        if (!isBuyerAdmin && !isCreator) {
          return;
        }
      }

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
          sellers: new Set(),
        };
      }
      groupedBids[pBid.bidId].mobiles.add(pBid.mobile);
      const sellerLabel =
        pBid.sellerName && pBid.sellerName.trim().length > 0
          ? pBid.sellerName
          : pBid.mobile;
      if (sellerLabel) groupedBids[pBid.bidId].sellers.add(sellerLabel);
    });
    return Object.values(groupedBids);
  };

  const headers = [
    "Sl No",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Sellers",
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
    Array.from(bid.sellers || []).join(", ") || "N/A",
    bid.quantity,
    bid.rates,
    bid.quantities,
    bid.rate,
    <button
      key={bid.bidId}
      type="button"
      onClick={() => setSelectedBidId(bid.bidId)}
      className="font-medium text-emerald-700 hover:text-emerald-800"
    >
      {bid.mobiles.size} interaction{bid.mobiles.size !== 1 ? "s" : ""}
    </button>,
  ]);

  const consigneeItems = useMemo(
    () =>
      [...new Set(bids.map((b) => b.consignee).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [bids],
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
        }),
      );
    }
    setCurrentPage(1);
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={userRole === "Buyer" ? "Participate bid list" : "Participate bid (admin)"}
        subtitle={userRole === "Buyer" ? "View your company's bid activity" : "Full history of participation activity"}
        icon={FaUsers}
        noContentCard
      >
        <div className="space-y-6">
          {userRole === "Buyer" && (
            <div className="flex justify-start">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <FaArrowLeft />
                Back
              </button>
            </div>
          )}
          {selectedBidId && (
            <InteractionsPopup
              bidId={selectedBidId}
              onClose={() => setSelectedBidId(null)}
            />
          )}
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
