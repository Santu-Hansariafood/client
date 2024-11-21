import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      const response = await axios.put(
        `http://localhost:5000/api/groups/${group._id}`,
        formData
      );
      onUpdate(response.data);
      toast.success("Group updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update group");
      console.error("Error updating group:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          &#x2715;
        </button>

        <h3 className="text-xl font-semibold mb-4">Edit Group</h3>
        <label className="block mb-2">
          Group Name
          <input
            type="text"
            name="groupName"
            value={formData.groupName}
            onChange={handleChange}
            className="block w-full mt-1 border rounded px-2 py-1"
          />
        </label>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

EditGroupPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  group: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditGroupPopup;
