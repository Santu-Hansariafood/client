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
    title: "Total Bids",
    countKey: "bids",
    icon: FaGavel,
    link: "/manage-bids/bid-list",
    color: "from-purple-500 to-pink-500",
  },
];

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {cardConfig.map((card, index) => (
          <div key={index} className="w-full">
            <CardItem card={card} count={counts[card.countKey]} />
          </div>
        ))}
      </div>
    </Suspense>
  );
};

export default CardGrid;
