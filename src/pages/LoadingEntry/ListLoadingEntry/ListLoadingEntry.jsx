import React, {
  lazy,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import {
  MdVisibility,
  MdEdit,
  MdDelete,
  MdDownload,
  MdPictureAsPdf,
} from "react-icons/md";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaClipboardList } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { downloadFile } from "../../../utils/fileDownloader";
import stateCityData from "../../../data/state-city.json";

const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const FileUpload = lazy(() => import("../../../common/FileUpload/FileUpload"));

const DEBOUNCE_DELAY = 500;
const DEFAULT_ITEMS_PER_PAGE = 10;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
  } catch {
    return "N/A";
  }
};

const validateEntryData = (entry) => {
  const errors = [];
  if (!entry.saudaNo?.trim()) errors.push("Sauda number is required");
  if (!entry.lorryNumber?.trim()) errors.push("Lorry number is required");
  if (entry.loadingWeight && isNaN(parseFloat(entry.loadingWeight)))
    errors.push("Invalid loading weight");
  if (entry.freightRate && isNaN(parseFloat(entry.freightRate)))
    errors.push("Invalid freight rate");
  return errors;
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
};

const ListLoadingEntry = () => {
  const { userRole, mobile: authMobile } = useAuth();
  const location = useLocation();
  const mobile = location.state?.mobile || authMobile;

  const stateOptions = useMemo(() => {
    return stateCityData.map((item) => ({
      value: item.state,
      label: item.state,
    }));
  }, []);

  const [loadingEntries, setLoadingEntries] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const [buyerMap, setBuyerMap] = useState({});
  const [paymentTermsMap, setPaymentTermsMap] = useState({});
  const [brokerageMap, setBrokerageMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [alreadyLoadedMap, setAlreadyLoadedMap] = useState({});
  const [pendingQuantityMap, setPendingQuantityMap] = useState({});
  const [transporters, setTransporters] = useState([]);
  const [transporterMap, setTransporterMap] = useState({});
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [currentSelfOrder, setCurrentSelfOrder] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    saudaNo: "",
    lorryNumber: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestions, setSuggestions] = useState({
    sellers: [],
    saudas: [],
    lorries: [],
  });
  const [itemsPerPage, setItemsPerPage] = useLocalStorage(
    "loadingEntriesPerPage",
    DEFAULT_ITEMS_PER_PAGE,
  );
  const [exporting, setExporting] = useState(false);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const staticDataLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWithAbort = useCallback(async (url, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await api.get(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      return response;
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    }
  }, []);

  const fetchStaticData = useCallback(async () => {
    if (staticDataLoadedRef.current) return;

    try {
      const [sellersRes, transportersRes, ordersRes] = await Promise.all([
        api.get("/sellers"),
        api.get("/transporters", { params: { limit: 0 } }),
        api.get("/self-order", { params: { limit: 0 } }),
      ]);

      if (!isMountedRef.current) return;

      const sellersData = Array.isArray(sellersRes.data)
        ? sellersRes.data
        : sellersRes.data?.data || [];
      const transportersData = Array.isArray(transportersRes.data)
        ? transportersRes.data
        : transportersRes.data?.data || [];
      const ordersData = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.data || [];

      setSellerMap(
        Object.fromEntries(sellersData.map((s) => [s._id, s.sellerName])),
      );
      setBuyerMap(
        Object.fromEntries(ordersData.map((o) => [o.saudaNo, o.buyerCompany])),
      );
      setPaymentTermsMap(
        Object.fromEntries(
          ordersData.map((o) => [o.saudaNo, o.paymentTerms || ""]),
        ),
      );
      setBrokerageMap(
        Object.fromEntries(
          ordersData.map((o) => [
            o.saudaNo,
            o.buyerBrokerage?.brokerageSupplier || 0,
          ]),
        ),
      );
      setStatusMap(
        Object.fromEntries(
          ordersData.map((o) => [o.saudaNo, o.status || "active"]),
        ),
      );
      setTransporterMap(
        Object.fromEntries(transportersData.map((t) => [t._id, t.name])),
      );
      setTransporters(
        transportersData.map((t) => ({
          value: t._id,
          label: `${t.name} - ${t.mobile}`,
          name: t.name,
        })),
      );

      setAlreadyLoadedMap(
        Object.fromEntries(
          ordersData.map((order) => {
            const quantity = order.quantity || 0;
            let pendingQuantity = order.pendingQuantity;
            if (
              (pendingQuantity === undefined ||
                pendingQuantity === null ||
                (pendingQuantity === 0 && order.status === "active")) &&
              order.status !== "closed"
            ) {
              pendingQuantity = quantity;
            } else {
              pendingQuantity = pendingQuantity || 0;
            }
            return [order.saudaNo, quantity - pendingQuantity];
          }),
        ),
      );

      setPendingQuantityMap(
        Object.fromEntries(
          ordersData.map((order) => {
            const quantity = order.quantity || 0;
            let pendingQuantity = order.pendingQuantity;
            if (
              (pendingQuantity === undefined ||
                pendingQuantity === null ||
                (pendingQuantity === 0 && order.status === "active")) &&
              order.status !== "closed"
            ) {
              pendingQuantity = quantity;
            } else {
              pendingQuantity = pendingQuantity || 0;
            }
            return [order.saudaNo, pendingQuantity];
          }),
        ),
      );

      staticDataLoadedRef.current = true;
    } catch (error) {
      console.error("Error fetching static data:", error);
      staticDataLoadedRef.current = true;
      if (isMountedRef.current) {
        toast.error("Failed to load reference data");
      }
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!userRole) return;

    try {
      const res = await api.get("/loading-entries/suggestions", {
        params: { role: userRole, mobile },
      });

      if (isMountedRef.current && res.data) {
        setSuggestions(res.data);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }, [userRole, mobile]);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!userRole || !isMountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const searchParams = {
        page: currentPage,
        limit: itemsPerPage,
        role: userRole,
        mobile: mobile,
      };

      if (filters.search) {
        searchParams.search = filters.search;
      }
      if (filters.saudaNo) {
        searchParams.saudaNo = filters.saudaNo;
      }
      if (filters.lorryNumber) {
        searchParams.lorryNumber = filters.lorryNumber;
      }

      const response = await fetchWithAbort("/loading-entries", {
        params: searchParams,
      });

      if (!response || !isMountedRef.current) return;

      let entriesData = [];
      let total = 0;

      if (Array.isArray(response.data)) {
        entriesData = response.data;
        total = entriesData.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        entriesData = response.data.data;
        total = response.data.total || entriesData.length;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        entriesData = response.data.items;
        total = response.data.total || entriesData.length;
      }

      setLoadingEntries(entriesData);
      setTotalItems(total);
    } catch (error) {
      console.error("Error fetching entries:", error);
      if (isMountedRef.current && error.name !== "AbortError") {
        toast.error("Failed to fetch loading entries");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [userRole, mobile, filters, currentPage, itemsPerPage, fetchWithAbort]);

  useEffect(() => {
    if (!userRole) return;

    fetchStaticData();
    fetchSuggestions();
  }, [userRole, fetchStaticData, fetchSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback(
    (size) => {
      setItemsPerPage(size);
      setCurrentPage(1);
    },
    [setItemsPerPage],
  );

  const handleSearchChange = useCallback((q, field) => {
    setFilters((prev) => {
      if (prev[field] === q) return prev;
      return { ...prev, [field]: q || "" };
    });
    setCurrentPage(1);
  }, []);

  const handleGeneralSearch = useCallback(
    (q) => handleSearchChange(q, "search"),
    [handleSearchChange],
  );
  const handleSaudaSearch = useCallback(
    (q) => handleSearchChange(q, "saudaNo"),
    [handleSearchChange],
  );
  const handleLorrySearch = useCallback(
    (q) => handleSearchChange(q, "lorryNumber"),
    [handleSearchChange],
  );

  const clearFilters = useCallback(() => {
    setFilters({ search: "", saudaNo: "", lorryNumber: "" });
    setCurrentPage(1);
  }, []);

  const handleView = useCallback((entry) => {
    setSelectedEntry(entry);
    setPopupType("view");
  }, []);

  const handleEdit = useCallback(async (entry) => {
    setSelectedEntry(entry);
    let newEditEntry = {
      ...entry,
      loadingDate: entry.loadingDate
        ? new Date(entry.loadingDate).toISOString().slice(0, 10)
        : "",
      dateOfIssue: entry.dateOfIssue
        ? new Date(entry.dateOfIssue).toISOString().slice(0, 10)
        : "",
      unloadingDate: entry.unloadingDate
        ? new Date(entry.unloadingDate).toISOString().slice(0, 10)
        : "",
      deliveryDate: entry.deliveryDate
        ? new Date(entry.deliveryDate).toISOString().slice(0, 10)
        : "",
      documents: entry.documents || {
        kantaSlip: null,
        unloadingChallan: null,
        partyBillCopy: null,
      },
      qualityClaims: entry.qualityClaims || [],
      manualClaim: entry.manualClaim || false,
      manualClaimAmount: entry.manualClaimAmount || 0,
    };

    // Fetch both self-order and quality parameters
    if (entry.saudaNo) {
      try {
        // Fetch self-order, quality parameters, and company in parallel
        const [selfOrderResponse, qualityParamsResponse] = await Promise.all([
          api.get("/self-order", {
            params: { search: entry.saudaNo, limit: 1 },
          }),
          api.get("/quality-parameters"),
        ]);

        const orders =
          selfOrderResponse.data.data || selfOrderResponse.data || [];
        const selfOrder = orders.find(
          (o) =>
            String(o.saudaNo).toLowerCase().trim() ===
            String(entry.saudaNo).toLowerCase().trim(),
        );
        setCurrentSelfOrder(selfOrder || null);

        // Fetch company data
        if (selfOrder?.companyId) {
          try {
            const companyResponse = await api.get(`/companies/${selfOrder.companyId}`);
            console.log("[DEBUG company fetch by ID] companyResponse:", companyResponse);
            const company = companyResponse.data?.data || companyResponse.data;
            console.log("[DEBUG company fetch by ID] company:", company);
            setCurrentCompany(company || null);
          } catch (error) {
            console.error("Error fetching company by ID:", error);
            // Fallback: try searching by name if ID fetch fails
            if (selfOrder?.buyerCompany) {
              try {
                const companySearchResponse = await api.get("/companies", {
                  params: { search: selfOrder.buyerCompany, limit: 1 },
                });
                console.log("[DEBUG company fallback search] companySearchResponse:", companySearchResponse);
                const companies = Array.isArray(companySearchResponse.data)
                  ? companySearchResponse.data
                  : (companySearchResponse.data?.data || []);
                const company = companies.find(
                  (c) =>
                    c.companyName.toLowerCase() ===
                    selfOrder.buyerCompany.toLowerCase(),
                );
                console.log("[DEBUG company fallback search] company:", company);
                setCurrentCompany(company || null);
              } catch (searchError) {
                console.error("Error fetching company by name:", searchError);
                setCurrentCompany(null);
              }
            } else {
              setCurrentCompany(null);
            }
          }
        } else if (selfOrder?.buyerCompany) {
          try {
            const companyResponse = await api.get("/companies", {
              params: { search: selfOrder.buyerCompany, limit: 1 },
            });
            console.log("[DEBUG company fetch by name] companyResponse:", companyResponse);
            const companies = Array.isArray(companyResponse.data) 
              ? companyResponse.data 
              : (companyResponse.data?.data || []);
            const company = companies.find(
              (c) =>
                c.companyName.toLowerCase() ===
                selfOrder.buyerCompany.toLowerCase(),
            );
            console.log("[DEBUG company fetch by name] company:", company);
            setCurrentCompany(company || null);
          } catch (error) {
            console.error("Error fetching company by name:", error);
            setCurrentCompany(null);
          }
        } else {
          setCurrentCompany(null);
        }

        const qualityParams =
          qualityParamsResponse.data?.data || qualityParamsResponse.data || [];
        const paramIdToNameMap = new Map();
        qualityParams.forEach((qp) => {
          if (qp._id && qp.name) {
            paramIdToNameMap.set(String(qp._id), qp.name);
            paramIdToNameMap.set(qp.name.toLowerCase(), qp.name);
          }
        });

        let initialClaims = [];
        if (currentCompany && currentSelfOrder?.commodity) {
          const commodity = currentCompany.commodities?.find(
            (c) => c.name.toLowerCase() === currentSelfOrder.commodity.toLowerCase()
          );
          
          if (commodity && commodity.parameters) {
            initialClaims = commodity.parameters.map((param) => {
              const existingClaim = entry.qualityClaims?.find(
                (c) =>
                  (c.parameterName && param.parameter && c.parameterName.toLowerCase() === param.parameter.toLowerCase()) ||
                  (c.parameterId && param.parameterId && String(c.parameterId) === String(param.parameterId)),
              );
              
              // Use existing standardValue if present, else default to first baseValue
              const defaultStandardValue = param.values?.[0]?.baseValue 
                ? parseFloat(param.values[0].baseValue) 
                : 0;
              const selectedStandardValue = existingClaim?.standardValue ?? defaultStandardValue;
              
              return {
                parameterId: String(param.parameterId || ""),
                parameterName: param.parameter || "",
                standardValue: selectedStandardValue,
                paramValues: param.values || [], // Store all param values for dropdown and ratio lookup
                actualValue: existingClaim?.actualValue || "",
                claimAmount: existingClaim?.claimAmount || 0,
                notes: existingClaim?.notes || "",
              };
            });
          }
        }
        
        // Fallback to self-order parameters if company has none
        if (initialClaims.length === 0 && selfOrder?.parameters) {
          initialClaims = selfOrder.parameters.map((p) => {
            const pId = String(
              p._id ||
                p.id ||
                p.parameterId ||
                p.parameter?._id ||
                p.parameter?.value ||
                "",
            );
            
            let pName = paramIdToNameMap.get(pId);
            if (!pName) {
              if (typeof p.parameter === "string") {
                pName = p.parameter;
              } else if (p.parameter && typeof p.parameter === "object") {
                pName =
                  p.parameter.label ||
                  p.parameter.name ||
                  p.parameter.value ||
                  "";
              }
              if (!pName) {
                pName = p.name || p.parameterName || p.label || "";
              }
              if (pName) {
                pName = paramIdToNameMap.get(pName.toLowerCase()) || pName;
              }
            }
            
            const existingClaim = entry.qualityClaims?.find(
              (c) =>
                (c.parameterName && pName && c.parameterName === pName) ||
                (c.parameterId && pId && String(c.parameterId) === pId),
            );
            
            return {
              parameterId: pId,
              parameterName: pName,
              standardValue: parseFloat(
                p.value || p.parameterValue || p.standardValue || 0,
              ),
              actualValue: existingClaim?.actualValue || "",
              claimAmount: existingClaim?.claimAmount || 0,
              notes: existingClaim?.notes || "",
            };
          });
        } else if (initialClaims.length === 0 && entry.qualityClaims?.length > 0) {
          // If no parameters found but entry has claims, use those
          const claimsWithNames = entry.qualityClaims.map((claim) => {
            let pName = claim.parameterName;
            const pId = String(claim.parameterId || "");
            if (pId && !pName) {
              pName = paramIdToNameMap.get(pId);
            }
            return {
              ...claim,
              parameterName: pName || claim.parameterName,
            };
          });
          initialClaims = claimsWithNames;
        }
        
        newEditEntry.qualityClaims = initialClaims;

        // Set buyerBrokerage and sellerBrokerage from selfOrder
        if (selfOrder?.buyerBrokerage) {
          const buyerRate = selfOrder.buyerBrokerage.brokerageBuyer || 0;
          const sellerRate = selfOrder.buyerBrokerage.brokerageSupplier || 0;
          const uWeight = parseFloat(entry.unloadingWeight) || 0;
          newEditEntry.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
          newEditEntry.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCurrentSelfOrder(null);
      }
    } else {
      setCurrentSelfOrder(null);
    }

    setEditEntry(newEditEntry);
    setPopupType("edit");
  }, []);

  const handleEditFieldChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setEditEntry((prev) => {
        const updated = { ...prev, [name]: value };

        // Re-calculate financial totals if relevant fields change
        if (
          name === "loadingWeight" ||
          name === "freightRate" ||
          name === "advance"
        ) {
          const weight = parseFloat(updated.loadingWeight) || 0;
          const rate = parseFloat(updated.freightRate) || 0;
          const advance = parseFloat(updated.advance) || 0;

          const total = +(weight * rate).toFixed(2);
          const balance = +(total - advance).toFixed(2);

          updated.totalFreight = total;
          updated.balance = balance;
        }

        // Recalculate buyer and seller brokerage when unloadingWeight changes
        if (name === "unloadingWeight" && currentSelfOrder?.buyerBrokerage) {
          const buyerRate = currentSelfOrder.buyerBrokerage.brokerageBuyer || 0;
          const sellerRate =
            currentSelfOrder.buyerBrokerage.brokerageSupplier || 0;
          const uWeight = parseFloat(value) || 0;
          updated.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
          updated.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
        }

        return updated;
      });
    },
    [currentSelfOrder],
  );

  const getClaimRatio = (claim) => {
    console.log("[DEBUG getClaimRatio] claim:", claim);
    console.log("[DEBUG getClaimRatio] currentCompany:", currentCompany);
    console.log("[DEBUG getClaimRatio] currentSelfOrder?.commodity:", currentSelfOrder?.commodity);
    
    if (!currentCompany || !currentSelfOrder?.commodity) {
      console.log("[DEBUG getClaimRatio] Missing company or commodity");
      return { left: 1, right: 1, display: "1:1" };
    }

    const commodity = currentCompany.commodities?.find(
      (c) => c.name.toLowerCase() === currentSelfOrder.commodity.toLowerCase(),
    );
    console.log("[DEBUG getClaimRatio] found commodity:", commodity);

    if (!commodity) {
      console.log("[DEBUG getClaimRatio] No commodity found");
      return { left: 1, right: 1, display: "1:1" };
    }

    const param = commodity.parameters?.find(
      (p) =>
        String(p.parameterId) === String(claim.parameterId) ||
        p.parameter?.toLowerCase() === claim.parameterName?.toLowerCase(),
    );
    console.log("[DEBUG getClaimRatio] found param:", param);

    if (!param || !param.values?.length) {
      console.log("[DEBUG getClaimRatio] No param or values, checking claim.paramValues:", claim.paramValues);
      // If no param, check claim.paramValues (from initialClaims)
      if (claim.paramValues && claim.paramValues.length) {
        // Find ratio that matches current standardValue (check baseValue and maxValue)
        const matchingValue = claim.paramValues.find(
          (v) => 
            parseFloat(v.baseValue) === parseFloat(claim.standardValue) || 
            parseFloat(v.maxValue) === parseFloat(claim.standardValue)
        );
        console.log("[DEBUG getClaimRatio] matchingValue from claim.paramValues:", matchingValue);
        if (matchingValue) {
          const left = parseFloat(matchingValue.claimRatioLeft || 1);
          const right = parseFloat(matchingValue.claimRatioRight || 1);
          console.log("[DEBUG getClaimRatio] returning ratio from claim.paramValues:", `${left}:${right}`);
          return { left, right, display: `${left}:${right}` };
        }
        // Fallback to first value
        const firstValue = claim.paramValues[0];
        const left = parseFloat(firstValue.claimRatioLeft || 1);
        const right = parseFloat(firstValue.claimRatioRight || 1);
        console.log("[DEBUG getClaimRatio] returning fallback ratio from claim.paramValues:", `${left}:${right}`);
        return { left, right, display: `${left}:${right}` };
      }
      console.log("[DEBUG getClaimRatio] No claim.paramValues, returning 1:1");
      return { left: 1, right: 1, display: "1:1" };
    }

    // Find ratioValue that matches the current standardValue (check baseValue and maxValue)
    const ratioValue = param.values.find(
      (v) => 
        parseFloat(v.baseValue) === parseFloat(claim.standardValue) || 
        parseFloat(v.maxValue) === parseFloat(claim.standardValue)
    ) || param.values[0]; // Fallback to first if no match
    console.log("[DEBUG getClaimRatio] ratioValue from param.values:", ratioValue);

    const left = parseFloat(ratioValue.claimRatioLeft || 1);
    const right = parseFloat(ratioValue.claimRatioRight || 1);
    const display = `${left}:${right}`;
    console.log("[DEBUG getClaimRatio] returning ratio from param.values:", display);

    return { left, right, display };
  };

  const handleQualityChange = (index, field, value) => {
    setEditEntry((prev) => {
      const newClaims = [...prev.qualityClaims];
      newClaims[index][field] = value;

      // Recalculate claim amount if actualValue or standardValue changes
      if (field === "actualValue" || field === "standardValue") {
        const standard = parseFloat(newClaims[index].standardValue || 0);
        const actual = parseFloat(newClaims[index].actualValue || 0);
        const saudaRate = parseFloat(currentSelfOrder?.rate || 0);
        const diff = actual - standard;

        const ratio = getClaimRatio(newClaims[index]);
        let claim = diff * saudaRate; // Default fallback

        if (ratio.right > 0) {
          claim = diff * saudaRate * (ratio.left / ratio.right);
        }

        newClaims[index].claimAmount = Math.abs(claim).toFixed(2);
      }

      return { ...prev, qualityClaims: newClaims };
    });
  };

  const handleUpdateEntry = useCallback(async () => {
    if (!editEntry?._id) {
      toast.error("Invalid entry data");
      return;
    }

    const validationErrors = validateEntryData(editEntry);
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editEntry,
        loadingDate: editEntry.loadingDate
          ? new Date(editEntry.loadingDate).toISOString()
          : null,
        dateOfIssue: editEntry.dateOfIssue
          ? new Date(editEntry.dateOfIssue).toISOString()
          : null,
        unloadingDate: editEntry.unloadingDate
          ? new Date(editEntry.unloadingDate).toISOString()
          : null,
        deliveryDate: editEntry.deliveryDate
          ? new Date(editEntry.deliveryDate).toISOString()
          : null,
      };

      await api.put(`/loading-entries/${editEntry._id}`, payload);
      toast.success("Entry updated successfully");
      setPopupType("");
      setSelectedEntry(null);
      setEditEntry(null);
      setCurrentSelfOrder(null);
      await fetchData();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update entry";
      toast.error(message);
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editEntry, fetchData]);

  const handleDelete = useCallback(
    async (id) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this entry? This action cannot be undone.",
        )
      ) {
        return;
      }

      try {
        await api.delete(`/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        await fetchData();
      } catch (error) {
        toast.error("Failed to delete entry");
        console.error("Delete error:", error);
      }
    },
    [fetchData],
  );

  const handleDownload = useCallback(async (entry) => {
    let toastId;
    try {
      toastId = toast.loading("Preparing PDF...");

      const blob = await PrintLoadingEntry(entry);
      if (!blob) throw new Error("Failed to generate PDF");

      let fileName = `lorry challan - ${entry.lorryNumber || "document"}`;
      if (entry.billNumber) {
        fileName += ` and bill - ${entry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Download started successfully!");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("PDF Download Error:", error);
      toast.error("Error generating download. Please try again.");
    }
  }, []);

  const handleDownloadExcel = useCallback(async () => {
    if (exporting || loadingEntries.length === 0) return;

    let toastId;
    try {
      setExporting(true);
      toastId = toast.loading("Preparing Excel file...");

      const response = await api.get("/loading-entries/export/excel", {
        params: {
          search: filters.search,
          saudaNo: filters.saudaNo,
          lorryNumber: filters.lorryNumber,
          role: userRole,
          mobile: mobile,
        },
        responseType: "blob",
        timeout: 60000,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileName = `LoadingEntries_${new Date().toISOString().split("T")[0]}.xlsx`;
      await downloadFile(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Excel Download Error:", error);
      toast.error("Failed to download Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [filters, userRole, mobile, exporting, loadingEntries.length]);

  const handleDownloadPDFReport = useCallback(() => {
    if (loadingEntries.length === 0) return;

    const doc = new jsPDF("landscape");
    const tableColumn = [
      "Sl No",
      "Loading No",
      "Date",
      "Sauda No",
      "Lorry No",
      "Seller",
      "Buyer",
      "Consignee",
      "Commodity",
      "Unloading Weight",
      "Brokerage",
      "Bill No",
      "Entered By",
    ];

    const tableRows = loadingEntries.map((entry, index) => {
      const slNo = (currentPage - 1) * itemsPerPage + index + 1;
      const brokerageRate = brokerageMap[entry.saudaNo] || 0;
      const totalBrokerage = (
        (entry.unloadingWeight || 0) * brokerageRate
      ).toFixed(2);

      return [
        slNo,
        entry.loadingNo || "-",
        formatDate(entry.loadingDate),
        entry.saudaNo,
        entry.lorryNumber,
        entry.supplierCompany,
        buyerMap[entry.saudaNo] || entry.buyerCompany || "N/A",
        entry.consignee,
        entry.commodity,
        `${(entry.unloadingWeight || 0).toFixed(2)} T`,
        `₹ ${totalBrokerage}`,
        entry.billNumber || "N/A",
        `${entry.creatorMobile || "N/A"} (${entry.entryByRole || "Admin"})`,
      ];
    });

    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    doc.text("LOADING ENTRIES REPORT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`LoadingEntries_${new Date().toISOString().split("T")[0]}.pdf`);
  }, [loadingEntries, totalItems, currentPage, itemsPerPage, buyerMap]);

  const headers = useMemo(
    () => [
      "Sl No",
      "Loading No",
      "Loading Date",
      "Sauda No",
      "Seller Company",
      "Buyer Company",
      "Consignee",
      "Payment Terms",
      "Commodity",
      "Loading Weight",
      "Unloading Weight",
      "Brokerage",
      "Already Loaded",
      "Pending Qty",
      "Status",
      "Lorry Number",
      "Transport",
      "Driver",
      "Phone",
      "Freight Rate",
      "Total Freight",
      "Advance",
      "Balance",
      "Bill No",
      "Date of Issue",
      "Entered By",
      "Actions",
      "Download",
    ],
    [],
  );

  const rows = useMemo(() => {
    return loadingEntries.map((entry, index) => {
      const slNo = (currentPage - 1) * itemsPerPage + index + 1;
      const brokerageRate = brokerageMap[entry.saudaNo] || 0;
      const totalBrokerage = (
        (entry.unloadingWeight || 0) * brokerageRate
      ).toFixed(2);

      return [
        <span key={`sl-${entry._id}`} className="font-black text-slate-400">
          {slNo}
        </span>,
        entry.loadingNo || "-",
        formatDate(entry.loadingDate),
        entry.saudaNo || "N/A",
        entry.supplierCompany || "N/A",
        buyerMap[entry.saudaNo] || entry.buyerCompany || "N/A",
        entry.consignee || "N/A",
        paymentTermsMap[entry.saudaNo] || "N/A",
        entry.commodity || "N/A",
        entry.loadingWeight ? entry.loadingWeight.toFixed(2) : "0.00",
        entry.unloadingWeight ? entry.unloadingWeight.toFixed(2) : "0.00",
        <span
          key={`brokerage-${entry._id}`}
          className="font-bold text-slate-600"
        >
          ₹ {totalBrokerage}
        </span>,
        (alreadyLoadedMap[entry.saudaNo] || 0).toFixed(2),
        <span key={`pending-${entry._id}`} className="font-bold text-amber-600">
          {(pendingQuantityMap[entry.saudaNo] || 0).toFixed(2)}
        </span>,
        <span
          key={`status-${entry._id}`}
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            statusMap[entry.saudaNo] === "closed"
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {statusMap[entry.saudaNo] === "closed" ? "Closed" : "Active"}
        </span>,
        entry.lorryNumber,
        transporterMap[entry.transporterId] || entry.addedTransport || "N/A",
        entry.driverName || "N/A",
        entry.driverPhoneNumber || "N/A",
        entry.freightRate ? `₹ ${entry.freightRate}` : "N/A",
        entry.totalFreight ? `₹ ${entry.totalFreight}` : "N/A",
        entry.advance ? `₹ ${entry.advance}` : "N/A",
        entry.balance ? `₹ ${entry.balance}` : "N/A",
        entry.billNumber || "N/A",
        formatDate(entry.dateOfIssue),
        <div key={`enteredBy-${entry._id}`} className="flex flex-col">
          <span className="font-semibold text-slate-700">
            {entry.creatorMobile || "N/A"}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-bold">
            {entry.entryByRole || "Admin"}
          </span>
        </div>,
        <div key={`actions-${entry._id}`} className="flex justify-center gap-2">
          <button
            onClick={() => handleView(entry)}
            title="View"
            className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
            aria-label="View entry"
          >
            <MdVisibility size={18} />
          </button>
          {(userRole === "Admin" || userRole === "Employee") && (
            <>
              <button
                onClick={() => handleEdit(entry)}
                title="Edit"
                className="p-1 text-green-500 hover:bg-green-100 rounded transition-colors"
                aria-label="Edit entry"
              >
                <MdEdit size={18} />
              </button>
              <button
                onClick={() => handleDelete(entry._id)}
                title="Delete"
                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                aria-label="Delete entry"
              >
                <MdDelete size={18} />
              </button>
            </>
          )}
        </div>,
        <button
          key={`download-${entry._id}`}
          onClick={() => handleDownload(entry)}
          title="Download PDF"
          className="p-1 text-purple-500 hover:bg-purple-100 rounded transition-colors flex justify-center"
          aria-label="Download PDF"
        >
          <MdDownload size={18} />
        </button>,
      ];
    });
  }, [
    loadingEntries,
    currentPage,
    itemsPerPage,
    alreadyLoadedMap,
    statusMap,
    transporterMap,
    userRole,
    paymentTermsMap,
    buyerMap,
    brokerageMap,
    handleView,
    handleEdit,
    handleDelete,
    handleDownload,
  ]);

  const hasActiveFilters =
    filters.search || filters.saudaNo || filters.lorryNumber;

  if (initialLoading && loading) {
    return <Loading />;
  }

  return (
    <React.Suspense fallback={<Loading />}>
      <AdminPageShell
        title={
          userRole === "Seller" ? "Your Loading Entries" : "Loading Entries"
        }
        subtitle={
          userRole === "Seller"
            ? "Enter the Bill Number for bills; otherwise, a challan will be generated."
            : "Search, view, edit, and download loading entry documents"
        }
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                {totalItems > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    Showing{" "}
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                    -{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                    {totalItems} entries
                    {hasActiveFilters && (
                      <span className="ml-2 text-emerald-600 font-medium">
                        (filtered)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleDownloadPDFReport}
                  disabled={loadingEntries.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  aria-label="Download PDF Report"
                >
                  <MdPictureAsPdf size={20} />
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  disabled={exporting || loadingEntries.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  aria-label="Download Excel"
                >
                  <MdDownload size={20} />
                  {exporting ? "Preparing..." : "Download Excel"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchBox
                placeholder="Search by seller, buyer, consignee, commodity..."
                items={[...new Set(suggestions.sellers)].filter(Boolean)}
                returnQuery={true}
                onSearch={handleGeneralSearch}
                value={filters.search}
              />
              <SearchBox
                placeholder="Search by sauda number..."
                items={[...new Set(suggestions.saudas)].filter(Boolean)}
                returnQuery={true}
                onSearch={handleSaudaSearch}
                value={filters.saudaNo}
              />
              <SearchBox
                placeholder="Search by lorry number..."
                items={[...new Set(suggestions.lorries)].filter(Boolean)}
                returnQuery={true}
                onSearch={handleLorrySearch}
                value={filters.lorryNumber}
              />
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                  aria-label="Clear all filters"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4">
            {loading ? (
              <div className="py-12">
                <Loading />
              </div>
            ) : (
              <>
                {loadingEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">
                      No loading entries found
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Clear filters to see all entries
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <Tables headers={headers} rows={rows} />
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {selectedEntry && popupType && (
            <PopupBox
              isOpen={!!popupType}
              onClose={() => {
                setPopupType("");
                setSelectedEntry(null);
                setEditEntry(null);
              }}
              title={
                popupType === "view" ? "Loading Entry Details" : "Edit Entry"
              }
              maxWidth="max-w-7xl"
            >
              {popupType === "view" ? (
                <div className="space-y-6 p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Basic Info
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Loading Date:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedEntry.loadingDate)}
                        </span>
                        <span className="text-slate-500">Sauda No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.saudaNo}
                        </span>
                        <span className="text-slate-500">Seller:</span>
                        <span className="font-semibold text-slate-800">
                          {sellerMap[selectedEntry.supplier] || "N/A"}
                        </span>
                        <span className="text-slate-500">Payment Terms:</span>
                        <span className="font-semibold text-slate-800">
                          {paymentTermsMap[selectedEntry.saudaNo] || "N/A"}
                        </span>
                        <span className="text-slate-500">Commodity:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.commodity || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Transport Details
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Lorry No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.lorryNumber}
                        </span>
                        <span className="text-slate-500">Transporter:</span>
                        <span className="font-semibold text-slate-800">
                          {transporterMap[selectedEntry.transporterId] ||
                            selectedEntry.addedTransport ||
                            "N/A"}
                        </span>
                        <span className="text-slate-500">Driver Name:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.driverName || "N/A"}
                        </span>
                        <span className="text-slate-500">Driver Phone:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.driverPhoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Weight & Billing
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Weight:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.loadingWeight} Tons
                        </span>
                        <span className="text-slate-500">Unloading Wt:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.unloadingWeight || 0} Tons
                        </span>
                        <span className="text-slate-500">Bill No:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEntry.billNumber || "N/A"}
                        </span>
                        <span className="text-slate-500">Bill Date:</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(selectedEntry.dateOfIssue)}
                        </span>
                        <span className="text-slate-500">Entered By:</span>
                        <span className="font-semibold text-slate-800 flex flex-col">
                          <span>{selectedEntry.creatorMobile || "N/A"}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({selectedEntry.entryByRole || "Admin"})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                        Financial Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-500">Freight Rate:</span>
                        <span className="font-bold text-slate-800">
                          ₹ {selectedEntry.freightRate}
                        </span>
                        <span className="text-slate-500">Total Freight:</span>
                        <span className="font-bold text-slate-800">
                          ₹ {selectedEntry.totalFreight}
                        </span>
                        <span className="text-slate-500">Advance:</span>
                        <span className="font-bold text-emerald-600">
                          ₹ {selectedEntry.advance}
                        </span>
                        <span className="text-slate-500">Balance Due:</span>
                        <span className="font-bold text-amber-600">
                          ₹ {selectedEntry.balance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setPopupType("");
                        setSelectedEntry(null);
                        setCurrentSelfOrder(null);
                      }}
                      className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                editEntry && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Loading Date *
                        </label>
                        <input
                          type="date"
                          name="loadingDate"
                          value={editEntry.loadingDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Loading Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Delivery Date
                        </label>
                        <input
                          type="date"
                          name="deliveryDate"
                          value={editEntry.deliveryDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Delivery Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Sauda No *
                        </label>
                        <input
                          type="text"
                          name="saudaNo"
                          value={editEntry.saudaNo || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Sauda Number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          value={paymentTermsMap[editEntry.saudaNo] || "N/A"}
                          disabled
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-700 cursor-not-allowed"
                          aria-label="Payment Terms (read-only)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Bill No
                        </label>
                        <input
                          type="text"
                          name="billNumber"
                          value={editEntry.billNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Bill Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Date of Issue
                        </label>
                        <input
                          type="date"
                          name="dateOfIssue"
                          value={editEntry.dateOfIssue || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Date of Issue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Lorry Number *
                        </label>
                        <input
                          type="text"
                          name="lorryNumber"
                          value={editEntry.lorryNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Lorry Number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Transporter
                        </label>
                        <DataDropdown
                          options={transporters}
                          selectedOptions={
                            editEntry.transporterId
                              ? [
                                  transporters.find(
                                    (t) => t.value === editEntry.transporterId,
                                  ),
                                ].filter(Boolean)
                              : []
                          }
                          onChange={(option) => {
                            setEditEntry((prev) => ({
                              ...prev,
                              transporterId: option?.value || "",
                              addedTransport: option?.label || "",
                            }));
                          }}
                          placeholder="Select Transporter"
                          isMulti={false}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          name="driverName"
                          value={editEntry.driverName || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Driver Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Driver Phone
                        </label>
                        <input
                          type="tel"
                          name="driverPhoneNumber"
                          value={editEntry.driverPhoneNumber || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Driver Phone"
                          pattern="[0-9]{10}"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Commodity
                        </label>
                        <input
                          type="text"
                          name="commodity"
                          value={editEntry.commodity || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Commodity"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Loading From
                        </label>
                        <DataDropdown
                          options={stateOptions}
                          selectedOptions={
                            editEntry.loadingFrom
                              ? [
                                  stateOptions.find(
                                    (s) => s.value === editEntry.loadingFrom,
                                  ),
                                ].filter(Boolean)
                              : []
                          }
                          onChange={(option) => {
                            setEditEntry((prev) => ({
                              ...prev,
                              loadingFrom: option?.value || "",
                            }));
                          }}
                          placeholder="Select State"
                          isMulti={false}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Loading Weight
                        </label>
                        <input
                          type="number"
                          name="loadingWeight"
                          value={editEntry.loadingWeight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Loading Weight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Bags
                        </label>
                        <input
                          type="number"
                          name="bags"
                          value={editEntry.bags || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Bags"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Unloading Weight
                        </label>
                        <input
                          type="number"
                          name="unloadingWeight"
                          value={editEntry.unloadingWeight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Unloading Weight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Unloading Date
                        </label>
                        <input
                          type="date"
                          name="unloadingDate"
                          value={editEntry.unloadingDate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Unloading Date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Freight Rate
                        </label>
                        <input
                          type="number"
                          name="freightRate"
                          value={editEntry.freightRate || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Freight Rate"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Total Freight
                        </label>
                        <input
                          type="number"
                          name="totalFreight"
                          value={editEntry.totalFreight || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Total Freight"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Advance
                        </label>
                        <input
                          type="number"
                          name="advance"
                          value={editEntry.advance || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Advance"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Balance
                        </label>
                        <input
                          type="number"
                          name="balance"
                          value={editEntry.balance || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Balance"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Buyer Brokerage
                        </label>
                        <input
                          type="number"
                          name="buyerBrokerage"
                          value={editEntry.buyerBrokerage || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Buyer Brokerage"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Seller Brokerage
                        </label>
                        <input
                          type="number"
                          name="sellerBrokerage"
                          value={editEntry.sellerBrokerage || ""}
                          onChange={handleEditFieldChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label="Seller Brokerage"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Quality Parameters Table */}
                    {editEntry.qualityClaims &&
                      editEntry.qualityClaims.length > 0 && (
                        <div className="border-t border-slate-200 pt-6 mt-6 overflow-x-auto">
                          <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Quality Parameters & Claims
                          </h4>
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Quality Parameter
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Standard Value
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Actual Value
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Claim Ratio
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Claim %
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Claim Amount
                                </th>
                                <th className="px-4 py-3 font-bold text-slate-700">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {editEntry.qualityClaims.map((claim, idx) => {
                                const ratio = getClaimRatio(claim);
                                let claimPercent = 0;
                                const standard =
                                  Number(claim.standardValue) || 0;
                                const actual = Number(claim.actualValue) || 0;
                                const claimAmt = Number(claim.claimAmount) || 0;
                                const rate =
                                  Number(currentSelfOrder?.rate) || 0;
                                const weight =
                                  Number(editEntry.unloadingWeight) || 0;
                                const totalValue = rate * weight;

                                if (totalValue > 0) {
                                  claimPercent = (claimAmt / totalValue) * 100;
                                } else if (standard > 0) {
                                  // Fallback if no total value
                                  claimPercent =
                                    (Math.abs(actual - standard) / standard) *
                                    100;
                                }

                                // Prepare dropdown options (use baseValue and maxValue)
                                const standardOptions = [];
                                (claim.paramValues || []).forEach((v) => {
                                  if (v.baseValue) {
                                    standardOptions.push({
                                      value: v.baseValue,
                                      label: `Base: ${v.baseValue}`,
                                    });
                                  }
                                  if (v.maxValue) {
                                    standardOptions.push({
                                      value: v.maxValue,
                                      label: `Max: ${v.maxValue}`,
                                    });
                                  }
                                  // If both baseValue and maxValue are same, avoid duplicates
                                });

                                return (
                                  <tr
                                    key={idx}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                  >
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                      {claim.parameterName}
                                    </td>
                                    <td className="px-4 py-3">
                                      {standardOptions.length > 1 ? (
                                        <select
                                          value={claim.standardValue}
                                          onChange={(e) =>
                                            handleQualityChange(
                                              idx,
                                              "standardValue",
                                              e.target.value,
                                            )
                                          }
                                          disabled={editEntry.manualClaim}
                                          className={`px-3 py-1.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${editEntry.manualClaim ? "bg-slate-100 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"}`}
                                        >
                                          {standardOptions.map((opt, optIdx) => (
                                            <option key={optIdx} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="text-slate-600 font-bold">
                                          {claim.standardValue}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="number"
                                        value={claim.actualValue}
                                        onChange={(e) =>
                                          handleQualityChange(
                                            idx,
                                            "actualValue",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Actual"
                                        disabled={editEntry.manualClaim}
                                        className={`w-24 px-3 py-1.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${editEntry.manualClaim ? "bg-slate-100 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"}`}
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-indigo-600 font-black italic">
                                      {ratio.display}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-bold">
                                      {claimPercent.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400 font-bold">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          value={claim.claimAmount}
                                          readOnly
                                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-orange-600 outline-none"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <input
                                        type="text"
                                        value={claim.notes}
                                        onChange={(e) =>
                                          handleQualityChange(
                                            idx,
                                            "notes",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Remarks..."
                                        disabled={editEntry.manualClaim}
                                        className={`w-full min-w-[150px] px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${editEntry.manualClaim ? "bg-slate-100 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"}`}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          <div className="mt-4 flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
                            <span className="text-sm font-bold text-indigo-800">
                              Total Claim:
                            </span>
                            <span className="text-lg font-black text-indigo-600">
                              ₹
                              {editEntry.manualClaim
                                ? editEntry.manualClaimAmount || 0
                                : editEntry.qualityClaims
                                    .reduce(
                                      (total, claim) =>
                                        total +
                                        (Number(claim.claimAmount) || 0),
                                      0,
                                    )
                                    .toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
                            <h4 className="text-base font-bold text-emerald-900 mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Bill & Payable Calculation
                            </h4>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-xs border border-emerald-100">
                                <span className="font-semibold text-slate-700">
                                  Total Bill Value:
                                </span>
                                <span className="text-xl font-black text-emerald-700">
                                  ₹{" "}
                                  {(
                                    Number(editEntry.unloadingWeight || 0) *
                                    Number(currentSelfOrder?.rate || 0)
                                  ).toFixed(2)}
                                </span>
                              </div>

                              {(currentSelfOrder?.cd || 0) > 0 && (
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-xs border border-emerald-100">
                                  <span className="font-semibold text-slate-700">
                                    Add CD (
                                    {Number(currentSelfOrder.cd).toFixed(2)}%):
                                  </span>
                                  <span className="text-lg font-bold text-emerald-600">
                                    + ₹{" "}
                                    {(
                                      Number(editEntry.unloadingWeight || 0) *
                                      Number(currentSelfOrder?.rate || 0) *
                                      (Number(currentSelfOrder.cd) / 100)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {(currentSelfOrder?.gst || 0) > 0 && (
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-xs border border-emerald-100">
                                  <span className="font-semibold text-slate-700">
                                    Add GST (
                                    {Number(currentSelfOrder.gst).toFixed(2)}%):
                                  </span>
                                  <span className="text-lg font-bold text-emerald-600">
                                    + ₹{" "}
                                    {(
                                      Number(editEntry.unloadingWeight || 0) *
                                      Number(currentSelfOrder?.rate || 0) *
                                      (Number(currentSelfOrder.gst) / 100)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-xs border border-amber-100">
                                <span className="font-semibold text-slate-700">
                                  Less Total Claim:
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                  - ₹{" "}
                                  {editEntry.manualClaim
                                    ? editEntry.manualClaimAmount || 0
                                    : editEntry.qualityClaims
                                        .reduce(
                                          (total, claim) =>
                                            total +
                                            (Number(claim.claimAmount) || 0),
                                          0,
                                        )
                                        .toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md text-white">
                                <span className="text-base font-bold">
                                  Payable Amount:
                                </span>
                                <span className="text-2xl font-black">
                                  ₹{" "}
                                  {(() => {
                                    const rate = Number(
                                      currentSelfOrder?.rate || 0,
                                    );
                                    const weight = Number(
                                      editEntry.unloadingWeight || 0,
                                    );
                                    const totalBill = rate * weight;
                                    const cdAmount =
                                      totalBill *
                                      ((Number(currentSelfOrder?.cd) || 0) /
                                        100);
                                    const gstAmount =
                                      totalBill *
                                      ((Number(currentSelfOrder?.gst) || 0) /
                                        100);
                                    const totalClaim = editEntry.manualClaim
                                      ? Number(editEntry.manualClaimAmount || 0)
                                      : editEntry.qualityClaims.reduce(
                                          (total, claim) =>
                                            total +
                                            (Number(claim.claimAmount) || 0),
                                          0,
                                        );
                                    return (
                                      totalBill +
                                      cdAmount +
                                      gstAmount -
                                      totalClaim
                                    ).toFixed(2);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editEntry.manualClaim}
                                onChange={(e) => {
                                  setEditEntry((prev) => ({
                                    ...prev,
                                    manualClaim: e.target.checked,
                                  }));
                                }}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-slate-700">
                                Report not Received, Enter Manual claim Amount
                              </span>
                            </label>

                            {editEntry.manualClaim && (
                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-slate-400 font-bold text-lg">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={editEntry.manualClaimAmount}
                                  onChange={(e) => {
                                    setEditEntry((prev) => ({
                                      ...prev,
                                      manualClaimAmount: e.target.value,
                                    }));
                                  }}
                                  placeholder="Enter manual claim amount"
                                  className="flex-1 max-w-xs px-4 py-2 bg-white border border-indigo-300 rounded-lg text-base font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                  step="0.01"
                                />
                              </div>
                            )}
                          </div>

                          <p className="mt-3 text-[11px] text-slate-500 italic">
                            * Claim Amount is automatically calculated based on
                            (Actual - Standard) × Sauda Rate (₹
                            {currentSelfOrder?.rate || 0})
                          </p>
                        </div>
                      )}

                    {(editEntry.unloadingWeight && editEntry.unloadingDate) ||
                    editEntry.documents?.kantaSlip ||
                    editEntry.documents?.unloadingChallan ||
                    editEntry.documents?.partyBillCopy ? (
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-base font-bold text-slate-800 mb-4">
                          Document Upload
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FileUpload
                            label="1. Kanta Slip"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.kantaSlip}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  kantaSlip: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  kantaSlip: "",
                                },
                              }));
                            }}
                          />
                          <FileUpload
                            label="2. Unloading Challan"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.unloadingChallan}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  unloadingChallan: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  unloadingChallan: "",
                                },
                              }));
                            }}
                          />
                          <FileUpload
                            label="3. Party Bill Copy"
                            accept="image/*,.pdf"
                            minWidth={800}
                            minHeight={600}
                            currentUrl={editEntry.documents?.partyBillCopy}
                            onFileChange={(url) => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  partyBillCopy: url,
                                },
                              }));
                            }}
                            onFileRemove={() => {
                              setEditEntry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  partyBillCopy: "",
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-slate-200 pt-6">
                        <p className="text-sm text-slate-500 text-center py-4">
                          Please fill in both Unloading Weight and Unloading
                          Date to enable document upload.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPopupType("");
                          setSelectedEntry(null);
                          setEditEntry(null);
                          setCurrentSelfOrder(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateEntry}
                        disabled={isSaving}
                        className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? "Saving..." : "Update Entry"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </React.Suspense>
  );
};

export default ListLoadingEntry;
