import { useEffect, useState, lazy, Suspense } from "react";
import { FaUsers, FaStore, FaTruck, FaGavel } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";

const Cards = lazy(() => import("../../../common/Cards/Cards"));

const useCountUp = (end, duration = 800) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setValue(end);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return value;
};

const CardItem = ({ card, count }) => {
  const animatedCount = useCountUp(count);

  return (
    <Cards
      title={card.title}
      count={animatedCount}
      icon={card.icon}
      link={card.link}
      color={card.color}
    />
  );
};

const cardConfig = [
  {
    title: "Total Buyers",
    countKey: "buyers",
    icon: FaUsers,
    link: "/buyer/list",
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Total Sellers",
    countKey: "sellers",
    icon: FaStore,
    link: "/seller-details/list",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Total Consignees",
    countKey: "consignees",
    icon: FaTruck,
    link: "/consignee/list",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Today's Bids",
    countKey: "bids",
    icon: FaGavel,
    link: "/manage-bids/bid-list",
    color: "from-purple-500 to-pink-500",
  },
];

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              System Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quick totals across buyers, sellers, consignees and bids.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              Updated Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {cardConfig.map((card, index) => (
            <div key={index} className="w-full">
              <div className="transition-transform duration-300 hover:translate-y-[-2px] focus-within:translate-y-[-2px]">
                <CardItem card={card} count={counts[card.countKey]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Suspense>
  );
};

export default CardGrid;
