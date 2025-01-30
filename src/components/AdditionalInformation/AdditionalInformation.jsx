import { Suspense, useMemo } from "react";
import PropTypes from "prop-types";
import DataInput from "../../common/DataInput/DataInput";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import Loading from "../../common/Loading/Loading";

const AdditionalInformation = ({ formData, handleChange }) => {
  const buyerEmailsSection = useMemo(() => {
    return formData.buyerEmails.map((email, index) => (
      <div key={index} className="flex items-center gap-2 mb-2">
        <DataInput
          placeholder={`Buyer Email ${index + 1}`}
          value={index === 0 ? formData.buyerEmail : email}
          onChange={(e) =>
            index === 0
              ? handleChange("buyerEmail", e.target.value)
              : handleEmailChange("buyerEmails", index, e.target.value)
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
    ));
  }, [formData.buyerEmails, formData.buyerEmail, handleChange]);

  const sellerEmailsSection = useMemo(() => {
    return formData.sellerEmails.map((email, index) => (
      <div key={index} className="flex items-center gap-2 mb-2">
        <DataInput
          placeholder={`Seller Email ${index + 1}`}
          value={email}
          onChange={(e) =>
            handleChange("sellerEmails", [
              ...formData.sellerEmails.slice(0, index),
              e.target.value,
              ...formData.sellerEmails.slice(index + 1),
            ])
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
    ));
  }, [formData.sellerEmails, handleChange]);

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

  const handleRadioChange = (field, value) => {
    if (value) {
      handleChange(field, value);
    } else {
      handleChange(field, "");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-lg font-semibold text-gray-700">
        Additional Information
      </label>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Buyer Emails
        </label>
        {buyerEmailsSection}
      </div>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Seller Emails
        </label>
        {sellerEmailsSection}
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
                    handleRadioChange("sendPOToBuyer", e.target.value)
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
                    handleRadioChange("sendPOToBuyer", e.target.value)
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
                    handleRadioChange("sendPOToSupplier", e.target.value)
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
                    handleRadioChange("sendPOToSupplier", e.target.value)
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
              onChange={(e) => handleRadioChange("billTo", e.target.value)}
            />
            <span className="ml-2">None</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="billTo"
              value="buyer"
              checked={formData.billTo === "buyer"}
              onChange={(e) => handleRadioChange("billTo", e.target.value)}
            />
            <span className="ml-2">Buyer</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="billTo"
              value="consignee"
              checked={formData.billTo === "consignee"}
              onChange={(e) => handleRadioChange("billTo", e.target.value)}
            />
            <span className="ml-2">Consignee</span>
          </label>
        </div>
      </div>
    </Suspense>
  );
};

AdditionalInformation.propTypes = {
  formData: PropTypes.shape({
    buyerEmail: PropTypes.string.isRequired,
    buyerEmails: PropTypes.arrayOf(PropTypes.string).isRequired,
    sellerEmails: PropTypes.arrayOf(PropTypes.string).isRequired,
    sendPOToBuyer: PropTypes.oneOf(["yes", "no", ""]).isRequired,
    sendPOToSupplier: PropTypes.oneOf(["yes", "no", ""]).isRequired,
    billTo: PropTypes.oneOf(["none", "buyer", "consignee", ""]).isRequired,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default AdditionalInformation;
