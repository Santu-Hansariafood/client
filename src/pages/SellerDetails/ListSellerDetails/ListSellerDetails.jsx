import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
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
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
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

const normalizeEmail = (email) => {
  if (typeof email === "string") return email.toLowerCase();
  return String(email?.value || email?.email || "").toLowerCase();
};

const normalizePhone = (phone) => {
  if (typeof phone === "string") return phone;
  return String(phone?.value || phone?.number || "");
};

const formatSeller = (seller) => ({
  ...seller,
  sellerName: toTitleCase(seller.sellerName),
  companies: (seller.companies || []).map((company) => toTitleCase(company)),
  emails: (seller.emails || []).map(normalizeEmail).filter(Boolean),
  phoneNumbers: (seller.phoneNumbers || []).map((phone) => ({
    ...phone,
    value: normalizePhone(phone),
  })),
});

const buildSellerSearchText = (seller) =>
  [
    seller?.sellerName,
    ...(seller?.emails || []),
    ...(seller?.phoneNumbers || []).map((phone) => phone?.value),
    ...(seller?.companies || []),
    ...(seller?.commodities || []).map((commodity) => commodity?.name),
    ...(seller?.groups || []).map((group) => group?.name),
    seller?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchesSearch = (seller, query) => {
  if (!query) return true;
  return buildSellerSearchText(seller).includes(query);
};

const ListSellerDetails = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [commodityOptions, setCommodityOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [popupMode, setPopupMode] = useState("view");

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const fetchOptions = useCallback(async () => {
    try {
      const [commoditiesRes, companiesRes] = await Promise.all([
        api.get("/commodities", { params: { limit: 1000 } }),
        api.get("/seller-company", { params: { limit: 1000 } }),
      ]);

      const commodities =
        commoditiesRes.data?.data || commoditiesRes.data || [];
      const companies = companiesRes.data?.data || companiesRes.data || [];

      setCommodityOptions(
        commodities
          .map((c) => ({ value: c.name, label: c.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
      setCompanyOptions(
        companies
          .map((c) => ({ value: c.companyName, label: c.companyName }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
        };
        if (selectedCommodity) params.commodity = selectedCommodity.value;
        if (selectedCompany) params.company = selectedCompany.value;
        if (selectedStatus) params.status = selectedStatus.value;

        const response = await api.get("/sellers", { params });
        const data = response.data?.data || response.data || [];
        const total = response.data?.total || data.length;

        setSellers(data.map(formatSeller));
        setTotalItems(total);
      } catch (error) {
        toast.error("Failed to fetch seller data");
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedCommodity,
    selectedCompany,
    selectedStatus,
  ]);

  const handleEditSeller = (seller) => {
    navigate(`/seller-details/edit/${seller._id}`);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedSeller(null);
  };

  const handleDeleteSeller = async (sellerId) => {
    if (!window.confirm("Are you sure you want to delete this seller?")) return;
    try {
      await api.delete(`/sellers/${sellerId}`);
      clearApiCache();
      toast.success("Seller deleted successfully");
      // Re-fetch current page
      const response = await api.get("/sellers", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          ...(selectedCommodity && { commodity: selectedCommodity.value }),
          ...(selectedCompany && { company: selectedCompany.value }),
          ...(selectedStatus && { status: selectedStatus.value }),
        },
      });
      const data = response.data?.data || response.data || [];
      const total = response.data?.total || data.length;
      setSellers(data.map(formatSeller));
      setTotalItems(total);
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

  const rows = useMemo(
    () =>
      sellers.map((item, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        <div key={item._id} className="font-bold text-lux-ink">
          {item.sellerName}
        </div>,
        <div key={`${item._id}-emails`} className="flex flex-col gap-1">
          {(item.emails || []).map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="text-xs text-lux-emerald hover:text-lux-deep hover:underline"
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
              className="text-xs text-lux-muted hover:text-lux-emerald"
            >
              {phone.value}
            </a>
          ))}
        </div>,
        <div key={`${item._id}-commodities`} className="max-w-[200px]">
          {(item.commodities || []).map((commodity) => (
            <div key={commodity.name} className="mb-1 text-[11px] text-lux-muted">
              <span className="font-semibold text-lux-ink">
                {toTitleCase(commodity.name)}
              </span>
              <span className="ml-1 text-lux-muted">
                (₹{commodity.brokerage})
              </span>
            </div>
          ))}
        </div>,
        <div key={`${item._id}-companies`} className="text-xs text-lux-muted">
          {(item.companies || []).join(", ")}
        </div>,
        <span
          key={`${item._id}-status`}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            item.status === "active"
              ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
              : "border border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"
          }`}
        >
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
      ]),
    [sellers, currentPage, itemsPerPage],
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Seller Directory"
        subtitle="Manage and oversee your verified seller network"
        icon={FaUsersCog}
        noContentCard
      >
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="lux-card flex flex-col justify-between gap-4 p-4 sm:p-6 lg:flex-row lg:items-center">
            <div className="w-full lg:max-w-md">
              <SearchBox
                placeholder="Search sellers by name..."
                value={searchTerm}
                onSearch={(q) => {
                  setSearchTerm(q);
                  setCurrentPage(1);
                }}
                returnQuery
              />
            </div>
            <button
              onClick={() => navigate("/seller-details/add")}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            >
              <FaPlus /> Add New Seller
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ece4d2] bg-lux-cream text-lux-muted shadow-sm">
                <FaFilter size={14} />
              </div>
              <span className="text-sm font-bold text-lux-ink">Filters</span>
            </div>

            <DataDropdown
              options={commodityOptions}
              placeholder="All Commodities"
              selectedOptions={selectedCommodity}
              onChange={(option) => {
                setSelectedCommodity(option);
                setCurrentPage(1);
              }}
              isClearable
            />

            <DataDropdown
              options={companyOptions}
              placeholder="All Companies"
              selectedOptions={selectedCompany}
              onChange={(option) => {
                setSelectedCompany(option);
                setCurrentPage(1);
              }}
              isClearable
            />

            <DataDropdown
              options={statusOptions}
              placeholder="All Status"
              selectedOptions={selectedStatus}
              onChange={(option) => {
                setSelectedStatus(option);
                setCurrentPage(1);
              }}
              isClearable
            />
          </div>

          <div className="lux-card overflow-hidden">
            {loading ? (
              <Loading />
            ) : sellers.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-lux-muted">
                <FaSearch size={40} className="text-[#e6dcc4]" />
                <p className="text-lg font-medium text-lux-muted">No sellers found</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                    setSelectedCommodity(null);
                    setSelectedCompany(null);
                    setSelectedStatus(null);
                  }}
                  className="font-bold text-lux-emerald hover:text-lux-deep hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <Tables headers={headers} rows={rows} />
            )}
          </div>

          <div className="lux-card p-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>

          {isPopupOpen && (
            <PopupBox
              title="Seller Profile"
              isOpen={isPopupOpen}
              onClose={handlePopupClose}
            >
              {selectedSeller && (
                <div className="space-y-8 py-4">
                  <div className="flex items-center gap-6 border-b border-[#ece4d2] pb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-lux-emerald/10 text-3xl font-black text-lux-emerald">
                      {selectedSeller.sellerName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-semibold uppercase tracking-tight text-lux-ink sm:text-3xl">
                        {selectedSeller.sellerName}
                      </h2>
                      <div
                        className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          selectedSeller.status === "active"
                            ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                            : "border border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"
                        }`}
                      >
                        {selectedSeller.status} Account
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <Section title="Security & Access">
                        <Field
                          label="Login Password"
                          value={selectedSeller.password}
                          isSensitive
                        />
                      </Section>

                      <Section title="Contact Information">
                        <div className="space-y-4">
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                              Emails
                            </p>
                            <div className="flex flex-col gap-1">
                              {selectedSeller.emails.map((email) => (
                                <a
                                  key={email}
                                  href={`mailto:${email}`}
                                  className="font-bold text-lux-emerald hover:text-lux-deep hover:underline"
                                >
                                  {email}
                                </a>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                              Phone Numbers
                            </p>
                            <div className="flex flex-col gap-1">
                              {selectedSeller.phoneNumbers.map((phone) => (
                                <a
                                  key={phone.value}
                                  href={`tel:${phone.value}`}
                                  className="font-bold text-lux-ink transition-colors hover:text-lux-emerald"
                                >
                                  {phone.value}
                                </a>
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
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                              Commodities & Brokerage
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedSeller.commodities.map((c) => (
                                <div
                                  key={c.name}
                                  className="flex items-center justify-between rounded-xl border border-[#ece4d2] bg-lux-cream p-3"
                                >
                                  <span className="font-bold text-lux-ink">
                                    {toTitleCase(c.name)}
                                  </span>
                                  <span className="rounded-lg bg-lux-emerald/10 px-2 py-1 text-xs font-black text-lux-emerald">
                                    ₹{c.brokerage}/Ton
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                              Affiliated Companies
                            </p>
                            <p className="font-bold text-lux-ink">
                              {selectedSeller.companies.join(", ") ||
                                "None assigned"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                              Assigned Groups
                            </p>
                            <p className="font-bold text-lux-ink">
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
            </PopupBox>
          )}

          <ToastContainer />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
    <h4 className="lux-eyebrow mb-4 flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-lux-gold"></span>
      {title}
    </h4>
    {children}
  </div>
);

const Field = ({ label, value, isSensitive = false }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
      {label}
    </p>
    <p
      className={`font-bold ${isSensitive ? "select-none text-lux-muted/60" : "text-lux-ink"}`}
    >
      {isSensitive ? "••••••••" : value || "N/A"}
    </p>
  </div>
);

export default ListSellerDetails;
