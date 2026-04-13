import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { FaPlus, FaTrash, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaTruckLoading } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { useAuth } from "../../../context/AuthContext/AuthContext";
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const AdminPageShell = lazy(
  () => import("../../../common/AdminPageShell/AdminPageShell"),
);
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const capitalizeWords = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const fetchData = async (url, key) => {
  try {
    const response = await api.get(url);
    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    if (url === "/sellers") {
      return data.flatMap((seller) => {
        const companies =
          Array.isArray(seller.companies) && seller.companies.length > 0
            ? seller.companies
            : [seller.sellerName || "Unknown Seller"];

        return companies.map((company) => ({
          value: seller._id,
          label: capitalizeWords(company),
          company: company,
          sellerName: seller.sellerName,
          phoneNumbers: seller.phoneNumbers || [],
        }));
      });
    }
    return data.map((item) => ({
      value: item._id,
      label: capitalizeWords(item[key]),
      ...item,
    }));
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    return [];
  }
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const normalize = (str) => (str || "").toString().trim().toLowerCase();

const SearchFiltersCard = ({
  loading,
  userRole,
  groups,
  selectedGroup,
  setSelectedGroup,
  filteredBuyers,
  selectedBuyer,
  setSelectedBuyer,
  consignees,
  selectedConsignee,
  setSelectedConsignee,
  sellers,
  selectedSellerName,
  setSelectedSellerName,
  sellerCompanies,
  selectedSellerCompany,
  setSelectedSellerCompany,
  saudaSearch,
  setSaudaSearch,
  saudaSuggestions,
  isSaudaSuggestOpen,
  setIsSaudaSuggestOpen,
  handleSearch,
}) => {
  return (
    <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div
              className={`grid grid-cols-1 gap-4 ${
                userRole !== "Seller" ? "md:grid-cols-4" : "md:grid-cols-2"
              }`}
            >
              {userRole !== "Seller" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-slate-700">
                      Group
                    </label>
                    <DataDropdown
                      options={groups}
                      selectedOptions={selectedGroup ? [selectedGroup] : []}
                      onChange={setSelectedGroup}
                      placeholder="Select Group"
                      isMulti={false}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-slate-700">
                      Buyer
                    </label>
                    <DataDropdown
                      options={filteredBuyers}
                      selectedOptions={selectedBuyer ? [selectedBuyer] : []}
                      onChange={setSelectedBuyer}
                      placeholder="Select Buyer"
                      isMulti={false}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Consignee
                </label>
                <DataDropdown
                  options={consignees}
                  selectedOptions={selectedConsignee ? [selectedConsignee] : []}
                  onChange={setSelectedConsignee}
                  placeholder={
                    userRole !== "Seller" && !selectedBuyer
                      ? "Select Buyer First"
                      : "Select Consignee"
                  }
                  isMulti={false}
                  disabled={userRole !== "Seller" && !selectedBuyer}
                />
              </div>
              <div className="relative">
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Sauda No
                </label>
                <input
                  type="text"
                  value={saudaSearch}
                  onChange={(e) => setSaudaSearch(e.target.value)}
                  onFocus={() => {
                    if (saudaSuggestions.length > 0) setIsSaudaSuggestOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsSaudaSuggestOpen(false), 120);
                  }}
                  placeholder="Search by Sauda No"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition"
                />

                {isSaudaSuggestOpen && saudaSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {saudaSuggestions.map((o) => (
                      <button
                        key={String(o.saudaNo)}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSaudaSearch(String(o.saudaNo || ""));
                          setIsSaudaSuggestOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          Sauda: {o.saudaNo}
                          {o._count > 1 ? ` (${o._count})` : ""}
                        </div>
                        <div className="text-xs text-slate-500">
                          {capitalizeWords(o.consignee)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Seller Name
                </label>
                <DataDropdown
                  options={sellers}
                  selectedOptions={selectedSellerName ? [selectedSellerName] : []}
                  onChange={setSelectedSellerName}
                  placeholder={
                    userRole !== "Seller" &&
                    !selectedBuyer &&
                    !saudaSearch.trim()
                      ? "Select Buyer or Sauda"
                      : "Select Seller"
                  }
                  isMulti={false}
                  disabled={
                    userRole !== "Seller" &&
                    !selectedBuyer &&
                    !saudaSearch.trim()
                  }
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">
                  Seller Company
                </label>
                <DataDropdown
                  options={sellerCompanies}
                  selectedOptions={
                    selectedSellerCompany ? [selectedSellerCompany] : []
                  }
                  onChange={setSelectedSellerCompany}
                  placeholder="Select Company"
                  isMulti={false}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition font-semibold"
          >
            Search
          </button>
        </div>
      )}
    </div>
  );
};

const OrdersTableCard = ({ orders, handleOpenPopup, toggleSaudaStatus }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
      {orders.length > 0 ? (
        <Tables
          headers={[
            "Date",
            "Sauda No",
            "Seller Name",
            "Company",
            "Consignee",
            "Commodity",
            "Quantity",
            "Rate",
            "Pending Quantity",
            "Status",
            "Action",
          ]}
          rows={orders.map((order) => [
            formatDate(order.poDate || order.createdAt),
            order.saudaNo,
            capitalizeWords(order.supplierCompany),
            capitalizeWords(order.buyerCompany),
            capitalizeWords(order.consignee),
            capitalizeWords(order.commodity),
            order.quantity,
            order.rate,
            order.pendingQuantity,
            <span
              key={`status-${order._id}`}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                order.isClosed
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {order.isClosed ? "Closed" : "Active"}
            </span>,
            <div
              key={`actions-${order._id}`}
              className="flex items-center gap-3"
            >
              {order.status !== "closed" ? (
                <>
                  <button
                    onClick={() => handleOpenPopup(order)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-xs font-bold whitespace-nowrap"
                    title="Add Loading Entry"
                  >
                    <FaPlus /> Add Loading Entry
                  </button>
                  <button
                    onClick={() => toggleSaudaStatus(order)}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-xs font-bold"
                    title="Close Sauda"
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleSaudaStatus(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-xs font-bold"
                  title="Reopen Sauda"
                >
                  Reopen to Add
                </button>
              )}
            </div>,
          ])}
        />
      ) : (
        <div className="py-10 text-center text-slate-500 font-medium">
          No results yet. Select group, buyer, consignee, seller name and seller
          company and search.
        </div>
      )}
    </div>
  );
};

const AddLoadingEntry = () => {
  const { userRole, mobile } = useAuth();
  
  // New Filter States
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  const [consignees, setConsignees] = useState([]);
  const [allConsignees, setAllConsignees] = useState([]);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  
  const [sellers, setSellers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [selectedSellerName, setSelectedSellerName] = useState(null);
  
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);

  const [transporters, setTransporters] = useState([]);
  
  const [saudaSearch, setSaudaSearch] = useState(""); // Optional Sauda search
  const [saudaSuggestions, setSaudaSuggestions] = useState([]);
  const [isSaudaSuggestOpen, setIsSaudaSuggestOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [existingEntries, setExistingEntries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);


  const INITIAL_ENTRY = {
    loadingDate: new Date().toISOString().split("T")[0],
    loadingWeight: "",
    bags: "",
    lorryNumber: "",
    transporterId: "",
    addedTransport: "",
    driverName: "",
    driverPhoneNumber: "",
    freightRate: "",
    totalFreight: 0,
    advance: 0,
    balance: 0,
    billNumber: "",
    dateOfIssue: new Date().toISOString().split("T")[0],
    status: "open",
  };

  const handleSearch = useCallback(async () => {
    const trimmedSauda = saudaSearch.trim();
    if (userRole !== "Seller" && !selectedBuyer && !trimmedSauda) {
      toast.info("Please provide at least one search criteria.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/loading-entries/saudas", {
        params: {
          groupId: selectedGroup?.value,
          buyerId: selectedBuyer?.value,
          sellerId: selectedSellerName?.value,
          sellerCompany: selectedSellerCompany?.name,
          saudaNo: trimmedSauda || undefined,
          limit: 1000,
        },
      });

      const payload = response?.data;
      const data = Array.isArray(payload?.data) ? payload.data : [];

      const consigneeNeedle = normalize(selectedConsignee?.name);
      const filtered = consigneeNeedle
        ? data.filter((o) => normalize(o.consignee).includes(consigneeNeedle))
        : data;

      if (filtered.length === 0) {
        toast.info("No matching Sauda found.");
        setOrders([]);
        return;
      }

      setOrders(filtered);
    } catch (err) {
      console.error("Error searching orders:", err);
      toast.error("Error searching for orders.");
    } finally {
      setLoading(false);
    }
  }, [
    userRole,
    selectedGroup,
    selectedBuyer,
    selectedSellerName,
    selectedSellerCompany,
    selectedConsignee,
    saudaSearch,
  ]);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoading(true);
      try {
        const [filtersRes, transportersRes, consigneesRes, sellersRes] =
          await Promise.all([
            api.get("/loading-entries/filters"),
            api.get("/transporters", { params: { limit: 0 } }),
            api.get("/consignees", { params: { limit: 0 } }),
            api.get("/sellers", { params: { limit: 0 } }),
          ]);

        const filters = filtersRes?.data || {};

        const rawGroups = Array.isArray(filters.groups) ? filters.groups : [];
        const groupsFormatted = rawGroups.map((g) => ({
          value: g._id,
          label: capitalizeWords(g.groupName),
          name: g.groupName,
        }));
        setGroups(groupsFormatted);

        const rawSellers = Array.isArray(sellersRes.data)
          ? sellersRes.data
          : sellersRes.data?.data || [];
        const sellersFormatted = rawSellers.map((s) => ({
          value: s._id,
          label: capitalizeWords(s.sellerName),
          name: s.sellerName,
          companies: Array.isArray(s.companies) ? s.companies : [],
        }));
        setAllSellers(sellersFormatted);
        setSellers(sellersFormatted);

        if (userRole === "Seller" && sellersFormatted.length === 1) {
          setSelectedSellerName(sellersFormatted[0]);
        }

        const rawTransporters = Array.isArray(transportersRes.data)
          ? transportersRes.data
          : transportersRes.data?.data || [];

        const transportersData = rawTransporters.map((t) => ({
          value: t._id,
          label: `${capitalizeWords(t.name)} - ${t.mobile}`,
          name: t.name,
          mobile: t.mobile,
        }));
        setTransporters(transportersData);

        const rawConsignees = Array.isArray(consigneesRes.data)
          ? consigneesRes.data
          : consigneesRes.data?.data || [];
        const consigneesFormatted = rawConsignees.map((c) => ({
          value: c._id,
          label: capitalizeWords(c.name),
          name: c.name,
        }));
        setAllConsignees(consigneesFormatted);
        setConsignees(userRole === "Seller" ? consigneesFormatted : []);
      } catch (err) {
        console.error("Error loading dropdowns:", err);
        toast.error("Error loading dropdown data");
      }
      setLoading(false);
    };
    loadDropdowns();
  }, [userRole, mobile]);

  useEffect(() => {
    const loadBuyersForGroup = async () => {
      if (!selectedGroup?.value) {
        setFilteredBuyers([]);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees(userRole === "Seller" ? allConsignees : []);
        return;
      }

      try {
        const res = await api.get("/loading-entries/buyers", {
          params: { groupId: selectedGroup.value },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        const formatted = list.map((b) => ({
          value: b._id,
          label: capitalizeWords(b.name),
          name: b.name,
        }));
        setFilteredBuyers(formatted);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees([]);
      } catch (err) {
        console.error("Error loading buyers:", err);
        toast.error("Failed to load buyers");
        setFilteredBuyers([]);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees([]);
      }
    };

    loadBuyersForGroup();
  }, [selectedGroup, userRole, allConsignees]);

  useEffect(() => {
    if (userRole === "Seller") return;

    if (!selectedBuyer?.value) {
      setConsignees([]);
      setSelectedConsignee(null);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const response = await api.get("/loading-entries/saudas", {
          params: {
            groupId: selectedGroup?.value,
            buyerId: selectedBuyer.value,
            limit: 2000,
          },
        });

        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = new Map();
        for (const row of data) {
          const name = (row?.consignee || "").toString().trim();
          if (!name) continue;
          const key = normalize(name);
          if (!uniq.has(key)) {
            uniq.set(key, {
              value: name,
              label: capitalizeWords(name),
              name,
            });
          }
        }

        const list = Array.from(uniq.values()).sort((a, b) =>
          String(a.label).localeCompare(String(b.label)),
        );

        if (!ignore) {
          setConsignees(list);
          setSelectedConsignee(null);
        }
      } catch {
        if (!ignore) {
          setConsignees([]);
          setSelectedConsignee(null);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userRole, selectedGroup, selectedBuyer]);

  useEffect(() => {
    if (userRole === "Seller") return;

    if (!selectedBuyer?.value) {
      setSellers(allSellers);
      setSelectedSellerName(null);
      setSelectedSellerCompany(null);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const response = await api.get("/loading-entries/saudas", {
          params: {
            groupId: selectedGroup?.value,
            buyerId: selectedBuyer.value,
            limit: 2000,
          },
        });

        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];

        const sellerIds = new Set(
          data
            .map((o) => o?.supplier?._id || o?.supplier)
            .filter(Boolean)
            .map((id) => String(id)),
        );

        const filtered = (Array.isArray(allSellers) ? allSellers : []).filter(
          (s) => sellerIds.has(String(s.value)),
        );

        if (!ignore) {
          setSellers(filtered);
          if (
            selectedSellerName &&
            !sellerIds.has(String(selectedSellerName.value))
          ) {
            setSelectedSellerName(null);
            setSelectedSellerCompany(null);
          }
        }
      } catch {
        if (!ignore) {
          setSellers(allSellers);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userRole, selectedGroup, selectedBuyer, allSellers, selectedSellerName]);

  useEffect(() => {
    if (!selectedSellerName?.value) {
      setSellerCompanies([]);
      setSelectedSellerCompany(null);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const response = await api.get("/loading-entries/saudas", {
          params: {
            groupId: selectedGroup?.value,
            buyerId: selectedBuyer?.value,
            sellerId: selectedSellerName.value,
            limit: 2000,
          },
        });

        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = new Map();
        for (const row of data) {
          const name = (row?.supplierCompany || "").toString().trim();
          if (!name) continue;
          const key = normalize(name);
          if (!uniq.has(key)) {
            uniq.set(key, {
              value: name,
              label: capitalizeWords(name),
              name,
            });
          }
        }

        let list = Array.from(uniq.values()).sort((a, b) =>
          String(a.label).localeCompare(String(b.label)),
        );

        if (list.length === 0) {
          const rawCompanies = Array.isArray(selectedSellerName.companies)
            ? selectedSellerName.companies
            : [];
          list = rawCompanies.map((c) => ({
            value: c,
            label: capitalizeWords(c),
            name: c,
          }));
        }

        if (!ignore) {
          setSellerCompanies(list);
          setSelectedSellerCompany(null);
        }
      } catch {
        if (!ignore) {
          const rawCompanies = Array.isArray(selectedSellerName.companies)
            ? selectedSellerName.companies
            : [];
          const list = rawCompanies.map((c) => ({
            value: c,
            label: capitalizeWords(c),
            name: c,
          }));
          setSellerCompanies(list);
          setSelectedSellerCompany(null);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [selectedSellerName, selectedGroup, selectedBuyer]);

  useEffect(() => {
    if (selectedBuyer && selectedSellerCompany) {
      handleSearch();
    }
  }, [selectedBuyer, selectedSellerCompany, handleSearch]);

  useEffect(() => {
    const trimmed = saudaSearch.trim();
    if (!trimmed) {
      setSaudaSuggestions([]);
      setIsSaudaSuggestOpen(false);
      return;
    }

    let ignore = false;
    const handle = setTimeout(async () => {
      try {
        const params = {
          groupId: selectedGroup?.value,
          buyerId: selectedBuyer?.value,
          saudaNo: trimmed,
          limit: 500,
        };
        if (selectedSellerName?.value) params.sellerId = selectedSellerName.value;
        if (selectedSellerCompany?.name)
          params.sellerCompany = selectedSellerCompany.name;

        const response = await api.get("/loading-entries/saudas", {
          params,
        });

        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];

        const consigneeNeedle = normalize(selectedConsignee?.name);
        const filtered = consigneeNeedle
          ? data.filter((o) => normalize(o.consignee).includes(consigneeNeedle))
          : data;

        const bySauda = new Map();
        for (const row of filtered) {
          const key = String(row?.saudaNo ?? "").trim();
          if (!key) continue;
          if (!bySauda.has(key)) bySauda.set(key, { ...row, _count: 1 });
          else bySauda.get(key)._count += 1;
        }

        const suggestions = Array.from(bySauda.values());

        if (!ignore) {
          setSaudaSuggestions(suggestions.slice(0, 100));
          setIsSaudaSuggestOpen(suggestions.length > 0);
        }
      } catch {
        if (!ignore) {
          setSaudaSuggestions([]);
          setIsSaudaSuggestOpen(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(handle);
    };
  }, [
    saudaSearch,
    selectedGroup,
    selectedBuyer,
    selectedSellerName,
    selectedSellerCompany,
    selectedConsignee,
  ]);

  const toggleSaudaStatus = async (order) => {
    if (userRole === "Seller") {
      toast.error("Only Admin/Employee can change Sauda status.");
      return;
    }
    try {
      const newStatus = order.status === "closed" ? "active" : "closed";
      await api.put(`/self-order/${order._id}`, { status: newStatus });
      handleSearch();
    } catch (error) {
      console.error("Error updating sauda status:", error);
    }
  };

  const handleOpenPopup = async (order) => {
    setSelectedOrder(order);
    setLoadingEntries([{ ...INITIAL_ENTRY }]);
    setIsPopupOpen(true);
    setExistingEntries([]); // Clear previous data

    // Fetch existing entries for this sauda
    try {
      const response = await api.get(`/loading-entries/sauda/${order.saudaNo}`);
      setExistingEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching existing entries:", error);
      // toast.error("Could not load previous loading history");
    }
  };

  const handleAddMore = () => {
    setLoadingEntries([...loadingEntries, { ...INITIAL_ENTRY }]);
  };

  const handleRemoveEntry = (index) => {
    if (loadingEntries.length > 1) {
      const newEntries = loadingEntries.filter((_, i) => i !== index);
      setLoadingEntries(newEntries);
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...loadingEntries];

    if (field === "loadingDate" || field === "dateOfIssue") {
      const d = new Date(value);
      newEntries[index][field] = !isNaN(d.getTime())
        ? d.toISOString().split("T")[0]
        : "";
    } else {
      newEntries[index][field] = value;
    }

    if (
      field === "loadingWeight" ||
      field === "freightRate" ||
      field === "advance"
    ) {
      const weight = parseFloat(newEntries[index].loadingWeight) || 0;
      const rate = parseFloat(newEntries[index].freightRate) || 0;
      const advance = parseFloat(newEntries[index].advance) || 0;

      const total = +(weight * rate).toFixed(2);
      const balance = +(total - advance).toFixed(2);

      newEntries[index].totalFreight = total;
      newEntries[index].balance = balance;
    }

    setLoadingEntries(newEntries);
  };
  const calculateTotalLoadingWeight = () => {
    return loadingEntries.reduce(
      (sum, entry) => sum + (parseFloat(entry.loadingWeight) || 0),
      0,
    );
  };

  const handleSaveEntries = async () => {
    if (!selectedOrder) return;

    setIsSaving(true);

    for (const entry of loadingEntries) {
      const weight = parseFloat(entry.loadingWeight) || 0;
      const rate = parseFloat(entry.freightRate) || 0;
      const advance = parseFloat(entry.advance) || 0;

      if (weight < 0 || rate < 0 || advance < 0) {
        toast.error("Values cannot be negative");
        setIsSaving(false);
        return;
      }

      if (
        entry.driverPhoneNumber &&
        !/^\d{10}$/.test(entry.driverPhoneNumber)
      ) {
        toast.error("Invalid phone number");
        setIsSaving(false);
        return;
      }
    }

    const totalNewWeight = calculateTotalLoadingWeight();
    const pending = selectedOrder.pendingQuantity || 0;

    if (totalNewWeight > pending + selectedOrder.quantity * 0.05) {
      // Allow 5% tolerance
      const confirmSave = window.confirm(
        `Total loading weight (${totalNewWeight.toFixed(2)} Tons) exceeds pending quantity (${pending.toFixed(2)} Tons). Do you want to proceed?`,
      );
      if (!confirmSave) {
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
        saudaNo: selectedOrder.saudaNo,
        entries: loadingEntries.map((entry) => ({
          ...entry,
          saudaNo: selectedOrder.saudaNo,
          supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
          supplierCompany: selectedOrder.supplierCompany,
          consignee: selectedOrder.consignee,
          commodity: selectedOrder.commodity,
          bags: entry.bags,
          status: entry.status || "open",
        })),
      };

      await api.post("/loading-entries/bulk", payload);
      toast.success("All loading entries saved successfully");
      setIsPopupOpen(false);
      handleSearch();
    } catch (error) {
      console.error("Error saving entries:", error);
      toast.error(error.response?.data?.message || "Failed to save entries");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDownloadPDF = async (entry) => {
    try {
      const fullEntry = {
        ...entry,
        saudaNo: selectedOrder.saudaNo,
        supplier: selectedOrder.supplier?._id || selectedOrder.supplier,
        supplierCompany: selectedOrder.supplierCompany,
        consignee: selectedOrder.consignee,
        commodity: selectedOrder.commodity,
        bags: entry.bags,
      };
      const fileUrl = await PrintLoadingEntry(fullEntry);
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `LoadingEntry-${entry.billNumber || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (
    userRole !== "Admin" &&
    userRole !== "Employee" &&
    userRole !== "Seller"
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-medium">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={
          userRole === "Seller" ? "Add Your Loading Entry" : "Add Loading Entry"
        }
        subtitle={
          userRole === "Seller"
            ? "Create challans for your orders"
            : "Select group, buyer, consignee, seller name and seller company to find sauda entries for loading"
        }
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <SearchFiltersCard
            loading={loading}
            userRole={userRole}
            groups={groups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            filteredBuyers={filteredBuyers}
            selectedBuyer={selectedBuyer}
            setSelectedBuyer={setSelectedBuyer}
            consignees={consignees}
            selectedConsignee={selectedConsignee}
            setSelectedConsignee={setSelectedConsignee}
            sellers={sellers}
            selectedSellerName={selectedSellerName}
            setSelectedSellerName={setSelectedSellerName}
            sellerCompanies={sellerCompanies}
            selectedSellerCompany={selectedSellerCompany}
            setSelectedSellerCompany={setSelectedSellerCompany}
            saudaSearch={saudaSearch}
            setSaudaSearch={setSaudaSearch}
            saudaSuggestions={saudaSuggestions}
            isSaudaSuggestOpen={isSaudaSuggestOpen}
            setIsSaudaSuggestOpen={setIsSaudaSuggestOpen}
            handleSearch={handleSearch}
          />

          <OrdersTableCard
            orders={orders}
            handleOpenPopup={handleOpenPopup}
            toggleSaudaStatus={toggleSaudaStatus}
          />
        </div>

        {isPopupOpen && selectedOrder && (
          <PopupBox
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            title={`Add Loading Entry - Sauda: ${selectedOrder.saudaNo}`}
            maxWidth="max-w-[98vw] max-w-none"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 shadow-inner">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Total Quantity</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(selectedOrder.quantity || 0).toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Already Loaded</p>
                  <p className="font-bold text-slate-800 text-lg">
                    {(
                      (selectedOrder.quantity || 0) -
                      (selectedOrder.pendingQuantity || 0)
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-emerald-600 font-medium">
                    Currently Adding
                  </p>
                  <p className="font-bold text-emerald-700 text-lg">
                    {calculateTotalLoadingWeight().toFixed(2)} Tons
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-100">
                  <p className="text-amber-600 font-medium">
                    Remaining Pending
                  </p>
                  <p className="font-bold text-amber-700 text-lg">
                    {Math.max(
                      0,
                      (selectedOrder.pendingQuantity || 0) -
                        calculateTotalLoadingWeight(),
                    ).toFixed(2)}{" "}
                    Tons
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar p-2">
                {/* Previous Loading History Section */}
                {existingEntries.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2">
                      <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                      Previous Loading History ({existingEntries.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {existingEntries.map((entry, idx) => (
                        <div
                          key={`history-${idx}`}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between opacity-80"
                        >
                          <div className="flex gap-4 items-center">
                            <span className="text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Date
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {formatDate(entry.loadingDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Lorry
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {entry.lorryNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Weight
                              </p>
                              <p className="text-sm font-bold text-emerald-600">
                                {entry.loadingWeight} Tons
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Bill No
                              </p>
                              <p className="text-sm font-bold text-slate-600">
                                {entry.billNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadPDF(entry)}
                            className="p-2 text-slate-500 hover:text-emerald-600 transition"
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  New Loading Entry
                </h3>

                {loadingEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 border border-slate-200 rounded-3xl space-y-6 relative bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-700">
                          Loading Specification
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPDF(entry)}
                          className="flex items-center gap-2 px-3 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-sm font-bold border border-purple-100"
                          title="Download Lorry Challan"
                        >
                          <FaDownload /> Challan
                        </button>
                        {loadingEntries.length > 1 && (
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition border border-red-100"
                            title="Remove Entry"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Loading Date
                        </label>
                        <DateSelector
                          selectedDate={entry.loadingDate}
                          onChange={(date) =>
                            handleEntryChange(index, "loadingDate", date)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Weight (Tons)
                        </label>
                        <DataInput
                          type="number"
                          value={entry.loadingWeight}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "loadingWeight",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bags Count
                        </label>
                        <DataInput
                          type="number"
                          value={entry.bags}
                          onChange={(e) =>
                            handleEntryChange(index, "bags", e.target.value)
                          }
                          placeholder="No. of bags"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Lorry Number
                        </label>
                        <DataInput
                          value={entry.lorryNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "lorryNumber",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. RJ 14 GA 1234"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Transporter
                        </label>
                        <DataDropdown
                          options={transporters}
                          selectedOptions={
                            entry.transporterId
                              ? [
                                  transporters.find(
                                    (t) => t.value === entry.transporterId,
                                  ),
                                ].filter(Boolean)
                              : []
                          }
                          onChange={(option) => {
                            const newEntries = [...loadingEntries];
                            newEntries[index].transporterId =
                              option?.value || "";
                            newEntries[index].addedTransport =
                              option?.name || "";
                            setLoadingEntries(newEntries);
                          }}
                          placeholder="Select Transporter"
                          isMulti={false}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Name
                        </label>
                        <DataInput
                          value={entry.driverName}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverName",
                              e.target.value,
                            )
                          }
                          placeholder="Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Driver Mobile
                        </label>
                        <DataInput
                          value={entry.driverPhoneNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "driverPhoneNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Freight Rate
                        </label>
                        <DataInput
                          type="number"
                          value={entry.freightRate}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "freightRate",
                              e.target.value,
                            )
                          }
                          placeholder="Rs. per ton"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Number
                        </label>
                        <DataInput
                          value={entry.billNumber}
                          onChange={(e) =>
                            handleEntryChange(
                              index,
                              "billNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Invoice no."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Bill Issue Date
                        </label>
                        <DateSelector
                          selectedDate={entry.dateOfIssue}
                          onChange={(date) =>
                            handleEntryChange(index, "dateOfIssue", date)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Total Freight
                        </p>
                        <p className="font-bold text-slate-800 text-lg">
                          ₹ {Number(entry.totalFreight).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Advance Amount
                        </p>
                        <div className="max-w-[120px]">
                          <DataInput
                            type="number"
                            className="text-center font-bold !py-1"
                            value={entry.advance}
                            onChange={(e) =>
                              handleEntryChange(
                                index,
                                "advance",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Balance Due
                        </p>
                        <p className="font-bold text-amber-600 text-lg">
                          ₹ {Number(entry.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                <button
                  onClick={handleAddMore}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all font-bold shadow-lg shadow-slate-200 active:scale-95"
                >
                  <FaPlus /> Add More Lorry
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="flex-1 sm:flex-none px-8 py-3 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition font-bold border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntries}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-12 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? "Saving..." : "Save All Lorry"}
                  </button>
                </div>
              </div>
            </div>
          </PopupBox>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default AddLoadingEntry;
