import { useState } from "react";
import { toast } from "react-toastify";

const useLoadingEntrySearch = (api, selectedGroup, selectedBuyer, selectedSellerName, selectedSellerCompany, saudaSearch) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    const trimmedSauda = saudaSearch.trim();

    if (!selectedGroup || (Array.isArray(selectedGroup) && selectedGroup.length === 0)) {
      toast.error("Please select a group");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const groupIds = Array.isArray(selectedGroup)
        ? selectedGroup.map((g) => g.value).join(",")
        : selectedGroup?.value;

      const response = await api.get("/loading-entries/saudas", {
        params: {
          groupId: groupIds,
          buyerId: selectedBuyer?.value,
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
  };

  return {
    results,
    setResults,
    loading,
    error,
    handleSearch,
  };
};

export default useLoadingEntrySearch;
