import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const EditEmployeePopup = ({ employee, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee?._id) {
      fetchEmployeeDetails();
    }
  }, [isOpen, employee?._id]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/employees/${employee._id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error("Failed to fetch employee details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
    if (!formData.sex) {
      toast.error("Please select a gender (Sex)");
      return;
    }
    try {
      const { password, ...payload } = formData;
      const response = await api.put(`/employees/${employee._id}`, payload);
      toast.success("Employee updated successfully!");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update employee");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Edit Employee</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {loading || !formData ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8CC63F] mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <DataInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <DataInput
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
              />
              <DataDropdown
                label="Sex"
                name="sex"
                options={sexOptions}
                selectedOptions={sexOptions.find(
                  (o) => o.value === formData.sex,
                )}
                onChange={handleDropdownChange}
                required
              />
              <DataDropdown
                label="Status"
                name="status"
                options={statusOptions}
                selectedOptions={statusOptions.find(
                  (o) => o.value === formData.status,
                )}
                onChange={handleDropdownChange}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <Buttons
                type="button"
                label="Cancel"
                onClick={onClose}
                variant="secondary"
              />
              <Buttons
                type="submit"
                label="Update Employee"
                variant="primary"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditEmployeePopup;
