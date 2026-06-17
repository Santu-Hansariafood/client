import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaMoneyBillWave, FaBackspace, FaSave } from "react-icons/fa";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import DateSelector from "../../../common/DateSelector/DateSelector";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";

const AddPaymentRelease = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    group: "",
    buyerCompany: "",
    consignee: "",
    sellerName: "",
    sellerCompany: "",
    billNumber: "",
    lorryNumber: "",
    paymentAmount: "",
    paymentDate: new Date(),
    remarks: ""
  });

  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buyersData, sellersData, sellerCompaniesData, groupsData] = await Promise.all([
          fetchAllPages("/buyers"),
          fetchAllPages("/sellers"),
          fetchAllPages("/seller-companies"),
          fetchAllPages("/groups")
        ]);
        setBuyers(buyersData || []);
        setSellers(sellersData || []);
        setSellerCompanies(sellerCompaniesData || []);
        setGroups(groupsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/payment-releases", formData);
      toast.success("Payment release added successfully!");
      navigate("/payments/payment-release/list");
    } catch (error) {
      console.error("Error adding payment release:", error);
      toast.error("Failed to add payment release");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, paymentDate: date }));
  };

  return (
    <AdminPageShell noContentCard>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <FaMoneyBillWave size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Add Payment Release
              </h1>
              <p className="text-sm font-semibold text-slate-400 mt-1">
                Create a new payment release record
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Group
                </label>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Buyer Company
                </label>
                <select
                  name="buyerCompany"
                  value={formData.buyerCompany}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Select Buyer Company</option>
                  {buyers.map((buyer) => (
                    <option key={buyer._id} value={buyer.companyName}>
                      {buyer.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Consignee
                </label>
                <input
                  type="text"
                  name="consignee"
                  value={formData.consignee}
                  onChange={handleChange}
                  placeholder="Enter consignee"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Seller Name
                </label>
                <select
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Select Seller Name</option>
                  {sellers.map((seller) => (
                    <option key={seller._id} value={seller.sellerName}>
                      {seller.sellerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Seller Company
                </label>
                <select
                  name="sellerCompany"
                  value={formData.sellerCompany}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Select Seller Company</option>
                  {sellerCompanies.map((company) => (
                    <option key={company._id} value={company.companyName}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bill Number
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleChange}
                  placeholder="Enter bill number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lorry Number
                </label>
                <input
                  type="text"
                  name="lorryNumber"
                  value={formData.lorryNumber}
                  onChange={handleChange}
                  placeholder="Enter lorry number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleChange}
                  placeholder="Enter payment amount"
                  step="0.01"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Date
                </label>
                <DateSelector
                  selected={formData.paymentDate}
                  onChange={handleDateChange}
                  placeholderText="Select date"
                  className="w-full"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <FaBackspace /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default AddPaymentRelease;
