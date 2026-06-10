import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import FileUpload from "../../../common/FileUpload/FileUpload";
import Buttons from "../../../common/Buttons/Buttons";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { FaBuilding, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import stateCityData from "../../../data/state-city.json";
import api from "../../../utils/apiClient/apiClient";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const EditSellerCompany = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      setCompanyInfo({
        companyName: "",
        gstNo: "",
        panNo: "",
        aadhaarNo: "",
        address: "",
        pinNo: "",
        mobileNo: "",
        email: "",
      });
      setBankDetails([]);
      setSelectedState(null);
      setSelectedDistrict(null);
      setDistrictOptions([]);
      setMsme(false);
      setMsmeDetails({ msmeNo: "" });

      const response = await api.get(`/seller-company/${id}`);
      const company = response.data?.data || response.data;

      if (!company || Object.keys(company).length === 0) {
        throw new Error("No company data found");
      }

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

      const matchedState = stateCityData.find(
        (state) => state.state === company.state,
      );
      if (matchedState) {
        const stateOption = {
          value: matchedState.state,
          label: matchedState.state,
        };
        setSelectedState(stateOption);

        const districts = matchedState.district.map((district) => ({
          value: district,
          label: district,
        }));
        setDistrictOptions(districts);

        const matchedDistrict = districts.find(
          (d) => d.value === company.district,
        );
        setSelectedDistrict(matchedDistrict || null);
      } else {
        setSelectedState(null);
        setSelectedDistrict(null);
        setDistrictOptions([]);
      }

      setMsme(!!company.msmeNo);
      setMsmeDetails({ msmeNo: company.msmeNo || "" });
    } catch (error) {
      console.error("Error fetching company:", error);
      toast.error(
        error.message === "No company data found"
          ? "Company details not found"
          : "Failed to load company details",
      );
      navigate("/seller-company/list");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchCompanyData();
    }
  }, [fetchCompanyData, id]);

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    let newCompanyInfo = { ...companyInfo, [name]: value };

    if (name === "gstNo") {
      if (value === "0") {
        newCompanyInfo.panNo = "";
      } else if (value.length >= 12) {
        const pan = value.substring(2, 12).toUpperCase();
        newCompanyInfo.panNo = pan;
      } else {
        newCompanyInfo.panNo = "";
      }
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
    setSelectedDistrict(null);
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
    if (companyInfo.mobileNo && !validateMobile(companyInfo.mobileNo)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (companyInfo.email && !validateEmail(companyInfo.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (companyInfo.gstNo === "0") {
      if (!companyInfo.panNo) {
        toast.error("PAN number is required when GST is 0");
        return;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(companyInfo.panNo)) {
        toast.error("Invalid PAN number format");
        return;
      }
    } else {
      if (!regexPatterns.gstNo?.test(companyInfo.gstNo)) {
        toast.error("Invalid GST number");
        return;
      }
    }

    const missingFields = [];
    if (!companyInfo.companyName) missingFields.push("Company Name");
    if (!companyInfo.gstNo) missingFields.push("GST Number");
    if (!companyInfo.panNo) missingFields.push("PAN Number");
    if (!companyInfo.address) missingFields.push("Address");
    if (!companyInfo.mobileNo) missingFields.push("Mobile Number");
    if (!companyInfo.email) missingFields.push("Email Address");
    if (!selectedState) missingFields.push("State");
    if (!selectedDistrict) missingFields.push("District");

    const bankIncomplete = bankDetails.some(
      (bank) =>
        !bank.accountHolderName ||
        !bank.accountNumber ||
        !bank.ifscCode ||
        !bank.branchName ||
        !bank.bankName,
    );
    if (bankIncomplete) missingFields.push("Complete Bank Details");

    if (missingFields.length > 0) {
      toast.error(`Please fill: ${missingFields.join(", ")}`);
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
      await api.put(`/seller-company/${id}`, payload);
      toast.success("Seller company updated successfully!");
      navigate("/seller-company/list");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update seller company. Please try again.",
      );
    }
  };

  if (loading) return <Loading />;

  return (
    <AdminPageShell
      title="Edit Seller Company"
      subtitle={`Updating details for ${companyInfo.companyName}`}
      icon={FaBuilding}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/seller-company/list")}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold mb-6 transition-colors"
        >
          <FaArrowLeft size={12} />
          Back to List
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">
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
              placeholder={
                companyInfo.gstNo === "0"
                  ? "Enter PAN Number"
                  : "Auto-filled PAN"
              }
              disabled={companyInfo.gstNo !== "0"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <DataDropdown
              label="Select State"
              id="state"
              options={stateCityData.map((state) => ({
                value: state.state,
                label: state.state,
              }))}
              selectedOptions={selectedState}
              onChange={handleStateChange}
              placeholder="Select State"
            />
            <DataDropdown
              label="Select District"
              id="district"
              options={districtOptions}
              selectedOptions={selectedDistrict}
              onChange={(selected) => setSelectedDistrict(selected)}
              placeholder="Select District"
            />
          </div>

          <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">
            Bank Details
          </h3>
          {bankDetails.map((bank, index) => (
            <div
              key={bank.id}
              className="mb-6 bg-slate-50/50 border border-slate-100 p-6 rounded-2xl shadow-sm"
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
                    handleBankDetailChange(
                      bank.id,
                      "accountNumber",
                      e.target.value,
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

          <h3 className="text-xl font-black text-slate-800 mt-12 mb-6 uppercase tracking-tight">
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

          <div className="mb-8">
            <label className="text-lg font-black text-slate-800 uppercase tracking-tight">
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
                  className="form-radio text-emerald-600"
                />
                <span className="ml-2 font-bold text-slate-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="msme"
                  value="no"
                  onChange={() => setMsme(false)}
                  checked={msme === false}
                  className="form-radio text-emerald-600"
                />
                <span className="ml-2 font-bold text-slate-700">No</span>
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

          <div className="mt-12 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Buttons
              label="Cancel"
              onClick={() => navigate("/seller-company/list")}
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
      </div>
    </AdminPageShell>
  );
};

export default EditSellerCompany;
