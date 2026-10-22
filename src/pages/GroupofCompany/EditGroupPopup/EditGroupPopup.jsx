import { lazy, Suspense, useEffect, useState } from "react";
import PropTypes from "prop-types";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../common/Loading/Loading";

const EditGroupPopup = ({ isOpen, group, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    groupName: group?.groupName || "",
  });

  useEffect(() => {
    if (group) {
      setFormData({ groupName: group.groupName });
    }
  }, [group]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await api.put(`/groups/${group._id}`, formData);
      clearApiCache();
      onUpdate(response.data);
      toast.success("Group updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update group", error);
    }
  };

  if (!isOpen) return null;

  return (
    <Suspense fallback={<Loading />}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#062e25]/70 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4">
        <div className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] animate-modal-mobile sm:rounded-[2rem] md:animate-modal-desktop">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#ece4d2] bg-lux-cream/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <h3 className="font-serif text-base font-bold uppercase tracking-tight text-lux-ink sm:text-lg md:text-xl">
              Edit Group
            </h3>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lux-muted transition hover:bg-[#f2eee2] hover:text-lux-ink active:scale-90"
            >
              ✖
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 text-lux-muted sm:px-6 sm:py-6 md:px-8">
            <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-lux-muted">
              Edit Group Name
            </label>
            <DataInput
              name="groupName"
              placeholder="Enter Group Name"
              value={formData.groupName}
              onChange={handleChange}
            />

            <div className="mt-6 flex flex-col gap-3 border-t border-[#ece4d2] pt-4 sm:flex-row sm:justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

EditGroupPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  group: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditGroupPopup;
