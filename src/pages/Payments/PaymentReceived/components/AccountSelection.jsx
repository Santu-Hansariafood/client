import React from 'react';
import { FaBuilding, FaMoneyBillWave, FaExchangeAlt, FaSave } from 'react-icons/fa';
import DataDropdown from '../../../../common/DataDropdown/DataDropdown';
import Buttons from '../../../../common/Buttons/Buttons';

const AccountSelection = ({ 
    allocationSource, 
    setAllocationSource, 
    formData, 
    setFormData,
    handleInputChange, 
    ledgerTypes, 
    ledgers, 
    selectedLedger, 
    handleLedgerChange, 
    fetchingLedgers, 
    allCompanies, 
    handleCompanyChange, 
    paymentModes, 
    loading, 
    handleRecordAdvance 
}) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <FaBuilding size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Account Selection</h3>
                        <p className="text-xs text-slate-500 font-medium">Configure ledger and entry details</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[
                        { 
                            id: 'fresh', 
                            label: formData.ledgerType === 'Buyer' ? 'Payment Received' : 'Payment Sent', 
                            icon: <FaMoneyBillWave size={12} /> 
                        },
                        { id: 'advance', label: 'From Advance', icon: <FaExchangeAlt size={12} /> }
                    ].map(source => (
                        <button
                            key={source.id}
                            onClick={() => setAllocationSource(source.id)}
                            className={`flex items-center gap-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                allocationSource === source.id 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {source.icon}
                            {source.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Entry Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Ledger Type</label>
                        <DataDropdown
                            options={ledgerTypes}
                            selectedOptions={formData.ledgerType}
                            onChange={(opt) => setFormData(prev => ({ ...prev, ledgerType: opt.value }))}
                            isMulti={false}
                            className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Name</label>
                        <DataDropdown
                            options={ledgers}
                            selectedOptions={selectedLedger}
                            onChange={handleLedgerChange}
                            placeholder={fetchingLedgers ? "Syncing..." : `Select ${formData.ledgerType}`}
                            isMulti={false}
                            isDisabled={fetchingLedgers}
                            className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Company (Filter)</label>
                        <DataDropdown
                            options={selectedLedger?.companies?.map(c => {
                                const companyId = typeof c === 'string' ? c : (c._id || c.value || c.id);
                                let label = 'Unknown';
                                if (formData.ledgerType === 'Buyer') {
                                    const companyInfo = allCompanies.find(comp => comp._id === companyId);
                                    label = companyInfo?.companyName || (typeof c === 'object' ? (c.companyName || c.label) : companyId);
                                } else {
                                    label = companyId;
                                }
                                return { value: companyId, label };
                            }) || []}
                            selectedOptions={formData.companyId ? {
                                value: formData.companyId,
                                label: formData.ledgerType === 'Buyer' 
                                    ? (allCompanies.find(comp => comp._id === formData.companyId)?.companyName || 'Unknown')
                                    : formData.companyId
                            } : null}
                            onChange={handleCompanyChange}
                            placeholder="Select Company"
                            isMulti={false}
                            isDisabled={!selectedLedger}
                            className="rounded-xl border-slate-200 hover:border-slate-300 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            {formData.ledgerType === 'Buyer' ? 'Payment Amount' : 'Sent Amount'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount === 0 ? '' : formData.amount}
                                onChange={handleInputChange}
                                onWheel={(e) => e.target.blur()}
                                placeholder="0.00"
                                className="w-full h-[42px] pl-8 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Mode</label>
                        <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleInputChange}
                            className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                        >
                            {paymentModes.map(mode => (
                                <option key={mode.value} value={mode.value}>{mode.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Narration</label>
                        <input
                            type="text"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleInputChange}
                            placeholder="Enter narration for this entry..."
                            className="w-full h-[42px] px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>
                    <div className="flex items-end">
                        <Buttons
                            label={formData.ledgerType === 'Buyer' ? `Record Advance (₹${formData.amount})` : `Send Payment (₹${formData.amount})`}
                            onClick={handleRecordAdvance}
                            disabled={loading || !selectedLedger || formData.amount <= 0 || allocationSource !== 'fresh'}
                            variant="primary"
                            className="w-full h-[42px] rounded-xl shadow-lg shadow-emerald-600/20"
                            icon={<FaSave />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSelection;
