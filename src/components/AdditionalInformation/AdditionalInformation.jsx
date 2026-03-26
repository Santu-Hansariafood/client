import { Suspense } from "react";
import PropTypes from "prop-types";
import DataInput from "../../common/DataInput/DataInput";
import { AiOutlinePlus, AiOutlineMinus } from "react-icons/ai";
import Loading from "../../common/Loading/Loading";

const AdditionalInformation = ({ formData, handleChange }) => {
  const buyerEmailsSection = formData.buyerEmails.map((email, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <DataInput
        placeholder={`Buyer Email ${index + 1}`}
        value={index === 0 ? formData.buyerEmail : email}
        onChange={(e) => {
          const v = e.target.value;
          if (index === 0) {
            handleChange("buyerEmail", v);
            handleEmailChange("buyerEmails", 0, v);
          } else {
            handleEmailChange("buyerEmails", index, v);
          }
        }}
      />
      {index > 0 && (
        <button
          type="button"
          onClick={() => handleRemoveEmail("buyerEmails", index)}
          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Remove email"
        >
          <AiOutlineMinus size={20} />
        </button>
      )}
      {index === formData.buyerEmails.length - 1 && (
        <button
          type="button"
          onClick={() => handleAddEmail("buyerEmails")}
          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Add email"
        >
          <AiOutlinePlus size={20} />
        </button>
      )}
    </div>
  ));

  const sellerEmailsSection = formData.sellerEmails.map((email, index) => (
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
          type="button"
          onClick={() => handleRemoveEmail("sellerEmails", index)}
          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Remove email"
        >
          <AiOutlineMinus size={20} />
        </button>
      )}
      {index === formData.sellerEmails.length - 1 && (
        <button
          type="button"
          onClick={() => handleAddEmail("sellerEmails")}
          className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="Add email"
        >
          <AiOutlinePlus size={20} />
        </button>
      )}
    </div>
  ));

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
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Additional Information
      </label>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Emails are filled from the selected company and supplier. You can add or edit as needed.
      </p>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Buyer Emails
        </label>
        {buyerEmailsSection}
      </div>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Seller Emails
        </label>
        {sellerEmailsSection}
      </div>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Send Purchase Order (PO)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400">To Buyer</label>
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
            <label className="block text-sm text-slate-600 dark:text-slate-400">To Supplier</label>
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
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Bill To
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="billTo"
              value="buyer"
              checked={formData.billTo === "buyer" || formData.billTo === "none"}
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
    // Legacy orders may still store billTo as "none"; we treat it as Buyer.
    billTo: PropTypes.oneOf(["buyer", "consignee", "none", ""]).isRequired,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default AdditionalInformation;
