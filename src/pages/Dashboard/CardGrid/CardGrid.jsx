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

const DashboardCard = ({ title, value, icon: Icon, colorClass, shadowColor, subtitle }) => {
  return (
    <div className={`relative overflow-hidden group rounded-[3rem] p-8 transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-white/50 bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl shadow-2xl shadow-slate-200/40`}>
      {/* Glossy Overlay Reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
      
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      {/* Primary Gradient Glow */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-[80px] opacity-10 transition-all duration-1000 group-hover:opacity-30 group-hover:scale-125 bg-gradient-to-br ${colorClass}`}></div>
      
      {/* Secondary Glow for Depth */}
      <div className={`absolute -left-16 -bottom-16 w-48 h-48 rounded-full blur-[60px] opacity-5 transition-all duration-1000 group-hover:opacity-20 bg-gradient-to-tr ${colorClass}`}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorClass}`}></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-tight transition-colors duration-500 group-hover:text-slate-600">{title}</p>
            </div>
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none flex items-baseline gap-1">
              {value}
              <span className="text-lg font-bold text-slate-300 group-hover:text-slate-400 transition-colors">+</span>
            </h3>
          </div>

          <div className={`relative p-5 rounded-[2rem] shadow-2xl transform transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110 group-hover:shadow-current/30`}>
            {/* Icon Background Layer */}
            <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${colorClass} opacity-90`}></div>
            <div className="absolute inset-0 rounded-[2rem] bg-white/20 backdrop-blur-sm border border-white/30"></div>
            <Icon size={28} className="relative z-10 text-white drop-shadow-md" />
          </div>
        </div>

        {subtitle && (
          <div className="inline-flex items-center w-fit px-4 py-2 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-md shadow-sm">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{subtitle}</span>
          </div>
        )}
        
        <div className="mt-auto pt-8 border-t border-slate-100/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">+12.5%</span>
          </div>
          <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden backdrop-blur-sm p-[2px]">
            <div className={`h-full w-[75%] rounded-full transition-all duration-1000 group-hover:w-[90%] bg-gradient-to-r ${colorClass} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
            </div>
          </div>
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
      shadowColor={card.shadowColor}
    />
  );
};

const cardConfig = [
  {
    title: "Total Buyers",
    countKey: "buyers",
    icon: FaUsers,
    link: "/buyer/list",
    color: "from-blue-600 to-cyan-500",
    shadowColor: "shadow-blue-500/20",
  },
  {
    title: "Total Sellers",
    countKey: "sellers",
    icon: FaStore,
    link: "/seller-details/list",
    color: "from-emerald-600 to-teal-400",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    title: "Total Consignee",
    countKey: "consignees",
    icon: FaTruck,
    link: "/consignee/list",
    color: "from-amber-600 to-orange-400",
    shadowColor: "shadow-amber-500/20",
  },
  {
    title: "Today's Bids",
    countKey: "bids",
    icon: FaGavel,
    link: "/manage-bids/bid-list",
    color: "from-fuchsia-600 to-pink-500",
    shadowColor: "shadow-fuchsia-500/20",
  },
];

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              System Overview
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Live intelligence across your distribution network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Last Sync: Just Now
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {cardConfig.map((card, index) => (
            <div key={index} className="w-full">
              <CardItem card={card} count={counts[card.countKey]} />
            </div>
          ))}
        </div>
      </div>
    </Suspense>
  );
};

export default CardGrid;
