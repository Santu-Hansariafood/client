import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaTruckLoading, FaSearch, FaDownload } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getSellerName = (item) =>
  item?.supplier?.sellerName ||
  item?.sellerName ||
  item?.supplierName ||
  item?.supplier ||
  "";

const getConsigneeDisplay = (item) => {
  if (item?.consignee) {
    if (typeof item.consignee === "object") {
      return (
        item.consignee.name ||
        item.consignee.label ||
        item.consignee.consigneeName ||
        "N/A"
      );
    }
    return item.consignee;
  }
  if (item?.shipTo) {
    if (typeof item.shipTo === "object") {
      return (
        item.shipTo.name ||
        item.shipTo.label ||
        item.shipTo.consigneeName ||
        "N/A"
      );
    }
    return item.shipTo;
  }
  return item?.consigneeName || "N/A";
};

const getGroupName = (item, groupMap = {}) => {
  const direct =
    item?.group?.groupName ||
    item?.group?.name ||
    item?.groupName ||
    item?.group ||
    item?.buyerGroup ||
    "";
  if (direct) return direct;

  const groupId =
    item?.groupId || item?.group?._id || item?.group?.id || item?.buyerGroupId;
  return groupId ? groupMap[String(groupId)] || "" : "";
};

const buildDropdownOptions = (values) =>
  [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: value,
      name: value,
    }));

const PendingLoadingList = () => {
  const { userRole, mobile } = useAuth();
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedBuyerCompany, setSelectedBuyerCompany] = useState(null);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);
  const [selectedSellerName, setSelectedSellerName] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMap, setGroupMap] = useState({});

  const fetchGroupData = useCallback(async () => {
    try {
      const groupsRes = await api.get("/groups");
      const groupsData = Array.isArray(groupsRes.data?.data)
        ? groupsRes.data.data
        : Array.isArray(groupsRes.data)
          ? groupsRes.data
          : [];

      setGroupMap(
        Object.fromEntries(
          groupsData.map((group) => [
            String(group?._id || group?.id || ""),
            group?.groupName || group?.name || "",
          ]),
        ),
      );
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/self-order/pending/list", {
        params: {
          page: 1,
          limit: 1000,
        },
      });
      const fetchedData = response.data.data || [];
      setAllData(fetchedData);
    } catch (error) {
      console.error("Error fetching pending loading entries:", error);
      toast.error("Failed to fetch pending entries");
    } finally {
      setLoading(false);
    }
  }, []);

  const buyerCompanyOptions = useCallback(
    () => buildDropdownOptions(allData.map((item) => item.buyerCompany)),
    [allData],
  );

  const sellerCompanyOptions = useCallback(
    () => buildDropdownOptions(allData.map((item) => item.supplierCompany)),
    [allData],
  );

  const sellerNameOptions = useCallback(
    () => buildDropdownOptions(allData.map((item) => getSellerName(item))),
    [allData],
  );

  const consigneeOptions = useCallback(
    () => buildDropdownOptions(allData.map((item) => getConsigneeDisplay(item))),
    [allData],
  );

  const groupOptions = useCallback(
    () =>
      buildDropdownOptions(
        allData.map((item) => getGroupName(item, groupMap)).concat(
          Object.values(groupMap || {}),
        ),
      ),
    [allData, groupMap],
  );

  const filteredData = useCallback(() => {
    let result = [...allData];
    
    if (searchInput) {
      const searchLower = normalizeText(searchInput);
      result = result.filter((item) => {
        const fields = [
          item.supplierCompany,
          item.buyerCompany,
          item.saudaNo,
          item.commodity,
          item.paymentTerms,
          getSellerName(item),
          getConsigneeDisplay(item),
          getGroupName(item, groupMap),
        ];

        return fields.some((field) => normalizeText(field).includes(searchLower));
      });
    }
    
    if (selectedSellerCompany?.value) {
      result = result.filter(
        (item) =>
          normalizeText(item.supplierCompany) ===
          normalizeText(selectedSellerCompany.value),
      );
    }
    
    if (selectedBuyerCompany?.value) {
      result = result.filter(
        (item) =>
          normalizeText(item.buyerCompany) ===
          normalizeText(selectedBuyerCompany.value),
      );
    }

    if (selectedSellerName?.value) {
      result = result.filter(
        (item) =>
          normalizeText(getSellerName(item)) ===
          normalizeText(selectedSellerName.value),
      );
    }

    if (selectedConsignee?.value) {
      result = result.filter(
        (item) =>
          normalizeText(getConsigneeDisplay(item)) ===
          normalizeText(selectedConsignee.value),
      );
    }

    if (selectedGroup?.value) {
      result = result.filter(
        (item) =>
          normalizeText(getGroupName(item, groupMap)) ===
          normalizeText(selectedGroup.value),
      );
    }
    
    if (startDate) {
      const filterDate = new Date(startDate);
      filterDate.setHours(0, 0, 0, 0);
      result = result.filter((item) => {
        const itemDate = new Date(item.poDate || item.createdAt);
        return itemDate >= filterDate;
      });
    }
    
    if (endDate) {
      const filterDate = new Date(endDate);
      filterDate.setHours(23, 59, 59, 999);
      result = result.filter((item) => {
        const itemDate = new Date(item.poDate || item.createdAt);
        return itemDate <= filterDate;
      });
    }
    
    return result;
  }, [
    allData,
    searchInput,
    selectedSellerCompany,
    selectedBuyerCompany,
    selectedSellerName,
    selectedConsignee,
    selectedGroup,
    startDate,
    endDate,
    groupMap,
  ]);

  useEffect(() => {
    const filtered = filteredData();
    setTotalItems(filtered.length);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setData(filtered.slice(startIndex, endIndex));
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchGroupData();
    fetchData();
  }, [fetchGroupData, fetchData]);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate(null);
    setEndDate(null);
    setSelectedBuyerCompany(null);
    setSelectedSellerCompany(null);
    setSelectedSellerName(null);
    setSelectedConsignee(null);
    setSelectedGroup(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchInput,
    selectedSellerCompany,
    selectedBuyerCompany,
    selectedSellerName,
    selectedConsignee,
    selectedGroup,
    startDate,
    endDate,
  ]);

  const getLast3Digits = (num) => {
    if (num === undefined || num === null) return "N/A";
    const str = String(num);
    return str.slice(-3);
  };

  const handleDownloadExcel = async () => {
    try {
      const toastId = toast.loading("Preparing Excel...");
      const exportData = filteredData();
      
      const excelRows = exportData.map((item, index) => {
        const quantity = item.quantity || 0;
        let pendingQuantity = item.pendingQuantity;
        if ((pendingQuantity === undefined || pendingQuantity === null || (pendingQuantity === 0 && item.status === "active")) && item.status !== "closed") {
          pendingQuantity = quantity;
        } else {
          pendingQuantity = pendingQuantity || 0;
        }
        const loadedQuantity = quantity - pendingQuantity;

        return {
          "Sl No": index + 1,
          "Date": formatDate(item.poDate || item.createdAt),
          "Sauda No": item.saudaNo || "N/A",
          "Seller Company": item.supplierCompany || "N/A",
          "Seller Name": getSellerName(item) || "N/A",
          "Buyer Company": item.buyerCompany || "N/A",
          "Consignee": getConsigneeDisplay(item),
          "Group": getGroupName(item, groupMap) || "N/A",
          "Commodity": item.commodity || "N/A",
          "Total Quantity": quantity,
          "Pending Quantity": getLast3Digits(pendingQuantity),
          "Loaded Quantity": loadedQuantity.toFixed(2),
          "Rate": item.rate || 0,
          "Payment Terms": item.paymentTerms || "N/A",
        };
      });

      if (excelRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("No data available to download.");
        return;
      }

      await generateExcel(excelRows, "PendingSauda.xlsx");
      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("Failed to generate Excel");
    }
  };

  const headers = [
    "Sl No",
    "Date",
    "Sauda No",
    "Seller Company",
    "Seller Name",
    "Buyer Company",
    "Consignee",
    "Commodity",
    "Total Qty",
    "Pending Qty",
    "Loaded Qty",
    "Rate",
    "Payment Terms",
    "Status"
  ];

  const rows = data.map((item, index) => {
    const quantity = item.quantity || 0;
    let pendingQuantity = item.pendingQuantity;
    if ((pendingQuantity === undefined || pendingQuantity === null || (pendingQuantity === 0 && item.status === "active")) && item.status !== "closed") {
      pendingQuantity = quantity;
    } else {
      pendingQuantity = pendingQuantity || 0;
    }
    const loadedQuantity = quantity - pendingQuantity;

    return [
      (currentPage - 1) * itemsPerPage + index + 1,
      formatDate(item.poDate || item.createdAt),
      item.saudaNo || "N/A",
      <span key={`seller-co-${item._id}`} className="font-semibold text-slate-700">{item.supplierCompany || "N/A"}</span>,
      getSellerName(item) || "N/A",
      item.buyerCompany || "N/A",
      getConsigneeDisplay(item),
      item.commodity || "N/A",
      quantity,
      <span key={`pending-${item._id}`} className="text-amber-600 font-bold">{getLast3Digits(pendingQuantity)}</span>,
      loadedQuantity.toFixed(2),
      item.rate || 0,
      item.paymentTerms || "N/A",
      <span
        key={`status-${item._id}`}
        className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"
      >
        Active
      </span>,
    ];
  });

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Pending Sauda"
        subtitle="Manage pending saudas by seller and date"
        icon={FaTruckLoading}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FaSearch className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Filter & Search</h3>
                <p className="text-sm text-slate-500">Filter pending sauda with independent responsive fields</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Search
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Enter search term..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Group
                  </label>
                  <DataDropdown
                    options={groupOptions()}
                    selectedOptions={selectedGroup}
                    onChange={setSelectedGroup}
                    placeholder="Select Group"
                    isMulti={false}
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Seller Name
                  </label>
                  <DataDropdown
                    options={sellerNameOptions()}
                    selectedOptions={selectedSellerName}
                    onChange={setSelectedSellerName}
                    placeholder="Select Seller Name"
                    isMulti={false}
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Consignee
                  </label>
                  <DataDropdown
                    options={consigneeOptions()}
                    selectedOptions={selectedConsignee}
                    onChange={setSelectedConsignee}
                    placeholder="Select Consignee"
                    isMulti={false}
                    isClearable
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Seller Company
                  </label>
                  <DataDropdown
                    options={sellerCompanyOptions()}
                    selectedOptions={selectedSellerCompany}
                    onChange={setSelectedSellerCompany}
                    placeholder="Select Seller Company"
                    isMulti={false}
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                    Buyer Company
                  </label>
                  <DataDropdown
                    options={buyerCompanyOptions()}
                    selectedOptions={selectedBuyerCompany}
                    onChange={setSelectedBuyerCompany}
                    placeholder="Select Buyer Company"
                    isMulti={false}
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Start Date
                  </label>
                  <DateSelector
                    selectedDate={startDate}
                    onChange={setStartDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    End Date
                  </label>
                  <DateSelector
                    selectedDate={endDate}
                    onChange={setEndDate}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 min-w-[160px] px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all duration-200 border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="flex-1 min-w-[160px] px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><Loading /></div>
            ) : data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Tables headers={headers} rows={rows} />
                </div>
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-500 font-medium">
                No pending entries found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default PendingLoadingList;
