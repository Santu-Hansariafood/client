import PropTypes from "prop-types";
import { useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";

const DataInput = ({
  label,
  placeholder = "",
  minLength,
  maxLength,
  inputType = "text",
  value = "",
  onChange,
  name,
  onFocus,
  onBlur,
  required = false,
  disabled = false,
  readOnly = false,
  size = "md",
  error,
  icon: Icon,
  floatingLabel = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isActive = isFocused || hasValue;

  const sizeStyles =
    size === "sm"
      ? "px-3.5 sm:px-4 py-2.5 sm:py-2.5 text-sm min-h-[42px] sm:min-h-[44px]"
      : size === "lg"
        ? "px-6 sm:px-7 py-4 sm:py-4.5 text-lg min-h-[56px] sm:min-h-[60px]"
        : "px-4.5 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base min-h-[48px] sm:min-h-[52px]";

  const iconPadding = Icon ? "pl-11 sm:pl-12" : "";

  return (
    <div className="mb-4 sm:mb-5 w-full animate-fade-in group">
      {label && !floatingLabel && (
        <label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest font-display">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className={`relative ${error ? "animate-shake" : ""}`}>
        <div
          className={`
            absolute -inset-px rounded-2xl transition-all duration-400 ease-out pointer-events-none opacity-0 blur-sm
            ${isFocused && !error && !disabled ? "opacity-100 bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-teal-400/30" : ""}
            ${error && !disabled ? "opacity-100 bg-gradient-to-r from-red-400/30 via-rose-400/30 to-orange-400/30" : ""}
          `}
        />

        {Icon && (
          <div className={`
            absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 z-10
            transition-all duration-300 ease-out
            ${error ? "text-red-500" : isFocused ? "text-emerald-600 scale-110" : "text-slate-400 group-hover:text-slate-500"}
            ${floatingLabel && label && isActive ? "-translate-y-[calc(50%-8px)] sm:-translate-y-[calc(50%-9px)] scale-90" : ""}
          `}>
            <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </div>
        )}

        {floatingLabel && label && (
          <label
            className={`
              absolute z-10 pointer-events-none
              font-bold uppercase tracking-widest font-display whitespace-nowrap
              transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
              bg-white px-1 rounded
              ${Icon ? "left-10 sm:left-11" : "left-4 sm:left-5"}
              top-0 -translate-y-0
              text-[10px] sm:text-xs
              ${isActive
                ? `text-emerald-600 ${error ? "!text-red-500" : ""}`
                : "text-slate-500"
              }
              ${!hasValue && !isFocused ? `
                top-1/2 -translate-y-1/2
                text-sm sm:text-base normal-case tracking-normal font-semibold text-slate-400
                px-0 bg-transparent
                ${Icon ? "left-10 sm:left-11" : "left-4 sm:left-5"}
              ` : ""}
              ${error && isActive ? "!text-red-500" : ""}
            `}
          >
            {label} {required && <span className={isActive ? "text-red-500" : "text-red-400"}>*</span>}
          </label>
        )}

        <input
          type={inputType}
          placeholder={floatingLabel && label ? " " : placeholder}
          value={value}
          name={name}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete="off"
          onWheel={(e) => e.target.blur()}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            peer relative w-full ${iconPadding || (floatingLabel && label ? "px-4 sm:px-5 pt-5 sm:pt-5.5 pb-2.5 sm:pb-3" : "px-4 sm:px-5 py-3 sm:py-3.5")}
            ${sizeStyles}
            bg-white rounded-2xl outline-none
            transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
            font-semibold tracking-tight text-slate-800
            placeholder:text-transparent sm:placeholder:text-slate-400
            border-2
            ${error
              ? "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
              : disabled
                ? "border-slate-200"
                : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            }
            ${disabled ? "bg-slate-50 cursor-not-allowed opacity-60 select-none" : readOnly ? "bg-slate-50/70 cursor-default" : "cursor-text"}
            ${readOnly ? "text-slate-600" : ""}
          `}
        />

        {error && (
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 animate-pop-in">
            <FaExclamationCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-red-500 animate-pulse" />
          </div>
        )}

        <div
          className={`
            absolute inset-x-4 sm:inset-x-5 bottom-0 h-0.5 rounded-full
            transition-all duration-400 ease-out origin-left
            ${isFocused && !error && !disabled ? "scale-x-100 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient-border" : "scale-x-0 bg-transparent"}
          `}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2 animate-slide-up">
          <FaExclamationCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <p className="text-red-500 text-[11px] sm:text-xs font-semibold tracking-wide">{error}</p>
        </div>
      )}
    </div>
  );
};

DataInput.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  minLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inputType: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  name: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  error: PropTypes.string,
  icon: PropTypes.elementType,
  floatingLabel: PropTypes.bool,
};

export default DataInput;
