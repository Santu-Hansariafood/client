import Buttons from "../../../../common/Buttons/Buttons";
import {
  FaArrowLeft,
  FaChartBar,
  FaExchangeAlt,
  FaHistory,
  FaMoneyBillWave,
  FaRegCalendarAlt,
} from "react-icons/fa";
import TabButton from "./TabButton";

const PaymentFormNavigation = ({
  editingPaymentId,
  voucherNumber,
  activeTab,
  onBack,
  onTabChange,
  date,
}) => (
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div className="flex items-center gap-3">
      <Buttons
        label="Back"
        icon={<FaArrowLeft size={12} />}
        variant="ghost"
        size="sm"
        onClick={onBack}
      />
      <div className="hidden h-6 w-px bg-slate-200 md:block" />
      {editingPaymentId && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 shadow-sm">
          <FaExchangeAlt className="text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider">
            Edit Mode · Voucher #{voucherNumber || "-"}
          </span>
        </div>
      )}
      <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton
          active={activeTab === "payment_list"}
          label="Payment List"
          icon={FaMoneyBillWave}
          onClick={() => onTabChange("payment_list")}
        />
        <TabButton
          active={activeTab === "allocation"}
          label="Allocation"
          icon={FaExchangeAlt}
          onClick={() => onTabChange("allocation")}
        />
        <TabButton
          active={activeTab === "history"}
          label="History"
          icon={FaHistory}
          onClick={() => onTabChange("history")}
        />
        <TabButton
          active={activeTab === "summary"}
          label="Summary"
          icon={FaChartBar}
          onClick={() => onTabChange("summary")}
        />
      </div>
    </div>

    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-sm">
      <FaRegCalendarAlt className="text-emerald-500" />
      <span className="text-sm font-bold tracking-tight">
        {new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    </div>
  </div>
);

export default PaymentFormNavigation;
