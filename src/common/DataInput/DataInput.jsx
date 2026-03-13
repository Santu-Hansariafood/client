import PropTypes from "prop-types";

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
}) => {
  const sizeStyles =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "lg"
        ? "px-6 py-4 text-lg"
        : "px-5 py-3 text-base";

  return (
    <div className="mb-5 w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700 tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors duration-200" />
        )}

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
          className={`
          w-full ${sizeStyles}
          ${Icon ? "pl-12" : ""}
          rounded-xl border
          bg-white/80 backdrop-blur
          text-gray-800
          border-gray-300
          shadow-sm
          transition-all duration-200
          placeholder-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-green-200
          focus:border-green-500
          hover:border-green-400
          ${error ? "border-red-400 focus:ring-red-200 focus:border-red-500" : ""}
          ${
            disabled || readOnly
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
              : ""
          }
        `}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1 tracking-wide">{error}</p>
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
  value: PropTypes.string,
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
};

export default DataInput;
