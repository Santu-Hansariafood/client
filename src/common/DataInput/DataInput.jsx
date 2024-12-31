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
        className={`w-full px-4 py-2 border rounded-md 
          ${
            disabled || readOnly
              ? "bg-gray-200 cursor-not-allowed border-gray-200"
              : "bg-white border-blue-500 focus:border-blue-700"
          }
          text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md`}
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
