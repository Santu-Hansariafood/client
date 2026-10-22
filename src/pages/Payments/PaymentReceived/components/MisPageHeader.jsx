import { FaBookOpen, FaChartBar } from "react-icons/fa";

const MisPageHeader = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: "vouchers",
      label: "Voucher register",
      icon: <FaBookOpen size={12} />,
    },
    { id: "sauda", label: "Sauda analysis", icon: <FaChartBar size={12} /> },
  ];

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald p-5 sm:p-7 shadow-xl shadow-lux-emerald/15">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-lux-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute top-4 right-6 sm:top-6 sm:right-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lux-gold animate-pulse shadow-[0_0_0_4px_rgba(201,162,39,0.2)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lux-gold-soft/90">
            Live
          </span>
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-lux-gold/30 rounded-2xl blur-md" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-lux-gold to-lux-gold-soft flex items-center justify-center shadow-lg border-2 border-white/20">
                <FaBookOpen className="text-lux-deep" size={26} />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lux-gold" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-lux-gold-soft">
                  Accounts · Payment Ledger MIS
                </p>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-lux-cream tracking-tight leading-tight">
                Hansaria Ledger Book
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-lux-gold-soft/80 font-medium max-w-xl leading-relaxed">
                Company-to-company Tally ledger, voucher register &amp; sauda
                drill-down with full payment mapping
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <div className="relative inline-flex w-full lg:w-auto p-1.5 rounded-2xl bg-black/15 border border-white/10 backdrop-blur-sm shadow-inner">
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-b from-lux-cream to-lux-ivory shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out ${
                  activeTab === "vouchers"
                    ? "left-1.5 right-1/2 mr-0.5"
                    : "left-1/2 ml-0.5 right-1.5"
                }`}
              />
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative z-10 flex-1 min-w-[140px] lg:min-w-[160px] px-3 sm:px-5 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 inline-flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "text-lux-emerald"
                      : "text-lux-gold-soft/80 hover:text-lux-cream"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisPageHeader;
