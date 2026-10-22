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

  const baseStyles = `relative overflow-hidden rounded-2xl font-bold tracking-tight focus:outline-none transition-all duration-300 font-serif select-none
    ${disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-xl active:scale-[0.97] hover:-translate-y-0.5"}
    ${fullWidth ? "w-full" : ""}`;

  const variants = {
    primary:
      "bg-gradient-to-br from-lux-emerald via-lux-emerald to-lux-deep text-lux-cream hover:from-lux-deep hover:to-lux-night focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 shadow-[0_10px_24px_-10px_rgba(6,95,70,0.5)]",
    secondary:
      "bg-gradient-to-br from-lux-ink via-lux-deep to-lux-night text-lux-cream hover:from-lux-night hover:to-lux-ink focus:ring-2 focus:ring-lux-gold/40 focus:ring-offset-2 shadow-md shadow-lux-night/25",
    danger:
      "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 shadow-lg shadow-red-500/25",
    success:
      "bg-gradient-to-br from-lux-emerald via-lux-emerald to-lux-deep text-lux-gold-soft hover:from-lux-deep hover:to-lux-night focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 shadow-md shadow-lux-emerald/25",
    warning:
      "bg-gradient-to-br from-lux-gold via-lux-gold to-[#a3873f] text-lux-cream hover:from-[#a3873f] hover:to-lux-gold focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 shadow-md shadow-lux-gold/25",
    outline:
      "bg-lux-cream text-lux-emerald border-2 border-lux-emerald hover:bg-lux-ivory focus:ring-2 focus:ring-lux-gold/40 focus:ring-offset-2 hover:border-lux-gold",
    ghost:
      "bg-transparent text-lux-muted hover:bg-[#f2eee2] focus:ring-2 focus:ring-lux-gold/40 focus:ring-offset-2",
    gradient:
      "bg-gradient-to-r from-lux-emerald via-lux-gold to-lux-emerald bg-[length:200%_200%] animate-gradient-shift text-lux-cream hover:shadow-2xl focus:ring-2 focus:ring-lux-gold/50 focus:ring-offset-2 shadow-xl shadow-lux-gold/20",
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
