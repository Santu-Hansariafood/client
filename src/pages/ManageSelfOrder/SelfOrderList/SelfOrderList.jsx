import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BuyerInformation from "../../../components/BuyerInformation/BuyerInformation";
import CommodityInformation from "../../../components/CommodityInformation/CommodityInformation";
import PurchaseOrderDetails from "../../../components/PODetails/PODetails";
import QuantityAndPricing from "../../../components/QuantityPricing/QuantityPricing";
import SupplierInformation from "../../../components/SupplierInformation/SupplierInformation";
import BrokerInformation from "../../../components/BrokerInformation/BrokerInformation";
import NotesList from "../../../components/NotesSection/NotesSection";
import AdditionalInformation from "../../../components/AdditionalInformation/AdditionalInformation";
import LoadingStation from "../../../components/LoadingStation/LoadingStation";
import axios from "axios";

const SelfOrder = () => {
  const [formData, setFormData] = useState({
    buyer: "",
    buyerCompany: "",
    consignee: "",
    buyerEmail: "",
    buyerCommodity: [],
    buyerBrokerage: {
      brokerageBuyer: "",
      brokerageSupplier: "",
    },
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
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleValidation = () => {
    const errors = [];
    if (!formData.buyer) errors.push("Buyer name is required.");
    if (!formData.poNumber) errors.push("PO Number is required.");
    // Add more validations as needed
    if (errors.length) {
      errors.forEach((err) =>
        toast.error(err, { position: toast.POSITION.TOP_RIGHT })
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!handleValidation()) return;
    setIsLoading(true);
    try {
      await axios.post("http://localhost:3000/api/soda", formData);
      toast.success("Data submitted successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });
      setFormData((prev) => ({
        ...prev,
        buyerBrokerage: { brokerageBuyer: "", brokerageSupplier: "" },
      }));
    } catch (error) {
      toast.error("Failed to submit data!", {
        position: toast.POSITION.TOP_RIGHT,
      });
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
      <PurchaseOrderDetails formData={formData} handleChange={handleChange} />
      <LoadingStation formData={formData} handleChange={handleChange} />
      <QuantityAndPricing formData={formData} handleChange={handleChange} />
      <SupplierInformation formData={formData} handleChange={handleChange} />
      <BrokerInformation formData={formData} handleChange={handleChange} />
      <NotesList formData={formData} setFormData={setFormData} />
      <AdditionalInformation formData={formData} handleChange={handleChange} />
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>
      <ToastContainer />
    </div>
  );
};

export default SelfOrder;
