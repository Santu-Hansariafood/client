import React from 'react';
import { FaWallet, FaExclamationCircle, FaHistory, FaChartLine } from 'react-icons/fa';
import StatCard from './StatCard';

const StatDashboard = ({
    selectedLedger,
    selectedCompanyOption,
    dateTotal,
    formData,
    ledgerBalance,
    entryStats,
    companyPair,
    fullCompanyMapping,
}) => {
    const accountLabel = selectedCompanyOption?.label || selectedLedger?.label;
    const companyScopeLabel = fullCompanyMapping
        ? `${companyPair.buyerCompany} → ${companyPair.supplierCompany}`
        : companyPair?.buyerCompany
          ? `${companyPair.buyerCompany} (select seller for pair)`
          : "Select buyer company";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={<FaWallet size={18} />}
                label={accountLabel
                    ? `${accountLabel} ${formData.ledgerType === 'Seller' ? 'Sent' : 'Received'}`
                    : `Total ${formData.ledgerType === 'Seller' ? 'Sent' : formData.ledgerType === 'Buyer' ? 'Received' : 'Payments'}`
                }
                value={`Rs. ${dateTotal.toLocaleString('en-IN')}`}
                subValue={new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                color="bg-emerald-50"
                iconColor="text-emerald-600"
            />
            
            <StatCard
                icon={<FaExclamationCircle size={18} />}
                label={formData.ledgerType === 'Seller' ? 'Seller Due' : 'Buyer Due'}
                value={`Rs. ${ledgerBalance.outstandingBalance.toLocaleString('en-IN')}`}
                subValue={companyPair?.buyerCompany ? "Outstanding · company scope" : "Select companies"}
                color="bg-rose-50"
                iconColor="text-rose-600"
            />

            <StatCard
                icon={<FaHistory size={18} />}
                label="Debit Balance (Advance)"
                value={`Rs. ${(ledgerBalance.totalAdvanceBalance ?? ledgerBalance.advanceBalance ?? 0).toLocaleString('en-IN')}`}
                subValue={
                    fullCompanyMapping
                        ? `All: Rs. ${(ledgerBalance.totalAdvanceBalance ?? 0).toLocaleString('en-IN')} · Pair: Rs. ${(ledgerBalance.advanceBalance ?? 0).toLocaleString('en-IN')}`
                        : companyPair?.buyerCompany
                          ? `${ledgerBalance.creditByPair?.length || 0} company mapping(s)`
                          : "Select buyer company"
                }
                color="bg-blue-50"
                iconColor="text-blue-600"
            />

            <StatCard
                icon={<FaChartLine size={18} />}
                label="Pending Records"
                value={entryStats.pendingCount.toString()}
                subValue="Unsettled Saudas"
                color="bg-amber-50"
                iconColor="text-amber-600"
            />
        </div>
    );
};

export default StatDashboard;
