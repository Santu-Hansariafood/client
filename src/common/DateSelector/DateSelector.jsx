import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const DateSelector = ({ selectedDate, onChange }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  const handleDateChange = (date) => {
    setCurrentDate(date);
    onChange(date);
  };

  const handleIconClick = () => {
    const today = new Date();
    setCurrentDate(today);
    onChange(today);
  };

  return (
    <div className="w-full max-w-md flex items-center bg-white/80 border border-blue-300 rounded-xl p-3 shadow-lg backdrop-blur-md">
      <DatePicker
        selected={currentDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        className="w-full px-3 py-2 text-gray-700 rounded-lg bg-white/70 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 shadow-sm"
        placeholderText="Select a date"
        calendarClassName="react-datepicker-left"
        wrapperClassName="w-full"
        isClearable
      />
      <button
        type="button"
        onClick={handleIconClick}
        className="ml-3 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-800 shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Select current date"
      >
        <FaCalendarAlt size={20} />
      </button>
    </div>
  );
};

DateSelector.propTypes = {
  selectedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func.isRequired,
};

export default DateSelector;
