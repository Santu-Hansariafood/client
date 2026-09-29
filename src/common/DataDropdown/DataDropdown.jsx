import Select from "react-select";
import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

// eslint-disable-next-line react/display-name
const DataDropdown = React.memo(({
  options = [],
  selectedOptions,
  onChange,
  placeholder,
  isMulti = false,
  isClearable = false,
  isDisabled = false,
  label,
  required = false,
  name,
  disableSorting = false,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const formattedOptions = useMemo(() => {
    const safeOptions = Array.isArray(options) ? options : [];
    return safeOptions
      .map((option) => ({
        ...option,
        value: option?.value || option?._id || option,
        label: option?.label || option?.name || option?.groupName || option,
      }))
      .sort((a, b) => {
        if (disableSorting) return 0;
        return String(a.label || "").localeCompare(String(b.label || ""));
      });
  }, [options, disableSorting]);

  const selectedValue = useMemo(() => {
    return isMulti
      ? Array.isArray(selectedOptions)
        ? selectedOptions
            .map((so) =>
              formattedOptions.find((fo) => fo.value === (so?.value ?? so)),
            )
            .filter(Boolean)
        : [selectedOptions]
            .filter(Boolean)
            .map((so) =>
              formattedOptions.find((fo) => fo.value === (so?.value ?? so)),
            )
            .filter(Boolean)
      : Array.isArray(selectedOptions)
        ? formattedOptions.find(
            (fo) =>
              fo.value === (selectedOptions[0]?.value ?? selectedOptions[0]),
          )
        : typeof selectedOptions === "string" ||
            typeof selectedOptions === "number"
          ? formattedOptions.find((fo) => fo.value === selectedOptions)
          : formattedOptions.find(
              (fo) => fo.value === (selectedOptions?.value ?? selectedOptions),
            );
  }, [isMulti, selectedOptions, formattedOptions]);

  const hasSelection = isMulti
    ? Array.isArray(selectedValue) && selectedValue.length > 0
    : !!selectedValue;

  return (
    <div className="mb-4 sm:mb-5 w-full animate-fade-in group">
      {label && (
        <label className={`
          block mb-2 transition-all duration-300
          ${isFocused || hasSelection ? "text-emerald-600" : "text-slate-500"}
          text-xs font-bold uppercase tracking-widest font-display
        `}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={`
            absolute -inset-px rounded-2xl transition-all duration-400 ease-out pointer-events-none opacity-0 blur-sm
            ${isFocused && !disabled ? "opacity-100 bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-teal-400/30" : ""}
          `}
        />

        <Select
          name={name}
          options={formattedOptions}
          isMulti={isMulti}
          isClearable={isClearable}
          isDisabled={isDisabled || disabled}
          value={selectedValue}
          onChange={onChange}
          placeholder={placeholder || "Select..."}
          isSearchable
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="react-select-container"
          classNamePrefix="react-select"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: "#059669",
              primary25: "#ecfdf5",
              primary50: "#d1fae5",
              danger: "#dc2626",
              dangerLight: "#fee2e2",
              neutral0: "#ffffff",
              neutral10: "#f8fafc",
              neutral20: "#f1f5f9",
              neutral30: "#94a3b8",
            },
            borderRadius: 16,
            spacing: {
              ...theme.spacing,
              controlHeight: 52,
              baseUnit: 6,
            },
          })}
          components={{
            DropdownIndicator: () => (
              <div className={`pr-1 transition-transform duration-300 ${isFocused ? "rotate-180" : "rotate-0"}`}>
                <FaChevronDown className={`text-sm transition-colors duration-300 ${isFocused ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
            ),
          }}
          styles={{
            control: (provided, state) => ({
              ...provided,
              background: "#ffffff",
              borderColor: state.isFocused ? "#059669" : "#e2e8f0",
              borderWidth: "2px",
              boxShadow: state.isFocused
                ? "0 0 0 4px rgba(5,150,105,0.12)"
                : "none",
              borderRadius: "16px",
              transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
              padding: "2px 10px",
              cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              letterSpacing: "-0.01em",
              minHeight: "52px",
              opacity: disabled ? 0.6 : 1,
              "&:hover": {
                borderColor: state.isFocused ? "#059669" : "#cbd5e1",
              },
            }),

            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected
                ? "#16a34a"
                : state.isFocused
                  ? "#dcfce7"
                  : "#ffffff",
              color: state.isSelected ? "#ffffff" : "#1e293b",
              padding: "12px 16px",
              fontWeight: state.isSelected ? 700 : 500,
              transition: "all 0.2s ease",
              cursor: "pointer",
              fontSize: "14px",
              transform: state.isFocused && !state.isSelected ? "translateX(4px)" : "translateX(0)",
            }),

            menu: (provided) => ({
              ...provided,
              borderRadius: "16px",
              marginTop: "8px",
              overflow: "hidden",
              boxShadow: "0 16px 40px -8px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
              zIndex: 9999,
              padding: "4px",
            }),
            menuPortal: (provided) => ({
              ...provided,
              zIndex: 99999,
            }),

            menuList: (provided) => ({
              ...provided,
              padding: "4px",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f8fafc",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e1",
                borderRadius: "3px",
              },
              maxHeight: isMulti ? "280px" : "320px",
            }),

            placeholder: (provided) => ({
              ...provided,
              color: "#94a3b8",
              fontWeight: 500,
              fontSize: "14px",
            }),

            singleValue: (provided) => ({
              ...provided,
              color: "#1e293b",
              fontWeight: 600,
              fontSize: "14px",
            }),

            multiValue: (provided) => ({
              ...provided,
              backgroundColor: "#dcfce7",
              borderRadius: "10px",
              padding: "3px 8px",
              margin: "3px 4px 3px 0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }),

            multiValueLabel: (provided) => ({
              ...provided,
              color: "#15803d",
              fontWeight: 600,
              fontSize: "13px",
              padding: "0 4px 0 2px",
            }),

            multiValueRemove: (provided) => ({
              ...provided,
              color: "#15803d",
              borderRadius: "6px",
              padding: "2px 4px",
              marginLeft: "2px",
              transition: "all 0.15s ease",
              ":hover": {
                backgroundColor: "#86efac",
                color: "#166534",
                transform: "scale(1.15)",
              },
            }),

            clearIndicator: (provided) => ({
              ...provided,
              color: "#94a3b8",
              padding: "6px",
              borderRadius: "8px",
              transition: "all 0.15s ease",
              ":hover": {
                color: "#dc2626",
                backgroundColor: "#fee2e2",
              },
            }),

            indicatorSeparator: () => ({
              display: "none",
            }),

            groupHeading: (provided) => ({
              ...provided,
              color: "#059669",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "10px 14px 6px",
            }),

            noOptionsMessage: (provided) => ({
              ...provided,
              color: "#94a3b8",
              padding: "20px",
              fontSize: "14px",
              textAlign: "center",
            }),
          }}
        />

        <div
          className={`
            absolute inset-x-4 sm:inset-x-5 bottom-0 h-0.5 rounded-full
            transition-all duration-400 ease-out origin-left pointer-events-none
            ${isFocused && !disabled ? "scale-x-100 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-gradient-border" : "scale-x-0 bg-transparent"}
          `}
        />
      </div>
    </div>
  );
});

DataDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  selectedOptions: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isMulti: PropTypes.bool,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
  required: PropTypes.bool,
  name: PropTypes.string,
  disableSorting: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default DataDropdown;
