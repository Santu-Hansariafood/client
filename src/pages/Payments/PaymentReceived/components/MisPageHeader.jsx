const MisPageHeader = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "vouchers", label: "Voucher register" },
    { id: "sauda", label: "Sauda analysis" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-[10px] font-black text-[#1e3a5f] uppercase tracking-[0.25em] mb-1">
          Accounts · MIS
        </p>
        <p className="text-sm text-slate-500 font-medium max-w-xl">
          Company-to-company Tally ledger, voucher register, and sauda drill-down
        </p>
      </div>
      <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#1e3a5f] shadow-md ring-1 ring-slate-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MisPageHeader;
