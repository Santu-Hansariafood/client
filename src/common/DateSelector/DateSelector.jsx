import PropTypes from "prop-types";
import { useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateSelector = ({ selectedDate, onChange }) => {
  useEffect(() => {
    if (!selectedDate) {
      onChange(new Date());
    }
  }, [selectedDate, onChange]);

  return (
    <div className="w-full max-w-md flex items-center border border-blue-500 rounded-md p-2 shadow-md bg-white">
      <DatePicker
        selected={selectedDate || new Date()}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        className="w-full px-2 py-1 text-gray-700 focus:outline-none"
        placeholderText="Select a date"
        calendarClassName="react-datepicker-left"
        wrapperClassName="w-full"
      />
    </div>
  );
};

DateSelector.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
};

export default DateSelector;
