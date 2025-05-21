import Select from "react-select";
import PropTypes from "prop-types";

const DataDropdown = ({
  options,
  selectedOptions,
  onChange,
  placeholder,
  isMulti = false,
}) => {
  const formattedOptions = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <div className="w-full max-w-md relative">
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
            primary: "#2563eb",
            primary25: "#e0e7ff",
            primary50: "#93c5fd",
            danger: "#e11d48",
            dangerLight: "#fee2e2",
            neutral0: "#f8fafc",
            neutral10: "#e0e7ef",
            neutral20: "#cbd5e1",
            neutral30: "#94a3b8",
          },
          spacing: {
            ...theme.spacing,
            controlHeight: 44,
            baseUnit: 6,
          },
          borderRadius: 14,
          fontSize: 16,
        })}
        styles={{
          control: (provided, state) => ({
            ...provided,
            background: "rgba(255,255,255,0.85)",
            borderColor: state.isFocused ? "#2563eb" : "#cbd5e1",
            boxShadow: state.isFocused ? "0 0 0 2px #2563eb33" : "0 2px 8px rgba(0,0,0,0.06)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            minHeight: 44,
            fontWeight: 500,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
              ? "#2563eb"
              : state.isFocused
              ? "#e0e7ff"
              : "#f8fafc",
            color: state.isSelected ? "#fff" : "#1e293b",
            fontWeight: state.isSelected ? 600 : 400,
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s",
          }),
          menu: (provided) => ({
            ...provided,
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.98)",
            marginTop: 6,
          }),
          multiValue: (provided) => ({
            ...provided,
            backgroundColor: "#e0e7ff",
            borderRadius: 8,
            padding: "2px 6px",
          }),
          multiValueLabel: (provided) => ({
            ...provided,
            color: "#2563eb",
            fontWeight: 500,
          }),
          multiValueRemove: (provided) => ({
            ...provided,
            color: "#e11d48",
            ':hover': {
              backgroundColor: "#fee2e2",
              color: "#be123c",
            },
          }),
        }}
      />
    </div>
  );
};

DataDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedOptions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isMulti: PropTypes.bool,
};

export default DataDropdown;
