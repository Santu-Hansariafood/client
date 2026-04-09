import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const DateSelector = ({ selectedDate, onChange }) => {
  const [currentDate, setCurrentDate] = useState(
    selectedDate ? new Date(selectedDate) : null,
  );

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
    <div className="w-full max-w-md flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-500">
      <DatePicker
        selected={currentDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        placeholderText="Select a date"
        wrapperClassName="w-full flex-1"
        isClearable
        className="w-full px-3 py-2.5 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
      />

      <button
        type="button"
        onClick={handleIconClick}
        aria-label="Select today"
        className="shrink-0 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
      >
        <FaCalendarAlt size={18} />
      </button>
    </div>
  );
};

DateSelector.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]),
  onChange: PropTypes.func.isRequired,
};

export default DateSelector;
