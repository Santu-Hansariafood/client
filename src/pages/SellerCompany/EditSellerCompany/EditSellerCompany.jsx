import { useState, useEffect } from "react";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import FileUpload from "../../../common/FileUpload/FileUpload";
import Buttons from "../../../common/Buttons/Buttons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import stateCityData from "../../../data/state-city.json";
import axios from "axios";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const EditSellerCompany = ({ company, onSave, onCancel }) => {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "",
    gstNo: "",
    panNo: "",
    aadhaarNo: "",
    address: "",
    pinNo: "",
    mobileNo: "",
    email: "",
  });

  const validateEmail = (email) => {
    return regexPatterns.email.test(String(email).toLowerCase());
  };

  const validateMobile = (mobile) => {
    return regexPatterns.mobile.test(String(mobile));
  };

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
      mobileNo: company.mobileNo || "",
      email: company.email || "",
    });
    setBankDetails(
      (company.bankDetails || []).map((bank) => ({
        ...bank,
        id: bank.id || bank._id || Date.now() + Math.random(),
      })),
    );
    setSelectedState(
      stateCityData.find((state) => state.state === company.state) || null,
    );
    setSelectedDistrict({ value: company.district, label: company.district });
    setMsme(!!company.msmeNo);
    setMsmeDetails({ msmeNo: company.msmeNo || "" });

    if (company.state) {
      const stateData = stateCityData.find(
        (state) => state.state === company.state,
      );
      setDistrictOptions(
        stateData?.district.map((district) => ({
          value: district,
          label: district,
        })) || [],
      );
    }
  }, [company]);

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    let newCompanyInfo = { ...companyInfo, [name]: value };

    if (name === "gstNo" && value.length === 15) {
      const pan = value.substring(2, 12).toUpperCase();
      newCompanyInfo.panNo = pan;
    }

    setCompanyInfo(newCompanyInfo);
  };

  const handleBankDetailChange = async (id, name, value) => {
    setBankDetails((prev) =>
      prev.map((bank) => (bank.id === id ? { ...bank, [name]: value } : bank)),
    );

    if (name === "ifscCode" && value.length === 11) {
      try {
        const response = await fetch(
          `https://ifsc.razorpay.com/${value.toUpperCase()}`,
        );
        if (!response.ok) throw new Error("Invalid IFSC Code");
        const data = await response.json();
        const { BANK, BRANCH } = data;
        setBankDetails((prev) =>
          prev.map((bank) =>
            bank.id === id
              ? { ...bank, bankName: BANK, branchName: BRANCH }
              : bank,
          ),
        );
        toast.success("Bank details fetched successfully!");
      } catch (error) {
        console.error("Error fetching bank details:", error);
        toast.error("Invalid IFSC Code or failed to fetch bank details.");
      }
    }
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
      (state) => state.state === selected?.value,
    );
    setDistrictOptions(
      stateData?.district.map((district) => ({
        value: district,
        label: district,
      })) || [],
    );
  };

  const handleSubmit = async () => {
    // Mobile Validation
    if (companyInfo.mobileNo && !validateMobile(companyInfo.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Email Validation
    if (companyInfo.email && !validateEmail(companyInfo.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (
      !companyInfo.companyName ||
      !companyInfo.gstNo ||
      !companyInfo.panNo ||
      !companyInfo.address ||
      !companyInfo.mobileNo ||
      !companyInfo.email ||
      !selectedState ||
      !selectedDistrict ||
      !bankDetails.every(
        (bank) =>
          bank.accountHolderName &&
          bank.accountNumber &&
          bank.ifscCode &&
          bank.branchName &&
          bank.bankName,
      )
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    const payload = {
      ...companyInfo,
      state: selectedState?.value,
      district: selectedDistrict?.value,
      pinNo: companyInfo.pinNo,
      msmeNo: msme ? msmeDetails.msmeNo : "",
      bankDetails,
    };

    try {
      const response = await axios.put(
        `/seller-company/${company._id}`,
        payload,
      );
      toast.success("Seller company updated successfully!");
      onSave(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update seller company. Please try again.",
      );
    }
  };

  return (
    <div className="bg-white p-2">
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
          label="Mobile Number"
          id="mobileNo"
          name="mobileNo"
          value={companyInfo.mobileNo}
          onChange={handleCompanyInfoChange}
          placeholder="Enter 10-digit Mobile Number"
          maxLength="10"
        />
        <DataInput
          label="Email Address"
          id="email"
          name="email"
          value={companyInfo.email}
          onChange={handleCompanyInfoChange}
          placeholder="Enter Email Address"
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
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Bank Details</h3>
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
                  e.target.value,
                )
              }
              placeholder="Enter Account Holder Name"
            />
            <DataInput
              label="Account Number"
              id={`accountNumber-${bank.id}`}
              value={bank.accountNumber}
              onChange={(e) =>
                handleBankDetailChange(bank.id, "accountNumber", e.target.value)
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
              readOnly
              placeholder="Auto-fetched Branch Name"
            />
            <DataInput
              label="Bank Name"
              id={`bankName-${bank.id}`}
              value={bank.bankName}
              readOnly
              placeholder="Auto-fetched Bank Name"
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
      <div className="mt-8 flex justify-end gap-3">
        <Buttons
          label="Cancel"
          onClick={onCancel}
          variant="secondary"
          size="lg"
        />
        <Buttons
          label="Update Company Details"
          onClick={handleSubmit}
          type="submit"
          variant="primary"
          size="lg"
        />
      </div>
    </div>
  );
};

export default EditSellerCompany;
