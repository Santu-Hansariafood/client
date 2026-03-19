import { useState } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaUserPlus } from "react-icons/fa";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    sex: "",
    password: "",
    status: "Active",
  });

  const sexOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    setFormData((prev) => ({
      ...prev,
      [actionMeta.name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation Before API Call
    if (!formData.name.trim()) {
      toast.error("Please enter a valid name.");
      return;
    }

    if (!regexPatterns.email.test(formData.email.trim().toLowerCase())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!regexPatterns.mobile.test(formData.mobile.trim())) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!formData.sex) {
      toast.error("Please select a gender (Sex)");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    // 2. Trim and Lowercase values
    const processedData = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
    };

    try {
      await api.post("/employees", processedData);
      toast.success("Employee registered successfully!");
      setFormData({
        name: "",
        email: "",
        mobile: "",
        sex: "",
        password: "",
        status: "Active",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register employee");
    }
  };

  return (
    <AdminPageShell title="Register Employee" icon={FaUserPlus}>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataInput label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
          <DataInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <DataInput label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} required />
          <DataDropdown 
            label="Sex" 
            name="sex" 
            options={sexOptions} 
            selectedOptions={sexOptions.find(o => o.value === formData.sex)} 
            onChange={handleDropdownChange} 
            required 
          />
          <DataInput label="Login Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          <DataDropdown 
            label="Status" 
            name="status" 
            options={statusOptions} 
            selectedOptions={statusOptions.find(o => o.value === formData.status)} 
            onChange={handleDropdownChange} 
            required 
          />
        </div>
        <div className="flex justify-end pt-4">
          <Buttons type="submit" label="Register Employee" variant="primary" />
        </div>
      </form>
    </AdminPageShell>
  );
};

export default AddEmployee;
