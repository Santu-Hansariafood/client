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
import ViewLoadingEntryPopup from "./components/ViewLoadingEntryPopup";
import EditLoadingEntryPopup from "./components/EditLoadingEntryPopup";
import QualityClaimsTable, {
  calculateClaimAmount,
} from "./components/QualityClaimsTable";

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
  const [orderQuantityMap, setOrderQuantityMap] = useState({});
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
      let sellersData = [];
      let transportersData = [];
      let ordersData = [];

      const [sellersRes, transportersRes, ordersRes] = await Promise.allSettled(
        [
          api.get("/sellers"),
          api.get("/transporters", { params: { limit: 0 } }),
          api.get("/self-order", { params: { limit: 0 } }),
        ],
      );

      if (sellersRes.status === "fulfilled") {
        sellersData = Array.isArray(sellersRes.value.data)
          ? sellersRes.value.data
          : sellersRes.value.data?.data || [];
      } else {
        console.error("Error fetching sellers:", sellersRes.reason);
      }

      if (transportersRes.status === "fulfilled") {
        transportersData = Array.isArray(transportersRes.value.data)
          ? transportersRes.value.data
          : transportersRes.value.data?.data || [];
      } else {
        console.error("Error fetching transporters:", transportersRes.reason);
      }

      if (ordersRes.status === "fulfilled") {
        ordersData = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : ordersRes.value.data?.data || [];
      } else {
        console.error("Error fetching orders:", ordersRes.reason);
      }

      if (!isMountedRef.current) return;

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
      setOrderQuantityMap(
        Object.fromEntries(ordersData.map((o) => [o.saudaNo, o.quantity || 0])),
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

  const handleEdit = useCallback(
    async (entry) => {
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
        manualCalculationRate: entry.manualCalculationRate || "", // Add manual rate field
        secondClaim: entry.secondClaim || 0,
        secondClaimRemarks: entry.secondClaimRemarks || "",
        otherCharges: entry.otherCharges || 0,
        otherChargesRemarks: entry.otherChargesRemarks || "",
        bankCharges: entry.bankCharges || "", // No more default, manual entry
        bankChargesRemarks: entry.bankChargesRemarks || "",
        tds: entry.tds || 0,
        tdsRemarks: entry.tdsRemarks || "",
        generalRemarks: entry.generalRemarks || "",
        showAllQualityParameters: entry.showAllQualityParameters || false,
      };

      if (entry.saudaNo) {
        try {
          const [selfOrderRes, qualityParamsRes] = await Promise.all([
            api.get("/self-order", {
              params: { search: entry.saudaNo, limit: 1 },
            }),
            api.get("/quality-parameters"),
          ]);

          const orders = selfOrderRes.data.data || selfOrderRes.data || [];
          const selfOrder = orders.find(
            (o) =>
              String(o.saudaNo).toLowerCase().trim() ===
              String(entry.saudaNo).toLowerCase().trim(),
          );
          setCurrentSelfOrder(selfOrder || null);

          let fetchedCompany = null;
          if (selfOrder?.companyId) {
            try {
              const companyRes = await api.get(
                `/companies/${selfOrder.companyId}`,
              );
              fetchedCompany = companyRes.data?.data || companyRes.data;
              setCurrentCompany(fetchedCompany || null);
            } catch (err) {
              console.error("Error fetching company by ID:", err);
              if (selfOrder?.buyerCompany) {
                try {
                  const companySearchRes = await api.get("/companies", {
                    params: { search: selfOrder.buyerCompany, limit: 1 },
                  });
                  const companies = Array.isArray(companySearchRes.data)
                    ? companySearchRes.data
                    : companySearchRes.data?.data || [];
                  fetchedCompany = companies.find(
                    (c) =>
                      c.companyName.toLowerCase() ===
                      selfOrder.buyerCompany.toLowerCase(),
                  );
                  setCurrentCompany(fetchedCompany || null);
                } catch (searchErr) {
                  console.error("Error fetching company by name:", searchErr);
                  setCurrentCompany(null);
                }
              } else {
                setCurrentCompany(null);
              }
            }
          } else if (selfOrder?.buyerCompany) {
            try {
              const companyRes = await api.get("/companies", {
                params: { search: selfOrder.buyerCompany, limit: 1 },
              });
              const companies = Array.isArray(companyRes.data)
                ? companyRes.data
                : companyRes.data?.data || [];
              fetchedCompany = companies.find(
                (c) =>
                  c.companyName.toLowerCase() ===
                  selfOrder.buyerCompany.toLowerCase(),
              );
              setCurrentCompany(fetchedCompany || null);
            } catch (err) {
              console.error("Error fetching company by name:", err);
              setCurrentCompany(null);
            }
          } else {
            setCurrentCompany(null);
          }

          const qualityParams =
            qualityParamsRes.data?.data || qualityParamsRes.data || [];
          const paramIdToNameMap = new Map();
          qualityParams.forEach((qp) => {
            if (qp._id && qp.name) {
              paramIdToNameMap.set(String(qp._id), qp.name);
              paramIdToNameMap.set(qp.name.toLowerCase(), qp.name);
            }
          });

          let initialClaims = [];
          if (fetchedCompany && selfOrder?.commodity) {
            const commodity = fetchedCompany.commodities?.find(
              (c) => c.name.toLowerCase() === selfOrder.commodity.toLowerCase(),
            );

            if (commodity && commodity.parameters) {
              initialClaims = commodity.parameters
                .filter((param) => {
                  if (newEditEntry.showAllQualityParameters) return true;
                  const defaultStandardValue = param.values?.[0]?.baseValue
                    ? parseFloat(param.values[0].baseValue)
                    : 0;
                  return defaultStandardValue > 0;
                })
                .map((param) => {
                  const existingClaim = entry.qualityClaims?.find(
                    (c) =>
                      (c.parameterName &&
                        param.parameter &&
                        c.parameterName.toLowerCase() ===
                          param.parameter.toLowerCase()) ||
                      (c.parameterId &&
                        param.parameterId &&
                        String(c.parameterId) === String(param.parameterId)),
                  );

                  const defaultStandardValue = param.values?.[0]?.baseValue
                    ? parseFloat(param.values[0].baseValue)
                    : 0;
                  const selectedStandardValue =
                    existingClaim?.standardValue || defaultStandardValue;

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
          }

          // Now, add any existing claims from entry that aren't already in initialClaims
          if (entry.qualityClaims?.length > 0) {
            const existingClaimIds = new Set(
              initialClaims.map((c) => c.parameterId || c.parameterName),
            );
            const extraClaims = entry.qualityClaims
              .filter((claim) => {
                const key = claim.parameterId || claim.parameterName;
                return !existingClaimIds.has(key);
              })
              .map((claim) => {
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
            initialClaims = [...initialClaims, ...extraClaims];
          }

          // If still no claims, just use entry's quality claims
          if (initialClaims.length === 0 && entry.qualityClaims?.length > 0) {
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

          const saudaRate = parseFloat(selfOrder?.rate || 0);
          const manualRate = parseFloat(
            newEditEntry.manualCalculationRate || 0,
          );
          const weight = parseFloat(entry.unloadingWeight || 0);
          newEditEntry.qualityClaims = initialClaims.map((claim) => {
            if (claim.actualValue && claim.claimAmount) {
              return claim;
            }

            const actual = parseFloat(claim.actualValue || 0);
            let claimAmount = 0;
            if (weight > 0 && (saudaRate > 0 || manualRate > 0)) {
              claimAmount = calculateClaimAmount(
                claim.paramValues,
                actual,
                saudaRate,
                manualRate,
                weight,
              );
            }
            return { ...claim, claimAmount: Math.abs(claimAmount).toFixed(2) };
          });

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
    },
    [currentCompany, currentSelfOrder],
  );

  const handleEditFieldChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setEditEntry((prev) => {
        const updated = { ...prev, [name]: value };

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

        if (name === "unloadingWeight" && currentSelfOrder?.buyerBrokerage) {
          const buyerRate = currentSelfOrder.buyerBrokerage.brokerageBuyer || 0;
          const sellerRate =
            currentSelfOrder.buyerBrokerage.brokerageSupplier || 0;
          const uWeight = parseFloat(value) || 0;
          updated.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
          updated.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
        }

        if (name === "unloadingWeight" && prev.qualityClaims?.length > 0) {
          const newClaims = prev.qualityClaims.map((claim) => {
            const actual = parseFloat(claim.actualValue || 0);
            const saudaRate = parseFloat(currentSelfOrder?.rate || 0);
            const manualRate = parseFloat(prev.manualCalculationRate || 0);
            const weight = parseFloat(value || 0);
            let claimAmount = 0;
            if (weight > 0 && (saudaRate > 0 || manualRate > 0)) {
              claimAmount = calculateClaimAmount(
                claim.paramValues,
                actual,
                saudaRate,
                manualRate,
                weight,
              );
            }
            return {
              ...claim,
              claimAmount: Math.abs(claimAmount).toFixed(2),
            };
          });
          updated.qualityClaims = newClaims;
        }

        return updated;
      });
    },
    [currentSelfOrder],
  );

  const getClaimRatio = useCallback(
    (claim) => {
      if (!currentCompany || !currentSelfOrder?.commodity) {
        return { left: 1, right: 1, display: "1:1" };
      }

      const commodity = currentCompany.commodities?.find(
        (c) =>
          c.name.toLowerCase() === currentSelfOrder.commodity.toLowerCase(),
      );

      if (!commodity) {
        if (claim.paramValues && claim.paramValues.length) {
          const ratioValue =
            claim.paramValues.find((v) => v.baseValue) || claim.paramValues[0];
          if (ratioValue) {
            const left = parseFloat(ratioValue.claimRatioLeft || 1);
            const right = parseFloat(ratioValue.claimRatioRight || 1);
            return { left, right, display: `${left}:${right}` };
          }
        }
        return { left: 1, right: 1, display: "1:1" };
      }

      const param = commodity.parameters?.find(
        (p) =>
          String(p.parameterId) === String(claim.parameterId) ||
          p.parameter?.toLowerCase() === claim.parameterName?.toLowerCase(),
      );

      if (!param || !param.values?.length) {
        if (claim.paramValues && claim.paramValues.length) {
          const ratioValue =
            claim.paramValues.find((v) => v.baseValue) || claim.paramValues[0];
          if (ratioValue) {
            const left = parseFloat(ratioValue.claimRatioLeft || 1);
            const right = parseFloat(ratioValue.claimRatioRight || 1);
            return { left, right, display: `${left}:${right}` };
          }
        }
        return { left: 1, right: 1, display: "1:1" };
      }

      const ratioValue = param.values[0];
      const left = parseFloat(ratioValue.claimRatioLeft || 1);
      const right = parseFloat(ratioValue.claimRatioRight || 1);
      const display = `${left}:${right}`;
      return { left, right, display };
    },
    [currentCompany, currentSelfOrder],
  );

  const handleQualityChange = useCallback(
    (index, field, value) => {
      setEditEntry((prev) => {
        const newClaims = [...prev.qualityClaims];

        newClaims[index][field] = value;

        if (field === "actualValue" || field === "standardValue") {
          const actual = newClaims[index].actualValue;
          const standard = newClaims[index].standardValue;
          const saudaRate = parseFloat(currentSelfOrder?.rate || 0);
          const manualRate = parseFloat(prev.manualCalculationRate || 0);
          const weight = parseFloat(prev.unloadingWeight || 0);

          let claim = 0;
          if (weight > 0 && (saudaRate > 0 || manualRate > 0)) {
            claim = calculateClaimAmount(
              newClaims[index].paramValues,
              actual,
              standard,
              saudaRate,
              manualRate,
              weight,
            );
          }

          newClaims[index].claimAmount = Math.abs(claim).toFixed(2);
        }

        return { ...prev, qualityClaims: newClaims };
      });
    },
    [currentSelfOrder],
  );

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

    const tableRows = loadingEntries.map((entry) => {
      const slNo = entry.loadingNo;
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
  }, [
    loadingEntries,
    totalItems,
    currentPage,
    itemsPerPage,
    buyerMap,
    brokerageMap,
  ]);

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
    return loadingEntries.map((entry) => {
      const slNo = entry.slNo;
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
                <ViewLoadingEntryPopup
                  selectedEntry={selectedEntry}
                  sellerMap={sellerMap}
                  paymentTermsMap={paymentTermsMap}
                  transporterMap={transporterMap}
                  onClose={() => {
                    setPopupType("");
                    setSelectedEntry(null);
                    setCurrentSelfOrder(null);
                  }}
                />
              ) : (
                editEntry && (
                  <EditLoadingEntryPopup
                    editEntry={editEntry}
                    setEditEntry={setEditEntry}
                    currentSelfOrder={currentSelfOrder}
                    currentCompany={currentCompany}
                    handleEditFieldChange={handleEditFieldChange}
                    handleQualityChange={handleQualityChange}
                    handleUpdateEntry={handleUpdateEntry}
                    transporters={transporters}
                    stateOptions={stateOptions}
                    paymentTermsMap={paymentTermsMap}
                    getClaimRatio={getClaimRatio}
                    onClose={() => {
                      setPopupType("");
                      setSelectedEntry(null);
                      setEditEntry(null);
                      setCurrentSelfOrder(null);
                    }}
                    isSaving={isSaving}
                  />
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
