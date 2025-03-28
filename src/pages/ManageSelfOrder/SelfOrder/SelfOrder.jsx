import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";

// Lazy-loaded components
const BuyerInformation = lazy(() =>
  import("../../../components/BuyerInformation/BuyerInformation")
);
const CommodityInformation = lazy(() =>
  import("../../../components/CommodityInformation/CommodityInformation")
);
const PODetails = lazy(() => import("../../../components/PODetails/PODetails"));
const QuantityAndPricing = lazy(() =>
  import("../../../components/QuantityPricing/QuantityPricing")
);
const SupplierInformation = lazy(() =>
  import("../../../components/SupplierInformation/SupplierInformation")
);
const BrokerInformation = lazy(() =>
  import("../../../components/BrokerInformation/BrokerInformation")
);
const NotesSection = lazy(() =>
  import("../../../components/NotesSection/NotesSection")
);
const AdditionalInformation = lazy(() =>
  import("../../../components/AdditionalInformation/AdditionalInformation")
);
const LoadingStation = lazy(() =>
  import("../../../components/LoadingStation/LoadingStation")
);

const INITIAL_FORM_DATA = {
  buyer: "",
  buyerCompany: "",
  consignee: "",
  buyerEmail: "",
  buyerCommodity: [],
  buyerBrokerage: { brokerageBuyer: "", brokerageSupplier: "" },
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
  billTo: "none",
  saudaNo: "",
};

const SelfOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = "https://api.hansariafood.shop/api/self-order";
  const SAUDA_API_URL = "https://api.hansariafood.shop/api/sauda-no";

  const handleChange = (field, value) => {
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
    if (!formData.poNumber) errors.push("PO Number is required.");

    if (errors.length > 0) {
      errors.forEach((err) =>
        toast.error(err, { position: toast.POSITION.TOP_RIGHT })
      );
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const generateSaudaNo = async () => {
    try {
      console.log("Generating Sauda No with data:", formData);
      const response = await axios.post(SAUDA_API_URL, formData);
      console.log("Sauda No Response:", response.data);

      if (!response.data.saudaNo) {
        throw new Error("Sauda No not generated");
      }

      return response.data.saudaNo;
    } catch (error) {
      toast.error("Failed to generate Sauda No.", {
        position: toast.POSITION.TOP_RIGHT,
      });
      console.error("Error generating Sauda No:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);

    try {
      const saudaNo = await generateSaudaNo();

      if (!saudaNo) {
        toast.error("Sauda No generation failed. Order not submitted.");
        return;
      }

      const payload = { ...formData, saudaNo };

      console.log("Final Payload being sent to API:", JSON.stringify(payload, null, 2));

      await axios.post(API_BASE_URL, payload);

      resetForm();

      setTimeout(() => {
        toast.success("Order created successfully! Redirecting...", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }, 500);

      setTimeout(() => navigate("/manage-order/list-self-order"), 2000);
    } catch (error) {
      console.error("Self Order API Error:", error.response?.data || error.message);
      toast.error(`Failed to create order: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-screen-lg mx-auto space-y-6 bg-gray-50 rounded-lg shadow-md">
        <BuyerInformation formData={formData} handleChange={handleChange} />
        <CommodityInformation
          handleChange={handleChange}
          selectedCompany={formData.buyerCompany}
          buyerCommodity={formData.buyerCommodity}
          brokerage={formData.buyerBrokerage}
          formData={formData}
        />
        <PODetails formData={formData} handleChange={handleChange} />
        <LoadingStation formData={formData} handleChange={handleChange} />
        <QuantityAndPricing formData={formData} handleChange={handleChange} />
        <SupplierInformation formData={formData} handleChange={handleChange} />
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
        <NotesSection
          notes={formData.notes}
          setNotes={(updatedNotes) => handleChange("notes", updatedNotes)}
        />
        <AdditionalInformation formData={formData} handleChange={handleChange} />

        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
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
    </Suspense>
  );
};

export default SelfOrder;
