import PropTypes from "prop-types";

const Buttons = ({
  label,
  onClick = () => {},
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
}) => {
  const baseStyles = `rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200
    ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg active:scale-[0.98]"}`;

  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-md shadow-emerald-600/20",
    secondary:
      "bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md shadow-red-500/20",
    success:
      "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500",
    outline:
      "bg-white text-emerald-700 border-2 border-emerald-500 hover:bg-emerald-50 focus:ring-emerald-400",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} flex items-center justify-center gap-2`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </button>
  );
};

Buttons.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "danger",
    "success",
    "outline",
    "ghost",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  icon: PropTypes.element,
};

export default Buttons;
