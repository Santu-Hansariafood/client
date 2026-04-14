import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { capitalizeWords } from "../utils/textUtils/textUtils";

const useSaudaSuggestions = (api, selectedGroup, selectedBuyer, filteredBuyers, allSellers, setSelectedBuyer, setSelectedConsignee, setSelectedSellerName, setSelectedSellerCompany) => {
  const [saudaSearch, setSaudaSearch] = useState("");
  const [saudaSuggestions, setSaudaSuggestions] = useState([]);
  const [isSaudaSuggestOpen, setIsSaudaSuggestOpen] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = saudaSearch.trim();
      if (!trimmed) {
        setSaudaSuggestions([]);
        return;
      }

      try {
        const params = {
          groupId: selectedGroup?.value,
          buyerId: selectedBuyer?.value,
          saudaNo: trimmed,
          limit: 500,
        };

        const res = await api.get("/loading-entries/saudas", { params });
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

        const uniq = new Map();
        data.forEach((o) => {
          if (!uniq.has(o.saudaNo)) {
            uniq.set(o.saudaNo, {
              ...o,
              label: `Sauda: ${o.saudaNo} | Buyer: ${o.buyerCompany || "N/A"} | Supplier: ${o.supplier || "N/A"}`,
            });
          }
        });

        const list = Array.from(uniq.values());
        setSaudaSuggestions(list);
      } catch (err) {
        console.error("Sauda suggestions error:", err);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delayDebounce);
  }, [saudaSearch, selectedGroup, selectedBuyer, api]);

  const handleSaudaSelection = (o) => {
    setSaudaSearch(String(o.saudaNo || ""));
    setIsSaudaSuggestOpen(false);

    // Auto-fill logic
    if (o.buyerId || o.buyer) {
      const buyer = filteredBuyers.find(
        (b) => b.value === (o.buyerId || o.buyer?._id) || b.name === (o.buyerCompany || o.buyer),
      );
      if (buyer) {
        setSelectedBuyer(buyer);
      } else if (o.buyerId || o.buyer) {
        // Fallback if not found in filtered list
        setSelectedBuyer({
          value: o.buyerId || o.buyer?._id,
          label: capitalizeWords(o.buyerCompany || o.buyer?.name || "N/A"),
          name: o.buyerCompany || o.buyer?.name,
          consignees: [], // We don't have the list here, but selection will trigger search
        });
      }
    }

    if (o.consignee) {
      setSelectedConsignee({
        name: o.consignee,
        label: capitalizeWords(o.consignee),
      });
    }

    if (o.supplier || o.supplierId) {
      const seller = allSellers.find(
        (s) => s.value === o.supplier || s.value === o.supplierId,
      );
      if (seller) setSelectedSellerName(seller);
    }

    if (o.supplierCompany) {
      setSelectedSellerCompany({
        name: o.supplierCompany,
        label: capitalizeWords(o.supplierCompany),
      });
    }
  };

  return {
    saudaSearch,
    setSaudaSearch,
    saudaSuggestions,
    isSaudaSuggestOpen,
    setIsSaudaSuggestOpen,
    handleSaudaSelection,
  };
};

export default useSaudaSuggestions;
