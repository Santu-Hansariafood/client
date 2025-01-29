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
    <div className="w-full max-w-md flex items-center border border-blue-500 rounded-md p-2 shadow-md bg-white">
      <DatePicker
        selected={currentDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        className="w-full px-2 py-1 text-gray-700 focus:outline-none"
        placeholderText="Select a date"
        calendarClassName="react-datepicker-left"
        wrapperClassName="w-full"
        isClearable
      />
      <button
        type="button"
        onClick={handleIconClick}
        className="ml-2 text-blue-500 hover:text-blue-700"
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
