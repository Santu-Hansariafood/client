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
  <div className="flex flex-col justify-between gap-4 md:flex-row md:flex-wrap md:items-center">
    <div className="flex flex-wrap items-center gap-3">
      <Buttons
        label="Back"
        icon={<FaArrowLeft size={12} />}
        variant="ghost"
        size="sm"
        onClick={onBack}
      />
      <div className="hidden h-6 w-px bg-[#ece4d2] md:block" />
      {editingPaymentId && (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-amber-800 shadow-sm">
          <FaExchangeAlt className="text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider">
            Edit Mode · Voucher #{voucherNumber || "-"}
          </span>
        </div>
      )}
      <div className="flex flex-wrap rounded-xl border border-[#ece4d2] bg-lux-cream p-1 shadow-sm">
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

    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-emerald-700 shadow-sm">
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
