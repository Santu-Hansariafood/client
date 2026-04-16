import { useState, useCallback } from "react";
import { toast } from "react-toastify";

const useLoadingEntrySearch = (
  api,
  selectedGroup,
  selectedBuyer,
  selectedConsignee,
  selectedSellerName,
  selectedSellerCompany,
  saudaSearch,
) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    const trimmedSauda = saudaSearch.trim();

    if (!selectedGroup?.value) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await api.get("/loading-entries/saudas", {
        params: {
          groupId: selectedGroup.value,
          buyerCompany: selectedBuyer?.value,
          consigneeName: selectedConsignee?.name,
          sellerId: selectedSellerName?.value,
          sellerCompany: selectedSellerCompany?.name,
          saudaNo: trimmedSauda || undefined,
          limit: 1000,
        },
      });

      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch saudas");
      toast.error("Failed to load saudas");
    } finally {
      setLoading(false);
    }
  }, [
    api,
    selectedGroup,
    selectedBuyer,
    selectedConsignee,
    selectedSellerName,
    selectedSellerCompany,
    saudaSearch,
  ]);

  return {
    results,
    setResults,
    loading,
    error,
    handleSearch,
  };
};

export default useLoadingEntrySearch;
