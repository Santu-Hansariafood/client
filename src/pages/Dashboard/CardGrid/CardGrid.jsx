import { lazy, Suspense } from "react";
import { FaUsers, FaStore, FaTruck } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
const Cards = lazy(() => import("../../../common/Cards/Cards"));

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-blue-100 hover:scale-[1.02] transition-all duration-300">
            <Cards
              title="Total Buyers"
              count={counts.buyers}
              icon={FaUsers}
              link="/buyer/list"
            />
          </div>
        </div>
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-emerald-100 hover:scale-[1.02] transition-all duration-300">
            <Cards
              title="Total Sellers"
              count={counts.sellers}
              icon={FaStore}
              link="/seller-details/list"
            />
          </div>
        </div>
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-xl border border-amber-100 hover:scale-[1.02] transition-all duration-300">
            <Cards
              title="Total Consignees"
              count={counts.consignees}
              icon={FaTruck}
              link="/consignee/list"
            />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default CardGrid;
