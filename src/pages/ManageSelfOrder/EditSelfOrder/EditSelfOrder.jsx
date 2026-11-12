import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaEdit } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { sendSaudaOrderEmails } from "../../../utils/saudaPdf/sendSaudaOrderEmails";
import statesData from "../../../data/state-city.json";
import {
  parseSariaOrderEditCommand,
  SARIA_AI_ORDER_EDIT_EVENT,
  SARIA_AI_ORDER_EDIT_RESULT_EVENT,
} from "../../../utils/sariaAIOrderEdit";

const BuyerInformation = lazy(
  () => import("../../../components/BuyerInformation/BuyerInformation"),
);
const CommodityInformation = lazy(
  () => import("../../../components/CommodityInformation/CommodityInformation"),
);
const PODetails = lazy(() => import("../../../components/PODetails/PODetails"));
const QuantityAndPricing = lazy(
  () => import("../../../components/QuantityPricing/QuantityPricing"),
);
const SupplierInformation = lazy(
  () => import("../../../components/SupplierInformation/SupplierInformation"),
);
const BrokerInformation = lazy(
  () => import("../../../components/BrokerInformation/BrokerInformation"),
);
const NotesSection = lazy(
  () => import("../../../components/NotesSection/NotesSection"),
);
const AdditionalInformation = lazy(
  () =>
    import("../../../components/AdditionalInformation/AdditionalInformation"),
);
const LoadingStation = lazy(
  () => import("../../../components/LoadingStation/LoadingStation"),
);
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const API_BASE_URL = "/self-order";

const INITIAL_FORM_DATA = {
  buyer: "",
  companyId: null,
  buyerCompany: "",
  consignee: "",
  buyerEmail: "",
  buyerCommodity: [],
  buyerBrokerage: { brokerageBuyer: 0, brokerageSupplier: 0 },
  commodity: "",
  parameters: [],
  poNumber: "",
  poDate: null,
  state: "",
  location: "",
  quantity: "",
  pendingQuantity: "",
  rate: "",
  gst: 0,
  cd: "",
  weight: "",
  supplier: "",
  supplierCompany: "",
  paymentTerms: "",
  deliveryDate: null,
  loadingDate: null,
  notes: [""],
  broker: "",
  agentName: "",
  buyerEmails: [""],
  sellerEmails: [""],
  sendPOToBuyer: "yes",
  sendPOToSupplier: "yes",
  billTo: "buyer",
  saudaNo: "",
  buyerMobile: "",
  sellerMobile: "",
};

const EditSelfOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const [formData, setFormData] = useState(
    state?.orderData || INITIAL_FORM_DATA,
  );
  const [originalFormData, setOriginalFormData] = useState(
    state?.orderData ? JSON.parse(JSON.stringify(state?.orderData)) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [_buyerBrokerageMap, setBuyerBrokerageMap] = useState({});
  const [consignees, setConsignees] = useState(state?.consigneeData || []);
  const [buyers, setBuyers] = useState(state?.buyerData || []);
  const [suppliers, setSuppliers] = useState(state?.supplierData || []);
  const [sellerCompanies, setSellerCompanies] = useState(
    state?.sellerCompanyData || [],
  );
  const [companies, setCompanies] = useState(state?.companyData || []);
  const [allCommodities, setAllCommodities] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState({
    buyer: true,
    supplier: true,
  });
  const [hasPendingSariaAISave, setHasPendingSariaAISave] = useState(false);
  const pendingCommandHandled = useRef(false);
  const pendingSariaAISnapshot = useRef(null);

  const abortControllerRef = useRef(null);
  const hasFetchedInitialData = useRef(false);

  useEffect(() => {
    if (formData.commodity) {
      const buyerBrokerageVal = _buyerBrokerageMap[formData.commodity] ?? 0;

      const supplierBrokerageItem = formData.supplierBrokerage?.find(
        (b) => b.name === formData.commodity,
      );
      const supplierBrokerageVal = supplierBrokerageItem?.brokerage ?? 0;

      if (
        formData.buyerBrokerage?.brokerageBuyer !== buyerBrokerageVal ||
        formData.buyerBrokerage?.brokerageSupplier !== supplierBrokerageVal
      ) {
        setFormData((prev) => ({
          ...prev,
          buyerBrokerage: {
            brokerageBuyer: buyerBrokerageVal,
            brokerageSupplier: supplierBrokerageVal,
          },
        }));
      }
    }
  }, [
    formData.commodity,
    _buyerBrokerageMap,
    formData.supplierBrokerage,
    formData.buyerBrokerage,
  ]);

  useEffect(() => {
    const orderFromState = state?.orderData;

    if (!id && !orderFromState) {
      toast.error("Missing order id. Open edit from the order list.");
      navigate("/manage-order/list-self-order", { replace: true });
      return;
    }

    if (hasFetchedInitialData.current) {
      return;
    }

    const fetchData = async () => {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsFetching(true);
      try {
        const orderPromise =
          !orderFromState && id
            ? api.get(`${API_BASE_URL}/${id}`, {
                signal: abortControllerRef.current.signal,
              })
            : Promise.resolve({ data: orderFromState });

        const needsConsignees = !consignees.length;
        const needsBuyers = !buyers.length;
        const needsSuppliers = !suppliers.length;
        const needsSellerCompanies = !sellerCompanies.length;
        const needsCompanies = !companies.length;
        const needsCommodities = !allCommodities.length;

        const [
          orderRes,
          consigneesRows,
          buyersRows,
          suppliersRows,
          sellerCompaniesRows,
          companiesRows,
          commoditiesRows,
        ] = await Promise.all([
          orderPromise,
          needsConsignees
            ? fetchAllPages("/consignees", { limit: 200 }).catch(() => [])
            : Promise.resolve(consignees),
          needsBuyers
            ? fetchAllPages("/buyers", { limit: 200 }).catch(() => [])
            : Promise.resolve(buyers),
          needsSuppliers
            ? fetchAllPages("/sellers", { limit: 200 }).catch(() => [])
            : Promise.resolve(suppliers),
          needsSellerCompanies
            ? fetchAllPages("/seller-company", { limit: 200 }).catch(() => [])
            : Promise.resolve(sellerCompanies),
          needsCompanies
            ? fetchAllPages("/companies", { limit: 200 }).catch(() => [])
            : Promise.resolve(companies),
          needsCommodities
            ? fetchAllPages("/commodities", { limit: 500 }).catch(() => [])
            : Promise.resolve(allCommodities),
        ]);

        const data = orderRes.data;
        if (data) {
          const allowedGstValues = [0, 5, 18, 40];
          const processedGst = allowedGstValues.includes(Number(data.gst))
            ? Number(data.gst)
            : 0;
          const processedData = {
            ...INITIAL_FORM_DATA,
            ...data,
            gst: processedGst,
            consignee: data.consignee || "",
            poDate: data.poDate ? new Date(data.poDate) : new Date(),
            deliveryDate: data.deliveryDate
              ? new Date(data.deliveryDate)
              : new Date(),
            loadingDate: data.loadingDate
              ? new Date(data.loadingDate)
              : new Date(),
          };
          setFormData(processedData);
          setOriginalFormData(JSON.parse(JSON.stringify(processedData)));
          setSelectedEmails({
            buyer: data.sendPOToBuyer === "yes",
            supplier: data.sendPOToSupplier === "yes",
          });
        }

        if (needsConsignees) setConsignees(consigneesRows);
        if (needsBuyers) setBuyers(buyersRows);
        if (needsSuppliers) setSuppliers(suppliersRows);
        if (needsSellerCompanies) setSellerCompanies(sellerCompaniesRows);
        if (needsCompanies) setCompanies(companiesRows);
        if (needsCommodities) setAllCommodities(commoditiesRows);

        hasFetchedInitialData.current = true;
      } catch (error) {
        if (api.isCancel(error)) return;
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch required data.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, navigate]);

  const handleChange = useCallback((field, value) => {
    if (field === "buyerBrokerageMap") {
      setBuyerBrokerageMap(value || {});
      return;
    }

    setFormData((prev) => {
      if (typeof field === "object" && field.nested) {
        const { key, subKey } = field;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const applySariaAIOrderEdit = useCallback(
    (command) => {
      const currentCommodity = (formData.buyerCommodity || []).find(
        (item) =>
          (item.name || item.label) === formData.commodity ||
          String(item.commodityId || item._id || item.value) ===
            String(formData.commodity),
      );
      const edit = parseSariaOrderEditCommand(
        command,
        currentCommodity?.parameters || [],
      );

      if (!edit || edit.invalidField) {
        return [
          "Tell me one field and its new value, for example:",
          "`Change Commodity to Wheat`",
          "`Set Buyers PO Number to PO-123`",
          "`Change Supplier to Hansaria Traders`",
          "`Set Quantity to 120`",
          "`Set Notes to Call buyer tomorrow`",
          "You can also say `clear Buyers PO Number`. I will ask you to reply yes or no before saving.",
        ].join("\n");
      }

      const value = edit.value.trim();
      const normalize = (text) => String(text || "").trim().toLowerCase();
      const findByNameOrId = (rows, candidate, nameKeys) =>
        rows.find(
          (item) =>
            nameKeys.some((key) => normalize(item?.[key]) === normalize(candidate)) ||
            String(item?._id || item?.value || "") === candidate,
        );
      const toEmailList = (rawEmails) =>
        (Array.isArray(rawEmails) ? rawEmails : [])
          .map((email) =>
            typeof email === "string"
              ? email
              : (email?.value ?? email?.email ?? ""),
          )
          .filter(Boolean);
      const beginPendingSave = () => {
        if (!pendingSariaAISnapshot.current) {
          pendingSariaAISnapshot.current = {
            formData: { ...formData },
            selectedEmails: { ...selectedEmails },
          };
        }
        setHasPendingSariaAISave(true);
      };
      const stage = (updates) => {
        beginPendingSave();
        setFormData((previous) => ({ ...previous, ...updates }));
      };

      if (edit.type === "parameter") {
        if (!value && edit.operation !== "clear") {
          return "Enter a value for that quality parameter.";
        }
        const parameter = (formData.parameters || []).find(
          (item) =>
            String(item.id || item.parameterId || item._id) ===
            String(edit.parameterId),
        );
        if (!parameter) {
          return "That quality parameter is no longer available for the selected commodity.";
        }
        const updatedParameters = formData.parameters.map((item) =>
          String(item.id || item.parameterId || item._id) ===
          String(edit.parameterId)
            ? { ...item, [edit.parameterField]: value }
            : item,
        );
        stage({ parameters: updatedParameters });
        return `Staged ${edit.name} as ${value || "blank"}. Save these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Buyer") {
        const buyer = findByNameOrId(buyers, value, ["name"]);
        if (!buyer) return `I could not find a buyer matching "${value}".`;

        const currentCompany = companies.find(
          (company) =>
            String(company._id) === String(formData.companyId) ||
            normalize(company.companyName) === normalize(formData.buyerCompany),
        );
        const canKeepCompany = (buyer.companyIds || []).some(
          (companyId) => String(companyId) === String(currentCompany?._id),
        );
        const buyerEmails = toEmailList(buyer.email);
        const updates = {
          buyer: buyer.name,
          buyerMobile: Array.isArray(buyer.mobile)
            ? buyer.mobile[0] || ""
            : buyer.mobile || "",
          buyerEmail: buyerEmails[0] || "",
          buyerEmails: buyerEmails.length ? buyerEmails : [""],
        };

        if (!canKeepCompany) {
          Object.assign(updates, {
            buyerCompany: "",
            companyId: null,
            consignee: "",
            commodity: "",
            parameters: [],
            buyerCommodity: [],
          });
          handleChange("buyerBrokerageMap", {});
        }
        stage(updates);
        return `Staged Buyer as ${buyer.name}${canKeepCompany ? "" : ". Choose a company and commodity if needed"}\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Buyer Company") {
        const company = findByNameOrId(companies, value, ["companyName"]);
        if (!company) return `I could not find a buyer company matching "${value}".`;

        let buyer = buyers.find((item) =>
          (item.companyIds || []).some(
            (companyId) => String(companyId) === String(company._id),
          ),
        );
        const currentBuyer = buyers.find(
          (item) =>
            item.name === formData.buyer ||
            String(item._id) === String(formData.buyer),
        );
        if (
          currentBuyer &&
          (currentBuyer.companyIds || []).some(
            (companyId) => String(companyId) === String(company._id),
          )
        ) {
          buyer = currentBuyer;
        }
        if (!buyer) {
          return `The company "${company.companyName}" is not linked to a buyer.`;
        }

        const buyerEmails = toEmailList(buyer.email);
        const enrichedCommodities = (company.commodities || []).map(
          (companyCommodity) => {
            const commodity = allCommodities.find(
              (item) =>
                String(item._id) === String(companyCommodity.commodityId),
            );
            if (!commodity) return companyCommodity;
            return {
              ...companyCommodity,
              name: commodity.name,
              hsnCode: commodity.hsnCode,
              parameters: (companyCommodity.parameters || []).map(
                (companyParameter) => {
                  const parameter = (commodity.parameters || []).find(
                    (item) =>
                      String(item._id) ===
                      String(companyParameter.parameterId),
                  );
                  return {
                    ...companyParameter,
                    parameter: parameter?.parameter || "",
                  };
                },
              ),
            };
          },
        );
        const brokerageMap = {};
        enrichedCommodities.forEach((item) => {
          if (item.name && item.brokerage != null) {
            brokerageMap[item.name] = item.brokerage;
          }
        });
        Object.entries(buyer.brokerageByName || {}).forEach(
          ([name, brokerage]) => {
            if (brokerageMap[name] == null) brokerageMap[name] = brokerage;
          },
        );
        Object.entries(buyer.brokerage || {}).forEach(
          ([commodityId, brokerage]) => {
            const commodity = allCommodities.find(
              (item) => String(item._id) === String(commodityId),
            );
            if (commodity && brokerageMap[commodity.name] == null) {
              brokerageMap[commodity.name] = brokerage;
            }
          },
        );

        stage({
          buyer: buyer.name,
          buyerCompany: company.companyName || "",
          companyId: company._id,
          location: company.location || "",
          state: company.state || "",
          district: company.district || "",
          pinCode: company.pinCode || "",
          gstNumber: company.gstNumber || "",
          panNumber: company.panNumber || "",
          buyerEmail: buyerEmails[0] || "",
          buyerMobile: Array.isArray(buyer.mobile)
            ? buyer.mobile[0] || ""
            : buyer.mobile || "",
          buyerEmails: buyerEmails.length ? buyerEmails : [""],
          buyerCommodity: enrichedCommodities,
          consignee: "",
          commodity: "",
          parameters: [],
        });
        handleChange("buyerBrokerageMap", brokerageMap);
        return `Staged Buyer Company as ${company.companyName}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Commodity") {
        const commodity = findByNameOrId(
          formData.buyerCommodity || [],
          value,
          ["name", "label"],
        );
        if (!commodity) {
          return `I could not find "${value}" in the selected buyer company's commodities. Choose a buyer company first.`;
        }
        const parameters = (commodity.parameters || []).map((item) => {
          const parameterId =
            item._id ||
            item.id ||
            item.parameterId ||
            item.parameter?._id ||
            item.parameter?.value ||
            "";
          const parameterValue = item.values?.[0] || {};
          return {
            id: parameterId,
            parameterId,
            value: item.value ?? "",
            baseValue: parameterValue.baseValue ?? item.value ?? "",
            maxValue: parameterValue.maxValue ?? "",
          };
        });
        stage({
          commodity: commodity.name || commodity.label,
          parameters,
        });
        return `Staged Commodity as ${commodity.name || commodity.label}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Supplier") {
        const supplier = findByNameOrId(suppliers, value, [
          "sellerName",
          "name",
        ]);
        if (!supplier) return `I could not find a supplier matching "${value}".`;
        const sellerEmails = toEmailList(supplier.emails);
        const sellerPhones = (Array.isArray(supplier.phoneNumbers)
          ? supplier.phoneNumbers
          : []
        )
          .map((phone) =>
            typeof phone === "string"
              ? phone
              : (phone?.value ?? phone?.phone ?? ""),
          )
          .filter(Boolean);
        const supplierBrokerage = (supplier.commodities || []).map((item) => ({
          name: item.name,
          brokerage: item.brokerage,
        }));
        const supplierCompany = (supplier.companies || []).includes(
          formData.supplierCompany,
        )
          ? formData.supplierCompany
          : "";
        stage({
          supplier: supplier._id,
          supplierName: supplier.sellerName || supplier.name || "",
          supplierCompany,
          sellerEmails: sellerEmails.length ? sellerEmails : [""],
          sellerMobile: sellerPhones[0] || "",
          supplierBrokerage,
          supplierBrokerageDetails: supplierBrokerage,
        });
        return `Staged Supplier as ${supplier.sellerName || supplier.name}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Supplier Company") {
        const supplier = suppliers.find(
          (item) =>
            String(item._id) === String(formData.supplier?._id || formData.supplier),
        );
        const company = (supplier?.companies || []).find(
          (item) => normalize(item) === normalize(value),
        );
        if (!company) {
          return `I could not find "${value}" among the selected supplier's companies.`;
        }
        stage({ supplierCompany: company });
        return `Staged Supplier Company as ${company}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.name === "Consignee") {
        const consignee = findByNameOrId(consignees, value, ["name", "label"]);
        if (!consignee) return `I could not find a consignee matching "${value}".`;
        const company = companies.find(
          (item) =>
            String(item._id) === String(formData.companyId) ||
            normalize(item.companyName) === normalize(formData.buyerCompany),
        );
        if (
          company &&
          !(company.consigneeIds || []).some(
            (idValue) => String(idValue) === String(consignee._id),
          )
        ) {
          return `"${consignee.name || consignee.label}" is not linked to the selected buyer company.`;
        }
        stage({
          consignee: consignee.name || consignee.label,
          billTo: "consignee",
        });
        return `Staged Consignee as ${consignee.name || consignee.label}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      if (edit.type === "number" && value !== "" && !Number.isFinite(Number(value))) {
        return `${edit.name} must be a number.`;
      }
      if (edit.type === "yesNo" && !["yes", "no"].includes(normalize(value))) {
        return `${edit.name} must be set to yes or no.`;
      }
      if (edit.type === "billTo" && !["buyer", "consignee"].includes(normalize(value))) {
        return "Bill To must be set to buyer or consignee.";
      }

      let updatedValue = value;
      if (edit.type === "number" && value !== "") {
        updatedValue = Number(value);
      } else if (edit.type === "date") {
        updatedValue = value ? new Date(value) : null;
        if (value && Number.isNaN(updatedValue.getTime())) {
          return `I could not read "${value}" as a date. Use a date such as 2026-10-25.`;
        }
      } else if (edit.type === "yesNo" || edit.type === "billTo") {
        updatedValue = normalize(value);
      }

      if (
        edit.name === "Email Notification to Buyer" ||
        edit.name === "Email Notification to Supplier"
      ) {
        const recipient =
          edit.name === "Email Notification to Buyer" ? "buyer" : "supplier";
        beginPendingSave();
        setSelectedEmails((previous) => ({
          ...previous,
          [recipient]: updatedValue === "yes",
        }));
        setHasPendingSariaAISave(true);
        return `Staged email notification to ${recipient} as ${updatedValue}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
      }

      const directFieldByName = {
        "Buyers PO Number": "poNumber",
        "PO Date": "poDate",
        State: "state",
        Quantity: "quantity",
        "Pending Quantity": "pendingQuantity",
        Rate: "rate",
        GST: "gst",
        CD: "cd",
        Weight: "weight",
        "Payment Terms": "paymentTerms",
        "Delivery Date": "deliveryDate",
        "Loading Date": "loadingDate",
        Location: "location",
        District: "district",
        "PIN Code": "pinCode",
        "GST Number": "gstNumber",
        "PAN Number": "panNumber",
        "Buyer Email": "buyerEmail",
        "Buyer Mobile": "buyerMobile",
        "Seller Email": "sellerEmails",
        "Seller Mobile": "sellerMobile",
        "Agent Name": "agentName",
        Notes: "notes",
        "Send PO to Buyer": "sendPOToBuyer",
        "Send PO to Supplier": "sendPOToSupplier",
        "Bill To": "billTo",
        "Sauda Number": "saudaNo",
      };
      const directField = directFieldByName[edit.name];
      if (!directField) return `I cannot edit ${edit.name} from this order form.`;

      if (directField === "State" && value) {
        const state = statesData.find(
          (item) => normalize(item.state) === normalize(value),
        );
        if (!state) return `I could not find the state "${value}" in the list.`;
        updatedValue = state.state;
      }
      if (directField === "Buyer Email") {
        stage({
          buyerEmail: updatedValue,
          buyerEmails: [updatedValue || ""],
        });
      } else if (directField === "Seller Email") {
        stage({ sellerEmails: [updatedValue || ""] });
      } else if (directField === "Notes") {
        stage({ notes: [updatedValue || ""] });
      } else if (directField === "Agent Name") {
        stage({ [directField]: String(updatedValue).toUpperCase() });
      } else {
        stage({ [directField]: updatedValue });
      }

      return `Staged ${edit.name} as ${value || "blank"}.\n\nSave these changes to Sauda ${formData.saudaNo}? Reply yes to save or no to cancel.`;
    },
    [
      allCommodities,
      buyers,
      companies,
      consignees,
      formData,
      handleChange,
      selectedEmails,
      suppliers,
    ],
  );

  const getChangedFields = useCallback(() => {
    if (!originalFormData) return formData;

    const isEqual = (a, b) => {
      if (a === b) return true;
      if (typeof a !== typeof b) return false;
      if (a === null || b === null) return false;
      if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
      }
      if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => isEqual(a[key], b[key]));
      }
      return false;
    };

    const changes = {};
    Object.keys(formData).forEach(key => {
      if (!isEqual(formData[key], originalFormData[key])) {
        changes[key] = formData[key];
      }
    });

    return changes;
  }, [formData, originalFormData]);

  const validateFormData = useCallback(() => {
    const errors = [];
    if (!formData.buyer) errors.push("Buyer name is required.");
    if (!formData.saudaNo) errors.push("Sauda No is required.");
    if (!formData.commodity) errors.push("Commodity is required.");
    if (!formData.supplier) errors.push("Supplier is required.");

    if (formData.commodity) {
      const buyerCommodities = formData.buyerCommodity || [];
      const supplierCommodities = formData.supplierBrokerage || [];

      const buyerHasCommodity = buyerCommodities.some(
        (c) => (typeof c === "string" ? c : c.name) === formData.commodity,
      );
      const supplierHasCommodity = supplierCommodities.some(
        (c) => (typeof c === "string" ? c : c.name) === formData.commodity,
      );

      if (!buyerHasCommodity) {
        errors.push(`Buyer does not deal in ${formData.commodity}.`);
      }
      if (!supplierHasCommodity) {
        errors.push(`Supplier does not deal in ${formData.commodity}.`);
      }
    }

    if (
      formData.buyerEmails?.some(
        (email) => email.trim() && !regexPatterns.email.test(email.trim()),
      )
    ) {
      errors.push("Invalid buyer email format.");
    }
    if (
      formData.sellerEmails?.some(
        (email) => email.trim() && !regexPatterns.email.test(email.trim()),
      )
    ) {
      errors.push("Invalid seller email format.");
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err, { position: "top-right" }));
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateFormData()) return false;
    if (!id) {
      toast.error("Cannot update: missing order id.");
      return false;
    }

    setIsLoading(true);

    try {
      const quantity = Number(formData.quantity) || 0;
      const pendingQuantity =
        formData.pendingQuantity !== ""
          ? Number(formData.pendingQuantity)
          : quantity;

      const changedFields = getChangedFields();
      
      const payload = {
        ...changedFields,
        quantity: quantity,
        pendingQuantity: pendingQuantity,
        status: formData.status || "active",
        rate: Number(formData.rate) || 0,
        gst: Number(formData.gst) || 0,
        cd: Number(formData.cd) || 0,
        weight: formData.weight || "",
        sendPOToBuyer: selectedEmails.buyer ? "yes" : "no",
        sendPOToSupplier: selectedEmails.supplier ? "yes" : "no",
        buyerBrokerage: {
          brokerageBuyer:
            Number(formData.buyerBrokerage?.brokerageBuyer ?? 0) || 0,
          brokerageSupplier:
            Number(formData.buyerBrokerage?.brokerageSupplier ?? 0) || 0,
        },
      };

      await api.put(`${API_BASE_URL}/${id}`, payload);
      clearApiCache();
      
      const updatedOrder = { ...formData, ...payload };
      Promise.resolve().then(async () => {
        try {
          await sendSaudaOrderEmails(updatedOrder);
        } catch (emailError) {
          console.error("Auto email error:", emailError);
        }
      });

      toast.success("Order updated successfully! Redirecting...", {
        position: "top-right",
      });
      setHasPendingSariaAISave(false);
      pendingSariaAISnapshot.current = null;
      navigate("/manage-order/list-self-order");
      return true;
    } catch (error) {
      console.error(
        "Update Order API Error:",
        error.response?.data || error.message,
      );
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to update order";
      if (error.response?.status === 409) {
        toast.warn(errorMsg, { position: "top-right" });
      } else {
        toast.error(`Update failed: ${errorMsg}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, id, navigate, validateFormData, getChangedFields, selectedEmails]);

  useEffect(() => {
    if (
      isFetching ||
      !hasFetchedInitialData.current ||
      !state?.aiOrderEditCommand ||
      pendingCommandHandled.current
    ) {
      return;
    }

    pendingCommandHandled.current = true;
    const response = applySariaAIOrderEdit(state.aiOrderEditCommand);
    window.dispatchEvent(
      new CustomEvent(SARIA_AI_ORDER_EDIT_RESULT_EVENT, {
        detail: { content: response },
      }),
    );
  }, [applySariaAIOrderEdit, isFetching, state]);

  useEffect(() => {
    const handleSariaOrderEdit = async (event) => {
      event.preventDefault();
      const command = event.detail.command.trim();
      let response;

      if (/^(?:yes|confirm|save)\s*[.!]?$/i.test(command)) {
        if (!hasPendingSariaAISave) {
          response = "There are no pending Saria AI changes to save.";
        } else {
          response = (await handleSubmit())
            ? `Sauda ${formData.saudaNo} was updated successfully.`
            : "The order was not saved. Check the form errors and try again.";
        }
      } else if (/^(?:no|cancel)\s*[.!]?$/i.test(command)) {
        if (hasPendingSariaAISave && pendingSariaAISnapshot.current) {
          setFormData(pendingSariaAISnapshot.current.formData);
          setSelectedEmails(pendingSariaAISnapshot.current.selectedEmails);
          setHasPendingSariaAISave(false);
          pendingSariaAISnapshot.current = null;
          response = `Cancelled the changes to Sauda ${formData.saudaNo}. Nothing was saved.`;
        } else {
          response = "There are no pending changes to cancel.";
        }
      } else {
        response = applySariaAIOrderEdit(command);
      }

      event.detail.response = response;
      event.detail.respond?.(response);
    };

    window.addEventListener(SARIA_AI_ORDER_EDIT_EVENT, handleSariaOrderEdit);
    return () =>
      window.removeEventListener(
        SARIA_AI_ORDER_EDIT_EVENT,
        handleSariaOrderEdit,
      );
  }, [
    applySariaAIOrderEdit,
    formData.saudaNo,
    handleSubmit,
    hasPendingSariaAISave,
  ]);

  if (isFetching) return <Loading />;

  const sectionClass =
    "lux-card rounded-2xl border border-[#ece4d2] bg-lux-cream p-5 shadow-md shadow-emerald-900/5 sm:p-6";

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={`Edit self order — ${formData.saudaNo || "…"}`}
        subtitle="Update buyer, commodity, and supplier details"
        icon={FaEdit}
        noContentCard
      >
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className={sectionClass}>
            <BuyerInformation
              formData={formData}
              handleChange={handleChange}
              consignees={consignees}
              buyers={buyers}
              companies={companies}
              allCommodities={allCommodities}
            />
          </div>
          <div className={sectionClass}>
            <CommodityInformation
              handleChange={handleChange}
              selectedCompany={formData.buyerCompany}
              buyerCommodity={formData.buyerCommodity}
              brokerageMap={_buyerBrokerageMap}
              formData={formData}
            />
          </div>
          <div className={sectionClass}>
            <PODetails formData={formData} handleChange={handleChange} />
          </div>
          <div className={sectionClass}>
            <LoadingStation formData={formData} handleChange={handleChange} />
          </div>
          <div className={sectionClass}>
            <QuantityAndPricing
              formData={formData}
              handleChange={handleChange}
            />
          </div>
          <div className={sectionClass}>
            <SupplierInformation
              formData={formData}
              handleChange={handleChange}
              sellerOptions={suppliers.map((s) => ({
                ...s,
                label: s.sellerName,
                value: s._id,
              }))}
              sellerCompanies={sellerCompanies}
            />
          </div>
          <div className={sectionClass}>
            <BrokerInformation
              formData={formData}
              handleChange={(key, value) => {
                if (key === "buyerBrokerage") {
                  setFormData((prev) => ({
                    ...prev,
                    buyerBrokerage: { ...prev.buyerBrokerage, ...value },
                  }));
                } else {
                  handleChange(key, value);
                }
              }}
            />
          </div>
          <div className={sectionClass}>
            <NotesSection
              notes={formData.notes}
              setNotes={(updatedNotes) => handleChange("notes", updatedNotes)}
            />
          </div>
          <div className={sectionClass}>
            <AdditionalInformation
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <div className={sectionClass}>
            <h3 className="mb-4 font-serif text-base font-semibold text-lux-ink">
              Send Email Notifications
            </h3>
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedEmails.buyer}
                  onChange={(e) =>
                    setSelectedEmails((prev) => ({
                      ...prev,
                      buyer: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-[#d8cfb8] text-lux-emerald focus:ring-lux-gold/40"
                />
                <span className="font-medium text-lux-ink">
                  Send Email to Buyer
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedEmails.supplier}
                  onChange={(e) =>
                    setSelectedEmails((prev) => ({
                      ...prev,
                      supplier: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-[#d8cfb8] text-lux-emerald focus:ring-lux-gold/40"
                />
                <span className="font-medium text-lux-ink">
                  Send Email to Supplier
                </span>
              </label>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="mb-3 font-serif text-base font-semibold text-lux-ink">
              Sauda number
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <DataInput
                  placeholder="Enter Sauda No"
                  value={formData.saudaNo}
                  onChange={(e) => handleChange("saudaNo", e.target.value)}
                  name="saudaNo"
                  inputType="text"
                  size="md"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-8 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/manage-order/list-self-order")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-3.5 text-sm font-bold text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "Updating…" : "Update order"}
            </button>
          </div>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            style={{ zIndex: 9999 }}
          />
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default EditSelfOrder;
