import React, { useState, useEffect, useCallback } from 'react';
import { FaFilter, FaSearch, FaFileInvoice, FaArrowRight, FaCalendarAlt, FaBuilding, FaUserTie, FaBox, FaChartBar, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../../../utils/apiClient/apiClient';
import DataDropdown from '../../../../common/DataDropdown/DataDropdown';
import Buttons from '../../../../common/Buttons/Buttons';
import Loading from '../../../../common/Loading/Loading';
import SaudaDetailPopup from './SaudaDetailPopup';

const SaudaMISSection = () => {
    const [loading, setLoading] = useState(false);
    const [fetchingCompanies, setFetchingCompanies] = useState(false);
    const [allCompanies, setAllCompanies] = useState([]);
    const [saudas, setSaudas] = useState([]);
    const [selectedSauda, setSelectedSauda] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const [filters, setFilters] = useState({
        buyerCompany: '',
        supplierCompany: '',
        saudaNo: ''
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setFetchingCompanies(true);
                const response = await api.get('/companies');
                setAllCompanies(response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setFetchingCompanies(false);
            }
        };
        fetchCompanies();
    }, []);

    const fetchSaudas = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                buyerCompany: filters.buyerCompany,
                supplierCompany: filters.supplierCompany,
                saudaNo: filters.saudaNo
            };
            const response = await api.get('/self-orders', { params });
            const items = response.data.data || response.data || [];
            setSaudas(items);
        } catch (error) {
            toast.error('Error fetching sauda details');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchSaudas();
    }, [fetchSaudas]);

    const handleSaudaClick = (saudaNo) => {
        setSelectedSauda(saudaNo);
        setShowPopup(true);
    };

    return (
        <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <FaFilter size={14} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">Sauda-wise Search</h4>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Search by Buyer, Seller or Sauda Number</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Buyer Company</label>
                        <DataDropdown
                            options={allCompanies.map(c => ({ value: c.companyName, label: c.companyName }))}
                            selectedOptions={filters.buyerCompany ? { value: filters.buyerCompany, label: filters.buyerCompany } : null}
                            onChange={(opt) => setFilters(prev => ({ ...prev, buyerCompany: opt?.value || '' }))}
                            placeholder="Search Buyer..."
                            isMulti={false}
                            className="rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Seller Company</label>
                        <input
                            type="text"
                            value={filters.supplierCompany}
                            onChange={(e) => setFilters(prev => ({ ...prev, supplierCompany: e.target.value }))}
                            placeholder="Enter Seller Company..."
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Sauda Number</label>
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={filters.saudaNo}
                                onChange={(e) => setFilters(prev => ({ ...prev, saudaNo: e.target.value }))}
                                placeholder="Enter Sauda No..."
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition text-sm font-bold text-slate-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sauda List */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-800">Available Saudas</h4>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Review sauda status and open detailed reports</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {saudas.length} Records Found
                    </div>
                </div>

                <div className="p-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loading size="lg" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Searching Saudas...</p>
                        </div>
                    ) : saudas.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sauda No.</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commodity</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {saudas.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <span className="font-black italic text-slate-900 tracking-tighter text-lg">
                                                    {s.saudaNo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-slate-600">
                                                {s.poDate ? new Date(s.poDate).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase">{s.buyerCompany}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{s.buyer}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 uppercase">{s.supplierCompany}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{s.supplier?.sellerName || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                                                    {s.commodity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs font-black text-slate-900 italic">
                                                    {s.quantity?.toLocaleString()} {s.unit || 'Ton'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => handleSaudaClick(s.saudaNo)}
                                                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
                                                >
                                                    View Details <FaArrowRight size={10} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                <FaFileInvoice size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">No Saudas Found</h4>
                            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">
                                Try adjusting your search filters to find specific records.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sauda Details Popup */}
            {showPopup && selectedSauda && (
                <SaudaDetailPopup
                    saudaNo={selectedSauda}
                    onClose={() => setShowPopup(false)}
                />
            )}
        </div>
    );
};

export default SaudaMISSection;
