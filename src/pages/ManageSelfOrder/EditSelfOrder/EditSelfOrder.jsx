import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaEdit } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";

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
  gst: "",
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
  const [formData, setFormData] = useState(state?.orderData || INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [_buyerBrokerageMap, setBuyerBrokerageMap] = useState({});
  const [consignees, setConsignees] = useState(state?.consigneeData || []);
  const [buyers, setBuyers] = useState(state?.buyerData || []);
  const [suppliers, setSuppliers] = useState(state?.supplierData || []);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  
  const abortControllerRef = useRef(null);

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
            ? axios.get(`${API_BASE_URL}/${id}`, { signal: abortControllerRef.current.signal })
            : Promise.resolve({ data: orderFromState });

        const [
          orderRes,
          consigneesRows,
          buyersRows,
          suppliersRows,
          sellerCompaniesRows,
        ] = await Promise.all([
          orderPromise,
          fetchAllPages("/consignees", { limit: 200 }).catch(() => []),
          fetchAllPages("/buyers", { limit: 200 }).catch(() => []),
          fetchAllPages("/sellers", { limit: 200 }).catch(() => []),
          fetchAllPages("/seller-company", { limit: 200 }).catch(() => []),
        ]);

        const data = orderRes.data;
        if (data) {
          setFormData({
            ...INITIAL_FORM_DATA,
            ...data,
            consignee: data.consignee || "",
            poDate: data.poDate ? new Date(data.poDate) : new Date(),
            deliveryDate: data.deliveryDate
              ? new Date(data.deliveryDate)
              : new Date(),
            loadingDate: data.loadingDate
              ? new Date(data.loadingDate)
              : new Date(),
          });
        }

        setConsignees(consigneesRows);
        setBuyers(buyersRows);
        setSuppliers(suppliersRows);
        setSellerCompanies(sellerCompaniesRows);
      } catch (error) {
        if (axios.isCancel(error)) return;
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
  }, [id, navigate, state?.orderData]);

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
    if (!validateFormData()) return;
    if (!id) {
      toast.error("Cannot update: missing order id.");
      return;
    }

    setIsLoading(true);

    try {
      const quantity = Number(formData.quantity) || 0;
      const pendingQuantity = formData.pendingQuantity !== "" ? Number(formData.pendingQuantity) : quantity;

      const payload = {
        ...formData,
        quantity: quantity,
        pendingQuantity: pendingQuantity,
        status: formData.status || "active",
        rate: Number(formData.rate) || 0,
        gst: Number(formData.gst) || 0,
        cd: Number(formData.cd) || 0,
        weight: formData.weight || "",
        buyerBrokerage: {
          brokerageBuyer:
            Number(formData.buyerBrokerage?.brokerageBuyer ?? 0) || 0,
          brokerageSupplier:
            Number(formData.buyerBrokerage?.brokerageSupplier ?? 0) || 0,
        },
      };

      await axios.put(`${API_BASE_URL}/${id}`, payload);

      toast.success("Order updated successfully! Redirecting...", {
        position: "top-right",
      });

      setTimeout(() => navigate("/manage-order/list-self-order"), 2000);
    } catch (error) {
      console.error(
        "Update Order API Error:",
        error.response?.data || error.message,
      );
      const errorMsg = error.response?.data?.message || error.message || "Failed to update order";
      toast.error(`Update failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [formData, id, navigate, validateFormData]);

  if (isFetching) return <Loading />;

  const sectionClass =
    "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-md shadow-emerald-900/5";

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title={`Edit self order — ${formData.saudaNo || "…"}`}
        subtitle="Update buyer, commodity, and supplier details"
        icon={FaEdit}
        noContentCard
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className={sectionClass}>
            <BuyerInformation
              formData={formData}
              handleChange={handleChange}
              consignees={consignees}
              buyers={buyers}
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
            <h3 className="text-base font-semibold text-slate-800 mb-3">
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

          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/manage-order/list-self-order")}
              className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 transition-all duration-200"
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

