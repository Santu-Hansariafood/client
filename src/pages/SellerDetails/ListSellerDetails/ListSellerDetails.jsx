import { lazy, Suspense, useEffect, useState, useCallback, useMemo } from "react";
import api from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUsersCog, FaFilter, FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataDropdown = lazy(() => import("../../../common/DataDropdown/DataDropdown"));
const EditSellerDetails = lazy(
  () => import("../EditSellerDetails/EditSellerDetails"),
);

const toTitleCase = (str) => {
  if (!str) return "N/A";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ListSellerDetails = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  // Options states
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState("view");
  const [selectedSeller, setSelectedSeller] = useState(null);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const fetchOptions = useCallback(async () => {
    try {
      const [commodities, companies] = await Promise.all([
        fetchAllPages("/commodities"),
        fetchAllPages("/seller-company"),
      ]);

      setCommodityOptions(
        commodities.map(c => ({ value: c.name, label: c.name }))
          .sort((a, b) => a.label.localeCompare(b.label))
      );
      setCompanyOptions(
        companies.map(c => ({ value: c.companyName, label: c.companyName }))
          .sort((a, b) => a.label.localeCompare(b.label))
      );
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  const fetchSellers = useCallback(async (page = 1, search = "", filters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: itemsPerPage,
        search,
        ...filters
      };
      
      const response = await api.get("/sellers", { params });

      let sellersList = [];
      let total = 0;

      if (response.data && response.data.data) {
        sellersList = response.data.data;
        total = response.data.total;
      } else {
        sellersList = response.data;
        total = response.data.length;
      }

      const formattedData = sellersList.map((seller) => ({
        ...seller,
        sellerName: toTitleCase(seller.sellerName),
        companies: (seller.companies || []).map((company) => toTitleCase(company)),
        emails: (seller.emails || []).map((email) => email.value.toLowerCase()),
      }));

      setData(formattedData);
      setTotalItems(total);
    } catch (error) {
      toast.error("Failed to fetch seller data");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    const filters = {};
    if (selectedCommodity) filters.commodity = selectedCommodity.value;
    if (selectedCompany) filters.company = selectedCompany.value;
    if (selectedStatus) filters.status = selectedStatus.value;
    
    fetchSellers(currentPage, searchTerm, filters);
  }, [currentPage, searchTerm, selectedCommodity, selectedCompany, selectedStatus, fetchSellers]);

  const handleEditSeller = (seller) => {
    setSelectedSeller(seller);
    setPopupMode("edit");
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedSeller(null);
  };

  const handleDeleteSeller = async (sellerId) => {
    if (!window.confirm("Are you sure you want to delete this seller?")) return;
    try {
      await api.delete(`/sellers/${sellerId}`);
      toast.success("Seller deleted successfully");
      fetchSellers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete seller");
    }
  };

  const headers = [
    "Sl No",
    "Seller Name",
    "Emails",
    "Phone Numbers",
    "Commodity",
    "Company",
    "Status",
    "Actions",
  ];

  const rows = useMemo(() => data.map((item, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    <div key={item._id} className="font-bold text-slate-700">{item.sellerName}</div>,
    <div key={`${item._id}-emails`} className="flex flex-col gap-1">
      {(item.emails || []).map((email) => (
        <a
          key={email}
          href={`mailto:${email}`}
          className="text-emerald-600 hover:text-emerald-700 hover:underline text-xs"
        >
          {email}
        </a>
      ))}
    </div>,
    <div key={`${item._id}-phones`} className="flex flex-col gap-1">
      {(item.phoneNumbers || []).map((phone) => (
        <a
          key={phone.value}
          href={`tel:${phone.value}`}
          className="text-slate-600 hover:text-emerald-600 text-xs"
        >
          {phone.value}
        </a>
      ))}
    </div>,
    <div key={`${item._id}-commodities`} className="max-w-[200px]">
      {(item.commodities || []).map((commodity) => (
        <div key={commodity.name} className="text-[11px] mb-1">
          <span className="font-semibold text-slate-700">{toTitleCase(commodity.name)}</span>
          <span className="text-slate-500 ml-1">(₹{commodity.brokerage})</span>
        </div>
      ))}
    </div>,
    <div key={`${item._id}-companies`} className="text-xs text-slate-600">
      {(item.companies || []).join(", ")}
    </div>,
    <span key={`${item._id}-status`} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
    }`}>
      {item.status}
    </span>,
    <Actions
      key={item._id}
      onView={() => {
        setSelectedSeller(item);
        setPopupMode("view");
        setIsPopupOpen(true);
      }}
      onEdit={() => handleEditSeller(item)}
      onDelete={() => handleDeleteSeller(item._id)}
    />,
  ]), [data, currentPage, itemsPerPage]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Seller Directory"
        subtitle="Manage and oversee your verified seller network"
        icon={FaUsersCog}
        noContentCard
      >
        <div className="max-w-full mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-full lg:max-w-md">
              <SearchBox
                placeholder="Search sellers by name..."
                onSearch={(q) => {
                  setSearchTerm(q);
                  setCurrentPage(1);
                }}
                returnQuery
              />
            </div>
            <button
              onClick={() => navigate("/seller-details/add")}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95 whitespace-nowrap"
            >
              <FaPlus /> Add New Seller
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <FaFilter size={14} />
              </div>
              <span className="text-sm font-bold text-slate-700">Filters</span>
            </div>
            
            <DataDropdown
              options={commodityOptions}
              placeholder="All Commodities"
              selectedOptions={selectedCommodity}
              onChange={setSelectedCommodity}
              isClearable
            />
            
            <DataDropdown
              options={companyOptions}
              placeholder="All Companies"
              selectedOptions={selectedCompany}
              onChange={setSelectedCompany}
              isClearable
            />
            
            <DataDropdown
              options={statusOptions}
              placeholder="All Status"
              selectedOptions={selectedStatus}
              onChange={setSelectedStatus}
              isClearable
            />
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loading />
              </div>
            ) : data.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <FaSearch size={40} className="text-slate-200" />
                <p className="font-medium text-lg">No sellers found</p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCommodity(null);
                    setSelectedCompany(null);
                    setSelectedStatus(null);
                  }}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <Tables headers={headers} rows={rows} />
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
            />
          </div>

          {isPopupOpen && (
            <PopupBox
              title={
                popupMode === "view"
                  ? "Seller Profile"
                  : "Update Seller Information"
              }
              isOpen={isPopupOpen}
              onClose={handlePopupClose}
            >
              {popupMode === "view" && selectedSeller && (
                <div className="space-y-8 py-4">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-[2rem] bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black">
                      {selectedSeller.sellerName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                        {selectedSeller.sellerName}
                      </h2>
                      <div className={`mt-1 inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        selectedSeller.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedSeller.status} Account
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <Section title="Security & Access">
                        <Field label="Login Password" value={selectedSeller.password} isSensitive />
                      </Section>
                      
                      <Section title="Contact Information">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emails</p>
                            <div className="flex flex-col gap-1">
                              {selectedSeller.emails.map(email => (
                                <a key={email} href={`mailto:${email}`} className="text-emerald-600 font-bold hover:underline">{email}</a>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Numbers</p>
                            <div className="flex flex-col gap-1">
                              {selectedSeller.phoneNumbers.map(phone => (
                                <a key={phone.value} href={`tel:${phone.value}`} className="text-slate-700 font-bold hover:text-emerald-600 transition-colors">{phone.value}</a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Section>
                    </div>

                    <div className="space-y-6">
                      <Section title="Market Exposure">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commodities & Brokerage</p>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedSeller.commodities.map(c => (
                                <div key={c.name} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="font-bold text-slate-700">{toTitleCase(c.name)}</span>
                                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">₹{c.brokerage}/Ton</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Affiliated Companies</p>
                            <p className="text-slate-700 font-bold">{selectedSeller.companies.join(", ") || "None assigned"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Groups</p>
                            <p className="text-slate-700 font-bold">
                              {(selectedSeller.groups || [])
                                .map((group) => toTitleCase(group.name))
                                .join(", ") || "No groups assigned"}
                            </p>
                          </div>
                        </div>
                      </Section>
                    </div>
                  </div>
                </div>
              )}

              {popupMode === "edit" && selectedSeller && (
                <EditSellerDetails
                  sellerId={selectedSeller._id}
                  onClose={handlePopupClose}
                  onSave={(updatedSeller) => {
                    fetchSellers(currentPage, searchTerm);
                  }}
                  isPopup={true}
                />
              )}
            </PopupBox>
          )}

          <ToastContainer />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

const Section = ({ title, children }) => (
  <div className="p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 shadow-sm">
    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      {title}
    </h4>
    {children}
  </div>
);

const Field = ({ label, value, isSensitive = false }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`font-bold ${isSensitive ? 'text-slate-300 select-none' : 'text-slate-700'}`}>
      {isSensitive ? '••••••••' : (value || "N/A")}
    </p>
  </div>
);

export default ListSellerDetails;
