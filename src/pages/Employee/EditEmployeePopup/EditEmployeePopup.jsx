import { useState, useEffect } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";
import FileUpload from "../../../common/FileUpload/FileUpload";

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

  const handleProfileImageChange = (url) => {
    setFormData((prev) => ({ ...prev, profileImage: url }));
  };

  const handleProfileImageRemove = () => {
    setFormData((prev) => ({ ...prev, profileImage: "" }));
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
      clearApiCache();
      toast.success("Employee updated successfully!");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update employee");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[#062e25]/70 backdrop-blur-sm animate-modal-backdrop p-0 sm:p-4">
      <div className="relative flex w-full max-w-2xl max-h-[94vh] flex-col overflow-y-auto rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ece4d2] bg-lux-cream/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">Edit Employee</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-lux-muted transition-all duration-300 hover:bg-[#f2eee2] hover:text-lux-ink"
          >
            ×
          </button>
        </div>

        {loading || !formData ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lux-emerald mx-auto mb-4"></div>
            <p className="text-lux-muted font-medium">Loading details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-6 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
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

            <FileUpload
              label="Profile Image"
              accept="image/*"
              onFileChange={handleProfileImageChange}
              onFileRemove={handleProfileImageRemove}
              currentUrl={formData.profileImage}
            />

            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-[#ece4d2]">
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
