import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { capitalizeWords } from "../utils/textUtils/textUtils";

const useLoadingEntryData = (api, userRole) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  
  const [consignees, setConsignees] = useState([]);
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [allConsignees, setAllConsignees] = useState([]);

  const [allSellers, setAllSellers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSellerName, setSelectedSellerName] = useState(null);
  
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);
  const [transporters, setTransporters] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [groupsRes, sellersRes, transportersRes] = await Promise.all([
          api.get("/groups"),
          api.get("/sellers"),
          api.get("/transporters", { params: { limit: 0 } }),
        ]);

        const groupData = Array.isArray(groupsRes.data?.data)
          ? groupsRes.data.data
          : Array.isArray(groupsRes.data)
            ? groupsRes.data
            : [];
        const groupOptions = groupData
          .map((g) => ({
            value: g._id,
            label: capitalizeWords(g.groupName),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setGroups(groupOptions);

        const sellerData = Array.isArray(sellersRes.data?.data)
          ? sellersRes.data.data
          : Array.isArray(sellersRes.data)
            ? sellersRes.data
            : [];
        const sellerOptions = sellerData
          .map((s) => ({
            value: s._id,
            label: capitalizeWords(s.sellerName),
            companies: s.companies || [],
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setAllSellers(sellerOptions);
        setSellers(sellerOptions);

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

        if (userRole === "Seller") {
          const consigneesRes = await api.get("/consignees");
          const consigneeData = Array.isArray(consigneesRes.data?.data)
            ? consigneesRes.data.data
            : Array.isArray(consigneesRes.data)
              ? consigneesRes.data
              : [];
          const consigneeOptions = consigneeData
            .map((c) => ({
              value: c.name,
              label: capitalizeWords(c.name),
              name: c.name,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setAllConsignees(consigneeOptions);
          setConsignees(consigneeOptions);
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        toast.error("Failed to load initial data");
      }
    };

    loadInitialData();
  }, [api, userRole]);

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
        const buyers = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        const formatted = buyers
          .flatMap((b) => {
            const consigneesForBuyer = b.consignees || [];
            const companyNames = Array.isArray(b.companyNames)
              ? b.companyNames
              : [];

            return companyNames.map((companyName) => ({
              value: companyName,
              label: capitalizeWords(companyName),
              name: companyName,
              buyerId: b._id,
              consignees: consigneesForBuyer,
            }));
          });

        // Dedupe companies (single selector dropdown)
        const uniqueByCompany = new Map();
        formatted.forEach((opt) => {
          const key = String(opt.value || "").trim().toLowerCase();
          if (!key) return;
          if (!uniqueByCompany.has(key)) {
            uniqueByCompany.set(key, opt);
            return;
          }

          // Merge consignee lists if the same company exists under multiple buyers
          const existing = uniqueByCompany.get(key);
          const existingConsignees = Array.isArray(existing?.consignees)
            ? existing.consignees
            : existing?.consignees || [];
          const newConsignees = Array.isArray(opt?.consignees)
            ? opt.consignees
            : opt?.consignees || [];

          const merged = [...existingConsignees, ...newConsignees].filter(
            Boolean,
          );

          const mergedUnique = new Map();
          merged.forEach((c) => {
            const cKey =
              (typeof c === "string" ? c : c?.name || c?.label || c?._id) ||
              "";
            const normKey = String(cKey).trim().toLowerCase();
            if (!normKey) return;
            mergedUnique.set(normKey, c);
          });

          uniqueByCompany.set(key, {
            ...existing,
            consignees: Array.from(mergedUnique.values()),
          });
        });

        const finalList = Array.from(uniqueByCompany.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        );

        setFilteredBuyers(finalList);
        setSelectedBuyer(finalList.length === 1 ? finalList[0] : null);
        setSelectedConsignee(null);
        setConsignees(finalList.length === 1 ? finalList[0].consignees || [] : []);
      } catch (err) {
        console.error("Error loading buyer companies:", err);
        toast.error("Failed to load buyer companies");
        setFilteredBuyers([]);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees([]);
      }
    };

    loadBuyersForGroup();
  }, [selectedGroup, userRole, allConsignees, api]);

  useEffect(() => {
    if (userRole === "Seller") return;

    if (!selectedBuyer) {
      setConsignees([]);
      setSelectedConsignee(null);
      return;
    }

    const list = (selectedBuyer.consignees || selectedBuyer.consigneeIds || [])
      .map((c) => {
        const name = typeof c === "string" ? c : c?.name || c?.label || "";
        return {
          value: name,
          label: capitalizeWords(name),
          name: name,
        };
      })
      .filter((c) => c.value)
      .sort((a, b) => a.label.localeCompare(b.label));

    setConsignees(list);
    setSelectedConsignee(null);
  }, [userRole, selectedBuyer]);

  useEffect(() => {
    if (!selectedBuyer) {
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
            buyerCompany: selectedBuyer.value,
            limit: 2000,
          },
        });

        if (ignore) return;

        const data = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const uniqSellers = new Map();
        data.forEach((row) => {
          const supplierId =
            row.supplierId ||
            row.supplier?._id ||
            row.supplier?.id ||
            null;

          if (supplierId) {
            const safeName = row.supplier?.sellerName || row.supplier || "N/A";
            const name = capitalizeWords(String(safeName));
            const key = String(supplierId);

            if (!uniqSellers.has(key)) {
              uniqSellers.set(key, {
                value: key,
                label: name,
              });
            }
          }
        });

        let list = Array.from(uniqSellers.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        );

        if (list.length === 0) {
          list = allSellers;
        }

        setSellers(list);
        setSelectedSellerName(null);
        setSellerCompanies([]);
        setSelectedSellerCompany(null);
      } catch (error) {
        if (!ignore) {
          setSellers(allSellers);
          setSelectedSellerName(null);
          setSellerCompanies([]);
          setSelectedSellerCompany(null);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [selectedBuyer, selectedGroup, allSellers, api]);

  useEffect(() => {
    if (!selectedSellerName) {
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
            buyerCompany: selectedBuyer?.value,
            sellerId: selectedSellerName.value,
            limit: 2000,
          },
        });

        if (ignore) return;

        const data = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const uniqCompanies = new Map();
        data.forEach((row) => {
          if (row.supplierCompany) {
            const name = row.supplierCompany.trim();
            if (!uniqCompanies.has(name.toLowerCase())) {
              uniqCompanies.set(name.toLowerCase(), {
                value: name,
                label: capitalizeWords(name),
                name,
              });
            }
          }
        });

        let list = Array.from(uniqCompanies.values()).sort((a, b) =>
          a.label.localeCompare(b.label),
        );

        if (list.length === 0) {
          const fullSeller = allSellers.find(
            (s) => s.value === selectedSellerName.value,
          );
          const rawCompanies = Array.isArray(fullSeller?.companies)
            ? fullSeller.companies
            : [];
          list = rawCompanies.map((c) => ({
            value: c,
            label: capitalizeWords(c),
            name: c,
          }));
        }

        setSellerCompanies(list);
        setSelectedSellerCompany(null);
      } catch (error) {
        if (!ignore) {
          const fullSeller = allSellers.find(
            (s) => s.value === selectedSellerName.value,
          );
          const rawCompanies = Array.isArray(fullSeller?.companies)
            ? fullSeller.companies
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
  }, [selectedSellerName, selectedGroup, selectedBuyer, allSellers, api]);

  return {
    groups,
    selectedGroup,
    setSelectedGroup,
    filteredBuyers,
    selectedBuyer,
    setSelectedBuyer,
    consignees,
    selectedConsignee,
    setSelectedConsignee,
    allConsignees,
    allSellers,
    sellers,
    selectedSellerName,
    setSelectedSellerName,
    sellerCompanies,
    selectedSellerCompany,
    setSelectedSellerCompany,
    transporters,
  };
};

export default useLoadingEntryData;
