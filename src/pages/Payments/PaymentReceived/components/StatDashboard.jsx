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
  dayTotal = 0,
  formData,
  ledgerBalance,
  entryStats,
  companyPair,
  fullCompanyMapping,
  ledgerTopSummary,
  allocationSource = "fresh",
}) => {
  if (!formData || !companyPair) return null;
  const accountLabel = selectedCompanyOption?.label || selectedLedger?.label;
  const isAdvance = allocationSource === "advance";
  const {
    creditEntryTotal = 0,
    debitToSeller = 0,
    creditBalanceRemaining = 0,
  } = ledgerTopSummary || {};

  const extraAmount = Math.max(0, dayTotal - dateTotal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FaWallet size={18} />}
        label={
          fullCompanyMapping && companyPair?.buyerCompany && companyPair?.supplierCompany
            ? "Pair Received Today"
            : accountLabel
              ? `${accountLabel} Received`
              : "Total Received Today"
        }
        value={`Rs. ${dateTotal.toLocaleString("en-IN")}`}
        subValue={
          extraAmount > 0
            ? `+ Rs. ${extraAmount.toLocaleString("en-IN")} extra today`
            : "Total for selected"
        }
        color="bg-emerald-50"
        iconColor="text-emerald-600"
      />

      <StatCard
        icon={<FaExclamationCircle size={18} />}
        label={formData.ledgerType === "Seller" ? "Seller Due" : "Buyer Due (Dr.)"}
        value={`Rs. ${(ledgerBalance.outstandingBalance ?? 0).toLocaleString("en-IN")}`}
        subValue={
          companyPair?.buyerCompany
            ? "Outstanding balance"
            : "Select companies"
        }
        color="bg-rose-50"
        iconColor="text-rose-600"
      />

      <StatCard
        icon={<FaMoneyBillWave size={18} />}
        label={isAdvance ? "From Advance (Cr.)" : "Payment Entry (Cr.)"}
        value={`Rs. ${creditEntryTotal.toLocaleString("en-IN")}`}
        subValue={
          isAdvance
            ? "Available credit"
            : "Current receipt amount"
        }
        color="bg-emerald-50"
        iconColor="text-emerald-600"
      />

      <StatCard
        icon={<FaTruck size={18} />}
        label="Lorry Allocation (Dr.)"
        value={`Rs. ${debitToSeller.toLocaleString("en-IN")}`}
        subValue={
          isAdvance
            ? `Cr. left Rs. ${creditBalanceRemaining.toLocaleString("en-IN")}`
            : `Unallocated Rs. ${creditBalanceRemaining.toLocaleString("en-IN")}`
        }
        color="bg-rose-50"
        iconColor="text-rose-600"
      />
    </div>
  );
};

export default StatDashboard;
