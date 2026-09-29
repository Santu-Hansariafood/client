import PropTypes from "prop-types";
import React, { useCallback, useRef, useState } from "react";
import { FaSpinner } from "react-icons/fa";

// eslint-disable-next-line react/display-name
const Buttons = React.memo(({
  label,
  onClick = () => {},
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  loading = false,
  fullWidth = false,
}) => {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const createRipple = useCallback((event) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const id = Date.now() + Math.random();

    const newRipple = { id, x, y, size };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const handleClick = useCallback((e) => {
    if (disabled || loading) return;
    createRipple(e);
    onClick(e);
  }, [onClick, disabled, loading, createRipple]);

  const baseStyles = `relative overflow-hidden rounded-2xl font-bold tracking-tight focus:outline-none transition-all duration-300 font-display select-none
    ${disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-xl active:scale-[0.97] hover:-translate-y-0.5"}
    ${fullWidth ? "w-full" : ""}`;

  const variants = {
    primary:
      "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 shadow-lg shadow-emerald-600/25",
    secondary:
      "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 shadow-md shadow-slate-600/20",
    danger:
      "bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white hover:from-red-600 hover:via-red-700 hover:to-rose-700 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 shadow-lg shadow-red-500/25",
    success:
      "bg-gradient-to-br from-teal-500 via-emerald-600 to-green-600 text-white hover:from-teal-600 hover:via-emerald-700 hover:to-green-700 focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 shadow-md shadow-teal-600/20",
    warning:
      "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white hover:from-amber-500 hover:via-orange-600 hover:to-amber-700 focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 shadow-md shadow-orange-500/25",
    outline:
      "bg-white text-emerald-700 border-2 border-emerald-500 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 hover:border-emerald-600",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-slate-300/50 focus:ring-offset-2",
    gradient:
      "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-[length:200%_200%] animate-gradient-shift text-white hover:shadow-2xl focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 shadow-xl shadow-cyan-500/20",
  };

  const sizes = {
    sm: "px-3.5 sm:px-4 py-2 text-xs sm:text-sm min-h-[38px] sm:min-h-[40px]",
    md: "px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base min-h-[46px] sm:min-h-[48px]",
    lg: "px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg min-h-[54px] sm:min-h-[56px]",
  };

  const iconSpin = loading ? "animate-spin-slow" : "";

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} flex items-center justify-center gap-2 sm:gap-2.5 ${variant === "gradient" ? "animate-gradient-shift" : ""}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {loading ? (
        <FaSpinner className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 ${iconSpin}`} />
      ) : (
        icon && <span className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconSpin}`}>{icon}</span>
      )}
      <span className="leading-tight whitespace-nowrap">{label}</span>
    </button>
  );
});

Buttons.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "danger",
    "success",
    "warning",
    "outline",
    "ghost",
    "gradient",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

export default Buttons;
