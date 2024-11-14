import PropTypes from "prop-types";

const Buttons = ({
  label,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
}) => {
  const baseStyles = `rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} 
        flex items-center justify-center shadow-md 
        hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

Buttons.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "success"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  icon: PropTypes.element,
};

export default Buttons;
