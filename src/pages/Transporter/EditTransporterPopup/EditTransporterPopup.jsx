import { useState, useEffect } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
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
      const { password, ...payload } = formData;
      const response = await api.put(
        `/transporters/${transporter._id}`,
        payload,
      );
      clearApiCache();
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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ece4d2] bg-lux-cream/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <h2 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">Edit Transporter</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-lux-muted transition hover:bg-[#f2eee2] hover:text-lux-ink active:scale-90"
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 space-y-8">
            <section>
              <h3 className="mb-4 border-b border-[#ece4d2] pb-2 font-serif text-lg font-semibold text-lux-ink">
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
              <h3 className="mb-4 border-b border-[#ece4d2] pb-2 font-serif text-lg font-semibold text-lux-ink">
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
              <h3 className="mb-4 border-b border-[#ece4d2] pb-2 font-serif text-lg font-semibold text-lux-ink">
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
              <h3 className="mb-4 border-b border-[#ece4d2] pb-2 font-serif text-lg font-semibold text-lux-ink">
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

            <div className="flex flex-col gap-3 border-t border-[#ece4d2] pt-4 sm:flex-row sm:justify-end">
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
