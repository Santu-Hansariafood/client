import { useEffect, useState, Suspense } from "react";
import { FaUsers, FaStore, FaTruck, FaGavel } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";

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

const DashboardCard = ({ title, value, icon: Icon, colorClass, subtitle }) => {
  return (
    <div className={`relative overflow-hidden group rounded-[2rem] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-white/20 bg-white shadow-xl shadow-slate-200/50`}>
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150 ${colorClass.split(' ')[0]}`}></div>
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              {value}
            </h3>
          </div>
          {subtitle && (
            <div className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{subtitle}</span>
            </div>
          )}
        </div>

        <div className={`p-4 rounded-2xl shadow-lg shadow-current/10 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${colorClass}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-2">
        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full w-2/3 rounded-full ${colorClass.split(' ')[0]}`}></div>
        </div>
        <span className="text-[10px] font-black text-slate-400">70%</span>
      </div>
    </div>
  );
};

const CardItem = ({ card, count }) => {
  const animatedCount = useCountUp(count);

  return (
    <DashboardCard
      title={card.title}
      value={animatedCount}
      icon={card.icon}
      colorClass={card.color}
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
    title: "Consignee",
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
