import React from 'react';
import { FaHistory } from 'react-icons/fa';
import Loading from '../../../../common/Loading/Loading';
import Tables from '../../../../common/Tables/Tables';

const PaymentHistory = ({ fetchingHistory, formData, history, historyColumns }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                        <FaHistory size={14} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">Payment History</h4>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                            Records for {new Date(formData.date).toLocaleDateString('en-GB')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {fetchingHistory ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <Loading size="lg" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Loading History...</p>
                    </div>
                ) : history.length > 0 ? (
                    <Tables
                        headers={historyColumns.map(c => c.header)}
                        rows={history.map(row => historyColumns.map(col => {
                            if (typeof col.accessor === 'function') {
                                return col.accessor(row);
                            }
                            return row[col.accessor];
                        }))}
                    />
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                            <FaHistory size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">No Previous Payments</h4>
                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                            No payments were recorded for this ledger on the selected date.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
