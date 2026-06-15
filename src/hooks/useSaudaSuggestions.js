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
          buyerCompany: selectedBuyer?.value,
          saudaNo: trimmed,
          limit: 20,
        };

        const res = await api.get("/loading-entries/sauda-suggestions", { params });
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const list = data.map((o) => ({
          ...o,
          label: `Sauda: ${o.saudaNo} | Buyer: ${o.buyerCompany || "N/A"} | Supplier: ${o.supplier?.sellerName || o.supplierCompany || "N/A"}`,
        }));

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

    // Auto-fill logic (Buyer Company dropdown is based on buyerCompany value)
    if (o?.buyerCompany) {
      const buyerCompany = String(o.buyerCompany || "").trim();
      const buyer = filteredBuyers.find(
        (b) =>
          String(b.value || "")
            .trim()
            .toLowerCase() === buyerCompany.toLowerCase(),
      );

      if (buyer) {
        setSelectedBuyer(buyer);
      } else {
        setSelectedBuyer({
          value: buyerCompany,
          label: capitalizeWords(buyerCompany),
          name: buyerCompany,
          consignees: [],
        });
      }
    }

    if (o.consignee) {
      setSelectedConsignee({
        value: o.consignee,
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
