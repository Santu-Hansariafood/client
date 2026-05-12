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
    <div className={`relative overflow-hidden group rounded-[2.5rem] p-7 transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/40`}>
      {/* Dynamic Gradient Background Glow */}
      <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-[60px] opacity-20 transition-all duration-1000 group-hover:opacity-40 group-hover:scale-150 bg-gradient-to-br ${colorClass}`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1.5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] leading-tight">{title}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              {value}
            </h3>
          </div>

          <div className={`p-4.5 rounded-[1.5rem] shadow-2xl shadow-current/20 transform transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 bg-gradient-to-br ${colorClass} text-white`}>
            <Icon size={24} />
          </div>
        </div>

        {subtitle && (
          <div className="inline-flex items-center w-fit px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100/50 backdrop-blur-sm">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{subtitle}</span>
          </div>
        )}
        
        <div className="mt-auto pt-6 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-slate-100/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div className={`h-full w-[65%] rounded-full animate-pulse bg-gradient-to-r ${colorClass}`}></div>
          </div>
          <span className="text-[10px] font-black text-slate-400 tracking-tighter">Growth: +12%</span>
        </div>
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
    title: "Total Consignee",
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
