import React from 'react';
import { FaWallet, FaExclamationCircle, FaHistory, FaChartLine } from 'react-icons/fa';
import StatCard from './StatCard';

const StatDashboard = ({ selectedLedger, dateTotal, formData, ledgerBalance, entryStats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={<FaWallet size={18} />}
                label={selectedLedger 
                    ? `${selectedLedger.label} ${formData.ledgerType === 'Buyer' ? 'Received' : 'Sent'}` 
                    : `Total ${formData.ledgerType === 'Buyer' ? 'Received' : 'Sent'}`
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
                subValue="Total Outstanding"
                color="bg-rose-50"
                iconColor="text-rose-600"
            />

            <StatCard
                icon={<FaHistory size={18} />}
                label="Advance Balance"
                value={`Rs. ${ledgerBalance.advanceBalance.toLocaleString('en-IN')}`}
                subValue="Available Credit"
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
