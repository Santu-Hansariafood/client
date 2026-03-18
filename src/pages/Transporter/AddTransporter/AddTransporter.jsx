import { useState } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaTruckMoving } from "react-icons/fa";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const AddTransporter = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    vehicleDetails: {
      number: "",
      type: "Lorry",
      ownerName: ""
    },
    driverDetails: {
      name: "",
      licenseNumber: "",
      phoneNumber: ""
    },
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: ""
    },
    status: "Active",
  });

  const vehicleTypeOptions = [
    { value: "Lorry", label: "Lorry" },
    { value: "Pickup", label: "Pickup" },
    { value: "Trailer", label: "Trailer" },
    { value: "Other", label: "Other" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: selectedOption.value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: selectedOption.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/transporters", formData);
      toast.success("Transporter registered successfully!");
      setFormData({
        name: "", email: "", mobile: "", password: "",
        vehicleDetails: { number: "", type: "Lorry", ownerName: "" },
        driverDetails: { name: "", licenseNumber: "", phoneNumber: "" },
        bankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", branchName: "" },
        status: "Active",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register transporter");
    }
  };

  return (
    <AdminPageShell title="Register Transporter" icon={<FaTruckMoving />}>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DataInput label="Transporter Name" name="name" value={formData.name} onChange={handleChange} required />
            <DataInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <DataInput label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
            <DataInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <DataDropdown label="Status" name="status" options={statusOptions} value={statusOptions.find(o => o.value === formData.status)} onChange={handleDropdownChange} required />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Vehicle Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DataInput label="Vehicle Number" name="vehicleDetails.number" value={formData.vehicleDetails.number} onChange={handleChange} required />
            <DataDropdown label="Vehicle Type" name="vehicleDetails.type" options={vehicleTypeOptions} value={vehicleTypeOptions.find(o => o.value === formData.vehicleDetails.type)} onChange={handleDropdownChange} required />
            <DataInput label="Owner Name" name="vehicleDetails.ownerName" value={formData.vehicleDetails.ownerName} onChange={handleChange} required />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Driver Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DataInput label="Driver Name" name="driverDetails.name" value={formData.driverDetails.name} onChange={handleChange} required />
            <DataInput label="License Number" name="driverDetails.licenseNumber" value={formData.driverDetails.licenseNumber} onChange={handleChange} required />
            <DataInput label="Driver Phone" name="driverDetails.phoneNumber" value={formData.driverDetails.phoneNumber} onChange={handleChange} required />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DataInput label="Account Holder" name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleChange} />
            <DataInput label="Account Number" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange} />
            <DataInput label="IFSC Code" name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange} />
            <DataInput label="Bank Name" name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleChange} />
            <DataInput label="Branch Name" name="bankDetails.branchName" value={formData.bankDetails.branchName} onChange={handleChange} />
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Buttons type="submit" label="Register Transporter" variant="primary" />
        </div>
      </form>
    </AdminPageShell>
  );
};

export default AddTransporter;
