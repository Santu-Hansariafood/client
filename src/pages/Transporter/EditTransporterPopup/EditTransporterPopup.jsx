import { useState, useEffect } from "react";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import DataInput from "../../../common/DataInput/DataInput";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const EditTransporterPopup = ({ transporter, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transporter?._id) {
      fetchTransporterDetails();
    }
  }, [isOpen, transporter?._id]);

  const fetchTransporterDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transporters/${transporter._id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error("Failed to fetch transporter details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (selectedOption, actionMeta) => {
    const { name } = actionMeta;
    const value = selectedOption ? selectedOption.value : "";
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `/transporters/${transporter._id}`,
        formData,
      );
      toast.success("Transporter updated successfully!");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update transporter",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Edit Transporter</h2>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataInput
                  label="Transporter Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <DataInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <DataInput
                  label="Mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
                <DataInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
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
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataInput
                  label="Vehicle Number"
                  name="vehicleDetails.number"
                  value={formData.vehicleDetails?.number}
                  onChange={handleChange}
                  required
                />
                <DataDropdown
                  label="Vehicle Type"
                  name="vehicleDetails.type"
                  options={vehicleTypeOptions}
                  selectedOptions={vehicleTypeOptions.find(
                    (o) => o.value === formData.vehicleDetails?.type,
                  )}
                  onChange={handleDropdownChange}
                  required
                />
                <DataInput
                  label="Owner Name"
                  name="vehicleDetails.ownerName"
                  value={formData.vehicleDetails?.ownerName}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Driver Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataInput
                  label="Driver Name"
                  name="driverDetails.name"
                  value={formData.driverDetails?.name}
                  onChange={handleChange}
                  required
                />
                <DataInput
                  label="License Number"
                  name="driverDetails.licenseNumber"
                  value={formData.driverDetails?.licenseNumber}
                  onChange={handleChange}
                  required
                />
                <DataInput
                  label="Driver Phone"
                  name="driverDetails.phoneNumber"
                  value={formData.driverDetails?.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DataInput
                  label="Account Holder"
                  name="bankDetails.accountHolderName"
                  value={formData.bankDetails?.accountHolderName}
                  onChange={handleChange}
                />
                <DataInput
                  label="Account Number"
                  name="bankDetails.accountNumber"
                  value={formData.bankDetails?.accountNumber}
                  onChange={handleChange}
                />
                <DataInput
                  label="IFSC Code"
                  name="bankDetails.ifscCode"
                  value={formData.bankDetails?.ifscCode}
                  onChange={handleChange}
                />
                <DataInput
                  label="Bank Name"
                  name="bankDetails.bankName"
                  value={formData.bankDetails?.bankName}
                  onChange={handleChange}
                />
                <DataInput
                  label="Branch Name"
                  name="bankDetails.branchName"
                  value={formData.bankDetails?.branchName}
                  onChange={handleChange}
                />
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <Buttons
                type="button"
                label="Cancel"
                onClick={onClose}
                variant="secondary"
              />
              <Buttons
                type="submit"
                label="Update Transporter"
                variant="primary"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTransporterPopup;
