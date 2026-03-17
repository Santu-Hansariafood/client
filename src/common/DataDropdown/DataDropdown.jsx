import Select from "react-select";
import PropTypes from "prop-types";

const DataDropdown = ({
  options,
  selectedOptions,
  onChange,
  placeholder,
  isMulti = false,
  label,
  required = false,
}) => {
  const formattedOptions = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <div className="mb-5 w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700 tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <Select
          options={formattedOptions}
          isMulti={isMulti}
          value={selectedOptions}
          onChange={onChange}
          placeholder={placeholder || "Select..."}
          className="react-select-container"
          classNamePrefix="react-select"
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: "#16a34a",
              primary25: "#dcfce7",
              primary50: "#bbf7d0",
              danger: "#dc2626",
              dangerLight: "#fee2e2",
              neutral0: "#ffffff",
              neutral10: "#f1f5f9",
              neutral20: "#e2e8f0",
              neutral30: "#94a3b8",
            },
            borderRadius: 16,
            spacing: {
              ...theme.spacing,
              controlHeight: 46,
              baseUnit: 6,
            },
          })}
          styles={{
            control: (provided, state) => ({
              ...provided,
              background: "#ffffff",
              borderColor: state.isFocused ? "#16a34a" : "#e2e8f0",
              boxShadow: state.isFocused
                ? "0 0 0 3px rgba(22,163,74,0.15)"
                : "0 3px 12px rgba(0,0,0,0.05)",
              borderRadius: "14px",
              transition: "all 0.25s ease",
              padding: "2px 4px",
              cursor: "pointer",
            }),

            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected
                ? "#16a34a"
                : state.isFocused
                  ? "#dcfce7"
                  : "#ffffff",
              color: state.isSelected ? "#ffffff" : "#1e293b",
              padding: "10px 14px",
              fontWeight: state.isSelected ? 600 : 500,
              transition: "all 0.2s ease",
              cursor: "pointer",
            }),

            menu: (provided) => ({
              ...provided,
              borderRadius: "14px",
              marginTop: "6px",
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
            }),

            placeholder: (provided) => ({
              ...provided,
              color: "#64748b",
              fontWeight: 500,
            }),

            multiValue: (provided) => ({
              ...provided,
              backgroundColor: "#dcfce7",
              borderRadius: "8px",
              padding: "2px 6px",
            }),

            multiValueLabel: (provided) => ({
              ...provided,
              color: "#15803d",
              fontWeight: 500,
            }),

            multiValueRemove: (provided) => ({
              ...provided,
              color: "#15803d",
              ":hover": {
                backgroundColor: "#bbf7d0",
                color: "#166534",
              },
            }),
          }}
        />
      </div>
    </div>
  );
};

DataDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedOptions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isMulti: PropTypes.bool,
  label: PropTypes.string,
  required: PropTypes.bool,
};

export default DataDropdown;
