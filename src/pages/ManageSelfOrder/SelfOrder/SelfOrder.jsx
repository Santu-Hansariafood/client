import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BuyerInformation from "../../../components/BuyerInformation/BuyerInformation";
import CommodityInformation from "../../../components/CommodityInformation/CommodityInformation";
import PODetails from "../../../components/PODetails/PODetails";
import QuantityAndPricing from "../../../components/QuantityPricing/QuantityPricing";
import SupplierInformation from "../../../components/SupplierInformation/SupplierInformation";
import BrokerInformation from "../../../components/BrokerInformation/BrokerInformation";
import NotesSection from "../../../components/NotesSection/NotesSection";
import AdditionalInformation from "../../../components/AdditionalInformation/AdditionalInformation";
import LoadingStation from "../../../components/LoadingStation/LoadingStation";
import axios from "axios";

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

  const API_BASE_URL = "http://localhost:5000/api/self-order";
  const SAUDA_API_URL = "http://localhost:5000/api/sauda-no";

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

    errors.forEach((err) =>
      toast.error(err, { position: toast.POSITION.TOP_RIGHT })
    );

    return errors.length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const generateSaudaNo = async () => {
    try {
      const response = await axios.post(SAUDA_API_URL, formData);
      return response.data.saudaNo;
    } catch (error) {
      toast.error("Failed to generate Sauda No.", {
        position: toast.POSITION.TOP_RIGHT,
      });
      console.error("Error generating Sauda No:", error.message);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateFormData()) return;
  
    setIsLoading(true);
  
    try {
      const saudaNo = await generateSaudaNo();
      const payload = { ...formData, saudaNo };
  
      console.log("Payload being sent to server:", payload);
  
      await axios.post(API_BASE_URL, payload);
  
      toast.success("Order created successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });
  
      resetForm();
  
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast.error("Failed to create order.", {
        position: toast.POSITION.TOP_RIGHT,
      });
      console.error("Error creating order:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
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
  );
};

export default SelfOrder;
