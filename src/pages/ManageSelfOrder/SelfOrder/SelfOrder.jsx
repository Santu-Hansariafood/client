import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";

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
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const INITIAL_FORM_DATA = {
  buyer: "",
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
  billTo: "none",
  saudaNo: "",
};

const SelfOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = "/self-order";

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
    if (!formData.saudaNo) errors.push("Sauda No is required.");

    if (errors.length > 0) {
      errors.forEach((err) =>
        toast.error(err, { position: "top-right" })
      );
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
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        pendingQuantity: Number(formData.pendingQuantity) || 0,
        rate: Number(formData.rate) || 0,
        gst: Number(formData.gst) || 0,
        cd: Number(formData.cd) || 0,
        weight: Number(formData.weight) || 0,
        buyerBrokerage: {
          brokerageBuyer: Number(
            formData.buyerBrokerage?.brokerageBuyer ?? 0
          ) || 0,
          brokerageSupplier: Number(
            formData.buyerBrokerage?.brokerageSupplier ?? 0
          ) || 0,
        },
      };
      console.log(
        "Final Payload being sent to API:",
        JSON.stringify(payload, null, 2)
      );

      await axios.post(API_BASE_URL, payload);

      resetForm();

      setTimeout(() => {
        toast.success("Order created successfully! Redirecting...", {
          position: "top-right",
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

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Sauda Number</h3>
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
