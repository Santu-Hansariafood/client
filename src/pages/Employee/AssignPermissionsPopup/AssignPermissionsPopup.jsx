import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaShieldAlt, FaCheckSquare, FaSquare, FaSave, FaTimes } from "react-icons/fa";
import dashboardData from "../../../data/dashboardData.json";
import PopupBox from "../../../common/PopupBox/PopupBox";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

const AssignPermissionsPopup = ({ employee, isOpen, onClose, onUpdate }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee && employee.allowedPermissions) {
      setSelectedPermissions(employee.allowedPermissions);
    } else {
      setSelectedPermissions([]);
    }
  }, [employee, isOpen]);

  const togglePermission = (permissionLink) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionLink)
        ? prev.filter((p) => p !== permissionLink)
        : [...prev, permissionLink]
    );
  };

  const toggleSection = (section) => {
    const sectionLinks = section.actions.map(a => a.link);
    const allSelected = sectionLinks.every(link => selectedPermissions.includes(link));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(link => !sectionLinks.includes(link)));
    } else {
      setSelectedPermissions(prev => {
        const newOnes = sectionLinks.filter(link => !prev.includes(link));
        return [...prev, ...newOnes];
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/employees/${employee._id}`, {
        allowedPermissions: selectedPermissions
      });
      clearApiCache();
      toast.success("Permissions updated successfully");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <PopupBox
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Permissions: ${employee.name}`}
      maxWidth="max-w-4xl"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
            <FaShieldAlt />
          </div>
          <div>
            <p className="lux-eyebrow">Access Control</p>
            <h3 className="font-serif text-sm font-bold text-lux-ink">Select components this employee can access</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {dashboardData.sections.map((section, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl border border-[#ece4d2] shadow-sm transition-shadow hover:shadow-md">
              <div 
                className="flex items-center justify-between gap-2 border-b border-[#ece4d2] bg-lux-ivory p-4 cursor-pointer group"
                onClick={() => toggleSection(section)}
              >
                <h4 className="font-serif text-xs font-black uppercase tracking-widest text-lux-ink">{section.section}</h4>
                <div className="text-lux-muted transition-colors group-hover:text-lux-emerald">
                  {section.actions.map(a => a.link).every(link => selectedPermissions.includes(link)) ? (
                    <FaCheckSquare className="text-lux-emerald" />
                  ) : (
                    <FaSquare />
                  )}
                </div>
              </div>
              <div className="p-2 space-y-1">
                {section.actions.map((action, actionIdx) => (
                  <div 
                    key={actionIdx}
                    onClick={() => togglePermission(action.link)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      selectedPermissions.includes(action.link)
                        ? "bg-lux-ivory font-bold text-lux-emerald"
                        : "text-lux-muted hover:bg-lux-ivory"
                    }`}
                  >
                    <span className="text-xs">{action.name}</span>
                    {selectedPermissions.includes(action.link) ? (
                      <FaCheckSquare className="text-lux-emerald" />
                    ) : (
                      <FaSquare className="text-[#e4dbc6]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Saving..." : <><FaSave /> Save Permissions</>}
          </button>
        </div>
      </div>
    </PopupBox>
  );
};

AssignPermissionsPopup.propTypes = {
  employee: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default AssignPermissionsPopup;
