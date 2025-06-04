import { lazy, Suspense } from "react";
import { FaUsers, FaStore, FaTruck } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
const Cards = lazy(() => import("../../../common/Cards/Cards"));

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        <div className="rounded-2xl shadow-xl bg-white/60 backdrop-blur-md border border-blue-200 hover:scale-105 transition-transform">
          <Cards
            title="Total Buyers"
            count={counts.buyers}
            icon={FaUsers}
            link="/buyer/list"
          />
        </div>
        <div className="rounded-2xl shadow-xl bg-white/60 backdrop-blur-md border border-purple-200 hover:scale-105 transition-transform">
          <Cards
            title="Total Sellers"
            count={counts.sellers}
            icon={FaStore}
            link="/seller-details/list"
          />
        </div>
        <div className="rounded-2xl shadow-xl bg-white/60 backdrop-blur-md border border-pink-200 hover:scale-105 transition-transform">
          <Cards
            title="Total Consignees"
            count={counts.consignees}
            icon={FaTruck}
            link="/consignee/list"
          />
        </div>
      </div>
    </Suspense>
  );
};

export default CardGrid;
