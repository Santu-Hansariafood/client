import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

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
      <div className="mx-auto w-full max-w-5xl animate-slide-up">
        <div className="lux-card lux-gold-top w-full p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-8 sm:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40 sm:h-16 sm:w-16">
              <FaMoneyBillWave size={28} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-lux-ink sm:text-3xl">
                Add Payment Release
              </h1>
              <p className="mt-1 text-sm font-medium text-lux-muted">
                Create a new payment release record
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Group
                </label>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
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
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Buyer Company
                </label>
                <select
                  name="buyerCompany"
                  value={formData.buyerCompany}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
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
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Consignee
                </label>
                <input
                  type="text"
                  name="consignee"
                  value={formData.consignee}
                  onChange={handleChange}
                  placeholder="Enter consignee"
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Seller Name
                </label>
                <select
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
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
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Seller Company
                </label>
                <select
                  name="sellerCompany"
                  value={formData.sellerCompany}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
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
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Bill Number
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleChange}
                  placeholder="Enter bill number"
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Lorry Number
                </label>
                <input
                  type="text"
                  name="lorryNumber"
                  value={formData.lorryNumber}
                  onChange={handleChange}
                  placeholder="Enter lorry number"
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Payment Amount
                </label>
                <input
                  type="number"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleChange}
                  placeholder="Enter payment amount"
                  step="0.01"
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
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
                <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  rows={3}
                  className="w-full rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3 text-sm font-semibold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-emerald/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-[#ece4d2] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                <FaBackspace /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
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
