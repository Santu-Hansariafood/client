import React, { useState } from 'react';
import DataInput from '../../common/DataInput/DataInput';

const QuantityPricing = ({ handleChange }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    pendingQuantity: '',
    rate: '',
    gst: '',
    cd: '',
    weight: '',
  });

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    // Trigger the external handler
    if (handleChange) {
      handleChange(field, value);
    }
  };

  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Quantity and Pricing
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Quantity', field: 'quantity', placeholder: 'Quantity' },
          {
            label: 'Pending Quantity',
            field: 'pendingQuantity',
            placeholder: 'Pending Quantity',
          },
          { label: 'Rate (in tons)', field: 'rate', placeholder: 'Rate (in tons)' },
          { label: 'GST (%)', field: 'gst', placeholder: 'GST' },
          { label: 'CD (%)', field: 'cd', placeholder: 'CD (%)' },
          { label: 'Weight', field: 'weight', placeholder: 'Weight' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm text-gray-600 mb-1">{label}</label>
            <DataInput
              placeholder={placeholder}
              inputType="number"
              value={formData[field]} // Controlled input value
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuantityPricing;
