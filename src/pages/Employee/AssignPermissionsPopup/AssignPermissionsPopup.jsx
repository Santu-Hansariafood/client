import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaShieldAlt, FaCheckSquare, FaSquare, FaSave, FaTimes } from "react-icons/fa";
import dashboardData from "../../../data/dashboardData.json";
import PopupBox from "../../../common/PopupBox/PopupBox";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";

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
        <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
            <FaShieldAlt />
          </div>
          <div>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Access Control</p>
            <h3 className="text-sm font-bold text-slate-800">Select components this employee can access</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {dashboardData.sections.map((section, idx) => (
            <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div 
                className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection(section)}
              >
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">{section.section}</h4>
                <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                  {section.actions.map(a => a.link).every(link => selectedPermissions.includes(link)) ? (
                    <FaCheckSquare className="text-blue-600" />
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
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="text-xs">{action.name}</span>
                    {selectedPermissions.includes(action.link) ? (
                      <FaCheckSquare className="text-blue-600" />
                    ) : (
                      <FaSquare className="text-slate-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
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
