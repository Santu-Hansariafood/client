import React, { useState } from "react";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import FileUpload from "../../../common/FileUpload/FileUpload";
import Buttons from "../../../common/Buttons/Buttons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import stateCityData from "../../../data/state-city.json";
import axios from "axios";

const AddSellerCompany = () => {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    gstNo: "",
    panNo: "",
    aadhaarNo: "",
    address: "",
    pinNo: "",
  });
  const [bankDetails, setBankDetails] = useState([
    {
      id: Date.now(),
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
    },
  ]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [msme, setMsme] = useState(false);
  const [msmeDetails, setMsmeDetails] = useState({ msmeNo: "" });
  const [fileUploads, setFileUploads] = useState({});

  const resetForm = () => {
    setCompanyInfo({
      companyName: "",
      gstNo: "",
      panNo: "",
      aadhaarNo: "",
      address: "",
      pinNo: "",
    });
    setBankDetails([
      {
        id: Date.now(),
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
    ]);
    setSelectedState(null);
    setSelectedDistrict(null);
    setDistrictOptions([]);
    setMsme(false);
    setMsmeDetails({ msmeNo: "" });
    setFileUploads({});
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankDetailChange = (id, name, value) => {
    setBankDetails((prev) =>
      prev.map((bank) => (bank.id === id ? { ...bank, [name]: value } : bank))
    );
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

  const addBankDetail = () => {
    setBankDetails((prev) => [
      ...prev,
      {
        id: Date.now(),
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
    ]);
  };

  const removeBankDetail = (id) => {
    setBankDetails((prev) => prev.filter((bank) => bank.id !== id));
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
          bank.branchName
      )
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    const formData = new FormData();

    // Append form data
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
      const response = await axios.post(
        "http://localhost:5000/api/seller-company",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Seller company added successfully!");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add seller company. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-16 bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          Add Seller Company
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <DataInput
            placeholder="Company Name"
            name="companyName"
            value={companyInfo.companyName}
            onChange={handleCompanyInfoChange}
            required
          />
          <DataInput
            placeholder="GST No"
            name="gstNo"
            value={companyInfo.gstNo}
            onChange={handleCompanyInfoChange}
            required
          />
          <DataInput
            placeholder="PAN No"
            name="panNo"
            value={companyInfo.panNo}
            onChange={handleCompanyInfoChange}
            required
          />
          <DataInput
            placeholder="Address"
            name="address"
            value={companyInfo.address}
            onChange={handleCompanyInfoChange}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <DataDropdown
            options={stateCityData.map((state) => ({
              value: state.state,
              label: state.state,
            }))}
            placeholder="Select State"
            onChange={handleStateChange}
          />
          <DataDropdown
            options={districtOptions}
            placeholder="Select District"
            onChange={(selected) => setSelectedDistrict(selected)}
          />
          <DataInput
            placeholder="PIN No"
            name="pinNo"
            value={companyInfo.pinNo}
            onChange={handleCompanyInfoChange}
            required
          />
          <DataInput
            placeholder="Aadhaar No/Director"
            name="aadhaarNo"
            value={companyInfo.aadhaarNo}
            onChange={handleCompanyInfoChange}
            required
          />
        </div>
        <h3 className="text-lg font-semibold mb-2">Bank Details</h3>
        {bankDetails.map((bank, index) => (
          <div key={bank.id} className="mb-4 border p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <DataInput
                placeholder="Account Holder Name"
                value={bank.accountHolderName}
                onChange={(e) =>
                  handleBankDetailChange(
                    bank.id,
                    "accountHolderName",
                    e.target.value
                  )
                }
                required
              />
              <DataInput
                placeholder="Bank Account Number"
                value={bank.accountNumber}
                onChange={(e) =>
                  handleBankDetailChange(
                    bank.id,
                    "accountNumber",
                    e.target.value
                  )
                }
                required
              />
              <DataInput
                placeholder="IFSC Code"
                value={bank.ifscCode}
                onChange={(e) =>
                  handleBankDetailChange(bank.id, "ifscCode", e.target.value)
                }
                required
              />
              <DataInput
                placeholder="Branch Name"
                value={bank.branchName}
                onChange={(e) =>
                  handleBankDetailChange(bank.id, "branchName", e.target.value)
                }
                required
              />
            </div>
            {index > 0 && (
              <Buttons
                label="Remove"
                onClick={() => removeBankDetail(bank.id)}
                variant="danger"
                size="sm"
              />
            )}
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
        <h3 className="text-lg font-semibold mb-2 mt-4">Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FileUpload
            label="Upload Address Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("addressProof", file)}
            minWidth={300}
            minHeight={300}
          />
          <FileUpload
            label="Upload GST Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("gstProof", file)}
            minWidth={300}
            minHeight={300}
          />
          <FileUpload
            label="Upload PAN Proof"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("panProof", file)}
            minWidth={300}
            minHeight={300}
          />
          <FileUpload
            label="Upload Aadhaar Card"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("aadhaarCard", file)}
            minWidth={300}
            minHeight={300}
          />
          <FileUpload
            label="Upload Check Copy"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("checkCopy", file)}
            minWidth={300}
            minHeight={300}
          />
          <FileUpload
            label="Upload MSME Copy"
            accept="image/*"
            onFileChange={(file) => handleFileUpload("msmeCopy", file)}
            minWidth={300}
            minHeight={300}
          />
        </div>
        <div className="mb-4">
          <label className="text-gray-700 font-semibold">MSME</label>
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="msme"
                value="yes"
                onChange={() => setMsme(true)}
                className="form-radio text-blue-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="msme"
                value="no"
                onChange={() => setMsme(false)}
                className="form-radio text-blue-600"
              />
              <span>No</span>
            </label>
          </div>
          {msme && (
            <div className="mt-4">
              <DataInput
                placeholder="Enter MSME No"
                name="msmeNo"
                value={msmeDetails.msmeNo}
                onChange={(e) =>
                  setMsmeDetails((prev) => ({
                    ...prev,
                    msmeNo: e.target.value,
                  }))
                }
                required
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Buttons
            label="Submit"
            onClick={handleSubmit}
            type="submit"
            variant="primary"
            size="lg"
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AddSellerCompany;
