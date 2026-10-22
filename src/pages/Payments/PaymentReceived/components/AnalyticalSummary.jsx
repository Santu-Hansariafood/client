import { FaChartBar, FaChartLine, FaArrowRight } from "react-icons/fa";

const AnalyticalSummary = ({ summaryType, setSummaryType, summary }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-[#ece4d2] bg-lux-ivory flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-lux-cream rounded-xl border border-[#ece4d2] flex items-center justify-center text-lux-emerald shadow-sm">
            <FaChartBar size={14} />
          </div>
          <div>
            <h4 className="font-serif font-semibold text-lux-ink">Analytical Summary</h4>
            <p className="lux-eyebrow">
              Periodic collection trends
            </p>
          </div>
        </div>

        <div className="flex bg-lux-cream border border-[#ece4d2] p-1 rounded-xl shadow-sm">
          {["month", "week"].map((type) => (
            <button
              key={type}
              onClick={() => setSummaryType(type)}
              className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                summaryType === type
                  ? "bg-lux-emerald text-lux-gold-soft shadow-md"
                  : "text-lux-muted hover:text-lux-ink"
              }`}
            >
              {type}ly
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {summary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {summary.map((item, idx) => {
              const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              const periodLabel =
                summaryType === "month"
                  ? monthNames[item._id.period - 1]
                  : `Week ${item._id.period}`;
              const netBalance = (item.received || 0) - (item.sent || 0);

              return (
                <div
                  key={idx}
                  className="lux-card lux-card-hover group relative overflow-hidden flex flex-col h-full p-6 sm:p-8"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-lux-ivory rounded-full -mr-20 -mt-20 group-hover:bg-lux-night transition-colors duration-500"></div>

                  <div className="relative z-10 flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="lux-eyebrow mb-1">
                          {item._id.year}
                        </span>
                        <h4 className="font-serif text-2xl font-semibold text-lux-ink group-hover:text-lux-gold-soft transition-colors">
                          {periodLabel}
                        </h4>
                      </div>
                      <div className="w-14 h-14 bg-lux-ivory rounded-2xl flex items-center justify-center text-lux-gold group-hover:bg-white/10 group-hover:text-lux-gold-soft transition-all duration-500 shadow-sm">
                        <FaChartLine size={24} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                          <span>Payment Received</span>
                          <span className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            {item.receivedCount || 0} Entries
                          </span>
                        </div>
                        <p className="font-serif text-2xl font-semibold text-lux-ink tabular-nums tracking-tight group-hover:text-lux-cream transition-colors">
                          Rs. {(item.received || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">
                          <span>Payment Sent</span>
                          <span className="bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                            {item.sentCount || 0} Entries
                          </span>
                        </div>
                        <p className="font-serif text-2xl font-semibold text-lux-ink tabular-nums tracking-tight group-hover:text-lux-cream transition-colors">
                          Rs. {(item.sent || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#ece4d2] group-hover:border-white/10 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="lux-eyebrow mb-1 group-hover:text-white/60">
                          Net Balance
                        </p>
                        <p
                          className={`font-serif text-xl font-semibold tabular-nums ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"} group-hover:text-lux-gold-soft transition-colors`}
                        >
                          {netBalance >= 0 ? "+" : ""}Rs.{" "}
                          {netBalance.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-lux-ivory flex items-center justify-center text-lux-gold group-hover:bg-white/10 group-hover:text-lux-gold-soft transition-all">
                        <FaArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-lux-ivory rounded-full flex items-center justify-center text-lux-gold mb-6 border border-[#ece4d2]">
              <FaChartBar size={32} />
            </div>
            <h4 className="font-serif text-lg font-semibold text-lux-ink">
              No Summary Data
            </h4>
            <p className="text-sm text-lux-muted font-medium max-w-xs mx-auto mt-2">
              Analytical data will appear here once you select a ledger and
              record transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticalSummary;
