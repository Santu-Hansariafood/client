import DataInput from "../../common/DataInput/DataInput";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";

const AdditionalInformation = ({ formData, handleChange }) => {
  const handleAddEmail = (type) => {
    handleChange(type, [...formData[type], ""]);
  };

  const handleRemoveEmail = (type, index) => {
    const updatedEmails = formData[type].filter((_, i) => i !== index);
    handleChange(type, updatedEmails);
  };

  const handleEmailChange = (type, index, value) => {
    const updatedEmails = [...formData[type]];
    updatedEmails[index] = value;
    handleChange(type, updatedEmails);
  };

  return (
    <div>
      <label className="block mb-4 text-lg font-semibold text-gray-700">
        Additional Information
      </label>

      {/* Buyer Emails Section */}
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

      {/* Seller Emails Section */}
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

      {/* Send Purchase Order (PO) Section */}
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

      {/* Bill To Section */}
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
  );
};

export default AdditionalInformation;
