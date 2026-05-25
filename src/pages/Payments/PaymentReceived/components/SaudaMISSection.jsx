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
    const [saudaNumbers, setSaudaNumbers] = useState([]);
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
            setSaudaNumbers(items.map(s => s.saudaNo));
        } catch (error) {
            toast.error('Error fetching sauda numbers');
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
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[300px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-800">Available Saudas</h4>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Click on a number to view full details</p>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loading size="lg" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Searching Saudas...</p>
                        </div>
                    ) : saudaNumbers.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {saudaNumbers.map((no, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSaudaClick(no)}
                                    className="bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 p-4 rounded-2xl transition-all duration-300 font-black italic tracking-tighter text-xl text-slate-700 shadow-sm"
                                >
                                    {no}
                                </button>
                            ))}
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
