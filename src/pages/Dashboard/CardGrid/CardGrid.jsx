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

const DashboardCard = ({ title, value, icon: Icon, accent, iconClass, ring, subtitle }) => {
  return (
    <div className="lux-card lux-card-hover lux-gold-top lux-sheen group relative overflow-hidden p-6 sm:p-7">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="lux-eyebrow">{title}</p>
          <h3 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-tight text-lux-ink tabular-nums sm:text-5xl">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} ${iconClass} shadow-lg ${ring} transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3`}
        >
          <Icon size={20} aria-hidden />
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-3">
        <div className="lux-rule flex-1" />
        {subtitle ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-lux-muted">
            {subtitle}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lux-emerald shadow-[0_0_6px_rgba(6,95,70,0.5)]" />
        )}
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
      accent={card.accent}
      iconClass={card.iconClass}
      ring={card.ring}
    />
  );
};

const cardConfig = [
  {
    title: "Total Buyers",
    countKey: "buyers",
    icon: FaUsers,
    link: "/buyer/list",
    accent: "from-lux-emerald to-[#0f8a6c]",
    iconClass: "text-white",
    ring: "shadow-lux-emerald/25",
  },
  {
    title: "Total Sellers",
    countKey: "sellers",
    icon: FaStore,
    link: "/seller-details/list",
    accent: "from-[#0d7a68] to-[#12a594]",
    iconClass: "text-white",
    ring: "shadow-[#0d7a68]/25",
  },
  {
    title: "Total Consignee",
    countKey: "consignees",
    icon: FaTruck,
    link: "/consignee/list",
    accent: "from-lux-gold to-lux-gold-soft",
    iconClass: "text-lux-night",
    ring: "shadow-lux-gold/30",
  },
  {
    title: "Today's Bids",
    countKey: "bids",
    icon: FaGavel,
    link: "/manage-bids/bid-list",
    accent: "from-lux-night to-lux-deep",
    iconClass: "text-lux-gold-soft",
    ring: "shadow-lux-deep/30",
  },
];

const CardGrid = ({ counts }) => {
  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="lux-eyebrow mb-1.5">Portfolio Snapshot</p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl">
              System Overview
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#e6dcc4] bg-lux-cream px-4 py-2 shadow-sm sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-lux-emerald animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
              Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {cardConfig.map((card) => (
            <CardItem key={card.title} card={card} count={counts[card.countKey]} />
          ))}
        </div>
      </div>
    </Suspense>
  );
};

export default CardGrid;
