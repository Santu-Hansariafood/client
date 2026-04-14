import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { capitalizeWords } from "../utils/textUtils/textUtils";

const useLoadingEntryData = (api, userRole) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState([]);
  
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
          api.get("/groups/all"),
          api.get("/seller-details/all"),
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
          const consigneesRes = await api.get("/consignees/all");
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
      const groupIds = Array.isArray(selectedGroup)
        ? selectedGroup.map((g) => g.value).filter(Boolean)
        : selectedGroup?.value
          ? [selectedGroup.value]
          : [];

      if (groupIds.length === 0) {
        setFilteredBuyers([]);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees(userRole === "Seller" ? allConsignees : []);
        return;
      }

      try {
        const res = await api.get("/loading-entries/buyers", {
          params: { groupId: groupIds.join(",") },
        });
        const buyers = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        const formatted = buyers
          .map((b) => ({
            value: b._id,
            label: capitalizeWords(b.name),
            name: b.name,
            consignees: b.consignees || [],
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setFilteredBuyers(formatted);
        setSelectedBuyer(null);
        setSelectedConsignee(null);
        setConsignees([]);
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

    const fullBuyer = filteredBuyers.find((b) => b.value === selectedBuyer.value);
    const list = (fullBuyer?.consignees || [])
      .map((c) => ({
        value: c.name,
        label: capitalizeWords(c.name),
        name: c.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    setConsignees(list);
    setSelectedConsignee(null);
  }, [userRole, selectedBuyer, filteredBuyers]);

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
        const groupIds = Array.isArray(selectedGroup)
          ? selectedGroup.map((g) => g.value).join(",")
          : selectedGroup?.value;

        const response = await api.get("/loading-entries/saudas", {
          params: {
            groupId: groupIds,
            buyerId: selectedBuyer.value,
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
          if (row.supplierId) {
            const name = capitalizeWords(row.supplier || "N/A");
            if (!uniqSellers.has(row.supplierId)) {
              uniqSellers.set(row.supplierId, {
                value: row.supplierId,
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
        const groupIds = Array.isArray(selectedGroup)
          ? selectedGroup.map((g) => g.value).join(",")
          : selectedGroup?.value;

        const response = await api.get("/loading-entries/saudas", {
          params: {
            groupId: groupIds,
            buyerId: selectedBuyer?.value,
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
