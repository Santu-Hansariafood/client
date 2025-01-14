import PropTypes from "prop-types";

const DataInput = ({
  placeholder = "",
  minLength = "",
  maxLength = "",
  inputType = "text",
  value = "",
  onChange,
  name,
  onFocus,
  onBlur,
  required = false,
  disabled = false,
  readOnly = false,
}) => {
  return (
    <div className="mb-4">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full px-4 py-2 border rounded-md transition-all
          ${
            disabled || readOnly
              ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300"
              : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          }
          placeholder-gray-400 shadow-sm focus:shadow-md`}
      />
    </div>
  );
};

DataInput.propTypes = {
  placeholder: PropTypes.string,
  minLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxLength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inputType: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default DataInput;
