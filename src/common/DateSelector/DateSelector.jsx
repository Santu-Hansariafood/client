import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const PopperContainer = ({ children }) => {
  if (typeof document === "undefined") return children;
  return createPortal(children, document.body);
};

PopperContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const DateSelector = ({ selectedDate, onChange }) => {
  const [currentDate, setCurrentDate] = useState(
    selectedDate ? new Date(selectedDate) : null,
  );

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    } else {
      setCurrentDate(null);
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
    <div className="w-full max-w-md flex items-center gap-2 rounded-xl border border-[#e6dcc4] dark:border-lux-deep bg-lux-cream dark:bg-lux-night px-4 py-2 shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] transition-all duration-200 focus-within:ring-2 focus-within:ring-lux-gold/50 focus-within:border-lux-gold">
      <DatePicker
        selected={currentDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        placeholderText="Select a date"
        wrapperClassName="w-full flex-1"
        isClearable
        popperContainer={PopperContainer}
        popperClassName="z-[10050]"
        className="w-full px-3 py-2.5 bg-transparent text-lux-ink dark:text-lux-ivory placeholder-lux-muted dark:placeholder-lux-muted focus:outline-none"
      />

      <button
        type="button"
        onClick={handleIconClick}
        aria-label="Select today"
        className="shrink-0 p-2.5 rounded-xl bg-lux-emerald/10 hover:bg-lux-emerald/20 text-lux-emerald dark:text-lux-gold-soft transition-colors focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
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
