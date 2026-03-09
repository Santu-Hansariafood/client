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
  size = "md",
}) => {
  const sizeStyles =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "lg"
      ? "px-6 py-4 text-lg"
      : "px-5 py-3 text-base";

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
        className={`w-full ${sizeStyles} border rounded-2xl transition-all duration-200
          bg-white text-gray-900 border-gray-300
          shadow-sm focus:shadow-md
          focus:border-green-500 focus:ring-2 focus:ring-green-200
          hover:border-green-400
          placeholder-gray-400 tracking-wide
          ${disabled || readOnly ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : ""}
        `}
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
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

export default DataInput;
