import React from "react";
import {
  FaWallet,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaTruck,
} from "react-icons/fa";
import StatCard from "./StatCard";

const StatDashboard = ({
  selectedLedger,
  selectedCompanyOption,
  dateTotal,
  formData,
  ledgerBalance,
  entryStats,
  companyPair,
  fullCompanyMapping,
  ledgerTopSummary,
  allocationSource = "fresh",
}) => {
  const accountLabel = selectedCompanyOption?.label || selectedLedger?.label;
  const isAdvance = allocationSource === "advance";
  const {
    debitEntryTotal = 0,
    creditToSeller = 0,
    debitBalanceRemaining = 0,
  } = ledgerTopSummary || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FaWallet size={18} />}
        label={
          fullCompanyMapping && companyPair?.buyerCompany && companyPair?.supplierCompany
            ? "credited balance"
            : accountLabel
              ? `${accountLabel} ${formData.ledgerType === "Seller" ? "Sent" : "Received"}`
              : `Total ${formData.ledgerType === "Seller" ? "Sent" : formData.ledgerType === "Buyer" ? "Received" : "Payments"}`
        }
        value={`Rs. ${dateTotal.toLocaleString("en-IN")}`}
        subValue={
          fullCompanyMapping && companyPair?.buyerCompany && companyPair?.supplierCompany
            ? `from ${companyPair.buyerCompany}`
            : new Date(formData.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
        }
        color="bg-emerald-50"
        iconColor="text-emerald-600"
      />

      <StatCard
        icon={<FaExclamationCircle size={18} />}
        label={formData.ledgerType === "Seller" ? "Seller Due" : "Buyer Due"}
        value={`Rs. ${(ledgerBalance.outstandingBalance ?? 0).toLocaleString("en-IN")}`}
        subValue={
          companyPair?.buyerCompany
            ? "Outstanding · company scope"
            : "Select companies"
        }
        color="bg-rose-50"
        iconColor="text-rose-600"
      />

      <StatCard
        icon={<FaMoneyBillWave size={18} />}
        label={isAdvance ? "Advance (Dr.)" : "credited balance"}
        value={`Rs. ${debitEntryTotal.toLocaleString("en-IN")}`}
        subValue={
          isAdvance
            ? fullCompanyMapping
              ? `Buyer advance · ${companyPair.buyerCompany}`
              : "On account from buyer"
            : "Current entry amount"
        }
        color={isAdvance ? "bg-rose-50" : "bg-emerald-50"}
        iconColor={isAdvance ? "text-rose-600" : "text-emerald-600"}
      />

      <StatCard
        icon={<FaTruck size={18} />}
        label="Adjusted lorry-wise"
        value={`Rs. ${creditToSeller.toLocaleString("en-IN")}`}
        subValue={
          isAdvance
            ? `Dr. left Rs. ${debitBalanceRemaining.toLocaleString("en-IN")} · ${entryStats.pendingCount} pending`
            : `Unallocated Rs. ${debitBalanceRemaining.toLocaleString("en-IN")} · ${entryStats.pendingCount} lorries`
        }
        color="bg-amber-50"
        iconColor="text-amber-600"
      />
    </div>
  );
};

export default StatDashboard;
