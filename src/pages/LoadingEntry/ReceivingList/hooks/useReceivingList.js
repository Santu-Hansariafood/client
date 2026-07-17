import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

export const useReceivingList = (userRole) => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [sentFilter, setSentFilter] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [masterDataCache, setMasterDataCache] = useState(null);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSellerEmail, setSelectedSellerEmail] = useState("");

  const getMasterData = useCallback(async () => {
    if (masterDataCache) return masterDataCache;

    try {
      const [consigneeData, supplierData, buyerData, companyData, commodityData] =
        await Promise.all([
          api.get("/consignees").then(res => res.data),
          api.get("/seller-company").then(res => res.data),
          api.get("/buyers").then(res => res.data),
          api.get("/companies").then(res => res.data),
          api.get("/commodities").then(res => res.data),
        ]);

      const data = {
        consigneeData: Array.isArray(consigneeData) ? consigneeData : 
                      (Array.isArray(consigneeData.data) ? consigneeData.data : 
                      (Array.isArray(consigneeData.data?.data) ? consigneeData.data.data : [])),
        supplierData: Array.isArray(supplierData) ? supplierData : 
                      (Array.isArray(supplierData.data) ? supplierData.data : 
                      (Array.isArray(supplierData.data?.data) ? supplierData.data.data : [])),
        buyerData: Array.isArray(buyerData) ? buyerData : 
                      (Array.isArray(buyerData.data) ? buyerData.data : 
                      (Array.isArray(buyerData.data?.data) ? buyerData.data.data : [])),
        companyData: Array.isArray(companyData) ? companyData : 
                      (Array.isArray(companyData.data) ? companyData.data : 
                      (Array.isArray(companyData.data?.data) ? companyData.data.data : [])),
        commodityData: Array.isArray(commodityData) ? commodityData : 
                      (Array.isArray(commodityData.data) ? commodityData.data : 
                      (Array.isArray(commodityData.data?.data) ? commodityData.data.data : [])),
      };
      setMasterDataCache(data);
      return data;
    } catch (err) {
      console.error("Error fetching master data:", err);
      throw err;
    }
  }, [masterDataCache]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/loading-entries/receiving", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          sentStatus: sentFilter,
          role: userRole,
        },
      });

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      setLoadingEntries(data);
      setTotalItems(Number(payload.total) || 0);
    } catch (error) {
      console.error("Error fetching receiving entries:", error);
      setError("Failed to load receiving entries. Please check your connection.");
      toast.error("Failed to fetch receiving entries");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, sentFilter, userRole]);

  const fetchSellerCompanies = useCallback(async () => {
    try {
      const res = await api.get("/seller-company");
      const sellers = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setSellerCompanies(sellers);
    } catch (err) {
      console.error("Error fetching seller companies:", err);
    }
  }, []);

  const handleToggleSentStatus = useCallback(
    async (entry) => {
      const newStatus = entry.sentStatus === "Sent" ? "Not Sent" : "Sent";
      try {
        await api.put(`/loading-entries/${entry._id}`, {
          sentStatus: newStatus,
        });
        toast.success(`Status updated to ${newStatus}`);
        fetchData();
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      }
    },
    [fetchData],
  );

  useEffect(() => {
    fetchData();
    fetchSellerCompanies();
  }, [fetchData, fetchSellerCompanies]);

  const rows = useMemo(
    () =>
      loadingEntries.map((entry) => {
        const docs = entry.documents || {};
        const attachmentCount = [
          docs.kantaSlip,
          docs.unloadingChallan,
          docs.partyBillCopy,
          entry.documentUrl,
        ].filter((url) => typeof url === "string" && url.trim() !== "").length;

        return {
          ...entry,
          attachmentCount,
          loadingDateFormatted: formatDate(entry.loadingDate),
          unloadingDateFormatted: formatDate(entry.unloadingDate),
          amountFormatted: ((entry.unloadingWeight && entry.unloadingWeight > 0 ? entry.unloadingWeight : entry.loadingWeight || 0) * (entry.actualRate || 0)).toFixed(2),
        };
      }),
    [loadingEntries],
  );

  return {
    loadingEntries,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    searchInput,
    sentFilter,
    selectedEntry,
    showPopup,
    sellerCompanies,
    selectedSellerEmail,
    rows,
    getMasterData,
    setCurrentPage,
    setItemsPerPage,
    setSearchInput,
    setSentFilter,
    setSelectedEntry,
    setShowPopup,
    setSelectedSellerEmail,
    handleToggleSentStatus,
    fetchData,
  };
};
