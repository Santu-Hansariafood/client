import React from "react";
import {
  FaWallet,
  FaExclamationCircle,
  FaArrowDown,
  FaArrowUp,
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
}) => {
  const accountLabel = selectedCompanyOption?.label || selectedLedger?.label;
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
          accountLabel
            ? `${accountLabel} ${formData.ledgerType === "Seller" ? "Sent" : "Received"}`
            : `Total ${formData.ledgerType === "Seller" ? "Sent" : formData.ledgerType === "Buyer" ? "Received" : "Payments"}`
        }
        value={`Rs. ${dateTotal.toLocaleString("en-IN")}`}
        subValue={new Date(formData.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })}
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
        icon={<FaArrowDown size={18} />}
        label="Debit balance (Advance) · Dr."
        value={`Rs. ${debitEntryTotal.toLocaleString("en-IN")}`}
        subValue={
          fullCompanyMapping
            ? `From ${companyPair.buyerCompany} (entry total)`
            : companyPair?.buyerCompany
              ? `From ${companyPair.buyerCompany}`
              : "Buyer entry total"
        }
        color="bg-rose-50"
        iconColor="text-rose-600"
      />

      <StatCard
        icon={<FaArrowUp size={18} />}
        label="Credit · Cr. (seller)"
        value={`Rs. ${creditToSeller.toLocaleString("en-IN")}`}
        subValue={`Balance Dr.−Cr. Rs. ${debitBalanceRemaining.toLocaleString("en-IN")} · ${entryStats.pendingCount} pending`}
        color="bg-emerald-50"
        iconColor="text-emerald-600"
      />
    </div>
  );
};

export default StatDashboard;
