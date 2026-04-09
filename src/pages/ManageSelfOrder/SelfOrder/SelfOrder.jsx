import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { sendSaudaOrderEmails } from "../../../utils/saudaPdf/sendSaudaOrderEmails";

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
  poDate: new Date(),
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
  deliveryDate: new Date(),
  loadingDate: new Date(),
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

const SelfOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [sellerOptions, setSellerOptions] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [_buyerBrokerageMap, setBuyerBrokerageMap] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sellersRes, companiesRes, buyersRes, sellerCompaniesRes] =
          await Promise.all([
            axios.get("/sellers"),
            axios.get("/companies"),
            axios.get("/buyers"),
            axios.get("/seller-company"),
          ]);

        const sellersData = sellersRes.data || [];
        const companiesData = companiesRes.data || [];
        const buyersData = buyersRes.data || [];
        const sellerCompaniesData = sellerCompaniesRes.data?.data || sellerCompaniesRes.data || [];

        setSellerOptions(
          sellersData
            .map((seller) => ({
              ...seller,
              label: seller.sellerName,
              value: seller._id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setCompanyOptions(
          companiesData
            .map((c) => ({ ...c, label: c.companyName, value: c._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setBuyerOptions(
          buyersData
            .map((b) => ({ ...b, label: b.name, value: b._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setSupplierOptions(
          sellerCompaniesData
            .map((sc) => ({ ...sc, label: sc.companyName, value: sc._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setSellerCompanies(sellerCompaniesData);
      } catch (error) {
        toast.error("Failed to fetch initial data.");
      }
    };

    fetchInitialData();
  }, []);

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

  const API_BASE_URL = "/self-order";

  const handleChange = (field, value) => {
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
  };

  const validateFormData = () => {
    const errors = [];
    if (!formData.buyer) errors.push("Buyer name is required.");
    if (!formData.saudaNo) errors.push("Sauda No is required.");
    if (!formData.commodity) errors.push("Commodity is required.");
    if (!formData.supplier) errors.push("Supplier is required.");

    if (formData.commodity) {
      const buyerCommodities = formData.buyerCommodity || [];
      const supplierCommodities = formData.supplierBrokerage || [];

      const buyerHasCommodity = buyerCommodities.some(
        (c) =>
          (typeof c === "string" ? c : c.name)?.trim().toLowerCase() ===
          formData.commodity.trim().toLowerCase(),
      );
      const supplierHasCommodity = supplierCommodities.some(
        (c) =>
          (typeof c === "string" ? c : c.name)?.trim().toLowerCase() ===
          formData.commodity.trim().toLowerCase(),
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
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSubmit = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);

    try {
      const quantity = Number(formData.quantity) || 0;
      const pendingQuantity = formData.pendingQuantity !== "" ? Number(formData.pendingQuantity) : quantity;
      
      const payload = {
        ...formData,
        quantity: quantity,
        pendingQuantity: pendingQuantity,
        status: "active",
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
      console.log(
        "Final Payload being sent to API:",
        JSON.stringify(payload, null, 2),
      );

      const response = await axios.post(API_BASE_URL, payload);
      const createdOrder = response?.data || payload;

      try {
        await sendSaudaOrderEmails(createdOrder);
      } catch (emailError) {
        console.error("Auto email error:", emailError);
      }

      resetForm();

      setTimeout(() => {
        toast.success("Order created successfully! Redirecting...", {
          position: "top-right",
        });
      }, 500);

      setTimeout(() => navigate("/manage-order/list-self-order"), 2000);
    } catch (error) {
      console.error(
        "Self Order API Error:",
        error.response?.data || error.message,
      );
      toast.error(
        `Failed to create order: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sectionClass =
    "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-md shadow-emerald-900/5";
  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add self order"
        subtitle="Fill in buyer, commodity, PO, and supplier details"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className={sectionClass}>
            <BuyerInformation
              formData={formData}
              handleChange={handleChange}
              buyers={buyerOptions}
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
              supplierOptions={supplierOptions}
              sellerOptions={sellerOptions}
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
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Sauda Number
            </h3>
            <DataInput
              placeholder="Enter Sauda No"
              value={formData.saudaNo}
              onChange={(e) => handleChange("saudaNo", e.target.value)}
              name="saudaNo"
              inputType="text"
              size="md"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Order"}
          </button>

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

export default SelfOrder;
