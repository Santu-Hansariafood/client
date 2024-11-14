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
            primary: "#3498db",
            primary50: "#67b6c7",
            danger: "#e74c3c",
            dangerLight: "#ffcad4",
          },
          spacing: {
            ...theme.spacing,
            controlHeight: 40,
          },
          borderRadius: 10,
          fontSize: 16,
        })}
        styles={{
          control: (provided) => ({
            ...provided,
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            borderColor: "#ccc",
            "&:hover": {
              borderColor: "#aaa",
            },
          }),
          option: (provided) => ({
            ...provided,
            backgroundColor: "#f9f9f9",
            color: "#333",
            "&:hover": {
              backgroundColor: "#f2f2f2",
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
