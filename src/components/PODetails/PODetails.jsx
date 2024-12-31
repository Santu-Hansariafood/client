import React from 'react';
import DataInput from '../../common/DataInput/DataInput'; 
import DateSelector from '../../common/DateSelector/DateSelector';

const PODetails = ({ handleChange, formData }) => {
  return (
    <div>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Purchase Order Details
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            PO Number
          </label>
          <DataInput
            placeholder="PO Number"
            onChange={(e) => handleChange("poNumber", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">PO Date</label>
          <DateSelector
            selectedDate={formData.poDate}
            onChange={(date) => handleChange("poDate", date)}
          />
        </div>
      </div>
    </div>
  );
};

export default PODetails;
