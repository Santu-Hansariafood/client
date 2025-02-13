import { useState, useEffect } from "react";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import FileUpload from "../../../common/FileUpload/FileUpload";
import Buttons from "../../../common/Buttons/Buttons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import stateCityData from "../../../data/state-city.json";
import axios from "axios";

const EditSellerCompany = ({ company, onSave, onCancel }) => {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    gstNo: "",
    panNo: "",
    aadhaarNo: "",
    address: "",
    pinNo: "",
  });
  const [bankDetails, setBankDetails] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [msme, setMsme] = useState(false);
  const [msmeDetails, setMsmeDetails] = useState({ msmeNo: "" });
  const [fileUploads, setFileUploads] = useState({});

  useEffect(() => {
    setCompanyInfo({
      companyName: company.companyName || "",
      gstNo: company.gstNo || "",
      panNo: company.panNo || "",
      aadhaarNo: company.aadhaarNo || "",
      address: company.address || "",
      pinNo: company.pinNo || "",
    });
    setBankDetails(company.bankDetails || []);
    setSelectedState(
      stateCityData.find((state) => state.state === company.state) || null
    );
    setSelectedDistrict({ value: company.district, label: company.district });
    setMsme(!!company.msmeNo);
    setMsmeDetails({ msmeNo: company.msmeNo || "" });

    if (company.state) {
      const stateData = stateCityData.find(
        (state) => state.state === company.state
      );
      setDistrictOptions(
        stateData?.district.map((district) => ({
          value: district,
          label: district,
        })) || []
      );
    }
  }, [company]);

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankDetailChange = (id, name, value) => {
    setBankDetails((prev) =>
      prev.map((bank) => (bank.id === id ? { ...bank, [name]: value } : bank))
    );
  };

  const addBankDetail = () => {
    setBankDetails((prev) => [
      ...prev,
      {
        id: Date.now(),
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        bankName: "",
      },
    ]);
  };

  const removeBankDetail = (id) => {
    setBankDetails((prev) => prev.filter((bank) => bank.id !== id));
  };

  const handleFileUpload = (name, file) => {
    setFileUploads((prev) => ({ ...prev, [name]: file }));
  };

  const handleStateChange = (selected) => {
    setSelectedState(selected);
    const stateData = stateCityData.find(
      (state) => state.state === selected?.value
    );
    setDistrictOptions(
      stateData?.district.map((district) => ({
        value: district,
        label: district,
      })) || []
    );
  };

  const handleSubmit = async () => {
    if (
      !companyInfo.companyName ||
      !companyInfo.gstNo ||
      !companyInfo.panNo ||
      !companyInfo.address ||
      !selectedState ||
      !selectedDistrict ||
      !bankDetails.every(
        (bank) =>
          bank.accountHolderName &&
          bank.accountNumber &&
          bank.ifscCode &&
          bank.branchName &&
          bank.bankName
      )
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    const formData = new FormData();
    Object.entries(companyInfo).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append("state", selectedState?.value);
    formData.append("district", selectedDistrict?.value);
    formData.append("bankDetails", JSON.stringify(bankDetails));
    if (msme) formData.append("msmeNo", msmeDetails.msmeNo);

    Object.entries(fileUploads).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    try {
      const response = await axios.put(
        `https://phpserver-v77g.onrender.com/api/seller-company/${company.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Seller company updated successfully!");
      onSave(response.data);
    } catch (error) {
      toast.error("Failed to update seller company. Please try again.", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 max-w-4xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 bg-gray-100 text-gray-600 hover:text-gray-900 rounded-full p-2 shadow-sm hover:shadow-md transition duration-300"
          aria-label="Close"
        >
          ✖
        </button>
        <h2 className="text-3xl font-bold text-blue-600 mb-6">
          Edit Seller Company
        </h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Company Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DataInput
            label="Company Name"
            id="companyName"
            name="companyName"
            value={companyInfo.companyName}
            onChange={handleCompanyInfoChange}
            placeholder="Enter Company Name"
          />
          <DataInput
            label="GST Number"
            id="gstNo"
            name="gstNo"
            value={companyInfo.gstNo}
            onChange={handleCompanyInfoChange}
            placeholder="Enter GST Number"
          />
          <DataInput
            label="PAN Number"
            id="panNo"
            name="panNo"
            value={companyInfo.panNo}
            onChange={handleCompanyInfoChange}
            placeholder="Enter PAN Number"
          />
          <DataInput
            label="Aadhaar Number"
            id="aadhaarNo"
            name="aadhaarNo"
            value={companyInfo.aadhaarNo}
            onChange={handleCompanyInfoChange}
            placeholder="Enter Aadhaar Number"
          />
          <DataInput
            label="Address"
            id="address"
            name="address"
            value={companyInfo.address}
            onChange={handleCompanyInfoChange}
            placeholder="Enter Address"
          />
          <DataInput
            label="PIN Code"
            id="pinNo"
            name="pinNo"
            value={companyInfo.pinNo}
            onChange={handleCompanyInfoChange}
            placeholder="Enter PIN Code"
          />
        </div>

        {/* State and District */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DataDropdown
            label="Select State"
            id="state"
            options={stateCityData.map((state) => ({
              value: state.state,
              label: state.state,
            }))}
            value={selectedState}
            onChange={handleStateChange}
            placeholder="Select State"
          />
          <DataDropdown
            label="Select District"
            id="district"
            options={districtOptions}
            value={selectedDistrict}
            onChange={(selected) => setSelectedDistrict(selected)}
            placeholder="Select District"
          />
        </div>

        {/* Bank Details */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Bank Details
        </h3>
        {bankDetails.map((bank, index) => (
          <div
            key={bank.id}
            className="mb-6 bg-gray-100 p-4 rounded-lg shadow-md"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataInput
                label="Account Holder Name"
                id={`accountHolderName-${bank.id}`}
                value={bank.accountHolderName}
                onChange={(e) =>
                  handleBankDetailChange(
                    bank.id,
                    "accountHolderName",
                    e.target.value
                  )
                }
                placeholder="Enter Account Holder Name"
              />
              <DataInput
                label="Account Number"
                id={`accountNumber-${bank.id}`}
                value={bank.accountNumber}
                onChange={(e) =>
                  handleBankDetailChange(
                    bank.id,
                    "accountNumber",
                    e.target.value
                  )
                }
                placeholder="Enter Account Number"
              />
              <DataInput
                label="IFSC Code"
                id={`ifscCode-${bank.id}`}
                value={bank.ifscCode}
                onChange={(e) =>
                  handleBankDetailChange(bank.id, "ifscCode", e.target.value)
                }
                placeholder="Enter IFSC Code"
              />
              <DataInput
                label="Branch Name"
                id={`branchName-${bank.id}`}
                value={bank.branchName}
                onChange={(e) =>
                  handleBankDetailChange(bank.id, "branchName", e.target.value)
                }
                placeholder="Enter Branch Name"
              />
              <DataInput
                label="Bank Name"
                id={`bankName-${bank.id}`}
                value={bank.bankName}
                onChange={(e) =>
                  handleBankDetailChange(bank.id, "bankName", e.target.value)
                }
                placeholder="Enter Branch Name"
              />
            </div>
            <div className="flex justify-end mt-4">
              {index > 0 && (
                <Buttons
                  label="Remove Bank Detail"
                  onClick={() => removeBankDetail(bank.id)}
                  variant="danger"
                  size="sm"
                />
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Buttons
            label="Add Bank Detail"
            onClick={addBankDetail}
            variant="success"
            size="sm"
          />
        </div>

        {/* File Upload Section */}
        <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
          Upload Documents
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <FileUpload
            label="Upload Address Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("addressProof", file)}
          />
          <FileUpload
            label="Upload GST Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("gstProof", file)}
          />
          <FileUpload
            label="Upload PAN Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("panProof", file)}
          />
          <FileUpload
            label="Upload Aadhaar Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("aadhaarProof", file)}
          />
        </div>

        {/* MSME Section */}
        <div className="mb-8">
          <label className="text-lg font-semibold text-gray-800">
            MSME Status
          </label>
          <div className="flex items-center space-x-4 mt-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="msme"
                value="yes"
                onChange={() => setMsme(true)}
                checked={msme === true}
                className="form-radio text-blue-600"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="msme"
                value="no"
                onChange={() => setMsme(false)}
                checked={msme === false}
                className="form-radio text-blue-600"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
          {msme && (
            <div className="mt-4">
              <DataInput
                label="MSME Number"
                placeholder="Enter MSME Number"
                name="msmeNo"
                value={msmeDetails.msmeNo}
                onChange={(e) =>
                  setMsmeDetails((prev) => ({
                    ...prev,
                    msmeNo: e.target.value,
                  }))
                }
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Buttons
            label="Update Company Details"
            onClick={handleSubmit}
            type="submit"
            variant="primary"
            size="lg"
          />
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default EditSellerCompany;
