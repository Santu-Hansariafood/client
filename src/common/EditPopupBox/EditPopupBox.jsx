import { useState } from 'react';
import PropTypes from 'prop-types';
import PopupBox from '../PopupBox/PopupBox';

const EditPopupBox = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <PopupBox
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Consignee: ${initialData.name}`}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-4">
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleFormChange}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone || ''}
            onChange={handleFormChange}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleFormChange}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>
        {/* Add other fields as needed */}
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </PopupBox>
  );
};

EditPopupBox.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditPopupBox;
