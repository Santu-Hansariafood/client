import { useState } from "react";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import DateSelector from "../../../common/DateSelector/DateSelector";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SelfOrder = () => {
  
  const [formData, setFormData] = useState({
    buyer: "",
    buyerCompany: "",
    consignee: "",
    commodity: "",
    qualityParameters: "",
    poNumber: "",
    poDate: new Date(),
    state: "",
    district: "",
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
    brokerageBuyer: "",
    brokerageSupplier: "",
    buyerEmails: [""],
    sellerEmails: [""],
    sendPOToBuyer: "yes",
    sendPOToSupplier: "yes",
    billTo: "none",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEmail = (type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ""],
    }));
  };

  const handleRemoveEmail = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleEmailChange = (type, index, value) => {
    setFormData((prev) => {
      const emails = [...prev[type]];
      emails[index] = value;
      return { ...prev, [type]: emails };
    });
  };

  const handleAddNote = () => {
    setFormData((prev) => ({
      ...prev,
      notes: [...prev.notes, ""],
    }));
  };

  const handleRemoveNote = (index) => {
    setFormData((prev) => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index),
    }));
  };

  const handleNoteChange = (index, value) => {
    setFormData((prev) => {
      const notes = [...prev.notes];
      notes[index] = value;
      return { ...prev, notes };
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://localhost:3000/api/soda",
        formData
      );
      toast.success("Data submitted successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });
      console.log("Response:", response.data);

      setFormData({
        buyer: "",
        buyerCompany: "",
        consignee: "",
        commodity: "",
        qualityParameters: "",
        poNumber: "",
        poDate: new Date(),
        state: "",
        district: "",
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
        brokerageBuyer: "",
        brokerageSupplier: "",
        buyerEmails: [""],
        sellerEmails: [""],
        sendPOToBuyer: "yes",
        sendPOToSupplier: "yes",
        billTo: "none",
      });
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Failed to submit data!", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto space-y-6 bg-gray-50 rounded-lg shadow-md">
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Buyer Information
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select Buyer
            </label>
            <DataDropdown
              placeholder="Select Buyer"
              options={[
                { value: "buyer1", label: "Buyer 1" },
                { value: "buyer2", label: "Buyer 2" },
              ]}
              onChange={(value) => handleChange("buyer", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Buyer Company
            </label>
            <DataDropdown
              placeholder="Buyer Company"
              options={[
                { value: "company1", label: "Company 1" },
                { value: "company2", label: "Company 2" },
              ]}
              onChange={(value) => handleChange("buyerCompany", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Consignee
            </label>
            <DataDropdown
              placeholder="Consignee"
              options={[
                { value: "consignee1", label: "Consignee 1" },
                { value: "consignee2", label: "Consignee 2" },
              ]}
              onChange={(value) => handleChange("consignee", value)}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Commodity Information
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select Commodity
            </label>
            <DataDropdown
              placeholder="Select Commodity"
              options={[
                { value: "commodity1", label: "Commodity 1" },
                { value: "commodity2", label: "Commodity 2" },
              ]}
              onChange={(value) => handleChange("commodity", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Quality Parameters
            </label>
            <DataInput
              placeholder="Quality Parameters"
              inputType="number"
              onChange={(e) =>
                handleChange("qualityParameters", e.target.value)
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Purchase Order Details
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              PO Number
            </label>
            <DataInput
              placeholder="PO Number"
              onChange={(e) => handleChange("poNumber", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">PO Date</label>
            <DateSelector
              selectedDate={formData.poDate}
              onChange={(date) => handleChange("poDate", date)}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Loading Station
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select State
            </label>
            <DataDropdown
              placeholder="Select State"
              options={[
                { value: "state1", label: "State 1" },
                { value: "state2", label: "State 2" },
              ]}
              onChange={(value) => handleChange("state", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select District
            </label>
            <DataDropdown
              placeholder="Select District"
              options={[
                { value: "district1", label: "District 1" },
                { value: "district2", label: "District 2" },
              ]}
              onChange={(value) => handleChange("district", value)}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Quantity and Pricing
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <DataInput
              placeholder="Quantity"
              inputType="number"
              onChange={(e) => handleChange("quantity", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Pending Quantity
            </label>
            <DataInput
              placeholder="Pending Quantity"
              inputType="number"
              onChange={(e) => handleChange("pendingQuantity", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Rate (in tons)
            </label>
            <DataInput
              placeholder="Rate (in tons)"
              inputType="number"
              onChange={(e) => handleChange("rate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">GST (%)</label>
            <DataInput
              placeholder="GST"
              inputType="number"
              onChange={(e) => handleChange("gst", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">CD (%)</label>
            <DataInput
              placeholder="CD (%)"
              inputType="number"
              onChange={(e) => handleChange("cd", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Weight</label>
            <DataInput
              placeholder="Weight"
              inputType="number"
              onChange={(e) => handleChange("weight", e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Supplier Information
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select Supplier
            </label>
            <DataDropdown
              placeholder="Select Supplier"
              options={[
                { value: "supplier1", label: "Supplier 1" },
                { value: "supplier2", label: "Supplier 2" },
              ]}
              onChange={(value) => handleChange("supplier", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Supplier Company
            </label>
            <DataDropdown
              placeholder="Select Supplier Company"
              options={[
                { value: "company1", label: "Company 1" },
                { value: "company2", label: "Company 2" },
              ]}
              onChange={(value) => handleChange("supplierCompany", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Payment Terms (in days)
            </label>
            <DataInput
              placeholder="Payment Terms"
              inputType="number"
              onChange={(e) => handleChange("paymentTerms", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Delivery Date
            </label>
            <DateSelector
              selectedDate={formData.deliveryDate}
              onChange={(date) => handleChange("deliveryDate", date)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Loading Date
            </label>
            <DateSelector
              selectedDate={formData.loadingDate}
              onChange={(date) => handleChange("loadingDate", date)}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Notes
        </label>
        <div className="space-y-2">
          {formData.notes.map((note, index) => (
            <div key={index} className="flex items-center gap-2">
              <DataInput
                placeholder={`Note ${index + 1}`}
                value={note}
                onChange={(e) => handleNoteChange(index, e.target.value)}
              />
              {index > 0 && (
                <button
                  onClick={() => handleRemoveNote(index)}
                  className="text-red-500"
                >
                  <AiOutlineMinus size={24} />
                </button>
              )}
              {index === formData.notes.length - 1 && (
                <button onClick={handleAddNote} className="text-green-500">
                  <AiOutlinePlus size={24} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Broker Information
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Broker</label>
            <DataInput
              placeholder="Broker"
              onChange={(e) => handleChange("broker", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Agent Name
            </label>
            <DataDropdown
              placeholder="Agent Name"
              options={[
                { value: "agent1", label: "Agent 1" },
                { value: "agent2", label: "Agent 2" },
              ]}
              onChange={(value) => handleChange("agentName", value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Brokerage Per Ton (Buyer)
            </label>
            <DataInput
              placeholder="Brokerage Per Ton (Buyer)"
              inputType="number"
              onChange={(e) => handleChange("brokerageBuyer", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Brokerage Per Ton (Supplier)
            </label>
            <DataInput
              placeholder="Brokerage Per Ton (Supplier)"
              inputType="number"
              onChange={(e) =>
                handleChange("brokerageSupplier", e.target.value)
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block mb-4 text-lg font-semibold text-gray-700">
          Additional Information
        </label>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Buyer Emails
          </label>
          {formData.buyerEmails.map((email, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <DataInput
                placeholder={`Buyer Email ${index + 1}`}
                value={email}
                onChange={(e) =>
                  handleEmailChange("buyerEmails", index, e.target.value)
                }
              />
              {index > 0 && (
                <button
                  onClick={() => handleRemoveEmail("buyerEmails", index)}
                  className="text-red-500"
                >
                  <AiOutlineMinus size={24} />
                </button>
              )}
              {index === formData.buyerEmails.length - 1 && (
                <button
                  onClick={() => handleAddEmail("buyerEmails")}
                  className="text-green-500"
                >
                  <AiOutlinePlus size={24} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Seller Email Section */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Seller Emails
          </label>
          {formData.sellerEmails.map((email, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <DataInput
                placeholder={`Seller Email ${index + 1}`}
                value={email}
                onChange={(e) =>
                  handleEmailChange("sellerEmails", index, e.target.value)
                }
              />
              {index > 0 && (
                <button
                  onClick={() => handleRemoveEmail("sellerEmails", index)}
                  className="text-red-500"
                >
                  <AiOutlineMinus size={24} />
                </button>
              )}
              {index === formData.sellerEmails.length - 1 && (
                <button
                  onClick={() => handleAddEmail("sellerEmails")}
                  className="text-green-500"
                >
                  <AiOutlinePlus size={24} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Send Purchase Order (PO)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">To Buyer</label>
              <div className="flex gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendPOToBuyer"
                    value="yes"
                    checked={formData.sendPOToBuyer === "yes"}
                    onChange={(e) =>
                      handleChange("sendPOToBuyer", e.target.value)
                    }
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendPOToBuyer"
                    value="no"
                    checked={formData.sendPOToBuyer === "no"}
                    onChange={(e) =>
                      handleChange("sendPOToBuyer", e.target.value)
                    }
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">To Supplier</label>
              <div className="flex gap-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendPOToSupplier"
                    value="yes"
                    checked={formData.sendPOToSupplier === "yes"}
                    onChange={(e) =>
                      handleChange("sendPOToSupplier", e.target.value)
                    }
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="sendPOToSupplier"
                    value="no"
                    checked={formData.sendPOToSupplier === "no"}
                    onChange={(e) =>
                      handleChange("sendPOToSupplier", e.target.value)
                    }
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Bill To
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="billTo"
                value="none"
                checked={formData.billTo === "none"}
                onChange={(e) => handleChange("billTo", e.target.value)}
              />
              <span className="ml-2">None</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="billTo"
                value="buyer"
                checked={formData.billTo === "buyer"}
                onChange={(e) => handleChange("billTo", e.target.value)}
              />
              <span className="ml-2">Buyer</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="billTo"
                value="consignee"
                checked={formData.billTo === "consignee"}
                onChange={(e) => handleChange("billTo", e.target.value)}
              />
              <span className="ml-2">Consignee</span>
            </label>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Submit
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SelfOrder;
